package cn.xiaobei.vocabulary;

import android.os.Bundle;
import android.view.View;
import androidx.activity.OnBackPressedCallback;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MobileVaultPlugin.class);
        registerPlugin(DeviceSpeechPlugin.class);
        super.onCreate(savedInstanceState);

        // API 35 draws edge-to-edge. Give the WebView actual system/cutout insets,
        // including landscape, rather than relying on WebView's safe-area support.
        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return windowInsets;
        });
        ViewCompat.requestApplyInsets(content);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (bridge == null || bridge.getWebView() == null) {
                    finish();
                    return;
                }
                // A SPA consumes this synchronously with preventDefault() to close
                // a dialog or pop its page stack. No handler: use WebView history.
                bridge.eval("(function(){var e=new Event('xiaobei:back',{cancelable:true});"
                    + "window.dispatchEvent(e);return e.defaultPrevented;})()", handled -> {
                    if ("true".equals(handled)) return;
                    if (bridge.getWebView().canGoBack()) bridge.getWebView().goBack();
                    else finish();
                });
            }
        });
    }
}
