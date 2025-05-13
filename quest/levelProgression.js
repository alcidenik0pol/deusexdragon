import { MAIN_MENU_ID, getNextLevel } from '../config/levelOrder.js';
import { MainMenu } from './mainMenu.js';
import { MusicManager } from './MusicManager.js';

export class LevelProgression {
    constructor() {
        this.currentLevel = null;
        this.mainMenu = null;
        this.musicManager = MusicManager.getInstance();
        
        // Setup event listeners
        window.addEventListener('changeLevel', this.handleLevelChange.bind(this));
        
        // Start with main menu
        this.showMainMenu();
    }
    
    showMainMenu() {
        console.log('Showing main menu');
        this.currentLevel = MAIN_MENU_ID;
        
        // Create main menu if it doesn't exist
        if (!this.mainMenu) {
            this.mainMenu = new MainMenu();
        } else {
            this.mainMenu.show(); // Show existing menu
        }
    }
    
    handleLevelChange(event) {
        const levelId = event.detail?.levelId;
        
        if (!levelId) {
            console.error('No level ID provided in changeLevel event');
            return;
        }
        
        console.log(`Changing level to: ${levelId}`);
        this.currentLevel = levelId;
        
        // Dispose of main menu if it exists
        if (this.mainMenu) {
            this.mainMenu.dispose();
            this.mainMenu = null;
        }
        
        // Trigger scene recreation with the new level
        if (window.recreateScene) {
            window.recreateScene(levelId);
        } else {
            console.error('recreateScene function not available on window object');
        }
    }
    
    getCurrentLevel() {
        return this.currentLevel;
    }
    
    goToNextLevel() {
        const nextLevel = getNextLevel(this.currentLevel);
        
        if (nextLevel) {
            const changeEvent = new CustomEvent('changeLevel', { 
                detail: { levelId: nextLevel } 
            });
            window.dispatchEvent(changeEvent);
        } else {
            console.log('No next level available');
            // Return to main menu if no next level
            this.showMainMenu();
        }
    }
} 