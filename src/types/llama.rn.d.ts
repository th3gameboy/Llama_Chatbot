declare module 'llama.rn' {
    export interface LlamaContext {
        completion(options: {
            prompt: string;
            temperature?: number;
            top_p?: number;
            top_k?: number;
            penalty_repeat?: number;
            n_predict?: number;
            stop?: string[];
        }): Promise<{ text: string }>;
        release(): Promise<void>;
    }

    export interface LlamaInitOptions {
        model: string;
        use_mlock?: boolean;
        n_ctx?: number;
        n_gpu_layers?: number;
        n_threads?: number;
    }

    export function initLlama(options: LlamaInitOptions): Promise<LlamaContext>;
} 