/**
 * UserSettings - Manages user preferences that persist across the game
 * Uses sessionStorage for settings that should reset on page reload
 */
export class UserSettings {
    static instance = null;
    
    // Available LLM options - exactly matching those in env.js
    static LLM_OPTIONS = [
        { id: 'google/gemini-2.5-pro-exp-03-25:free', name: 'Gemini 2.5 Pro', description: 'Fast model from Google' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat', description: 'Seems slow' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: 'Not sure it\'s great' },
        { id: 'qwen/qwen-2.5-7b-instruct:free', name: 'Qwen 2.5', description: 'Great all-around performance' }
    ];
    
    // Default model to use if none is selected - matching the uncommented one in env.js
    static DEFAULT_MODEL = 'qwen/qwen-2.5-7b-instruct:free';
    
    constructor() {
        // Singleton pattern
        if (UserSettings.instance) {
            return UserSettings.instance;
        }
        
        // Initialize settings
        this._initializeSettings();
        
        // Make instance globally accessible
        UserSettings.instance = this;
        window.userSettings = this;
        
        console.log('UserSettings initialized with model:', this.currentModel);
    }
    
    _initializeSettings() {
        // Load selected LLM from sessionStorage or use default
        this._currentModel = sessionStorage.getItem('selectedLLM') || UserSettings.DEFAULT_MODEL;
    }
    
    // Getter for current model
    get currentModel() {
        return this._currentModel;
    }
    
    // Setter for current model
    set currentModel(modelId) {
        // Validate model exists in options
        const isValidModel = UserSettings.LLM_OPTIONS.some(option => option.id === modelId);
        
        if (!isValidModel) {
            console.warn(`Invalid model ID: ${modelId}, using default instead`);
            modelId = UserSettings.DEFAULT_MODEL;
        }
        
        this._currentModel = modelId;
        
        // Save to sessionStorage
        sessionStorage.setItem('selectedLLM', modelId);
        
        // Dispatch event for components to update
        const event = new CustomEvent('modelChanged', { 
            detail: { modelId } 
        });
        window.dispatchEvent(event);
        
        console.log(`Model changed to: ${modelId}`);
    }
    
    // Get all available LLM options
    getLLMOptions() {
        return UserSettings.LLM_OPTIONS;
    }
}

// Create and export a singleton instance
export const userSettings = new UserSettings(); 