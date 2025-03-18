import { WORLD_CONFIG } from '../config.js';
import { Cluster } from './Cluster.js';

export class ClusterManager {
    constructor(scene) {
        this.scene = scene;
        this.clusters = new Map();
        this.lights = new Set();
        this.setupUpdateLoop();
    }

    getClusterKey(x, y, z) {
        return `${x},${y},${z}`;
    }

    getClusterForPosition(position) {
        const size = WORLD_CONFIG.LIGHTING.CLUSTER_SIZE;
        const x = Math.floor(position.x / size);
        const y = Math.floor(position.y / size);
        const z = Math.floor(position.z / size);
        const key = this.getClusterKey(x, y, z);
        
        if (!this.clusters.has(key)) {
            this.clusters.set(key, new Cluster(x, y, z));
        }
        
        return this.clusters.get(key);
    }

    registerLight(light) {
        if (!light) {
            console.warn("Attempted to register null or undefined light");
            return;
        }
        
        this.lights.add(light);
        this.updateLightClusters(light);
        console.log(`Registered light. Total lights: ${this.lights.size}`);
    }

    updateLightClusters(light) {
        if (!light) return;
        
        try {
            const range = light.range || WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
            const position = light.getAbsolutePosition();
            
            // Calculate affected clusters based on light's position and range
            const minPos = position.subtract(new BABYLON.Vector3(range, range, range));
            const maxPos = position.add(new BABYLON.Vector3(range, range, range));
            
            const minCluster = this.getClusterForPosition(minPos);
            const maxCluster = this.getClusterForPosition(maxPos);
            
            // Add light to all affected clusters
            for (let x = minCluster.x; x <= maxCluster.x; x++) {
                for (let y = minCluster.y; y <= maxCluster.y; y++) {
                    for (let z = minCluster.z; z <= maxCluster.z; z++) {
                        const key = this.getClusterKey(x, y, z);
                        if (!this.clusters.has(key)) {
                            this.clusters.set(key, new Cluster(x, y, z));
                        }
                        this.clusters.get(key).addLight(light);
                    }
                }
            }
        } catch (error) {
            console.error("Error updating light clusters:", error);
        }
    }

    getVisibleClusters(camera) {
        if (!camera) return [];
        
        try {
            // Get the view projection matrix
            const viewMatrix = camera.getViewMatrix();
            const projectionMatrix = camera.getProjectionMatrix();
            const viewProjection = viewMatrix.multiply(projectionMatrix);
            
            // Create frustum planes from the view projection matrix
            const frustumPlanes = BABYLON.Frustum.GetPlanes(viewProjection);
            
            // Filter clusters that are in the frustum
            return Array.from(this.clusters.values()).filter(cluster => {
                // Create a simple array of 8 corners for the bounding box
                const corners = [
                    new BABYLON.Vector3(cluster.bounds.min.x, cluster.bounds.min.y, cluster.bounds.min.z),
                    new BABYLON.Vector3(cluster.bounds.max.x, cluster.bounds.min.y, cluster.bounds.min.z),
                    new BABYLON.Vector3(cluster.bounds.min.x, cluster.bounds.max.y, cluster.bounds.min.z),
                    new BABYLON.Vector3(cluster.bounds.max.x, cluster.bounds.max.y, cluster.bounds.min.z),
                    new BABYLON.Vector3(cluster.bounds.min.x, cluster.bounds.min.y, cluster.bounds.max.z),
                    new BABYLON.Vector3(cluster.bounds.max.x, cluster.bounds.min.y, cluster.bounds.max.z),
                    new BABYLON.Vector3(cluster.bounds.min.x, cluster.bounds.max.y, cluster.bounds.max.z),
                    new BABYLON.Vector3(cluster.bounds.max.x, cluster.bounds.max.y, cluster.bounds.max.z)
                ];
                
                // Check if any corner is inside the frustum
                for (const corner of corners) {
                    let inside = true;
                    for (const plane of frustumPlanes) {
                        if (plane.dotCoordinate(corner) < 0) {
                            inside = false;
                            break;
                        }
                    }
                    if (inside) return true;
                }
                return false;
            });
        } catch (error) {
            console.error("Error getting visible clusters:", error);
            return [];
        }
    }

    setupUpdateLoop() {
        this.scene.registerBeforeRender(() => {
            try {
                const camera = this.scene.activeCamera;
                if (!camera) return;

                // Get visible clusters
                const visibleClusters = this.getVisibleClusters(camera);
                
                // Update light intensities based on distance to camera
                for (const cluster of visibleClusters) {
                    for (const light of cluster.lights) {
                        if (!light) continue;
                        
                        const distance = BABYLON.Vector3.Distance(
                            camera.position,
                            light.getAbsolutePosition()
                        );
                        
                        // Calculate fade factor
                        const fadeStart = WORLD_CONFIG.LIGHTING.LIGHT_FADE_START * WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
                        const fadeEnd = WORLD_CONFIG.LIGHTING.LIGHT_FADE_END * WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
                        const fadeFactor = Math.max(0, Math.min(1, 
                            1 - (distance - fadeStart) / (fadeEnd - fadeStart)
                        ));
                        
                        if (light.baseIntensity !== undefined) {
                            light.intensity = light.baseIntensity * fadeFactor;
                        }
                    }
                }
            } catch (error) {
                console.error("Error in cluster update loop:", error);
            }
        });
    }
} 