import RNFetchBlob from 'react-native-blob-util';

export const MODEL_CONFIG = {
    name: 'Llama-3.2-3B-Instruct-Q4_K_M.gguf',
    size: 3.21 * 1024 * 1024 * 1024, // 3.21GB in bytes
    url: 'https://huggingface.co/hugging-quants/Llama-3.2-3B-Instruct-Q4_K_M-GGUF/resolve/main/model.gguf',
    storagePath: `${RNFetchBlob.fs.dirs.DocumentDir}/models/`,
    systemPrompt: 'You are a helpful assistant that can help solve problems, give instructions, and do math.',
};

export const DOWNLOAD_CONFIG = {
    minStorageRequired: 4 * 1024 * 1024 * 1024, // 4GB in bytes
    downloadOptions: {
        indicator: true,
        IOSBackgroundTask: true,
        appendExt: 'gguf',
        path: `${RNFetchBlob.fs.dirs.DocumentDir}/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`,
    },
};

export const MODEL_INIT_CONFIG = {
    threads: 4,
    contextSize: 2048,
    batch: 512,
    gpu: false, // Set to true if GPU inference is supported
    modelPath: `${RNFetchBlob.fs.dirs.DocumentDir}/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf`,
};
