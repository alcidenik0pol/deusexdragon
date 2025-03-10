import { LevelGenerator } from '../../levelGenerator.js';
import { UOBBuilding } from './buildings.js';
import { WORLD_CONFIG } from '../../config.js';

export class Singapore6Level extends LevelGenerator {
    constructor(scene, config = {}) {
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            mazeSize: 20, // Keep this if needed
            ...config
        };
        super(scene, customConfig);
    }

    async createLevel() {
        const result = await super.createLevel();
        
        // Add UOB building
        const uobBuilding = new UOBBuilding();
        await uobBuilding.initialize(this.scene);
        
        // Move the building away from the spawn point
        const buildingPosition = new BABYLON.Vector3(
            WORLD_CONFIG.GRID_CELL_SIZE * 20,  // 20 cells to the right
            0,
            WORLD_CONFIG.GRID_CELL_SIZE * 20   // 20 cells forward
        );
        
        uobBuilding.mesh.position = buildingPosition;
        uobBuilding.collisionMesh.position = buildingPosition;
        
        // Add to components array for proper cleanup
        this.components.push(uobBuilding);

        return result;
    }

    generateDefaultMaze() {
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        // Your custom maze generation logic here
        return maze;
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.walls) {
        // Custom wall creation logic
        const walls = [];
        // Add your wall creation code here
        return walls;
    }
} 