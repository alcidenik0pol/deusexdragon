import { ChatUI } from './chat/chatUI.js';

export class DebugControls {
    constructor() {
        this.setupDebugControls();
    }

    setupDebugControls() {
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === 'l' && ChatUI.isActive) return; // Disable 'L' key when chat is active

            switch (e.key.toLowerCase()) {
                case 'l':
                    this.handleLevelSelection();
                    break;
                // Add more debug keys here as needed
            }
        });
    }

    handleLevelSelection() {
        const availableLevels = ['default', 'singapore', 'singapore2', 'singapore3', 'singapore4', 'ladiesroom', 'nighttest', 'modernoffice', 'testcamera', 'nightclub', 'testnewmeshes'];
        const currentLevelType = prompt(`Enter level name (${availableLevels.join(', ')}):`);
        
        if (currentLevelType && availableLevels.includes(currentLevelType.toLowerCase())) {
            // Logic to switch levels
            console.log(`Switching to level: ${currentLevelType}`);
            // Implement level switching logic here
        }
    }
} 