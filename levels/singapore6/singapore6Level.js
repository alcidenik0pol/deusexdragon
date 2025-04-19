import { LevelGenerator } from '../../levelGenerator.js';
import { MBSBuilding, CapitasBuilding, FultonBuilding, ParkviewBuilding, 
         OUCBuilding, RepublicBuilding, ShopsBuilding, UOBHighBuilding, MerlionBuilding, ContainerShip } from './buildings.js';
import { WORLD_CONFIG } from '../../config.js';
import { Singapore6Skybox } from './skybox.js';
import { Streetlight } from './furniture.js';
import { WaterArea } from './water.js';
import { Singapore6Lighting } from './lighting.js';
import { Singapore6Effects } from './singapore6Effects.js';
import { CityscapeBorder } from './cityscapeBorder.js';
import { SINGAPORE6_OBJECT_MAPPING } from './objectMapping.js';
import { SeaBorder } from './seaBorder.js';
import { Singapore6NPCManager } from './npc.js';
import { Car03 } from './vehicles.js';
import { DialogueManager } from '../../src/dialogue/DialogueManager.js';
import { Singapore6Quest } from './quest.js';

export class Singapore6Level extends LevelGenerator {
    static LEVEL_BOUNDS = {
        ...LevelGenerator.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 160,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 160
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...LevelGenerator.DEFAULT_CONFIG,
            mazeSize: 160,
            ...config
        };
        super(scene, customConfig);
        this.lighting = null;
        this.effects = null;
        this.npcManager = null;
        this.flyingCar = null;
        this.vehicles = [];
        this.dialogueManager = new DialogueManager(scene);
        
        // Ensure scene has no ambient light
        scene.ambientColor = BABYLON.Color3.Black();

        // Register for updates
        this.scene.registerBeforeRender(() => this.onUpdate());

        // Initialize the quest system
        this.quest = new Singapore6Quest(scene);
        this.resolutionManager = this.quest.resolutionManager;
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
        
        // Initialize NPC manager with chat interaction
        this.npcManager = new Singapore6NPCManager(this.scene);
        await this.npcManager.initialize();
        
        // Register NPCs with the dialogue manager instead of adding click handlers
        this.dialogueManager.registerNPCs(Array.from(this.npcManager.npcs.values()));
        this.dialogueManager.initialize();
        
        // Create cityscape borders based on the 'B' positions in the map
        await this.createCityBorders();
        
        // Create and position each building using the mapping
        const buildings = [
            { Class: FultonBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Fulton },       // 1
            { Class: MBSBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.MBS },            // 2
            { Class: CapitasBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Capitas },    // 3
            { Class: ParkviewBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Parkview },  // 4
            { Class: OUCBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.OUC },           // 5
            { Class: RepublicBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Republic }, // 6
            { Class: ShopsBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Shops },       // 7
            { Class: UOBHighBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.UOBHigh },   // 8
            { Class: MerlionBuilding, pos: SINGAPORE6_OBJECT_MAPPING.BUILDINGS.Merlion }    // Merlion at its defined position
        ];

        for (const { Class, pos } of buildings) {
            const building = new Class();
            await building.initialize(this.scene);
            
            const worldPos = this.getWorldPosition(pos.x, pos.z);
            building.setWorldPosition(worldPos.x, worldPos.z);
            
            this.components.push(building);
        }

        // Create container ships in the north sea border (facing east)
        await this.createContainerShips(
            SINGAPORE6_OBJECT_MAPPING.CONTAINER_SHIPS.NORTH, 
            Math.PI / 2  // 90 degrees (east)
        );
        
        // Create container ships in the east sea border (facing south)
        await this.createContainerShips(
            SINGAPORE6_OBJECT_MAPPING.CONTAINER_SHIPS.EAST, 
            Math.PI      // 180 degrees (south)
        );

        // Place streetlights according to the map (S positions)
        const STREETLIGHT_POSITIONS = SINGAPORE6_OBJECT_MAPPING.STREETLIGHTS;
        
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

        // Adjust water position to align with grid
        const WATER_POSITION = SINGAPORE6_OBJECT_MAPPING.WATER;
        const waterArea = new WaterArea();

        // Pass the dimensions from the object mapping to the water initialization
        await waterArea.initialize(this.scene, {
            x_length: WATER_POSITION.x_length,
            z_length: WATER_POSITION.z_length
        });

        // Use the grid position directly
        const waterWorldPos = this.getWorldPosition(WATER_POSITION.x, WATER_POSITION.z);
        waterArea.setWorldPosition(waterWorldPos.x, waterWorldPos.z);
        this.components.push(waterArea);

        // Create sea borders
        await this.createSeaBorders();

        await this.createFlyingCar();

        console.log('Level update chain initialized');

        return result;
    }

    async createCityBorders() {
        // Get border segments from the mapping
        const borderSegments = SINGAPORE6_OBJECT_MAPPING.CITY_BORDERS;
        
        // Create each border segment
        for (let i = 0; i < borderSegments.length; i++) {
            const { start, end } = borderSegments[i];
            const border = new CityscapeBorder(`cityscape-border-${i}`);
            await border.initialize(this.scene);
            
            // Convert grid positions to world positions
            const startPos = this.getWorldPosition(start.x, start.z);
            const endPos = this.getWorldPosition(end.x, end.z);
            
            // Create the border between these points
            border.createBorder(
                new BABYLON.Vector3(startPos.x, 0, startPos.z),
                new BABYLON.Vector3(endPos.x, 0, endPos.z)
            );
            
            this.components.push(border);
        }
    }

    async createSeaBorders() {
        // Get sea border segments from the mapping
        const seaBorderSegments = SINGAPORE6_OBJECT_MAPPING.SEA_BORDERS;
        
        // Create each sea border segment
        for (let i = 0; i < seaBorderSegments.length; i++) {
            const { start, end, type } = seaBorderSegments[i];
            
            // Create the sea border component
            const seaBorder = new SeaBorder(`sea-border-${i}`);
            
            // For the north border (extends beyond the north edge)
            if (type === 'north') {
                // Initialize with appropriate water dimensions
                await seaBorder.initialize(this.scene, {
                    x_length: 160,  // Same width as the level
                    z_length: 80    // Extend 80 units beyond the north edge
                });
                
                // Position the sea border at the north edge
                // The water mesh is centered on its position, so we need to offset by half its z_length
                // North edge is at z = 80, so position at z = 80 + 40 = 120
                const seaWorldPos = this.getWorldPosition(0, 120);
                seaBorder.setWorldPosition(seaWorldPos.x, seaWorldPos.z);
                
                this.components.push(seaBorder);
            }
            // For the east border (extends beyond the east edge)
            else if (type === 'east') {
                await seaBorder.initialize(this.scene, {
                    x_length: 80,   // Extend 80 units beyond the east edge
                    z_length: 160   // Same height as the level
                });
                
                // Position the sea border at the east edge
                // East edge is at x = 80, so position at x = 80 + 40 = 120
                const seaWorldPos = this.getWorldPosition(120, 0);
                seaBorder.setWorldPosition(seaWorldPos.x, seaWorldPos.z);
                
                this.components.push(seaBorder);
            }
            // For the northeast corner (extends beyond both north and east edges)
            else if (type === 'northeast') {
                await seaBorder.initialize(this.scene, {
                    x_length: 80,   // Extend 80 units beyond the east edge
                    z_length: 80    // Extend 80 units beyond the north edge
                });
                
                // Position the sea border at the northeast corner
                // Northeast corner is at (80, 80), so position at (80 + 40, 80 + 40) = (120, 120)
                const seaWorldPos = this.getWorldPosition(120, 120);
                seaBorder.setWorldPosition(seaWorldPos.x, seaWorldPos.z);
                
                this.components.push(seaBorder);
            }
        }
    }

    // Helper method to create container ships with the specified positions and rotation
    async createContainerShips(positions, baseRotationAngle) {
        for (const pos of positions) {
            const ship = new ContainerShip();
            await ship.initialize(this.scene);
            
            const worldPos = this.getWorldPosition(pos.x, pos.z);
            ship.setWorldPosition(worldPos.x, worldPos.z);
            
            // Add ±10% variation to the rotation angle
            const variationPercent = (Math.random() * 0.2) - 0.1; // -0.1 to 0.1 (±10%)
            const variationAmount = baseRotationAngle * variationPercent;
            const finalRotation = baseRotationAngle + variationAmount;
            
            // Apply rotation with variation
            const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, finalRotation);
            if (ship.mesh) {
                ship.mesh.rotationQuaternion = rotation;
            }
            
            // If there's a collision mesh, rotate it too
            if (ship.collisionMesh) {
                ship.collisionMesh.rotationQuaternion = rotation;
            }
            
            this.components.push(ship);
            console.log(`Container ship positioned at (${pos.x}, ${pos.z}) with rotation ${finalRotation * 180 / Math.PI} degrees (base: ${baseRotationAngle * 180 / Math.PI}°, variation: ${variationAmount * 180 / Math.PI}°)`);
        }
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
    onUpdate() {
        if (this.npcManager) {
            this.npcManager.onUpdate();
        }
        this.updateFlyingCar();
    }

    async createFlyingCar() {
        // Car configurations - each object defines a car's properties
        const carConfigs = [
            // East-bound cars (original direction)
            { startX: -80, z: 0, rotation: Math.PI / 2, height: 35 },    // Center lane, lower than original 67.5
            { startX: -80, z: 20, rotation: Math.PI / 2, height: 30 },   // North lane, even lower
            
            // North-bound cars (perpendicular to original)
            { startX: -20, z: -80, rotation: 0, height: 32 },            // West lane
            { startX: 0, z: -80, rotation: 0, height: 38 },              // Center lane
            { startX: 20, z: -80, rotation: 0, height: 28 }              // East lane
        ];

        for (const config of carConfigs) {
            const car = new Car03();
            await car.initialize(this.scene, {
                rotation: config.rotation,
                height: config.height  // Now these are proper flying heights
            });
            
            // Set initial position
            car.setWorldPosition(config.startX, config.z);
            
            // Store movement properties based on direction
            const isEastBound = Math.abs(config.rotation - Math.PI / 2) < 0.1;
            this.flyingCar = {
                mesh: car.mesh,
                speed: 1.0,
                startX: isEastBound ? config.startX : config.startX,
                startZ: isEastBound ? config.z : config.z,
                endX: isEastBound ? 80 : config.startX,
                endZ: isEastBound ? config.z : 80,
                movingX: isEastBound,
                movingZ: !isEastBound
            };
            
            this.components.push(car);
            this.vehicles.push(this.flyingCar);
        }
    }

    updateFlyingCar() {
        for (const vehicle of this.vehicles) {
            if (vehicle.movingX) {
                // Update X position for east-bound cars
                vehicle.mesh.position.x += vehicle.speed;
                if (vehicle.mesh.position.x > vehicle.endX) {
                    vehicle.mesh.position.x = vehicle.startX;
                }
            } else {
                // Update Z position for north-bound cars
                vehicle.mesh.position.z += vehicle.speed;
                if (vehicle.mesh.position.z > vehicle.endZ) {
                    vehicle.mesh.position.z = vehicle.startZ;
                }
            }
        }
    }

    dispose() {
        if (this.effects) {
            this.effects.dispose();
        }
        if (this.lighting) {
            this.lighting.dispose();
        }
        if (this.npcManager) {
            this.npcManager.dispose();
        }
        
        // Clean up vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.dispose();
        });
        this.vehicles = [];
        this.flyingCar = null;
        
        if (this.dialogueManager) {
            this.dialogueManager.dispose();
        }
        
        // Dispose the quest system
        if (this.quest) {
            this.quest.dispose();
            this.quest = null;
        }
        
        this.resolutionManager = null;
        
        super.dispose();
    }
}