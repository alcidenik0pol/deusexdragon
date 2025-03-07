import { LevelGenerator } from '../levelGenerator.js';
import { WallComponent } from '../components/WallComponent.js';
import { FloorComponent } from '../components/FloorComponent.js';
import { CeilingComponent } from '../components/NEWCeilingComponent.js';
import { EffectManager } from '../src/effects/EffectManager.js';
import { NightclubLightEffect } from '../src/effects/NightclubLightEffect.js';
import { NightclubPanelLightEffect } from '../src/effects/NightclubPanelLightEffect.js';
import { Purple02F } from '../characters/purple02f.js';
import baseNPCData from '../npcs/data/purple02f.js';

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
        this.characters = [];
        this.danceAnimations = ['dancing01', 'dancing02'];
        this.npcs = []; // Add this to track NPCs for chat system

        // Add event listener for NPC interactions
        window.addEventListener('npc-chat-started', (event) => {
            const { npcId, conversationId, npcName } = event.detail;
            console.log(`Chat started with ${npcName} (${npcId}), conversation ID: ${conversationId}`);
            // Here you would typically trigger your chat UI
            // For example:
            // this.showChatUI(npcId, conversationId, npcName);
        });
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

    switchRandomDanceAnimation(npc) {
        const currentAnim = npc.currentAnimation;
        const otherAnim = currentAnim === 'dancing01' ? 'dancing02' : 'dancing01';
        npc.setAnimation(otherAnim).catch(error => {
            console.error('Failed to switch animation:', error);
        });
    }

    startDanceAnimations() {
        this.characters.forEach(npc => {
            const switchAnimation = () => {
                this.switchRandomDanceAnimation(npc);
                // Set next animation switch with random delay between 3-10 seconds
                setTimeout(switchAnimation, Math.random() * 7000 + 3000);
            };
            // Start the animation switching cycle
            setTimeout(switchAnimation, Math.random() * 7000 + 3000);
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

        // Add NPCs
        try {
            const npcPositions = [
                { 
                    pos: new BABYLON.Vector3(5, 0.1, 5), 
                    rot: Math.PI / 4,
                    name: "Dancer 1"
                },
                { 
                    pos: new BABYLON.Vector3(-15, 0.1, -15), 
                    rot: Math.PI / 2,
                    name: "Dancer 2"
                }
            ];

            for (const config of npcPositions) {
                const npc = new Purple02F(this.scene);
                await npc.initialize();
                npc.data.position = { 
                    x: config.pos.x, 
                    y: config.pos.y, 
                    z: config.pos.z 
                };
                npc.mesh.position = config.pos;
                npc.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                    BABYLON.Vector3.Up(),
                    config.rot
                );
                this.characters.push(npc);
                this.npcs.push(npc); // Add to npcs array for chat system
                await npc.setAnimation(this.danceAnimations[Math.floor(Math.random() * 2)]);
            }

            this.startDanceAnimations();

        } catch (error) {
            console.error('Failed to load Purple02F NPCs:', error);
        }

        const result = {
            ground: floor.mesh,
            walls: [southWall.mesh, northWall.mesh, eastWall.mesh, westWall.mesh],
            cellSize: 1,
            npcs: this.npcs // Add NPCs to the return object
        };

        // Store reference to level generator on ground mesh
        result.ground.levelGenerator = this;

        return result;
    }

    dispose() {
        // Remove event listener when disposing
        window.removeEventListener('npc-chat-started', this.handleNPCChat);
        
        if (this.nightclubEffect) {
            this.nightclubEffect.dispose();
        }
        if (this.panelEffect) {
            this.panelEffect.dispose();
        }
        this.scene.onBeforeRenderObservable.clear();
        // Add NPC cleanup
        if (this.characters) {
            this.characters.forEach(character => {
                character.mesh?.dispose();
            });
        }
        super.dispose();
    }
} 