import { MainMenuUI } from '../ui/mainMenuUI.js';
import { LEVEL_ORDER } from '../config/levelOrder.js';
import { MusicManager } from './MusicManager.js';

export class MainMenu {
    constructor() {
        this.ui = new MainMenuUI();
        this.musicManager = MusicManager.getInstance();
        
        // Show the menu UI first
        this.ui.show();
        
        // Setup event listeners
        window.addEventListener('startGame', this.handleStartGame.bind(this));
        window.addEventListener('musicEnabled', () => {
            this.musicManager.initialize();
            this.musicManager.playSpecialTrack('menu');
        });
    }

    show() {
        this.ui.show();
    }

    hide() {
        this.ui.hide();
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