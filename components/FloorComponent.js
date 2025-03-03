import { BaseComponent } from './BaseComponent.js';

export class FloorComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.length = 10;
        this.width = 10;
        this.thickness = 0.1;
        this.materialType = 'tile';
        this.decals = [];
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        this.createFloorMesh();
    }

    createFloorMesh() {
        this.mesh = BABYLON.MeshBuilder.CreateGround(this.id, {
            width: this.width,
            height: this.length
        }, this.scene);

        this.mesh.position = this.position;
        this.collisionMesh = this.mesh;
    }

    addDecal(texture, position, rotation, scale) {
        // Implementation for adding decals
    }

    setTiling(xTiles, yTiles) {
        if (this.mesh.material && this.mesh.material.diffuseTexture) {
            this.mesh.material.diffuseTexture.uScale = xTiles;
            this.mesh.material.diffuseTexture.vScale = yTiles;
        }
    }
} 