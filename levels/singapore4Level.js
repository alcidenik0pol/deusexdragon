import { LevelGenerator } from '../levelGenerator.js';
import { EffectManager } from '../src/effects/EffectManager.js';

export class Singapore4Level extends LevelGenerator {
    constructor(scene) {
        super(scene);
        // Much larger space
        this.mazeSize = 100;  // Increased from 32 to 100
        this.cellSize = 2;    // Keep small cells for detail
        
        // Initialize effect manager
        this.effectManager = new EffectManager(scene);
        this.flyingCars = [];  // Array to store flying cars
        this.isNightMode = true; // Default to night mode
        this.setupDayNightControls();
    }

    setupDayNightControls() {
        // Create fullscreen UI
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.top = "-25px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        adt.addControl(panel);

        const header = new BABYLON.GUI.TextBlock();
        header.text = "Night to Day";
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1;
        slider.borderColor = "black";
        slider.color = "gray";
        slider.background = "white";
        slider.value = 0; // Start at night
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add((value) => this.updateDayNightCycle(value));
        panel.addControl(slider);
    }

    updateDayNightCycle(value) {
        if (!this.skyMaterial || !this.ambientLight) return;

        // Update sky material - make night MUCH darker
        this.skyMaterial.luminance = 0.0001 + (value * 0.9999); // Reduced 10x more
        this.skyMaterial.turbidity = 20 - (value * 15);  // Much more turbid at night
        this.skyMaterial.rayleigh = 15 - (value * 10);   // Increased scattering
        
        // Update ambient light - make it nearly invisible at night
        this.ambientLight.intensity = 0.0001 + (value * 0.9999); // Reduced 10x more
        this.ambientLight.groundColor = new BABYLON.Color3(0.00001, 0.00001, 0.00002);

        // Update fog - make it almost pure black
        if (value < 0.5) {
            // Night settings - extremely dark fog
            this.effectManager.addEffect('fog', {
                baseColors: ['#000000', '#000000', '#000001'], // Pure black
                minOpacity: 0.95 - (value * 0.95),  // Much denser
                maxOpacity: 0.99 - (value * 0.99)   // Almost opaque
            });
        } else {
            // Day settings
            this.effectManager.addEffect('fog', {
                baseColors: ['#CCCCCC', '#DDDDDD', '#EEEEEE'],
                minOpacity: 0.1,
                maxOpacity: 0.3
            });
        }

        // Make neon lights tiny points in the darkness
        this.neonLights?.forEach(light => {
            light.intensity = 0.1 * (1 - value); // Reduced intensity
            light.range = 4 + (value * 6);       // Much shorter range at night
        });

        // Character materials - make them nearly invisible at night
        const characterMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.includes("Character") || 
            mesh.name.includes("forward") || 
            mesh.name.includes("backward") || 
            mesh.name.includes("left") || 
            mesh.name.includes("right") || 
            mesh.name.includes("idle")
        );

        characterMeshes.forEach(mesh => {
            if (mesh.material) {
                const dayFactor = value * 0.98;
                mesh.material.ambientColor = new BABYLON.Color3(0.02 + dayFactor, 0.02 + dayFactor, 0.03 + dayFactor);
                mesh.material.diffuseColor = new BABYLON.Color3(0.03 + dayFactor, 0.03 + dayFactor, 0.04 + dayFactor);
                mesh.material.specularColor = new BABYLON.Color3(0.02 + dayFactor, 0.02 + dayFactor, 0.03 + dayFactor);
                mesh.material.emissiveColor = new BABYLON.Color3(0.005 + dayFactor, 0.005 + dayFactor, 0.01 + dayFactor);
            }
        });

        // Volumetric lights - make them more focused points
        try {
            if (this.effectManager.activeEffects.has('volumetricLight')) {
                this.effectManager.removeEffect('volumetricLight');
            }
            
            if (value < 0.5) {
                this.effectManager.addEffect('volumetricLight', {
                    beamTypes: {
                        neon: { color: '#FF00FF', intensity: 0.1 * (1 - value), width: 0.1 },
                        corporate: { color: '#00FFFF', intensity: 0.08 * (1 - value), width: 0.1 },
                        warning: { color: '#FF3000', intensity: 0.08 * (1 - value), width: 0.08 }
                    }
                });
            }
        } catch (error) {
            console.warn('Error handling volumetric lights:', error);
        }
    }

    generateDefaultMaze() {
        // Create an empty maze (no walls)
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        
        // Only add boundary walls
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize-1][i] = true;
            maze[i][0] = maze[i][this.mazeSize-1] = true;
        }
        
        return maze;
    }

    createProceduralTextures() {
        // Higher resolution textures for the larger space
        const floorTexture = new BABYLON.DynamicTexture("floorTex", 1024, this.scene);  // Increased resolution
        const floorCtx = floorTexture.getContext();
        
        // Modern city floor texture (grey with subtle grid)
        floorCtx.fillStyle = "#303030";
        floorCtx.fillRect(0, 0, 1024, 1024);
        floorCtx.strokeStyle = "#404040";
        
        // Create a subtle grid pattern
        for (let i = 0; i < 1024; i += 32) {
            floorCtx.beginPath();
            floorCtx.moveTo(i, 0);
            floorCtx.lineTo(i, 1024);
            floorCtx.moveTo(0, i);
            floorCtx.lineTo(1024, i);
            floorCtx.stroke();
        }
        floorTexture.update();

        // Wall texture (glass-like)
        const wallTexture = new BABYLON.DynamicTexture("wallTex", 1024, this.scene);
        const wallCtx = wallTexture.getContext();
        wallCtx.fillStyle = "#87CEEB";  // Sky blue
        wallCtx.fillRect(0, 0, 1024, 1024);
        
        // Add subtle reflective pattern
        for (let i = 0; i < 1024; i += 64) {
            wallCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
            wallCtx.fillRect(0, i, 1024, 32);
        }
        wallTexture.update();

        return { floorTexture, wallTexture };
    }

    async createLevel() {
        // Remove ALL existing lights
        this.scene.lights.forEach(light => light.dispose());
        
        // Create sky material for night atmosphere
        this.skyMaterial = new BABYLON.SkyMaterial("skyMaterial", this.scene);
        this.skyMaterial.backFaceCulling = false;
        
        // Configure for pitch black night sky
        this.skyMaterial.turbidity = 20;          // Much higher
        this.skyMaterial.luminance = 0.0001;      // Much lower
        this.skyMaterial.inclination = 0.99;      // Almost vertical
        this.skyMaterial.rayleigh = 15;           // More scattering
        this.skyMaterial.mieDirectionalG = 0.99;  // More focused scattering
        this.skyMaterial.mieCoefficient = 0.001;  // Reduced coefficient
        
        // Create skybox
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, this.scene);
        skybox.material = this.skyMaterial;
        
        // Ultra minimal hemispheric light
        this.ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.ambientLight.intensity = 0.0001;  // Extremely low intensity
        this.ambientLight.groundColor = new BABYLON.Color3(0.00001, 0.00001, 0.00002);
        
        const levelElements = await super.createLevel();

        // Create a directional light for shadows
        const shadowLight = new BABYLON.DirectionalLight(
            "shadowLight",
            new BABYLON.Vector3(0, -1, 0.5),
            this.scene
        );
        shadowLight.intensity = 0.1;  // Very dim, just for shadows
        
        // Set up shadow generator
        const shadowGenerator = new BABYLON.ShadowGenerator(1024, shadowLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 4;
        shadowGenerator.setDarkness(0.9);  // Very dark shadows
        shadowGenerator.bias = 0.001;

        // Make character meshes extremely dark and enable shadows
        const characterMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.includes("Character") || 
            mesh.name.includes("forward") || 
            mesh.name.includes("backward") || 
            mesh.name.includes("left") || 
            mesh.name.includes("right") || 
            mesh.name.includes("idle")
        );

        characterMeshes.forEach(mesh => {
            if (mesh.material) {
                mesh.material.ambientColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                mesh.material.diffuseColor = new BABYLON.Color3(0.03, 0.03, 0.04);
                mesh.material.specularColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                mesh.material.emissiveColor = new BABYLON.Color3(0.005, 0.005, 0.01);
                mesh.material.alpha = 0.95;
                
                // Enable shadows for character
                mesh.receiveShadows = true;
                shadowGenerator.addShadowCaster(mesh, true);
            }
        });

        // Make ground receive shadows
        if (levelElements.ground) {
            levelElements.ground.receiveShadows = true;
        }

        // Create neon lights
        this.neonLights = [];
        const createNeonLight = (position, color) => {
            const light = new BABYLON.PointLight("neonLight", position, this.scene);
            light.intensity = 0.15;
            light.range = 8;
            light.diffuse = BABYLON.Color3.FromHexString(color);
            light.specular = BABYLON.Color3.FromHexString(color);
            this.neonLights.push(light);
            return light;
        };

        // Sparse neon lights
        [
            { pos: new BABYLON.Vector3(-40, 30, -80), color: '#FF00FF' },
            { pos: new BABYLON.Vector3(40, 25, -90), color: '#00FFFF' },
            { pos: new BABYLON.Vector3(0, 35, -100), color: '#FF3000' }
        ].forEach(({ pos, color }) => createNeonLight(pos, color));

        // Initialize with night mode settings
        this.updateDayNightCycle(0);

        return levelElements;
    }

    updateFlyingCars() {
        for (const car of this.flyingCars) {
            // Move car along X axis
            car.mesh.position.x += car.speed;
            
            // Reset position when reaching the end
            if (car.mesh.position.x > car.endX) {
                car.mesh.position.x = car.startX;
            }
        }
    }

    dispose() {
        // Clean up flying cars
        this.flyingCars.forEach(car => {
            car.mesh.dispose();
        });
        this.flyingCars = [];
        
        this.effectManager.removeEffect('fog');
        this.effectManager.removeEffect('volumetricLight');
        super.dispose();
    }
} 