export class BaseComponent {
    constructor(id) {
        this.id = id;
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.rotation = new BABYLON.Quaternion();
        this.scale = new BABYLON.Vector3(1, 1, 1);
        this.isVisible = true;
        this.collisionMesh = null;
        this.parentNode = null;
        this.attachPoints = [];
        this.floorOffset = 0; // New property to track floor offset
    }

    initialize(scene, options = {}) {
        this.scene = scene;
        Object.assign(this, options);
    }

    attach(targetComponent, myAttachPoint, targetAttachPoint) {
        if (!this.attachPoints.includes(myAttachPoint) || 
            !targetComponent.attachPoints.includes(targetAttachPoint)) {
            throw new Error('Invalid attach points');
        }
        // Implementation for attaching components
    }

    detach() {
        // Implementation for detaching components
    }

    setVisible(visible) {
        this.isVisible = visible;
        if (this.mesh) {
            this.mesh.setEnabled(visible);
        }
    }

    setCollision(enabled) {
        if (this.collisionMesh) {
            this.collisionMesh.checkCollisions = enabled;
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
        }
        if (this.collisionMesh && this.collisionMesh !== this.mesh) {
            this.collisionMesh.dispose();
        }
    }

    // New method to handle asset loading
    async loadAsset(assetType, assetId) {
        const jsonPath = `/assets/${assetType}/${assetId}.json`;
        const assetData = await fetch(jsonPath).then(r => r.json());
        this.dimensions = assetData.standardDimensions;

        // Add improved debug logging with clear asset identification
        console.log(`----- LOADING ASSET: ${assetId} (${assetType}) -----`);
        console.log(`${assetId} standard dimensions:`, this.dimensions);
        console.log(`${assetId} raw dimensions:`, assetData.rawDimensions);
        console.log(`${assetId} scale factor:`, assetData.scaleFactor);

        // Load the mesh
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "",
            `assets/${assetType}/`,
            `${assetId}.glb`,
            this.scene
        );

        this.mesh = result.meshes[0];
        
        // Apply the scaleFactor from JSON
        const scale = assetData.scaleFactor;
        this.mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        
        // Calculate floor offset based on raw model dimensions
        const rawHeight = assetData.rawDimensions.height;
        this.floorOffset = (rawHeight * scale) / 2;
        
        // Position the mesh with the bottom at y=0
        this.position.y = this.floorOffset;
        this.mesh.position = this.position;
        this.mesh.rotationQuaternion = this.rotation;

        console.log(`${assetId} mesh loaded. Floor offset: ${this.floorOffset}`);
        console.log(`${assetId} mesh position:`, this.mesh.position);
        console.log(`----- END LOADING ${assetId} -----`);

        return assetData;
    }

    // New helper method to get the world position at floor level
    getFloorPosition() {
        return new BABYLON.Vector3(
            this.position.x,
            0, // Always at y=0
            this.position.z
        );
    }

    // New helper to set position while maintaining floor contact
    setWorldPosition(x, z) {
        this.position = new BABYLON.Vector3(x, this.floorOffset, z);
        if (this.mesh) {
            this.mesh.position = this.position;
        }
        if (this.collisionMesh) {
            this.collisionMesh.position = this.position;
        }
    }
} 