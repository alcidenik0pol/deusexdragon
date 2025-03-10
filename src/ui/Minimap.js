export class Minimap {
    constructor(scene) {
        console.log("Creating new Minimap instance");
        this.scene = scene;
        this.isVisible = false;
        this.scale = 0.1; // Scale factor for converting world coordinates to minimap
        this.createMinimap();
        console.log("Minimap initialized with scene:", scene);
    }

    createMinimap() {
        try {
            // Create fullscreen UI
            const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("minimapUI");
            console.log("Created fullscreen UI");
            
            // Create container for minimap
            this.container = new BABYLON.GUI.Rectangle("minimapContainer");
            this.container.width = "200px";
            this.container.height = "200px";
            this.container.thickness = 2;
            this.container.background = "black";
            this.container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            this.container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
            this.container.top = "10px";
            this.container.right = "10px";
            this.container.isVisible = false;
            this.container.zIndex = 999; // Ensure it's on top
            ui.addControl(this.container);
            console.log("Added container to UI");

            // Create dynamic texture for the minimap
            this.dynamicTexture = new BABYLON.DynamicTexture("minimapDynamicTexture", 256, this.scene, false);
            const ctx = this.dynamicTexture.getContext();
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, 256, 256);
            this.dynamicTexture.update();
            console.log("Created dynamic texture");

            // Create rectangle for the minimap content
            this.minimapContent = new BABYLON.GUI.Rectangle("minimapContent");
            this.minimapContent.width = "180px";
            this.minimapContent.height = "180px";
            this.minimapContent.thickness = 0;
            this.minimapContent.background = this.dynamicTexture;
            this.container.addControl(this.minimapContent);
            console.log("Added content rectangle to container");
            
            // Store UI instance
            this.ui = ui;
            
            // Register the render loop
            this.scene.registerBeforeRender(() => {
                if (this.isVisible) {
                    this.updateMinimap();
                }
            });
            console.log("Registered render loop");
        } catch (error) {
            console.error("Error creating minimap:", error);
        }
    }

    updateMinimap() {
        const ctx = this.dynamicTexture.getContext();
        ctx.fillStyle = "#1a1a1a"; // Slightly lighter than black for better visibility
        ctx.fillRect(0, 0, 256, 256);

        // Draw a border
        ctx.strokeStyle = "#333333";
        ctx.strokeRect(0, 0, 256, 256);

        // Get player position
        const camera = this.scene.getCameraByName("UniversalCamera");
        if (!camera) {
            console.log("No camera found");
            return;
        }

        const playerX = camera.position.x;
        const playerZ = camera.position.z;

        // Function to convert world coordinates to minimap coordinates
        const worldToMinimap = (x, z) => {
            return {
                x: 128 + (x - playerX) * this.scale,
                z: 128 + (z - playerZ) * this.scale
            };
        };

        // Draw grid lines for reference
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 0.5;
        for (let i = -1000; i <= 1000; i += 100) {
            const start = worldToMinimap(i, -1000);
            const end = worldToMinimap(i, 1000);
            ctx.beginPath();
            ctx.moveTo(start.x, start.z);
            ctx.lineTo(end.x, end.z);
            ctx.stroke();

            const startH = worldToMinimap(-1000, i);
            const endH = worldToMinimap(1000, i);
            ctx.beginPath();
            ctx.moveTo(startH.x, startH.z);
            ctx.lineTo(endH.x, endH.z);
            ctx.stroke();
        }

        // Draw all meshes in the scene
        this.scene.meshes.forEach(mesh => {
            const pos = worldToMinimap(mesh.position.x, mesh.position.z);
            
            // Only draw if within minimap bounds
            if (pos.x >= 0 && pos.x <= 256 && pos.z >= 0 && pos.z <= 256) {
                if (mesh.name === "PlayerCharacter") {
                    // Draw player as white dot with direction indicator
                    ctx.fillStyle = "white";
                    ctx.beginPath();
                    ctx.arc(128, 128, 4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw direction indicator
                    const rotation = camera.rotation.y;
                    ctx.beginPath();
                    ctx.moveTo(128, 128);
                    ctx.lineTo(
                        128 + Math.sin(rotation) * 8,
                        128 + Math.cos(rotation) * 8
                    );
                    ctx.strokeStyle = "white";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (mesh.name.includes("skyscraper")) {
                    // Draw buildings as larger blue rectangles
                    ctx.fillStyle = "#4444ff";
                    ctx.fillRect(pos.x - 4, pos.z - 4, 8, 8);
                } else if (mesh.name.includes("wall")) {
                    // Draw walls as brighter gray rectangles
                    ctx.fillStyle = "#888888";
                    ctx.fillRect(pos.x - 2, pos.z - 2, 4, 4);
                }
            }
        });

        this.dynamicTexture.update();
    }

    toggle() {
        console.log("Toggle called, current visibility:", this.isVisible);
        this.isVisible = !this.isVisible;
        this.container.isVisible = this.isVisible;
        if (this.isVisible) {
            this.updateMinimap(); // Force an immediate update
        }
        console.log("New visibility state:", this.isVisible);
    }

    dispose() {
        if (this.dynamicTexture) {
            this.dynamicTexture.dispose();
        }
        if (this.container) {
            this.container.dispose();
        }
        if (this.ui) {
            this.ui.dispose();
        }
    }
} 