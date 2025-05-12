import { FloorComponent } from './FloorComponent.js';

export class CeilingComponent extends FloorComponent {
    constructor(id) {
        super(id);
        // Only add properties specific to ceilings
        this.type = 'solid';  // solid, drop, glass
        this.openings = [];
        this.occlusionBehavior = 'fade';  // fade, hide, partial
    }

    createCeilingMesh() {
        // Reuse floor's mesh creation
        super.createFloorMesh();
        
        // But ALWAYS rotate it to face downward - this is what makes it a ceiling!
        this.mesh.rotation.x = Math.PI;
    }

    setColors(bottomColor, topColor, alpha = 1.0) {
        if (!this.scene || !this.mesh) return;
        
        const material = new BABYLON.StandardMaterial(this.id + "-material", this.scene);
        material.diffuseColor = bottomColor;  // Bottom face (what we see)
        material.backFaceCulling = false;
        material.twoSidedLighting = true;
        material.backFaceColor = topColor;    // Top face (above ceiling)
        material.alpha = alpha;
        
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