import { WORLD_CONFIG } from '../../config.js';

export class NightClubLighting {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.fixtures = [];
        this.clusterManager = null;
        
        // Define our color palette
        this.CLUB_COLORS = {
            WHITE: new BABYLON.Color3(1, 0.98, 0.95),     // Slightly warm white
            COBALT: new BABYLON.Color3(0.1, 0.3, 0.9),    // Deep cobalt blue
            RED: new BABYLON.Color3(1, 0.1, 0.1),         // Vivid red
            MATRIX: new BABYLON.Color3(0.2, 0.9, 0.2),    // Digital green
            YELLOW: new BABYLON.Color3(1, 0.9, 0.1),      // Lemon yellow
            ORANGE: new BABYLON.Color3(1, 0.5, 0.1),      // Intense orange
        };
        
        // Convert colors array for easy cycling
        this.colorSequence = Object.values(this.CLUB_COLORS);
        this.currentColorIndex = 0;
        this.lastColorChange = 0;
        this.colorChangeTimings = {
            min: 1000,  // 1 second
            max: 5000,  // 5 seconds
            next: 2000  // Initial value
        };
        
        this.animationSpeed = 0.0005; // Controls how fast colors change
        this.mainLight = {
            id: null,
            colorPhase: 0,
            fixture: null,
            fixtureMaterial: null,
            volumetricCone: null,
            volumetricMaterial: null,
            isActive: true,  // Changed from false to true
            spotlightZone: null
        };
        this.mainLightId = null;
        this.glowLayer = null;
        this.floorMaterial = null;
        
        // Intense sequence configuration - short and aggressive
        this.intenseSequence = {
            duration: {
                min: 8000,        // 8 seconds
                max: 10000,       // 10 seconds
                current: 9000     // Initial value
            },
            blackouts: {
                min: 50,         // 0.05 seconds
                max: 150,        // 0.15 seconds
                next: 100,       // Initial value
                lastChange: 0,
                isBlackout: false,
                pattern: 'normal' // 'normal', 'strobe', 'pulse'
            }
        };

        // Calm sequence configuration - long and smooth
        this.calmSequence = {
            duration: {
                min: 30000,      // 30 seconds
                max: 35000,      // 35 seconds
                current: 32000   // Initial value
            },
            colorTransition: {
                duration: 10000,  // 10 seconds for each transition
                active: false,
                startColor: null,
                targetColor: null,
                progress: 0
            }
        };

        // Initialize sequence manager with proper references
        this.sequenceManager = {
            isIntenseMode: true,
            lastModeChange: 0,
            currentDuration: this.intenseSequence.duration.current
        };
        
        // Create a custom glow layer that we can control
        this.glowLayer = new BABYLON.GlowLayer("nightclub-glow", scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 64
        });
        this.glowLayer.intensity = 0.7;

        // Add intensity pulsing configuration
        this.intensityPulse = {
            min: 1.0,    // Base intensity
            max: 3.0,    // Peak intensity
            current: 1.0,
            phase: 0
        };

        // Intense mode configuration
        this.intenseMode = {
            colorIndex: 0,
            lastColorChange: 0,
            timings: {
                min: 50,      // 0.05 seconds
                max: 150,     // 0.15 seconds
                next: 100     // Initial value
            },
            blackout: {
                isActive: false,
                lastChange: 0,
                min: 50,     // 0.05 seconds
                max: 150,    // 0.15 seconds
                next: 100,   // Initial value
                pattern: 'normal' // 'normal', 'strobe', 'pulse'
            },
            intensity: 2.5    // Higher base intensity for intense mode
        };
        
        // Calm mode configuration
        this.calmMode = {
            colorIndex: 0,
            lastColorChange: 0,
            timings: {
                min: 1000,    // 1 second
                max: 5000,    // 5 seconds
                next: 2000    // Initial value
            },
            transition: {
                active: false,
                startColor: null,
                targetColor: null,
                progress: 0,
                duration: 2000 // 2 seconds for smooth transition
            },
            intensity: 1.0    // Normal base intensity for calm mode
        };

        // Much more aggressive blackout timing for strobe effects
        this.blackoutTimings = {
            min: 50,     // 0.05 seconds - super fast!
            max: 150,    // 0.15 seconds
            next: 100,   // Initial value
            lastChange: 0,
            isBlackout: false,
            // Add strobe pattern control
            patternDuration: 5000,  // 5 seconds per pattern
            lastPatternChange: 0,
            currentPattern: 'normal' // 'normal', 'strobe', 'pulse'
        };
    }

    initialize(clusterManager) {
        this.clusterManager = clusterManager;
        
        // Create a glow layer for enhanced visual effect
        this.glowLayer = new BABYLON.GlowLayer("nightclub-glow", this.scene);
        this.glowLayer.intensity = 1.0;
        
        // Create a single mega light that illuminates the entire club
        this.createMainLight();
        
        // Set up animation loop
        this.setupAnimations();
        
        return this;
    }
    
    createMainLight() {
        const roomHeight = WORLD_CONFIG.GRID_CELL_SIZE * 40;
        const roomWidth = WORLD_CONFIG.GRID_CELL_SIZE * 80;
        
        // Create the central cube light fixture - main visual centerpiece of the nightclub
        const fixture = BABYLON.MeshBuilder.CreateBox(
            "central-cube-light",
            {height: 8, width: 8, depth: 8},
            this.scene
        );
        fixture.position = new BABYLON.Vector3(0, roomHeight * 0.7, 0);
        
        // Create emissive material for the central cube - INCREASED EMISSION
        const fixtureMaterial = new BABYLON.StandardMaterial("central-cube-material", this.scene);
        fixtureMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        fixtureMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        fixtureMaterial.emissiveColor = new BABYLON.Color3(1.5, 0, 1.5); // Increased intensity
        fixtureMaterial.disableLighting = true;
        fixture.material = fixtureMaterial;
        
        this.glowLayer.addIncludedOnlyMesh(fixture);
        
        // Register with INCREASED intensity
        this.mainLightId = this.clusterManager.registerLight({
            position: fixture.position.clone(),
            intensity: 2.5, // Increased from 1
            diffuse: new BABYLON.Color3(1.5, 0, 1.5), // Increased color intensity
            specular: new BABYLON.Color3(1.5, 0, 1.5), // Increased specular
            range: WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 5,
            shadowEnabled: true
        });
        
        // Store references for animation
        this.mainLight.id = this.mainLightId;
        this.mainLight.fixture = fixture;
        this.mainLight.fixtureMaterial = fixtureMaterial;
        
        this.fixtures.push(fixture);
        
        // Add volumetric light effect with INCREASED intensity
        this.createVolumetricEffect(fixture);
        
        // Reduce ambient light intensity but keep strong specular for wall reflections
        const ambientLight = new BABYLON.HemisphericLight(
            "ambient-light", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        ambientLight.intensity = 1.5; // Increased from 1
        ambientLight.diffuse = new BABYLON.Color3(0.2, 0.2, 0.3);
        ambientLight.specular = new BABYLON.Color3(0.6, 0.6, 0.7); // Increased for more punch
        ambientLight.groundColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        
        // this.lights.push(ambientLight);
        
        // Add secondary point lights for enhanced wall illumination
        // this.addSecondaryLights();

        // Create custom shader material for the floor
        const shaderMaterial = new BABYLON.ShaderMaterial(
            "floorShader",
            this.scene,
            {
                vertex: "custom",
                fragment: "custom",
            },
            {
                attributes: ["position", "normal", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "lightPosition", "lightColor", "maxDistance"]
            }
        );

        // Define the shader code
        BABYLON.Effect.ShadersStore["customVertexShader"] = `
            precision highp float;
            
            // Attributes
            attribute vec3 position;
            attribute vec2 uv;
            
            // Uniforms
            uniform mat4 worldViewProjection;
            uniform mat4 world;
            uniform vec3 lightPosition;
            uniform float maxDistance;
            
            // Varying
            varying float vDistanceFactor;
            varying vec2 vUV;
            
            void main(void) {
                vec4 worldPosition = world * vec4(position, 1.0);
                gl_Position = worldViewProjection * vec4(position, 1.0);
                
                // Calculate distance from vertex to light
                float distance = length(lightPosition - worldPosition.xyz);
                
                // MUCH more aggressive falloff
                float hotspotRadius = maxDistance * 0.2; // Super tight hotspot
                float falloffStart = maxDistance * 0.4;  // Start fading earlier
                
                if (distance < hotspotRadius) {
                    vDistanceFactor = 1.0; // Full intensity in hotspot
                } else if (distance < falloffStart) {
                    float t = (distance - hotspotRadius) / (falloffStart - hotspotRadius);
                    vDistanceFactor = 1.0 - pow(t, 3.0); // Cubic falloff for sharp drop
                } else {
                    vDistanceFactor = 0.0; // Dark outside falloff
                }
                
                vUV = uv;
            }
        `;

        BABYLON.Effect.ShadersStore["customFragmentShader"] = `
            precision highp float;
            
            varying float vDistanceFactor;
            varying vec2 vUV;
            
            uniform vec3 lightColor;
            
            void main(void) {
                float baseReflectivity = 0.02;
                float maxReflectivity = 0.8; // CRANKED UP for more punch
                
                // Sharp transition between base and max
                float reflectivity = mix(baseReflectivity, maxReflectivity, pow(vDistanceFactor, 1.5));
                
                // Add subtle ambient
                vec3 ambientColor = vec3(0.05, 0.05, 0.05);
                
                // Mix with more contrast
                vec3 finalColor = (lightColor * reflectivity * 1.5) + ambientColor;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        // Find and update floor material
        const floor = this.scene.getMeshByID("nightclub-floor");
        if (floor) {
            floor.material = shaderMaterial;
            
            // MUCH tighter radius - just 10 meters
            shaderMaterial.setVector3("lightPosition", this.mainLight.fixture.position);
            shaderMaterial.setFloat("maxDistance", WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 0.7); // Just 10.5 meters
            shaderMaterial.setVector3("lightColor", new BABYLON.Vector3(1, 0, 1));
            
            this.floorMaterial = shaderMaterial;
        }
    }

    createVolumetricEffect(fixture) {
        // Create a cone for the volumetric light effect
        const cone = BABYLON.MeshBuilder.CreateCylinder(
            "light-cone", 
            {
                height: 30, 
                diameterTop: 40, 
                diameterBottom: 8, 
                tessellation: 24,
                subdivisions: 1
            }, 
            this.scene
        );
        
        // Disable collisions for the volumetric cone
        cone.checkCollisions = false;
        cone.isPickable = false;  // Also disable picking for good measure
        
        // Position below the fixture pointing down
        cone.position = fixture.position.clone();
        cone.position.y -= 15; // Center of cone is 15m below fixture
        
        // Rotate to point downward
        cone.rotation.x = Math.PI;
        
        // Create volumetric material with INCREASED values
        const volumetricMaterial = new BABYLON.StandardMaterial("volumetric-material", this.scene);
        volumetricMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        volumetricMaterial.emissiveColor = new BABYLON.Color3(1.5, 0, 1.5); // Increased intensity
        volumetricMaterial.alpha = 0.2; // Slightly increased from 0.15
        volumetricMaterial.disableLighting = true;
        
        // More intense alpha gradient
        const alphaTexture = new BABYLON.DynamicTexture("alpha-gradient", 256, this.scene);
        const ctx = alphaTexture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, "rgba(255,255,255,0.6)"); // Increased from 0.4
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        alphaTexture.update();
        
        volumetricMaterial.opacityTexture = alphaTexture;
        volumetricMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;
        
        cone.material = volumetricMaterial;
        
        // Store for animation
        this.mainLight.volumetricCone = cone;
        this.mainLight.volumetricMaterial = volumetricMaterial;
        
        this.fixtures.push(cone);
    }
    
    addSecondaryLights() {
        const roomHeight = WORLD_CONFIG.GRID_CELL_SIZE * 40;
        const roomWidth = WORLD_CONFIG.GRID_CELL_SIZE * 80;
        const wallDistance = roomWidth / 2 - 5; // 5m from walls
        
        // Create 4 secondary lights near the walls
        const positions = [
            new BABYLON.Vector3(wallDistance, roomHeight * 0.5, 0),  // East
            new BABYLON.Vector3(-wallDistance, roomHeight * 0.5, 0), // West
            new BABYLON.Vector3(0, roomHeight * 0.5, wallDistance),  // North
            new BABYLON.Vector3(0, roomHeight * 0.5, -wallDistance)  // South
        ];
        
        positions.forEach((position, index) => {
            // Register with cluster manager
            const lightId = this.clusterManager.registerLight({
                position: position,
                intensity: 1, // Changed from 0
                diffuse: new BABYLON.Color3(1, 0, 1),
                range: WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 5
            });
            
            // Store for animation with isActive parameter
            this.lights.push({
                id: lightId,
                colorPhase: Math.PI * index / 2,
                position: position,
                isActive: false  // Add isActive parameter
            });
        });
    }
    
    setupAnimations() {
        // Register animation loop
        this.scene.registerBeforeRender(() => {
            this.updateLights();
        });
    }
    
    getNextColorChangeDuration() {
        // Returns a random duration between min and max (in milliseconds)
        return Math.random() * (this.colorChangeTimings.max - this.colorChangeTimings.min) + this.colorChangeTimings.min;
    }

    getNextBlackoutDuration() {
        const currentTime = performance.now();
        
        // Check if it's time to change patterns
        if (currentTime - this.blackoutTimings.lastPatternChange > this.blackoutTimings.patternDuration) {
            this.blackoutTimings.lastPatternChange = currentTime;
            // Randomly select next pattern
            const patterns = ['normal', 'strobe', 'pulse'];
            this.blackoutTimings.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
        }
        
        switch(this.blackoutTimings.currentPattern) {
            case 'strobe':
                // Ultra-fast strobe (50-80ms)
                return Math.random() * 30 + 50;
            case 'pulse':
                // Rhythmic pulse (100-300ms)
                return Math.random() * 200 + 100;
            default:
                // Normal pattern (200-500ms)
                return Math.random() * 300 + 200;
        }
    }

    getNextModeDuration() {
        if (this.sequenceManager.isIntenseMode) {
            return Math.random() * 
                (this.intenseSequence.duration.max - this.intenseSequence.duration.min) + 
                this.intenseSequence.duration.min;
        } else {
            return Math.random() * 
                (this.calmSequence.duration.max - this.calmSequence.duration.min) + 
                this.calmSequence.duration.min;
        }
    }

    updateLights() {
        if (!this.mainLight.isActive) return;
        const currentTime = performance.now();
        
        // Check if we should switch modes
        if (currentTime - this.sequenceManager.lastModeChange >= this.sequenceManager.currentDuration) {
            // Log end of current session
            if (this.sequenceManager.isIntenseMode) {
                console.log("🎵 INTENSE SESSION ENDS");
            } else {
                console.log("🌟 CALM SESSION ENDS");
            }

            // Switch mode
            this.sequenceManager.isIntenseMode = !this.sequenceManager.isIntenseMode;
            
            // When switching TO intense mode, pick a random color to use
            if (this.sequenceManager.isIntenseMode) {
                console.log("⚡ INTENSE SESSION STARTS");
                // Pick random color from sequence for this intense session
                this.currentColorIndex = Math.floor(Math.random() * this.colorSequence.length);
            } else {
                console.log("✨ CALM SESSION STARTS");
            }

            this.sequenceManager.lastModeChange = currentTime;
            this.sequenceManager.currentDuration = this.getNextModeDuration();
            
            // Reset states when switching modes
            this.calmSequence.colorTransition.active = false;
            this.blackoutTimings.isBlackout = false;
        }

        if (this.sequenceManager.isIntenseMode) {
            // INTENSE SEQUENCE - single color with blackouts
            if (currentTime - this.blackoutTimings.lastChange >= this.blackoutTimings.next) {
                this.blackoutTimings.isBlackout = !this.blackoutTimings.isBlackout;
                this.blackoutTimings.lastChange = currentTime;
                this.blackoutTimings.next = this.getNextBlackoutDuration();
            }

            if (this.blackoutTimings.isBlackout) {
                console.log("💥 BLACKOUT");
                this.applyBlackout();
                return;
            }

            // Apply the single chosen color (no cycling)
            const color = this.colorSequence[this.currentColorIndex];
            this.applyIntenseColor(color);
        } else {
            // CALM SEQUENCE - constant smooth transitions
            if (!this.calmSequence.colorTransition.active) {
                // Start new transition
                const nextColorIndex = (this.currentColorIndex + 1) % this.colorSequence.length;
                this.calmSequence.colorTransition.startColor = this.colorSequence[this.currentColorIndex];
                this.calmSequence.colorTransition.targetColor = this.colorSequence[nextColorIndex];
                this.calmSequence.colorTransition.active = true;
                this.calmSequence.colorTransition.progress = 0;
                this.currentColorIndex = nextColorIndex;
                this.lastColorChange = performance.now();
            }

            // Update transition progress
            const currentTime = performance.now();
            this.calmSequence.colorTransition.progress = (currentTime - this.lastColorChange) / this.calmSequence.colorTransition.duration;
            
            const lerpedColor = BABYLON.Color3.Lerp(
                this.calmSequence.colorTransition.startColor,
                this.calmSequence.colorTransition.targetColor,
                this.calmSequence.colorTransition.progress
            );
            
            this.applyCalmColor(lerpedColor);
            
            // If transition complete, start next one immediately
            if (this.calmSequence.colorTransition.progress >= 1) {
                this.calmSequence.colorTransition.active = false;
            }
        }
    }
    
    applyIntenseColor(color) {
        const intensifiedColor = color.scale(this.intenseMode.intensity);
        
        this.clusterManager.updateLightProperty(this.mainLight.id, 'diffuse', intensifiedColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'specular', intensifiedColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'intensity', this.intenseMode.intensity);
        
        this.mainLight.fixtureMaterial.emissiveColor = intensifiedColor;
        
        if (this.mainLight.volumetricMaterial) {
            this.mainLight.volumetricMaterial.emissiveColor = intensifiedColor;
            this.mainLight.volumetricMaterial.alpha = 0.2;
        }
        
        if (this.floorMaterial) {
            this.floorMaterial.setVector3("lightColor", 
                new BABYLON.Vector3(intensifiedColor.r, intensifiedColor.g, intensifiedColor.b)
            );
        }
    }

    applyCalmColor(color) {
        const baseColor = color.scale(this.calmMode.intensity);
        
        this.clusterManager.updateLightProperty(this.mainLight.id, 'diffuse', baseColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'specular', baseColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'intensity', this.calmMode.intensity);
        
        this.mainLight.fixtureMaterial.emissiveColor = baseColor;
        
        if (this.mainLight.volumetricMaterial) {
            this.mainLight.volumetricMaterial.emissiveColor = baseColor;
            this.mainLight.volumetricMaterial.alpha = 0.15;
        }
        
        if (this.floorMaterial) {
            this.floorMaterial.setVector3("lightColor", 
                new BABYLON.Vector3(baseColor.r, baseColor.g, baseColor.b)
            );
        }
    }

    applyBlackout() {
        const blackColor = new BABYLON.Color3(0, 0, 0);
        
        // Completely disable glow layer during blackout
        this.glowLayer.intensity = 0;
        
        // Force scene to complete darkness
        this.scene.ambientColor = blackColor;
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        this.scene.environmentIntensity = 0;
        
        // Disable all PBR properties globally
        this.scene.materials.forEach(material => {
            if (material instanceof BABYLON.PBRMaterial) {
                material._cachedAlbedo = material.albedoColor?.clone();
                material._cachedEmissive = material.emissiveColor?.clone();
                material._cachedAmbient = material.ambientColor?.clone();
                material._cachedReflectivity = material.reflectivityColor?.clone();
                
                material.albedoColor = blackColor;
                material.emissiveColor = blackColor;
                material.ambientColor = blackColor;
                material.reflectivityColor = blackColor;
                material.environmentIntensity = 0;
                material.metallic = 0;
                material.roughness = 1;
            }
        });
        
        // Zero out all lights
        this.clusterManager.updateLightProperty(this.mainLight.id, 'diffuse', blackColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'specular', blackColor);
        this.clusterManager.updateLightProperty(this.mainLight.id, 'intensity', 0);
        
        // Find the character meshes and temporarily disable their emission/glow
        const characterMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.includes("PlayerCharacter") || 
            mesh.parent?.name?.includes("PlayerCharacter")
        );
        
        characterMeshes.forEach(mesh => {
            if (mesh.material) {
                // Store original values if not already stored
                if (!mesh.material._originalEmissive) {
                    mesh._originalVisibility = mesh.visibility;
                    mesh.material._originalEmissive = mesh.material.emissiveColor?.clone();
                    mesh.material._originalAmbient = mesh.material.ambientColor?.clone();
                }
                // Force complete darkness
                mesh.visibility = 0.99; // Just shy of invisible to maintain collision
                mesh.material.emissiveColor = blackColor;
                mesh.material.ambientColor = blackColor;
            }
        });
        
        // Zero out all other lighting properties
        this.mainLight.fixtureMaterial.emissiveColor = blackColor;
        this.mainLight.fixtureMaterial.ambientColor = blackColor;
        
        if (this.mainLight.volumetricMaterial) {
            this.mainLight.volumetricMaterial.emissiveColor = blackColor;
        }
        
        if (this.floorMaterial) {
            this.floorMaterial.setVector3("lightColor", new BABYLON.Vector3(0, 0, 0));
        }
        
        // Zero out secondary lights
        this.lights.forEach(light => {
            if (light.id !== undefined) {
                this.clusterManager.updateLightProperty(light.id, 'diffuse', blackColor);
                this.clusterManager.updateLightProperty(light.id, 'specular', blackColor);
                this.clusterManager.updateLightProperty(light.id, 'intensity', 0);
            }
        });
    }
    
    dispose() {
        // Clean up all fixtures
        this.fixtures.forEach(fixture => {
            if (fixture) {
                fixture.dispose();
            }
        });
        
        // Clean up all lights
        this.lights.forEach(light => {
            if (light && light.dispose) {
                light.dispose();
            }
        });
        
        // Clean up glow layer
        if (this.glowLayer) {
            this.glowLayer.dispose();
        }
        
        // Clear arrays
        this.lights = [];
        this.fixtures = [];
        
        // Note: We don't dispose the cluster manager here as it's managed by the level
    }
} 