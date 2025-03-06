import { LevelGenerator } from '../levelGenerator.js';
import { WallComponent } from '../components/WallComponent.js';
import { FloorComponent } from '../components/FloorComponent.js';
import { CeilingComponent } from '../components/NEWCeilingComponent.js';
import { EffectManager } from '../src/effects/EffectManager.js';
import { NightclubLightEffect } from '../src/effects/NightclubLightEffect.js';
import { NightclubPanelLightEffect } from '../src/effects/NightclubPanelLightEffect.js';
import { Purple02F, loadPurple02F } from '../characters/purple02f.js';
import { NPCBase } from '../characters/NPCBase.js';
import baseNPCData from '../npcs/data/purple02f.js';  // Import the base NPC data

export class NightClub extends LevelGenerator {
    // Define level boundaries/constraints
    static LEVEL_BOUNDS = {
        floor: {
            y: 0,
            width: 60,
            length: 60
        },
        ceiling: {
            y: 6,
            width: 60,
            length: 60
        },
        walls: {
            height: 6,
            positions: {
                north: new BABYLON.Vector3(0, 3, 30),
                south: new BABYLON.Vector3(0, 3, -30),
                east: new BABYLON.Vector3(30, 3, 0),
                west: new BABYLON.Vector3(-30, 3, 0)
            }
        },
        room: {
            width: 60,
            length: 60,
            height: 6
        }
    };

    constructor(scene) {
        super(scene);
        this.components = [];
        this.light = null;
        this.effectManager = new EffectManager(scene);
        this.characters = [];  // Array to store all NPCs
    }

    setupLighting() {
        // Create hemispheric light with lower intensity for night effect
        this.light = new BABYLON.HemisphericLight("light", 
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        this.light.intensity = 0.05; // Start much darker
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
                this.light.intensity = value * 1.2;
                const groundColorValue = value * 0.3;
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
        ambientLight.intensity = 0.05;
        ambientLight.groundColor = new BABYLON.Color3(0, 0, 0);
        ambientLight.specular = new BABYLON.Color3(0, 0, 0);

        return this.light;
    }

    // Add method to handle dance animation cycling
    setupDanceAnimations() {
        const danceAnimations = ['dancing01', 'dancing02'];
        
        // Setup animation cycling for each character
        this.characters.forEach(character => {
            let currentAnimationIndex = 0;  // Track current animation

            const cycleAnimation = async () => {
                // Cycle to next animation
                currentAnimationIndex = (currentAnimationIndex + 1) % danceAnimations.length;
                const nextAnimation = danceAnimations[currentAnimationIndex];
                
                try {
                    await character.setAnimation(nextAnimation);
                    console.log(`NPC ${character.name} changed dance animation to ${nextAnimation}`);
                } catch (error) {
                    console.error(`Failed to set animation ${nextAnimation}:`, error);
                }

                // Set random timeout for next animation (between 3 and 30 seconds)
                const nextTimeout = Math.random() * (30000 - 3000) + 3000;
                setTimeout(cycleAnimation, nextTimeout);
            };

            // Start the animation cycle
            cycleAnimation();
        });
    }

    // Function to get random position within bounds
    getRandomPosition() {
        // Use 80% of room size to keep NPCs away from walls
        const margin = 0.2;
        const xRange = NightClub.LEVEL_BOUNDS.room.width * (1 - margin * 2);
        const zRange = NightClub.LEVEL_BOUNDS.room.length * (1 - margin * 2);
        
        return {
            x: (Math.random() * xRange - xRange / 2),
            y: NPCBase.DEFAULT_Y_POSITION,
            z: (Math.random() * zRange - zRange / 2)
        };
    }

    // Function to get random rotation
    getRandomRotation() {
        return Math.random() * Math.PI * 2; // 0 to 2π
    }

    startNPCMovement() {
        this.characters.forEach(npc => {
            const direction = new BABYLON.Vector3(0.1, 0, 0); // Move along the x-axis

            this.scene.onBeforeRenderObservable.add(() => {
                npc.mesh.position.addInPlace(direction);
            });
        });
    }

    async createLevel() {
        const bounds = NightClub.LEVEL_BOUNDS;

        // Setup lighting first
        this.setupLighting();

        // Create spotlight positions at ceiling height
        const spotlightPositions = [
            new BABYLON.Vector3(0, bounds.ceiling.y - 0.1, 0),  // Center
            new BABYLON.Vector3(-15, bounds.ceiling.y - 0.1, 15),  // North West
            new BABYLON.Vector3(15, bounds.ceiling.y - 0.1, 15),   // North East
            new BABYLON.Vector3(-15, bounds.ceiling.y - 0.1, -15), // South West
            new BABYLON.Vector3(15, bounds.ceiling.y - 0.1, -15)   // South East
        ];

        // Add nightclub light effect
        this.nightclubEffect = new NightclubLightEffect(this.scene, {
            positions: spotlightPositions,
            beamTypes: {
                nightclub: {
                    color: '#0000FF',
                    intensity: 0.8,
                    width: 0.3,
                    blurKernelSize: 32
                }
            }
        });
        this.nightclubEffect.start();

        // Add panel light effect
        this.panelEffect = new NightclubPanelLightEffect(this.scene, {
            positions: [
                {
                    position: new BABYLON.Vector3(
                        bounds.room.width * 0.1,  // 10% from left wall
                        bounds.ceiling.y - 1,     // 1 unit below ceiling
                        bounds.room.length * -0.1 // 10% from back wall
                    ),
                    rotation: new BABYLON.Vector3(0, Math.PI/6, 0),
                    type: 'white'
                },
                {
                    position: new BABYLON.Vector3(
                        bounds.room.width * -0.1, // 10% from right wall
                        bounds.ceiling.y - 1,
                        bounds.room.length * 0.1  // 10% from front wall
                    ),
                    rotation: new BABYLON.Vector3(0, -Math.PI/6, 0),
                    type: 'red'
                },
                {
                    position: new BABYLON.Vector3(
                        bounds.room.width * -0.2, // 20% from right wall
                        bounds.ceiling.y - 1,
                        bounds.room.length * -0.1 // 10% from back wall
                    ),
                    rotation: new BABYLON.Vector3(0, Math.PI/4, 0),
                    type: 'green'
                }
            ],
            movingPositions: [
                {
                    position: new BABYLON.Vector3(
                        0,                      // Center X
                        bounds.ceiling.y - 2,   // 2 units below ceiling
                        0                       // Center Z
                    ),
                    rotation: new BABYLON.Vector3(0, 0, 0),
                    type: 'white'
                },
                {
                    position: new BABYLON.Vector3(
                        bounds.room.width * 0.15,  // 15% from left wall
                        bounds.ceiling.y - 2,
                        bounds.room.length * 0.15  // 15% from front wall
                    ),
                    rotation: new BABYLON.Vector3(0, 0, 0),
                    type: 'red'
                },
                {
                    position: new BABYLON.Vector3(
                        bounds.room.width * -0.15, // 15% from right wall
                        bounds.ceiling.y - 2,
                        bounds.room.length * -0.15 // 15% from back wall
                    ),
                    rotation: new BABYLON.Vector3(0, 0, 0),
                    type: 'green'
                }
            ],
            dimensions: {
                width: bounds.room.width * 0.05,  // 5% of room width
                height: bounds.room.height * 0.3, // 30% of room height
                depth: 0.01
            }
        });
        this.panelEffect.start();

        // Add effect updates to render loop
        this.scene.onBeforeRenderObservable.add(() => {
            this.nightclubEffect.update();
            this.panelEffect.update();
        });

        // Create floor
        const floor = new FloorComponent('nightclub-floor');
        floor.width = bounds.floor.width;
        floor.length = bounds.floor.length;
        floor.initialize(this.scene);
        floor.position = new BABYLON.Vector3(0, bounds.floor.y, 0);
        
        const floorMaterial = new BABYLON.StandardMaterial("floor-material", this.scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        floor.mesh.material = floorMaterial;
        
        this.components.push(floor);

        // Create ceiling
        const ceiling = new CeilingComponent('nightclub-ceiling');
        ceiling.width = bounds.ceiling.width;
        ceiling.length = bounds.ceiling.length;
        ceiling.position = new BABYLON.Vector3(0, bounds.ceiling.y, 0);
        ceiling.initialize(this.scene, {
            width: bounds.ceiling.width,    // Pass width explicitly to override default
            length: bounds.ceiling.length   // Pass length explicitly to override default
        });
        this.components.push(ceiling);

        // Create walls helper function
        const createWall = (id, position, rotation) => {
            const wall = new WallComponent(id);
            wall.width = bounds.room.length;  // Using length for proper wall sizing
            wall.height = bounds.walls.height;
            wall.position = position;
            wall.initialize(this.scene);
            if (rotation) {
                wall.mesh.rotation.y = rotation;
            }
            
            const wallMaterial = new BABYLON.StandardMaterial(id + "-material", this.scene);
            wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            wall.mesh.material = wallMaterial;
            
            this.components.push(wall);
            return wall;
        };

        // Create all four walls
        const southWall = createWall('south-wall', bounds.walls.positions.south);
        const northWall = createWall('north-wall', bounds.walls.positions.north);
        const eastWall = createWall('east-wall', bounds.walls.positions.east, Math.PI / 2);
        const westWall = createWall('west-wall', bounds.walls.positions.west, Math.PI / 2);

        // Load and setup multiple Purple02F NPCs
        try {
            // Create 10 NPCs
            for (let i = 0; i < 10; i++) {
                const npc = new Purple02F(this.scene);
                
                // Initialize the NPC
                await npc.initialize();
                
                // Set random position and rotation directly on the mesh
                const position = this.getRandomPosition();
                const rotation = this.getRandomRotation();
                
                // Override position and rotation after initialization
                npc.mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);
                npc.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                    BABYLON.Vector3.Up(),
                    rotation
                );

                console.log(`NPC ${i} positioned at:`, npc.mesh.position);

                this.characters.push(npc);
                await npc.setAnimation('dancing01');
            }
            
            // Setup dance animation cycling for all NPCs
            this.setupDanceAnimations();

            // Start NPC movement
            this.startNPCMovement();
        } catch (error) {
            console.error('Failed to load Purple02F NPCs:', error);
        }

        return {
            ground: floor.mesh,
            walls: [southWall.mesh, northWall.mesh, eastWall.mesh, westWall.mesh],
            cellSize: 1
        };
    }

    dispose() {
        // Clear all animation timeouts when disposing
        if (this.characters) {
            this.characters.forEach(character => {
                // Dispose the character mesh
                character.mesh?.dispose();
            });
        }
        if (this.nightclubEffect) {
            this.nightclubEffect.dispose();
        }
        if (this.panelEffect) {
            this.panelEffect.dispose();
        }
        this.scene.onBeforeRenderObservable.clear();
        super.dispose();
    }
} 