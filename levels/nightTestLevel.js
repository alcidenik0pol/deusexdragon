import { LevelGenerator } from '../levelGenerator.js';

export class NightTestLevel extends LevelGenerator {
    constructor(scene) {
        super(scene);
        this.mazeSize = 8;  // Smaller maze like ladies room
        this.cellSize = 4;
        this.light = null;
        this.skybox = null;
    }

    setupLighting() {
        // Create hemispheric light with lower intensity for night effect
        this.light = new BABYLON.HemisphericLight("light", 
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.light.intensity = 0.1; // Start much darker
        this.light.groundColor = new BABYLON.Color3(0, 0, 0); // Start with black ground color

        // Create GUI for light control
        const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        const panel = new BABYLON.GUI.StackPanel();
        panel.width = "220px";
        panel.top = "-25px";
        panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
        adt.addControl(panel);

        const header = new BABYLON.GUI.TextBlock();
        header.text = "Night to Day";
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        const slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1;
        slider.borderColor = "black";
        slider.color = "gray";
        slider.background = "white";
        slider.value = 0.1; // Start at night
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add((value) => {
            if (this.light) {
                // Make the range more dramatic: 0 to 1.2
                this.light.intensity = value * 1.2;
                // Ground color goes from pure black to light gray
                const groundColorValue = value * 0.3; // Max 0.3 for ground reflection
                this.light.groundColor = new BABYLON.Color3(groundColorValue, groundColorValue, groundColorValue);
            }
        });
        panel.addControl(slider);

        // Add ambient light for very subtle base visibility
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, -1, 0),
            this.scene
        );
        ambientLight.intensity = 0.05; // Very low intensity
        ambientLight.groundColor = new BABYLON.Color3(0, 0, 0);
        ambientLight.specular = new BABYLON.Color3(0, 0, 0);

        return this.light;
    }

    createSkybox() {
        this.skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size: 150}, this.scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox", this.scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.skybox.material = skyboxMaterial;
    }

    async createLamps() {
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/", "lamp.babylon", this.scene);
        
        // Create spot light for the lamp
        const lampLight = new BABYLON.SpotLight(
            "lampLight",
            BABYLON.Vector3.Zero(),
            new BABYLON.Vector3(0, -1, 0),
            0.8 * Math.PI,
            0.01,
            this.scene
        );
        lampLight.diffuse = BABYLON.Color3.Yellow();
        lampLight.parent = this.scene.getMeshByName("bulb");

        // Position the first lamp
        const lamp = this.scene.getMeshByName("lamp");
        lamp.position = new BABYLON.Vector3(2, 0, 2);
        lamp.rotation = BABYLON.Vector3.Zero();
        lamp.rotation.y = -Math.PI / 4;

        // Create additional lamps
        const lamp1 = lamp.clone("lamp1");
        lamp1.position.x = -8;
        lamp1.position.z = 1.2;
        lamp1.rotation.y = Math.PI / 2;

        const lamp2 = lamp1.clone("lamp2");
        lamp2.position.x = -2.7;
        lamp2.position.z = 0.8;
        lamp2.rotation.y = -Math.PI / 2;

        const lamp3 = lamp.clone("lamp3");
        lamp3.position.z = -8;
    }

    generateDefaultMaze() {
        const maze = Array.from({ length: this.mazeSize }, () => Array(this.mazeSize).fill(false));
        
        // Add boundary walls
        for (let i = 0; i < this.mazeSize; i++) {
            maze[0][i] = maze[this.mazeSize - 1][i] = true;
            maze[i][0] = maze[i][this.mazeSize - 1] = true;
        }

        // Add some random internal walls for interest
        for (let x = 2; x < this.mazeSize - 2; x++) {
            for (let z = 2; z < this.mazeSize - 2; z++) {
                if (Math.random() < 0.2) { // 20% chance of wall
                    maze[x][z] = true;
                }
            }
        }

        return maze;
    }

    async createLevel() {
        const maze = this.generateDefaultMaze();

        // Setup lighting and skybox
        this.setupLighting();
        this.createSkybox();

        // Create ground with PBR material for better light response
        const ground = BABYLON.MeshBuilder.CreateGround("ground",
            { width: this.mazeSize * this.cellSize, height: this.mazeSize * this.cellSize },
            this.scene
        );
        ground.position.y = -0.1;
        
        // Create PBR material for ground with darker settings
        const groundMat = new BABYLON.PBRMaterial("groundMat", this.scene);
        groundMat.albedoColor = new BABYLON.Color3(0.1, 0.05, 0.02); // Even darker brown
        groundMat.metallic = 0;
        groundMat.roughness = 1; // Maximum roughness
        groundMat.maxSimultaneousLights = 5;
        groundMat.emissiveIntensity = 0;
        groundMat.ambientColor = new BABYLON.Color3(0, 0, 0);
        ground.material = groundMat;

        // Create walls with darker material for night ambiance
        const wallMat = new BABYLON.PBRMaterial("wallMat", this.scene);
        wallMat.albedoColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        wallMat.metallic = 0;
        wallMat.roughness = 0.9;
        wallMat.maxSimultaneousLights = 5;

        const walls = [];
        for (let x = 0; x < this.mazeSize; x++) {
            for (let z = 0; z < this.mazeSize; z++) {
                if (maze[x][z]) {
                    const wall = BABYLON.MeshBuilder.CreateBox("wall",
                        { width: this.cellSize, height: this.cellSize, depth: this.cellSize },
                        this.scene
                    );
                    wall.position = new BABYLON.Vector3(
                        (x - this.mazeSize / 2 + 0.5) * this.cellSize,
                        this.cellSize / 2,
                        (z - this.mazeSize / 2 + 0.5) * this.cellSize
                    );
                    wall.material = wallMat;
                    walls.push(wall);
                }
            }
        }

        // Add lamps
        await this.createLamps();

        return { ground, walls, cellSize: this.cellSize };
    }

    createProceduralTextures() {
        // Floor texture - darker version for better night effect
        const floorTexture = new BABYLON.DynamicTexture("floorTex", 512, this.scene);
        const floorCtx = floorTexture.getContext();
        
        // Darker base color
        floorCtx.fillStyle = "#2A1708"; // Even darker brown
        floorCtx.fillRect(0, 0, 512, 512);
        
        // Subtle grid pattern
        floorCtx.strokeStyle = "#1A0708"; // Very dark brown for grid
        for (let i = 0; i < 512; i += 64) {
            floorCtx.beginPath();
            floorCtx.moveTo(i, 0);
            floorCtx.lineTo(i, 512);
            floorCtx.moveTo(0, i);
            floorCtx.lineTo(512, i);
            floorCtx.stroke();
        }
        floorTexture.update();

        return { floorTexture };
    }
} 