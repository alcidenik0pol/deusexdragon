import { BaseComponent } from '../../components/BaseComponent.js';

export class Streetlight extends BaseComponent {
    constructor() {
        super('streetlight01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'streetlight01');

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

    dispose() {
        super.dispose();
    }
} 