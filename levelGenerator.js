import { Minimap } from './src/ui/Minimap.js';
import { WORLD_CONFIG } from './config.js';
import { SkyboxComponent } from './components/SkyboxComponent.js';

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
        lightIntensity: 1.0,
        lightPosition: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE, 0),
        skyboxSize: 1000,
        skyColor: new BABYLON.Color3(0.4, 0.6, 1.0), // Light blue sky
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
        window.currentLevel = this;
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight(
            "defaultLight", 
            this.config.lightPosition,
            this.scene
        );
        light.intensity = this.config.lightIntensity;
        return light;
    }

    createProceduralTextures() {
        const textureSize = 4096;  // Increased resolution
        const floorTexture = new BABYLON.DynamicTexture("floorTex", textureSize, this.scene);
        const floorCtx = floorTexture.getContext();
        
        // White background
        floorCtx.fillStyle = "#FFFFFF";
        floorCtx.fillRect(0, 0, textureSize, textureSize);
        
        // Calculate pixels per grid cell based on actual world size
        const bounds = this.constructor.LEVEL_BOUNDS.floor;
        const gridCells = bounds.width / WORLD_CONFIG.GRID_CELL_SIZE;  // Use actual size
        const pixelsPerCell = textureSize / gridCells;
        
        // Draw grid and numbers
        floorCtx.strokeStyle = "#000000";
        floorCtx.lineWidth = 4;  // Thicker lines
        floorCtx.font = `bold ${pixelsPerCell/4}px Arial`;  // Reduced font size to 1/4 (was 1/2)
        floorCtx.textAlign = "center";
        floorCtx.textBaseline = "middle";
        
        let cellNumber = 0;
        
        // Draw vertical and horizontal lines + cell numbers
        for (let x = 0; x < gridCells; x++) {
            for (let z = 0; z < gridCells; z++) {
                const xPos = x * pixelsPerCell;
                const zPos = z * pixelsPerCell;
                
                // Draw cell borders
                floorCtx.strokeRect(xPos, zPos, pixelsPerCell, pixelsPerCell);
                
                // Draw cell number
                cellNumber++;
                floorCtx.fillStyle = "#000000";
                floorCtx.fillText(
                    cellNumber.toString(),
                    xPos + pixelsPerCell/2,
                    zPos + pixelsPerCell/2
                );
            }
        }
        
        floorTexture.update();
        return { floorTexture };
    }

    generateDefaultMaze() {
        // Default empty maze with boundaries - can be overridden
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        
        // Outer boundaries only
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize-1][i] = true;
            maze[i][0] = maze[i][this.mazeSize-1] = true;
        }

        return maze;
    }

    createGround(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            { width: bounds.width, height: bounds.length }, 
            this.scene
        );
        ground.position.y = bounds.y;
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
        
        // Setup lighting first
        const light = this.setupLighting();

        // Setup skybox
        this.setupSkybox();

        // Create textures
        const { floorTexture } = this.createProceduralTextures();

        // Create ground
        const ground = this.createGround(bounds.floor);
        ground.material = new BABYLON.StandardMaterial("groundMat", this.scene);
        ground.material.diffuseTexture = floorTexture;

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

        if (this.skyboxComponent) {
            this.skyboxComponent.dispose();
        }
    }
} 