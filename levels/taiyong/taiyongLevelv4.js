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
        const halfWidth = bounds.width / 2;
        
        // Create vertices for two rectangles - SWAPPED ORDER
        const positions = [
            // First rectangle (positive X - neon material, ALWAYS ON)
            0, 0, -bounds.length/2,           // vertex 0
            0, 0, bounds.length/2,            // vertex 1
            halfWidth, 0, bounds.length/2,    // vertex 2
            halfWidth, 0, -bounds.length/2,   // vertex 3
            
            // Second rectangle (negative X - sunset material, controlled by blinders)
            -halfWidth, 0, -bounds.length/2,  // vertex 4
            -halfWidth, 0, bounds.length/2,   // vertex 5
            0, 0, bounds.length/2,            // vertex 6
            0, 0, -bounds.length/2            // vertex 7
        ];

        // Define indices for the triangles that make up each rectangle
        const indices = [
            // First rectangle (neon)
            0, 1, 2,    // triangle 1
            0, 2, 3,    // triangle 2
            
            // Second rectangle (sunset)
            4, 5, 6,    // triangle 3
            4, 6, 7     // triangle 4
        ];

        // Create UV coordinates
        const uvs = [
            // First rectangle (neon)
            0, 0,
            0, 1,
            1, 1,
            1, 0,
            
            // Second rectangle (sunset)
            0, 0,
            0, 1,
            1, 1,
            1, 0
        ];

        // Create the custom mesh
        const floor = new BABYLON.Mesh("taiyong-floor", this.scene);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.uvs = uvs;
        
        // Compute normals for proper lighting
        BABYLON.VertexData.ComputeNormals(positions, indices, uvs);
        vertexData.applyToMesh(floor);

        // Create materials in the CORRECT order
        const neonMaterial = new BABYLON.StandardMaterial("neon-receiving-material", this.scene);
        neonMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        neonMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        neonMaterial.backFaceCulling = false;

        const sunsetMaterial = new BABYLON.StandardMaterial("sunset-receiving-material", this.scene);
        sunsetMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        sunsetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        sunsetMaterial.backFaceCulling = false;

        // Create multi-material with EXPLICIT order
        const multiMat = new BABYLON.MultiMaterial("floor-multi", this.scene);
        multiMat.subMaterials.push(neonMaterial);  // Index 0 - NEON
        multiMat.subMaterials.push(sunsetMaterial); // Index 1 - SUNSET

        floor.material = multiMat;
        floor.receiveShadows = true;
        floor.castShadows = true;
        
        // Store references to materials in CORRECT order
        floor.neonMaterial = neonMaterial;    // First material
        floor.sunsetMaterial = sunsetMaterial; // Second material
        
        // Create submeshes with EXPLICIT material indices
        floor.subMeshes = [];
        floor.subMeshes.push(new BABYLON.SubMesh(0, 0, 8, 0, 6, floor));    // First rectangle - NEON (always on)
        floor.subMeshes.push(new BABYLON.SubMesh(1, 0, 8, 6, 6, floor));    // Second rectangle - SUNSET (controlled by blinders)

        // Explicitly remove ANY possible light blocking
        floor.isBlocker = false;
        floor.blockAllLight = false;
        floor.excludedMeshesFromSunsetLight = false;

        // Keep your grid material but make it match the same properties
        const gridMaterial = new BABYLON.GridMaterial("gridMaterial", this.scene);
        gridMaterial.majorUnitFrequency = 25;
        gridMaterial.minorUnitVisibility = 0;
        gridMaterial.gridRatio = 0.4;
        gridMaterial.opacity = 0.5;
        gridMaterial.lineColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        gridMaterial.mainColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        gridMaterial.backFaceCulling = false;

        const gridMesh = BABYLON.MeshBuilder.CreateGround("gridMesh", {
            width: bounds.width,
            height: bounds.length
        }, this.scene);
        
        gridMesh.material = gridMaterial;
        gridMesh.position.y += 0.01;
        gridMesh.receiveShadows = true;
        gridMesh.castShadows = true;
        
        // Explicitly remove ANY possible light blocking from grid too
        gridMesh.isBlocker = false;
        gridMesh.blockAllLight = false;
        gridMesh.excludedMeshesFromSunsetLight = false;

        return [floor, gridMesh];
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
            // Create sunset and neon materials
            const sunsetMaterial = new BABYLON.StandardMaterial(`${wall.mesh.name}-sunset-material`, this.scene);
            sunsetMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            sunsetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            sunsetMaterial.backFaceCulling = false;

            const neonMaterial = new BABYLON.StandardMaterial(`${wall.mesh.name}-neon-material`, this.scene);
            neonMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            neonMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            neonMaterial.backFaceCulling = false;

            // Create multi-material
            const multiMat = new BABYLON.MultiMaterial(`${wall.mesh.name}-multi`, this.scene);
            multiMat.subMaterials.push(sunsetMaterial);
            multiMat.subMaterials.push(neonMaterial);

            wall.mesh.material = multiMat;
            wall.mesh.sunsetMaterial = sunsetMaterial;
            wall.mesh.neonMaterial = neonMaterial;
            
            wall.mesh.receiveShadows = true;
            wall.mesh.castShadows = true;
            wall.mesh.excludedMeshesFromSunsetLight = false; // Allow sunset light
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

    createCeiling(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const ceiling = new CeilingComponent("taiyong-ceiling");
        ceiling.width = bounds.width;
        ceiling.length = bounds.length;
        ceiling.position = new BABYLON.Vector3(0, WORLD_CONFIG.GRID_CELL_SIZE * 8, 0);
        
        ceiling.initialize(this.scene, {
            width: bounds.width,
            length: bounds.length
        });

        // Create TWO materials like we did for the floor
        const sunsetMaterial = new BABYLON.StandardMaterial("ceiling-sunset-material", this.scene);
        sunsetMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        sunsetMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        sunsetMaterial.backFaceCulling = false;

        const neonMaterial = new BABYLON.StandardMaterial("ceiling-neon-material", this.scene);
        neonMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        neonMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        neonMaterial.backFaceCulling = false;

        // Create multi-material
        const multiMat = new BABYLON.MultiMaterial("ceiling-multi", this.scene);
        multiMat.subMaterials.push(sunsetMaterial);
        multiMat.subMaterials.push(neonMaterial);

        ceiling.mesh.material = multiMat;
        ceiling.mesh.sunsetMaterial = sunsetMaterial;  // Store reference for lighting system
        ceiling.mesh.neonMaterial = neonMaterial;      // Store reference for lighting system
        
        ceiling.mesh.receiveShadows = true;
        ceiling.mesh.castShadows = true;
        ceiling.mesh.excludedMeshesFromSunsetLight = false; // Allow sunset light
        
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
}
