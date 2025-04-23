export class RainEffect4 {
    constructor(scene, camera, config) {
        this.scene = scene;
        this.camera = camera;
        this.config = {
            // Visual settings
            updateSpeed: 0.1,        // Controls animation speed
            emitterOffset: new BABYLON.Vector3(0, 10, 0), // Offset from camera
            
            ...config
        };
        
        this.isActive = false;
        this.particleSet = null;
        this.cameraObserver = null;
    }

    async start() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        try {
            // Create the rain particle system using ParticleHelper
            this.particleSet = await BABYLON.ParticleHelper.CreateAsync("rain", this.scene, false);
            
            if (!this.particleSet || !this.particleSet.systems || this.particleSet.systems.length === 0) {
                console.error("Failed to create rain particle system");
                return;
            }
            
            // Configure the particle systems
            for (const system of this.particleSet.systems) {
                // Set update speed
                system.updateSpeed = this.config.updateSpeed;
                
                // Position initially at camera
                system.emitter = this.camera.position.clone().add(this.config.emitterOffset);
            }
            
            // Start the particle systems
            this.particleSet.start();
            
            // Add observer to update emitter position to follow camera
            this.cameraObserver = this.scene.onBeforeRenderObservable.add(() => {
                if (this.isActive && this.particleSet && this.camera) {
                    for (const system of this.particleSet.systems) {
                        // Update emitter to follow camera with offset
                        system.emitter.x = this.camera.position.x;
                        system.emitter.z = this.camera.position.z;
                        system.emitter.y = this.camera.position.y + this.config.emitterOffset.y;
                    }
                }
            });
            
            console.log("RainEffect4 started with ParticleHelper");
        } catch (error) {
            console.error("Error creating rain effect:", error);
        }
    }
    
    update() {
        // Most updates are handled by the particle system itself
        // and the camera position is updated in the observer
    }
    
    dispose() {
        this.isActive = false;
        
        // Remove the observer
        if (this.cameraObserver) {
            this.scene.onBeforeRenderObservable.remove(this.cameraObserver);
            this.cameraObserver = null;
        }
        
        // Dispose of the particle systems
        if (this.particleSet) {
            this.particleSet.dispose();
            this.particleSet = null;
        }
        
        console.log("RainEffect4 disposed");
    }
} 