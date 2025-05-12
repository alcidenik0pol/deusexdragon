import { BaseComponent } from './BaseComponent.js';

export class WallComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.height = null;
        this.width = null;
        this.thickness = 0.2;
        this.hasOpenings = false;
        this.openings = [];
        this.materialType = 'solid';
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        this.createWallMesh();
        this.setCollision(true);  // Enable collisions by default
    }

    createWallMesh() {
        if (!this.height || !this.width) {
            console.error('Wall dimensions not set');
            return;
        }

        this.mesh = BABYLON.MeshBuilder.CreateBox(this.id, {
            height: this.height,
            width: this.width,
            depth: this.thickness
        }, this.scene);

        // Add wall tag using the correct Babylon.js property
        this.mesh.tagList = ["wall"];
        
        this.mesh.position = this.position;
        
        // Use rotation instead of rotationQuaternion
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
        this.mesh.scaling = this.scale;

        // Create solid material by default
        const material = new BABYLON.StandardMaterial(this.id + "-material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.backFaceCulling = false;
        
        // Ensure the material is completely opaque and blocks all light
        material.alpha = 1.0;
        material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        material.disableLighting = false;
        
        // Make sure the mesh blocks all light
        this.mesh.isBlocker = true;  // Marks mesh as a light blocker
        this.mesh.visibility = 1.0;   // Fully visible
        this.mesh.blockAllLight = true; // Additional light blocking property
        this.mesh.ignoreCastShadows = false; // Ensure shadows are cast
        
        this.mesh.material = material;
        this.collisionMesh = this.mesh;
    }

    // Method to optionally make the wall transparent (for glass walls)
    setTransparent(isTransparent = true) {
        if (!this.mesh || !this.mesh.material) return;
        
        const material = this.mesh.material;
        if (isTransparent) {
            material.alpha = 0.3;
            material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            this.mesh.isBlocker = false;
        } else {
            material.alpha = 1.0;
            material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
            this.mesh.isBlocker = true;
        }
    }

    setRotation(x, y, z) {
        if (this.mesh) {
            this.mesh.rotation = new BABYLON.Vector3(x, y, z);
        }
    }

    addOpening(position, width, height) {
        this.openings.push({ position, width, height });
        // Implementation for creating CSG operations for openings
    }

    getMeshes() {
        return [this.mesh];
    }
} 