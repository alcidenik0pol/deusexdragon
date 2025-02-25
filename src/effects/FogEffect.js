export class FogEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            // Deus Ex: Human Revolution inspired palette
            baseColors: [
                '#FFA000',  // Dominant amber/orange
                '#1E3F57',  // Deep blue accent
                '#2A5C1E'   // Dark green accent
            ],
            minOpacity: 0.15,
            maxOpacity: 0.85,
            ...config
        };
        this.currentColorIndex = 0;
        this.transitionTime = 0;
    }

    start() {
        this.scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
        this.scene.fogDensity = 0.01;
        this.scene.fogColor = BABYLON.Color3.FromHexString(this.config.baseColors[0]);
    }

    update() {
        // Slowly transition between colors
        this.transitionTime += 0.001;
        if (this.transitionTime >= 1) {
            this.transitionTime = 0;
            this.currentColorIndex = (this.currentColorIndex + 1) % this.config.baseColors.length;
        }

        const currentColor = BABYLON.Color3.FromHexString(this.config.baseColors[this.currentColorIndex]);
        const nextColor = BABYLON.Color3.FromHexString(
            this.config.baseColors[(this.currentColorIndex + 1) % this.config.baseColors.length]
        );

        // Lerp between colors
        const lerpedColor = BABYLON.Color3.Lerp(currentColor, nextColor, this.transitionTime);
        this.scene.fogColor = lerpedColor;
    }

    dispose() {
        this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
    }
} 