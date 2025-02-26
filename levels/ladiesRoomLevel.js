import { LevelGenerator } from '../levelGenerator.js';
import { loadNPC1 } from '../characters/npc1.js';  // New import

export class LadiesRoomLevel extends LevelGenerator {
    constructor(scene) {
        super(scene);
        this.mazeSize = 8;  // Smaller than LevelGenerator
        this.cellSize = 4;  // Keep the same cell size for consistency
    }

    createProceduralTextures() {
        // Floor texture - greyish white tile
        const floorTexture = new BABYLON.DynamicTexture("floorTex", 512, this.scene);
        const floorCtx = floorTexture.getContext();
        floorCtx.fillStyle = "#D3D3D3";  // Greyish white
        floorCtx.fillRect(0, 0, 512, 512);
        floorCtx.strokeStyle = "#A9A9A9"; // Darker grey for tile lines
        for (let i = 0; i < 512; i += 64) {
            floorCtx.beginPath();
            floorCtx.moveTo(i, 0);
            floorCtx.lineTo(i, 512);
            floorCtx.moveTo(0, i);
            floorCtx.lineTo(512, i);
            floorCtx.stroke();
        }
        floorTexture.update();

        return { floorTexture, wallTexture: null };  // No wall texture needed
    }

    generateDefaultMaze() {
        const maze = Array.from({ length: this.mazeSize }, () => Array(this.mazeSize).fill(false));  // Correct usage of fill
        // Only add boundary walls
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize - 1][i] = true;
            maze[i][0] = maze[i][this.mazeSize - 1] = true;
        }
        return maze;
    }

    createCubicles() {
        const cubicleWidth = this.cellSize *2; // Width of each cubicle
        const cubicleHeight = this.cellSize; // Height of each cubicle
        const cubicleDepth = this.cellSize / 8; // Even thinner depth for cubicle walls

        for (let i = 1; i <= 5; i++) { // Create 3 cubicles
            const cubicle = BABYLON.MeshBuilder.CreateBox("cubicle" + i, 
                { width: cubicleWidth, height: cubicleHeight, depth: cubicleDepth }, this.scene);
            cubicle.position = new BABYLON.Vector3(
                (this.mazeSize / 2 - 1) * this.cellSize, // Position on the right side
                cubicleHeight / 2,
                (i - 2) * this.cellSize // Space them out
            );
            cubicle.material = new BABYLON.StandardMaterial("cubicleMat", this.scene);
            cubicle.material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Light grey for cubicles
        }
    }

    async createLevel() {
        const { floorTexture } = this.createProceduralTextures();
        const maze = this.generateDefaultMaze();

        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            { width: this.mazeSize * this.cellSize, height: this.mazeSize * this.cellSize }, this.scene);
        ground.position.y = -0.1;
        ground.material = new BABYLON.StandardMaterial("groundMat", this.scene);
        ground.material.diffuseTexture = floorTexture;

        // Walls
        const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7); // Lighter grey for walls
        
        for (let x = 0; x < this.mazeSize; x++) {
            for (let z = 0; z < this.mazeSize; z++) {
                if (maze[x][z]) {
                    const wall = BABYLON.MeshBuilder.CreateBox("wall", 
                        { width: this.cellSize, height: this.cellSize, depth: this.cellSize }, this.scene);
                    wall.position = new BABYLON.Vector3(
                        (x - this.mazeSize / 2 + 0.5) * this.cellSize,
                        this.cellSize / 2,
                        (z - this.mazeSize / 2 + 0.5) * this.cellSize
                    );
                    wall.material = wallMat;
                }
            }
        }

        // Create cubicles
        this.createCubicles();

        // Load NPC1 character
        const npc1 = await loadNPC1(this.scene);
        
        // Add interaction trigger for NPC
        const actionManager = new BABYLON.ActionManager(this.scene);
        npc1.mesh.actionManager = actionManager;
        
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                async () => {
                    // Handle NPC interaction here
                    const conversationId = await npc1.startConversation();
                    // You can emit an event or call a chat UI method here
                }
            )
        );

        return { ground, walls: [], cellSize: this.cellSize, npc1 };
    }
}