import { BaseComponent } from '../../components/BaseComponent.js';

export class Car03 extends BaseComponent {
    constructor() {
        super('car03');
        this.lights = [];
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'car03');
        
        // Handle rotation properly using Quaternion
        if (options.rotation) {
            this.rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, options.rotation);
            this.mesh.rotationQuaternion = this.rotation;
        }

        // Override BaseComponent's floor positioning for flying cars
        this.position.y = options.height || 67.5; // Default to original height if none specified
        this.mesh.position = this.position;
        
        // Add vehicle lights
        await this.createVehicleLights(scene);
        
        return this;
    }

    async createVehicleLights(scene) {
        // Create intense core glow materials
        const redCoreMaterial = new BABYLON.StandardMaterial("redCoreMat", scene);
        redCoreMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        redCoreMaterial.disableLighting = true;
        redCoreMaterial.alpha = 0.9;

        const whiteCoreMaterial = new BABYLON.StandardMaterial("whiteCoreMat", scene);
        whiteCoreMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        whiteCoreMaterial.disableLighting = true;
        whiteCoreMaterial.alpha = 0.9;

        // Create outer glow materials with more diffuse colors
        const redGlowMaterial = new BABYLON.StandardMaterial("redGlowMat", scene);
        redGlowMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.1);
        redGlowMaterial.disableLighting = true;
        redGlowMaterial.alpha = 0.4;

        const whiteGlowMaterial = new BABYLON.StandardMaterial("whiteGlowMat", scene);
        whiteGlowMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 1.0);
        whiteGlowMaterial.disableLighting = true;
        whiteGlowMaterial.alpha = 0.4;

        // Create much smaller, properly sized planes for the glow effect
        const glowWidth = 0.4;    
        const glowHeight = 0.06;  

        // Create core lights (smaller)
        const backCore = BABYLON.MeshBuilder.CreatePlane("backCore", {
            width: glowWidth * 0.5,
            height: glowHeight * 0.5
        }, scene);
        const frontCore = BABYLON.MeshBuilder.CreatePlane("frontCore", {
            width: glowWidth * 0.5,
            height: glowHeight * 0.5
        }, scene);

        // Create outer glow (larger)
        const backGlow = BABYLON.MeshBuilder.CreatePlane("backGlow", {
            width: glowWidth,
            height: glowHeight
        }, scene);
        const frontGlow = BABYLON.MeshBuilder.CreatePlane("frontGlow", {
            width: glowWidth,
            height: glowHeight
        }, scene);

        // Apply materials
        backCore.material = redCoreMaterial;
        frontCore.material = whiteCoreMaterial;
        backGlow.material = redGlowMaterial;
        frontGlow.material = whiteGlowMaterial;

        // Position values
        const lightHeight = 0.03;
        const frontOffset = 0.6;     // White lights at front
        const backOffset = -0.6;     // Red lights at back

        // Position lights and set their rotation
        [backCore, backGlow].forEach(light => {
            light.position = new BABYLON.Vector3(0, lightHeight, backOffset);
            light.rotation = new BABYLON.Vector3(0, Math.PI, 0); // Face backward
        });

        [frontCore, frontGlow].forEach(light => {
            light.position = new BABYLON.Vector3(0, lightHeight, frontOffset);
            light.rotation = new BABYLON.Vector3(0, 0, 0); // Face forward
        });

        // Remove billboard mode completely - we want fixed orientation
        [backCore, frontCore, backGlow, frontGlow].forEach(plane => {
            plane.billboardMode = 0; // No billboard mode
        });

        // Parent all lights to the car mesh
        this.lights = [backCore, frontCore, backGlow, frontGlow];
        this.lights.forEach(light => {
            light.parent = this.mesh;
        });

        // Add glow layer with heavy blur
        if (!scene.glowLayer) {
            const glowLayer = new BABYLON.GlowLayer("carGlow", scene, {
                mainTextureFixedSize: 1024,
                blurKernelSize: 128,
                mainTextureSamples: 4
            });
            glowLayer.intensity = 0.8;
            
            glowLayer.horizontalBlur = true;
            glowLayer.blurDirectionX = 1.0;
            glowLayer.blurDirectionY = 0.2;
        }
    }

    // Override BaseComponent's setWorldPosition to maintain flying height
    setWorldPosition(x, z) {
        const currentHeight = this.position.y; // Preserve height
        this.position = new BABYLON.Vector3(x, currentHeight, z);
        if (this.mesh) {
            this.mesh.position = this.position;
        }
    }

    dispose() {
        // Clean up lights
        this.lights.forEach(light => {
            if (light) {
                light.dispose();
            }
        });
        this.lights = [];
        super.dispose();
    }
}