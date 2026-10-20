package cn.xiaobei.vocabulary;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;
import android.util.Base64;

@CapacitorPlugin(name = "MobileVault")
public class MobileVaultPlugin extends Plugin {
    private VaultStore store;

    @Override
    public void load() {
        store = new VaultStore(getContext());
    }

    private String validKey(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty() || key.length() > 128) {
            call.reject("A storage key of 1–128 characters is required", "INVALID_KEY");
            return null;
        }
        return key;
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = validKey(call);
        if (key == null) return;
        try {
            String value = store.get(key);
            JSObject result = new JSObject();
            result.put("value", value == null ? JSONObject.NULL : value);
            call.resolve(result);
        } catch (Exception ignored) {
            call.reject("Unable to read local storage; fully close and restart the app, preserving its data", "VAULT_READ_FAILED");
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = validKey(call);
        if (key == null) return;
        String value = call.getString("value");
        if (value == null || value.length() > 65536) {
            call.reject("A string value of at most 65536 characters is required", "INVALID_VALUE");
            return;
        }
        try {
            store.set(key, value);
            call.resolve();
        } catch (Exception ignored) {
            call.reject("Unable to save encrypted local configuration", "VAULT_WRITE_FAILED");
        }
    }

    @PluginMethod
    public void writeSnapshot(PluginCall call) {
        String slot = call.getString("slot");
        String data = call.getString("data");
        if ((!"a".equals(slot) && !"b".equals(slot)) || data == null) {
            call.reject("A valid snapshot slot and base64 SQLite image are required", "INVALID_SNAPSHOT");
            return;
        }
        try {
            store.writeSnapshot(slot, Base64.decode(data, Base64.NO_WRAP));
            call.resolve();
        } catch (Exception ignored) {
            call.reject("Unable to save learning data; fully close and restart the app, preserving its data", "SNAPSHOT_WRITE_FAILED");
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = validKey(call);
        if (key == null) return;
        try {
            store.remove(key);
            call.resolve();
        } catch (Exception ignored) {
            call.reject("Unable to clear local configuration", "VAULT_REMOVE_FAILED");
        }
    }
}
