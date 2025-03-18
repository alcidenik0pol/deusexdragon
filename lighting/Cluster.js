import { WORLD_CONFIG } from '../config.js';

export class Cluster {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.lights = new Set();
        this.bounds = this.calculateBounds();
        
        // Create a proper BoundingBox for frustum checks
        this.boundingBox = new BABYLON.BoundingBox(this.bounds.min, this.bounds.max);
    }

    calculateBounds() {
        const size = WORLD_CONFIG.LIGHTING.CLUSTER_SIZE;
        return {
            min: new BABYLON.Vector3(
                this.x * size,
                this.y * size,
                this.z * size
            ),
            max: new BABYLON.Vector3(
                (this.x + 1) * size,
                (this.y + 1) * size,
                (this.z + 1) * size
            )
        };
    }

    containsPoint(point) {
        return (
            point.x >= this.bounds.min.x && point.x < this.bounds.max.x &&
            point.y >= this.bounds.min.y && point.y < this.bounds.max.y &&
            point.z >= this.bounds.min.z && point.z < this.bounds.max.z
        );
    }

    addLight(light) {
        if (this.lights.size < WORLD_CONFIG.LIGHTING.MAX_LIGHTS_PER_CLUSTER) {
            this.lights.add(light);
            return true;
        }
        return false;
    }

    removeLight(light) {
        return this.lights.delete(light);
    }
} 