import { ChatUI } from './chat/chatUI.js';

export class DebugControls {
    constructor(switchLevelCallback) {
        this.switchLevelCallback = switchLevelCallback;
        this.setupDebugControls();
    }

    setupDebugControls() {
        window.addEventListener("keydown", (e) => {
            if ((e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'm') && ChatUI.isActive) return; // Disable 'L' and 'M' keys when chat is active

            switch (e.key.toLowerCase()) {
                case 'l':
                    this.handleLevelSelection();
                    break;
                case 'm':
                    console.log("M key pressed");
                    this.handleMinimapToggle();
                    break;
                // Add more debug keys here as needed
            }
        });
    }

    handleLevelSelection() {
        const availableLevels = ['default', 'singapore', 'singapore2', 'singapore3', 'singapore4', 'ladiesroom', 'nighttest', 'modernoffice', 'testcamera', 'nightclub', 'testnewmeshes'];
        const currentLevelType = prompt(`Enter level name (${availableLevels.join(', ')}):`);
        
        if (currentLevelType && availableLevels.includes(currentLevelType.toLowerCase())) {
            this.switchLevelCallback(currentLevelType.toLowerCase());
        }
    }

    handleMinimapToggle() {
        // Get the current level instance
        const currentLevel = window.currentLevel;
        console.log("Current level:", currentLevel);
        if (currentLevel && currentLevel.minimap) {
            console.log("Toggling minimap");
            currentLevel.minimap.toggle();
        } else {
            console.log("No minimap found on current level");
        }
    }
} 