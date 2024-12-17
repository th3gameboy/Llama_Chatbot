import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import type { NetworkConfig } from '../../types/config';

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    timeout: 30000, // 30 seconds
};

export class NetworkService {
    private static instance: NetworkService;
    private listeners: ((state: NetInfoState) => void)[] = [];
    private config: NetworkConfig;

    private constructor(config: Partial<NetworkConfig> = {}) {
        this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
        this.setupNetworkMonitoring();
    }

    static getInstance(config?: Partial<NetworkConfig>): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService(config);
        }
        return NetworkService.instance;
    }

    private setupNetworkMonitoring(): void {
        NetInfo.addEventListener((state) => {
            this.listeners.forEach(listener => listener(state));
        });
    }

    async checkConnectivity(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.isConnected ?? false;
    }

    async isWifiConnected(): Promise<boolean> {
        const state = await NetInfo.fetch();
        return state.type === 'wifi' && state.isConnected === true;
    }

    async waitForWifi(timeoutMs: number = this.config.timeout): Promise<boolean> {
        return new Promise((resolve) => {
            let timeout: ReturnType<typeof setTimeout>;
            let retryCount = 0;

            const checkWifi = async () => {
                const isWifi = await this.isWifiConnected();
                if (isWifi) {
                    cleanup();
                    resolve(true);
                } else if (retryCount < this.config.maxRetries) {
                    retryCount++;
                    setTimeout(checkWifi, this.config.retryDelay);
                } else {
                    cleanup();
                    resolve(false);
                }
            };

            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
            };

            checkWifi();
            timeout = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);
        });
    }

    async waitForConnection(timeoutMs: number = this.config.timeout): Promise<boolean> {
        return new Promise((resolve) => {
            let timeout: ReturnType<typeof setTimeout>;
            let retryCount = 0;

            const checkConnection = async () => {
                const isConnected = await this.checkConnectivity();
                if (isConnected) {
                    cleanup();
                    resolve(true);
                } else if (retryCount < this.config.maxRetries) {
                    retryCount++;
                    setTimeout(checkConnection, this.config.retryDelay);
                } else {
                    cleanup();
                    resolve(false);
                }
            };

            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
                this.removeListener(listener);
            };

            const listener = async (state: NetInfoState) => {
                if (state.isConnected) {
                    cleanup();
                    resolve(true);
                }
            };

            this.addListener(listener);
            checkConnection();

            timeout = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);
        });
    }

    addListener(listener: (state: NetInfoState) => void): void {
        this.listeners.push(listener);
    }

    removeListener(listener: (state: NetInfoState) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    updateConfig(config: Partial<NetworkConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): NetworkConfig {
        return { ...this.config };
    }
} 