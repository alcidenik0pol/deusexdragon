import { ChatUI } from '../ui/chatUI.js';
import { LevelGenerator } from '../levels/levelGenerator.js';
import { Singapore6Level } from '../levels/singapore6/singapore6Level.js';
import { NightClubLevel } from '../levels/nightclub/nightClubLevel.js';
import { GridLevel } from '../levels/grid/GridLevel.js';
import { TaiyongLevel } from '../levels/taiyong/taiyongLevel.js';
import { FPSDisplay } from './fpsDisplay.js';
import { MusicManager } from '../quest/MusicManager.js';
import { CreditsLevel } from '../levels/credits/creditsLevel.js';

export class DebugControls {
    static instance = null;

    constructor(switchLevelCallback = null) {
        // Singleton pattern - only create one instance with the callback
        if (DebugControls.instance) {
            return DebugControls.instance;
        }
        
        this.switchLevelCallback = switchLevelCallback;
        this.fpsDisplay = null;
        this.setupDebugControls();
        DebugControls.instance = this;
    }

    // Static method to get level generator using existing instance
    static getLevelGenerator(levelType, scene) {
        // Create instance if it doesn't exist
        if (!DebugControls.instance) {
            new DebugControls();
        }
        return DebugControls.instance.getLevelGenerator(levelType, scene);
    }

    setupDebugControls() {
        window.addEventListener("keydown", (e) => {
            // Import SettingsUI class to check its active state
            import('../quest/settingsUI.js').then(module => {
                const SettingsUI = module.SettingsUI;
                
                // Disable keys when chat or any UI is active
                if ((e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'f' || e.key === '1') && 
                    (ChatUI.isActive || SettingsUI.isActive)) return;

                switch (e.key.toLowerCase()) {
                    case 'l':
                        this.handleLevelSelection();
                        break;
                    case 'f':
                        this.handleFPSToggle();
                        break;
                    case '1':
                        this.handleDebugToggle();
                        break;
                    // Add more debug keys here as needed
                }
            });
        });
    }

    initializeFPSDisplay(engine) {
        if (!this.fpsDisplay && engine) {
            this.fpsDisplay = new FPSDisplay(engine);
        }
    }

    handleFPSToggle() {
        if (this.fpsDisplay) {
            this.fpsDisplay.toggle();
        }
    }

    handleDebugToggle() {
        // Toggle FPS display
        if (this.fpsDisplay) {
            this.fpsDisplay.toggle();
        }
        
        // Toggle debug overlay by dispatching custom event
        const event = new CustomEvent('toggleDebugOverlay');
        window.dispatchEvent(event);
    }

    getLevelGenerator(levelType, scene) {
        switch (levelType) {
            case 'singapore6':
                return new Singapore6Level(scene);
            case 'ladiesroom':
                return new LadiesRoomLevel(scene);
            case 'testcamera':
                return new TestCameraCollision(scene);
            case 'nightclub':
                return new NightClubLevel(scene);
            case 'grid':
                return new GridLevel(scene);
            case 'taiyong':
                return new TaiyongLevel(scene);
            case 'credits':
                return new CreditsLevel(scene);
            default:
                return new LevelGenerator(scene);
        }
    }

    handleLevelSelection() {
        const availableLevels = ['default', 'singapore6', 'nightclub', 'grid', 'taiyong', 'credits'];
        const currentLevelType = prompt(`Enter level name (${availableLevels.join(', ')}):`);
        
        if (currentLevelType && availableLevels.includes(currentLevelType.toLowerCase())) {
            if (this.switchLevelCallback) {
                this.switchLevelCallback(currentLevelType.toLowerCase());
            } else {
                console.warn('No level switch callback provided');
            }
        }
    }
} 