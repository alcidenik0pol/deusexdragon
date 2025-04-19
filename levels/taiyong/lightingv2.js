import { ClusterManager } from '../../lighting/ClusterManager.js';
import { WORLD_CONFIG } from '../../config.js';
import { BaseComponent } from '../../components/BaseComponent.js';

// Class for decorative light fixtures that don't use real lights
class NeonFixture extends BaseComponent {
    constructor(id) {
        super(id);
        this.glowColor = new BABYLON.Color3(1, 1, 1);
        this.length = 10;
        this.intensity = 1;
    }

    async initialize(scene, options = {}) {
        super.initialize(scene);
        
        // Create the fixture body
        const fixture = BABYLON.MeshBuilder.CreateBox(this.id, {
            height: 0.1,
            width: this.length,
            depth: 0.2
        }, scene);

        // Create glowing material
        const material = new BABYLON.StandardMaterial(`${this.id}-material`, scene);
        material.emissiveColor = this.glowColor;
        material.disableLighting = true;
        fixture.material = material;

        // Create glow layer if not exists
        if (!scene.glowLayer) {
            scene.glowLayer = new BABYLON.GlowLayer("glow", scene);
            scene.glowLayer.intensity = 0.7;
        }
        scene.glowLayer.addIncludedOnlyMesh(fixture);

        this.mesh = fixture;
        this.material = material;

        // Create light pool below the fixture
        this.createLightPool();
    }

    createLightPool() {
        // Create a plane below the fixture that appears to be illuminated
        const pool = BABYLON.MeshBuilder.CreatePlane(`${this.id}-pool`, {
            width: this.length * 1.5,
            height: this.length / 2
        }, this.scene);

        // Create gradient material for light pool
        const poolMaterial = new BABYLON.StandardMaterial(`${this.id}-pool-material`, this.scene);
        poolMaterial.emissiveColor = this.glowColor.scale(0.3); // Dimmer than the fixture
        poolMaterial.alpha = 0.3;
        poolMaterial.disableLighting = true;

        // Apply gradient texture
        const texture = new BABYLON.DynamicTexture(`${this.id}-gradient`, 256, this.scene);
        const ctx = texture.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, "rgba(255,255,255,0.7)");
        gradient.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        texture.update();
        poolMaterial.opacityTexture = texture;

        pool.material = poolMaterial;
        pool.parent = this.mesh;
        pool.rotation.x = Math.PI/2;
        pool.position.y = -2; // Offset below fixture

        this.lightPool = pool;

        // Create a glow layer specifically for this fixture
        if (!this.scene.glowLayer) {
            this.scene.glowLayer = new BABYLON.GlowLayer("glow", this.scene);
            this.scene.glowLayer.intensity = 0.7;
        }
        this.scene.glowLayer.addIncludedOnlyMesh(this.mesh);
    }

    setIntensity(value) {
        if (this.material) {
            this.material.emissiveColor = this.glowColor.scale(value);
        }
        if (this.lightPool && this.lightPool.material) {
            this.lightPool.material.alpha = 0.3 * value;
        }
    }
}

export class TaiyongLighting {
    constructor(scene) {
        this.scene = scene;
        // Store lighting reference in scene metadata for easy access
        this.scene.metadata = this.scene.metadata || {};
        this.scene.metadata.lighting = this;
        this.clusterManager = new ClusterManager(scene, {
            maxActiveLights: 2,
            debug: false
        });
        this.fixtures = [];
        this.sunsetLight = null; // Store reference to the sunset light
        
        // Turn off ambient light
        this.scene.ambientColor = BABYLON.Color3.Black();
        
        // Create a custom glow layer that respects occlusion
        this.glowLayer = new BABYLON.GlowLayer("glowLayer", scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 64
        });
        this.glowLayer.intensity = 0.7;
    }

    async initialize() {
        const bounds = WORLD_CONFIG.GRID_CELL_SIZE * 8; // Room height
        
        // Create two real lights using cluster manager
        this.createClusteredLights(bounds);
        
        // Create the permanent sunset light
        this.createSunsetLight(bounds);
        
        // Create decorative neon fixtures
        await this.createNeonFixtures(bounds);
        
        // Add lighting controls
        this.setupLightingControls();
    }

    createSunsetLight(height) {
        const sunsetColor = new BABYLON.Color3(1, 0.5, 0.2);
        
        this.sunsetLight = new BABYLON.DirectionalLight(
            "sunsetLight",
            new BABYLON.Vector3(-0.7, -0.3, 0),
            this.scene
        );
        
        this.sunsetLight.intensity = 2.0;
        this.sunsetLight.diffuse = sunsetColor;
        this.sunsetLight.specular = new BABYLON.Color3(1, 0.6, 0.3);

        // Create inclusion/exclusion lists
        this.sunsetLight.includedOnlyMeshes = []; // Only these meshes will receive light
        
        // Get all glass walls to include
        const glassWalls = this.scene.meshes.filter(mesh => 
            mesh.name.includes("glass-outer-wall") && 
            !mesh.name.includes("blinder")
        );
        
        // Add glass walls to inclusion list
        this.sunsetLight.includedOnlyMeshes.push(...glassWalls);

        // Create shadow generator with PCF
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, this.sunsetLight);
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        shadowGenerator.darkness = 1.0;
        
        // Enhanced shadow settings
        shadowGenerator.contactHardeningLightSizeUVRatio = 0.1;
        shadowGenerator.bias = 0.0001;
        shadowGenerator.normalBias = 0.0;
        shadowGenerator.transparencyShadow = true; // Enable for glass walls
        
        shadowGenerator.useExponentialShadowMap = true;
        shadowGenerator.blurScale = 1;
        shadowGenerator.blurBoxOffset = 1;

        // Add shadow casters
        const walls = this.scene.getMeshesByTags("wall");
        walls.forEach(wall => {
            if (wall.isBlocker || wall.tagList.includes("blinder")) {
                shadowGenerator.addShadowCaster(wall, true);
            }
        });

        // Function to update which meshes receive sunset light
        this.updateSunsetReceivers = () => {
            // Clear current receivers
            this.sunsetLight.includedOnlyMeshes = [...glassWalls];
            
            // Get all blinders and calculate average visibility (0 = open, 1 = closed)
            const blinders = this.scene.meshes.filter(mesh => mesh.name.includes("blinder"));
            const avgBlinderClosure = blinders.reduce((sum, blinder) => 
                sum + (blinder.visibility || 0), 0) / blinders.length;
            
            // Get all meshes in the scene
            const allMeshes = this.scene.meshes;
            
            // Add receivers with intensity based on blinder state
            allMeshes.forEach(mesh => {
                if (!mesh.excludedMeshesFromSunsetLight && !mesh.name.includes("blinder")) {
                    if (mesh.name.includes("floor") || 
                        mesh.name.includes("ceiling") || 
                        mesh.name.includes("wall")) {
                        
                        // Add mesh to receivers
                        this.sunsetLight.includedOnlyMeshes.push(mesh);
                        
                        // Adjust material intensity based on blinder state
                        if (mesh.material && mesh.name.includes("floor")) {
                            const baseDiffuse = new BABYLON.Color3(0.1, 0.1, 0.1);
                            const baseSpecular = new BABYLON.Color3(0.2, 0.2, 0.2);
                            const lightFactor = 1 - avgBlinderClosure;

                            // Only modify the sunset material, leave neon material alone
                            if (mesh.sunsetMaterial) {
                                mesh.sunsetMaterial.diffuseColor = baseDiffuse.scale(lightFactor);
                                mesh.sunsetMaterial.specularColor = baseSpecular.scale(lightFactor);
                            }
                        }
                    }
                }
            });
        };

        // Initial update of receivers
        this.updateSunsetReceivers();
        
        // Update receivers periodically
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateSunsetReceivers();
        });

        return shadowGenerator;
    }

    createClusteredLights(height) {
        // Create a warmer, more neon-like color for the real lights
        const neonWarmColor = new BABYLON.Color3(1, 0.85, 0.6);

        // Reference point for neon cluster center
        const NEON_CENTER = new BABYLON.Vector3(-24, height/2, 0);

        // Main light at our neon center reference point
        this.clusterManager.registerLight({
            position: NEON_CENTER,
            intensity: 4.0,
            range: height * 6,
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7),
            excludedMeshes: this.scene.getMeshesByTags("wall")
        });

        // Secondary light with same color profile
        this.clusterManager.registerLight({
            position: new BABYLON.Vector3(-24, height/2, -2),
            intensity: 3.5,
            range: height * 5,
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7),
            excludedMeshes: this.scene.getMeshesByTags("wall")
        });
    }

    async createNeonFixtures(height) {
        // Adjust orange color to match the real lights
        const orangeNeon = new BABYLON.Color3(1, 0.7, 0.3);
        
        const fixtureConfigs = [
            // Orange neons with adjusted color - spread them wider
            { pos: [-25, 0, 5], rot: Math.PI/4, color: orangeNeon, length: 8 },
            { pos: [-15, 0, -5], rot: -Math.PI/4, color: orangeNeon, length: 8 },
            
            // White neons slightly warmer - create more space between them
            { pos: [-30, 0, -8], rot: Math.PI/3, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-10, 0, 8], rot: -Math.PI/3, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-28, 0, 3], rot: Math.PI/6, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 },
            { pos: [-12, 0, -3], rot: -Math.PI/6, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 },
            { pos: [-20, 0, 0], rot: Math.PI/2, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-8, 0, -7], rot: 0, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 }
        ];

        for (const config of fixtureConfigs) {
            const fixture = new NeonFixture(`neon-${this.fixtures.length}`);
            fixture.glowColor = config.color;
            fixture.length = config.length;
            
            await fixture.initialize(this.scene);
            
            fixture.mesh.position = new BABYLON.Vector3(
                config.pos[0],
                height - 0.5, // Just below ceiling
                config.pos[2]
            );
            fixture.mesh.rotation.y = config.rot;
            
            this.fixtures.push(fixture);
        }
    }

    setupLightingControls() {
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("LightingUI");

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.top = "-25px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        adt.addControl(panel);

        // Main light intensity control
        const header = new BABYLON.GUI.TextBlock();
        header.text = "Main Lights";
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1.5;
        slider.value = 1.0;
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add(value => {
            // Update neon fixtures
            this.fixtures.forEach(fixture => fixture.setIntensity(value));
            
            // Update glow layer
            if (this.glowLayer) {
                this.glowLayer.intensity = 0.7 * value;
            }
        });
        panel.addControl(slider);
    }

    updateShadowCasters() {
        if (!this.sunsetLight) return;
        
        const shadowGenerator = this.sunsetLight.getShadowGenerator();
        if (!shadowGenerator) return;
        
        // Get all meshes that should receive the sunset light
        const receiversList = this.scene.meshes.filter(mesh => 
            !mesh.excludedMeshesFromSunsetLight &&  // Not explicitly excluded
            !mesh.name.includes("blinder") &&       // Not a blinder
            (mesh.name.includes("floor") ||         // Is floor
             mesh.name.includes("ceiling") ||       // Is ceiling
             mesh.name.includes("wall"))            // Is wall
        );

        // Set these meshes to receive light from the sunset light
        this.sunsetLight.includedOnlyMeshes = receiversList;
        
        // Update shadow casters (only visible blinder slats should cast shadows)
        const shadowCasters = this.scene.meshes.filter(mesh => 
            mesh.name.includes("-slat-") && 
            mesh.visibility === 1 && 
            mesh.isBlocker
        );
        
        shadowGenerator.getShadowMap().renderList = shadowCasters;
        
        // Force the shadow generator to update
        shadowGenerator.getShadowMap().refreshRate = 1;
    }

    getSunsetLighting() {
        return {
            updateShadowCasters: this.updateShadowCasters.bind(this)
        };
    }

    dispose() {
        if (this.glowLayer) {
            this.glowLayer.dispose();
        }
        
        if (this.sunsetLight) {
            this.sunsetLight.dispose();
        }

        if (this.sunsetShadowGenerator) {
            this.sunsetShadowGenerator.dispose();
        }
        
        this.fixtures.forEach(fixture => {
            if (fixture.dispose) fixture.dispose();
        });
        
        this.clusterManager = null;
    }
} 