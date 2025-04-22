import { ChatUI } from './chatUI.js';

export class QuestJournal {
    static isActive = false;

    constructor() {
        this.container = null;
        this.contentBlock = null;
        this.isVisible = false;
        
        // Create the UI elements
        this.create();
        
        // Add keyboard listener for 'J'
        this.setupKeyboardControls();
    }

    create() {
        // Create main container with same styling as ChatUI
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
        titleDisplay.textContent = 'QUEST LOG';

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
    }

    setupKeyboardControls() {
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === 'j' && !ChatUI.isActive) {
                e.preventDefault();
                this.toggle();
            }
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    updateContent() {
        if (!window.resolutionManager) return;

        const rm = window.resolutionManager;
        const currentLevel = rm.getCurrentLevel();
        const conditions = rm.levelConditions[currentLevel] || [];
        const completed = rm.completedConditions || {};
        const points = rm.levelPoints[currentLevel] || 0;
        const threshold = rm.levelThresholds[currentLevel] || 0;

        let content = `
            <div style="margin-bottom: 1rem;">
                <span style="color: #d97706;">CURRENT PROGRESS:</span> ${points}/${threshold} points
            </div>
            <div style="margin-bottom: 1rem;">
                <span style="color: #d97706;">OBJECTIVES:</span>
            </div>
        `;

        // Sort conditions: required first, then completed vs incomplete
        const sortedConditions = [...conditions].sort((a, b) => {
            if (a.required !== b.required) return b.required - a.required;
            if (completed[a.id] !== completed[b.id]) return completed[b.id] - completed[a.id];
            return 0;
        });

        sortedConditions.forEach(condition => {
            const isComplete = completed[condition.id];
            const status = isComplete ? '✓' : '○';
            const statusColor = isComplete ? '#10B981' : '#6B7280';
            const points = condition.points > 0 ? ` [${condition.points} pts]` : '';
            const required = condition.required ? ' (Required)' : '';
            
            content += `
                <div style="margin-bottom: 0.5rem; display: flex; align-items: start;">
                    <span style="color: ${statusColor}; margin-right: 0.5rem; flex-shrink: 0;">${status}</span>
                    <span style="color: ${isComplete ? '#10B981' : '#D1D5DB'}; word-wrap: break-word; overflow-wrap: break-word; flex-grow: 1;">
                        ${condition.condition}${points}${required}
                    </span>
                </div>
            `;
        });

        this.contentBlock.innerHTML = content;
    }

    show() {
        this.updateContent();
        this.container.style.display = 'block';
        this.isVisible = true;
        QuestJournal.isActive = true;

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
        QuestJournal.isActive = false;

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