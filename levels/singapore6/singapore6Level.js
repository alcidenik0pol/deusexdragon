import { LevelGenerator } from '../../levelGenerator.js';
import { MBSBuilding, CapitasBuilding, FultonBuilding, ParkviewBuilding, 
         OUCBuilding, RepublicBuilding, ShopsBuilding, UOBHighBuilding } from './buildings.js';
import { WORLD_CONFIG } from '../../config.js';
import { Singapore6Skybox } from './skybox.js';
import { Streetlight } from './furniture.js';
import { WaterArea } from './water.js';
import { Singapore6Lighting } from './lighting.js';
import { Singapore6Effects } from './singapore6Effects.js';

export class Singapore6Level extends LevelGenerator {
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 160,  // Doubled from 80
            length: WORLD_CONFIG.GRID_CELL_SIZE * 160  // Doubled from 80
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            mazeSize: 160,  // Doubled from 80 to match floor size
            ...config
        };
        super(scene, customConfig);
        this.lighting = null;
        this.effects = null;
        
        // Ensure scene has no ambient light
        scene.ambientColor = BABYLON.Color3.Black();
    }

    // Override the createGround method to use a dark grey flat color
    createGround(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        // Create the ground mesh
        const ground = BABYLON.MeshBuilder.CreateGround("ground", 
            { width: bounds.width, height: bounds.length }, 
            this.scene
        );
        ground.position.y = bounds.y;
        
        // Create a dark grey material
        const darkGreyMaterial = new BABYLON.StandardMaterial("floorMaterial", this.scene);
        darkGreyMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Dark grey
        darkGreyMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specularity
        
        // Apply the material to the ground
        ground.material = darkGreyMaterial;
        
        return ground;
    }

    setupSkybox() {
        // Create our custom skybox component
        this.skyboxComponent = new Singapore6Skybox(this.scene);
        // Initialize it with the custom textures
        this.skyboxComponent.initialize();
    }

    // Override parent's setupLighting to do nothing (we'll use our own lighting class)
    setupLighting() {
        return null;
    }

    // Rest of the existing code...
    getWorldPosition(gridX, gridZ) {
        return new BABYLON.Vector3(
            gridX * WORLD_CONFIG.GRID_CELL_SIZE,
            0,
            gridZ * WORLD_CONFIG.GRID_CELL_SIZE
        );
    }

    async createLevel() {
        const result = await super.createLevel();
        
        // Initialize our custom lighting system
        this.lighting = new Singapore6Lighting(this.scene);
        
        // Initialize our effects system
        this.effects = new Singapore6Effects(this.scene, this.lighting.clusterManager);
        this.effects.initialize();
        
        // Define building positions based on the ASCII map layout
        const BUILDING_POSITIONS = {
            // Left column (x = -70)
            Fulton: { x: -70, z: 70 },      // 1
            Parkview: { x: -70, z: 50 },    // 4
            UOBHigh: { x: -70, z: 30 },     // 8
            Republic: { x: -70, z: 10 },    // 6
            OUC: { x: -70, z: -10 },        // 5
            Capitas: { x: -70, z: -30 },    // 3
            Shops: { x: -70, z: -70 },      // 7
            
            // Right side (x = 50)
            MBS: { x: 50, z: 50 },          // 2
        };

        // Create and position each building
        const buildings = [
            { Class: FultonBuilding, pos: BUILDING_POSITIONS.Fulton },       // 1
            { Class: MBSBuilding, pos: BUILDING_POSITIONS.MBS },            // 2
            { Class: CapitasBuilding, pos: BUILDING_POSITIONS.Capitas },    // 3
            { Class: ParkviewBuilding, pos: BUILDING_POSITIONS.Parkview },  // 4
            { Class: OUCBuilding, pos: BUILDING_POSITIONS.OUC },           // 5
            { Class: RepublicBuilding, pos: BUILDING_POSITIONS.Republic }, // 6
            { Class: ShopsBuilding, pos: BUILDING_POSITIONS.Shops },       // 7
            { Class: UOBHighBuilding, pos: BUILDING_POSITIONS.UOBHigh }    // 8
        ];

        for (const { Class, pos } of buildings) {
            const building = new Class();
            await building.initialize(this.scene);
            
            const worldPos = this.getWorldPosition(pos.x, pos.z);
            building.setWorldPosition(worldPos.x, worldPos.z);
            
            this.components.push(building);
        }

        // UPDATED: Place streetlights according to the map (S positions)
        // Based on the map, streetlights are in two columns next to buildings
        const STREETLIGHT_POSITIONS = [
            // First column of streetlights (x = -60)
            { x: -60, z: 70 },
            { x: -60, z: 50 },
            { x: -60, z: 30 },
            { x: -60, z: 10 },
            { x: -60, z: -10 },
            { x: -60, z: -30 },
            
            // Second column of streetlights (x = -50)
            { x: -50, z: 70 },
            { x: -50, z: 50 },
            { x: -50, z: 30 },
            { x: -50, z: 10 },
            { x: -50, z: -10 },
            { x: -50, z: -30 },
        ];
        
        // Add streetlights with proper clustering
        for (let i = 0; i < STREETLIGHT_POSITIONS.length; i++) {
            const pos = STREETLIGHT_POSITIONS[i];
            const streetlight = new Streetlight();
            
            // Determine rotation based on which column the streetlight is in
            let rotation;
            if (pos.x === -60) {
                // First column - rotate 90 degrees (facing right)
                rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
            } else {
                // Second column - rotate 270 degrees (facing left)
                rotation = new BABYLON.Vector3(0, 3 * Math.PI/2, 0);
            }
            
            const options = { 
                debug: false,
                rotation: rotation
            };
            
            await streetlight.initialize(this.scene, options);
            
            const worldPos = this.getWorldPosition(pos.x, pos.z);
            streetlight.setWorldPosition(worldPos.x, worldPos.z);
            
            // Register the streetlight with the lighting system
            if (this.lighting) {
                this.lighting.registerStreetlight(streetlight);
                console.log(`Streetlight ${i+1} positioned at: ${worldPos.x}, ${worldPos.z} with rotation ${rotation.y/Math.PI * 180} degrees`);
            } else {
                console.warn("Failed to register streetlight - lighting system missing");
            }
            
            this.components.push(streetlight);
        }

        // Adjust water position to align with grid (W on the map is at x=0, z=50)
        const WATER_POSITION = { x: 0, z: 50 };
        const waterArea = new WaterArea();
        await waterArea.initialize(this.scene);
        
        // Use the grid position directly
        const waterWorldPos = this.getWorldPosition(WATER_POSITION.x, WATER_POSITION.z);
        waterArea.setWorldPosition(waterWorldPos.x, waterWorldPos.z);
        this.components.push(waterArea);

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

    // Override the update method to update our effects
    update() {
        super.update();
        
        // Update our effects
        if (this.effects) {
            this.effects.update();
        }
    }

    dispose() {
        if (this.effects) {
            this.effects.dispose();
        }
        if (this.lighting) {
            this.lighting.dispose();
        }
        super.dispose();
    }
}