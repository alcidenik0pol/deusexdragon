import { BaseComponent } from '../../components/BaseComponent.js';

export class UOBBuilding extends BaseComponent {
    constructor() {
        super('sg_uob');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Use the new loadAsset method
        await this.loadAsset('buildings', 'sg_uob');

        // Create collision box using standardDimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("uob_collision", {
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

export class MBSBuilding extends BaseComponent {
    constructor() {
        super('sg_mbs_high');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Load the MBS high-rise model
        await this.loadAsset('buildings', 'sg_mbs_low02');
        // await this.loadAsset('buildings', 'sg_mbs_high');

        // Create collision box
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("mbs_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale using dimensions from the JSON
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = false;  // Disable collisions
        this.collisionMesh.isWalkthrough = true;    // Add special flag for MBS
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }
}

export class CapitasBuilding extends BaseComponent {
    constructor() {
        super('sg_capitas_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_capitas_high01');
        this.createCollisionBox(scene);
    }
}

export class FultonBuilding extends BaseComponent {
    constructor() {
        super('sg_ful_high02');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_ful_high02');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class ParkviewBuilding extends BaseComponent {
    constructor() {
        super('sg_parkview_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_parkview_high01');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class OUCBuilding extends BaseComponent {
    constructor() {
        super('sg_ouc_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_ouc_high01');
        this.createCollisionBox(scene);
    }
}

export class RepublicBuilding extends BaseComponent {
    constructor() {
        super('sg_rep_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_rep_high01');
        this.createCollisionBox(scene);
    }
}

export class ShopsBuilding extends BaseComponent {
    constructor() {
        super('sg_shops_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_shops_high01');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class UOBHighBuilding extends BaseComponent {
    constructor() {
        super('sg_uob_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_uob_high01');
        this.createCollisionBox(scene);
    }
}

// Add this helper method to all classes through the prototype
[CapitasBuilding, FultonBuilding, ParkviewBuilding, OUCBuilding, 
 RepublicBuilding, ShopsBuilding, UOBHighBuilding, MBSBuilding].forEach(cls => {
    cls.prototype.createCollisionBox = function(scene) {
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox(`${this.id}_collision`, {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.position;
        this.collisionMesh.rotationQuaternion = this.rotation;
    }
}); 