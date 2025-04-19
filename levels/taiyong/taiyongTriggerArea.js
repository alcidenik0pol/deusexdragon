export class TaiyongTriggerArea {
    constructor(scene) {
        this.scene = scene;
        this.isPlayerInArea = false;
        this.bounds = {
            minX: 8,
            maxX: 40,
            minZ: -40,
            maxZ: 40
        };
    }

    initialize() {
        console.log("TaiyongTriggerArea initialized");
        // Register the update function to check player position
        this.scene.registerBeforeRender(() => this.checkPlayerPosition());
    }

    setGlassWalls(walls) {
        // Do nothing - glass walls stay transparent
    }

    checkPlayerPosition() {
        const playerMesh = this.scene.getMeshByName("PlayerCharacter");
        if (!playerMesh) {
            console.log("Player mesh not found");
            return;
        }

        const position = playerMesh.position;
        const isInArea = this.isPointInArea(position);

        if (isInArea && !this.isPlayerInArea) {
            console.log("Player entered trigger area");
            this.isPlayerInArea = true;
        } else if (!isInArea && this.isPlayerInArea) {
            console.log("Player left trigger area");
            this.isPlayerInArea = false;
        }
    }

    isPointInArea(position) {
        const inArea = position.x >= this.bounds.minX &&
               position.x <= this.bounds.maxX &&
               position.z >= this.bounds.minZ &&
               position.z <= this.bounds.maxZ;
        
        return inArea;
    }

    dispose() {
        // Nothing to clean up anymore
    }
} 