import { LevelGenerator } from '../levelGenerator.js';
import { EffectManager } from '../src/effects/EffectManager.js';

export class Singapore2Level extends LevelGenerator {
    constructor(scene) {
        super(scene);
        // Much larger space
        this.mazeSize = 100;  // Increased from 32 to 100
        this.cellSize = 2;    // Keep small cells for detail
        
        // Initialize effect manager
        this.effectManager = new EffectManager(scene);
        this.flyingCars = [];  // Array to store flying cars
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
            { x: -50, z: -80, height: 60 },
            { x: -30, z: -70, height: 45 },
            { x: 30, z: -75, height: 55 },
            { x: 50, z: -85, height: 70 },
            { x: -40, z: -100, height: 50 },
            { x: 40, z: -95, height: 65 },
            { x: -20, z: -90, height: 40 },
            { x: 20, z: -110, height: 75 },
            { x: -60, z: -95, height: 45 },
            { x: 60, z: -105, height: 58 }
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

        // Create flying car using simple box mesh
        const carMaterial = new BABYLON.StandardMaterial("carMat", this.scene);
        carMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.9);
        carMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        carMaterial.specularColor = new BABYLON.Color3(0.8, 0.8, 1.0);
        
        const car = BABYLON.MeshBuilder.CreateBox("flyingCar", {
            width: 20,    // 5x bigger (was 4)
            height: 5,  // 5x bigger (was 1.5)
            depth: 10     // 5x bigger (was 2)
        }, this.scene);
        
        car.position = new BABYLON.Vector3(-80, 67.5, -50); // 1.5x higher (was 45)
        car.rotation = new BABYLON.Vector3(0, 0, 0); // Rotated 90 degrees (was Math.PI / 2)
        car.material = carMaterial;
        
        // Car movement properties
        const carInfo = {
            mesh: car,
            speed: 1.0,
            startX: -80,
            endX: 80
        };
        this.flyingCars.push(carInfo);

        // Add car update logic to the render loop
        this.scene.onBeforeRenderObservable.add(() => {
            this.updateFlyingCars();
            this.effectManager.update();
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

        return levelElements;
    }

    updateFlyingCars() {
        for (const car of this.flyingCars) {
            // Move car along X axis
            car.mesh.position.x += car.speed;
            
            // Reset position when reaching the end
            if (car.mesh.position.x > car.endX) {
                car.mesh.position.x = car.startX;
            }
        }
    }

    dispose() {
        // Clean up flying cars
        this.flyingCars.forEach(car => {
            car.mesh.dispose();
        });
        this.flyingCars = [];
        
        this.effectManager.removeEffect('fog');
        this.effectManager.removeEffect('volumetricLight');
        this.effectManager.removeEffect('rain');
        super.dispose();
    }
} 