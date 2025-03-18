import { ClusterManager } from '../../lighting/ClusterManager.js';
import { WORLD_CONFIG } from '../../config.js';

export class Singapore6Lighting {
    constructor(scene) {
        this.scene = scene;
        this.clusterManager = new ClusterManager(scene);
        this.hemisphericLight = null;
        this.spotlights = [];
        
        this.scene.ambientColor = BABYLON.Color3.Black();
        this.setupLighting();
        this.setupLightingControls();
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

    registerSpotlight(spotlight) {
        if (spotlight) {
            this.spotlights.push(spotlight);
            
            // Ensure the light has the required properties
            if (spotlight.baseIntensity === undefined) {
                spotlight.baseIntensity = spotlight.intensity || 1.0;
            }
            
            // Make sure range is set
            if (!spotlight.range) {
                spotlight.range = WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE;
            }
            
            this.clusterManager.registerLight(spotlight);
            
            // Also register the projector if it exists
            if (spotlight.parent && spotlight.parent.lightProjector) {
                this.clusterManager.registerLight(spotlight.parent.lightProjector);
            }
            
            console.log(`Registered spotlight at position: ${spotlight.getAbsolutePosition().toString()}`);
            console.log(`Light properties: intensity=${spotlight.intensity}, range=${spotlight.range}`);
        } else {
            console.warn("Attempted to register undefined spotlight");
        }
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
            // Update all spotlights with the new intensity
            this.spotlights.forEach(spotlight => {
                if (spotlight) {
                    spotlight.intensity = value * spotlight.baseIntensity;
                    
                    // Also update the projector if it exists
                    if (spotlight.parent && spotlight.parent.lightProjector) {
                        spotlight.parent.lightProjector.intensity = value * spotlight.baseIntensity * 0.7;
                    }
                    
                    console.log(`Updated spotlight intensity to: ${spotlight.intensity}`);
                }
            });
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
            // Update all spotlights' particle systems
            this.spotlights.forEach(spotlight => {
                if (spotlight && spotlight.parent) {
                    const streetlight = spotlight.parent;
                    if (streetlight.particleSystem) {
                        if (value > 0) {
                            // Only update if particles should be visible based on distance
                            if (streetlight.isParticleActive) {
                                streetlight.particleSystem.emitRate = 30 * value;
                            }
                        } else {
                            streetlight.particleSystem.emitRate = 0;
                        }
                    }
                }
            });
        });
        panel.addControl(particleSlider);
    }

    dispose() {
        if (this.hemisphericLight) {
            this.hemisphericLight.dispose();
        }
        // No need to dispose spotlights here as they're owned by their parent components
    }
} 