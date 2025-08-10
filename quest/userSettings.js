/**
 * UserSettings - Manages user preferences that persist across the game
 * Uses sessionStorage for settings that should reset on page reload
 */
export class UserSettings {
    static instance = null;
    
    // Available LLM options - updated to working models
    static LLM_OPTIONS = [
        { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3', description: 'Fast and reliable - default' },
        { id: 'qwen/qwen3-14b-04-28:free', name: 'Qwen 3 (14B)', description: 'Good performance' },
        { id: 'qwen/qwen3-32b-04-28:free', name: 'Qwen 3 (32B)', description: 'Higher quality' },
        { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1', description: 'Fast, reliable, smaller' },
        { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek Chat v3', description: 'Alternative DeepSeek model' }
    ];
    
    // Default model to use if none is selected - matching the uncommented one in env.js
    static DEFAULT_MODEL = 'google/gemma-3-27b-it:free';
    
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
        const stored = sessionStorage.getItem('selectedLLM');
        if (stored && UserSettings.LLM_OPTIONS.some(option => option.id === stored)) {
            this._currentModel = stored;
        } else {
            this._currentModel = UserSettings.DEFAULT_MODEL;
        }
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