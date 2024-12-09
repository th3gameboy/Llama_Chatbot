package com.llamachatbotapp.download;

import android.content.Intent;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

public class DownloadModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private static final String MODULE_NAME = "DownloadModule";
    private static final String EVENT_NAME = "downloadProgress";

    public DownloadModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built-in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built-in Event Emitter
    }

    @ReactMethod
    public void startBackgroundDownload() {
        Intent serviceIntent = new Intent(reactContext, DownloadService.class);
        reactContext.startService(serviceIntent);
    }

    @ReactMethod
    public void stopBackgroundDownload() {
        Intent serviceIntent = new Intent(reactContext, DownloadService.class);
        reactContext.stopService(serviceIntent);
    }

    @ReactMethod
    public void updateProgress(int progress) {
        Intent intent = new Intent("DOWNLOAD_PROGRESS_UPDATE");
        intent.putExtra("progress", progress);
        reactContext.sendBroadcast(intent);
    }

    private void sendEvent(String eventName, int progress) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, progress);
    }
} 