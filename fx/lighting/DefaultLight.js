export class DefaultLight {
    static DEFAULT_CONFIG = {
        lightIntensity: 1.0,
        lightPosition: new BABYLON.Vector3(0, 10, 0)
    };

    constructor(scene, config = {}) {
        this.scene = scene;
        this.config = { ...DefaultLight.DEFAULT_CONFIG, ...config };
        this.light = this.setupLighting();
    }

    setupLighting() {
        const light = new BABYLON.HemisphericLight(
            "defaultLight", 
            this.config.lightPosition,
            this.scene
        );
        light.intensity = this.config.lightIntensity;
        return light;
    }

    dispose() {
        if (this.light) {
            this.light.dispose();
        }
    }
} 