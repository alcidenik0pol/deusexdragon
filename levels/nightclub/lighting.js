import { WORLD_CONFIG } from '../../config.js';

export class NightClubLighting {
    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this.fixtures = [];
        this.clusterManager = null;
        this.animationSpeed = 0.0005; // Controls how fast colors change
        this.mainLight = {
            id: null,
            colorPhase: 0,
            fixture: null,
            fixtureMaterial: null,
            volumetricCone: null,
            volumetricMaterial: null
        };
        this.mainLightId = null;
        this.glowLayer = null;
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
        const roomHeight = WORLD_CONFIG.GRID_CELL_SIZE * 40; // Match the ceiling height of 40 meters
        const roomWidth = WORLD_CONFIG.GRID_CELL_SIZE * 80;
        
        // Create a much larger cube light fixture positioned lower in the room
        const fixture = BABYLON.MeshBuilder.CreateBox(
            "main-light-fixture", 
            {height: 8, width: 8, depth: 8}, // 8x8x8 meter cube for more presence
            this.scene
        );
        fixture.position = new BABYLON.Vector3(0, roomHeight * 0.7, 0); // Position at 70% of room height (28 meters up)
        
        // Create emissive material for the fixture
        const fixtureMaterial = new BABYLON.StandardMaterial("main-fixture-material", this.scene);
        fixtureMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Almost black base
        fixtureMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low specular
        fixtureMaterial.emissiveColor = new BABYLON.Color3(1, 0, 1); // Start with purple
        fixtureMaterial.disableLighting = true; // Make it self-illuminated
        fixture.material = fixtureMaterial;
        
        // Add to glow layer
        this.glowLayer.addIncludedOnlyMesh(fixture);
        
        // Register the mega light with the cluster manager
        // Use a very high intensity and range to cover the entire club
        this.mainLightId = this.clusterManager.registerLight({
            position: fixture.position.clone(),
            intensity: 30.0, // Even higher intensity for better reflections
            diffuse: new BABYLON.Color3(1, 0, 1), // Start with purple
            range: WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 15 // Massive range to cover the whole club
        });
        
        // Store references for animation
        this.mainLight.id = this.mainLightId;
        this.mainLight.fixture = fixture;
        this.mainLight.fixtureMaterial = fixtureMaterial;
        
        this.fixtures.push(fixture);
        
        // Add volumetric light effect
        this.createVolumetricEffect(fixture);
        
        // Create a hemispheric light for ambient illumination
        const ambientLight = new BABYLON.HemisphericLight(
            "ambient-light", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        ambientLight.intensity = 0.15; // Lower intensity for more dramatic effect
        ambientLight.diffuse = new BABYLON.Color3(0.2, 0.2, 0.3); // Bluish ambient
        ambientLight.groundColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Very dark ground reflection
        
        this.lights.push(ambientLight);
        
        // Add secondary point lights for better wall illumination
        this.addSecondaryLights();
    }
    
    createVolumetricEffect(fixture) {
        // Create a cone for the volumetric light effect
        const cone = BABYLON.MeshBuilder.CreateCylinder(
            "light-cone", 
            {
                height: 30, 
                diameterTop: 8, 
                diameterBottom: 40, 
                tessellation: 24,
                subdivisions: 1
            }, 
            this.scene
        );
        
        // Position below the fixture pointing down
        cone.position = fixture.position.clone();
        cone.position.y -= 15; // Center of cone is 15m below fixture
        
        // Rotate to point downward
        cone.rotation.x = Math.PI;
        
        // Create volumetric material
        const volumetricMaterial = new BABYLON.StandardMaterial("volumetric-material", this.scene);
        volumetricMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        volumetricMaterial.emissiveColor = new BABYLON.Color3(1, 0, 1); // Start with purple
        volumetricMaterial.alpha = 0.15; // Very transparent
        volumetricMaterial.disableLighting = true;
        
        // Add alpha gradient texture
        const alphaTexture = new BABYLON.DynamicTexture("alpha-gradient", 256, this.scene);
        const ctx = alphaTexture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, "rgba(255,255,255,0.4)");
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
                intensity: 10.0, // Medium intensity
                diffuse: new BABYLON.Color3(1, 0, 1), // Start with purple
                range: WORLD_CONFIG.LIGHTING.DEFAULT_LIGHT_RANGE * 5 // Medium range
            });
            
            // Store for animation
            this.lights.push({
                id: lightId,
                colorPhase: Math.PI * index / 2, // Offset phase for each light
                position: position
            });
        });
    }
    
    setupAnimations() {
        // Register animation loop
        this.scene.registerBeforeRender(() => {
            this.updateLights();
        });
    }
    
    updateLights() {
        const currentTime = performance.now();
        
        // Animate the main light color
        this.mainLight.colorPhase += this.animationSpeed;
        
        // Calculate RGB values using sine waves with different phases
        // This creates a smooth transition between colors
        const r = (Math.sin(this.mainLight.colorPhase) + 1) / 2;
        const g = (Math.sin(this.mainLight.colorPhase + 2.1) + 1) / 2;
        const b = (Math.sin(this.mainLight.colorPhase + 4.2) + 1) / 2;
        
        const newColor = new BABYLON.Color3(r, g, b);
        
        // Update main light color
        this.clusterManager.updateLightProperty(this.mainLight.id, 'diffuse', newColor);
        this.mainLight.fixtureMaterial.emissiveColor = newColor;
        
        // Update volumetric cone color
        if (this.mainLight.volumetricMaterial) {
            this.mainLight.volumetricMaterial.emissiveColor = newColor;
        }
        
        // Pulse the intensity slightly for a more dynamic effect
        const pulseIntensity = 25.0 + Math.sin(currentTime * this.animationSpeed * 0.5) * 8.0;
        this.clusterManager.updateLightProperty(this.mainLight.id, 'intensity', pulseIntensity);
        
        // Update secondary lights with offset colors
        this.lights.forEach((light, index) => {
            if (light.id !== undefined) {
                // Offset the color phase for each light
                const phase = this.mainLight.colorPhase + index * Math.PI / 2;
                
                const r2 = (Math.sin(phase) + 1) / 2;
                const g2 = (Math.sin(phase + 2.1) + 1) / 2;
                const b2 = (Math.sin(phase + 4.2) + 1) / 2;
                
                const secondaryColor = new BABYLON.Color3(r2, g2, b2);
                this.clusterManager.updateLightProperty(light.id, 'diffuse', secondaryColor);
                
                // Pulse secondary lights too, but with different timing
                const secondaryPulse = 8.0 + Math.sin(currentTime * this.animationSpeed * 0.3 + index) * 3.0;
                this.clusterManager.updateLightProperty(light.id, 'intensity', secondaryPulse);
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