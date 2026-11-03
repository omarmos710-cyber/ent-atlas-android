package com.omar.entatlas;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.window.OnBackInvokedDispatcher;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.core.content.FileProvider;
import androidx.webkit.WebViewAssetLoader;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";
    private static final int REQ_PICK = 1, REQ_SAVE = 2;

    private WebView web;
    private String lastUrl = START;   // last page shown, to come back to if the renderer is killed
    private ValueCallback<Uri[]> pickCallback;
    private String pendingBackup;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        createWebView(state);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::handleBack);
        }
    }

    private void createWebView(Bundle state) {
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setTextZoom(100);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }

            @Override
            public void doUpdateVisitedHistory(WebView v, String url, boolean isReload) {
                if (url != null && url.startsWith("https://" + HOST)) lastUrl = url;
            }

            /* Android can kill the page's renderer to free memory. Without this the whole app closes;
               with it we build a fresh WebView and reopen the page the user was on. */
            @Override
            public boolean onRenderProcessGone(WebView v, RenderProcessGoneDetail detail) {
                if (v != web) return true;
                String back = lastUrl;
                web = null;
                v.destroy();
                createWebView(null);
                web.loadUrl(back);
                return true;
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (pickCallback != null) pickCallback.onReceiveValue(null);
                pickCallback = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Choose your ENT Atlas backup"), REQ_PICK);
                } catch (ActivityNotFoundException e) {
                    pickCallback = null;
                    return false;
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "Android");
        if (state != null) web.restoreState(state); else web.loadUrl(START);
    }

    private long lastBack = 0;

    /* Ask the page what Back should do: close the image/panel, go to the previous page, or exit. */
    private void handleBack() {
        if (web == null) return;
        long now = System.currentTimeMillis();
        if (now - lastBack < 120) return;   // ignore a duplicate delivery of the same press
        lastBack = now;
        web.evaluateJavascript("(function(){try{return typeof androidBack==='function'?androidBack():(history.length>1?(history.back(),1):0)}catch(e){return 0}})()", value -> {
            if (!"1".equals(value) && !"\"1\"".equals(value)) finish();
        });
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && Build.VERSION.SDK_INT < 33) { handleBack(); return true; }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        handleBack();
    }

    private void toast(String msg) {
        runOnUiThread(() -> { if (web != null) web.evaluateJavascript(
                "typeof toast==='function'&&toast(" + org.json.JSONObject.quote(msg) + ")", null); });
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_PICK) {
            Uri[] result = null;
            if (res == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
            if (pickCallback != null) pickCallback.onReceiveValue(result);
            pickCallback = null;
        } else if (req == REQ_SAVE) {
            if (res == RESULT_OK && data != null && data.getData() != null && pendingBackup != null) {
                try (OutputStream os = getContentResolver().openOutputStream(data.getData(), "wt")) {
                    os.write(pendingBackup.getBytes(StandardCharsets.UTF_8));
                    toast("Backup saved");
                } catch (Exception e) {
                    toast("Couldn't save the backup");
                }
            }
            pendingBackup = null;
        }
    }

    private class Bridge {
        @JavascriptInterface
        public void openPdf(String id, String name) {
            if (!id.matches("[a-z0-9_-]+")) return;
            try {
                File dir = new File(getCacheDir(), "shared");
                dir.mkdirs();
                String safe = name.replaceAll("[^\\w ,.()-]", "");
                File out = new File(dir, safe.endsWith(".pdf") ? safe : safe + ".pdf");
                try (InputStream in = getAssets().open("www/pdf/" + id + ".pdf");
                     OutputStream os = new FileOutputStream(out)) {
                    byte[] buf = new byte[65536];
                    int n;
                    while ((n = in.read(buf)) > 0) os.write(buf, 0, n);
                }
                Uri uri = FileProvider.getUriForFile(MainActivity.this, "com.omar.entatlas.files", out);
                Intent view = new Intent(Intent.ACTION_VIEW);
                view.setDataAndType(uri, "application/pdf");
                view.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("application/pdf");
                send.putExtra(Intent.EXTRA_STREAM, uri);
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                runOnUiThread(() -> {
                    try {
                        startActivity(view);
                    } catch (ActivityNotFoundException e) {
                        startActivity(Intent.createChooser(send, "Open or save the PDF"));
                    }
                });
            } catch (Exception e) {
                toast("Couldn't open the PDF");
            }
        }

        @JavascriptInterface
        public void saveBackup(String name, String json) {
            pendingBackup = json;
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("application/json");
            i.putExtra(Intent.EXTRA_TITLE, name);
            runOnUiThread(() -> {
                try {
                    startActivityForResult(i, REQ_SAVE);
                } catch (ActivityNotFoundException e) {
                    toast("No app available to save files");
                }
            });
        }
    }
}
