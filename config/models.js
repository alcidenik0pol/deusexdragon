/**
 * LLM Model Configuration
 * Centralized model definitions and default selection
 * Last updated: August 10, 2025
 */

export const MODEL_CONFIG = {
    // Default model selection
    DEFAULT_MODEL: 'google/gemma-3-27b-it:free',
    
    // Available LLM options
    AVAILABLE_MODELS: [
        { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3', description: 'Fast and reliable - default' },
        { id: 'qwen/qwen3-14b-04-28:free', name: 'Qwen 3 (14B)', description: 'Good performance' },
        { id: 'openai/gpt-oss-20b:free', name: 'OpenAI GPT OSS 20B', description: 'Open source alternative' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat v3', description: 'Advanced reasoning model' },
        { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1 (May)', description: 'Latest reasoning model' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: 'Core reasoning model' }
    ]
};
