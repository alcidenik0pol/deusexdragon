export class MaterialFactory {
    constructor(scene) {
        this.scene = scene;
        this.materialCache = new Map();
    }

    getWallMaterial(type) {
        const key = `wall-${type}`;
        if (this.materialCache.has(key)) {
            return this.materialCache.get(key);
        }

        const material = new BABYLON.StandardMaterial(key, this.scene);
        
        // Enhanced wall material
        material.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        material.specularPower = 32; // Controls the sharpness of specular highlights
        material.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        
        // Enable lighting effects
        material.useSpecularInAlpha = false;
        material.useAmbientInGrayScale = true;

        this.materialCache.set(key, material);
        return material;
    }

    getFloorMaterial(type) {
        const key = `floor-${type}`;
        if (this.materialCache.has(key)) {
            return this.materialCache.get(key);
        }

        const material = new BABYLON.StandardMaterial(key, this.scene);
        
        // Enhanced floor material
        material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        material.specularPower = 64; // Higher value for a more polished look
        material.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.1);

        this.materialCache.set(key, material);
        return material;
    }

    disposeMaterial(id) {
        if (this.materialCache.has(id)) {
            const material = this.materialCache.get(id);
            material.dispose();
            this.materialCache.delete(id);
        }
    }
} 