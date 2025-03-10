import { Minimap } from './src/ui/Minimap.js';
import { WORLD_CONFIG } from './config.js';

export class LevelGenerator {
    // Default level boundaries - can be overridden by child classes
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100
        },
        ceiling: {
            y: WORLD_CONFIG.GRID_CELL_SIZE * 10,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100
        },
        walls: {
            height: WORLD_CONFIG.GRID_CELL_SIZE * 10,
            positions: {
                north: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 5, WORLD_CONFIG.GRID_CELL_SIZE * 50),
                south: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 5, -WORLD_CONFIG.GRID_CELL_SIZE * 50),
                east: new BABYLON.Vector3(WORLD_CONFIG.GRID_CELL_SIZE * 50, WORLD_CONFIG.GRID_CELL_SIZE * 5, 0),
                west: new BABYLON.Vector3(-WORLD_CONFIG.GRID_CELL_SIZE * 50, WORLD_CONFIG.GRID_CELL_SIZE * 5, 0)
            }
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 10
        }
    };

    // Default configuration - can be overridden by child classes
    static DEFAULT_CONFIG = {
        cellSize: WORLD_CONFIG.GRID_CELL_SIZE,
        mazeSize: 16,
        lightIntensity: 1.0,
        lightPosition: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE, 0)
    };

    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...LevelGenerator.DEFAULT_CONFIG, ...config };
        this.mazeSize = this.config.mazeSize;
        this.cellSize = this.config.cellSize;
        this.walls = [];
        this.components = [];
        this.minimap = new Minimap(scene);
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
        const textureSize = 2048;
        const floorTexture = new BABYLON.DynamicTexture("floorTex", textureSize, this.scene);
        const floorCtx = floorTexture.getContext();
        
        // Light grey background
        floorCtx.fillStyle = "#E0E0E0";
        floorCtx.fillRect(0, 0, textureSize, textureSize);
        
        // Darker lines for better visibility
        floorCtx.strokeStyle = "#CCCCCC";
        floorCtx.lineWidth = 2;
        
        // Scale lines based on floor dimensions
        const bounds = this.constructor.LEVEL_BOUNDS.floor;
        const pixelsPerCell = textureSize / bounds.width; // One cell = one meter
        
        // Draw vertical lines
        for (let x = 0; x <= bounds.width; x++) {
            const xPos = x * pixelsPerCell;
            floorCtx.beginPath();
            floorCtx.moveTo(xPos, 0);
            floorCtx.lineTo(xPos, textureSize);
            floorCtx.stroke();
        }
        
        // Draw horizontal lines
        for (let z = 0; z <= bounds.length; z++) {
            const zPos = z * pixelsPerCell;
            floorCtx.beginPath();
            floorCtx.moveTo(0, zPos);
            floorCtx.lineTo(textureSize, zPos);
            floorCtx.stroke();
        }
        floorTexture.update();

        // Keep existing wall texture
        const wallTexture = new BABYLON.DynamicTexture("wallTex", textureSize, this.scene);
        const wallCtx = wallTexture.getContext();
        wallCtx.fillStyle = "#666633";
        wallCtx.fillRect(0, 0, textureSize, textureSize);
        wallTexture.update();

        return { floorTexture, wallTexture };
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

    createGround(bounds = LevelGenerator.LEVEL_BOUNDS.floor) {
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

    async createLevel() {
        const bounds = this.constructor.LEVEL_BOUNDS;
        
        // Setup lighting first
        const light = this.setupLighting();

        // Create textures
        const { floorTexture, wallTexture } = this.createProceduralTextures();

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
    }
} 