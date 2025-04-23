import { ClusterManager } from '../../src/lighting/ClusterManager.js';
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
        // Create GUI for light control
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("LightingUI");

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.top = "-25px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        adt.addControl(panel);

        const header = new BABYLON.GUI.TextBlock();
        header.text = "Ambient Light";
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = 0.2;
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "gray";
        slider.background = "white";
        slider.borderColor = "black";
        slider.onValueChangedObservable.add((value) => {
            if (this.hemisphericLight) {
                this.hemisphericLight.intensity = value;
            }
        });
        panel.addControl(slider);

        // Add spotlight intensity control
        const spotHeader = new BABYLON.GUI.TextBlock();
        spotHeader.text = "Spotlight Intensity";
        spotHeader.height = "30px";
        spotHeader.color = "white";
        panel.addControl(spotHeader);

        const spotSlider = new BABYLON.GUI.Slider();
        spotSlider.minimum = 0;
        spotSlider.maximum = 2;
        spotSlider.value = 0.7;
        spotSlider.height = "20px";
        spotSlider.width = "200px";
        spotSlider.color = "gray";
        spotSlider.background = "white";
        spotSlider.borderColor = "black";
        spotSlider.onValueChangedObservable.add((value) => {
            // Update all streetlights' light properties
            this.streetlights.forEach(streetlight => {
                if (streetlight && streetlight.lightId) {
                    // Update the main spotlight intensity with reduced base value
                    this.lightManager.updateLightProperty(
                        streetlight.lightId, 
                        'intensity', 
                        value * 3.0
                    );
                    
                    // Update the projector intensity with reduced base value
                    if (streetlight.projectorId) {
                        this.lightManager.updateLightProperty(
                            streetlight.projectorId, 
                            'intensity', 
                            value * 2.0
                        );
                    }
                }
            });
            
            // Update light pool intensity
            this.updateLightPoolIntensity(value);
            
            // Force light manager to update
            this.lightManager.updateLights();
        });
        panel.addControl(spotSlider);

        // Add particle visibility control
        const particleHeader = new BABYLON.GUI.TextBlock();
        particleHeader.text = "Dust Particles";
        particleHeader.height = "30px";
        particleHeader.color = "white";
        panel.addControl(particleHeader);
        
        const particleSlider = new BABYLON.GUI.Slider();
        particleSlider.minimum = 0;
        particleSlider.maximum = 1;
        particleSlider.value = 1.0; // Default value
        particleSlider.height = "20px";
        particleSlider.width = "200px";
        particleSlider.color = "gray";
        particleSlider.background = "white";
        particleSlider.borderColor = "black";
        particleSlider.onValueChangedObservable.add((value) => {
            // Update all streetlights' particle systems
            this.streetlights.forEach(streetlight => {
                if (streetlight && streetlight.particleSystem) {
                    if (value > 0) {
                        // Only update if particles should be visible based on distance
                        if (streetlight.isParticleActive) {
                            streetlight.particleSystem.emitRate = 30 * value;
                        }
                    } else {
                        streetlight.particleSystem.emitRate = 0;
                    }
                }
            });
        });
        panel.addControl(particleSlider);
    }
    
    updateLightPoolIntensity(intensity) {
        // Update all light pools based on the intensity value
        this.lightPools.forEach(pool => {
            if (pool.material) {
                // Adjust alpha based on intensity
                pool.material.alpha = pool.baseAlpha * intensity;
                
                // Adjust emissive color intensity
                const scaledIntensity = 0.7 + (intensity * 0.3); // Scale between 0.7 and 1.0
                pool.material.emissiveColor = new BABYLON.Color3(
                    1.0 * scaledIntensity,
                    0.98 * scaledIntensity,
                    0.9 * scaledIntensity
                );
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