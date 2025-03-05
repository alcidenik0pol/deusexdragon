import { LevelGenerator } from '../levelGenerator.js';
import { WallComponent } from '../components/WallComponent.js';
import { FloorComponent } from '../components/FloorComponent.js';
import { CeilingComponent } from '../components/NEWCeilingComponent.js';

export class NightClub extends LevelGenerator {
    // Define level boundaries/constraints
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: 60,
            length: 60
        },
        ceiling: {
            y: 6,
            width: 60,
            length: 60
        },
        walls: {
            height: 6,
            positions: {
                north: new BABYLON.Vector3(0, 3, 30),
                south: new BABYLON.Vector3(0, 3, -30),
                east: new BABYLON.Vector3(30, 3, 0),
                west: new BABYLON.Vector3(-30, 3, 0)
            }
        },
        room: {
            width: 60,
            length: 60,
            height: 6
        }
    };

    constructor(scene) {
        super(scene);
        this.components = [];
    }

    async createLevel() {
        const bounds = NightClub.LEVEL_BOUNDS;

        // Create floor
        const floor = new FloorComponent('nightclub-floor');
        floor.width = bounds.floor.width;
        floor.length = bounds.floor.length;
        floor.initialize(this.scene);
        floor.position = new BABYLON.Vector3(0, bounds.floor.y, 0);
        
        const floorMaterial = new BABYLON.StandardMaterial("floor-material", this.scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        floor.mesh.material = floorMaterial;
        
        this.components.push(floor);

        // Create ceiling
        const ceiling = new CeilingComponent('nightclub-ceiling');
        ceiling.width = bounds.ceiling.width;
        ceiling.length = bounds.ceiling.length;
        ceiling.position = new BABYLON.Vector3(0, bounds.ceiling.y, 0);
        ceiling.initialize(this.scene, {
            width: bounds.ceiling.width,    // Pass width explicitly to override default
            length: bounds.ceiling.length   // Pass length explicitly to override default
        });
        this.components.push(ceiling);

        // Create walls helper function
        const createWall = (id, position, rotation) => {
            const wall = new WallComponent(id);
            wall.width = bounds.room.length;  // Using length for proper wall sizing
            wall.height = bounds.walls.height;
            wall.position = position;
            wall.initialize(this.scene);
            if (rotation) {
                wall.mesh.rotation.y = rotation;
            }
            
            const wallMaterial = new BABYLON.StandardMaterial(id + "-material", this.scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            wall.mesh.material = wallMaterial;
            
            this.components.push(wall);
            return wall;
        };

        // Create all four walls
        const southWall = createWall('south-wall', bounds.walls.positions.south);
        const northWall = createWall('north-wall', bounds.walls.positions.north);
        const eastWall = createWall('east-wall', bounds.walls.positions.east, Math.PI / 2);
        const westWall = createWall('west-wall', bounds.walls.positions.west, Math.PI / 2);

        // Setup basic lighting
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        light.intensity = 0.7;

        return {
            ground: floor.mesh,
            walls: [southWall.mesh, northWall.mesh, eastWall.mesh, westWall.mesh],
            cellSize: 1
        };
    }
} 