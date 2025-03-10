import { ChatUI } from './chat/chatUI.js';
import { LevelGenerator } from './levelGenerator.js';
import { SingaporeLevel } from './levels/singaporeLevel.js';
import { Singapore2Level } from './levels/singapore2Level.js';
import { Singapore3Level } from './levels/singapore3Level.js';
import { LadiesRoomLevel } from './levels/ladiesRoomLevel.js';
import { Singapore4Level } from './levels/singapore4Level.js';
import { NightTestLevel } from './levels/nightTestLevel.js';
import { ModernOfficeLevel } from './levels/ModernOfficeLevel.js';
import { TestCameraCollision } from './levels/testCameraCollision.js';
import { NightClub } from './levels/NightClub.js';
import { TestNewMeshes } from './levels/TestNewMeshes.js';
import { Singapore5Level } from './levels/singapore5/singapore5Level.js';
import { Singapore6Level } from './levels/singapore6/singapore6Level.js';
import { GridLevel } from './levels/grid/GridLevel.js';

export class DebugControls {
    static instance = null;

    constructor(switchLevelCallback = null) {
        // Singleton pattern - only create one instance with the callback
        if (DebugControls.instance) {
            return DebugControls.instance;
        }
        
        this.switchLevelCallback = switchLevelCallback;
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

    getLevelGenerator(levelType, scene) {
        switch (levelType) {
            case 'singapore':
                return new SingaporeLevel(scene);
            case 'singapore2':
                return new Singapore2Level(scene);
            case 'singapore3':
                return new Singapore3Level(scene);
            case 'singapore4':
                return new Singapore4Level(scene);
            case 'singapore5':
                return new Singapore5Level(scene);
            case 'singapore6':
                return new Singapore6Level(scene);
            case 'ladiesroom':
                return new LadiesRoomLevel(scene);
            case 'nighttest':
                return new NightTestLevel(scene);
            case 'modernoffice':
                return new ModernOfficeLevel(scene);
            case 'testcamera':
                return new TestCameraCollision(scene);
            case 'nightclub':
                return new NightClub(scene);
            case 'testnewmeshes':
                return new TestNewMeshes(scene);
            case 'grid':
                return new GridLevel(scene);
            default:
                return new LevelGenerator(scene);
        }
    }

    handleLevelSelection() {
        const availableLevels = ['default', 'singapore', 'singapore2', 'singapore3', 'singapore4', 'singapore5', 'singapore6', 'ladiesroom', 'nighttest', 'modernoffice', 'testcamera', 'nightclub', 'testnewmeshes', 'grid'];
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