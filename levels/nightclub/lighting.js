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
                max: 60000,      // 35 seconds
                current: 32000   // Initial value
            },
            colorTransition: {
                duration: 30000,  // 30 seconds for each transition - MUCH slower
                active: false,
                startColor: null,
                targetColor: null,
                progress: 0
            },
            movement: {
                angle: 0,
                speed: 0.0005,        // Very slow rotation
                radius: 0.5,          // Small movement radius (in meters)
                originalPosition: null // Will store initial position
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

        // Add strobe beams configuration with mostly downward directions
        this.strobeBeams = {
            meshes: [],
            material: null,
            directions: [
                // Mostly downward-pointing directions
                new BABYLON.Vector3(0.2, -1, 0).normalize(),    // Slight right down
                new BABYLON.Vector3(-0.2, -1, 0).normalize(),   // Slight left down
                new BABYLON.Vector3(0, -1, 0.2).normalize(),    // Slight forward down
                new BABYLON.Vector3(0, -1, -0.2).normalize(),   // Slight back down
                new BABYLON.Vector3(0.2, -1, 0.2).normalize(),  // Diagonal down 1
                new BABYLON.Vector3(-0.2, -1, -0.2).normalize(), // Diagonal down 2
                new BABYLON.Vector3(-0.2, -1, 0.2).normalize(), // Diagonal down 3
                // Few non-downward directions for variety
                new BABYLON.Vector3(1, -0.2, 0).normalize(),    // Almost horizontal right
                new BABYLON.Vector3(0, 1, 0),                   // Straight up
                new BABYLON.Vector3(-0.5, 0.5, 0).normalize(),  // Diagonal up
            ],
            movement: {
                angles: [], // Will store current rotation angles for each beam
                speeds: [], // Will store rotation speeds for each beam
                ranges: {
                    pitch: { min: -0.3, max: 0.3 },  // Up/down rotation
                    yaw: { min: -0.3, max: 0.3 }     // Left/right rotation
                }
            }
        };

        // Add base specular color for all materials
        this.baseSpecular = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        // Register a callback to enhance character materials when they're loaded
        this.characterMaterialsEnhanced = false;
        this.scene.onNewMeshAddedObservable.add(mesh => {
            if (mesh.name === "PlayerCharacter" || mesh.name.includes("pdenton_")) {
                this.enhanceCharacterMaterials(mesh);
            }
        });
        
        // Also check existing meshes
        this.scene.meshes.forEach(mesh => {
            if (mesh.name === "PlayerCharacter" || mesh.name.includes("pdenton_")) {
                this.enhanceCharacterMaterials(mesh);
            }
        });
    }

    enhanceCharacterMaterials(mesh) {
        if (!mesh || !mesh.material) return;
        
        console.log("Enhancing character material for:", mesh.name);
        
        // Create PBR material for character
        const pbrMat = new BABYLON.PBRMaterial(mesh.material.name + "_pbr", this.scene);
        
        // Copy basic properties
        if (mesh.material.diffuseColor) {
            pbrMat.albedoColor = mesh.material.diffuseColor.clone();
        } else {
            pbrMat.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        }
        
        // Set PBR properties for good reflections
        pbrMat.metallic = 0.3;
        pbrMat.roughness = 0.4;
        pbrMat.metallicF0Factor = 0.7;
        pbrMat.metallicReflectanceColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        pbrMat.microSurface = 0.9;
        pbrMat.useRadianceOverAlpha = true;
        pbrMat.useSpecularOverAlpha = true;
        pbrMat.environmentIntensity = 0.5;
        
        // Apply to all submeshes
        if (mesh.subMeshes && mesh.subMeshes.length > 0) {
            for (let i = 0; i < mesh.subMeshes.length; i++) {
                const subMesh = mesh.subMeshes[i];
                if (subMesh.getMaterial()) {
                    subMesh.setMaterial(pbrMat.clone(subMesh.getMaterial().name + "_pbr"));
                }
            }
        } else {
            // Apply to the whole mesh
            mesh.material = pbrMat;
        }
        
        // Mark as enhanced
        mesh._reflectionEnhanced = true;
    }

    initialize(clusterManager, entranceFloor) {
        this.clusterManager = clusterManager;
        this.entranceFloor = entranceFloor;
        
        // Create a glow layer for enhanced visual effect
        this.glowLayer = new BABYLON.GlowLayer("nightclub-glow", this.scene);
        this.glowLayer.intensity = 1.0;
        
        // Create a single mega light that illuminates the entire club
        this.createMainLight();
        
        // Set up animation loop
        this.setupAnimations();
        
        // Add emergency exit light
        this.createEmergencyLight();

        // Setup environment and reflections
        this.setupEnvironmentReflections();
        
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
        fixtureMaterial.emissiveColor = new BABYLON.Color3(2.0, 0, 2.0); // Increased from 1.5
        fixtureMaterial.disableLighting = true;
        fixture.material = fixtureMaterial;
        
        this.glowLayer.addIncludedOnlyMesh(fixture);
        
        // Register with INCREASED intensity
        this.mainLightId = this.clusterManager.registerLight({
            position: fixture.position.clone(),
            intensity: 4.0, // Increased from 2.5
            diffuse: new BABYLON.Color3(2.0, 0, 2.0), // Increased color intensity
            specular: new BABYLON.Color3(2.0, 0, 2.0), // Increased specular
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
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "lightPosition", "lightColor", "maxDistance", "time"]
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
            uniform float time;
            
            void main(void) {
                float baseReflectivity = 0.04;
                float maxReflectivity = 1.0;
                
                // Create smooth wave pattern using time
                float wave = sin(time * 0.001) * 0.5 + 0.5; // Converts time to smooth 0-1 range
                
                // Modulate reflectivity with wave
                float reflectivityRange = maxReflectivity - baseReflectivity;
                float currentMaxReflectivity = baseReflectivity + (reflectivityRange * (0.7 + wave * 0.3)); // Varies between 70-100% of range
                
                // Sharper transition with time-based variation
                float reflectivity = mix(baseReflectivity, currentMaxReflectivity, pow(vDistanceFactor, 1.2));
                
                vec3 ambientColor = vec3(0.08, 0.08, 0.08);
                
                // Add subtle pulse to final intensity
                float pulseIntensity = 1.8 + sin(time * 0.002) * 0.4; // Varies between 1.4-2.2
                vec3 finalColor = (lightColor * reflectivity * pulseIntensity) + ambientColor;
                
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

        // Create strobe beams
        this.createStrobeBeams(fixture.position);
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
        
        // Store references for animation
        this.mainLight.volumetricCone = cone;
        this.mainLight.volumetricMaterial = volumetricMaterial;
        
        // Store the original position for the circular movement
        this.calmSequence.movement = {
            angle: 0,
            speed: 0.0005,        // Very slow rotation
            radius: 3.0,          // 3 meters radius - MUCH bigger movement!
            originalPosition: cone.position.clone() // Store initial position
        };
        
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
        
        // Update shader time uniform
        if (this.floorMaterial) {
            this.floorMaterial.setFloat("time", currentTime);
        }
        
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
            
            // Reset volumetric light position when switching modes
            if (!this.sequenceManager.isIntenseMode && this.mainLight.volumetricCone) {
                this.mainLight.volumetricCone.position.copyFrom(this.calmSequence.movement.originalPosition);
                this.mainLight.volumetricCone.rotation.x = Math.PI;
            }
        }

        if (this.sequenceManager.isIntenseMode) {
            // INTENSE SEQUENCE - single color with blackouts
            if (currentTime - this.blackoutTimings.lastChange >= this.blackoutTimings.next) {
                this.blackoutTimings.isBlackout = !this.blackoutTimings.isBlackout;
                this.blackoutTimings.lastChange = currentTime;
                this.blackoutTimings.next = this.getNextBlackoutDuration();
            }

            if (this.blackoutTimings.isBlackout) {
                // Hide strobe beams during blackout
                this.strobeBeams.meshes.forEach(beam => beam.visibility = 0);
                console.log("💥 BLACKOUT");
                this.applyBlackout();
                return;
            }

            // Apply the single chosen color (no cycling)
            const color = this.colorSequence[this.currentColorIndex];
            this.applyIntenseColor(color);
            
            // Show and update strobe beams ONLY during intense mode and NOT during blackouts
            if (this.strobeBeams.material) {
                this.strobeBeams.material.emissiveColor = color.scale(this.intenseMode.intensity);
                this.strobeBeams.meshes.forEach(beam => beam.visibility = 1);
            }

            // Update strobe beam movements when visible
            if (this.strobeBeams.material) {
                this.strobeBeams.meshes.forEach((beam, index) => {
                    const angles = this.strobeBeams.movement.angles[index];
                    const speeds = this.strobeBeams.movement.speeds[index];
                    const ranges = this.strobeBeams.movement.ranges;
                    
                    // Update angles
                    angles.pitch += speeds.pitch;
                    angles.yaw += speeds.yaw;
                    
                    // Reverse direction when reaching limits
                    if (Math.abs(angles.pitch) > ranges.pitch.max) {
                        speeds.pitch *= -1;
                    }
                    if (Math.abs(angles.yaw) > ranges.yaw.max) {
                        speeds.yaw *= -1;
                    }
                    
                    // Apply rotation
                    const rotation = beam.rotationQuaternion.toEulerAngles();
                    rotation.x += angles.pitch;
                    rotation.y += angles.yaw;
                    
                    // Convert back to quaternion
                    beam.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(
                        rotation.x,
                        rotation.y,
                        rotation.z
                    );
                    
                    beam.visibility = 1;
                });
            }
        } else {
            // Hide strobe beams during calm sequence
            this.strobeBeams.meshes.forEach(beam => beam.visibility = 0);
            
            // CALM SEQUENCE - Add gentle horizontal movement to the volumetric cone
            if (this.mainLight.volumetricCone) {
                const movement = this.calmSequence.movement;
                
                // Calculate new position in a gentle horizontal pattern
                movement.angle += movement.speed;
                const offsetX = Math.sin(movement.angle) * movement.radius;
                const offsetZ = Math.cos(movement.angle) * movement.radius;
                
                // Apply smooth movement to the cone - HORIZONTAL ONLY
                this.mainLight.volumetricCone.position.x = movement.originalPosition.x + offsetX;
                this.mainLight.volumetricCone.position.z = movement.originalPosition.z + offsetZ;
                
                // Keep Y position fixed
                this.mainLight.volumetricCone.position.y = movement.originalPosition.y;
                
                // Keep rotation fixed pointing downward
                this.mainLight.volumetricCone.rotation.x = Math.PI;
            }
            
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
    
    createStrobeBeams(centerPosition) {
        // Create shared material for all beams
        const beamMaterial = new BABYLON.StandardMaterial("beam-material", this.scene);
        beamMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        beamMaterial.emissiveColor = new BABYLON.Color3(1.5, 0, 1.5);
        beamMaterial.alpha = 0.2;
        beamMaterial.disableLighting = true;

        // Create alpha gradient
        const alphaTexture = new BABYLON.DynamicTexture("beam-alpha-gradient", 256, this.scene);
        const ctx = alphaTexture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, "rgba(255,255,255,0.6)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        alphaTexture.update();
        
        beamMaterial.opacityTexture = alphaTexture;
        beamMaterial.alphaMode = BABYLON.Engine.ALPHA_COMBINE;

        this.strobeBeams.material = beamMaterial;

        // Create beams in each direction with varying widths
        this.strobeBeams.directions.forEach((direction, index) => {
            // Randomize beam width slightly
            const diameter = 0.3 + Math.random() * 0.4; // Random width between 0.3 and 0.7 meters
            
            const beam = BABYLON.MeshBuilder.CreateCylinder(
                `strobe-beam-${index}`,
                {
                    height: 70,           // Almost full room length (80m room)
                    diameterTop: diameter * 1.5,     // Slightly wider at top
                    diameterBottom: diameter,
                    tessellation: 8,      // Lower tessellation for performance
                    subdivisions: 1
                },
                this.scene
            );

            // Position at center
            beam.position = centerPosition.clone();

            // Calculate rotation to point in the right direction
            const rotationMatrix = BABYLON.Matrix.Zero();
            BABYLON.Matrix.LookAtLHToRef(
                BABYLON.Vector3.Zero(),
                direction,
                BABYLON.Vector3.Up(),
                rotationMatrix
            );
            rotationMatrix.invert();
            const rotation = BABYLON.Quaternion.FromRotationMatrix(rotationMatrix);
            beam.rotationQuaternion = rotation;

            // Apply material
            beam.material = beamMaterial;
            beam.isPickable = false;
            beam.checkCollisions = false;

            // Initially invisible
            beam.visibility = 0;

            this.strobeBeams.meshes.push(beam);
        });

        // Initialize random movement parameters for each beam
        this.strobeBeams.directions.forEach(() => {
            this.strobeBeams.movement.angles.push({
                pitch: Math.random() * Math.PI * 2,
                yaw: Math.random() * Math.PI * 2
            });
            this.strobeBeams.movement.speeds.push({
                pitch: (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1),
                yaw: (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1)
            });
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
        
        // Clean up strobe beams
        this.strobeBeams.meshes.forEach(beam => {
            if (beam) {
                beam.dispose();
            }
        });
        if (this.strobeBeams.material) {
            this.strobeBeams.material.dispose();
        }
        
        // Clean up reflection probe
        if (this.reflectionProbe) {
            this.reflectionProbe.dispose();
        }
        
        // Clean up environment texture
        if (this.scene.environmentTexture) {
            this.scene.environmentTexture.dispose();
        }
        
        // Clear arrays
        this.lights = [];
        this.fixtures = [];
        
        // Note: We don't dispose the cluster manager here as it's managed by the level
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = WORLD_CONFIG.GRID_CELL_SIZE * 40;
        const roomWidth = WORLD_CONFIG.GRID_CELL_SIZE * 80;
        
        // Create outer walls using WallComponent
        const positions = [
            { id: "north", pos: new BABYLON.Vector3(0, wallHeight/2, roomWidth/2), rot: 0 },
            { id: "south", pos: new BABYLON.Vector3(0, wallHeight/2, -roomWidth/2), rot: 0 },
            { id: "east", pos: new BABYLON.Vector3(roomWidth/2, wallHeight/2, 0), rot: Math.PI/2 },
            { id: "west", pos: new BABYLON.Vector3(-roomWidth/2, wallHeight/2, 0), rot: Math.PI/2 }
        ];

        positions.forEach(({ id, pos, rot }) => {
            const wall = new WallComponent(`nightclub-wall-${id}`);
            wall.height = wallHeight;
            wall.width = roomWidth;
            wall.thickness = 0.4;
            wall.initialize(this.scene);
            
            // Create proper material for the wall
            const material = new BABYLON.StandardMaterial(`wall-material-${id}`, this.scene);
            material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            material.backFaceCulling = false;
            
            wall.mesh.material = material;
            wall.mesh.position = pos;
            wall.setRotation(0, rot, 0);
            
            // Enable collisions and proper light blocking
            wall.mesh.checkCollisions = true;
            wall.mesh.isBlocker = true;
            wall.mesh.receiveShadows = true;
            wall.mesh.castShadows = true;
            
            walls.push(wall.mesh);
        });

        return walls;
    }

    createEmergencyLight() {
        const entranceHeight = WORLD_CONFIG.GRID_CELL_SIZE * 3;
        
        // Register light with explicit includedOnlyMeshes
        const emergencyLightId = this.clusterManager.registerLight({
            position: new BABYLON.Vector3(0, entranceHeight - 0.5, -69),
            intensity: 4.0,
            diffuse: new BABYLON.Color3(0, 1, 0),
            specular: new BABYLON.Color3(0, 1, 0),
            range: 12,
            includedOnlyMeshes: [this.entranceFloor] // Explicitly include only the entrance floor
        });
        
        // Create the fixture
        const fixture = BABYLON.MeshBuilder.CreateBox(
            "emergency-light-fixture",
            { height: 0.2, width: 0.4, depth: 0.1 },
            this.scene
        );
        fixture.position = new BABYLON.Vector3(0, entranceHeight - 0.5, -69);
        
        // Make fixture glow
        const fixtureMaterial = new BABYLON.StandardMaterial("emergency-light-material", this.scene);
        fixtureMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
        fixtureMaterial.disableLighting = true;
        fixture.material = fixtureMaterial;
        
        // Create a light pool (visual effect) below the fixture
        const pool = BABYLON.MeshBuilder.CreatePlane("emergency-light-pool", {
            width: 4,
            height: 2
        }, this.scene);
        
        // Create gradient material for light pool
        const poolMaterial = new BABYLON.StandardMaterial("emergency-light-pool-material", this.scene);
        poolMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0).scale(0.3);
        poolMaterial.alpha = 0.3;
        poolMaterial.disableLighting = true;
        
        // Apply gradient texture
        const texture = new BABYLON.DynamicTexture("emergency-gradient", 256, this.scene);
        const ctx = texture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, "rgba(0,255,0,0.7)");
        gradient.addColorStop(1, "rgba(0,255,0,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        texture.update();
        poolMaterial.opacityTexture = texture;
        
        pool.material = poolMaterial;
        pool.position = new BABYLON.Vector3(0, 0.02, -69); // Just above the floor
        pool.rotation.x = Math.PI/2;
        
        // Update entrance floor material to properly reflect the emergency light
        const entranceFloor = this.scene.getMeshByID("entrance-floor");
        if (entranceFloor) {
            const entranceFloorMaterial = new BABYLON.PBRMaterial("entrance-floor-material", this.scene);
            entranceFloorMaterial.albedoColor = new BABYLON.Color3(0.3, 0.3, 0.3);
            entranceFloorMaterial.metallic = 0.9;
            entranceFloorMaterial.roughness = 0.1;
            entranceFloorMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
            entranceFloorMaterial.microSurface = 1.0;
            
            // Ensure the material properly reflects light
            entranceFloorMaterial.usePhysicalLightFalloff = true;
            entranceFloorMaterial.useRadianceOverAlpha = true;
            entranceFloorMaterial.useSpecularOverAlpha = true;
            
            // Make sure the emergency light affects this material
            entranceFloorMaterial.maxSimultaneousLights = 4;
            
            entranceFloor.material = entranceFloorMaterial;
            entranceFloor.receiveShadows = true;
        }
        
        // Add to glow layer
        if (!this.scene.glowLayer) {
            this.scene.glowLayer = new BABYLON.GlowLayer("glow", this.scene);
            this.scene.glowLayer.intensity = 0.7;
        }
        this.scene.glowLayer.addIncludedOnlyMesh(fixture);
        
        this.fixtures.push(fixture);
        this.lights.push({
            id: emergencyLightId,
            fixture: fixture,
            pool: pool,
            isActive: true
        });
    }

    setupEnvironmentReflections() {
        // Create HDR environment texture for reflections
        const hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
            "https://assets.babylonjs.com/environments/environmentSpecular.env",
            this.scene
        );
        
        // Set as scene environment texture
        this.scene.environmentTexture = hdrTexture;
        this.scene.environmentIntensity = 0.5;
        
        // Create a reflection probe for accurate real-time reflections
        const reflectionProbe = new BABYLON.ReflectionProbe("nightclubReflectionProbe", 512, this.scene);
        reflectionProbe.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
        
        // Position the probe in the center of the room
        reflectionProbe.position = new BABYLON.Vector3(0, 20, 0);
        
        // Add meshes that should be reflected
        this.scene.meshes.forEach(mesh => {
            if (mesh.name.includes("nightclub-wall") || 
                mesh.name.includes("nightclub-floor") || 
                mesh.name.includes("nightclub-ceiling") ||
                mesh.name.includes("fixture")) {
                reflectionProbe.renderList.push(mesh);
            }
        });
        
        // Store reference for disposal
        this.reflectionProbe = reflectionProbe;
        
        // Configure image processing for better PBR
        if (!this.scene.imageProcessingConfiguration) {
            this.scene.imageProcessingConfiguration = new BABYLON.ImageProcessingConfiguration();
        }
        const ipc = this.scene.imageProcessingConfiguration;
        ipc.exposure = 1.0;
        ipc.contrast = 1.1;
        ipc.toneMappingEnabled = true;
        
        // Check for character meshes again
        this.scene.meshes.forEach(mesh => {
            if ((mesh.name === "PlayerCharacter" || mesh.name.includes("pdenton_")) && !mesh._reflectionEnhanced) {
                this.enhanceCharacterMaterials(mesh);
            }
        });
    }
} 