declare module 'react-native' {
    interface NativeModulesStatic {
        DownloadModule: {
            /**
             * Starts the background download service
             */
            startBackgroundDownload(): void;

            /**
             * Stops the background download service
             */
            stopBackgroundDownload(): void;

            /**
             * Updates the download progress in the notification
             * @param progress Progress percentage (0-100)
             */
            updateProgress(progress: number): void;

            /**
             * Required for NativeEventEmitter
             */
            addListener(eventName: string): void;

            /**
             * Required for NativeEventEmitter
             */
            removeListeners(count: number): void;
        };
    }
}

export interface DownloadProgress {
    /**
     * Number of bytes downloaded
     */
    bytesDownloaded: number;

    /**
     * Total size in bytes
     */
    totalBytes: number;

    /**
     * Download progress percentage (0-100)
     */
    progress: number;

    /**
     * Current download speed in bytes per second
     */
    speed: number;

    /**
     * Estimated time remaining in seconds
     */
    timeRemaining: number;
}

export type DownloadEventType = 
    | 'progress'
    | 'complete'
    | 'error'
    | 'pause'
    | 'resume';

export interface DownloadEvent {
    type: DownloadEventType;
    progress?: DownloadProgress;
    error?: string;
} 