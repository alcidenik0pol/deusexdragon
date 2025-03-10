import { BuildingComponent } from '../../components/BuildingComponent.js';

class Building extends BuildingComponent {
    constructor(id, config) {
        super(id, config);
    }
}

export class Singapore5Buildings {
    // Predefined building types with consistent dimensions but varying heights
    static BUILDING_TYPES = {
        RESIDENTIAL_TOWER: { name: "residential_tower", width: 12, depth: 12, height: 45 },
        OFFICE_BLOCK: { name: "office_block", width: 15, depth: 15, height: 60 },
        CORPORATE_HQ: { name: "corporate_hq", width: 20, depth: 20, height: 80 },
        HOTEL_TOWER: { name: "hotel_tower", width: 14, depth: 14, height: 70 },
        SHOPPING_COMPLEX: { name: "shopping_complex", width: 25, depth: 25, height: 30 },
        GOVERNMENT_BUILDING: { name: "government_building", width: 18, depth: 18, height: 40 },
        TECH_HUB: { name: "tech_hub", width: 16, depth: 16, height: 55 },
        FINANCIAL_CENTER: { name: "financial_center", width: 22, depth: 22, height: 75 },
        APARTMENT_BLOCK: { name: "apartment_block", width: 13, depth: 13, height: 50 },
        MEDIA_CENTER: { name: "media_center", width: 17, depth: 17, height: 35 }
    };

    constructor(scene) {
        this.scene = scene;
        this.buildings = [];
        this.buildingMaterial = this.createBuildingMaterial();
    }

    createBuildingMaterial() {
        const material = new BABYLON.StandardMaterial("buildingMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        material.specularColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        material.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);
        return material;
    }

    async createBuildings() {
        // Example layout - can be easily modified
        const buildingLayout = [
            { type: 'CORPORATE_HQ', x: -50, z: -80 },
            { type: 'RESIDENTIAL_TOWER', x: -30, z: -70 },
            { type: 'TECH_HUB', x: 30, z: -75 },
            { type: 'FINANCIAL_CENTER', x: 50, z: -85 },
            { type: 'HOTEL_TOWER', x: -40, z: -100 },
            { type: 'OFFICE_BLOCK', x: 40, z: -95 },
            { type: 'APARTMENT_BLOCK', x: -20, z: -90 },
            { type: 'GOVERNMENT_BUILDING', x: 20, z: -110 },
            { type: 'SHOPPING_COMPLEX', x: -60, z: -95 },
            { type: 'MEDIA_CENTER', x: 60, z: -105 }
        ];

        buildingLayout.forEach(({ type, x, z }) => {
            this.createBuilding(type, x, z);
        });
    }

    createBuilding(buildingType, x, z) {
        const buildingConfig = Singapore5Buildings.BUILDING_TYPES[buildingType];
        if (!buildingConfig) {
            console.warn(`Building type ${buildingType} not found`);
            return;
        }

        const building = new Building(`${buildingType}_${x}_${z}`, buildingConfig);
        building.position = new BABYLON.Vector3(x, buildingConfig.height/2, z);
        building.initialize(this.scene, { material: this.buildingMaterial });
        
        this.buildings.push(building);
        return building;
    }

    dispose() {
        this.buildings.forEach(building => {
            building.dispose();
        });
        this.buildings = [];
    }

    // New utility methods that use BuildingComponent features
    highlightBuilding(buildingId, enabled = true) {
        const building = this.buildings.find(b => b.id === buildingId);
        if (building) {
            building.setHighlight(enabled);
        }
    }

    setBuildingDimensions(buildingId, width, depth, height) {
        const building = this.buildings.find(b => b.id === buildingId);
        if (building) {
            building.setDimensions(width, depth, height);
        }
    }
} 