import { NativeModules } from 'react-native';

const { CryptoModule } = NativeModules;

interface ICryptoModule {
    calculateSHA256(filePath: string): Promise<string>;
}

export class CryptoService {
    private static instance: CryptoService;
    private cryptoModule: ICryptoModule;

    private constructor() {
        this.cryptoModule = CryptoModule;
    }

    public static getInstance(): CryptoService {
        if (!CryptoService.instance) {
            CryptoService.instance = new CryptoService();
        }
        return CryptoService.instance;
    }

    public async calculateSHA256(filePath: string): Promise<string> {
        try {
            return await this.cryptoModule.calculateSHA256(filePath);
        } catch (error) {
            console.error('Error calculating SHA-256:', error);
            throw error;
        }
    }
} 