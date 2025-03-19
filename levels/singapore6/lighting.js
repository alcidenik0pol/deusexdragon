import { ClusterManager } from '../../lighting/ClusterManager.js';
import { WORLD_CONFIG } from '../../config.js';

export class Singapore6Lighting {
    constructor(scene) {
        this.scene = scene;
        this.lightManager = new ClusterManager(scene, {
            maxActiveLights: 3, // Hard limit based on shader constraints
            debug: true // Enable debug logging temporarily
        });
        this.hemisphericLight = null;
        this.streetlights = [];
        
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
        this.hemisphericLight.intensity = 0.3;
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
        
        console.log(`Registered streetlight at position: ${streetlight.mesh.position.toString()}`);
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
        slider.value = 0.3; // Match default intensity
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
        spotSlider.maximum = 2; // Allow higher intensity
        spotSlider.value = 1.0; // Default value
        spotSlider.height = "20px";
        spotSlider.width = "200px";
        spotSlider.color = "gray";
        spotSlider.background = "white";
        spotSlider.borderColor = "black";
        spotSlider.onValueChangedObservable.add((value) => {
            // Update all streetlights' light properties
            this.streetlights.forEach(streetlight => {
                if (streetlight && streetlight.lightId) {
                    // Update the main spotlight intensity
                    this.lightManager.updateLightProperty(
                        streetlight.lightId, 
                        'intensity', 
                        value * 5.0
                    );
                    
                    // Update the projector intensity
                    if (streetlight.projectorId) {
                        this.lightManager.updateLightProperty(
                            streetlight.projectorId, 
                            'intensity', 
                            value * 4.0
                        );
                    }
                }
            });
            
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

    setupPositionUpdates() {
        // Update light positions when the scene renders
        this.scene.registerBeforeRender(() => {
            // Check if any streetlights have moved and update their light positions
            this.streetlights.forEach(streetlight => {
                if (streetlight && streetlight.mesh) {
                    // Check if the mesh has moved since last update
                    if (!streetlight._lastPosition || 
                        !streetlight.mesh.position.equals(streetlight._lastPosition)) {
                        
                        // Update the light position
                        streetlight.updateLightPosition(this.lightManager);
                        
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
    }
} 