package com.example.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Allow WebView to fire intent:// and rawbt:// URIs to external apps
        this.bridge.getWebView().setWebViewClient(new WebViewClient() {

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                return handleCustomScheme(url);
            }

            // Also cover older Android API (below API 21) via the deprecated override
            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleCustomScheme(url);
            }

            private boolean handleCustomScheme(String url) {
                if (url.startsWith("intent:") || url.startsWith("rawbt:")) {
                    try {
                        Intent intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME);
                        startActivity(intent);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    return true; // we handled it — don't let WebView try to load it
                }
                return false; // normal URL — let WebView handle it
            }
        });
    }
}