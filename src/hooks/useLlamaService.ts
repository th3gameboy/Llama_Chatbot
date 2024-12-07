import { useCallback } from 'react';
import LlamaRN from 'llama.rn';
import { MODEL_CONFIG } from '../config/modelConfig';

export const useLlamaService = () => {
  const generateResponse = useCallback(async (prompt: string) => {
    try {
      const llama = new LlamaRN({
        modelPath: MODEL_CONFIG.storagePath + MODEL_CONFIG.name,
        contextSize: 2048,
        threads: 4,
        temp: 0.7,
        topP: 0.9,
        repeat_penalty: 1.1
      });

      await llama.load();
      const response = await llama.generate(prompt);
      await llama.unload();
      
      return response.text.trim();
    } catch (error) {
      console.error('Error generating response:', error);
      throw error;
    }
  }, []);

  return { generateResponse };
}; 