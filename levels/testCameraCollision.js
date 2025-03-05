import { LevelGenerator } from '../levelGenerator.js';
import { WallComponent } from '../components/WallComponent.js';
import { FloorComponent } from '../components/FloorComponent.js';
import { CeilingComponent } from '../components/NEWCeilingComponent.js';

export class TestCameraCollision extends LevelGenerator {
    // Define level boundaries/constraints
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,  // Floor is always at y=0
            width: 20,
            length: 20
        },
        ceiling: {
            y: 4,  // Ceiling height
            width: 20,
            length: 20
        },
        walls: {
            height: 4,  // Same as ceiling.y
            positions: {
                north: new BABYLON.Vector3(0, 2, 10),   // Half height for center
                south: new BABYLON.Vector3(0, 2, -10),
                east: new BABYLON.Vector3(10, 2, 0),
                west: new BABYLON.Vector3(-10, 2, 0)
            }
        },
        room: {
            width: 20,
            length: 20,
            height: 4
        }
    };

    constructor(scene) {
        super(scene);
        this.components = [];
    }

    async createLevel() {
        const bounds = TestCameraCollision.LEVEL_BOUNDS;

        // Create floor
        const floor = new FloorComponent('test-floor');
        floor.width = bounds.floor.width;
        floor.length = bounds.floor.length;
        floor.initialize(this.scene);
        floor.position = new BABYLON.Vector3(0, bounds.floor.y, 0);
        
        // Add white material to floor
        const floorMaterial = new BABYLON.StandardMaterial("floor-material", this.scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        floor.mesh.material = floorMaterial;
        
        this.components.push(floor);

        // Create ceiling
        const ceiling = new CeilingComponent('test-ceiling');
        ceiling.width = bounds.ceiling.width;
        ceiling.length = bounds.ceiling.length;
        ceiling.position = new BABYLON.Vector3(0, bounds.ceiling.y, 0);
        ceiling.initialize(this.scene);
        this.components.push(ceiling);

        // Create all four walls
        const createWall = (id, position, rotation) => {
            const wall = new WallComponent(id);
            wall.width = bounds.room.width;
            wall.height = bounds.walls.height;
            wall.position = position;
            wall.initialize(this.scene);
            if (rotation) {
                wall.mesh.rotation.y = rotation;
            }
            
            // Add grey material
            const wallMaterial = new BABYLON.StandardMaterial(id + "-material", this.scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            wall.mesh.material = wallMaterial;
            
            this.components.push(wall);
            return wall;
        };

        // Create all four walls using the boundary positions
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