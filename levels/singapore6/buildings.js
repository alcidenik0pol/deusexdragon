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

export class MerlionBuilding extends BaseComponent {
    constructor() {
        super('merlion01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'merlion01');
        
        // Read the facing direction from the metadata
        const facing = this.metadata?.facing || 'unknown';
        
        // Calculate rotation based on facing direction
        // If facing is "north" and we want it to face "east", we need to rotate 90 degrees clockwise
        let rotationAngle = 0;
        
        if (facing === 'north') {
            // Rotate 90 degrees to face east (from north)
            rotationAngle = Math.PI / 2;
        } else if (facing === 'east') {
            // Already facing east, no rotation needed
            rotationAngle = 0;
        } else if (facing === 'south') {
            // Rotate 270 degrees to face east (from south)
            rotationAngle = 3 * Math.PI / 2;
        } else if (facing === 'west') {
            // Rotate 180 degrees to face east (from west)
            rotationAngle = Math.PI;
        }
        
        // Apply rotation
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, rotationAngle);
        this.mesh.rotationQuaternion = rotation;
        
        // Create collision box with the same rotation
        this.createCollisionBox(scene);
        if (this.collisionMesh) {
            this.collisionMesh.rotationQuaternion = rotation;
        }
        
        console.log(`Merlion facing: ${facing}, applied rotation: ${rotationAngle} radians`);
    }
}

export class ContainerShip extends BaseComponent {
    constructor() {
        super('containership');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'containership');
        
        // Create collision box without applying any automatic rotation
        this.createCollisionBox(scene);
        
        // Log the facing direction from metadata but don't apply rotation
        const facing = this.metadata?.facing || 'unknown';
        console.log(`ContainerShip facing direction from JSON: ${facing}`);
        console.log(`ContainerShip loaded without automatic rotation`);
    }
}

// Add this helper method to all classes through the prototype
[CapitasBuilding, FultonBuilding, ParkviewBuilding, OUCBuilding, 
 RepublicBuilding, ShopsBuilding, UOBHighBuilding, MBSBuilding, MerlionBuilding, ContainerShip].forEach(cls => {
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