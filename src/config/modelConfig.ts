import RNFetchBlob from 'react-native-blob-util';
import type { ModelConfig, DownloadConfig } from '../types/config';

// Constants for storage calculations
const GB_IN_BYTES = 1024 * 1024 * 1024;
const STORAGE_BUFFER_MULTIPLIER = 1.2;  // 20% extra space for working memory

export const MODEL_CONFIG: ModelConfig = {
  name: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
  url: 'https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-Q4_K_M-GGUF/resolve/main/model.gguf',
  size: 3.21 * GB_IN_BYTES,  // 3.21GB in bytes
  storagePath: RNFetchBlob.fs.dirs.DocumentDir + '/models/',
  systemPrompt: 'You are a helpful assistant capable of solving problems, providing instructions, and performing mathematical calculations.',
};

export const MODEL_INIT_CONFIG = {
  contextSize: 2048,
  gpu: false,
};

export const DOWNLOAD_CONFIG: DownloadConfig = {
  minStorageRequired: MODEL_CONFIG.size * STORAGE_BUFFER_MULTIPLIER,
  downloadOptions: {
    fileCache: true,
    path: MODEL_CONFIG.storagePath + MODEL_CONFIG.name,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      title: 'Downloading LLM Model',
      description: 'Downloading language model...',
      mime: 'application/octet-stream',
    },
  },
}; 