export class Singapore6Lighting {
    constructor(scene) {
        this.scene = scene;
        this.light = null;
        // Set scene ambient color to black
        this.scene.ambientColor = BABYLON.Color3.Black();
        this.setupLighting();
        this.setupLightingControls();
    }

    setupLighting() {
        // Create hemispheric light
        this.light = new BABYLON.HemisphericLight(
            "mainLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.light.intensity = 0.7; // Default intensity
        this.light.groundColor = new BABYLON.Color3(0, 0, 0); // Set to black
        this.light.specular = new BABYLON.Color3(0, 0, 0); // Disable specular
        
        return this.light;
    }

    setupLightingControls() {
        // Create GUI for light control
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("LightingUI");

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.top = "-25px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        adt.addControl(panel);

        const header = new BABYLON.GUI.TextBlock();
        header.text = "Light Intensity";
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = 0.7; // Match default intensity
        slider.height = "20px";
        slider.width = "200px";
        slider.color = "gray";
        slider.background = "white";
        slider.borderColor = "black";
        slider.onValueChangedObservable.add((value) => {
            if (this.light) {
                this.light.intensity = value;
            }
        });
        panel.addControl(slider);
    }

    dispose() {
        if (this.light) {
            this.light.dispose();
        }
    }
} 