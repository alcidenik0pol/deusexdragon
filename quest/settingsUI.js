import { ChatUI } from '../ui/chatUI.js';
import { userSettings, UserSettings } from './userSettings.js';

export class SettingsUI {
    static isActive = false;

    constructor() {
        this.container = null;
        this.contentBlock = null;
        this.isVisible = false;
        
        // Create the UI elements
        this.create();
        
        // Add keyboard listener for 'O'
        this.setupKeyboardControls();
    }

    create() {
        // Create main container with same styling as ChatUI/QuestJournal
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60%;
            max-height: 70vh;
            background-color: #111827;
            border: 2px solid #d97706;
            box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.3);
            font-family: 'Share Tech Mono', monospace;
            display: none;
            z-index: 1000;
        `;

        // Create header bar
        const headerBar = document.createElement('div');
        headerBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #d97706;
            padding: 0.1rem 0.5rem;
            border-bottom: 1px solid #b45309;
            height: 20px;
        `;

        // Create title display
        const titleDisplay = document.createElement('div');
        titleDisplay.style.cssText = `
            color: #111827;
            font-weight: bold;
            letter-spacing: 1px;
            font-size: 16px;
            line-height: 1;
        `;
        titleDisplay.textContent = 'SETTINGS';

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #111827;
            cursor: pointer;
            padding: 4px;
        `;
        closeButton.onclick = () => this.hide();

        // Create content block
        this.contentBlock = document.createElement('div');
        this.contentBlock.style.cssText = `
            width: 100%;
            max-height: calc(70vh - 20px);
            overflow-y: auto;
            padding: 1rem;
            color: #fbbf24;
            font-size: 14px;
            line-height: 1.4;
            background-color: #111827;
            box-sizing: border-box;
            word-wrap: break-word;
            overflow-wrap: break-word;
        `;

        // Assemble UI
        headerBar.appendChild(titleDisplay);
        headerBar.appendChild(closeButton);
        this.container.appendChild(headerBar);
        this.container.appendChild(this.contentBlock);
        document.body.appendChild(this.container);
        
        // Populate settings content
        this.updateContent();
    }

    setupKeyboardControls() {
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === 'o' && !ChatUI.isActive) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    updateContent() {
        // Create LLM selection UI
        let content = `
            <div style="display: flex; justify-content: space-between; gap: 2rem;">
                <div style="flex: 1;">
                    <div style="margin-bottom: 1.5rem;">
                        <span style="color: #d97706; font-size: 16px;">LLM SELECTION</span>
                    </div>
        `;

        // Get available LLM options from UserSettings
        const llmOptions = userSettings.getLLMOptions();
        const currentLLM = userSettings.currentModel;

        // Create radio button group for LLM selection
        llmOptions.forEach(option => {
            const isSelected = currentLLM === option.id;
            content += `
                <div style="margin-bottom: 1rem; display: flex; align-items: start;">
                    <label style="display: flex; align-items: start; cursor: pointer; width: 100%;">
                        <input type="radio" name="llm-selection" value="${option.id}" 
                               style="margin-right: 0.75rem; margin-top: 0.25rem;" 
                               ${isSelected ? 'checked' : ''}>
                        <div>
                            <div style="color: ${isSelected ? '#10B981' : '#D1D5DB'}; font-weight: bold; margin-bottom: 0.25rem;">
                                ${option.name}
                            </div>
                            <div style="color: #6B7280; font-size: 12px;">
                                ${option.description}
                            </div>
                        </div>
                    </label>
                </div>
            `;
        });

        // Add keyboard shortcuts section
        content += `
                </div>
                <div style="flex: 1; border-left: 1px solid #374151; padding-left: 2rem;">
                    <div style="margin-bottom: 1.5rem;">
                        <span style="color: #d97706; font-size: 16px;">CONTROLS</span>
                    </div>
                    <div style="color: #D1D5DB; font-family: monospace; line-height: 1.8;">
                        WASD - Movement<br>
                        SHIFT+W - Sprint<br>
                        E    - Interact with NPCs<br>
                        P    - Move to Next Level<br>
                        O    - Toggle Settings Menu<br>
                        J    - Toggle Quest Journal<br>
                        1    - Toggle Debug Info (FPS/Position)<br>
                        L    - Level Selection (Debug)<br>
                        ESC  - Close Active Window<br>
                    </div>
                </div>
            </div>
        `;

        // Add save button
        content += `
            <div style="margin-top: 2rem; display: flex; justify-content: flex-end;">
                <button id="save-settings-btn" style="
                    background-color: #d97706;
                    color: #111827;
                    border: none;
                    border-bottom: 2px solid #92400e;
                    padding: 0.5rem 1rem;
                    font-size: 14px;
                    cursor: pointer;
                    font-family: 'Share Tech Mono', monospace;
                    letter-spacing: 1px;
                ">SAVE SETTINGS</button>
            </div>
        `;

        this.contentBlock.innerHTML = content;

        // Add event listener to save button
        const saveButton = document.getElementById('save-settings-btn');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveSettings());
            
            // Add hover effects
            saveButton.onmouseover = () => {
                saveButton.style.backgroundColor = '#f59e0b';
                saveButton.style.borderBottomColor = '#d97706';
            };
            saveButton.onmouseout = () => {
                saveButton.style.backgroundColor = '#d97706';
                saveButton.style.borderBottomColor = '#92400e';
            };
        }
    }

    saveSettings() {
        // Get selected LLM
        const selectedLLM = document.querySelector('input[name="llm-selection"]:checked')?.value;
        
        if (selectedLLM) {
            // Update the model in UserSettings (which saves to sessionStorage)
            userSettings.currentModel = selectedLLM;
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                color: #10B981;
                margin-top: 1rem;
                padding: 0.5rem;
                background-color: rgba(16, 185, 129, 0.1);
                border-left: 3px solid #10B981;
            `;
            successMsg.textContent = `Settings saved! LLM set to ${selectedLLM}`;
            
            // Add message to UI
            const saveButton = document.getElementById('save-settings-btn');
            saveButton.parentNode.appendChild(successMsg);
            
            // Remove message after 2 seconds
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 2000);
        }
    }

    show() {
        this.updateContent();
        this.container.style.display = 'block';
        this.isVisible = true;
        SettingsUI.isActive = true;

        // Lock player controls
        const lockEvent = new CustomEvent('lockPlayerControls', { detail: true });
        window.dispatchEvent(lockEvent);

        // Stop character movement
        const stopEvent = new CustomEvent('stopCharacterMovement');
        window.dispatchEvent(stopEvent);
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
        SettingsUI.isActive = false;

        // Unlock player controls
        const lockEvent = new CustomEvent('lockPlayerControls', { detail: false });
        window.dispatchEvent(lockEvent);
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
