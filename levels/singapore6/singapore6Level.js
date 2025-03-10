import { LevelGenerator } from '../../levelGenerator.js';
import { UOBBuilding } from './buildings.js';

export class Singapore6Level extends LevelGenerator {
    // Override default bounds if needed
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: 80,  // Custom size
            length: 80
        },
        room: {
            width: 80,
            length: 80,
            height: 8
        }
    };

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
        
        // Position the building (you can adjust these coordinates as needed)
        uobBuilding.mesh.position = new BABYLON.Vector3(0, 0, 0);
        uobBuilding.collisionMesh.position = uobBuilding.mesh.position;
        
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