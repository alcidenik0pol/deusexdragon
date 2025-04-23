import { MainMenuUI } from '../ui/mainMenuUI.js';
import { LEVEL_ORDER } from '../config/levelOrder.js';

export class MainMenu {
    constructor() {
        this.ui = new MainMenuUI();
        
        // Setup event listener for the start game event
        window.addEventListener('startGame', this.handleStartGame.bind(this));
        
        // Show the menu UI
        this.ui.show();
    }
    
    handleStartGame() {
        // Get the first level from the level order
        const firstLevel = LEVEL_ORDER[0];
        
        // Trigger level change
        if (firstLevel) {
            console.log(`Starting game with first level: ${firstLevel}`);
            
            // Dispatch event to change level
            const changeEvent = new CustomEvent('changeLevel', { 
                detail: { levelId: firstLevel } 
            });
            window.dispatchEvent(changeEvent);
        } else {
            console.error('No levels defined in LEVEL_ORDER');
        }
    }
    
    dispose() {
        if (this.ui) {
            this.ui.dispose();
        }
    }
} 