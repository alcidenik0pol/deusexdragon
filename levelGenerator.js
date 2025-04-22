import { Minimap } from './src/ui/Minimap.js';
import { WORLD_CONFIG } from './config.js';
import { SkyboxComponent } from './components/SkyboxComponent.js';
import { SettingsUI } from './chat/settingsUI.js';

export class LevelGenerator {
    // Default level boundaries - all based on DEFAULT_WORLD_SIZE
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE,
            length: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE
        },
        ceiling: {
            y: WORLD_CONFIG.GRID_CELL_SIZE * 3,
            width: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE,
            length: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE
        },
        walls: {
            height: WORLD_CONFIG.GRID_CELL_SIZE * 3,
            positions: {
                north: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, WORLD_CONFIG.GRID_CELL_SIZE * (WORLD_CONFIG.DEFAULT_WORLD_SIZE/2)),
                south: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, -WORLD_CONFIG.GRID_CELL_SIZE * (WORLD_CONFIG.DEFAULT_WORLD_SIZE/2)),
                east: new BABYLON.Vector3(WORLD_CONFIG.GRID_CELL_SIZE * (WORLD_CONFIG.DEFAULT_WORLD_SIZE/2), WORLD_CONFIG.GRID_CELL_SIZE * 1.5, 0),
                west: new BABYLON.Vector3(-WORLD_CONFIG.GRID_CELL_SIZE * (WORLD_CONFIG.DEFAULT_WORLD_SIZE/2), WORLD_CONFIG.GRID_CELL_SIZE * 1.5, 0)
            }
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE,
            length: WORLD_CONFIG.GRID_CELL_SIZE * WORLD_CONFIG.DEFAULT_WORLD_SIZE,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 3
        }
    };

    // Default configuration - can be overridden by child classes
    static DEFAULT_CONFIG = {
        cellSize: WORLD_CONFIG.GRID_CELL_SIZE,
        mazeSize: 16,
        skyboxSize: 1000,
        skyColor: new BABYLON.Color3(0.2, 0.2, 0.2), // Dark grey sky
    };

    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...LevelGenerator.DEFAULT_CONFIG, ...config };
        this.mazeSize = this.config.mazeSize;
        this.cellSize = this.config.cellSize;
        this.walls = [];
        this.components = [];
        this.minimap = new Minimap(scene);
        this.skyboxComponent = new SkyboxComponent(scene);
        
        // Initialize settings UI
        this.settingsUI = new SettingsUI();
        
        // Set the level ID based on class name by default
        this.levelId = this.constructor.name.replace(/Level$/, '').toLowerCase();
        
        // Set as current level
        window.currentLevel = this;
        
        console.log(`[LevelGenerator] Initialized level: ${this.levelId}`);
    }

    createGround(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            { width: bounds.width, height: bounds.length }, 
            this.scene
        );
        ground.position.y = bounds.y;

        // Create and configure grid material
        const gridMaterial = new BABYLON.GridMaterial("groundMaterial", this.scene);
        gridMaterial.majorUnitFrequency = 1;
        gridMaterial.minorUnitVisibility = 0;
        gridMaterial.gridRatio = 1; // Match GRID_CELL_SIZE
        gridMaterial.opacity = 1;
        gridMaterial.lineColor = new BABYLON.Color3(1, 0.843, 0); // Gold lines (#FFD700)
        gridMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Very dark gray, almost black
        
        ground.material = gridMaterial;
        return ground;
    }

    createWalls(bounds = LevelGenerator.LEVEL_BOUNDS.walls) {
        return []; // Default implementation returns no walls - override in child classes
    }

    setupSkybox() {
        // Create a default blue sky material
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.disableLighting = true;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.emissiveColor = this.config.skyColor;

        // Set scene clear color to match sky
        this.scene.clearColor = new BABYLON.Color4(
            this.config.skyColor.r,
            this.config.skyColor.g,
            this.config.skyColor.b,
            1
        );

        // Initialize skybox with custom material
        this.skyboxComponent.setupSkybox({
            size: this.config.skyboxSize,
            customMaterial: skyboxMaterial
        });
    }

    async createLevel() {
        const bounds = this.constructor.LEVEL_BOUNDS;
        
        // Setup skybox
        this.setupSkybox();

        // Create ground
        const ground = this.createGround(bounds.floor);

        // Create walls
        const walls = this.createWalls(bounds.walls);

        // Store result
        const result = {
            ground,
            walls,
            cellSize: this.cellSize,
            bounds
        };

        result.ground.levelGenerator = this;
        return result;
    }

    dispose() {
        // Clean up walls
        this.walls.forEach(wall => {
            if (wall) wall.dispose();
        });
        this.walls = [];

        // Clean up components
        this.components?.forEach(component => {
            if (component?.dispose) component.dispose();
        });
        this.components = [];

        // Clean up minimap
        if (this.minimap) {
            this.minimap.dispose();
        }

        // Clean up settings UI
        if (this.settingsUI) {
            this.settingsUI.dispose();
        }

        if (this.skyboxComponent) {
            this.skyboxComponent.dispose();
        }
    }
} 