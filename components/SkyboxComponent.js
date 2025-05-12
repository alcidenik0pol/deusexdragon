export class SkyboxComponent {
    constructor(scene) {
        this.scene = scene;
        this.skybox = null;
    }

    setupSkybox(options = {}) {
        const {
            size = 1000,
            rootUrl = "",
            fileNames = null,
            customMaterial = null
        } = options;

        // Create the skybox
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: size }, this.scene);
        
        // Important: Add these lines to ensure skybox is always visible and behind everything
        this.skybox.infiniteDistance = true;
        this.skybox.renderingGroupId = 0;
        
        if (customMaterial) {
            // Use the provided custom material
            this.skybox.material = customMaterial;
            // Ensure material settings are correct for skybox
            this.skybox.material.backFaceCulling = false;
            this.skybox.material.disableLighting = true;
        } else if (fileNames) {
            // Create the cube texture skybox material
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.disableLighting = true;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(rootUrl, this.scene, fileNames);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            
            this.skybox.material = skyboxMaterial;
        } else {
            throw new Error("Either customMaterial or fileNames must be provided");
        }
    }

    dispose() {
        if (this.skybox) {
            if (this.skybox.material) {
                if (this.skybox.material.reflectionTexture) {
                    this.skybox.material.reflectionTexture.dispose();
                }
                this.skybox.material.dispose();
            }
            this.skybox.dispose();
        }
    }
} 