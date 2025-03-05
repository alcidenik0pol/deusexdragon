export class NightclubPanelLightEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            panelTypes: {
                white: { 
                    color: BABYLON.Color3.White(),
                    intensity: 0.7
                },
                red: {
                    color: BABYLON.Color3.Red(),
                    intensity: 0.7
                },
                green: {
                    color: BABYLON.Color3.Green(),
                    intensity: 0.7
                }
            },
            dimensions: {
                width: 2,      // More reasonable width
                height: 3,     // More reasonable height
                depth: 0.01
            },
            ...config
        };
        this.panels = [];
        this.movingPanels = [];
        this.sharedMaterial = null;
    }

    createLightPanel(position, rotation, color, name, isMoving = false) {
        const scale = isMoving ? 0.1 : 1; // 10x smaller for moving panels
        const dimensions = this.config.dimensions;
        
        // Create shared material if not exists
        if (!this.sharedMaterial) {
            this.sharedMaterial = new BABYLON.StandardMaterial("sharedLightMat", this.scene);
            this.sharedMaterial.disableLighting = true;
            this.sharedMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        }

        const box = BABYLON.MeshBuilder.CreateBox("box" + name, {
            width: dimensions.width * scale,
            height: dimensions.height * scale,
            depth: dimensions.depth
        }, this.scene);
        box.material = this.sharedMaterial;

        // Ensure position is within bounds
        const maxHeight = 6; // Match room height
        position.y = Math.min(position.y, maxHeight - (dimensions.height * scale) / 2);
        box.position = position;
        box.rotation = rotation;

        // Only create lights for fixed panels
        let light = null;
        if (!isMoving) {
            light = new BABYLON.RectAreaLight(
                "light" + name,
                new BABYLON.Vector3(0, 0, 0),
                dimensions.width,
                dimensions.height,
                this.scene
            );
            light.parent = box;
            light.specular = color;
            light.diffuse = color;
            light.intensity = 0.7;
        }

        return {
            box,
            light,
            isMoving,
            initialPosition: position.clone() // Store initial position for movement bounds
        };
    }

    start() {
        const positions = this.config.positions || [];
        const movingPositions = this.config.movingPositions || [];
        const panelTypes = this.config.panelTypes;

        // Create fixed panels
        positions.forEach((position, index) => {
            const panelType = this.config.panelTypes[position.type] || panelTypes.white;
            const panel = this.createLightPanel(
                position.position,
                position.rotation,
                panelType.color,
                `panel${index}`,
                false
            );
            this.panels.push(panel);
        });

        // Create moving panels (without lights)
        movingPositions.forEach((position, index) => {
            const panelType = this.config.panelTypes[position.type] || panelTypes.white;
            const panel = this.createLightPanel(
                position.position,
                position.rotation,
                panelType.color,
                `movingPanel${index}`,
                true
            );
            this.movingPanels.push(panel);
        });
    }

    update() {
        const time = performance.now() * 0.001;
        const maxHeight = 6; // Match room height
        
        // Only update moving panels
        this.movingPanels.forEach((panel, index) => {
            const speed = 1.5;
            const amplitude = 0.5;
            
            // Get base position
            const basePos = panel.initialPosition.clone();
            
            // Calculate new position
            const offsetX = Math.sin(time * speed + index) * amplitude * 0.01;
            const offsetZ = Math.cos(time * speed + index) * amplitude * 0.01;
            const offsetY = Math.sin(time + index) * 0.01;
            
            // Apply position with bounds checking
            panel.box.position.x = basePos.x + offsetX;
            panel.box.position.z = basePos.z + offsetZ;
            panel.box.position.y = Math.min(basePos.y + offsetY, maxHeight - this.config.dimensions.height * 0.1);
            
            // Faster rotation for smaller panels
            panel.box.rotation.y += 0.005;
        });
    }

    dispose() {
        if (this.sharedMaterial) {
            this.sharedMaterial.dispose();
        }
        
        // Dispose panels and lights
        [...this.panels, ...this.movingPanels].forEach(panel => {
            panel.box.dispose();
            if (panel.light) {
                panel.light.dispose();
            }
        });
    }
} 