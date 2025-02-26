import { LevelGenerator } from '../levelGenerator.js';
import { EffectManager } from '../src/effects/EffectManager.js';

export class Singapore3Level extends LevelGenerator {
    constructor(scene) {
        super(scene);
        // Much larger space
        this.mazeSize = 100;  // Increased from 32 to 100
        this.cellSize = 2;    // Keep small cells for detail
        
        // Initialize effect manager
        this.effectManager = new EffectManager(scene);
    }

    generateDefaultMaze() {
        // Create an empty maze (no walls)
        const maze = Array(this.mazeSize).fill().map(() => Array(this.mazeSize).fill(false));
        
        // Only add boundary walls
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize-1][i] = true;
            maze[i][0] = maze[i][this.mazeSize-1] = true;
        }
        
        return maze;
    }

    createProceduralTextures() {
        // Higher resolution textures for the larger space
        const floorTexture = new BABYLON.DynamicTexture("floorTex", 1024, this.scene);  // Increased resolution
        const floorCtx = floorTexture.getContext();
        
        // Modern city floor texture (grey with subtle grid)
        floorCtx.fillStyle = "#303030";
        floorCtx.fillRect(0, 0, 1024, 1024);
        floorCtx.strokeStyle = "#404040";
        
        // Create a subtle grid pattern
        for (let i = 0; i < 1024; i += 32) {
            floorCtx.beginPath();
            floorCtx.moveTo(i, 0);
            floorCtx.lineTo(i, 1024);
            floorCtx.moveTo(0, i);
            floorCtx.lineTo(1024, i);
            floorCtx.stroke();
        }
        floorTexture.update();

        // Wall texture (glass-like)
        const wallTexture = new BABYLON.DynamicTexture("wallTex", 1024, this.scene);
        const wallCtx = wallTexture.getContext();
        wallCtx.fillStyle = "#87CEEB";  // Sky blue
        wallCtx.fillRect(0, 0, 1024, 1024);
        
        // Add subtle reflective pattern
        for (let i = 0; i < 1024; i += 64) {
            wallCtx.fillStyle = "rgba(255, 255, 255, 0.1)";
            wallCtx.fillRect(0, i, 1024, 32);
        }
        wallTexture.update();

        return { floorTexture, wallTexture };
    }

    async createLevel() {
        // Remove ALL existing lights
        this.scene.lights.forEach(light => light.dispose());
        
        // Create very dim directional light (moonlight-like)
        const moonLight = new BABYLON.DirectionalLight(
            "moonLight",
            new BABYLON.Vector3(-1, -0.3, -0.5),
            this.scene
        );
        moonLight.intensity = 0.1;  // Drastically reduced intensity
        
        // Minimal ambient light (just enough to see silhouettes)
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambientLight.intensity = 0.05;  // Very very dim
        ambientLight.groundColor = new BABYLON.Color3(0.02, 0.02, 0.05); // Barely visible blue reflection
        
        // Optional: Add slight blue tint to simulate night
        this.scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.2);

        const levelElements = await super.createLevel();

        // Create additional skyscrapers (same as SingaporeLevel)
        const buildingMaterial = new BABYLON.StandardMaterial("buildingMat", this.scene);
        buildingMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        buildingMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.4);
        buildingMaterial.emissiveColor = new BABYLON.Color3(0.05, 0.05, 0.1);

        // Create 10 buildings with varied heights and positions
        const buildings = [
            { x: -36, z: 31, height: 31 },
            { x: -27, z: 31, height: 30 },
            { x: -36, z: 37, height: 46 },
            { x: -27, z: 37, height: 38 },
            { x: -3, z: 31, height: 45 },
            { x: 4, z: 31, height: 32 },
            { x: -3, z: 37, height: 39 },
            { x: 4, z: 37, height: 35 },
            { x: 27, z: 31, height: 45 },
            { x: 36, z: 31, height: 49 },
            { x: 27, z: 37, height: 31 },
            { x: 36, z: 37, height: 37 },
            { x: -36, z: -37, height: 44 },
            { x: -27, z: -37, height: 36 },
            { x: -36, z: -31, height: 37 },
            { x: -27, z: -31, height: 32 },
            { x: -3, z: -37, height: 38 },
            { x: 4, z: -37, height: 35 },
            { x: -3, z: -31, height: 41 },
            { x: 4, z: -31, height: 34 },
            { x: 27, z: -37, height: 34 },
            { x: 36, z: -37, height: 48 },
            { x: 27, z: -31, height: 45 },
            { x: 36, z: -31, height: 35 },
            { x: -36, z: -6, height: 43 },
            { x: -27, z: -6, height: 70 },
            { x: -36, z: 6, height: 32 },
            { x: -27, z: 6, height: 87 },
            { x: -3, z: -6, height: 83 },
            { x: 4, z: -6, height: 106 },
            { x: -3, z: 6, height: 93 },
            { x: 4, z: 6, height: 114 },
            { x: 27, z: -6, height: 68 },
            { x: 36, z: -6, height: 47 },
            { x: 27, z: 6, height: 69 },
            { x: 36, z: 6, height: 45 },
            { x: -36, z: -6, height: 30 },
            { x: -27, z: -6, height: 69 },
            { x: -36, z: 6, height: 44 },
            { x: -27, z: 6, height: 81 },
            { x: -3, z: -6, height: 88 },
            { x: 4, z: -6, height: 76 },
            { x: -3, z: 6, height: 60 },
            { x: 4, z: 6, height: 86 },
            { x: 27, z: -6, height: 76 },
            { x: 36, z: -6, height: 31 },
            { x: 27, z: 6, height: 86 },
            { x: 36, z: 6, height: 33 },
            { x: 0, z: 0, height: 120 },
            { x: -30, z: 30, height: 25 },
            { x: 30, z: -30, height: 95 }
        ];

        buildings.forEach(({ x, z, height }) => {
            const building = BABYLON.MeshBuilder.CreateBox("skyscraper", {
                height: height,
                width: 10 + Math.random() * 5,  // Varied widths
                depth: 10 + Math.random() * 5    // Varied depths
            }, this.scene);
            
            building.position = new BABYLON.Vector3(x, height/2, z);
            building.material = buildingMaterial;
        });

        // Add Singapore-specific effects
        this.effectManager.addEffect('fog', {
            baseColors: ['#FFA000', '#1E3F57', '#2A5C1E'],
            minOpacity: 0.15,
            maxOpacity: 0.4
        });

        this.effectManager.addEffect('volumetricLight', {
            beamTypes: {
                corporate: { color: '#FFA000', intensity: 0.6, width: 0.5 }
            }
        });

        // Initialize rain effect but don't start it
        this.effectManager.addEffect('rain', {
            intensity: 0.7,
            speed: 15,
            dropSize: 0.15,
            lightInteraction: true,
            autoStart: false  // Ensure it is off by default
        });

        // Add update loop
        this.scene.onBeforeRenderObservable.add(() => {
            this.effectManager.update();
        });

        return levelElements;
    }

    dispose() {
        this.effectManager.removeEffect('fog');
        this.effectManager.removeEffect('volumetricLight');
        this.effectManager.removeEffect('rain');
        super.dispose();
    }
} 