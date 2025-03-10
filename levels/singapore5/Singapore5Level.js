import { CustomLevel } from '../../customLevel.js';
import { Singapore5Buildings } from './buildings.js';
import { Singapore5Vehicles } from './vehicles.js';

export class Singapore5Level extends CustomLevel {
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: 200,  // Larger area for Singapore cityscape
            length: 200
        },
        room: {
            width: 200,
            length: 200,
            height: 100  // Higher ceiling for tall buildings
        }
    };

    constructor(scene, config = {}) {
        const customConfig = {
            ...CustomLevel.DEFAULT_CONFIG,
            cellSize: 4,
            mazeSize: 50,
            lightIntensity: 2.0,  // Brighter lighting for city environment
            lightPosition: new BABYLON.Vector3(0, 80, 0),  // Higher light position
            ...config
        };
        super(scene, customConfig);
        
        this.buildings = null;
        this.vehicles = null;
    }

    async createLevel() {
        const levelData = await super.createLevel();

        // Initialize and create buildings
        this.buildings = new Singapore5Buildings(this.scene);
        await this.buildings.createBuildings();

        // Initialize and create vehicles
        this.vehicles = new Singapore5Vehicles(this.scene);
        await this.vehicles.createVehicles();

        // Add components to be cleaned up later
        this.components.push(this.buildings);
        this.components.push(this.vehicles);

        return levelData;
    }

    update() {
        // Update vehicle animations
        if (this.vehicles) {
            this.vehicles.updateVehicles();
        }
    }

    dispose() {
        super.dispose();
    }
} 