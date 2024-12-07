import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export class NetworkService {
    private static instance: NetworkService;
    private listeners: ((state: NetInfoState) => void)[] = [];

    private constructor() {
        this.setupNetworkMonitoring();
    }

    static getInstance(): NetworkService {
        if (!NetworkService.instance) {
            NetworkService.instance = new NetworkService();
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

    addListener(listener: (state: NetInfoState) => void): void {
        this.listeners.push(listener);
    }

    removeListener(listener: (state: NetInfoState) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    async waitForWifi(timeoutMs: number = 30000): Promise<boolean> {
        return new Promise((resolve) => {
            let timeout: ReturnType<typeof setTimeout>;
            const checkWifi = async () => {
                if (await this.isWifiConnected()) {
                    cleanup();
                    resolve(true);
                }
            };

            const cleanup = () => {
                if (timeout) clearTimeout(timeout);
                this.removeListener(listener);
            };

            const listener = (state: NetInfoState) => {
                if (state.type === 'wifi' && state.isConnected) {
                    cleanup();
                    resolve(true);
                }
            };

            this.addListener(listener);
            checkWifi();

            timeout = setTimeout(() => {
                cleanup();
                resolve(false);
            }, timeoutMs);
        });
    }
} 