import { Minimap } from './src/ui/Minimap.js';

export class LevelGenerator {
    constructor(scene) {
        this.scene = scene;
        this.mazeSize = 16;
        this.cellSize = 4;
        this.walls = [];
        
        // Initialize minimap by default
        this.minimap = new Minimap(scene);
        
        // Set this as the current level
        window.currentLevel = this;
    }

    setupLighting() {
        // Default bright overhead lighting
        const light = new BABYLON.HemisphericLight(
            "defaultLight", 
            new BABYLON.Vector3(0, 1, 0),  // Directly overhead
            this.scene
        );
        light.intensity = 1.0;
        return light;
    }

    createProceduralTextures() {
        // Floor texture
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

        // Wall texture
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
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));

        // Outer boundaries
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize-1][i] = true;
            maze[i][0] = maze[i][this.mazeSize-1] = true;
        }

        // Central open area (6-9)
        for (let x = 6; x <= 9; x++) {
            for (let z = 6; z <= 9; z++) {
                maze[x][z] = false;
            }
        }

        // Random walls
        for (let x = 1; x < this.mazeSize-1; x++) {
            for (let z = 1; z < this.mazeSize-1; z++) {
                if (x < 6 || x > 9 || z < 6 || z > 9) {
                    maze[x][z] = Math.random() < 0.15;
                }
            }
        }

        return maze;
    }

    async createLevel() {
        // Setup lighting first
        const light = this.setupLighting();

        const { floorTexture, wallTexture } = this.createProceduralTextures();
        const maze = this.generateDefaultMaze();

        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            { width: this.mazeSize * this.cellSize, height: this.mazeSize * this.cellSize }, this.scene);
        ground.position.y = -0.1;
        ground.material = new BABYLON.StandardMaterial("groundMat", this.scene);
        ground.material.diffuseTexture = floorTexture;

        // Walls
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseTexture = wallTexture;
        
        for (let x = 0; x < this.mazeSize; x++) {
            for (let z = 0; z < this.mazeSize; z++) {
                if (maze[x][z]) {
                    const wall = BABYLON.MeshBuilder.CreateBox("wall", 
                        { width: this.cellSize, height: this.cellSize, depth: this.cellSize }, this.scene);
                    wall.position = new BABYLON.Vector3(
                        (x - this.mazeSize/2 + 0.5) * this.cellSize,
                        this.cellSize/2,
                        (z - this.mazeSize/2 + 0.5) * this.cellSize
                    );
                    wall.material = wallMat;
                    this.walls.push(wall);
                }
            }
        }

        return {
            ground,
            walls: this.walls,
            cellSize: this.cellSize
        };
    }

    dispose() {
        // Clean up walls
        this.walls.forEach(wall => {
            if (wall) wall.dispose();
        });
        this.walls = [];

        // Clean up minimap
        if (this.minimap) {
            this.minimap.dispose();
        }
    }
} 