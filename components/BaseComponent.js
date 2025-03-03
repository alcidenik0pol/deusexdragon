export class BaseComponent {
    constructor(id) {
        this.id = id;
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.rotation = new BABYLON.Quaternion();
        this.scale = new BABYLON.Vector3(1, 1, 1);
        this.isVisible = true;
        this.collisionMesh = null;
        this.parentNode = null;
        this.attachPoints = [];
    }

    initialize(scene, options = {}) {
        this.scene = scene;
        Object.assign(this, options);
    }

    attach(targetComponent, myAttachPoint, targetAttachPoint) {
        if (!this.attachPoints.includes(myAttachPoint) || 
            !targetComponent.attachPoints.includes(targetAttachPoint)) {
            throw new Error('Invalid attach points');
        }
        // Implementation for attaching components
    }

    detach() {
        // Implementation for detaching components
    }

    setVisible(visible) {
        this.isVisible = visible;
        if (this.mesh) {
            this.mesh.setEnabled(visible);
        }
    }

    setCollision(enabled) {
        if (this.collisionMesh) {
            this.collisionMesh.checkCollisions = enabled;
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.collisionMesh && this.collisionMesh !== this.mesh) {
            this.collisionMesh.dispose();
        }
    }
} 