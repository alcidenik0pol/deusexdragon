import { CustomLevel } from '../../customLevel.js';
import { GridConfig } from './GridConfig.js';
import { testLevel } from './testLevel.js';

export class GridLevel extends CustomLevel {
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: 200,
            length: 200
        },
        room: {
            width: 200,
            length: 200,
            height: 100
        }
    };

    constructor(scene, config = {}) {
        super(scene, config);
        this.grid = this.loadGridData();
        this.gridObjects = new Map(); // Store references to created objects
    }

    // Load the level layout from a grid definition
    loadGridData() {
        return testLevel;
    }

    // Convert grid coordinates to world coordinates
    gridToWorld(gridX, gridY) {
        const worldX = (gridX - GridConfig.GRID_WIDTH/2) * GridConfig.CELL_SIZE;
        const worldZ = (gridY - GridConfig.GRID_HEIGHT/2) * GridConfig.CELL_SIZE;
        return new BABYLON.Vector3(worldX, 0, worldZ);
    }

    // Convert world coordinates to grid coordinates
    worldToGrid(worldX, worldZ) {
        const gridX = Math.floor((worldX / GridConfig.CELL_SIZE) + GridConfig.GRID_WIDTH/2);
        const gridY = Math.floor((worldZ / GridConfig.CELL_SIZE) + GridConfig.GRID_HEIGHT/2);
        return { x: gridX, y: gridY };
    }

    async createLevel() {
        const levelData = await super.createLevel();
        
        // Create debug grid visualization
        this.createGridVisualization();
        
        // Create objects based on grid data
        await this.createGridObjects();
        
        return levelData;
    }

    createGridVisualization() {
        const size = GridConfig.CELL_SIZE * GridConfig.GRID_WIDTH;
        const start = -size / 2;
        const end = size / 2;
        
        // Create a container for all grid lines
        const gridContainer = new BABYLON.TransformNode("gridContainer", this.scene);
        
        // Create grid lines
        for (let i = 0; i <= GridConfig.GRID_WIDTH; i++) {
            const pos = start + (i * GridConfig.CELL_SIZE);
            
            // Vertical lines
            const verticalPoints = [
                new BABYLON.Vector3(pos, 0.1, start),
                new BABYLON.Vector3(pos, 0.1, end)
            ];
            const verticalLine = BABYLON.MeshBuilder.CreateLines(
                `gridLineV${i}`,
                { points: verticalPoints },
                this.scene
            );
            
            // Horizontal lines
            const horizontalPoints = [
                new BABYLON.Vector3(start, 0.1, pos),
                new BABYLON.Vector3(end, 0.1, pos)
            ];
            const horizontalLine = BABYLON.MeshBuilder.CreateLines(
                `gridLineH${i}`,
                { points: horizontalPoints },
                this.scene
            );
            
            // Set color and transparency
            verticalLine.color = new BABYLON.Color3(0.5, 0.5, 0.5);
            horizontalLine.color = new BABYLON.Color3(0.5, 0.5, 0.5);
            verticalLine.alpha = 0.3;
            horizontalLine.alpha = 0.3;
            
            // Parent to container
            verticalLine.parent = gridContainer;
            horizontalLine.parent = gridContainer;
        }
        
        this.components.push(gridContainer);
    }

    async createGridObjects() {
        const { map, legend } = this.grid;
        
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const tile = map[y][x];
                if (tile === GridConfig.TILES.EMPTY) continue;
                
                const objectDef = legend[tile];
                if (!objectDef) continue;

                const worldPos = this.gridToWorld(x, y);
                
                // Store the created object with its grid position
                this.gridObjects.set(`${x},${y}`, {
                    type: objectDef.type,
                    worldPosition: worldPos,
                    gridPosition: { x, y },
                    object: await this.createObjectFromDef(objectDef, worldPos)
                });
            }
        }
    }

    async createObjectFromDef(objectDef, worldPos) {
        switch (objectDef.type) {
            case 'BUILDING':
                return this.createBuilding(objectDef, worldPos);
            case 'VEHICLE_SPAWN':
                return this.createVehicleSpawn(objectDef, worldPos);
            case 'PLAYER_SPAWN':
                return this.createPlayerSpawn(objectDef, worldPos);
            case 'VEHICLE_PATH':
                return this.createPathMarker(objectDef, worldPos);
            default:
                console.warn(`Unknown object type: ${objectDef.type}`);
                return null;
        }
    }

    createBuilding(objectDef, worldPos) {
        // Create a simple box for now
        const height = 20; // or vary by variant
        const building = BABYLON.MeshBuilder.CreateBox("building", {
            height: height,
            width: GridConfig.CELL_SIZE,
            depth: GridConfig.CELL_SIZE
        }, this.scene);
        
        building.position = new BABYLON.Vector3(
            worldPos.x,
            height/2,
            worldPos.z
        );
        
        const material = new BABYLON.StandardMaterial("buildingMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        building.material = material;
        
        return building;
    }

    createVehicleSpawn(objectDef, worldPos) {
        // Create a marker for vehicle spawn points
        const marker = BABYLON.MeshBuilder.CreateCylinder("vehicleSpawn", {
            height: 2,
            diameter: 4
        }, this.scene);
        
        marker.position = new BABYLON.Vector3(
            worldPos.x,
            1,
            worldPos.z
        );
        
        const material = new BABYLON.StandardMaterial("spawnMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(1, 0, 0);
        material.alpha = 0.5;
        marker.material = material;
        
        return marker;
    }

    createPlayerSpawn(objectDef, worldPos) {
        // Create a marker for player spawn point
        const marker = BABYLON.MeshBuilder.CreateSphere("playerSpawn", {
            diameter: 2
        }, this.scene);
        
        marker.position = new BABYLON.Vector3(
            worldPos.x,
            1,
            worldPos.z
        );
        
        const material = new BABYLON.StandardMaterial("playerSpawnMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0, 1, 0);
        material.alpha = 0.5;
        marker.material = material;
        
        return marker;
    }

    createPathMarker(objectDef, worldPos) {
        // Create a marker for path points
        const marker = BABYLON.MeshBuilder.CreateBox("pathMarker", {
            height: 0.5,
            width: GridConfig.CELL_SIZE,
            depth: GridConfig.CELL_SIZE
        }, this.scene);
        
        marker.position = new BABYLON.Vector3(
            worldPos.x,
            objectDef.height || 0.25,
            worldPos.z
        );
        
        const material = new BABYLON.StandardMaterial("pathMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(1, 1, 0);
        material.alpha = 0.3;
        marker.material = material;
        
        return marker;
    }

    // Helper method to update a tile
    updateTile(x, y, newTileType) {
        // Remove existing object if any
        const key = `${x},${y}`;
        if (this.gridObjects.has(key)) {
            const obj = this.gridObjects.get(key);
            obj.object.dispose();
            this.gridObjects.delete(key);
        }

        // Update the map
        this.grid.map[y][x] = newTileType;

        // Create new object if not empty
        if (newTileType !== GridConfig.TILES.EMPTY) {
            const objectDef = this.grid.legend[newTileType];
            const worldPos = this.gridToWorld(x, y);
            this.createObjectFromDef(objectDef, worldPos);
        }
    }

    dispose() {
        this.gridObjects.clear();
        super.dispose();
    }
} 