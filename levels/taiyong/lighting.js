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
        this.entranceMarkers = []; // Add this line to store entrance neon references
        
        // Turn off ambient light
        this.scene.ambientColor = BABYLON.Color3.Black();
        
        // Create a custom glow layer that respects occlusion
        this.glowLayer = new BABYLON.GlowLayer("glowLayer", scene, {
            mainTextureFixedSize: 1024,
            blurKernelSize: 64
        });
        this.glowLayer.intensity = 0.7;

        // Define base material colors
        this.baseDiffuse = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.baseSpecular = new BABYLON.Color3(0.2, 0.2, 0.2);
    }

    async initialize() {
        const bounds = WORLD_CONFIG.GRID_CELL_SIZE * 8; // Room height
        
        // Create two real lights using cluster manager
        this.createClusteredLights(bounds);
        
        // Create the permanent sunset light
        this.createSunsetLight(bounds);
        
        // Create decorative neon fixtures
        await this.createNeonFixtures(bounds);
        
        // Add entrance markers
        await this.createEntranceMarkers();
        
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

        // Create shadow generator with PCF
        const shadowGenerator = new BABYLON.ShadowGenerator(2048, this.sunsetLight);
        shadowGenerator.usePercentageCloserFiltering = true;
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
        shadowGenerator.darkness = 0.0; // Start fully lit
        
        // Enhanced shadow settings
        shadowGenerator.contactHardeningLightSizeUVRatio = 0.1;
        shadowGenerator.bias = 0.0001;
        shadowGenerator.normalBias = 0.0;
        shadowGenerator.transparencyShadow = true;
        
        shadowGenerator.useExponentialShadowMap = true;
        shadowGenerator.blurScale = 1;
        shadowGenerator.blurBoxOffset = 1;

        // Add all receivers
        const receivers = this.scene.meshes.filter(mesh => 
            mesh.name.includes("taiyong-floor") ||
            mesh.name.includes("taiyong-ceiling") ||
            mesh.isDividerWall ||
            mesh.name.includes("glass-outer-wall")
        );
        
        receivers.forEach(mesh => {
            mesh.receiveShadows = true;
        });

        // Function to update sunset intensity through shadow darkness
        this.updateSunsetReceivers = (blinderState) => {
            if (!shadowGenerator) return;
            shadowGenerator.darkness = blinderState; // 1 = dark (closed), 0 = bright (open)
            this.sunsetLight.intensity = 2.0 * (1 - blinderState); // Fade light with blinders
        };

        return shadowGenerator;
    }

    createClusteredLights(height) {
        // Create a warmer, more neon-like color for the real lights
        const neonWarmColor = new BABYLON.Color3(1, 0.85, 0.6);

        // Adjust reference point to be closer to center, but still west side
        const NEON_CENTER = new BABYLON.Vector3(-18, height/2, 0);

        // Main light at our neon center reference point
        this.clusterManager.registerLight({
            position: NEON_CENTER,
            intensity: 6,  // Slightly reduced intensity
            // intensity: 3.0,  // Slightly reduced intensity
            range: height * 4,  // Reduced range to prevent harsh cutoff
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7),
        });

        // Secondary light with same color profile, positioned for better coverage
        this.clusterManager.registerLight({
            position: new BABYLON.Vector3(-12, height/2, -8),  // Adjusted position
            intensity: 4,  // Slightly reduced intensity
            // intensity: 2.5,  // Slightly reduced intensity
            range: height * 3.5,  // Reduced range for softer falloff
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7),
        });

        // Add elevator light in the southwest corner
        this.clusterManager.registerLight({
            position: new BABYLON.Vector3(-37, height/2, -37),  // 3 meters in from both walls
            intensity: 2.0,  // Slightly dimmer than main lights
            range: height * 3,  // Slightly smaller range for more localized lighting
            diffuse: neonWarmColor,
            specular: new BABYLON.Color3(1, 0.9, 0.7),  // Match the neon light properties
        });

        // Add door neon light at the center doorway
        // this.clusterManager.registerLight({
        //     position: new BABYLON.Vector3(0, height - 1, 0),  // Positioned at top of doorway
        //     intensity: 1.8,  // Slightly dimmer for accent lighting
        //     range: height * 2.5,  // Smaller range for focused door lighting
        //     diffuse: new BABYLON.Color3(0.9, 0.95, 1.0),  // Slightly cooler white to match entrance markers
        //     specular: new BABYLON.Color3(0.95, 0.98, 1.0),
        // });
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
            { pos: [-22, 0, -2], rot: Math.PI/3, color: new BABYLON.Color3(1, 0.95, 0.9), length: 10 },
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

    async createEntranceMarkers() {
        const openingWidth = 4; // Match the opening width from taiyongLevel.js
        const markerDepth = 0.05; // Thinner depth (was 0.1)
        const markerWidth = 0.08; // Thinner width (was 0.15)
        const wallHeight = WORLD_CONFIG.GRID_CELL_SIZE * 8;
        
        // Slightly cooler white color for the entrance markers
        const markerColor = new BABYLON.Color3(0.9, 0.95, 1.0);
        
        // Create material for the markers
        const markerMaterial = new BABYLON.StandardMaterial("entrance-marker-material", this.scene);
        markerMaterial.emissiveColor = markerColor;
        markerMaterial.disableLighting = true;
        
        // Create vertical markers (left and right)
        const createVerticalMarker = (side) => {
            const marker = BABYLON.MeshBuilder.CreateBox(`entrance-marker-${side}`, {
                height: wallHeight,
                width: markerWidth,
                depth: markerDepth
            }, this.scene);
            
            marker.material = markerMaterial;
            marker.position = new BABYLON.Vector3(
                0, // Center X
                wallHeight/2, // Center Y
                (openingWidth/2 + markerWidth/2) * (side === 'left' ? -1 : 1) // Z position based on side
            );
            
            return marker;
        };
        
        // Create horizontal marker (top)
        const topMarker = BABYLON.MeshBuilder.CreateBox("entrance-marker-top", {
            height: markerWidth,
            width: openingWidth + markerWidth * 2, // Extend slightly to overlap with vertical markers
            depth: markerDepth
        }, this.scene);
        
        topMarker.material = markerMaterial;
        topMarker.position = new BABYLON.Vector3(
            0, // Center X
            wallHeight - markerWidth/2, // Top Y
            0 // Center Z
        );
        // Add rotation to align with door
        topMarker.rotation = new BABYLON.Vector3(0, Math.PI/2, 0); // Rotate 90 degrees around Y axis
        
        // Create and store the markers
        const leftMarker = createVerticalMarker('left');
        const rightMarker = createVerticalMarker('right');
        
        this.entranceMarkers = [leftMarker, rightMarker, topMarker];
        
        // Add to glow layer
        if (!this.scene.glowLayer) {
            this.scene.glowLayer = new BABYLON.GlowLayer("glow", this.scene);
            this.scene.glowLayer.intensity = 0.7;
        }
        this.entranceMarkers.forEach(marker => {
            this.scene.glowLayer.addIncludedOnlyMesh(marker);
        });
    }

    setupLightingControls() {
        // Method is now empty since we're removing the UI controls
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
        
        // Add disposal of entrance markers
        this.entranceMarkers.forEach(marker => {
            if (marker) marker.dispose();
        });
    }
} 