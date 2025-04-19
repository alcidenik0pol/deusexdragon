import { CustomLevel } from '../../customLevel.js';
import { WORLD_CONFIG } from '../../config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { TaiyongSkybox } from './skybox.js';
import { TaiyongLighting } from './lighting.js';
import { TaiyongTriggerArea } from './taiyongTriggerArea.js';

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
        floor.width = bounds.width;
        floor.length = bounds.length;
        floor.initialize(this.scene);
        
        // Create base material that only responds to clustered lights by default
        const baseMaterial = new BABYLON.StandardMaterial("baseGroundMaterial", this.scene);
        baseMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        baseMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        baseMaterial.specularPower = 64;

        // Create an exclusion mask for the sunset light
        floor.mesh.excludedMeshesFromSunsetLight = true; // Custom property to mark for exclusion

        // Keep your grid material but make it also exclude sunset by default
        const gridMaterial = new BABYLON.GridMaterial("gridMaterial", this.scene);
        gridMaterial.majorUnitFrequency = 25;
        gridMaterial.minorUnitVisibility = 0;
        gridMaterial.gridRatio = 0.4;
        gridMaterial.opacity = 0.5;
        gridMaterial.lineColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        gridMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        // Create two overlapping ground meshes
        floor.mesh.material = baseMaterial;
        const gridMesh = floor.mesh.clone("gridMesh");
        gridMesh.material = gridMaterial;
        gridMesh.position.y += 0.01;
        gridMesh.excludedMeshesFromSunsetLight = true; // Also exclude grid from sunset

        // Create a custom glow effect using an emissive material
        const glowMaterial = new BABYLON.StandardMaterial("floorGlowMaterial", this.scene);
        glowMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        glowMaterial.disableLighting = true;
        glowMaterial.alpha = 0.3;

        // Create a separate plane for the glow effect
        const glowPlane = BABYLON.MeshBuilder.CreateGround("floor-glow", {
            width: bounds.width,
            height: bounds.length
        }, this.scene);
        
        glowPlane.material = glowMaterial;
        glowPlane.position.y = -0.01; // Slightly below the main floor
        glowPlane.parent = floor.mesh; // Parent to floor for easy management
        
        return floor.mesh;
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = WORLD_CONFIG.GRID_CELL_SIZE * 8;
        
        // Create two sections of the divider wall with an opening in the middle
        const totalWidth = 80; // Total length from z=-40 to z=40
        const openingWidth = 4; // 4-meter opening
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

                /* Commenting out blinder walls section for now
                // Create blinder walls that exactly match glass walls dimensions
                const northBlinder = new WallComponent("taiyong-blinder-north");
                const eastBlinder = new WallComponent("taiyong-blinder-east");
                const southBlinder = new WallComponent("taiyong-blinder-south");

                // Configure blinders to exactly match glass walls
                [northBlinder, eastBlinder, southBlinder].forEach(blinder => {
                    blinder.height = wallHeight;
                    blinder.width = blinder === eastBlinder ? 80 : 40; // Exact same as glass walls
                    blinder.thickness = 0.4;
                    blinder.initialize(this.scene);

                    // Create absolutely black material that blocks ALL light
                    const blinderMaterial = new BABYLON.StandardMaterial(`${blinder.mesh.name}-material`, this.scene);
                    blinderMaterial.diffuseColor = BABYLON.Color3.Black();
                    blinderMaterial.specularColor = BABYLON.Color3.Black();
                    blinderMaterial.emissiveColor = BABYLON.Color3.Black();
                    blinderMaterial.ambientColor = BABYLON.Color3.Black();
                    blinderMaterial.alpha = 1.0;
                    
                    // Enhanced light blocking properties
                    blinder.mesh.material = blinderMaterial;
                    blinder.mesh.isBlocker = true;
                    blinder.mesh.blockAllLight = true;
                    blinder.mesh.visibility = 1.0;
                    blinder.mesh.receiveShadows = false;
                    blinder.mesh.castShadows = true;
                    
                    // Add specific tags for light blocking
                    blinder.mesh.tagList = ["wall", "blinder", "lightBlocker"];
                });

                // Position blinders exactly at glass wall positions + tiny offset
                const offset = 0.2; // Smaller offset to stay closer to glass
                northBlinder.mesh.position = new BABYLON.Vector3(20, wallHeight/2, 40 + offset);
                eastBlinder.mesh.position = new BABYLON.Vector3(40 + offset, wallHeight/2, 0);
                southBlinder.mesh.position = new BABYLON.Vector3(20, wallHeight/2, -40 - offset);
                
                // Rotate the east blinder to match glass wall
                eastBlinder.setRotation(0, Math.PI/2, 0);
                */

                return [
                    northWall.mesh, eastWall.mesh, southWall.mesh,
                    // northBlinder.mesh, eastBlinder.mesh, southBlinder.mesh // Commented out blinder meshes
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
        
        // Position and rotate divider walls
        [leftWall, rightWall].forEach(wall => {
            wall.mesh.material = lightReceivingMaterial.clone(`${wall.mesh.name}-material`);
            wall.mesh.receiveShadows = true;
            wall.mesh.castShadows = true;
            // Exclude from sunset light by default
            wall.mesh.excludedMeshesFromSunsetLight = true;
        });
        leftWall.mesh.position = new BABYLON.Vector3(0, wallHeight/2, -(sectionWidth/2 + openingWidth/2));
        rightWall.mesh.position = new BABYLON.Vector3(0, wallHeight/2, (sectionWidth/2 + openingWidth/2));
        leftWall.setRotation(0, Math.PI/2, 0);
        rightWall.setRotation(0, Math.PI/2, 0);
        
        // Initialize both U sections
        const solidWalls = solidUSection.initialize();
        const glassWalls = glassUSection.initialize();
        walls.push(...solidWalls, ...glassWalls);

        // Pass the WallComponent instances to trigger area
        if (this.triggerArea) {
            console.log("Setting glass walls:", this.glassWalls); // Debug log
            this.triggerArea.setGlassWalls(this.glassWalls);
        }

        return walls;
    }

    createCeiling(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const ceiling = new CeilingComponent("taiyong-ceiling");
        ceiling.width = bounds.width;
        ceiling.length = bounds.length;
        
        // Calculate actual height in world units
        const ceilingHeight = WORLD_CONFIG.GRID_CELL_SIZE * 8;
        ceiling.position = new BABYLON.Vector3(0, ceilingHeight, 0);
        
        ceiling.initialize(this.scene, {
            width: bounds.width,
            length: bounds.length
        });

        // Override the default red material with black
        const material = new BABYLON.StandardMaterial("ceiling-material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 0);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
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
        super.dispose();
    }
}
