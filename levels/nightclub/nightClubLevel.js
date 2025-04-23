import { CustomLevel } from '../../customLevel.js';
import { WORLD_CONFIG } from '../../config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { ClusterManager } from '../../lighting/ClusterManager.js';
import { NightClubLighting } from './lighting.js';
import { NightclubFogEffect } from '../../src/effects/NightclubFogEffect.js';

export class NightClubLevel extends CustomLevel {
    // Define level bounds and areas
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 140,  // 140 meter space
            length: WORLD_CONFIG.GRID_CELL_SIZE * 140
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 140,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 140,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 40  // Higher 40m ceiling
        },
        // Define entrance area bounds
        entranceArea: {
            x1: -20,  // Left boundary
            x2: 20,  // Right boundary
            z1: -70,  // Back wall (south)
            z2: -60,  // Interior wall
            width: 40, // x2 - x1
            depth: 10  // z2 - z1
        },
        // Define toilet area bounds (mirrored on north side)
        toiletArea: {
            x1: -20,  // Left boundary
            x2: 20,   // Right boundary
            z1: 40,   // Interior wall (north)
            z2: 70,   // Back wall
            width: 40, // x2 - x1
            depth: 10  // z2 - z1
        }
    };

    constructor(scene) {
        super(scene);
        this.lighting = null;
        this.fogEffect = null;
        
        // Nuke the scene's ambient lighting
        scene.ambientColor = new BABYLON.Color3(0, 0, 0);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        scene.environmentIntensity = 0;
    }

    createLevel() {
        // Create the cluster manager for efficient lighting
        this.clusterManager = new ClusterManager(this.scene, {
            maxActiveLights: 4,
            debug: false
        });

        // IMPORTANT: Change the order - create entrance floor BEFORE lighting
        this.createFloor();
        const entranceFloor = this.createEntranceFloor(); // Store the reference
        this.createWalls();
        this.createCeiling();

        // Initialize lighting AFTER all meshes are created
        this.lighting = new NightClubLighting(this.scene);
        this.lighting.initialize(this.clusterManager, entranceFloor); // Pass the entrance floor reference

        return this;
    }

    createFloor(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const floor = new FloorComponent("nightclub-floor");
        
        floor.width = bounds.width;
        floor.length = bounds.length;
        floor.position = new BABYLON.Vector3(0, bounds.y, 0);
        
        floor.initialize(this.scene, {
            width: floor.width,
            length: floor.length
        });

        // Create PBR material for the floor with proper reflection properties
        const floorMaterial = new BABYLON.PBRMaterial("floor-material", this.scene);
        floorMaterial.albedoColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        floorMaterial.metallic = 0.8;  // More metallic for better light reflection
        floorMaterial.roughness = 0.15;  // Smoother surface for clearer reflections
        floorMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);  // Full reflectivity
        floorMaterial.microSurface = 0.95;  // Very smooth surface
        
        floor.mesh.material = floorMaterial;
        floor.mesh.receiveShadows = true;  // Important! This makes the floor receive light properly
        
        return floor.mesh;
    }

    createEntranceFloor() {
        const entranceArea = this.constructor.LEVEL_BOUNDS.entranceArea;
        
        const entranceFloor = BABYLON.MeshBuilder.CreateBox("entrance-floor", {
            width: entranceArea.width,
            height: 0.02,
            depth: entranceArea.depth
        }, this.scene);
        
        entranceFloor.position = new BABYLON.Vector3(
            (entranceArea.x1 + entranceArea.x2) / 2,
            0.011,
            (entranceArea.z1 + entranceArea.z2) / 2
        );
        
        const entranceFloorMaterial = new BABYLON.PBRMaterial("entrance-floor-material", this.scene);
        entranceFloorMaterial.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        entranceFloorMaterial.metallic = 0.9;
        entranceFloorMaterial.roughness = 0.1;
        entranceFloorMaterial.reflectivityColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        entranceFloorMaterial.microSurface = 1.0;
        
        entranceFloor.material = entranceFloorMaterial;
        entranceFloor.receiveShadows = true;
        
        // Remove any rendering group changes that might interfere
        entranceFloor.renderingGroupId = 0;
        
        return entranceFloor; // Return the mesh for reference
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = bounds.height; // 40 meters
        
        // Create outer walls using WallComponent (like Taiyong)
        const positions = [
            { id: "north", pos: new BABYLON.Vector3(0, wallHeight/2, bounds.length/2), rot: 0 },
            { id: "south", pos: new BABYLON.Vector3(0, wallHeight/2, -bounds.length/2), rot: 0 },
            { id: "east", pos: new BABYLON.Vector3(bounds.width/2, wallHeight/2, 0), rot: Math.PI/2 },
            { id: "west", pos: new BABYLON.Vector3(-bounds.width/2, wallHeight/2, 0), rot: Math.PI/2 }
        ];

        // Create metallic PBR material for walls
        const wallMaterial = new BABYLON.PBRMaterial("wall-material", this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        wallMaterial.metallic = 0.6;
        wallMaterial.roughness = 0.2;
        wallMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        wallMaterial.microSurface = 0.85;
        wallMaterial.backFaceCulling = false;

        positions.forEach(({ id, pos, rot }) => {
            const wall = new WallComponent(`nightclub-wall-${id}`);
            wall.height = wallHeight;
            wall.width = (id === "north" || id === "south") ? bounds.width : bounds.length;
            wall.thickness = 0.4;
            wall.initialize(this.scene);
            
            wall.mesh.position = pos;
            wall.setRotation(0, rot, 0);
            wall.mesh.material = wallMaterial.clone(`wall-material-${id}`);
            wall.setCollision(true);
            wall.mesh.checkCollisions = true;
            wall.mesh.isBlocker = true;
            wall.mesh.receiveShadows = true;
            
            walls.push(wall.mesh);
        });

        // Add interior wall using entrance area coordinates
        const entranceArea = this.constructor.LEVEL_BOUNDS.entranceArea;
        const interiorWall = new WallComponent('nightclub-wall-interior');
        interiorWall.height = wallHeight;
        interiorWall.width = entranceArea.width;
        interiorWall.thickness = 0.4;
        interiorWall.initialize(this.scene);
        
        // Position using entrance area coordinates
        const xCenter = (entranceArea.x1 + entranceArea.x2) / 2;
        interiorWall.mesh.position = new BABYLON.Vector3(xCenter, wallHeight/2, entranceArea.z2);
        interiorWall.mesh.material = wallMaterial.clone('wall-material-interior');
        interiorWall.setCollision(true);
        interiorWall.mesh.checkCollisions = true;
        interiorWall.mesh.isBlocker = true;
        interiorWall.mesh.receiveShadows = true;
        
        walls.push(interiorWall.mesh);

        return walls;
    }

    createCeiling() {
        const ceiling = new CeilingComponent("nightclub-ceiling");
        
        // Define properties before initialization
        ceiling.width = this.constructor.LEVEL_BOUNDS.room.width;
        ceiling.length = this.constructor.LEVEL_BOUNDS.room.length;
        ceiling.position = new BABYLON.Vector3(
            0,
            this.constructor.LEVEL_BOUNDS.room.height,
            0
        );
        
        // Initialize with proper options
        ceiling.initialize(this.scene, {
            width: ceiling.width,
            length: ceiling.length
        });

        // Create metallic PBR material for ceiling
        const ceilingMaterial = new BABYLON.PBRMaterial("ceiling-material", this.scene);
        ceilingMaterial.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02); // Almost black
        ceilingMaterial.metallic = 0.8; // Very metallic
        ceilingMaterial.roughness = 0.2; // Fairly smooth
        ceilingMaterial.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        ceilingMaterial.microSurface = 0.95; // Very smooth surface
        ceilingMaterial.backFaceCulling = false;
        
        ceiling.mesh.material = ceilingMaterial;
        ceiling.mesh.receiveShadows = true;

        return ceiling.mesh;
    }

    onUpdate() {
        if (this.fogEffect) {
            this.fogEffect.update();
        }
    }

    dispose() {
        if (this.lighting) {
            this.lighting.dispose();
        }
        
        if (this.clusterManager) {
            this.clusterManager.dispose();
        }
        
        if (this.fogEffect) {
            this.fogEffect.dispose();
        }
        
        super.dispose();
    }
}
