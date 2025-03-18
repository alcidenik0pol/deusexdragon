import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config.js';

export class Streetlight extends BaseComponent {
    constructor() {
        super('streetlight01');
        this.lightComponent = null;
        this.lightMesh = null;
        this.lightProjector = null;
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
        
        // Create spotlight at the same position with adjusted angle
        this.createSpotlight(scene, lightHeight);
        
        // Create dust particles
        this.createDustParticles(scene, lightHeight);
        
        // Create collision box
        this.createCollisionBox(scene);
        
        // Register for scene before render to update particle visibility
        this.scene = scene;
        scene.registerBeforeRender(() => this.updateParticleVisibility());
        
        console.log(`Streetlight initialized. Model height: ${actualHeight}, Fixed light height: ${lightHeight}`);
    }

    createSpotlight(scene, lightHeight) {
        // Create spotlight
        this.lightComponent = new BABYLON.SpotLight(
            "streetlight_spot",
            new BABYLON.Vector3(0, lightHeight, this.LIGHT_FORWARD_OFFSET), // Position with forward offset
            new BABYLON.Vector3(0, -Math.cos(this.LIGHT_ANGLE), Math.sin(this.LIGHT_ANGLE)), // Direction vector based on angle
            this.LIGHT_ANGLE,
            6, // Slightly reduced exponent for stronger center illumination
            scene
        );
        
        // Parent to the mesh so it follows all transformations
        this.lightComponent.parent = this.mesh;
        this.lightComponent.baseIntensity = 5.0; // Increased from 2.0 to 5.0
        this.lightComponent.intensity = this.lightComponent.baseIntensity;
        this.lightComponent.range = WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 1.5; // Increased range by 50%
        this.lightComponent.diffuse = new BABYLON.Color3(1, 0.98, 0.92); // Slightly warm white light
        this.lightComponent.specular = new BABYLON.Color3(0.5, 0.5, 0.5); // Increased specular for stronger highlights
        
        // Add projective texture for more realistic light pattern
        this.createLightTexture(scene);
        
        this.lightComponent.shadowEnabled = false;
    }

    createLightTexture(scene) {
        // Create a dynamic texture for the light projection
        const textureSize = 512; // Increased from 256 for higher resolution
        const lightTexture = new BABYLON.DynamicTexture("lightTexture", textureSize, scene, false);
        const ctx = lightTexture.getContext();
        
        // Create a gradient for the light falloff
        const gradient = ctx.createRadialGradient(
            textureSize/2, textureSize/2, 0,
            textureSize/2, textureSize/2, textureSize/2
        );
        
        // Add color stops for a more natural light falloff - adjusted for stronger light
        gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)");
        gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.9)"); // Stronger middle area
        gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.7)"); // Stronger outer area
        gradient.addColorStop(0.9, "rgba(255, 255, 255, 0.3)");
        gradient.addColorStop(1.0, "rgba(255, 255, 255, 0.0)");
        
        // Fill the texture with the gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, textureSize, textureSize);
        
        // Update the texture
        lightTexture.update();
        
        // Create a projector for the light
        this.lightProjector = new BABYLON.SpotLight(
            "lightProjector",
            this.lightComponent.position.clone(),
            this.lightComponent.direction.clone(),
            this.lightComponent.angle,
            10, // Adjusted for stronger projection
            scene
        );
        
        // Parent to the same parent as the main light
        this.lightProjector.parent = this.mesh;
        
        // Set up the projector with stronger intensity
        this.lightProjector.intensity = this.lightComponent.intensity * 0.8; // Increased from 0.7 to 0.8
        this.lightProjector.range = this.lightComponent.range;
        this.lightProjector.projectionTexture = lightTexture;
        this.lightProjector.diffuse = this.lightComponent.diffuse;
        this.lightProjector.specular = BABYLON.Color3.Black(); // No specular for the projector
        this.lightProjector.shadowEnabled = false;
    }

    createRectangularLightBulb(scene, lightHeight) {
        // Create a thinner, longer rectangular box to represent the light bulb
        this.lightMesh = BABYLON.MeshBuilder.CreateBox("lightBulb", {
            width: 0.001,   // Width (thin)
            height: 0.06,   // Height (thinnest dimension)
            depth: 0.6,     // Depth (longest dimension)
        }, scene);
        
        // Create an emissive material for the light bulb
        const lightMaterial = new BABYLON.StandardMaterial("lightMaterial", scene);
        lightMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1); // White emissive color
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
        
        // Add a point light inside the bulb for additional illumination effect
        const bulbLight = new BABYLON.PointLight("bulbLight", new BABYLON.Vector3(0, 0, 0), scene);
        bulbLight.parent = this.lightMesh;
        bulbLight.intensity = 1.0; // Increased from 0.5 to 1.0
        bulbLight.diffuse = new BABYLON.Color3(1, 0.98, 0.92); // Match main light color
        bulbLight.specular = new BABYLON.Color3(1, 1, 1);
        bulbLight.range = 0.8; // Increased from 0.5 to 0.8
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
        const directionVector = this.lightComponent.direction.clone();
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
        const lightPos = this.lightComponent.getAbsolutePosition();
        const distance = BABYLON.Vector3.Distance(camera.position, lightPos);
        
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
        if (this.lightComponent) {
            this.lightComponent.dispose();
        }
        if (this.lightProjector) {
            if (this.lightProjector.projectionTexture) {
                this.lightProjector.projectionTexture.dispose();
            }
            this.lightProjector.dispose();
        }
        if (this.lightMesh) {
            // Dispose of any materials or child lights
            if (this.lightMesh.material) {
                this.lightMesh.material.dispose();
            }
            // Find and dispose the bulb light if it exists
            const bulbLight = this.scene.getLightByName("bulbLight");
            if (bulbLight) {
                bulbLight.dispose();
            }
            this.lightMesh.dispose();
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