import { BaseComponent } from '../../components/BaseComponent.js';

export class Streetlight extends BaseComponent {
    constructor() {
        super('streetlight01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Load dimensions from JSON
        const furnitureData = await fetch('/assets/furniture/streetlight01.json').then(r => r.json());
        this.dimensions = furnitureData.standardDimensions;

        // Load the mesh
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            "assets/furniture/",
            "streetlight01.glb",
            scene
        );

        this.mesh = result.meshes[0];
        
        // Apply the scaleFactor from JSON
        this.mesh.scaling = new BABYLON.Vector3(
            furnitureData.scaleFactor,
            furnitureData.scaleFactor,
            furnitureData.scaleFactor
        );
        
        this.mesh.position = this.position;
        this.mesh.rotationQuaternion = this.rotation;

        // Create collision box using standardDimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("streetlight_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale the collision box
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