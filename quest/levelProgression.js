import { MAIN_MENU_ID, getNextLevel } from '../config/levelOrder.js';
import { MainMenu } from './mainMenu.js';

export class LevelProgression {
    constructor() {
        this.currentLevel = null;
        this.mainMenu = null;
        
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
        
        // Handle special case for credits
        if (levelId === 'credits') {
            this.showCredits();
            return;
        }
        
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
    
    showCredits() {
        // Create a simple credits screen
        const creditsDiv = document.createElement('div');
        creditsDiv.style.position = 'absolute';
        creditsDiv.style.top = '0';
        creditsDiv.style.left = '0';
        creditsDiv.style.width = '100%';
        creditsDiv.style.height = '100%';
        creditsDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        creditsDiv.style.color = '#f0f0f0';
        creditsDiv.style.display = 'flex';
        creditsDiv.style.flexDirection = 'column';
        creditsDiv.style.justifyContent = 'center';
        creditsDiv.style.alignItems = 'center';
        creditsDiv.style.fontFamily = 'Arial, sans-serif';
        creditsDiv.style.zIndex = '1000';
        
        const title = document.createElement('h1');
        title.textContent = 'DEUS EX: NEON MERLION';
        title.style.fontSize = '3rem';
        title.style.marginBottom = '2rem';
        title.style.color = '#fbbf24';
        
        const credits = document.createElement('div');
        credits.innerHTML = `
            <h2>CREDITS</h2>
            <p>Thank you for playing!</p>
            <p>Created by: Your Name</p>
            <p>Powered by: Babylon.js and Claude AI</p>
            <p>Music: Various Artists</p>
            <p>Special Thanks: The Anthropic Team</p>
        `;
        credits.style.textAlign = 'center';
        credits.style.fontSize = '1.5rem';
        credits.style.lineHeight = '2.5rem';
        
        const backButton = document.createElement('button');
        backButton.textContent = 'BACK TO MAIN MENU';
        backButton.style.marginTop = '3rem';
        backButton.style.padding = '1rem 2rem';
        backButton.style.fontSize = '1.2rem';
        backButton.style.backgroundColor = '#d97706';
        backButton.style.color = '#111827';
        backButton.style.border = 'none';
        backButton.style.borderRadius = '4px';
        backButton.style.cursor = 'pointer';
        
        backButton.onclick = () => {
            document.body.removeChild(creditsDiv);
            this.showMainMenu();
        };
        
        creditsDiv.appendChild(title);
        creditsDiv.appendChild(credits);
        creditsDiv.appendChild(backButton);
        
        document.body.appendChild(creditsDiv);
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