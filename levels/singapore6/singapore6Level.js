import { LevelGenerator } from '../../levelGenerator.js';
import { UOBBuilding } from './buildings.js';
import { WORLD_CONFIG } from '../../config.js';
import { Singapore6Skybox } from './skybox.js';
import { Streetlight } from './furniture.js';

export class Singapore6Level extends LevelGenerator {
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80
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

    setupSkybox() {
        // Create our custom skybox component
        this.skyboxComponent = new Singapore6Skybox(this.scene);
        // Initialize it with the custom textures
        this.skyboxComponent.initialize();
    }

    // Add this helper method to convert grid coordinates to world position
    getWorldPosition(gridX, gridZ) {
        return new BABYLON.Vector3(
            gridX * WORLD_CONFIG.GRID_CELL_SIZE,
            0,
            gridZ * WORLD_CONFIG.GRID_CELL_SIZE
        );
    }

    async createLevel() {
        const result = await super.createLevel();
        
        // Define building positions using exact grid coordinates
        const BUILDING_POSITIONS = {
            UOB: { x: 10, z: -10 }  // Placing at the bottom-right corner
        };
        
        // Define streetlight positions
        const STREETLIGHT_POSITIONS = [
            { x: 5, z: 5 },    // Near the center
            { x: 15, z: 5 },   // Right side
            { x: 5, z: -15 },  // Back side
            { x: 15, z: -15 }  // Back-right corner
        ];
        
        // Add UOB building with precise positioning
        const uobBuilding = new UOBBuilding();
        await uobBuilding.initialize(this.scene);
        
        const uobPosition = this.getWorldPosition(
            BUILDING_POSITIONS.UOB.x,
            BUILDING_POSITIONS.UOB.z
        );
        
        uobBuilding.mesh.position = uobPosition;
        uobBuilding.collisionMesh.position = uobPosition;
        
        this.components.push(uobBuilding);

        // Add streetlights
        for (const pos of STREETLIGHT_POSITIONS) {
            const streetlight = new Streetlight();
            await streetlight.initialize(this.scene);
            
            const streetlightPosition = this.getWorldPosition(pos.x, pos.z);
            streetlight.mesh.position = streetlightPosition;
            streetlight.collisionMesh.position = streetlightPosition;
            
            this.components.push(streetlight);
        }

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