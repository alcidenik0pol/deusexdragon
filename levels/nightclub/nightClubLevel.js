import { CustomLevel } from '../customLevel.js';
import { WORLD_CONFIG } from '../../config/config.js';
import { WallComponent } from '../../components/WallComponent.js';
import { FloorComponent } from '../../components/FloorComponent.js';
import { CeilingComponent } from '../../components/NEWCeilingComponent.js';
import { ClusterManager } from '../../src/lighting/ClusterManager.js';
import { NightClubLighting } from './lighting.js';
import { NightClubNPCManager } from './npc.js';
import { DialogueManager } from '../../src/dialogue/DialogueManager.js';
import { NightClubQuest } from './quest.js';
import { QuestJournal } from '../../quest/questJournal.js';

export class NightClubLevel extends CustomLevel {
    // Define level bounds and areas
    static LEVEL_BOUNDS = {
        ...CustomLevel.LEVEL_BOUNDS,
        floor: {
            y: 0,
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,  // Reduced from 140 to 100 meter space
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100  // Reduced from 140 to 100 meter space
        },
        room: {
            width: WORLD_CONFIG.GRID_CELL_SIZE * 100,  // Reduced from 140 to 100
            length: WORLD_CONFIG.GRID_CELL_SIZE * 100, // Reduced from 140 to 100
            height: WORLD_CONFIG.GRID_CELL_SIZE * 40   // Height remains 40m
        },
        // Define entrance area bounds - adjusted for smaller room
        entranceArea: {
            x1: -15,  // Left boundary (reduced from -20)
            x2: 15,   // Right boundary (reduced from 20)
            z1: -50,  // Back wall (south) (reduced from -70)
            z2: -40,  // Interior wall (reduced from -60)
            width: 30, // x2 - x1 (reduced from 40)
            depth: 10  // z2 - z1 (unchanged)
        },
        // Define toilet area bounds - adjusted for smaller room
        toiletArea: {
            x1: -15,  // Left boundary (reduced from -20)
            x2: 15,   // Right boundary (reduced from 20)
            z1: 30,   // Interior wall (north) (reduced from 40)
            z2: 40,   // Back wall (reduced from 70)
            width: 30, // x2 - x1 (reduced from 40)
            depth: 10  // z2 - z1 (unchanged)
        }
    };

    constructor(scene) {
        super(scene);
        
        // Set current level FIRST
        window.currentLevel = this;
        
        this.lighting = null;
        this.npcManager = null;
        this.dialogueManager = null;
        this.questSystem = null;
        this.questJournal = null;
        
        // Nuke the scene's ambient lighting
        scene.ambientColor = new BABYLON.Color3(0, 0, 0);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
        scene.environmentIntensity = 0;
        
        // Set level ID for quest system
        this.levelId = 'nightclub';
        
        // Register with level progression if available
        if (window.levelProgression) {
            window.levelProgression.currentLevel = this.levelId;
        }
        
        // Add listener for level completion
        window.addEventListener('levelExitUnlocked', (event) => {
            if (event.detail.levelId === 'nightclub') {
                console.log('Nightclub level completed, credits should be available');
                // Add points to global score when level is completed
                if (this.questSystem && this.questSystem.resolutionManager) {
                    this.questSystem.resolutionManager.addLevelPointsToGlobal('nightclub');
                }
            }
        });
    }

    async createLevel() {
        // Create the cluster manager for efficient lighting
        this.clusterManager = new ClusterManager(this.scene, {
            maxActiveLights: 4,
            debug: false
        });

        // IMPORTANT: Change the order - create entrance floor BEFORE lighting
        this.createFloor();
        const entranceFloor = this.createEntranceFloor(); // Store the reference
        this.createWalls();
        this.createCeiling();

        // Initialize lighting AFTER all meshes are created
        this.lighting = new NightClubLighting(this.scene);
        this.lighting.initialize(this.clusterManager, entranceFloor); // Pass the entrance floor reference

        // Initialize NPC manager and dialogue manager
        this.npcManager = new NightClubNPCManager(this.scene);
        this.dialogueManager = new DialogueManager(this.scene);
        
        // Initialize quest system
        this.questSystem = new NightClubQuest(this.scene);
        
        // Initialize quest journal
        this.questJournal = new QuestJournal();
        
        // Initialize components (NPCs, dialogue)
        await this.initializeComponents();

        return this;
    }

    createFloor(bounds = this.constructor.LEVEL_BOUNDS.floor) {
        const floor = new FloorComponent("nightclub-floor");
        
        floor.width = bounds.width;
        floor.length = bounds.length;
        floor.position = new BABYLON.Vector3(0, bounds.y, 0);
        
        floor.initialize(this.scene, {
            width: floor.width,
            length: floor.length
        });

        // Create PBR material for the floor with proper reflection properties
        const floorMaterial = new BABYLON.PBRMaterial("floor-material", this.scene);
        floorMaterial.albedoColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        floorMaterial.metallic = 0.8;  // More metallic for better light reflection
        floorMaterial.roughness = 0.15;  // Smoother surface for clearer reflections
        floorMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);  // Full reflectivity
        floorMaterial.microSurface = 0.95;  // Very smooth surface
        
        floor.mesh.material = floorMaterial;
        floor.mesh.receiveShadows = true;  // Important! This makes the floor receive light properly
        
        return floor.mesh;
    }

    createEntranceFloor() {
        const entranceArea = this.constructor.LEVEL_BOUNDS.entranceArea;
        const entranceFloor = new FloorComponent("entrance-floor");
        
        entranceFloor.width = entranceArea.width;
        entranceFloor.length = entranceArea.depth;
        
        // Position the entrance floor using the entrance area coordinates
        const xCenter = (entranceArea.x1 + entranceArea.x2) / 2;
        const zCenter = (entranceArea.z1 + entranceArea.z2) / 2;
        
        // Lower the entrance floor slightly to prevent z-fighting with character
        entranceFloor.position = new BABYLON.Vector3(xCenter, -0.01, zCenter);
        
        entranceFloor.initialize(this.scene, {
            width: entranceFloor.width,
            length: entranceFloor.length
        });
        
        // Create an extremely simple material with no reflections or special properties
        const entranceFloorMaterial = new BABYLON.StandardMaterial("entrance-floor-material", this.scene);
        entranceFloorMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Very dark gray
        entranceFloorMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular reflection
        entranceFloorMaterial.emissiveColor = new BABYLON.Color3(0, 0, 0); // No emission
        entranceFloorMaterial.ambientColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Match diffuse
        
        // Disable all advanced material features
        entranceFloorMaterial.useSpecularOverAlpha = false;
        entranceFloorMaterial.useReflectionOverAlpha = false;
        entranceFloorMaterial.disableLighting = false;
        entranceFloorMaterial.useEmissiveAsIllumination = false;
        
        // Add tag to identify this mesh specifically
        entranceFloor.mesh.id = "entrance-floor";
        entranceFloor.mesh.material = entranceFloorMaterial;
        
        // Disable shadows on this mesh
        entranceFloor.mesh.receiveShadows = false;
        
        // Set rendering group to ensure it renders BEFORE characters
        entranceFloor.mesh.renderingGroupId = 0; // Lower rendering group (background)
        
        // Ensure the character always renders on top of the floor
        this.scene.onBeforeRenderObservable.add(() => {
            // Find the player character mesh
            const playerMesh = this.scene.getMeshByName("PlayerCharacter");
            if (playerMesh && playerMesh.renderingGroupId !== 1) {
                // Set character to higher rendering group
                playerMesh.renderingGroupId = 1;
            }
        });
        
        return entranceFloor.mesh;
    }

    createWalls(bounds = this.constructor.LEVEL_BOUNDS.room) {
        const walls = [];
        const wallHeight = bounds.height; // 40 meters
        
        // Create outer walls using WallComponent (like Taiyong)
        const positions = [
            { id: "north", pos: new BABYLON.Vector3(0, wallHeight/2, bounds.length/2), rot: 0 },
            { id: "south", pos: new BABYLON.Vector3(0, wallHeight/2, -bounds.length/2), rot: 0 },
            { id: "east", pos: new BABYLON.Vector3(bounds.width/2, wallHeight/2, 0), rot: Math.PI/2 },
            { id: "west", pos: new BABYLON.Vector3(-bounds.width/2, wallHeight/2, 0), rot: Math.PI/2 }
        ];

        // Create metallic PBR material for walls
        const wallMaterial = new BABYLON.PBRMaterial("wall-material", this.scene);
        wallMaterial.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02);
        wallMaterial.metallic = 0.6;
        wallMaterial.roughness = 0.2;
        wallMaterial.reflectivityColor = new BABYLON.Color3(1, 1, 1);
        wallMaterial.microSurface = 0.85;
        wallMaterial.backFaceCulling = false;

        positions.forEach(({ id, pos, rot }) => {
            const wall = new WallComponent(`nightclub-wall-${id}`);
            wall.height = wallHeight;
            wall.width = (id === "north" || id === "south") ? bounds.width : bounds.length;
            wall.thickness = 0.4;
            wall.initialize(this.scene);
            
            wall.mesh.position = pos;
            wall.setRotation(0, rot, 0);
            wall.mesh.material = wallMaterial.clone(`wall-material-${id}`);
            wall.setCollision(true);
            wall.mesh.checkCollisions = true;
            wall.mesh.isBlocker = true;
            wall.mesh.receiveShadows = true;
            
            walls.push(wall.mesh);
        });

        // Add interior wall using entrance area coordinates
        const entranceArea = this.constructor.LEVEL_BOUNDS.entranceArea;
        const interiorWall = new WallComponent('nightclub-wall-interior');
        interiorWall.height = wallHeight;
        interiorWall.width = entranceArea.width;
        interiorWall.thickness = 0.4;
        interiorWall.initialize(this.scene);
        
        // Position using entrance area coordinates
        const xCenter = (entranceArea.x1 + entranceArea.x2) / 2;
        interiorWall.mesh.position = new BABYLON.Vector3(xCenter, wallHeight/2, entranceArea.z2);
        interiorWall.mesh.material = wallMaterial.clone('wall-material-interior');
        interiorWall.setCollision(true);
        interiorWall.mesh.checkCollisions = true;
        interiorWall.mesh.isBlocker = true;
        interiorWall.mesh.receiveShadows = true;
        
        walls.push(interiorWall.mesh);

        return walls;
    }

    createCeiling() {
        const ceiling = new CeilingComponent("nightclub-ceiling");
        
        // Define properties before initialization
        ceiling.width = this.constructor.LEVEL_BOUNDS.room.width;
        ceiling.length = this.constructor.LEVEL_BOUNDS.room.length;
        ceiling.position = new BABYLON.Vector3(
            0,
            this.constructor.LEVEL_BOUNDS.room.height,
            0
        );
        
        // Initialize with proper options
        ceiling.initialize(this.scene, {
            width: ceiling.width,
            length: ceiling.length
        });

        // Create metallic PBR material for ceiling
        const ceilingMaterial = new BABYLON.PBRMaterial("ceiling-material", this.scene);
        ceilingMaterial.albedoColor = new BABYLON.Color3(0.02, 0.02, 0.02); // Almost black
        ceilingMaterial.metallic = 0.8; // Very metallic
        ceilingMaterial.roughness = 0.2; // Fairly smooth
        ceilingMaterial.reflectivityColor = new BABYLON.Color3(0.9, 0.9, 0.9);
        ceilingMaterial.microSurface = 0.95; // Very smooth surface
        ceilingMaterial.backFaceCulling = false;
        
        ceiling.mesh.material = ceilingMaterial;
        ceiling.mesh.receiveShadows = true;

        return ceiling.mesh;
    }

    async initializeComponents() {
        // Initialize NPCs
        if (this.npcManager) {
            await this.npcManager.initialize();
            
            // Set up dance animations for all NPCs except Tong
            this.setupDanceAnimations();
        }
        
        // Initialize dialogue manager and register NPCs
        if (this.dialogueManager && this.npcManager) {
            this.dialogueManager.initialize();
            this.dialogueManager.registerNPCs(Array.from(this.npcManager.npcs.values()));
        }
    }
    
    setupDanceAnimations() {
        // Skip if no NPC manager
        if (!this.npcManager) return;
        
        // Get all NPCs except Tong
        const dancingNPCs = Array.from(this.npcManager.npcs.entries())
            .filter(([id, _]) => id !== 'tong')
            .map(([_, npc]) => npc);
            
        // Set up animation cycle for each NPC
        dancingNPCs.forEach(npc => {
            // Initial animation state
            let currentAnimation = 'idle';
            npc.setAnimation(currentAnimation);
            
            // Animation timer
            let animationTimer = 0;
            let animationDuration = this.getRandomDuration(3, 6); // 3-6 seconds
            
            // Set up animation update
            this.scene.onBeforeRenderObservable.add(() => {
                animationTimer += this.scene.getEngine().getDeltaTime() / 1000; // Convert to seconds
                
                // Time to change animation
                if (animationTimer >= animationDuration) {
                    // Reset timer and set new duration
                    animationTimer = 0;
                    animationDuration = this.getRandomDuration(3, 6);
                    
                    // Determine next animation
                    const randomValue = Math.random();
                    
                    if (randomValue < 0.2) {
                        // 20% chance for idle
                        currentAnimation = 'idle';
                    } else {
                        // 80% chance for dancing
                        // Choose between dancing01 and dancing02
                        currentAnimation = Math.random() < 0.5 ? 'dancing01' : 'dancing02';
                    }
                    
                    // Apply the animation
                    npc.setAnimation(currentAnimation);
                    // console.log(`NPC ${npc.id} now ${currentAnimation}`);
                }
            });
        });
    }
    
    getRandomDuration(min, max) {
        return min + Math.random() * (max - min);
    }

    onUpdate() {
        // Update NPCs if needed
        if (this.npcManager) {
            this.npcManager.onUpdate();
        }
    }

    dispose() {
        if (this.lighting) {
            this.lighting.dispose();
        }
        
        if (this.clusterManager) {
            this.clusterManager.dispose();
        }
        
        if (this.npcManager) {
            this.npcManager.dispose();
        }
        
        if (this.dialogueManager) {
            this.dialogueManager.dispose();
        }
        
        if (this.questSystem) {
            this.questSystem.dispose();
        }
        
        if (this.questJournal) {
            this.questJournal.dispose();
        }
        
        super.dispose();
    }
}
