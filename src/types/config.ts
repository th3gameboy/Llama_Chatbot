export interface ModelConfig {
  name: string;
  url: string;
  size: number;
  storagePath: string;
  systemPrompt: string;
}

export interface ModelMetadata {
  hash: string;
  lastVerified: string;
  size: number;
}

export interface NetworkConfig {
  maxRetries: number;
  retryDelay: number; // in milliseconds
  timeout: number; // in milliseconds
}

export interface DownloadState {
  bytesDownloaded: number;
  totalBytes: number;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
  lastAttempt?: string;
  resumePosition?: number;
}

export interface ConnectionQuality {
  isConnected: boolean;
  isWifi: boolean;
  speed: number | null; // in bytes per second
  isMetered: boolean;
  strength: number | null; // 0-1 for wifi strength
}

export interface DownloadConfig {
  minStorageRequired: number;
  downloadOptions: {
    fileCache: boolean;
    path: string;
    addAndroidDownloads: {
      useDownloadManager: boolean;
      notification: boolean;
      title: string;
      description: string;
      mime: string;
    };
  };
} 