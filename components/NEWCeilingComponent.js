import { BaseComponent } from './BaseComponent.js';

export class CeilingComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.width = 20;
        this.length = 20;
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        
        // Create a simple plane
        this.mesh = BABYLON.MeshBuilder.CreatePlane(this.id, {
            width: 20,
            height: 20
        }, scene);

        // Rotate 90 degrees around X axis to make it horizontal
        this.mesh.rotation.x = Math.PI / 2;
        
        // Set its position (using BaseComponent's position)
        this.mesh.position = this.position;

        // Make it RED - simple as that!
        const material = new BABYLON.StandardMaterial(this.id + "-material", scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);  // Pure red
        material.backFaceCulling = false;  // Show both sides
        this.mesh.material = material;

        // Set up collision
        this.collisionMesh = this.mesh;
        this.setCollision(true);  // Enable collisions by default
    }
} 