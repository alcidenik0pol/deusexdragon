import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config.js';

export class Streetlight extends BaseComponent {
    constructor() {
        super('streetlight01');
        this.lightComponent = null;
        this.lightMesh = null;
        this.FIXED_LIGHT_HEIGHT = 2.64; // Fixed light height in meters
        // this.FIXED_LIGHT_HEIGHT = 2.65; // Fixed light height in meters
        this.LIGHT_ANGLE = Math.PI / 5.5;
        this.LIGHT_FORWARD_OFFSET = 0.3; // Forward offset in meters
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'streetlight01');
        
        // Apply initial rotation if provided in options
        if (options.rotation) {
            this.mesh.rotation = options.rotation;
        } else {
            // Default rotation - 180 degrees around Y-axis
            this.mesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        }
        
        // Calculate the actual height of the streetlight
        const assetData = await fetch(`/assets/furniture/streetlight01.json`).then(r => r.json());
        const rawHeight = assetData.rawDimensions.height;
        const scale = assetData.scaleFactor;
        const actualHeight = rawHeight * scale;
        
        // Use fixed height instead of actual model height
        const lightHeight = this.FIXED_LIGHT_HEIGHT;
        
        // Create a rectangular light bulb mesh
        this.createRectangularLightBulb(scene, lightHeight);
        
        // Create spotlight at the same position with adjusted angle
        this.createSpotlight(scene, lightHeight);
        
        // Create collision box
        this.createCollisionBox(scene);
        
        console.log(`Streetlight initialized. Model height: ${actualHeight}, Fixed light height: ${lightHeight}`);
    }

    createSpotlight(scene, lightHeight) {
        // Create spotlight
        this.lightComponent = new BABYLON.SpotLight(
            "streetlight_spot",
            new BABYLON.Vector3(0, lightHeight, this.LIGHT_FORWARD_OFFSET), // Position with forward offset
            new BABYLON.Vector3(0, -Math.cos(this.LIGHT_ANGLE), Math.sin(this.LIGHT_ANGLE)), // Direction vector based on angle
            this.LIGHT_ANGLE,
            2,
            scene
        );
        
        // Parent to the mesh so it follows all transformations
        this.lightComponent.parent = this.mesh;
        this.lightComponent.baseIntensity = 2.0;
        this.lightComponent.intensity = this.lightComponent.baseIntensity;
        this.lightComponent.range = WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
        this.lightComponent.diffuse = new BABYLON.Color3(1, 1, 1); // White light
        this.lightComponent.specular = new BABYLON.Color3(1, 1, 1);
        this.lightComponent.shadowEnabled = false;
    }

    createRectangularLightBulb(scene, lightHeight) {
        // Create a thinner, longer rectangular box to represent the light bulb
        this.lightMesh = BABYLON.MeshBuilder.CreateBox("lightBulb", {
            width: 0.001,   // Width (thin)
            height: 0.06,   // Height (thinnest dimension)
            depth: 0.6,     // Depth (longest dimension)
        }, scene);
        
        // Create an emissive material for the light bulb
        const lightMaterial = new BABYLON.StandardMaterial("lightMaterial", scene);
        lightMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White emissive color
        lightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        lightMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        lightMaterial.disableLighting = true;
        
        // Apply the material to the light bulb
        this.lightMesh.material = lightMaterial;
        
        // Position the light bulb at the top of the streetlight with forward offset
        this.lightMesh.position = new BABYLON.Vector3(0, lightHeight, this.LIGHT_FORWARD_OFFSET);
        
        // Set the initial rotation of the light bulb
        this.lightMesh.rotation = new BABYLON.Vector3(this.LIGHT_ANGLE, Math.PI, Math.PI / 2);
        
        // Parent to the mesh so it follows all transformations
        this.lightMesh.parent = this.mesh;
        
        // Add a point light inside the bulb for additional illumination effect
        const bulbLight = new BABYLON.PointLight("bulbLight", new BABYLON.Vector3(0, 0, 0), scene);
        bulbLight.parent = this.lightMesh;
        bulbLight.intensity = 0.5;
        bulbLight.diffuse = new BABYLON.Color3(1, 1, 1);
        bulbLight.specular = new BABYLON.Color3(1, 1, 1);
        bulbLight.range = 0.5; // Short range, just to illuminate the bulb itself
    }

    createCollisionBox(scene) {
        // Create collision box using the standard dimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("streetlight_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale and position collision box
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }

    dispose() {
        if (this.lightComponent) {
            this.lightComponent.dispose();
        }
        if (this.lightMesh) {
            // Dispose of any materials or child lights
            if (this.lightMesh.material) {
                this.lightMesh.material.dispose();
            }
            // Find and dispose the bulb light if it exists
            const bulbLight = this.lightMesh.getChildMeshes().find(mesh => mesh.name === "bulbLight");
            if (bulbLight) {
                bulbLight.dispose();
            }
            this.lightMesh.dispose();
        }
        if (this.collisionMesh) {
            this.collisionMesh.dispose();
        }
        super.dispose();
    }
}