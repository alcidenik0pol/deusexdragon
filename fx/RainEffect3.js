export class RainEffect3 {
    constructor(scene, camera, config) {
        this.scene = scene;
        this.camera = camera;
        this.config = {
            // Visual settings
            intensity: 1.0,          // Rain intensity
            speed: 120,              // Very fast falling speed
            angle: 0.3,              // Angle for wind effect (in radians)
            color: new BABYLON.Color3(0.5, 0.5, 0.6), // Lighter color to be more visible
            alpha: 0.8,              // Higher alpha for visibility
            
            // Performance settings
            particleCount: 8000,     // More particles for visibility
            emitterRadius: 60,       // Smaller radius for denser rain
            particleSize: 0.5,       // Larger particles
            
            ...config
        };
        
        this.isActive = false;
        this.particleSystem = null;
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        
        // Create a particle system
        this.particleSystem = new BABYLON.ParticleSystem("rainParticles", this.config.particleCount, this.scene);
        
        // Create a simple texture for raindrops - a stretched white rectangle
        const rainTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAICAYAAAA4GpVBAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYSURBVBhXY/j//z8DAwMDAxMDFMZgYAAAzNcEAcgQJwoAAAAASUVORK5CYII=", this.scene);
        this.particleSystem.particleTexture = rainTexture;
        
        // Where the particles come from - will be updated to follow camera
        this.particleSystem.emitter = this.camera.position.clone();
        this.particleSystem.emitter.y += 30; // Start above camera
        
        // Emission area - wider but not as tall
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-this.config.emitterRadius, 0, -this.config.emitterRadius);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(this.config.emitterRadius, 5, this.config.emitterRadius);
        
        // Colors
        this.particleSystem.color1 = this.config.color;
        this.particleSystem.color2 = this.config.color;
        this.particleSystem.colorDead = this.config.color;
        
        // Size and lifetime
        this.particleSystem.minSize = this.config.particleSize * 0.7;
        this.particleSystem.maxSize = this.config.particleSize * 1.3;
        this.particleSystem.minLifeTime = 0.3; // Shorter lifetime
        this.particleSystem.maxLifeTime = 0.6; // Shorter lifetime
        
        // Emission rate - much higher for visibility
        this.particleSystem.emitRate = this.config.particleCount;
        
        // Blend mode
        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        // Set gravity - this creates the falling effect
        // Use angle to create wind effect
        const gravityDirection = new BABYLON.Vector3(
            Math.sin(this.config.angle) * this.config.speed,
            -this.config.speed,
            0
        );
        this.particleSystem.gravity = gravityDirection;
        
        // Direction
        this.particleSystem.direction1 = new BABYLON.Vector3(0, -1, 0);
        this.particleSystem.direction2 = new BABYLON.Vector3(0, -1, 0);
        
        // Angular speed
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = 0;
        
        // Speed
        this.particleSystem.minEmitPower = this.config.speed * 0.8;
        this.particleSystem.maxEmitPower = this.config.speed * 1.2;
        this.particleSystem.updateSpeed = 0.005;
        
        // Alpha (transparency)
        this.particleSystem.minAlpha = this.config.alpha * 0.7;
        this.particleSystem.maxAlpha = this.config.alpha;
        
        // Start the particle system
        this.particleSystem.start();
        
        // Add an observer to update the emitter position to follow the camera
        this.cameraObserver = this.scene.onBeforeRenderObservable.add(() => {
            if (this.isActive && this.particleSystem && this.camera) {
                // Update emitter to follow camera
                this.particleSystem.emitter.x = this.camera.position.x;
                this.particleSystem.emitter.z = this.camera.position.z;
                this.particleSystem.emitter.y = this.camera.position.y + 30; // Keep above camera
            }
        });
        
        console.log("RainEffect3 started with particle system");
    }
    
    update() {
        // Most updates are handled by the particle system itself
    }
    
    dispose() {
        this.isActive = false;
        
        // Remove the observer
        if (this.cameraObserver) {
            this.scene.onBeforeRenderObservable.remove(this.cameraObserver);
            this.cameraObserver = null;
        }
        
        // Dispose of the particle system
        if (this.particleSystem) {
            this.particleSystem.stop();
            this.particleSystem.dispose();
            this.particleSystem = null;
        }
        
        console.log("RainEffect3 disposed");
    }
} 