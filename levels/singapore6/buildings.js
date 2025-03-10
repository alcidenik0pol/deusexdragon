import { BaseComponent } from '../../components/BaseComponent.js';

export class UOBBuilding extends BaseComponent {
    constructor() {
        super('sg_uob');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Load dimensions from JSON
        const buildingData = await fetch('/assets/buildings/sg_uob.json').then(r => r.json());
        this.dimensions = buildingData.standardDimensions;

        // Load the mesh
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            "assets/buildings/",
            "sg_uob.glb", 
            scene
        );

        this.mesh = result.meshes[0];
        
        // Apply the scaleFactor from JSON (not the standardDimensions!)
        this.mesh.scaling = new BABYLON.Vector3(
            buildingData.scaleFactor,
            buildingData.scaleFactor,
            buildingData.scaleFactor
        );
        
        this.mesh.position = this.position;
        this.mesh.rotationQuaternion = this.rotation;

        // Create collision box using standardDimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("uob_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale the collision box instead of setting its dimensions
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }
} 