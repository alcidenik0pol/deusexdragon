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
        this.blinders = []; // Store references to blinder components
        this.animationInProgress = false;
    }

    initialize() {
        console.log("TaiyongTriggerArea initialized");
        // Find all blinder components in the scene
        this.blinders = this.scene.meshes
            .filter(mesh => mesh.name.includes("taiyong-blinder"))
            .reduce((acc, mesh) => {
                const blinderId = mesh.name.split("-slat-")[0];
                if (!acc.includes(blinderId)) {
                    acc.push(blinderId);
                }
                return acc;
            }, []);
        
        // Register the update function to check player position
        this.scene.registerBeforeRender(() => this.checkPlayerPosition());
    }

    setGlassWalls(walls) {
        // Do nothing - glass walls stay transparent
    }

    async animateBlinders(show = false) {
        if (this.animationInProgress) {
            console.log("Animation already in progress, skipping");
            return;
        }
        this.animationInProgress = true;
        console.log(`Starting blinder animation: ${show ? 'showing' : 'hiding'}`);

        // Get all slats from all blinders
        const allSlats = this.scene.meshes
            .filter(mesh => mesh.name.includes("-slat-"));
        
        // Get slats based on the animation direction
        const relevantSlats = show 
            ? allSlats.filter(slat => slat.visibility === 0)  // Get hidden slats when showing
            : allSlats.filter(slat => slat.visibility === 1); // Get visible slats when hiding
        
        // Shuffle the slats array for random animation
        const shuffledSlats = relevantSlats.sort(() => Math.random() - 0.5);

        // Calculate delay between each slat toggle
        const totalDuration = 3000; // 3 seconds
        const delayBetweenSlats = totalDuration / shuffledSlats.length;

        // Animate each slat
        for (const slat of shuffledSlats) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenSlats));
            slat.visibility = show ? 1 : 0;
            slat.isBlocker = show;
        }

        console.log("Animation complete");
        this.animationInProgress = false;
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
            this.animateBlinders(false); // Hide slats
        } else if (!isInArea && this.isPlayerInArea) {
            console.log("Player left trigger area");
            this.isPlayerInArea = false;
            this.animateBlinders(true);  // Show slats
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