import { ChatUI } from './chat/chatUI.js';
import { LevelGenerator } from './levelGenerator.js';
import { LadiesRoomLevel } from './levels/ladiesRoomLevel.js';
import { TestCameraCollision } from './levels/testCameraCollision.js';
import { Singapore6Level } from './levels/singapore6/singapore6Level.js';
// import { NightClub } from './levels/NightClub.js';
import { GridLevel } from './levels/grid/GridLevel.js';
import { TaiyongLevel } from './levels/taiyong/taiyongLevel.js';
import { FPSDisplay } from './fpsDisplay.js';

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
            if ((e.key.toLowerCase() === 'l' || e.key.toLowerCase() === 'm' || e.key.toLowerCase() === 'f') && ChatUI.isActive) return; // Disable keys when chat is active

            switch (e.key.toLowerCase()) {
                case 'l':
                    this.handleLevelSelection();
                    break;
                case 'm':
                    console.log("M key pressed");
                    this.handleMinimapToggle();
                    break;
                case 'f':
                    this.handleFPSToggle();
                    break;
                // Add more debug keys here as needed
            }
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

    getLevelGenerator(levelType, scene) {
        switch (levelType) {
            case 'singapore6':
                return new Singapore6Level(scene);
            case 'ladiesroom':
                return new LadiesRoomLevel(scene);
            case 'testcamera':
                return new TestCameraCollision(scene);
            case 'nightclub':
                return new NightClub(scene);
            case 'grid':
                return new GridLevel(scene);
            case 'taiyong':
                return new TaiyongLevel(scene);
            default:
                return new LevelGenerator(scene);
        }
    }

    handleLevelSelection() {
        const availableLevels = ['default', 'singapore', 'singapore2', 'singapore3', 'singapore4', 'singapore5', 'singapore6', 'ladiesroom', 'nighttest', 'modernoffice', 'testcamera', 'nightclub', 'testnewmeshes', 'grid', 'taiyong'];
        const currentLevelType = prompt(`Enter level name (${availableLevels.join(', ')}):`);
        
        if (currentLevelType && availableLevels.includes(currentLevelType.toLowerCase())) {
            if (this.switchLevelCallback) {
                this.switchLevelCallback(currentLevelType.toLowerCase());
            } else {
                console.warn('No level switch callback provided');
            }
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