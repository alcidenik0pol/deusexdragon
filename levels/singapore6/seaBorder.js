import { WallComponent } from '../../components/WallComponent.js';
import { WORLD_CONFIG } from '../../config.js';
import { LevelGenerator } from '../../levelGenerator.js';

export class SeaBorder extends WallComponent {
    constructor(id = 'sea-border') {
        super(id);
        this.waterMaterial = null;
        this.borderWidth = WORLD_CONFIG.GRID_CELL_SIZE * 25; // 25m outward expansion
        this.borderType = 'north'; // 'north', 'east', or 'northeast'
    }

    async initialize(scene, options = {}) {
        // Initialize base component but skip WallComponent's mesh creation
        await super.initialize(scene, options);
        
        // We'll create our own mesh in createBorder
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
        
        // Set border type if provided
        if (options.borderType) {
            this.borderType = options.borderType;
        }
    }

    createBorder(startPoint, endPoint) {
        if (!this.scene) {
            console.error('Scene not initialized');
            return;
        }

        // Create water mesh based on border type
        if (this.borderType === 'north') {
            this.createNorthBorder(startPoint, endPoint);
        } else if (this.borderType === 'east') {
            this.createEastBorder(startPoint, endPoint);
        } else if (this.borderType === 'northeast') {
            this.createNortheastCorner(startPoint);
        }
        
        // Create water material
        this.createWaterMaterial();
        
        // No collision for water
        this.setCollision(false);
    }

    createNorthBorder(startPoint, endPoint) {
        // North border: width = east-west length, height = 25m north
        const width = Math.abs(endPoint.x - startPoint.x);
        
        this.mesh = BABYLON.MeshBuilder.CreateGround(
            this.id,
            { 
                width: width, 
                height: this.borderWidth,
                subdivisions: 32 
            },
            this.scene
        );
        
        // Position: midpoint of north border, shifted 12.5m north
        const x = (startPoint.x + endPoint.x) / 2;
        const z = startPoint.z - this.borderWidth / 2; // North is negative Z
        
        this.mesh.position = new BABYLON.Vector3(
            x, 
            LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1, 
            z
        );
        
        // No rotation needed for north border (aligned with world grid)
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    createEastBorder(startPoint, endPoint) {
        // East border: width = 25m east, height = north-south length
        const height = Math.abs(endPoint.z - startPoint.z);
        
        this.mesh = BABYLON.MeshBuilder.CreateGround(
            this.id,
            { 
                width: this.borderWidth, 
                height: height,
                subdivisions: 32 
            },
            this.scene
        );
        
        // Position: midpoint of east border, shifted 12.5m east
        const x = startPoint.x + this.borderWidth / 2; // East is positive X
        const z = (startPoint.z + endPoint.z) / 2;
        
        this.mesh.position = new BABYLON.Vector3(
            x, 
            LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1, 
            z
        );
        
        // No rotation needed for east border (aligned with world grid)
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    createNortheastCorner(cornerPoint) {
        // Northeast corner: 25m x 25m square
        this.mesh = BABYLON.MeshBuilder.CreateGround(
            this.id,
            { 
                width: this.borderWidth, 
                height: this.borderWidth,
                subdivisions: 32 
            },
            this.scene
        );
        
        // Position: northeast corner, shifted 12.5m east and 12.5m north
        const x = cornerPoint.x + this.borderWidth / 2; // East is positive X
        const z = cornerPoint.z - this.borderWidth / 2; // North is negative Z
        
        this.mesh.position = new BABYLON.Vector3(
            x, 
            LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1, 
            z
        );
        
        // No rotation needed for northeast corner (aligned with world grid)
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    createWaterMaterial() {
        // Create water material similar to WaterArea
        const waterMaterial = new BABYLON.WaterMaterial(this.id + "-material", this.scene);
        waterMaterial.bumpTexture = new BABYLON.Texture("textures/waterbump.png", this.scene);

        // Adjusted water properties for sea appearance
        waterMaterial.windForce = 1.0;
        waterMaterial.waveHeight = 0.1;
        waterMaterial.bumpHeight = 0.1;
        waterMaterial.waveLength = 0.5;

        waterMaterial.windDirection = new BABYLON.Vector2(0, 1);
        waterMaterial.waterColor = new BABYLON.Color3(0.0, 0.1, 0.4); // Deeper blue for sea
        waterMaterial.colorBlendFactor = 0.3;

        // Find the skybox in the scene
        const skybox = this.scene.getMeshByName("skyBox");
        
        // Add skybox to the water material's reflection list if it exists
        if (skybox) {
            waterMaterial.addToRenderList(skybox);
        }
        
        // Add all other meshes in the scene to the reflection list 
        // (excluding our water mesh and the skybox which we've already added)
        this.scene.meshes.forEach(mesh => {
            if (mesh !== this.mesh && mesh !== skybox) {
                waterMaterial.addToRenderList(mesh);
            }
        });

        // Assign material to mesh
        this.mesh.material = waterMaterial;
        this.waterMaterial = waterMaterial;
    }

    // Override to prevent any rotation changes after creation
    setRotation(rotation) {
        // Do nothing - water border rotation is set during creation
    }
} 