declare module 'llama.rn' {
  interface LlamaConfig {
    modelPath: string;
    contextSize?: number;
    threads?: number;
    temp?: number;
    topP?: number;
    repeat_penalty?: number;
  }

  interface LlamaResponse {
    text: string;
    timings?: {
      predicted_ms: number;
      predicted_n: number;
      predicted_per_second: number;
    }
  }

  class LlamaRN {
    constructor(config: LlamaConfig);
    load(): Promise<void>;
    generate(prompt: string): Promise<LlamaResponse>;
    unload(): Promise<void>;
  }

  export default LlamaRN;
} 