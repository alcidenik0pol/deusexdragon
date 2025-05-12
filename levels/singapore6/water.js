import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config/config.js';
import { LevelGenerator } from '../levelGenerator.js';
import { WaterMaterial } from '@babylonjs/materials/water';

export class WaterArea extends BaseComponent {
    constructor() {
        super('singapore_water');
    }

    async initialize(scene, options = {}) {
        await super.initialize(scene, options);

        const x_length = WORLD_CONFIG.GRID_CELL_SIZE * (options.x_length || options.width || 40);
        const z_length = WORLD_CONFIG.GRID_CELL_SIZE * (options.z_length || options.height || 40);
        
        this.mesh = BABYLON.MeshBuilder.CreateGround(
            "waterMesh",
            { 
                width: x_length, 
                height: z_length,
                subdivisions: 32
            },
            scene
        );

        // Create water material
        const waterMaterial = new WaterMaterial("water", scene);
        // waterMaterial.bumpTexture = new BABYLON.Texture("textures/waterbump.png", scene);

        const referenceSize = 40;
        const scaleFactor = Math.min(x_length, z_length) / (WORLD_CONFIG.GRID_CELL_SIZE * referenceSize);
        
        // Adjusted water properties for more natural look
        waterMaterial.windForce = 0.3;        // Reduced slightly
        waterMaterial.waveHeight = 0.1;       // Added small waves
        waterMaterial.bumpHeight = 0.1;       // Increased from 0.05
        waterMaterial.waveLength = 0.5;       // Increased from 0.3
        
        // Increased texture tiling for finer detail
        // waterMaterial.bumpTexture.uScale = x_length / 5;  // Changed from /10 to /5
        // waterMaterial.bumpTexture.vScale = z_length / 5;  // Changed from /10 to /5

        waterMaterial.windDirection = new BABYLON.Vector2(1, 1);  // Diagonal waves look more natural
        waterMaterial.waterColor = new BABYLON.Color3(0.1, 0.1, 0.6);
        waterMaterial.colorBlendFactor = 0.2;  // Slightly more transparent

        waterMaterial.renderTargetSize = 256;  // Default is 512

        // Add skybox first
        const skybox = scene.getMeshByName("skyBox");
        if (skybox) {
            waterMaterial.addToRenderList(skybox);
        }

        // Add meshes with distance-based filtering
        const MAX_REFLECTION_DISTANCE = 100; // Adjust based on your needs
        scene.meshes.forEach(mesh => {
            try {
                if (mesh && mesh !== this.mesh && mesh !== skybox) {
                    if (!mesh.getBoundingInfo()?.boundingSphere) return;
                    if (mesh.getBoundingInfo().boundingSphere.radius < 0.5) return;
                    
                    // Only reflect objects within certain distance
                    const distance = BABYLON.Vector3.Distance(
                        mesh.position,
                        this.mesh.position
                    );
                    if (distance > MAX_REFLECTION_DISTANCE) return;
                    
                    waterMaterial.addToRenderList(mesh);
                }
            } catch (e) {
                console.warn("Skipping mesh for water reflection:", mesh.name);
            }
        });

        this.mesh.material = waterMaterial;
        this.mesh.position.y = LevelGenerator.LEVEL_BOUNDS.floor.y + 0.1;
        
        this.mesh.rotation.x = 0;
        this.mesh.rotation.y = 0;
        this.mesh.rotation.z = 0;
        this.mesh.rotationQuaternion = null;

        scene.onBeforeRenderObservable.add(() => {
            const camDistance = BABYLON.Vector3.Distance(
                scene.activeCamera.position,
                this.mesh.position
            );
            waterMaterial.renderTargetSize = camDistance > 50 ? 256 : 512;
        });
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