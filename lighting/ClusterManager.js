import { WORLD_CONFIG } from '../config.js';

export class ClusterManager {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.lightRegistry = new Map(); // Store light properties instead of actual lights
        this.activeLights = [];
        this.MAX_ACTIVE_LIGHTS = options.maxActiveLights || 
                                WORLD_CONFIG.LIGHTING.MAX_LIGHTS_PER_MESH || 3;
        
        // Create a fixed pool of lights that will be repositioned
        this.createLightPool();
        
        // Set up update loop
        this.setupUpdateLoop();
        
        // Debug mode
        this.debug = options.debug || false;
    }
    
    createLightPool() {
        // Create a fixed pool of lights (the maximum number allowed by shaders)
        this.activeLights = [];
        
        for (let i = 0; i < this.MAX_ACTIVE_LIGHTS; i++) {
            // Create a point light that we'll reposition as needed
            const light = new BABYLON.PointLight(`poolLight_${i}`, new BABYLON.Vector3(0, 0, 0), this.scene);
            light.intensity = 0; // Start with zero intensity
            light.range = WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
            light.diffuse = new BABYLON.Color3(1, 0.98, 0.92); // Warm white
            light.specular = new BABYLON.Color3(0.5, 0.5, 0.5);
            
            this.activeLights.push(light);
        }
        
        console.log(`Created light pool with ${this.activeLights.length} lights`);
    }
    
    registerLight(lightProperties) {
        if (!lightProperties || !lightProperties.position) {
            console.warn("Attempted to register invalid light properties");
            return null;
        }
        
        // Generate a unique ID for this light
        const lightId = `light_${this.lightRegistry.size}`;
        
        // Store the light properties in our registry
        this.lightRegistry.set(lightId, {
            position: lightProperties.position.clone(),
            intensity: lightProperties.intensity || 1.0,
            diffuse: lightProperties.diffuse ? lightProperties.diffuse.clone() : new BABYLON.Color3(1, 1, 1),
            specular: lightProperties.specular ? lightProperties.specular.clone() : new BABYLON.Color3(0.5, 0.5, 0.5),
            range: lightProperties.range || WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE,
            type: lightProperties.type || 'point',
            direction: lightProperties.direction ? lightProperties.direction.clone() : null,
            angle: lightProperties.angle || Math.PI/4
        });
        
        console.log(`Registered light properties. Total registered: ${this.lightRegistry.size}`);
        return lightId;
    }
    
    unregisterLight(lightId) {
        if (!lightId || !this.lightRegistry.has(lightId)) return;
        
        this.lightRegistry.delete(lightId);
        console.log(`Unregistered light. Total registered: ${this.lightRegistry.size}`);
    }
    
    updateLightProperty(lightId, property, value) {
        if (!lightId || !this.lightRegistry.has(lightId)) return;
        
        const lightProps = this.lightRegistry.get(lightId);
        
        // Handle special cases for vector properties
        if (property === 'position' || property === 'direction') {
            if (value && value.clone) {
                lightProps[property] = value.clone();
            }
        } else {
            // For simple properties like intensity, diffuse, etc.
            if (property === 'diffuse' || property === 'specular') {
                if (value && value.clone) {
                    lightProps[property] = value.clone();
                }
            } else {
                lightProps[property] = value;
            }
        }
    }
    
    updateLights() {
        const camera = this.scene.activeCamera;
        if (!camera) return;
        
        try {
            // Get all registered lights as array with their IDs
            const allLights = Array.from(this.lightRegistry.entries()).map(([id, props]) => ({
                id,
                ...props
            }));
            
            if (this.debug) {
                // console.log(`Total registered lights: ${allLights.length}`);
                allLights.forEach((light, i) => {
                    // console.log(`Light ${i}: pos=${light.position.toString()}, type=${light.type}`);
                });
            }
            
            // Calculate distance and check if light is in front of camera
            allLights.forEach(light => {
                if (!light.position) {
                    console.warn(`Light ${light.id} has no position!`, light);
                    light.distance = Infinity;
                    light.inFrustum = false;
                    return;
                }
                
                // Calculate vector from camera to light
                const cameraToLight = light.position.subtract(camera.position);
                
                // Calculate dot product with camera direction to check if light is in front
                const cameraDirVector = camera.getDirection(BABYLON.Vector3.Forward());
                const dotProduct = BABYLON.Vector3.Dot(cameraDirVector, cameraToLight.normalize());
                
                // Light is in front of camera if dot product is positive
                light.inFrustum = dotProduct > 0;
                
                // Calculate distance (used for sorting)
                light.distance = BABYLON.Vector3.Distance(camera.position, light.position);
            });
            
            // Filter lights that are actually close enough to matter
            const visibleLights = allLights.filter(light => {
                return light.distance < (light.range || WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE) * 1.5;
            });
            
            // First prioritize lights in the camera frustum, then by distance
            visibleLights.sort((a, b) => {
                // First sort by whether they're in the frustum
                if (a.inFrustum && !b.inFrustum) return -1;
                if (!a.inFrustum && b.inFrustum) return 1;
                
                // Then sort by distance
                return a.distance - b.distance;
            });
            
            // Use only the top N lights (our pool size)
            const topLights = visibleLights.slice(0, this.MAX_ACTIVE_LIGHTS);
            
            if (this.debug || true) { // Always log for now to help debug
                // console.log(`Active lights: ${topLights.length}/${allLights.length} (visible: ${visibleLights.length})`);
                topLights.forEach((light, index) => {
                    // console.log(`Light ${index}: ID=${light.id}, Distance=${light.distance.toFixed(2)}, InFrustum=${light.inFrustum}, Position=${light.position.toString()}`);
                });
            }
            
            // Reposition and configure our pool lights to match the top lights
            for (let i = 0; i < this.activeLights.length; i++) {
                const poolLight = this.activeLights[i];
                
                if (i < topLights.length) {
                    // We have a registered light to use
                    const sourceLight = topLights[i];
                    
                    // Copy position and properties
                    poolLight.position.copyFrom(sourceLight.position);
                    // Reduce intensity by 40% for a more subtle effect
                    poolLight.intensity = sourceLight.intensity * 0.6;
                    poolLight.diffuse.copyFrom(sourceLight.diffuse);
                    poolLight.specular.copyFrom(sourceLight.specular);
                    poolLight.range = sourceLight.range;
                    
                    // For spotlights, try to approximate with point light
                    if (sourceLight.type === 'spot' && sourceLight.direction) {
                        // Create a spotlight instead of point light if needed
                        if (poolLight.getClassName() !== "SpotLight") {
                            // We can't change light type at runtime, so we'll just approximate
                            // Reduce range to approximate spotlight falloff
                            poolLight.range *= 0.7;
                            // Increase intensity to compensate for smaller area
                            poolLight.intensity *= 1.2;
                        } else {
                            // If it's already a spotlight, set direction
                            poolLight.direction = sourceLight.direction.clone();
                            poolLight.angle = sourceLight.angle || Math.PI/4;
                        }
                    }
                } else {
                    // No registered light for this pool light, turn it off
                    poolLight.intensity = 0;
                }
            }
        } catch (error) {
            console.error("Error updating lights:", error);
        }
    }
    
    setupUpdateLoop() {
        // Use a less frequent update for light selection to improve performance
        let frameCount = 0;
        const UPDATE_FREQUENCY = 10; // Update every 10 frames
        
        this.scene.registerBeforeRender(() => {
            try {
                // Only update periodically to save performance
                frameCount++;
                if (frameCount >= UPDATE_FREQUENCY) {
                    this.updateLights();
                    frameCount = 0;
                }
            } catch (error) {
                console.error("Error in update loop:", error);
            }
        });
    }
}