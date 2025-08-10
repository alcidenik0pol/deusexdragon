import { MODEL_CONFIG } from '../config/models.js';

/**
 * UserSettings - Manages user preferences with live updates
 * Uses localStorage for persistent user preferences across sessions
 * Primary source: models.js default → localStorage override → live switching
 */
export class UserSettings {
    static instance = null;
    
    // Get LLM options from centralized model config
    static get LLM_OPTIONS() {
        return MODEL_CONFIG.AVAILABLE_MODELS;
    }
    
    // Get default model from centralized model config (single source of truth)
    static get DEFAULT_MODEL() {
        return MODEL_CONFIG.DEFAULT_MODEL;
    }
    
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
        
        console.log('UserSettings initialized');
        console.log('  - Default from models.js:', UserSettings.DEFAULT_MODEL);
        console.log('  - localStorage override:', localStorage.getItem('selectedLLM'));
        console.log('  - Final model:', this.currentModel);
    }
    
    _initializeSettings() {
        // One-time migration from sessionStorage to localStorage
        const oldSession = sessionStorage.getItem('selectedLLM');
        const newLocal = localStorage.getItem('selectedLLM');
        if (oldSession && !newLocal) {
            console.log('[UserSettings] Migrating LLM preference to localStorage');
            localStorage.setItem('selectedLLM', oldSession);
            sessionStorage.removeItem('selectedLLM');
        }
        
        // Load from localStorage (persistent) or use env.js default
        const stored = localStorage.getItem('selectedLLM');
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
        
        // Save to localStorage for persistence across sessions
        localStorage.setItem('selectedLLM', modelId);
        
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