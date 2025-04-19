import { CustomLevel } from '../../customLevel.js';
import { WORLD_CONFIG } from '../../config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { TaiyongSkybox } from './skybox.js';
import { TaiyongLighting } from './lighting.js';

export class TaiyongLevel extends CustomLevel {
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 8  // Increased from 4 to 8 for higher ceiling
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...CustomLevel.DEFAULT_CONFIG,
            mazeSize: 80,  // Match the floor size
            ...config
        };
        super(scene, customConfig);
        
        // Remove ambient light since we'll use clustered lighting
        scene.ambientColor = BABYLON.Color3.Black();
        
        // Initialize our lighting system instead
        this.lighting = new TaiyongLighting(scene);
        
        // Register for updates
        this.scene.registerBeforeRender(() => this.onUpdate());
    }

    // Override createGround to use FloorComponent instead
    createGround(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const floor = new FloorComponent("taiyong-floor");
        floor.width = bounds.width;
        floor.length = bounds.length;
        floor.initialize(this.scene);
        
        // Create a dark material for the floor
        const floorMaterial = new BABYLON.StandardMaterial("floorMaterial", this.scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Dark grey
        floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        floor.mesh.material = floorMaterial;
        
        return floor.mesh;
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = bounds.height;
        const wallConfigs = [
            // North wall
            {
                position: new BABYLON.Vector3(0, wallHeight/2, bounds.length/2),
                rotation: new BABYLON.Vector3(0, 0, 0),
                width: bounds.width
            },
            // South wall
            {
                position: new BABYLON.Vector3(0, wallHeight/2, -bounds.length/2),
                rotation: new BABYLON.Vector3(0, Math.PI, 0),
                width: bounds.width
            },
            // East wall
            {
                position: new BABYLON.Vector3(bounds.width/2, wallHeight/2, 0),
                rotation: new BABYLON.Vector3(0, Math.PI/2, 0),
                width: bounds.length
            },
            // West wall
            {
                position: new BABYLON.Vector3(-bounds.width/2, wallHeight/2, 0),
                rotation: new BABYLON.Vector3(0, -Math.PI/2, 0),
                width: bounds.length
            }
        ];

        wallConfigs.forEach((config, index) => {
            const wall = new WallComponent(`taiyong-wall-${index}`);
            // Set dimensions BEFORE initializing
            wall.height = wallHeight;
            wall.width = config.width;
            wall.thickness = 0.2; // Add thickness property
            
            // Now initialize with the dimensions set
            wall.initialize(this.scene);
            
            // Only set material if mesh was created successfully
            if (wall.mesh) {
                const wallMaterial = new BABYLON.StandardMaterial(`wall-material-${index}`, this.scene);
                wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Medium grey
                wall.mesh.material = wallMaterial;
                
                wall.mesh.position = config.position;
                wall.setRotation(config.rotation.x, config.rotation.y, config.rotation.z);
                
                walls.push(wall.mesh);
            } else {
                console.warn(`Failed to create wall mesh ${index}`);
            }
        });

        // Create ceiling using floor bounds to ensure same coverage
        const floorBounds = this.constructor.LEVEL_BOUNDS.floor;
        const ceiling = new CeilingComponent("taiyong-ceiling");
        ceiling.width = floorBounds.width;   // Use floor width
        ceiling.length = floorBounds.length; // Use floor length
        
        // Calculate actual height in world units
        const ceilingHeight = WORLD_CONFIG.GRID_CELL_SIZE * 8; // Match the room height
        ceiling.position = new BABYLON.Vector3(0, ceilingHeight, 0);
        
        ceiling.initialize(this.scene, {
            width: floorBounds.width,
            length: floorBounds.length
        });
        
        if (ceiling.mesh) {
            walls.push(ceiling.mesh);
        }

        // Also adjust wall heights to match
        wallConfigs.forEach((config, index) => {
            const wall = new WallComponent(`taiyong-wall-${index}`);
            wall.height = ceilingHeight;  // Use same height as ceiling
            // ... rest of wall setup ...
        });

        return walls;
    }

    setupSkybox() {
        // Create our custom skybox component
        this.skyboxComponent = new TaiyongSkybox(this.scene);
        // Initialize it
        this.skyboxComponent.initialize();
    }

    // Override setupLighting to do nothing (we use cluster manager instead)
    setupLighting() {
        return null;
    }

    async createLevel() {
        const result = await super.createLevel();
        
        // Initialize lighting instead of createIndoorLights
        await this.lighting.initialize();
        
        return result;
    }

    onUpdate() {
        // The cluster manager handles its own updates
    }

    dispose() {
        if (this.skyboxComponent) {
            this.skyboxComponent.dispose();
        }
        if (this.lighting) {
            this.lighting.dispose();
        }
        super.dispose();
    }
}
