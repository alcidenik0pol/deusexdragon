export class NightclubFogEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            minOpacity: 0.01,    // Much lower opacity
            maxOpacity: 0.05,    // Much lower max opacity
            fogStart: 15,        // Start a bit further
            fogEnd: 80,          // End further for more gradual effect
            ...config
        };
        this.originalFogMode = null;
    }

    start() {
        this.originalFogMode = this.scene.fogMode;
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogStart = this.config.fogStart;
        this.scene.fogEnd = this.config.fogEnd;
        
        // Get initial color from main light
        const mainLight = this.scene.getMeshByID("central-cube-light");
        if (mainLight && mainLight.material) {
            this.scene.fogColor = mainLight.material.emissiveColor;
        }
        this.scene.fogDensity = this.config.minOpacity;
    }

    update() {
        // Sync with main light color
        const mainLight = this.scene.getMeshByID("central-cube-light");
        if (mainLight && mainLight.material) {
            this.scene.fogColor = mainLight.material.emissiveColor;
        }
        
        // Very subtle density pulsing
        const time = performance.now() * 0.0002;
        this.scene.fogDensity = this.config.minOpacity + 
            (Math.sin(time) * 0.5 + 0.5) * 
            (this.config.maxOpacity - this.config.minOpacity);
    }

    dispose() {
        if (this.originalFogMode !== null) {
            this.scene.fogMode = this.originalFogMode;
        } else {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
        }
    }
} 