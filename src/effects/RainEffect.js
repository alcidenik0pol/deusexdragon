export class RainEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            intensity: 0.7,
            dropSize: 0.15,
            speed: 15,           // Increased speed
            minY: 0,            // Ground level
            maxY: 70,           // Maximum height
            spawnWidth: 200,    // Width of spawn area
            spawnDepth: 200,    // Depth of spawn area
            lightInteraction: false,
            ...config
        };
    }

    start() {
        this.rainDrops = [];
        // Increased rain count and varied initial positions
        const rainCount = 5000;  // More drops for denser rain

        for (let i = 0; i < rainCount; i++) {
            const drop = BABYLON.MeshBuilder.CreateLines("raindrop", {
                points: [
                    new BABYLON.Vector3(0, 0, 0),
                    new BABYLON.Vector3(0, -this.config.dropSize, 0)
                ]
            }, this.scene);

            drop.color = new BABYLON.Color3(0.8, 0.8, 0.9);
            drop.alpha = 0.6;

            // Randomize initial position throughout the entire height range
            this.resetDrop(drop, true);
            this.rainDrops.push(drop);
        }
    }

    resetDrop(drop, initialSpawn = false) {
        const x = (Math.random() - 0.5) * this.config.spawnWidth;
        const z = (Math.random() - 0.5) * this.config.spawnDepth;
        
        // If initial spawn, distribute throughout height range
        // If regular reset, always spawn at max height
        const y = initialSpawn 
            ? this.config.minY + Math.random() * this.config.maxY 
            : this.config.maxY;

        drop.position = new BABYLON.Vector3(x, y, z);

        // Add slight random variations to speed
        drop.speed = this.config.speed * (0.85 + Math.random() * 0.3);
    }

    update() {
        const deltaTime = this.scene.getEngine().getDeltaTime() / 1000;

        this.rainDrops.forEach(drop => {
            // Use drop's individual speed
            drop.position.y -= drop.speed * deltaTime;
            
            // Reset drop when it hits the ground
            if (drop.position.y < this.config.minY) {
                this.resetDrop(drop);
            }

            if (this.config.lightInteraction && this.scene.lights && this.scene.lights.length > 0) {
                this.scene.lights.forEach(light => {
                    if (light && light.position) {
                        const distToLight = BABYLON.Vector3.Distance(drop.position, light.position);
                        if (distToLight < 20) {
                            const intensity = 1 - (distToLight / 20);
                            drop.color = new BABYLON.Color3(1, 1, 1).scale(intensity);
                        }
                    }
                });
            }
        });
    }

    dispose() {
        this.rainDrops.forEach(drop => drop.dispose());
    }
} 