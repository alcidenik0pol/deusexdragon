import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config/config.js';

export class Streetlight extends BaseComponent {
    constructor() {
        super('streetlight01');
        this.lightId = null;
        this.projectorId = null;
        this.lightMesh = null;
        this.particleSystem = null;
        this.FIXED_LIGHT_HEIGHT = 2.64; // Fixed light height in meters
        // this.FIXED_LIGHT_HEIGHT = 2.65; // Fixed light height in meters
        this.LIGHT_ANGLE = Math.PI / 5.5;
        this.LIGHT_FORWARD_OFFSET = 0.3; // Forward offset in meters
        this.isParticleActive = false;
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'streetlight01');
        
        // Apply initial rotation if provided in options
        if (options.rotation) {
            this.mesh.rotation = options.rotation;
        } else {
            // Default rotation - 180 degrees around Y-axis
            this.mesh.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        }
        
        // Calculate the actual height of the streetlight
        const assetData = await fetch(`/assets/furniture/streetlight01.json`).then(r => r.json());
        const rawHeight = assetData.rawDimensions.height;
        const scale = assetData.scaleFactor;
        const actualHeight = rawHeight * scale;
        
        // Use fixed height instead of actual model height
        const lightHeight = this.FIXED_LIGHT_HEIGHT;
        
        // Create a rectangular light bulb mesh
        this.createRectangularLightBulb(scene, lightHeight);
        
        // Create light properties (not actual lights)
        this.createLightProperties(scene, lightHeight);
        
        // Create dust particles
        this.createDustParticles(scene, lightHeight);
        
        // Create collision box
        this.createCollisionBox(scene);
        
        // Register for scene before render to update particle visibility
        this.scene = scene;
        scene.registerBeforeRender(() => this.updateParticleVisibility());
        
        console.log(`Streetlight initialized. Model height: ${actualHeight}, Fixed light height: ${lightHeight}`);
    }

    createLightProperties(scene, lightHeight) {
        // Create spotlight properties with reduced intensity
        this.lightProperties = {
            position: new BABYLON.Vector3(0, lightHeight, this.LIGHT_FORWARD_OFFSET),
            direction: new BABYLON.Vector3(0, -Math.cos(this.LIGHT_ANGLE), Math.sin(this.LIGHT_ANGLE)),
            type: 'spot',
            angle: this.LIGHT_ANGLE,
            intensity: 3.0, // Reduced from 5.0 to 3.0
            range: WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 1.5,
            diffuse: new BABYLON.Color3(1, 0.98, 0.92),
            specular: new BABYLON.Color3(0.5, 0.5, 0.5)
        };
        
        // Create projector properties with reduced intensity
        this.projectorProperties = {
            position: this.lightProperties.position.clone(),
            direction: this.lightProperties.direction.clone(),
            type: 'spot',
            angle: this.lightProperties.angle,
            intensity: this.lightProperties.intensity * 0.6, // Reduced multiplier from 0.8 to 0.6
            range: this.lightProperties.range,
            diffuse: this.lightProperties.diffuse.clone(),
            specular: BABYLON.Color3.Black()
        };
    }

    // Method to register with lighting system
    registerWithLightingSystem(lightManager) {
        if (!lightManager) return;
        
        // Transform light position to world space
        const worldMatrix = this.mesh.getWorldMatrix();
        const worldPos = BABYLON.Vector3.TransformCoordinates(
            this.lightProperties.position, 
            worldMatrix
        );
        
        // Transform direction to world space (direction is a vector, so we use transformNormal)
        const worldDir = BABYLON.Vector3.TransformNormal(
            this.lightProperties.direction,
            worldMatrix
        );
        worldDir.normalize();
        
        // Register the main spotlight
        const spotlightProps = {
            ...this.lightProperties,
            position: worldPos,
            direction: worldDir
        };
        this.lightId = lightManager.registerLight(spotlightProps);
        
        // Register the projector
        const projectorProps = {
            ...this.projectorProperties,
            position: worldPos,
            direction: worldDir
        };
        this.projectorId = lightManager.registerLight(projectorProps);
    }

    // Update light position when streetlight moves
    updateLightPosition(lightManager) {
        if (!lightManager || !this.lightId || !this.projectorId) return;
        
        // Transform light position to world space
        const worldMatrix = this.mesh.getWorldMatrix();
        const worldPos = BABYLON.Vector3.TransformCoordinates(
            this.lightProperties.position, 
            worldMatrix
        );
        
        // Transform direction to world space
        const worldDir = BABYLON.Vector3.TransformNormal(
            this.lightProperties.direction,
            worldMatrix
        );
        worldDir.normalize();
        
        // Update the registered lights
        lightManager.updateLightProperty(this.lightId, 'position', worldPos);
        lightManager.updateLightProperty(this.lightId, 'direction', worldDir);
        lightManager.updateLightProperty(this.projectorId, 'position', worldPos);
        lightManager.updateLightProperty(this.projectorId, 'direction', worldDir);
    }

    createRectangularLightBulb(scene, lightHeight) {
        // Create a thinner, longer rectangular box to represent the light bulb
        this.lightMesh = BABYLON.MeshBuilder.CreateBox("lightBulb", {
            width: 0.001,   // Width (thin)
            height: 0.06,   // Height (thinnest dimension)
            depth: 0.6,     // Depth (longest dimension)
        }, scene);
        
        // Create an emissive material for the light bulb with reduced brightness
        const lightMaterial = new BABYLON.StandardMaterial("lightMaterial", scene);
        // Make it less bright with lower emissive values
        lightMaterial.emissiveColor = new BABYLON.Color3(3.0, 3.0, 2.7); // Reduced from 5.0, 5.0, 4.5
        lightMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        lightMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        lightMaterial.disableLighting = true;
        
        // Apply the material to the light bulb
        this.lightMesh.material = lightMaterial;
        
        // Position the light bulb at the top of the streetlight with forward offset
        this.lightMesh.position = new BABYLON.Vector3(0, lightHeight, this.LIGHT_FORWARD_OFFSET);
        
        // Set the initial rotation of the light bulb
        this.lightMesh.rotation = new BABYLON.Vector3(this.LIGHT_ANGLE, Math.PI, Math.PI / 2);
        
        // Parent to the mesh so it follows all transformations
        this.lightMesh.parent = this.mesh;
        
        // Add glow effect to the light bulb
        this.addGlowEffect(scene);
        
        // NO ACTUAL LIGHT CREATION - rely only on emissive material
    }

    addGlowEffect(scene) {
        // Create a glow layer if it doesn't exist in the scene
        if (!this.scene.glowLayer) {
            this.scene.glowLayer = new BABYLON.GlowLayer("glow", scene);
            this.scene.glowLayer.intensity = 0.7; // Adjust intensity to control glow strength
        }
        
        // Add the light mesh to the glow layer
        this.scene.glowLayer.addIncludedOnlyMesh(this.lightMesh);
        
        // Create a slightly larger mesh for additional glow effect
        const glowMesh = BABYLON.MeshBuilder.CreateBox("lightGlow", {
            width: 0.05,   // Slightly wider than the light
            height: 0.1,   // Slightly taller than the light
            depth: 0.65,   // Slightly longer than the light
        }, scene);
        
        // Create a semi-transparent material for the glow mesh
        const glowMaterial = new BABYLON.StandardMaterial("glowMaterial", scene);
        glowMaterial.emissiveColor = new BABYLON.Color3(1.0, 0.98, 0.9); // Warm white glow
        glowMaterial.alpha = 0.3; // Make it semi-transparent
        glowMaterial.disableLighting = true;
        
        // Apply the material to the glow mesh
        glowMesh.material = glowMaterial;
        
        // Position and rotate the glow mesh to match the light bulb
        glowMesh.position = this.lightMesh.position.clone();
        glowMesh.rotation = this.lightMesh.rotation.clone();
        
        // Parent to the mesh so it follows all transformations
        glowMesh.parent = this.mesh;
        
        // Store reference for disposal
        this.glowMesh = glowMesh;
    }

    createDustParticles(scene, lightHeight) {
        // Create a particle system
        this.particleSystem = new BABYLON.ParticleSystem("dustParticles", 300, scene);
        
        // Create an emitter - position it below the light source in the light beam
        // Position it further down the light beam to allow particles to rise through it
        const emitterPosition = new BABYLON.Vector3(
            0, 
            lightHeight - 1.0, // Lower position to allow upward movement
            this.LIGHT_FORWARD_OFFSET + 0.5 // More forward to match light direction
        );
        const emitter = new BABYLON.AbstractMesh("dustEmitter", scene);
        emitter.position = emitterPosition;
        emitter.visibility = 0; // Make emitter invisible
        emitter.parent = this.mesh; // Parent to the streetlight mesh
        
        // Use a simple circle texture instead of loading an external file
        const dustTexture = new BABYLON.DynamicTexture("dustParticleTexture", 32, scene, false);
        const ctx = dustTexture.getContext();
        
        // Draw a soft circle
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(16, 16, 8, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // Apply a radial gradient for softer edges
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
        gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.5)");
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        // Update the texture
        dustTexture.update();
        
        // Assign the texture to the particle system
        this.particleSystem.particleTexture = dustTexture;
        
        // Where the particles come from - wider area for more natural distribution
        this.particleSystem.emitter = emitter;
        this.particleSystem.minEmitBox = new BABYLON.Vector3(-0.7, -0.3, -0.7);
        this.particleSystem.maxEmitBox = new BABYLON.Vector3(0.7, 0.3, 0.7);
        
        // Colors of all particles
        this.particleSystem.color1 = new BABYLON.Color4(1, 0.98, 0.9, 0.1);
        this.particleSystem.color2 = new BABYLON.Color4(1, 0.98, 0.9, 0.2);
        this.particleSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
        
        // Size of each particle
        this.particleSystem.minSize = 0.01;
        this.particleSystem.maxSize = 0.05;
        
        // Lifetime of each particle
        this.particleSystem.minLifeTime = 2;
        this.particleSystem.maxLifeTime = 5;
        
        // Emission rate
        this.particleSystem.emitRate = 30;
        
        // Blend mode
        this.particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        // Calculate the direction vector based on the light angle
        // This makes particles move along the light beam
        const directionVector = this.lightProperties.direction.clone();
        directionVector.scaleInPlace(-1); // Reverse direction to move upward along beam
        
        // Set the gravity to be opposite of the light direction (upward along beam)
        // Use a small value for subtle movement
        this.particleSystem.gravity = directionVector.scale(0.03);
        
        // Direction of each particle after it has been emitted
        // Small random variation around the main direction
        this.particleSystem.direction1 = new BABYLON.Vector3(
            directionVector.x - 0.05,
            directionVector.y - 0.05,
            directionVector.z - 0.05
        );
        this.particleSystem.direction2 = new BABYLON.Vector3(
            directionVector.x + 0.05,
            directionVector.y + 0.05,
            directionVector.z + 0.05
        );
        
        // Angular speed in radians per second
        this.particleSystem.minAngularSpeed = 0;
        this.particleSystem.maxAngularSpeed = 0.5;
        
        // Speed - slower for more floating appearance
        this.particleSystem.minEmitPower = 0.05;
        this.particleSystem.maxEmitPower = 0.15;
        this.particleSystem.updateSpeed = 0.01;
        
        // Start with particles disabled - will be enabled based on distance
        this.particleSystem.start();
        // Fix for isStarted error - track state manually
        this._particleSystemStarted = true;
        this.setParticleVisibility(false);
    }

    updateParticleVisibility() {
        if (!this.scene || !this.scene.activeCamera || !this.particleSystem) return;
        
        const camera = this.scene.activeCamera;
        
        // Get the world position of the light
        const worldMatrix = this.mesh.getWorldMatrix();
        const worldPos = BABYLON.Vector3.TransformCoordinates(
            this.lightProperties.position, 
            worldMatrix
        );
        
        const distance = BABYLON.Vector3.Distance(camera.position, worldPos);
        
        // Calculate visibility based on distance
        const visibilityRange = WORLD_CONFIG.LIGHTING.PARTICLE_VISIBILITY_RANGE || 
                               (WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 0.7); // Fallback
        const shouldBeVisible = distance < visibilityRange;
        
        // Only update if visibility state changes
        if (shouldBeVisible !== this.isParticleActive) {
            this.setParticleVisibility(shouldBeVisible);
        }
    }

    setParticleVisibility(visible) {
        if (!this.particleSystem) return;
        
        if (visible) {
            if (!this._particleSystemStarted) {
                this.particleSystem.start();
                this._particleSystemStarted = true;
            }
            this.particleSystem.emitRate = 30;
        } else {
            this.particleSystem.emitRate = 0; // Stop emitting new particles
            // Don't stop the system completely to allow existing particles to fade out
        }
        
        this.isParticleActive = visible;
    }

    createCollisionBox(scene) {
        // Create collision box using the standard dimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("streetlight_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale and position collision box
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }

    dispose() {
        if (this.lightMesh) {
            // Dispose of any materials or child lights
            if (this.lightMesh.material) {
                this.lightMesh.material.dispose();
            }
            this.lightMesh.dispose();
        }
        if (this.glowMesh) {
            if (this.glowMesh.material) {
                this.glowMesh.material.dispose();
            }
            this.glowMesh.dispose();
        }
        if (this.particleSystem) {
            // Also dispose the dynamic texture if it exists
            if (this.particleSystem.particleTexture) {
                this.particleSystem.particleTexture.dispose();
            }
            this.particleSystem.dispose();
        }
        if (this.collisionMesh) {
            this.collisionMesh.dispose();
        }
        super.dispose();
    }
}