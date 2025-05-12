import { BaseComponent } from './BaseComponent.js';

export class BlinderComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.height = null;
        this.width = null;
        this.thickness = 0.2;
        this.slatHeight = 0.05; // Height of each horizontal slat
        this.slats = []; // Array to store individual slat meshes
        this.materialType = 'solid';
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        this.createBlinderMesh();
        this.setCollision(true);
    }

    createBlinderMesh() {
        if (!this.height || !this.width) {
            console.error('Blinder dimensions not set');
            return;
        }

        // Calculate number of slats needed
        const numberOfSlats = Math.floor(this.height / this.slatHeight);
        
        // Create material (same as wall)
        const material = new BABYLON.StandardMaterial(this.id + "-material", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        material.backFaceCulling = false;
        material.alpha = 1.0;
        material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        material.disableLighting = false;

        // Create individual slats
        for (let i = 0; i < numberOfSlats; i++) {
            const slatMesh = BABYLON.MeshBuilder.CreateBox(
                `${this.id}-slat-${i}`,
                {
                    height: this.slatHeight * 1.02, // Slightly taller to prevent gaps
                    width: this.width,
                    depth: this.thickness
                },
                this.scene
            );

            // Position relative to parent (local coordinates)
            // Adjust position to account for overlap
            slatMesh.position = new BABYLON.Vector3(
                0,
                -(this.height / 2) + (i * this.slatHeight), // Remove the slatHeight/2 offset
                0
            );

            slatMesh.scaling = this.scale;
            slatMesh.material = material.clone(`${this.id}-slat-${i}-material`);
            slatMesh.tagList = ["blinder"];
            
            // Light blocking properties
            slatMesh.isBlocker = true;
            slatMesh.visibility = 1.0;
            slatMesh.blockAllLight = true;
            slatMesh.ignoreCastShadows = false;

            this.slats.push(slatMesh);
        }

        // Create an invisible parent mesh for collision
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox(
            this.id + "-collision",
            {
                height: this.height,
                width: this.width,
                depth: this.thickness
            },
            this.scene
        );
        this.collisionMesh.visibility = 0;
        
        // Create a parent node to hold all meshes
        this.mesh = new BABYLON.TransformNode(this.id, this.scene);
        this.collisionMesh.parent = this.mesh;
        this.slats.forEach(slat => slat.parent = this.mesh);
        
        // Set position and rotation from BaseComponent
        this.mesh.position = this.position;
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
    }

    toggleSlat(index, isVisible) {
        if (index >= 0 && index < this.slats.length) {
            this.slats[index].visibility = isVisible ? 1 : 0;
            this.slats[index].isBlocker = isVisible;
        }
    }

    setRotation(x, y, z) {
        if (this.mesh) {
            this.mesh.rotation = new BABYLON.Vector3(x, y, z);
        }
    }

    getMeshes() {
        return [this.collisionMesh, ...this.slats];
    }
} 