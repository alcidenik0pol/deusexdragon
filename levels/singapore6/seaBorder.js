import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config.js';
import { LevelGenerator } from '../../levelGenerator.js';
import { WaterArea } from './water.js';

export class SeaBorder extends BaseComponent {
    constructor(id) {
        super(id || 'sea_border');
        this.waterComponent = null;
    }

    async initialize(scene, options = {}) {
        await super.initialize(scene, options);
        
        // Create the water component for this sea border
        this.waterComponent = new WaterArea();
        await this.waterComponent.initialize(scene, {
            x_length: options.x_length || 160,
            z_length: options.z_length || 160
        });
    }

    // Position the sea border at the specified world coordinates
    setWorldPosition(x, z) {
        if (this.waterComponent) {
            this.waterComponent.setWorldPosition(x, z);
        }
        
        // Update component position
        this.position = new BABYLON.Vector3(x, 0, z);
    }

    // Create a sea border of a specific type
    createSeaBorder(type) {
        // Different types of sea borders can have different appearances
        // For now, we're just using the water component
        console.log(`Created sea border of type: ${type}`);
    }
}
