import { LevelGenerator } from './levelGenerator.js';
import { WORLD_CONFIG } from '../config/config.js';

export class CustomLevel extends LevelGenerator {
    // Override default bounds if needed
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 8
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            mazeSize: 80,  // Match the floor size
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

    setupSkybox() {
        // Use parent's blue sky implementation for now
        super.setupSkybox();
    }
} 