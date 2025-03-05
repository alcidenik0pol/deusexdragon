import { BaseComponent } from './BaseComponent.js';

export class CeilingComponent extends BaseComponent {
    constructor(id) {
        super(id);
        this.length = 10;
        this.width = 10;
        this.height = 3;
        this.type = 'solid';  // solid, drop, glass
        this.openings = [];
        this.occlusionBehavior = 'fade';  // fade, hide, partial
    }

    initialize(scene, options = {}) {
        super.initialize(scene, options);
        this.createCeilingMesh();
    }

    createCeilingMesh() {
        this.mesh = BABYLON.MeshBuilder.CreateGround(this.id, {
            width: this.width,
            height: this.length
        }, this.scene);

        this.mesh.position = new BABYLON.Vector3(
            this.position.x,
            this.height,
            this.position.z
        );
        this.mesh.rotation = new BABYLON.Vector3(Math.PI, 0, 0);
        
        // Create default material
        const material = new BABYLON.StandardMaterial(`${this.id}-material`, this.scene);
        material.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        this.mesh.material = material;
    }

    setOcclusionBehavior(type) {
        this.occlusionBehavior = type;
        // Implementation for occlusion behavior
    }

    addLightFixture(position, type) {
        const light = new BABYLON.PointLight(`${this.id}-light-${this.openings.length}`, 
            position, this.scene);
        light.intensity = 0.7;
        this.openings.push({ light, type, position });
    }
} 