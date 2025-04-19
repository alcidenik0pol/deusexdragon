import { CustomLevel } from '../../customLevel.js';
import { WORLD_CONFIG } from '../../config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { TaiyongSkybox } from './skybox.js';
import { TaiyongLighting } from './lighting.js';
import { TaiyongTriggerArea } from './taiyongTriggerArea.js';
import { BlinderComponent } from '../../components/BlinderComponent.js';
import { DoorComponent } from '../../components/DoorComponent.js';
import { TaiyongBillboard } from './furniture.js';

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
        
        // Initialize trigger area system
        this.triggerArea = new TaiyongTriggerArea(scene);
        
        // Register for updates
        this.scene.registerBeforeRender(() => this.onUpdate());
    }

    // Override createGround to use FloorComponent with special sunset handling
    createGround(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const floor = new FloorComponent("taiyong-floor");
        
        // Define ALL properties before initialization
        floor.width = bounds.width;
        floor.length = bounds.length;
        floor.position = new BABYLON.Vector3(0, bounds.y, 0);
        floor.materialType = 'standard';  // Override default 'tile'
        
        // Initialize with proper options
        floor.initialize(this.scene, {
            width: floor.width,
            length: floor.length
        });

        // Create proper material
        const material = new BABYLON.StandardMaterial("floor-material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);  // Dark gray base
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Subtle specular
        floor.mesh.material = material;

        floor.mesh.receiveShadows = true;
        
        return floor.mesh;
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = WORLD_CONFIG.GRID_CELL_SIZE * 8;
        
        // Create two sections of the divider wall with an opening in the middle
        const totalWidth = 80; // Total length from z=-40 to z=40
        const openingWidth = DoorComponent.DOOR_WIDTH; // Use door's standard width
        const sectionWidth = (totalWidth - openingWidth) / 2; // Width of each wall section
        
        // Create two materials: one that completely blocks light, one that receives it
        const lightBlockingMaterial = new BABYLON.StandardMaterial("light-blocking-material", this.scene);
        lightBlockingMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        lightBlockingMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        lightBlockingMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0);
        lightBlockingMaterial.ambientColor = new BABYLON.Color3(0, 0, 0);
        lightBlockingMaterial.backFaceCulling = false;
        
        const lightReceivingMaterial = new BABYLON.StandardMaterial("light-receiving-material", this.scene);
        lightReceivingMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        lightReceivingMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        lightReceivingMaterial.backFaceCulling = false;

        // === SOLID U-SHAPED WALL SECTION (West Side) ===
        const solidUSection = {
            walls: [],
            initialize: () => {
                // Create U-shaped outer walls - each 40 units long to match level size
                const northWall = new WallComponent("taiyong-solid-outer-wall-north");
                northWall.height = wallHeight;
                northWall.width = 40; // Half the level width (80/2)
                northWall.thickness = 0.4;
                northWall.initialize(this.scene);
                
                const westWall = new WallComponent("taiyong-solid-outer-wall-west");
                westWall.height = wallHeight;
                westWall.width = 80; // Full level length
                westWall.thickness = 0.4;
                westWall.initialize(this.scene);
                
                const southWall = new WallComponent("taiyong-solid-outer-wall-south");
                southWall.height = wallHeight;
                southWall.width = 40; // Half the level width (80/2)
                southWall.thickness = 0.4;
                southWall.initialize(this.scene);
                
                // Apply light blocking material
                [northWall, westWall, southWall].forEach(wall => {
                    wall.mesh.material = lightBlockingMaterial;
                    wall.mesh.isBlocker = true;
                    wall.mesh.receiveShadows = true;
                    wall.mesh.castShadows = true;
                    
                    // Store both materials for switching
                    wall.materials = {
                        blocking: lightBlockingMaterial,
                        receiving: lightReceivingMaterial.clone(`${wall.mesh.name}-receiving`)
                    };
                });
                
                // Position U-shaped walls - using level coordinates (80x80 grid)
                northWall.mesh.position = new BABYLON.Vector3(-20, wallHeight/2, 40); // North wall
                westWall.mesh.position = new BABYLON.Vector3(-40, wallHeight/2, 0);   // West wall
                southWall.mesh.position = new BABYLON.Vector3(-20, wallHeight/2, -40); // South wall
                
                // Rotate the west wall
                westWall.setRotation(0, Math.PI/2, 0);
                
                this.walls = [northWall, westWall, southWall];
                return [northWall.mesh, westWall.mesh, southWall.mesh];
            }
        };

        // === GLASS U-SHAPED WALL SECTION (East Side) ===
        const glassUSection = {
            walls: [],
            initialize: () => {
                // Create U-shaped glass walls - mirroring the solid U
                const northWall = new WallComponent("taiyong-glass-outer-wall-north");
                const eastWall = new WallComponent("taiyong-glass-outer-wall-east");
                const southWall = new WallComponent("taiyong-glass-outer-wall-south");
                
                northWall.height = wallHeight;
                northWall.width = 40;
                northWall.thickness = 0.4;
                northWall.initialize(this.scene);
                
                eastWall.height = wallHeight;
                eastWall.width = 80;
                eastWall.thickness = 0.4;
                eastWall.initialize(this.scene);
                
                southWall.height = wallHeight;
                southWall.width = 40;
                southWall.thickness = 0.4;
                southWall.initialize(this.scene);
                
                // Position U-shaped walls - mirrored positions
                northWall.mesh.position = new BABYLON.Vector3(20, wallHeight/2, 40);
                eastWall.mesh.position = new BABYLON.Vector3(40, wallHeight/2, 0);
                southWall.mesh.position = new BABYLON.Vector3(20, wallHeight/2, -40);
                
                // Rotate the east wall
                eastWall.setRotation(0, Math.PI/2, 0);

                // Create transparent material
                const transparentMaterial = new BABYLON.StandardMaterial("transparent-material", this.scene);
                transparentMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                transparentMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                transparentMaterial.alpha = 0.3; // Make it transparent
                transparentMaterial.backFaceCulling = false;

                // Apply transparent material to all glass walls
                [northWall, eastWall, southWall].forEach(wall => {
                    wall.mesh.material = transparentMaterial.clone(`${wall.mesh.name}-transparent`);
                    wall.mesh.isBlocker = false; // Don't block light
                    wall.mesh.receiveShadows = true;
                    wall.mesh.visibility = 1;
                });

                /* Original blinder implementation commented out */

                // === NEW BLINDER IMPLEMENTATION ===
                // Create blinder walls using new BlinderComponent
                const northBlinder = new BlinderComponent("taiyong-blinder-north");
                const eastBlinder = new BlinderComponent("taiyong-blinder-east");
                const southBlinder = new BlinderComponent("taiyong-blinder-south");

                // Configure blinders to exactly match glass walls
                [northBlinder, eastBlinder, southBlinder].forEach(blinder => {
                    blinder.height = wallHeight;
                    blinder.width = blinder === eastBlinder ? 80 : 40; // Match glass wall dimensions
                    blinder.thickness = 0.4;
                    blinder.initialize(this.scene);
                });

                // Position blinders exactly at glass wall positions + tiny offset
                const offset = 0.2;
                northBlinder.mesh.position = new BABYLON.Vector3(20, wallHeight/2, 40 + offset);
                eastBlinder.mesh.position = new BABYLON.Vector3(40 + offset, wallHeight/2, 0);
                southBlinder.mesh.position = new BABYLON.Vector3(20, wallHeight/2, -40 - offset);
                
                // Rotate the east blinder to match glass wall
                eastBlinder.mesh.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);

                // Store the component reference directly on the mesh
                northBlinder.mesh.blinderComponent = northBlinder;
                eastBlinder.mesh.blinderComponent = eastBlinder;
                southBlinder.mesh.blinderComponent = southBlinder;

                return [
                    northWall.mesh, eastWall.mesh, southWall.mesh,
                    ...northBlinder.getMeshes(),
                    ...eastBlinder.getMeshes(),
                    ...southBlinder.getMeshes()
                ];
            }
        };

        // Create central divider wall sections with light-receiving material
        const leftWall = new WallComponent("taiyong-divider-wall-left");
        leftWall.height = wallHeight;
        leftWall.width = sectionWidth;
        leftWall.thickness = 0.4;
        leftWall.initialize(this.scene);
        
        const rightWall = new WallComponent("taiyong-divider-wall-right");
        rightWall.height = wallHeight;
        rightWall.width = sectionWidth;
        rightWall.thickness = 0.4;
        rightWall.initialize(this.scene);
        
        // For each divider wall
        [leftWall, rightWall].forEach(wall => {
            const sunsetMaterial = new BABYLON.StandardMaterial(`${wall.mesh.name}-sunset`, this.scene);
            sunsetMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            sunsetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            sunsetMaterial.specularPower = 32;
            sunsetMaterial.backFaceCulling = false;

            const neonMaterial = new BABYLON.StandardMaterial(`${wall.mesh.name}-neon`, this.scene);
            neonMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            neonMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            neonMaterial.specularPower = 32;
            neonMaterial.backFaceCulling = false;

            const multiMat = new BABYLON.MultiMaterial(`${wall.mesh.name}-multi`, this.scene);
            multiMat.subMaterials.push(sunsetMaterial);  // Index 0: Sunset
            multiMat.subMaterials.push(neonMaterial);    // Index 1: Neon

            wall.mesh.material = multiMat;
            wall.mesh.receiveShadows = true;
            wall.mesh.isDividerWall = true;
            wall.mesh.materialZones = {
                neonZone: wall.mesh.position.x < 0,
                sunsetZone: wall.mesh.position.x > 0
            };
        });
        leftWall.mesh.position = new BABYLON.Vector3(0, wallHeight/2, -(sectionWidth/2 + openingWidth/2));
        rightWall.mesh.position = new BABYLON.Vector3(0, wallHeight/2, (sectionWidth/2 + openingWidth/2));
        leftWall.setRotation(0, Math.PI/2, 0);
        rightWall.setRotation(0, Math.PI/2, 0);
        
        // Initialize both U sections
        const solidWalls = solidUSection.initialize();
        const glassWalls = glassUSection.initialize();
        walls.push(...solidWalls, ...glassWalls);

        // Create the door component for the opening
        this.doorComponent = new DoorComponent("taiyong-central-door");
        this.doorComponent.initialize(this.scene);

        // Position the door in the center opening
        this.doorComponent.mesh.position = new BABYLON.Vector3(0, wallHeight/2, 0);
        this.doorComponent.setRotation(0, Math.PI/2, 0);

        // Set the door to open and ensure proper collision setup
        this.doorComponent.setOpen(true);

        // Additional setup for all door meshes
        this.doorComponent.getMeshes().forEach(mesh => {
            // Ensure these properties are set
            mesh.isWalkthrough = true;
            mesh.checkCollisions = false;
            
            // Optional: Add metadata to identify as door
            mesh.metadata = { isDoor: true };
        });

        // Add door meshes to walls array
        walls.push(...this.doorComponent.getMeshes());

        // Pass the WallComponent instances to trigger area
        if (this.triggerArea) {
            console.log("Setting glass walls:", this.glassWalls); // Debug log
            this.triggerArea.setGlassWalls(this.glassWalls);
        }

        return walls;
    }

    createCeiling() {
        const ceiling = new CeilingComponent("taiyong-ceiling");
        
        // Define ALL required properties before initialization
        ceiling.width = this.constructor.LEVEL_BOUNDS.room.width;   // Match room width
        ceiling.length = this.constructor.LEVEL_BOUNDS.room.length; // Match room length
        ceiling.position = new BABYLON.Vector3(
            0,  // Center X
            this.constructor.LEVEL_BOUNDS.room.height, // Height from LEVEL_BOUNDS
            0   // Center Z
        );

        // Now initialize with proper materials
        ceiling.initialize(this.scene, {
            width: ceiling.width,
            length: ceiling.length
        });

        // Setup for sunset lighting
        ceiling.mesh.receiveShadows = true;
        ceiling.mesh.isCeiling = true;

        // Create proper material (override the debug RED)
        const material = new BABYLON.StandardMaterial("ceiling-material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);  // Dark gray base
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Subtle specular
        material.backFaceCulling = false;
        ceiling.mesh.material = material;

        return ceiling.mesh;
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
        
        // Add ceiling to the level
        if (result.walls) {
            const ceiling = this.createCeiling();
            if (ceiling) {
                result.walls.push(ceiling);
            }
        }
        
        // Initialize lighting instead of createIndoorLights
        await this.lighting.initialize();
        
        // Initialize trigger area system
        this.triggerArea.initialize();

        // Create billboards
        await this.createBillboards();
        
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
        if (this.triggerArea) {
            this.triggerArea.dispose();
        }
        if (this.doorComponent) {
            this.doorComponent.dispose();
        }
        super.dispose();
    }

    // Helper function to create dual-lighting materials
    createDualLightingMaterial(name) {
        // Create sunset material (affected by blinders)
        const sunsetMaterial = new BABYLON.StandardMaterial(`${name}-sunset`, this.scene);
        sunsetMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        sunsetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        sunsetMaterial.backFaceCulling = false;

        // Create neon material (always active)
        const neonMaterial = new BABYLON.StandardMaterial(`${name}-neon`, this.scene);
        neonMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        neonMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        neonMaterial.backFaceCulling = false;

        // Create multi-material
        const multiMat = new BABYLON.MultiMaterial(name, this.scene);
        multiMat.subMaterials.push(sunsetMaterial);
        multiMat.subMaterials.push(neonMaterial);

        return {
            material: multiMat,
            sunsetMaterial,
            neonMaterial
        };
    }

    async createBillboards() {
        const billboard = new TaiyongBillboard();
        await billboard.initialize(this.scene);
        
        // Direct position in grid units
        const x = -0.4 * WORLD_CONFIG.GRID_CELL_SIZE;
        const y = 5.0 * WORLD_CONFIG.GRID_CELL_SIZE;
        const z = -8.0 * WORLD_CONFIG.GRID_CELL_SIZE;
        
        billboard.position = new BABYLON.Vector3(x, y, z);
        billboard.rotation = new BABYLON.Quaternion.RotationYawPitchRoll(Math.PI / 2, 0, 0);
        
        billboard.mesh.position = billboard.position;
        billboard.mesh.rotationQuaternion = billboard.rotation;
        
        this.components.push(billboard);
    }
}
