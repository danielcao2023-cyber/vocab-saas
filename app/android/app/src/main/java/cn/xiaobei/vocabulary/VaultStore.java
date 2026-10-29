package cn.xiaobei.vocabulary;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.system.Os;
import android.system.OsConstants;
import android.util.Base64;
import java.io.File;
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.RandomAccessFile;
import java.nio.channels.FileLock;
import java.security.MessageDigest;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyStore;
import java.util.HashSet;
import java.util.Set;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/** Encrypted app-private storage. No plaintext fallback or automatic reset on failure. */
final class VaultStore {
    static final String LEARNING_POINTER = "learning-slot-v1";
    private static final Object PROCESS_LOCK = new Object();
    // SharedPreferences updates its in-memory map even if commit() fails. Never
    // trust that process's map again after an uncertain disk write. The static
    // state survives Activity/plugin/WebView recreation; only process death clears it.
    private static final Set<String> POISONED = new HashSet<>();
    private final String namespace;
    private final SharedPreferences preferences;
    private final String alias;
    private final File snapshotDirectory;
    private final Committer committer;
    private final SnapshotWriter snapshotWriter;

    interface Committer { boolean commit(SharedPreferences.Editor editor) throws Exception; }
    interface SnapshotWriter { void write(File target, byte[] bytes) throws Exception; }

    VaultStore(Context context) {
        this(context, "mobile_vault", "cn.xiaobei.vocabulary.mobile_vault.v1");
    }

    VaultStore(Context context, String preferenceName, String alias) {
        this(context, preferenceName, alias, context.getFilesDir(), SharedPreferences.Editor::commit, VaultStore::durableWrite);
    }

    // Package-private dependency injection exercises actual Keystore/preferences
    // plus deterministic write failures, without touching a release installation.
    VaultStore(Context context, String preferenceName, String alias, File directory,
               Committer committer, SnapshotWriter writer) {
        this.namespace = context.getPackageName() + ":" + preferenceName;
        this.preferences = context.getSharedPreferences(preferenceName, Context.MODE_PRIVATE);
        this.alias = alias;
        this.snapshotDirectory = directory;
        this.committer = committer;
        this.snapshotWriter = writer;
    }

    private void requireHealthy() throws IOException {
        if (POISONED.contains(namespace)) {
            throw new IOException("Local storage is unavailable until the application process restarts");
        }
    }

    private IOException poison(Exception cause) {
        POISONED.add(namespace);
        return new IOException("Local storage write or learning index failed; preserve application data", cause);
    }

    private SecretKey secretKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(alias)) return (SecretKey) store.getKey(alias, null);
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(alias,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setKeySize(256)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setRandomizedEncryptionRequired(true)
            .build());
        return generator.generateKey();
    }

    private String decrypt(String key) throws Exception {
        String encoded = preferences.getString(key, null);
        if (encoded == null) return null;
        String[] parts = encoded.split("\\.", -1);
        if (parts.length != 3 || !"v1".equals(parts[0])) throw new GeneralSecurityException("Invalid vault record");
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(128, Base64.decode(parts[1], Base64.NO_WRAP)));
        cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
        return new String(cipher.doFinal(Base64.decode(parts[2], Base64.NO_WRAP)), StandardCharsets.UTF_8);
    }

    private File snapshot(String slot) { return new File(snapshotDirectory, "learning-" + slot + ".db"); }

    private String learningPointer() throws Exception {
        try {
            String value = decrypt(LEARNING_POINTER);
            if (value == null) {
                // Corrupt/missing preferences XML can appear as an empty map.
                // Existing snapshots prove this is not a fresh installation.
                if (snapshot("a").exists() || snapshot("b").exists() || new File(snapshotDirectory,"learning-pre-v3.db").exists() || new File(snapshotDirectory,"learning-pre-dictation-variant-v1.db").exists()) throw new IOException("Missing learning index");
            } else if ((!"a".equals(value) && !"b".equals(value)) || !snapshot(value).isFile()) {
                throw new IOException("Invalid learning index or missing snapshot");
            }
            return value;
        } catch (Exception error) {
            throw poison(error);
        }
    }

    String get(String key) throws Exception {
        synchronized (PROCESS_LOCK) {
            requireHealthy();
            return LEARNING_POINTER.equals(key) ? learningPointer() : decrypt(key);
        }
    }

    private void putEncrypted(String key, String value) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, secretKey());
        cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
        byte[] encrypted = cipher.doFinal(value.getBytes(StandardCharsets.UTF_8));
        String encoded = "v1." + Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP)
            + "." + Base64.encodeToString(encrypted, Base64.NO_WRAP);
        if (!committer.commit(preferences.edit().putString(key, encoded))) throw new IOException("Vault write failed");
    }

    void set(String key, String value) throws Exception {
        synchronized (PROCESS_LOCK) {
            requireHealthy();
            if (LEARNING_POINTER.equals(key) || ("learning-pre-v3".equals(key)||key.startsWith("learning-pre-vocabulary-")||key.startsWith("learning-pre-dictation-variant-"))) throw new IllegalArgumentException("Use writeSnapshot for the learning index");
            try { putEncrypted(key, value); } catch (Exception error) { throw poison(error); }
        }
    }

    void remove(String key) throws Exception {
        synchronized (PROCESS_LOCK) {
            requireHealthy();
            if (LEARNING_POINTER.equals(key) || ("learning-pre-v3".equals(key)||key.startsWith("learning-pre-vocabulary-")||key.startsWith("learning-pre-dictation-variant-"))) throw new IllegalArgumentException("The learning index cannot be removed");
            try {
                if (!committer.commit(preferences.edit().remove(key))) throw new IOException("Vault removal failed");
            } catch (Exception error) { throw poison(error); }
        }
    }

    void writeSnapshot(String slot, byte[] bytes) throws Exception {
        synchronized (PROCESS_LOCK) {
            requireHealthy();
            if (!"a".equals(slot) && !"b".equals(slot)) throw new IllegalArgumentException("Invalid snapshot slot");
            byte[] header = "SQLite format 3\000".getBytes(StandardCharsets.US_ASCII);
            if (bytes == null || bytes.length < header.length) throw new IllegalArgumentException("Invalid SQLite image");
            for (int i = 0; i < header.length; i++) {
                if (bytes[i] != header[i]) throw new IllegalArgumentException("Invalid SQLite image");
            }
            String current = learningPointer();
            if (slot.equals(current)) throw new IllegalArgumentException("Cannot overwrite the committed snapshot");
            try {
                // Crash before pointer commit: old slot remains untouched. Crash
                // after commit: the newly selected file and directory are fsynced.
                snapshotWriter.write(snapshot(slot), bytes);
                putEncrypted(LEARNING_POINTER, slot);
            } catch (Exception error) { throw poison(error); }
        }
    }


    private static byte[] digest(File file) throws Exception {
        MessageDigest sha=MessageDigest.getInstance("SHA-256");
        try(FileInputStream in=new FileInputStream(file)){byte[] buffer=new byte[8192];int count;while((count=in.read(buffer))!=-1)sha.update(buffer,0,count);}
        return sha.digest();
    }
    /** Fixed, app-private recovery point. A file lock and atomic rename publish it once. */
    void createMigrationBackup(int version, byte[] bytes) throws Exception {
        if(version!=3)throw new IllegalArgumentException("Unsupported backup version");
        createBackup("learning-pre-v3",bytes);
    }
    void createVocabularyBackup(int version, byte[] bytes) throws Exception {
        if(version<1||version>999)throw new IllegalArgumentException("Unsupported vocabulary version");
        createBackup("learning-pre-vocabulary-"+version,bytes);
    }
    void createDictationVariantBackup(byte[] bytes) throws Exception {
        createBackup("learning-pre-dictation-variant-v1", bytes);
    }
    private void createBackup(String name, byte[] bytes) throws Exception {
        synchronized(PROCESS_LOCK){
            requireHealthy();
            byte[] header="SQLite format 3\000".getBytes(StandardCharsets.US_ASCII);
            if(bytes==null||bytes.length<header.length)throw new IllegalArgumentException("Invalid SQLite image");
            for(int i=0;i<header.length;i++)if(bytes[i]!=header[i])throw new IllegalArgumentException("Invalid SQLite image");
            File target=new File(snapshotDirectory,name+".db");
            byte[] expected=MessageDigest.getInstance("SHA-256").digest(bytes);
            File temporary=new File(snapshotDirectory,name+".tmp");
            try(RandomAccessFile lockFile=new RandomAccessFile(new File(snapshotDirectory,name+".lock"),"rw");
                FileLock held=lockFile.getChannel().lock()){
                if(!held.isValid())throw new IOException("Backup lock unavailable");
            if(target.exists()){
                if(target.length()!=bytes.length||!MessageDigest.isEqual(expected,digest(target)))throw new IOException("Conflicting migration backup; existing backup preserved");
                return;
            }
                snapshotWriter.write(temporary,bytes);
                if(temporary.length()!=bytes.length||!MessageDigest.isEqual(expected,digest(temporary)))throw new IOException("Backup readback failed");
                // All writers use this fixed lock; existing targets were verified above.
                Os.rename(temporary.getAbsolutePath(),target.getAbsolutePath());
                FileDescriptor parent=Os.open(snapshotDirectory.getAbsolutePath(),OsConstants.O_RDONLY,0);
                try{Os.fsync(parent);}finally{Os.close(parent);}
                if(target.length()!=bytes.length||!MessageDigest.isEqual(expected,digest(target)))throw new IOException("Published backup verification failed");
            }catch(Exception error){temporary.delete();throw poison(error);}
        }
    }

    static void durableWrite(File target, byte[] bytes) throws Exception {
        try (FileOutputStream out = new FileOutputStream(target, false)) {
            out.write(bytes);
            out.flush();
            out.getFD().sync();
        }
        FileDescriptor directory = Os.open(target.getParentFile().getAbsolutePath(), OsConstants.O_RDONLY, 0);
        try { Os.fsync(directory); } finally { Os.close(directory); }
    }
}
