import { CustomLevel } from '../../customLevel.js';
import { WORLD_CONFIG } from '../../config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { ClusterManager } from '../../lighting/ClusterManager.js';
import { NightClubLighting } from './lighting.js';

export class NightClubLevel extends CustomLevel {
    // Define level bounds - making it 80x80 with higher ceiling
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,  // 80x80 meter space
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            length: WORLD_CONFIG.GRID_CELL_SIZE * 80,
            height: WORLD_CONFIG.GRID_CELL_SIZE * 40  // Higher 40m ceiling
        }
    };

    constructor(scene) {
        super(scene);
        this.lighting = null;
        
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

        // Create basic level elements
        this.createFloor();
        this.createWalls();
        this.createCeiling();

        // Initialize lighting after the level is created
        this.lighting = new NightClubLighting(this.scene);
        this.lighting.initialize(this.clusterManager);

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

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = bounds.height; // 40 meters
        
        // Create outer walls
        const positions = {
            north: new BABYLON.Vector3(0, wallHeight/2, bounds.length/2),
            south: new BABYLON.Vector3(0, wallHeight/2, -bounds.length/2),
            east: new BABYLON.Vector3(bounds.width/2, wallHeight/2, 0),
            west: new BABYLON.Vector3(-bounds.width/2, wallHeight/2, 0)
        };

        // Create metallic PBR material for walls
        const wallMaterial = new BABYLON.PBRMaterial("wall-material", this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        wallMaterial.metallic = 0.6; // Reduced metallic for walls
        wallMaterial.roughness = 0.2; // Slightly rougher
        wallMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        wallMaterial.microSurface = 0.85;
        wallMaterial.backFaceCulling = false;

        // Create walls manually with proper dimensions
        for (const direction of ['north', 'south', 'east', 'west']) {
            // Create the wall mesh directly instead of using WallComponent
            const wallWidth = (direction === 'north' || direction === 'south') ? bounds.width : bounds.length;
            const wallMesh = BABYLON.MeshBuilder.CreateBox(
                `nightclub-wall-${direction}`, 
                {
                    height: wallHeight,
                    width: wallWidth,
                    depth: 0.4
                }, 
                this.scene
            );
            
            // Position the wall
            wallMesh.position = positions[direction];
            
            // Rotate east and west walls
            if (direction === 'east' || direction === 'west') {
                wallMesh.rotation = new BABYLON.Vector3(0, Math.PI/2, 0);
            }
            
            // Apply material and properties
            wallMesh.material = wallMaterial.clone(`wall-material-${direction}`);
            wallMesh.receiveShadows = true;
            wallMesh.isBlocker = true; // For light blocking
            wallMesh.tagList = ["wall"]; // Add wall tag
            
            walls.push(wallMesh);
        }

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

    dispose() {
        if (this.lighting) {
            this.lighting.dispose();
        }
        
        if (this.clusterManager) {
            this.clusterManager.dispose();
        }
        
        super.dispose();
    }
}
