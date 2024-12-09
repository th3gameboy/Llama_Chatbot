package com.llamachatbotapp.crypto;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class CryptoModule extends ReactContextBaseJavaModule {
    private static final int BUFFER_SIZE = 8 * 1024 * 1024; // 8MB buffer

    public CryptoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "CryptoModule";
    }

    @ReactMethod
    public void calculateSHA256(String filePath, Promise promise) {
        try {
            File file = new File(filePath);
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            FileInputStream fis = new FileInputStream(file);
            byte[] buffer = new byte[BUFFER_SIZE];
            int bytesRead;

            while ((bytesRead = fis.read(buffer)) != -1) {
                digest.update(buffer, 0, bytesRead);
            }

            fis.close();
            byte[] hash = digest.digest();
            promise.resolve(bytesToHex(hash));
        } catch (NoSuchAlgorithmException e) {
            promise.reject("CRYPTO_ERROR", "SHA-256 algorithm not available", e);
        } catch (IOException e) {
            promise.reject("FILE_ERROR", "Error reading file: " + e.getMessage(), e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
} 