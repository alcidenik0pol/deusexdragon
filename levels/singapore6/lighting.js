import { ClusterManager } from '../../fx/lighting/ClusterManager.js';
import { WORLD_CONFIG } from '../../config/config.js';

export class Singapore6Lighting {
    constructor(scene) {
        this.scene = scene;
        this.lightManager = new ClusterManager(scene, {
            maxActiveLights: 3, // Hard limit based on shader constraints
            debug: true // Enable debug logging temporarily
        });
        this.hemisphericLight = null;
        this.streetlights = [];
        this.lightPools = []; // Store references to light pool meshes
        
        this.scene.ambientColor = BABYLON.Color3.Black();
        this.setupLighting();
        this.setupLightingControls();
        
        // Register a scene observer to update light positions when objects move
        this.setupPositionUpdates();
    }

    setupLighting() {
        this.hemisphericLight = new BABYLON.HemisphericLight(
            "mainLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.hemisphericLight.intensity = 0.2;
        this.hemisphericLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Add some ground color
        this.hemisphericLight.specular = new BABYLON.Color3(0, 0, 0);
    }

    registerStreetlight(streetlight) {
        if (!streetlight) {
            console.warn("Attempted to register undefined streetlight");
            return;
        }
        
        // Register the streetlight with the light manager
        streetlight.registerWithLightingSystem(this.lightManager);
        
        // Store the streetlight for later updates
        this.streetlights.push(streetlight);
        
        // Create a light pool on the ground for this streetlight
        this.createLightPool(streetlight);
        
        console.log(`Registered streetlight at position: ${streetlight.mesh.position.toString()}`);
    }

    createLightPool(streetlight) {
        if (!streetlight || !streetlight.mesh) return;
        
        // Get the streetlight's position
        const position = streetlight.mesh.position.clone();
        
        // Create a disc for the light pool
        const lightPool = BABYLON.MeshBuilder.CreateDisc("lightPool", {
            radius: 3.0, // Size of the light pool
            tessellation: 64 // Smooth edges
        }, this.scene);
        
        // Position the light pool on the ground (y=0) below the streetlight
        lightPool.position = new BABYLON.Vector3(position.x, 0.01, position.z); // Slightly above ground to prevent z-fighting
        
        // Rotate the light pool to lie flat on the ground
        lightPool.rotation = new BABYLON.Vector3(Math.PI/2, 0, 0);
        
        // Create a material for the light pool
        const lightPoolMaterial = new BABYLON.StandardMaterial("lightPoolMaterial", this.scene);
        
        // Make it emissive to simulate light
        lightPoolMaterial.emissiveColor = new BABYLON.Color3(1.0, 0.98, 0.9); // Warm white color
        
        // Make it semi-transparent
        lightPoolMaterial.alpha = 0.3;
        
        // Disable lighting effects on the material
        lightPoolMaterial.disableLighting = true;
        
        // Apply the material
        lightPool.material = lightPoolMaterial;
        
        // Store reference to the light pool with its associated streetlight
        this.lightPools.push({
            mesh: lightPool,
            streetlight: streetlight,
            material: lightPoolMaterial,
            baseAlpha: 0.3 // Store the base alpha value for intensity adjustments
        });
        
        // Add a gradient texture to make the light pool fade out at the edges
        this.applyGradientTexture(lightPoolMaterial);
    }
    
    applyGradientTexture(material) {
        // Create a dynamic texture for the gradient
        const gradientTexture = new BABYLON.DynamicTexture("lightPoolGradient", 256, this.scene, false);
        const ctx = gradientTexture.getContext();
        
        // Create a radial gradient
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.7)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0.0)");
        
        // Fill with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        
        // Update the texture
        gradientTexture.update();
        
        // Apply as opacity map
        material.opacityTexture = gradientTexture;
        
        // Store for disposal
        material.gradientTexture = gradientTexture;
    }

    setupLightingControls() {
        // Remove this entire method - it's no longer needed
    }

    updateLightPoolIntensity(intensity) {
        // Update all light pools based on the intensity value
        this.lightPools.forEach(pool => {
            if (pool.material) {
                // Set fixed values instead of using slider-controlled intensity
                pool.material.alpha = pool.baseAlpha;
                pool.material.emissiveColor = new BABYLON.Color3(1.0, 0.98, 0.9);
            }
        });
    }

    setupPositionUpdates() {
        // Update light positions when the scene renders
        this.scene.registerBeforeRender(() => {
            // Check if any streetlights have moved and update their light positions
            this.streetlights.forEach((streetlight, index) => {
                if (streetlight && streetlight.mesh) {
                    // Check if the mesh has moved since last update
                    if (!streetlight._lastPosition || 
                        !streetlight.mesh.position.equals(streetlight._lastPosition)) {
                        
                        // Update the light position
                        streetlight.updateLightPosition(this.lightManager);
                        
                        // Update the light pool position
                        if (this.lightPools[index] && this.lightPools[index].mesh) {
                            const position = streetlight.mesh.position;
                            this.lightPools[index].mesh.position.x = position.x;
                            this.lightPools[index].mesh.position.z = position.z;
                        }
                        
                        // Store the current position for next comparison
                        streetlight._lastPosition = streetlight.mesh.position.clone();
                    }
                }
            });
        });
    }

    dispose() {
        if (this.hemisphericLight) {
            this.hemisphericLight.dispose();
        }
        
        // Dispose of all light pools
        this.lightPools.forEach(pool => {
            if (pool.material) {
                if (pool.material.gradientTexture) {
                    pool.material.gradientTexture.dispose();
                }
                pool.material.dispose();
            }
            if (pool.mesh) {
                pool.mesh.dispose();
            }
        });
    }
} 