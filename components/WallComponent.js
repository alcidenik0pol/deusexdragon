import { BaseComponent } from './BaseComponent.js';

export class WallComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.height = 3;
        this.width = 4;
        this.thickness = 0.2;
        this.hasOpenings = false;
        this.openings = [];
        this.materialType = 'drywall';
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        this.createWallMesh();
    }

    createWallMesh() {
        this.mesh = BABYLON.MeshBuilder.CreateBox(this.id, {
            height: this.height,
            width: this.width,
            depth: this.thickness
        }, this.scene);

        this.mesh.position = this.position;
        
        // Use rotation instead of rotationQuaternion
        this.mesh.rotation = new BABYLON.Vector3(0, 0, 0);
        this.mesh.scaling = this.scale;

        this.collisionMesh = this.mesh;
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