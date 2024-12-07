export interface ModelConfig {
  name: string;
  url: string;
  size: number;
  storagePath: string;
  systemPrompt: string;
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