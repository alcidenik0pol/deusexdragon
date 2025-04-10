import { BaseComponent } from '../../components/BaseComponent.js';

export class Car03 extends BaseComponent {
    constructor() {
        super('car03');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'car03');
        
        // Handle rotation properly using Quaternion
        if (options.rotation) {
            this.rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, options.rotation);
            this.mesh.rotationQuaternion = this.rotation;
        }

        // Override BaseComponent's floor positioning for flying cars
        this.position.y = options.height || 67.5; // Default to original height if none specified
        this.mesh.position = this.position;
        
        return this;
    }

    // Override BaseComponent's setWorldPosition to maintain flying height
    setWorldPosition(x, z) {
        const currentHeight = this.position.y; // Preserve height
        this.position = new BABYLON.Vector3(x, currentHeight, z);
        if (this.mesh) {
            this.mesh.position = this.position;
        }
    }
}