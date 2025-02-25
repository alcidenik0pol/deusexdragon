import { LevelGenerator } from './levelGenerator.js';

export class CustomLevel extends LevelGenerator {
    generateDefaultMaze() {
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        // Your custom maze generation logic here
        return maze;
    }
} 