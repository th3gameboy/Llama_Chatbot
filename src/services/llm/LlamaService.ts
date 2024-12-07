import type { LlamaContext } from 'llama.rn';

let llamaModule: { initLlama: any };
try {
    llamaModule = require('llama.rn');
} catch (error) {
    throw new Error('Native module llama.rn not properly linked');
}

import { MODEL_CONFIG, MODEL_INIT_CONFIG } from '../../config/modelConfig';
import { ModelManager } from '../model/ModelManager';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface LlamaModule {
    initLlama: any;
}

interface LlamaConfig {
    contextSize: number;
    threads: number;
    useMlock: boolean;
}

interface GenerationConfig {
    temperature: number;
    topP: number;
    topK: number;
    repeatPenalty: number;
    maxTokens: number;
    stop: string[];
}

type LlamaError = {
    code: 'MEMORY' | 'INITIALIZATION' | 'GENERATION' | 'MODEL_NOT_FOUND';
    message: string;
    originalError?: Error;
};

export class LlamaService {
    private static instance: LlamaService;
    private isInitialized = false;
    private modelManager: ModelManager;
    private llamaContext: LlamaContext | null = null;
    private appStateSubscription: any;
    private contextWindow: string[] = [];
    private readonly MAX_CONTEXT_LENGTH = 4096;
    private readonly MAX_MESSAGES = 10;

    private defaultConfig: LlamaConfig = {
        contextSize: MODEL_INIT_CONFIG.contextSize,
        threads: 2,
        useMlock: true
    };

    private readonly defaultGenerationConfig: GenerationConfig = {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        repeatPenalty: 1.1,
        maxTokens: 2048,
        stop: ['User:', 'Assistant:']
    };

    private constructor() {
        this.modelManager = ModelManager.getInstance();
        this.setupAppStateListener();
    }

    private setupAppStateListener() {
        this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    }

    private handleAppStateChange = async (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
            await this.cleanup();
        }
    }

    static getInstance(): LlamaService {
        if (!LlamaService.instance) {
            LlamaService.instance = new LlamaService();
        }
        return LlamaService.instance;
    }

    private async verifyNativeModule(): Promise<void> {
        if (!llamaModule?.initLlama) {
            throw new Error('Native module not initialized properly');
        }

        // Verify we can call native methods
        try {
            // Just check if we can initialize with a dummy config
            // This won't actually load a model, but will verify the native bridge
            await llamaModule.initLlama({
                model: 'dummy_path',
                use_mlock: false,
                n_ctx: 512,
                n_gpu_layers: 0,
                n_threads: 1,
            });
        } catch (error) {
            // We expect this to fail because of the dummy path
            // But it should fail in the native code, not in the JS bridge
            if ((error as Error).message?.includes('dummy_path')) {
                // This is expected - the native module is working
                return;
            }
            throw new Error(`Native module verification failed: ${(error as Error).message}`);
        }
    }

    async updateConfig(config: Partial<LlamaConfig>): Promise<void> {
        this.defaultConfig = { ...this.defaultConfig, ...config };
        if (this.isInitialized) {
            // Reinitialize with new config
            await this.cleanup();
            await this.initialize();
        }
    }

    async initialize(): Promise<void> {
        try {
            await this.verifyNativeModule();
            const modelExists = await this.modelManager.checkModelExists();
            if (!modelExists) {
                throw new Error('Model not found. Please download the model first.');
            }

            const modelPath = `file://${MODEL_CONFIG.storagePath}${MODEL_CONFIG.name}`;

            this.llamaContext = await llamaModule.initLlama({
                model: modelPath,
                ...this.defaultConfig
            });

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing Llama:', error);
            throw error;
        }
    }

    private trimContext() {
        // Keep only recent messages within context window
        while (this.getContextLength() > this.MAX_CONTEXT_LENGTH && this.contextWindow.length > 1) {
            this.contextWindow.shift();
        }
    }

    private getContextLength(): number {
        return this.contextWindow.join('').length;
    }

    private async checkMemory(): Promise<void> {
        if (Platform.OS === 'android') {
            const memoryThreshold = 50 * 1024 * 1024; // 50MB threshold
            try {
                // Try to allocate a small buffer to test memory availability
                const testBuffer = new ArrayBuffer(memoryThreshold);
                if (!testBuffer) {
                    throw new Error('Memory allocation failed');
                }
            } catch (error) {
                const llamaError: LlamaError = {
                    code: 'MEMORY',
                    message: 'Insufficient memory available',
                    originalError: error as Error
                };
                throw llamaError;
            }
        }
    }

    async chat(message: string, config?: Partial<GenerationConfig>): Promise<string> {
        if (!this.isInitialized || !this.llamaContext) {
            const error: LlamaError = {
                code: 'INITIALIZATION',
                message: 'Llama not initialized'
            };
            throw error;
        }

        try {
            await this.checkMemory();

            this.contextWindow.push(`User: ${message}\nAssistant:`);
            this.trimContext();

            const fullPrompt = `${MODEL_CONFIG.systemPrompt}\n\n${this.contextWindow.join('\n')}`;
            const generationConfig = { ...this.defaultGenerationConfig, ...config };
            
            const response = await this.llamaContext.completion({
                prompt: fullPrompt,
                ...generationConfig
            });

            const responseText = response.text.trim();
            this.contextWindow[this.contextWindow.length - 1] += responseText;

            if (this.contextWindow.length > this.MAX_MESSAGES) {
                this.contextWindow = this.contextWindow.slice(-this.MAX_MESSAGES);
            }

            return responseText;
        } catch (error) {
            let llamaError: LlamaError;
            
            if ((error as Error).message?.includes('memory')) {
                llamaError = {
                    code: 'MEMORY',
                    message: 'Out of memory - context cleared and model reinitialized',
                    originalError: error as Error
                };
                this.contextWindow = [];
                await this.cleanup();
                await this.initialize();
            } else {
                llamaError = {
                    code: 'GENERATION',
                    message: 'Error generating response',
                    originalError: error as Error
                };
            }
            
            throw llamaError;
        }
    }

    async cleanup(): Promise<void> {
        try {
            if (this.llamaContext) {
                this.contextWindow = [];
                await this.llamaContext.release();
                this.llamaContext = null;
                this.isInitialized = false;
            }
        } catch (error) {
            const llamaError: LlamaError = {
                code: 'INITIALIZATION',
                message: 'Error during cleanup',
                originalError: error as Error
            };
            throw llamaError;
        }
    }

    destroy() {
        this.appStateSubscription?.remove();
        this.cleanup();
    }
}

export default LlamaService; 