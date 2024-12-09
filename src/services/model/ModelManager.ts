import RNFetchBlob from 'react-native-blob-util';
import { MODEL_CONFIG, DOWNLOAD_CONFIG } from '../../config/modelConfig';
import { MMKV } from 'react-native-mmkv';
import { CryptoService } from '../crypto/CryptoService';
import { NetworkService } from '../network/NetworkService';
import type { ModelMetadata, DownloadState } from '../../types/config';

const storage = new MMKV();
const METADATA_KEY = 'modelMetadata';
const DOWNLOAD_STATE_KEY = 'downloadState';

export class ModelManager {
    private static instance: ModelManager;
    private downloadTask: any = null;
    private cryptoService: CryptoService;
    private networkService: NetworkService;
    private downloadState: DownloadState;

    private constructor() {
        this.cryptoService = CryptoService.getInstance();
        this.networkService = NetworkService.getInstance();
        this.downloadState = this.loadDownloadState();
    }

    private loadDownloadState(): DownloadState {
        const savedState = storage.getString(DOWNLOAD_STATE_KEY);
        return savedState ? JSON.parse(savedState) : {
            bytesDownloaded: 0,
            totalBytes: 0,
            status: 'idle'
        };
    }

    private saveDownloadState(state: Partial<DownloadState>): void {
        this.downloadState = { ...this.downloadState, ...state };
        storage.set(DOWNLOAD_STATE_KEY, JSON.stringify(this.downloadState));
    }

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

    private async getStoredMetadata(): Promise<ModelMetadata | null> {
        const metadata = storage.getString(METADATA_KEY);
        return metadata ? JSON.parse(metadata) : null;
    }

    private async storeMetadata(metadata: ModelMetadata): Promise<void> {
        storage.set(METADATA_KEY, JSON.stringify(metadata));
    }

    private async verifyFileHash(filePath: string): Promise<boolean> {
        try {
            const currentHash = await this.cryptoService.calculateSHA256(filePath);
            const metadata = await this.getStoredMetadata();

            if (!metadata) {
                // First download: store the hash
                const stats = await RNFetchBlob.fs.stat(filePath);
                await this.storeMetadata({
                    hash: currentHash,
                    lastVerified: new Date().toISOString(),
                    size: stats.size
                });
                return true;
            }

            // Subsequent downloads: verify against stored hash
            return currentHash === metadata.hash;
        } catch (error) {
            console.error('Error verifying file hash:', error);
            return false;
        }
    }

    async getDownloadState(): Promise<DownloadState> {
        return this.downloadState;
    }

    private async getResumePosition(): Promise<number> {
        try {
            const tmpPath = MODEL_CONFIG.storagePath + MODEL_CONFIG.name + '.tmp';
            if (await RNFetchBlob.fs.exists(tmpPath)) {
                const stats = await RNFetchBlob.fs.stat(tmpPath);
                return stats.size;
            }
        } catch (error) {
            console.error('Error getting resume position:', error);
        }
        return 0;
    }

    async downloadModel(
        onProgress?: (received: number, total: number) => void,
        onComplete?: () => void,
        onError?: (error: any) => void,
        retryCount: number = 0
    ): Promise<void> {
        try {
            if (!await this.checkStorageSpace()) {
                throw new Error('Insufficient storage space');
            }

            if (!await this.networkService.checkConnectivity()) {
                throw new Error('No network connection');
            }

            await RNFetchBlob.fs.mkdir(MODEL_CONFIG.storagePath);
            const filePath = MODEL_CONFIG.storagePath + MODEL_CONFIG.name;
            const tmpPath = filePath + '.tmp';
            
            // Get resume position if file exists
            const resumePosition = await this.getResumePosition();
            const headers: { [key: string]: string } = {};
            
            if (resumePosition > 0) {
                headers['Range'] = `bytes=${resumePosition}-`;
                this.saveDownloadState({
                    status: 'downloading',
                    bytesDownloaded: resumePosition,
                    resumePosition
                });
            } else {
                this.saveDownloadState({
                    status: 'downloading',
                    bytesDownloaded: 0,
                    totalBytes: 0
                });
            }

            this.downloadTask = RNFetchBlob.config({
                ...DOWNLOAD_CONFIG.downloadOptions,
                path: tmpPath,
                appendExt: '',
                IOSBackgroundTask: true,
                indicator: true,
                overwrite: true
            }).fetch(
                'GET',
                MODEL_CONFIG.url,
                headers,
                (received: number, total: number) => {
                    const actualReceived = received + (resumePosition || 0);
                    const actualTotal = total + (resumePosition || 0);
                    this.saveDownloadState({
                        bytesDownloaded: actualReceived,
                        totalBytes: actualTotal
                    });
                    onProgress?.(actualReceived, actualTotal);
                }
            );

            const response = await this.downloadTask;
            
            if (response.info().status === 200 || response.info().status === 206) {
                // Move temp file to final location
                if (await RNFetchBlob.fs.exists(tmpPath)) {
                    await RNFetchBlob.fs.mv(tmpPath, filePath);
                }

                // Verify hash
                const isHashValid = await this.verifyFileHash(filePath);
                if (!isHashValid) {
                    await this.deleteModel();
                    throw new Error('File integrity check failed');
                }

                this.saveDownloadState({
                    status: 'completed',
                    bytesDownloaded: this.downloadState.totalBytes,
                    lastAttempt: new Date().toISOString()
                });
                
                storage.set('modelDownloaded', true);
                onComplete?.();
            } else {
                throw new Error('Download failed with status: ' + response.info().status);
            }
        } catch (error: any) {
            console.error('Error downloading model:', error);
            
            this.saveDownloadState({
                status: 'error',
                error: error.message,
                lastAttempt: new Date().toISOString()
            });

            // Handle network errors with retry logic
            if (error.message.includes('network') && retryCount < this.networkService.getConfig().maxRetries) {
                console.log(`Retrying download (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, this.networkService.getConfig().retryDelay));
                return this.downloadModel(onProgress, onComplete, onError, retryCount + 1);
            }

            onError?.(error);
        }
    }

    async pauseDownload(): Promise<void> {
        if (this.downloadTask && this.downloadState.status === 'downloading') {
            await this.downloadTask.cancel();
            this.saveDownloadState({
                status: 'paused',
                lastAttempt: new Date().toISOString()
            });
        }
    }

    async resumeDownload(): Promise<void> {
        if (this.downloadState.status === 'paused' || this.downloadState.status === 'error') {
            this.saveDownloadState({ status: 'idle' });
            return this.downloadModel();
        }
    }

    async deleteModel(): Promise<void> {
        try {
            const exists = await this.checkModelExists();
            if (exists) {
                const filePath = MODEL_CONFIG.storagePath + MODEL_CONFIG.name;
                const tmpPath = filePath + '.tmp';
                
                // Delete both the final and temporary files
                await Promise.all([
                    RNFetchBlob.fs.unlink(filePath).catch(() => {}),
                    RNFetchBlob.fs.unlink(tmpPath).catch(() => {})
                ]);

                // Clear stored data
                storage.delete('modelDownloaded');
                storage.delete(METADATA_KEY);
                storage.delete(DOWNLOAD_STATE_KEY);
                
                this.saveDownloadState({
                    status: 'idle',
                    bytesDownloaded: 0,
                    totalBytes: 0
                });
            }
        } catch (error) {
            console.error('Error deleting model:', error);
            throw error;
        }
    }
} 