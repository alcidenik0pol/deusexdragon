import { Minimap } from './src/ui/Minimap.js';
import { WORLD_CONFIG } from './config.js';

export class LevelGenerator {
    // Default level boundaries - can be overridden by child classes
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,  // 100 meters wide
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100  // 100 meters long
        },
        ceiling: {
            y: WORLD_CONFIG.GRID_CELL_SIZE * 3,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 20,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 20
        },
        walls: {
            height: WORLD_CONFIG.GRID_CELL_SIZE * 3,
            positions: {
                north: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, WORLD_CONFIG.GRID_CELL_SIZE * 10),
                south: new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, -WORLD_CONFIG.GRID_CELL_SIZE * 10),
                east: new BABYLON.Vector3(WORLD_CONFIG.GRID_CELL_SIZE * 10, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, 0),
                west: new BABYLON.Vector3(-WORLD_CONFIG.GRID_CELL_SIZE * 10, WORLD_CONFIG.GRID_CELL_SIZE * 1.5, 0)
            }
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 20,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 20,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 3
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
        const textureSize = 4096;  // Increased resolution
        const floorTexture = new BABYLON.DynamicTexture("floorTex", textureSize, this.scene);
        const floorCtx = floorTexture.getContext();
        
        // White background
        floorCtx.fillStyle = "#FFFFFF";
        floorCtx.fillRect(0, 0, textureSize, textureSize);
        
        // Calculate pixels per grid cell
        const bounds = this.constructor.LEVEL_BOUNDS.floor;
        const gridCells = 100;
        const pixelsPerCell = textureSize / gridCells;
        
        // Draw grid and numbers
        floorCtx.strokeStyle = "#000000";
        floorCtx.lineWidth = 4;  // Thicker lines
        floorCtx.font = `bold ${pixelsPerCell/2}px Arial`;  // Bigger, bold font
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

    async createLevel() {
        const bounds = this.constructor.LEVEL_BOUNDS;
        
        // Setup lighting first
        const light = this.setupLighting();

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
    }
} 