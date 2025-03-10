import { Minimap } from './src/ui/Minimap.js';

export class LevelGenerator {
    // Default level boundaries - can be overridden by child classes
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: 100,
            length: 100
        },
        ceiling: {
            y: 10,
            width: 100,
            length: 100
        },
        walls: {
            height: 10,
            positions: {
                north: new BABYLON.Vector3(0, 5, 50),
                south: new BABYLON.Vector3(0, 5, -50),
                east: new BABYLON.Vector3(50, 5, 0),
                west: new BABYLON.Vector3(-50, 5, 0)
            }
        },
        room: {
            width: 100,
            length: 100,
            height: 10
        }
    };

    // Default configuration - can be overridden by child classes
    static DEFAULT_CONFIG = {
        cellSize: 4,
        mazeSize: 16,
        lightIntensity: 1.0,
        lightPosition: new BABYLON.Vector3(0, 1, 0)
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
        // Default textures - can be overridden
        const floorTexture = new BABYLON.DynamicTexture("floorTex", 512, this.scene);
        const floorCtx = floorTexture.getContext();
        floorCtx.fillStyle = "#8B4513";
        floorCtx.fillRect(0, 0, 512, 512);
        floorCtx.strokeStyle = "#654321";
        for (let i = 0; i < 512; i += 64) {
            floorCtx.beginPath();
            floorCtx.moveTo(i, 0);
            floorCtx.lineTo(i, 512);
            floorCtx.moveTo(0, i);
            floorCtx.lineTo(512, i);
            floorCtx.stroke();
        }
        floorTexture.update();

        const wallTexture = new BABYLON.DynamicTexture("wallTex", 512, this.scene);
        const wallCtx = wallTexture.getContext();
        wallCtx.fillStyle = "#666633";
        wallCtx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 50; i++) {
            wallCtx.fillStyle = `rgba(0,${Math.random()*255},0,0.3)`;
            wallCtx.fillRect(Math.random()*512, Math.random()*512, 32, 32);
        }
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