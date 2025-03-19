export class RainEffect2 {
    constructor(scene, camera, config) {
        this.scene = scene;
        this.camera = camera;
        this.config = {
            // Visual settings
            intensity: 1.0,          // Rain intensity (1.0 = heavy shower)
            dropSize: 0.4,           // Size of each raindrop
            speed: 40,               // Fast falling speed for tropical shower
            angle: 0.2,              // Slight angle for wind effect (in radians)
            color: new BABYLON.Color3(0.15, 0.15, 0.2), // Very dark blue-gray
            alpha: 0.6,              // More visible in the dark
            
            // Performance settings
            dropCount: 3000,         // Total drops in the system
            playerRadius: 100,       // Only show rain within this radius of player
            updateBatchSize: 1000,   // How many drops to update per frame
            
            ...config
        };
        
        this.isActive = false;
        this.rainDrops = [];
        this._lastUpdateTime = 0;
        this._updateIndex = 0;
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.rainDrops = [];
        
        // Create a single material for all raindrops
        const rainMaterial = new BABYLON.StandardMaterial("rainMaterial", this.scene);
        rainMaterial.emissiveColor = this.config.color.clone();
        rainMaterial.alpha = this.config.alpha;
        rainMaterial.disableLighting = true;
        
        // Calculate drop direction based on angle
        const angleX = this.config.angle;
        const dropDirection = new BABYLON.Vector3(
            Math.sin(angleX),
            -1,  // Always down
            0    // No Z angle for simplicity
        ).normalize();
        
        // Store direction for updates
        this.dropDirection = dropDirection;
        
        // Create a single drop template
        const dropLength = this.config.dropSize * (1 + this.config.intensity);
        const points = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(
                dropDirection.x * dropLength,
                dropDirection.y * dropLength,
                dropDirection.z * dropLength
            )
        ];
        
        // Create all drops at once
        for (let i = 0; i < this.config.dropCount; i++) {
            const drop = BABYLON.MeshBuilder.CreateLines("raindrop_" + i, {
                points: points,
                updatable: false
            }, this.scene);
            
            drop.material = rainMaterial;
            
            // Randomize initial position around camera
            this.resetDropAroundCamera(drop, true);
            
            this.rainDrops.push(drop);
        }
        
        console.log(`RainEffect2 started with ${this.rainDrops.length} drops`);
        
        this._lastUpdateTime = Date.now();
    }
    
    resetDropAroundCamera(drop, initialSpawn = false) {
        if (!this.camera) return;
        
        // Get camera position
        const camPos = this.camera.position;
        
        // Random angle around camera
        const angle = Math.random() * Math.PI * 2;
        
        // Random distance from camera (weighted toward outer radius)
        const distance = Math.sqrt(Math.random()) * this.config.playerRadius;
        
        // Calculate position in a circle around camera
        const x = camPos.x + Math.cos(angle) * distance;
        const z = camPos.z + Math.sin(angle) * distance;
        
        // If initial spawn, distribute throughout height range
        // If regular reset, always spawn above camera
        const heightRange = 50; // Height range above camera
        const y = initialSpawn 
            ? camPos.y + Math.random() * heightRange
            : camPos.y + heightRange;
            
        drop.position = new BABYLON.Vector3(x, y, z);
        
        // Add slight random variations to speed
        drop.speed = this.config.speed * (0.8 + Math.random() * 0.4);
        
        // Ensure the drop is visible
        drop.visibility = 1;
    }
    
    update() {
        if (!this.isActive || !this.camera || this.rainDrops.length === 0) return;
        
        // Calculate time-based delta for consistent animation
        const currentTime = Date.now();
        const deltaTime = (currentTime - this._lastUpdateTime) / 1000;
        this._lastUpdateTime = currentTime;
        
        // Ensure we have a reasonable delta time
        const safeDeltaTime = Math.min(deltaTime, 0.05);
        
        // Get camera position for distance checks
        const camPos = this.camera.position;
        
        // Update drops in batches for better performance
        const batchSize = this.config.updateBatchSize;
        const startIdx = this._updateIndex;
        const endIdx = Math.min(startIdx + batchSize, this.rainDrops.length);
        
        for (let i = startIdx; i < endIdx; i++) {
            const drop = this.rainDrops[i];
            if (!drop || !drop.position) continue;
            
            // Move the drop based on direction and speed
            drop.position.x += this.dropDirection.x * drop.speed * safeDeltaTime;
            drop.position.y += this.dropDirection.y * drop.speed * safeDeltaTime;
            drop.position.z += this.dropDirection.z * drop.speed * safeDeltaTime;
            
            // Check if drop is too far from camera or below ground
            const distToCam = BABYLON.Vector3.Distance(drop.position, camPos);
            if (distToCam > this.config.playerRadius || drop.position.y < 0) {
                this.resetDropAroundCamera(drop);
            }
        }
        
        // Update index for next frame
        this._updateIndex = (endIdx >= this.rainDrops.length) ? 0 : endIdx;
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
        console.log("RainEffect2 disposed");
    }
} 