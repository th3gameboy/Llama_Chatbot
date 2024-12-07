import { initLlama, type LlamaContext } from 'llama.rn';
import { MODEL_CONFIG, MODEL_INIT_CONFIG } from './config/modelConfig';
import { ModelManager } from './ModelManager';

export class LlamaService {
    private static instance: LlamaService;
    private isInitialized = false;
    private modelManager: ModelManager;
    private llamaContext: LlamaContext | null = null;

    private constructor() {
        this.modelManager = ModelManager.getInstance();
    }

    static getInstance(): LlamaService {
        if (!LlamaService.instance) {
            LlamaService.instance = new LlamaService();
        }
        return LlamaService.instance;
    }

    async initialize(): Promise<void> {
        try {
            const modelExists = await this.modelManager.checkModelExists();
            if (!modelExists) {
                throw new Error('Model not found. Please download the model first.');
            }

            const modelPath = `file://${MODEL_CONFIG.storagePath}${MODEL_CONFIG.name}`;

            this.llamaContext = await initLlama({
                model: modelPath,
                use_mlock: true,
                n_ctx: MODEL_INIT_CONFIG.contextSize,
                n_gpu_layers: MODEL_INIT_CONFIG.gpu ? 1 : 0,
                n_threads: 4,
            });

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing Llama:', error);
            throw error;
        }
    }

    async chat(message: string): Promise<string> {
        if (!this.isInitialized || !this.llamaContext) {
            throw new Error('Llama not initialized');
        }

        try {
            const prompt = `${MODEL_CONFIG.systemPrompt}\n\nUser: ${message}\nAssistant:`;

            const response = await this.llamaContext.completion({
                prompt,
                temperature: 0.7,
                top_p: 0.9,
                top_k: 40,
                penalty_repeat: 1.1,
                n_predict: 2048,
                stop: ['User:', 'Assistant:'],
            });

            return response.text.trim();
        } catch (error) {
            console.error('Error in chat:', error);
            throw error;
        }
    }

    async cleanup(): Promise<void> {
        if (this.llamaContext) {
            await this.llamaContext.release();
            this.llamaContext = null;
            this.isInitialized = false;
        }
    }
}
