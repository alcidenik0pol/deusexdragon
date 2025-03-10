import { BaseComponent } from './BaseComponent.js';

export class BuildingComponent extends BaseComponent {
    constructor(id, config) {
        super(id);
        this.config = config;
        this.mesh = null;
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        
        this.createMesh();
        this.setupMesh();
        this.applyMaterial(options.material);
    }

    createMesh() {
        this.mesh = BABYLON.MeshBuilder.CreateBox(this.config.name, {
            height: this.config.height,
            width: this.config.width,
            depth: this.config.depth
        }, this.scene);
        this.collisionMesh = this.mesh;
    }

    setupMesh() {
        if (this.mesh) {
            this.mesh.position = this.position;
            this.mesh.rotationQuaternion = this.rotation;
            this.mesh.scaling = this.scale;
        }
    }

    applyMaterial(material) {
        if (this.mesh && material) {
            this.mesh.material = material;
        }
    }

    setDimensions(width, depth, height) {
        this.config.width = width;
        this.config.depth = depth;
        this.config.height = height;
        
        if (this.mesh) {
            this.mesh.scaling = new BABYLON.Vector3(
                width / this.config.width,
                height / this.config.height,
                depth / this.config.depth
            );
        }
    }

    // Add building-specific functionality
    setHighlight(enabled) {
        if (!this.mesh) return;
        
        if (enabled) {
            const emissiveColor = this.mesh.material.emissiveColor;
            this.mesh.material.emissiveColor = new BABYLON.Color3(
                emissiveColor.r + 0.3,
                emissiveColor.g + 0.3,
                emissiveColor.b + 0.3
            );
        } else {
            this.mesh.material.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
        }
    }
} 