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
        this.clusterManager = new ClusterManager(scene, {
            maxActiveLights: 2,
            debug: false
        });
        this.fixtures = [];
        
        // Turn off ambient light
        this.scene.ambientColor = BABYLON.Color3.Black();
        
        // Create a glow layer for the neon effects
        this.glowLayer = new BABYLON.GlowLayer("glowLayer", scene);
        this.glowLayer.intensity = 0.7;
    }

    async initialize() {
        const bounds = WORLD_CONFIG.GRID_CELL_SIZE * 8; // Room height
        
        // Create two real lights using cluster manager
        this.createClusteredLights(bounds);
        
        // Create decorative neon fixtures
        await this.createNeonFixtures(bounds);
        
        // Add lighting controls
        this.setupLightingControls();
    }

    createClusteredLights(height) {
        // Create a warmer, more neon-like color for the real lights
        const neonWarmColor = new BABYLON.Color3(1, 0.85, 0.6); // More orange-tinted warm color

        // Main light in the corner, matching neon aesthetic
        this.clusterManager.registerLight({
            position: new BABYLON.Vector3(-25, height/2, -25),
            intensity: 4.0, // Increased for more dramatic effect
            range: height * 6,
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7) // Increased specular for neon-like shine
        });

        // Secondary light with same color profile
        this.clusterManager.registerLight({
            position: new BABYLON.Vector3(-15, height/2, -15),
            intensity: 3.5,
            range: height * 5,
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7)
        });
    }

    async createNeonFixtures(height) {
        // Adjust orange color to match the real lights
        const orangeNeon = new BABYLON.Color3(1, 0.7, 0.3); // More intense orange
        
        const fixtureConfigs = [
            // Orange neons with adjusted color
            { pos: [-25, 0, -20], rot: Math.PI/4, color: orangeNeon, length: 8 },
            { pos: [-20, 0, -25], rot: -Math.PI/4, color: orangeNeon, length: 8 },
            
            // White neons slightly warmer
            { pos: [-25, 0, -15], rot: Math.PI/3, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-15, 0, -25], rot: -Math.PI/3, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-20, 0, -20], rot: Math.PI/6, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 },
            { pos: [-22, 0, -18], rot: -Math.PI/6, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 },
            { pos: [-18, 0, -22], rot: Math.PI/2, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
            { pos: [-15, 0, -15], rot: 0, color: new BABYLON.Color3(1, 0.95, 0.9), length: 8 }
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

    dispose() {
        if (this.glowLayer) {
            this.glowLayer.dispose();
        }
        
        this.fixtures.forEach(fixture => {
            if (fixture.dispose) fixture.dispose();
        });
        
        this.clusterManager = null;
    }
} 