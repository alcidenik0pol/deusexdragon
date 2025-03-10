import { LevelGenerator } from './levelGenerator.js';

export class CustomLevel extends LevelGenerator {
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
        // You can override default config
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            cellSize: 2,  // Custom cell size
            mazeSize: 20, // Custom maze size
            ...config
        };
        super(scene, customConfig);
    }

    generateDefaultMaze() {
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        // Your custom maze generation logic here
        return maze;
    }

    // Override any other methods as needed
    createWalls(bounds = this.constructor.LEVEL_BOUNDS.walls) {
        // Custom wall creation logic
        const walls = [];
        // Add your wall creation code here
        return walls;
    }

    // Add any custom methods specific to this level
} 