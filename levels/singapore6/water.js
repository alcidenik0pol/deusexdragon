import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config.js';
import { LevelGenerator } from '../../levelGenerator.js';

export class WaterArea extends BaseComponent {
    constructor() {
        super('singapore_water');
    }

    async initialize(scene, options = {}) {
        await super.initialize(scene, options);

        // Create water mesh - make it square and aligned with grid
        const waterSize = WORLD_CONFIG.GRID_CELL_SIZE * 40; // Size to match grid
        this.mesh = BABYLON.MeshBuilder.CreateGround(
            "waterMesh",
            { 
                width: waterSize, 
                height: waterSize, 
                subdivisions: 32 
            },
            scene
        );

        // Create water material
        const waterMaterial = new BABYLON.WaterMaterial("water", scene);
        waterMaterial.bumpTexture = new BABYLON.Texture("textures/waterbump.png", scene);

        // Adjusted water properties for better appearance
        // For visually flat but textured water
        waterMaterial.windForce = 0.5;
        waterMaterial.waveHeight = 0;
        waterMaterial.bumpHeight = 0.05;
        waterMaterial.waveLength = 0.3;

        waterMaterial.windDirection = new BABYLON.Vector2(0, 1);
        waterMaterial.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
        waterMaterial.colorBlendFactor = 0.3;

        // Find the skybox in the scene
        const skybox = scene.getMeshByName("skyBox");
        
        // Add skybox to the water material's reflection list if it exists
        if (skybox) {
            waterMaterial.addToRenderList(skybox);
        }
        
        // Add all other meshes in the scene to the reflection list 
        // (excluding our water mesh and the skybox which we've already added)
        scene.meshes.forEach(mesh => {
            if (mesh !== this.mesh && mesh !== skybox) {
                waterMaterial.addToRenderList(mesh);
            }
        });

        // Assign material to mesh
        this.mesh.material = waterMaterial;

        // Position slightly above ground level
        this.mesh.position.y = LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1;

        // Ensure mesh is perfectly flat and aligned with world grid
        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = 0;
        this.mesh.rotation.z = 0;
        
        // Prevent any automatic rotations
        this.mesh.rotationQuaternion = null;
    }

    // Override parent method to keep water slightly above ground level
    setWorldPosition(x, z) {
        if (this.mesh) {
            this.mesh.position = new BABYLON.Vector3(x, LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1, z);
            
            // Ensure rotation stays at zero
            this.mesh.rotation.x = 0;
            this.mesh.rotation.y = 0;
            this.mesh.rotation.z = 0;
        }
        // Update component position with the same offset
        this.position = new BABYLON.Vector3(x, LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1, z);
    }

    // Override to prevent any rotation
    setRotation(rotation) {
        // Do nothing - water should always be flat
        if (this.mesh) {
            this.mesh.rotation.x = 0;
            this.mesh.rotation.y = 0;
            this.mesh.rotation.z = 0;
        }
    }
}