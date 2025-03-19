import { WORLD_CONFIG } from '../config.js';

export class Cluster {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.lights = [];  // Changed from Set to Array for prioritization
        this.bounds = this.calculateBounds();
        
        // Create a proper BoundingBox for frustum checks with correctly initialized vectors
        this.boundingBox = new BABYLON.BoundingBox(this.bounds.min, this.bounds.max);
        // Initialize vectorsWorld which is required for IsInFrustum
        this.boundingBox.vectorsWorld = [
            new BABYLON.Vector3(this.bounds.min.x, this.bounds.min.y, this.bounds.min.z),
            new BABYLON.Vector3(this.bounds.max.x, this.bounds.min.y, this.bounds.min.z),
            new BABYLON.Vector3(this.bounds.min.x, this.bounds.max.y, this.bounds.min.z),
            new BABYLON.Vector3(this.bounds.max.x, this.bounds.max.y, this.bounds.min.z),
            new BABYLON.Vector3(this.bounds.min.x, this.bounds.min.y, this.bounds.max.z),
            new BABYLON.Vector3(this.bounds.max.x, this.bounds.min.y, this.bounds.max.z),
            new BABYLON.Vector3(this.bounds.min.x, this.bounds.max.y, this.bounds.max.z),
            new BABYLON.Vector3(this.bounds.max.x, this.bounds.max.y, this.bounds.max.z)
        ];
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
        // Don't add duplicates
        if (this.lights.includes(light)) return true;
        
        // Add the light to the array
        this.lights.push(light);
        
        // Sort lights by importance (intensity * range)
        this.sortLightsByImportance();
        
        // Keep only the most important lights up to the maximum
        if (this.lights.length > WORLD_CONFIG.LIGHTING.MAX_LIGHTS_PER_CLUSTER) {
            this.lights.length = WORLD_CONFIG.LIGHTING.MAX_LIGHTS_PER_CLUSTER;
            return false;
        }
        return true;
    }

    sortLightsByImportance() {
        this.lights.sort((a, b) => {
            // Calculate importance as intensity * range
            const importanceA = (a.intensity || 1) * (a.range || WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE);
            const importanceB = (b.intensity || 1) * (b.range || WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE);
            // Sort in descending order (most important first)
            return importanceB - importanceA;
        });
    }

    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index !== -1) {
            this.lights.splice(index, 1);
            return true;
        }
        return false;
    }

    // New method to check if the cluster intersects with a frustum
    intersectsFrustum(frustumPlanes) {
        return BABYLON.BoundingBox.IsInFrustum(this.boundingBox.vectorsWorld, frustumPlanes);
    }
} 