import { useEffect, useCallback, useState } from 'react';
import { NativeModules, NativeEventEmitter } from 'react-native';
import type { DownloadProgress, DownloadEvent } from '../types/download';

const { DownloadModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(DownloadModule);

export const useDownloadManager = () => {
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
        bytesDownloaded: 0,
        totalBytes: 0,
        progress: 0,
        speed: 0,
        timeRemaining: 0
    });

    const [isDownloading, setIsDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const subscriptions = [
            eventEmitter.addListener('downloadProgress', (event: DownloadEvent) => {
                if (event.type === 'progress' && event.progress) {
                    setDownloadProgress(event.progress);
                } else if (event.type === 'complete') {
                    setIsDownloading(false);
                    setDownloadProgress(prev => ({ ...prev, progress: 100 }));
                } else if (event.type === 'error') {
                    setError(event.error || 'Unknown error occurred');
                    setIsDownloading(false);
                }
            })
        ];

        return () => {
            subscriptions.forEach(subscription => subscription.remove());
        };
    }, []);

    const startDownload = useCallback(() => {
        try {
            setError(null);
            setIsDownloading(true);
            DownloadModule.startBackgroundDownload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start download');
            setIsDownloading(false);
        }
    }, []);

    const stopDownload = useCallback(() => {
        try {
            DownloadModule.stopBackgroundDownload();
            setIsDownloading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop download');
        }
    }, []);

    const resetDownload = useCallback(() => {
        setDownloadProgress({
            bytesDownloaded: 0,
            totalBytes: 0,
            progress: 0,
            speed: 0,
            timeRemaining: 0
        });
        setError(null);
        setIsDownloading(false);
    }, []);

    return {
        downloadProgress,
        isDownloading,
        error,
        startDownload,
        stopDownload,
        resetDownload
    };
}; 