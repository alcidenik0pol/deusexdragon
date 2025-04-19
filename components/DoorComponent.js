import { BaseComponent } from './BaseComponent.js';

export class DoorComponent extends BaseComponent {
    static DOOR_WIDTH = 4; // Standard width matching current opening
    static DOOR_HEIGHT = 8; // Standard height (one grid cell)
    static DOOR_THICKNESS = 0.1; // Thinner than walls

    constructor(id) {
        super(id);
        this.isLocked = false;
        this.isOpen = false;
        this.doorMesh = null;
        this.centerLineMesh = null;
    }

    async initialize(scene, options = {}) {
        super.initialize(scene);

        // Create the main door mesh
        this.doorMesh = BABYLON.MeshBuilder.CreateBox(`${this.id}-door`, {
            height: DoorComponent.DOOR_HEIGHT,
            width: DoorComponent.DOOR_WIDTH,
            depth: DoorComponent.DOOR_THICKNESS
        }, scene);

        // Dark gray material for the door
        const doorMaterial = new BABYLON.StandardMaterial(`${this.id}-material`, scene);
        doorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        doorMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        this.doorMesh.material = doorMaterial;

        // Create the center line
        this.centerLineMesh = BABYLON.MeshBuilder.CreateBox(`${this.id}-centerline`, {
            height: DoorComponent.DOOR_HEIGHT,
            width: 0.02,
            depth: DoorComponent.DOOR_THICKNESS + 0.01
        }, scene);

        // Darker material for the center line
        const lineMaterial = new BABYLON.StandardMaterial(`${this.id}-line-material`, scene);
        lineMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        lineMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        this.centerLineMesh.material = lineMaterial;

        // Parent the center line to the door mesh
        this.centerLineMesh.parent = this.doorMesh;

        // Store reference to main mesh
        this.mesh = this.doorMesh;

        // Set initial state
        this.isOpen = true;
        this.isLocked = false;

        // Initialize as open (scaled to 0)
        this.setOpen(true);
    }

    setOpen(open) {
        this.isOpen = open;
        if (this.doorMesh && this.centerLineMesh) {
            const scale = open ? 0 : 1;
            [this.doorMesh, this.centerLineMesh].forEach(mesh => {
                mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                mesh.checkCollisions = !open;
                mesh.isWalkthrough = open;
            });
        }
        return true;
    }

    getMeshes() {
        return [this.doorMesh, this.centerLineMesh];
    }

    dispose() {
        if (this.centerLineMesh) {
            this.centerLineMesh.dispose();
        }
        super.dispose();
    }

    setRotation(x, y, z) {
        if (this.doorMesh) {
            this.doorMesh.rotation = new BABYLON.Vector3(x, y, z);
        }
    }
} 