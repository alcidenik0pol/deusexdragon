import { LevelGenerator } from '../levelGenerator.js';
import { WORLD_CONFIG } from '../../config/config.js';
import { MusicManager } from '../../quest/MusicManager.js';

export class CreditsLevel extends LevelGenerator {
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 40,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 40
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            mazeSize: 40,
            skyColor: new BABYLON.Color3(0.05, 0.05, 0.05), // Very dark sky
            ...config
        };
        super(scene, customConfig);
        
        // Set level ID before anything else
        this.levelId = 'credits';
        
        // Set current level
        window.currentLevel = this;
        
        // Register with level progression if available
        if (window.levelProgression) {
            window.levelProgression.currentLevel = this.levelId;
        }

        // Create credits UI
        import('../../ui/creditsUI.js').then(module => {
            this.creditsUI = new module.CreditsUI();
        });

        // Remove direct music initialization since it will be handled by the level change event
    }

    // Override to create a dark environment
    setupSkybox() {
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        skyboxMaterial.emissiveColor = this.config.skyColor;

        // Set scene clear color to match sky
        this.scene.clearColor = new BABYLON.Color4(
            this.config.skyColor.r,
            this.config.skyColor.g,
            this.config.skyColor.b,
            1
        );
    }

    // Override all these methods to do nothing
    createGround() { return null; }
    createWalls() { return []; }
    async createLevel() { return {}; }

    // Override dispose to clean up UI
    dispose() {
        super.dispose();
        if (this.creditsUI) {
            // Add dispose method to CreditsUI if needed
            this.creditsUI.dispose();
        }
    }
} 