export class RainEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            intensity: 0.7,
            dropSize: 0.15,
            speed: 15,           // Base speed
            minY: 0,             // Ground level
            maxY: 70,            // Maximum height
            spawnWidth: 200,     // Width of spawn area
            spawnDepth: 200,     // Depth of spawn area
            lightInteraction: false,
            color: new BABYLON.Color3(0.3, 0.3, 0.4), // Darker blue-gray color
            alpha: 0.4,          // More transparent
            // Reduce drop count for better performance
            dropCount: 2000,     // Reduced from 5000 for performance
            ...config
        };
        this.isActive = false;   // Track if the rain effect is active
        this.rainDrops = [];     // Initialize empty array
        this._lastUpdateTime = 0; // For consistent animation
    }

    start() {
        this.isActive = true;    // Set active state
        this.rainDrops = [];
        
        // Use the configurable drop count
        const rainCount = this.config.dropCount;
        
        // Create a single material for all raindrops to improve performance
        const rainMaterial = new BABYLON.StandardMaterial("rainMaterial", this.scene);
        rainMaterial.emissiveColor = this.config.color.clone();
        rainMaterial.alpha = this.config.alpha;
        rainMaterial.disableLighting = true;
        
        // Create a single line mesh template
        const points = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, -this.config.dropSize, 0)
        ];

        // Create drops in batches for better performance
        const BATCH_SIZE = 100;
        for (let b = 0; b < rainCount / BATCH_SIZE; b++) {
            // Create a merged mesh for each batch
            const lines = [];
            
            for (let i = 0; i < BATCH_SIZE; i++) {
                const line = BABYLON.MeshBuilder.CreateLines("raindrop_" + (b * BATCH_SIZE + i), {
                    points: points,
                    updatable: true
                }, this.scene);
                
                // Randomize initial position
                this.resetDrop(line, true);
                
                // Add to batch
                lines.push(line);
                this.rainDrops.push(line);
            }
        }
        
        console.log(`Rain effect started with ${this.rainDrops.length} drops`);
        
        // Force an immediate update to ensure drops are positioned
        this._lastUpdateTime = Date.now();
        this.update();
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
        
        // Ensure the drop is visible
        drop.visibility = 1;
    }

    update() {
        if (!this.isActive || this.rainDrops.length === 0) return;
        
        // Calculate time-based delta for consistent animation
        const currentTime = Date.now();
        const deltaTime = (currentTime - this._lastUpdateTime) / 1000;
        this._lastUpdateTime = currentTime;
        
        // Ensure we have a reasonable delta time
        const safeDeltaTime = Math.min(deltaTime, 0.05);
        
        // Only update a subset of drops each frame for better performance
        const updateCount = Math.min(500, this.rainDrops.length);
        const startIdx = Math.floor(Math.random() * (this.rainDrops.length - updateCount));
        
        for (let i = startIdx; i < startIdx + updateCount; i++) {
            const drop = this.rainDrops[i];
            if (!drop || !drop.position) continue;
            
            // Move the drop downward
            drop.position.y -= drop.speed * safeDeltaTime;
            
            // Reset drop when it hits the ground
            if (drop.position.y < this.config.minY) {
                this.resetDrop(drop);
            }
        }
        
        // Only do light interaction occasionally for performance
        if (this.config.lightInteraction && Math.random() < 0.1) {
            this.updateLightInteraction();
        }
    }
    
    updateLightInteraction() {
        if (!this.scene.lights || this.scene.lights.length === 0) return;
        
        // Only check a subset of drops for light interaction
        const checkCount = Math.min(200, this.rainDrops.length);
        const startIdx = Math.floor(Math.random() * (this.rainDrops.length - checkCount));
        
        for (let i = startIdx; i < startIdx + checkCount; i++) {
            const drop = this.rainDrops[i];
            if (!drop || !drop.position) continue;
            
            let isNearLight = false;
            
            for (let j = 0; j < this.scene.lights.length; j++) {
                const light = this.scene.lights[j];
                if (light && light.position) {
                    const distToLight = BABYLON.Vector3.Distance(drop.position, light.position);
                    if (distToLight < 20) {
                        const intensity = 1 - (distToLight / 20);
                        // Brighten the drop based on proximity to light
                        drop.color = BABYLON.Color3.Lerp(
                            this.config.color, 
                            new BABYLON.Color3(0.8, 0.8, 0.9), 
                            intensity
                        );
                        isNearLight = true;
                        break;
                    }
                }
            }
            
            // Reset color if not near any light
            if (!isNearLight && drop.color) {
                drop.color.copyFrom(this.config.color);
            }
        }
    }

    dispose() {
        this.isActive = false;
        if (this.rainDrops) {
            for (let i = 0; i < this.rainDrops.length; i++) {
                if (this.rainDrops[i]) {
                    this.rainDrops[i].dispose();
                }
            }
            this.rainDrops = [];
        }
        console.log("Rain effect disposed");
    }
} 