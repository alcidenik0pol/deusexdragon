import { BaseComponent } from './BaseComponent.js';

export class DoorComponent extends BaseComponent {
    static DOOR_WIDTH = 4;
    static DOOR_HEIGHT = 8;
    static DOOR_THICKNESS = 0.1;

    constructor(id) {
        super(id);
        this.isOpen = false;
        this.isLocked = false;
    }

    async initialize(scene, options = {}) {
        super.initialize(scene);

        // Create the main door mesh
        this.mesh = BABYLON.MeshBuilder.CreateBox(`${this.id}`, {
            height: DoorComponent.DOOR_HEIGHT,
            width: DoorComponent.DOOR_WIDTH,
            depth: DoorComponent.DOOR_THICKNESS
        }, scene);

        // Dark gray material
        const doorMaterial = new BABYLON.StandardMaterial(`${this.id}-material`, scene);
        doorMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        doorMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        doorMaterial.backFaceCulling = false;  // Match wall material
        doorMaterial.alpha = 1.0;              // Fully opaque like walls
        doorMaterial.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        doorMaterial.disableLighting = false;
        this.mesh.material = doorMaterial;

        // Create the center line
        this.centerLineMesh = BABYLON.MeshBuilder.CreateBox(`${this.id}-centerline`, {
            height: DoorComponent.DOOR_HEIGHT,
            width: 0.02,
            depth: DoorComponent.DOOR_THICKNESS + 0.01
        }, scene);

        // Darker material for center line
        const lineMaterial = new BABYLON.StandardMaterial(`${this.id}-line-material`, scene);
        lineMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        lineMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
        lineMaterial.backFaceCulling = false;  // Match wall material
        this.centerLineMesh.material = lineMaterial;

        // Setup parent relationship
        this.centerLineMesh.parent = this.mesh;
        this.collisionMesh = this.mesh;

        // OVERRIDE BaseComponent's collision setup
        this.mesh.checkCollisions = true;
        this.mesh.isPickable = true;
        this.mesh.isBlocker = true;
        
        // Set initial state
        this.updateDoorState();
    }

    setCollision(enabled) {
        // OVERRIDE BaseComponent's setCollision
        if (!this.mesh) return;
        
        const meshes = [this.mesh, this.centerLineMesh];
        meshes.forEach(mesh => {
            mesh.checkCollisions = enabled && !this.isOpen;
            mesh.isWalkthrough = !enabled || this.isOpen;
        });
    }

    setOpen(open) {
        this.isOpen = open;
        if (!this.mesh) return;
        
        [this.mesh, this.centerLineMesh].forEach(mesh => {
            if (!mesh) return;
            // Completely disable ALL collision properties when open
            mesh.checkCollisions = !open;
            mesh.isWalkthrough = open;
            mesh.isBlocker = !open;
            mesh.visibility = open ? 0 : 1;  // Changed: visible when closed, invisible when open
            
            // Additional collision-related properties
            mesh.isPickable = !open;  // Can't be picked when open
            mesh.collisionMask = open ? 0 : mesh.collisionMask;  // Zero collision mask when open
            
            // Ensure physics engine treats it as non-collidable
            if (mesh.physicsImpostor) {
                mesh.physicsImpostor.dispose();
                mesh.physicsImpostor = null;
            }
        });
    }

    setLocked(locked) {
        this.isLocked = locked;
        if (locked && this.isOpen) {
            this.isOpen = false;
        }
        this.updateDoorState();
    }

    updateDoorState() {
        if (!this.mesh || !this.centerLineMesh) return;

        const meshes = [this.mesh, this.centerLineMesh];
        meshes.forEach(mesh => {
            // Thorough collision disable when open
            mesh.visibility = this.isOpen ? 0 : 1;
            mesh.isBlocker = !this.isOpen;
            mesh.blockAllLight = !this.isOpen;
            mesh.checkCollisions = !this.isOpen;
            mesh.isWalkthrough = this.isOpen;
            mesh.ignoreCastShadows = this.isOpen;
            mesh.isPickable = !this.isOpen;
            
            // Additional collision properties
            if (this.isOpen) {
                mesh.collisionMask = 0;
                if (mesh.physicsImpostor) {
                    mesh.physicsImpostor.dispose();
                    mesh.physicsImpostor = null;
                }
            }
        });
    }

    getMeshes() {
        return [this.mesh, this.centerLineMesh];
    }

    dispose() {
        if (this.centerLineMesh) {
            this.centerLineMesh.dispose();
        }
        super.dispose();
    }

    setRotation(x, y, z) {
        if (this.mesh) {
            this.mesh.rotation = new BABYLON.Vector3(x, y, z);
        }
    }
} 