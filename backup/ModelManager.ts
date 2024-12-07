import RNFetchBlob from 'react-native-blob-util';
import { MODEL_CONFIG, DOWNLOAD_CONFIG } from './config/modelConfig';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();

export class ModelManager {
    private static instance: ModelManager;
    private downloadTask: any = null;

    private constructor() {}

    static getInstance(): ModelManager {
        if (!ModelManager.instance) {
            ModelManager.instance = new ModelManager();
        }
        return ModelManager.instance;
    }

    async checkModelExists(): Promise<boolean> {
        try {
            return await RNFetchBlob.fs.exists(MODEL_CONFIG.storagePath + MODEL_CONFIG.name);
        } catch (error) {
            console.error('Error checking model existence:', error);
            return false;
        }
    }

    async checkStorageSpace(): Promise<boolean> {
        try {
            const free = await RNFetchBlob.fs.df();
            return typeof free.free === 'number' && free.free > DOWNLOAD_CONFIG.minStorageRequired;
        } catch (error) {
            console.error('Error checking storage space:', error);
            return false;
        }
    }

    async downloadModel(
        onProgress?: (received: number, total: number) => void,
        onComplete?: () => void,
        onError?: (error: any) => void
    ): Promise<void> {
        try {
            if (!await this.checkStorageSpace()) {
                throw new Error('Insufficient storage space');
            }

            await RNFetchBlob.fs.mkdir(MODEL_CONFIG.storagePath);

            this.downloadTask = RNFetchBlob.config({
                ...DOWNLOAD_CONFIG.downloadOptions,
                Progress: { count: 10, interval: 250 },
            }).fetch('GET', MODEL_CONFIG.url, {}, (received: number, total: number) => {
                onProgress?.(received, total);
            });

            const response = await this.downloadTask;
            if (response.info().status === 200) {
                storage.set('modelDownloaded', true);
                onComplete?.();
            } else {
                throw new Error('Download failed');
            }
        } catch (error) {
            console.error('Error downloading model:', error);
            onError?.(error);
        }
    }

    cancelDownload(): void {
        if (this.downloadTask) {
            this.downloadTask.cancel((error: any) => {
                console.log('Download cancelled', error);
            });
        }
    }

    async deleteModel(): Promise<void> {
        try {
            const exists = await this.checkModelExists();
            if (exists) {
                await RNFetchBlob.fs.unlink(MODEL_CONFIG.storagePath + MODEL_CONFIG.name);
                storage.delete('modelDownloaded');
            }
        } catch (error) {
            console.error('Error deleting model:', error);
            throw error;
        }
    }
}
