package cn.xiaobei.vocabulary;

import static org.junit.Assert.*;
import android.content.Context;
import android.content.SharedPreferences;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class VaultStoreTest {
    private String preferenceName;
    private String alias;
    private Context context;
    private VaultStore store;
    private SharedPreferences preferences;
    private File directory;

    private VaultStore newStore() {
        return injected(SharedPreferences.Editor::commit, VaultStore::durableWrite);
    }
    private VaultStore injected(VaultStore.Committer commit, VaultStore.SnapshotWriter writer) {
        return new VaultStore(context, preferenceName, alias, directory, commit, writer);
    }
    private File slot(String slot) { return new File(directory, "learning-" + slot + ".db"); }
    private byte[] image(String content) { return ("SQLite format 3\000" + content).getBytes(StandardCharsets.UTF_8); }
    private byte[] fileBytes(File file) throws IOException {
        try (FileInputStream in = new FileInputStream(file); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int count;
            while ((count = in.read(buffer)) != -1) out.write(buffer, 0, count);
            return out.toByteArray();
        }
    }
    private interface Operation { void run() throws Exception; }
    private void expectUnavailable(Operation operation) throws Exception {
        try { operation.run(); fail("Uncertain storage must fail closed"); }
        catch (IOException expected) { }
    }
    private void assertProcessSealed() throws Exception {
        // Recreate both the plugin's store and its dependencies. No reset method
        // exists: the namespace is statically poisoned until actual process death.
        VaultStore recreated = newStore();
        expectUnavailable(() -> recreated.get("profiles-v1"));
        expectUnavailable(() -> recreated.get(VaultStore.LEARNING_POINTER));
        expectUnavailable(() -> recreated.set("profiles-v1", "must-not-save"));
        expectUnavailable(() -> recreated.remove("profiles-v1"));
        expectUnavailable(() -> recreated.writeSnapshot("a", image("must-not-overwrite")));
    }

    @Before public void before() throws Exception {
        context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        // Each failure test has an independent namespace; production has exactly
        // one namespace. Tests cannot unpoison a production namespace.
        String unique = UUID.randomUUID().toString();
        preferenceName = "mobile_vault_test_" + unique;
        alias = "cn.xiaobei.vocabulary.test.vault." + unique;
        preferences = context.getSharedPreferences(preferenceName, Context.MODE_PRIVATE);
        directory = new File(context.getFilesDir(), "vault-test-" + unique);
        assertTrue(directory.mkdir());
        store = newStore();
    }

    @After public void clean() throws Exception {
        if (preferences != null) preferences.edit().clear().commit();
        KeyStore keys = KeyStore.getInstance("AndroidKeyStore");
        keys.load(null);
        if (keys.containsAlias(alias)) keys.deleteEntry(alias);
        if (directory != null) {
            File[] files = directory.listFiles();
            if (files != null) for (File file : files) assertTrue(file.delete());
            assertTrue(directory.delete());
        }
    }

    @Test public void encryptedValueSurvivesReopenAndRemoval() throws Exception {
        assertNull(store.get("ai"));
        String value = "instrumentation-fixture-无实际凭据";
        store.set("ai", value);
        String ciphertext = preferences.getString("ai", "");
        assertTrue(ciphertext.startsWith("v1."));
        assertFalse(ciphertext.contains(value));
        assertEquals(value, newStore().get("ai"));
        store.set("ai", value);
        assertNotEquals(ciphertext, preferences.getString("ai", ""));
        store.remove("ai");
        assertNull(newStore().get("ai"));
    }

    @Test public void copiedCiphertextCannotBeReadUnderDifferentKey() throws Exception {
        store.set("original", "fixture");
        preferences.edit().putString("other", preferences.getString("original", "")).commit();
        try { store.get("other"); fail("GCM must authenticate the storage key"); }
        catch (java.security.GeneralSecurityException expected) { }
        assertEquals("fixture", store.get("original"));
    }

    @Test public void corruptProfileFailsWithoutResettingAndCanBeExplicitlyRemoved() throws Exception {
        preferences.edit().putString("ai", "v1.invalid.corrupt").commit();
        try { store.get("ai"); fail("Corrupt data must not silently become empty"); }
        catch (Exception expected) { }
        assertEquals("v1.invalid.corrupt", preferences.getString("ai", ""));
        store.remove("ai");
        assertNull(store.get("ai"));
    }

    @Test public void snapshotIsDurableBeforePointerAndCommittedSlotCannotBeOverwritten() throws Exception {
        assertNull(store.get(VaultStore.LEARNING_POINTER));
        boolean[] durable = {false};
        VaultStore checked = injected(editor -> {
            assertTrue("Pointer must follow completed file/directory sync", durable[0]);
            return editor.commit();
        }, (file, bytes) -> { VaultStore.durableWrite(file, bytes); durable[0] = true; });
        checked.writeSnapshot("a", image("confirmed-a"));
        assertEquals("a", newStore().get(VaultStore.LEARNING_POINTER));
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
        try { store.writeSnapshot("a", image("bad-overwrite")); fail("Active slot must be immutable"); }
        catch (IllegalArgumentException expected) { }
        store.writeSnapshot("b", image("confirmed-b"));
        assertEquals("b", newStore().get(VaultStore.LEARNING_POINTER));
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
        assertArrayEquals(image("confirmed-b"), fileBytes(slot("b")));
    }

    @Test public void pointerCommitFalseAfterMemoryMutationSealsEveryRecreatedStore() throws Exception {
        store.writeSnapshot("a", image("confirmed-a"));
        String committed = preferences.getString(VaultStore.LEARNING_POINTER, null);
        VaultStore failCommit = injected(editor -> {
            // Android mutates its map before reporting commit(false). Let the
            // real editor mutate, then inject that failure outcome deterministically.
            assertTrue(editor.commit());
            return false;
        }, VaultStore::durableWrite);
        expectUnavailable(() -> failCommit.writeSnapshot("b", image("unconfirmed-b")));
        assertNotEquals(committed, preferences.getString(VaultStore.LEARNING_POINTER, null));
        assertProcessSealed();
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
    }

    @Test public void profileCommitFalseAlsoSealsEveryStore() throws Exception {
        VaultStore failed = injected(editor -> { assertTrue(editor.commit()); return false; }, VaultStore::durableWrite);
        expectUnavailable(() -> failed.set("profiles-v1", "unconfirmed"));
        assertNotNull(preferences.getString("profiles-v1", null));
        assertProcessSealed();
    }

    @Test public void removeCommitFalseAlsoSealsEveryStore() throws Exception {
        store.set("profiles-v1", "confirmed");
        VaultStore failed = injected(editor -> { assertTrue(editor.commit()); return false; }, VaultStore::durableWrite);
        expectUnavailable(() -> failed.remove("profiles-v1"));
        assertNull(preferences.getString("profiles-v1", null));
        assertProcessSealed();
    }

    @Test public void partialSnapshotWriteNeverChangesPointerOrConfirmedFile() throws Exception {
        store.writeSnapshot("a", image("confirmed-a"));
        String committed = preferences.getString(VaultStore.LEARNING_POINTER, null);
        VaultStore failWrite = injected(SharedPreferences.Editor::commit, (file, bytes) -> {
            try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes, 0, 16); }
            throw new IOException("Injected partial write");
        });
        expectUnavailable(() -> failWrite.writeSnapshot("b", image("unconfirmed-b")));
        assertEquals(committed, preferences.getString(VaultStore.LEARNING_POINTER, null));
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
        assertProcessSealed();
    }

    @Test public void syncFailureNeverChangesPointer() throws Exception {
        store.writeSnapshot("a", image("confirmed-a"));
        String committed = preferences.getString(VaultStore.LEARNING_POINTER, null);
        VaultStore failSync = injected(SharedPreferences.Editor::commit, (file, bytes) -> {
            VaultStore.durableWrite(file, bytes);
            throw new IOException("Injected failed sync acknowledgement");
        });
        expectUnavailable(() -> failSync.writeSnapshot("b", image("unconfirmed-b")));
        assertEquals(committed, preferences.getString(VaultStore.LEARNING_POINTER, null));
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
        assertProcessSealed();
    }

    @Test public void missingPointerWithSnapshotFailsClosedInsteadOfTreatingAsFreshInstall() throws Exception {
        store.writeSnapshot("a", image("confirmed-a"));
        // Simulate the empty map Android returns after XML corruption/missing XML.
        assertTrue(preferences.edit().clear().commit());
        expectUnavailable(() -> newStore().get(VaultStore.LEARNING_POINTER));
        assertProcessSealed();
        assertArrayEquals(image("confirmed-a"), fileBytes(slot("a")));
    }

    @Test public void missingCommittedFileFailsClosed() throws Exception {
        store.writeSnapshot("a", image("confirmed-a"));
        assertTrue(slot("a").delete());
        expectUnavailable(() -> newStore().get(VaultStore.LEARNING_POINTER));
        assertProcessSealed();
    }

    @Test public void learningPointerCannotBeMutatedThroughGenericVaultMethods() throws Exception {
        try { store.set(VaultStore.LEARNING_POINTER, "a"); fail("Generic set must not bypass fsync"); }
        catch (IllegalArgumentException expected) { }
        try { store.remove(VaultStore.LEARNING_POINTER); fail("Learning pointer must not be removed"); }
        catch (IllegalArgumentException expected) { }
        assertNull(store.get(VaultStore.LEARNING_POINTER));
        assertEquals(0, directory.listFiles().length);
    }
}
