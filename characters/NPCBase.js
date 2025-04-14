import { ChatUI } from '../chat/chatUI.js';
import { npcService } from '../services/npcService.js';

export class NPCBase {
    static DEFAULT_SCALE = 2.0;
    static DEFAULT_Y_POSITION = 0.1;
    static DEFAULT_POSITION = new BABYLON.Vector3(-1, 0.1, -1);
    static MOVEMENT_SPEED = 0.01;
    static ROTATION_SPEED = 0.1;
    static MIN_PAUSE_TIME = 2;    // Minimum seconds to pause
    static MAX_PAUSE_TIME = 5;    // Maximum seconds to pause
    static MIN_WALK_TIME = 4;     // Minimum seconds to walk
    static MAX_WALK_TIME = 8;     // Maximum seconds to walk

    // Movement states
    static States = {
        IDLE: 'idle',
        WALKING: 'walking',
        LOCKED: 'locked'  // For when movement needs to be prevented
    };

    // Add these new static properties at the top of the class
    static MOVEMENT_PATTERNS = {
        CIRCLE: 'circle',
        FIGURE_8: 'figure8',
        OVAL: 'oval',
        INFINITY: 'infinity'
    };

    constructor(npcData, scene) {
        this.data = npcData;
        this.scene = scene;
        this.mesh = null;
        this.currentAnimation = npcData.defaultAnimation;
        
        // Position and movement
        this.position = NPCBase.DEFAULT_POSITION.clone();
        this.spawnPosition = this.position.clone(); // Store initial spawn position
        this.rotation = npcData.rotation;
        this.scale = npcData.scale || NPCBase.DEFAULT_SCALE;
        
        // Movement state system
        this.currentState = NPCBase.States.WALKING;
        this.stateTimer = this.getRandomTime(NPCBase.MIN_WALK_TIME, NPCBase.MAX_WALK_TIME);
        this.movementTime = 0;
        this.currentDirection = new BABYLON.Vector3(1, 0, 0);
        this.targetRotation = this.rotation;
        this.isMovementLocked = false;

        // Add pattern state
        this.currentPattern = this.getRandomPattern();
        this.patternTimer = this.getRandomTime(15, 30); // Switch patterns every 15-30 seconds
    }

    getRandomTime(min, max) {
        return Math.random() * (max - min) + min;
    }

    getRandomPattern() {
        const patterns = Object.values(NPCBase.MOVEMENT_PATTERNS);
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    async initialize() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                this.data.animations[this.currentAnimation], 
                "", 
                this.scene
            );
            
            this.mesh = result.meshes[0];
            this.mesh.position = this.position;
            this.spawnPosition = this.position.clone(); // Update spawn position after initialization
            this.mesh.scaling = new BABYLON.Vector3(this.scale, this.scale, this.scale);
            this.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                BABYLON.Vector3.Up(), 
                this.rotation
            );
            
            result.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissiveColor = BABYLON.Color3.Black();
                    mesh.material.ambientColor = BABYLON.Color3.Black();
                    mesh.material.needDepthPrePass = true;
                }
            });

            return this;
        } catch (error) {
            console.error('Error initializing NPC:', error);
            throw error;
        }
    }

    async setAnimation(animationName) {
        if (this.mesh) {
            this.mesh.dispose();
        }
        this.currentAnimation = animationName;
        await this.initialize(); // Reuse our single initialization path
    }

    async loadModel(animationName) {
        const modelPath = this.data.animations[animationName];
        if (!modelPath) {
            throw new Error(`Animation ${animationName} not found`);
        }

        try {
            if (this.mesh) {
                this.mesh.dispose();
            }
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", modelPath, this.scene);
            this.mesh = result.meshes[0];
            this.currentAnimation = animationName;
            return result;
        } catch (error) {
            console.error(`Error loading animation ${animationName}:`, error);
            throw error;
        }
    }

    async startConversation() {
        try {
            const { id } = await npcService.startConversation(this.data.id);
            this.currentConversationId = id;
            return id;
        } catch (error) {
            console.error('Error starting conversation:', error);
            return null;
        }
    }

    async addMessage(sender, content) {
        if (!this.currentConversationId) {
            await this.startConversation();
        }
        try {
            await npcService.addMessage(this.currentConversationId, sender, content);
        } catch (error) {
            console.error('Error adding message:', error);
        }
    }

    async getConversationHistory() {
        if (!this.currentConversationId) return [];
        try {
            return await npcService.getConversationHistory(this.currentConversationId);
        } catch (error) {
            console.error('Error getting conversation history:', error);
            return [];
        }
    }

    setState(newState) {
        if (this.isMovementLocked && newState !== NPCBase.States.LOCKED) {
            console.log('Movement locked - cannot change state');
            return;
        }
        
        const oldState = this.currentState;
        this.currentState = newState;
        console.log(`NPC state changed: ${oldState} -> ${newState}`);

        // Reset timer on state change
        this.stateTimer = this.getRandomTime(
            this.currentState === NPCBase.States.WALKING ? NPCBase.MIN_WALK_TIME : NPCBase.MIN_PAUSE_TIME,
            this.currentState === NPCBase.States.WALKING ? NPCBase.MAX_WALK_TIME : NPCBase.MAX_PAUSE_TIME
        );
    }

    lockMovement() {
        this.isMovementLocked = true;
        this.setState(NPCBase.States.LOCKED);
    }

    unlockMovement() {
        this.isMovementLocked = false;
        this.setState(NPCBase.States.IDLE);
    }

    isMoving() {
        return this.currentState === NPCBase.States.WALKING;
    }

    updatePosition() {
        const scale = 5;
        switch (this.currentPattern) {
            case NPCBase.MOVEMENT_PATTERNS.CIRCLE:
                this.position.x = this.spawnPosition.x + Math.cos(this.movementTime) * scale;
                this.position.z = this.spawnPosition.z + Math.sin(this.movementTime) * scale;
                break;
                
            case NPCBase.MOVEMENT_PATTERNS.FIGURE_8:
                this.position.x = this.spawnPosition.x + Math.sin(this.movementTime) * scale;
                this.position.z = this.spawnPosition.z + Math.sin(this.movementTime * 0.5) * scale;
                break;
                
            case NPCBase.MOVEMENT_PATTERNS.OVAL:
                this.position.x = this.spawnPosition.x + Math.cos(this.movementTime) * scale;
                this.position.z = this.spawnPosition.z + Math.sin(this.movementTime) * (scale * 0.5);
                break;
                
            case NPCBase.MOVEMENT_PATTERNS.INFINITY:
                const a = scale * 0.5;
                const t = this.movementTime;
                this.position.x = this.spawnPosition.x + a * (Math.sin(t) / (1 + Math.cos(t) * Math.cos(t)));
                this.position.z = this.spawnPosition.z + a * (Math.sin(t) * Math.cos(t) / (1 + Math.cos(t) * Math.cos(t)));
                break;
        }
    }

    updateMovement() {
        if (!this.mesh || this.currentState === NPCBase.States.LOCKED) return;

        // Check if this specific NPC is being talked to
        if (ChatUI.isActive && window.chatUI?.currentNPC?.id === this.data.id) {
            // Force idle state only for the NPC being talked to
            if (this.currentState !== NPCBase.States.IDLE) {
                this.setState(NPCBase.States.IDLE);
            }
            
            // Make NPC face the player when chatting
            if (window.player && window.player.mesh) {
                // Calculate direction from NPC to player
                const playerDirection = new BABYLON.Vector3(
                    window.player.mesh.position.x - this.mesh.position.x,
                    0,
                    window.player.mesh.position.z - this.mesh.position.z
                ).normalize();
                
                // Calculate rotation angle to face player
                this.targetRotation = Math.atan2(playerDirection.x, playerDirection.z);
                
                // Apply smooth rotation
                const currentRotation = this.mesh.rotationQuaternion.toEulerAngles().y;
                const rotationDiff = this.targetRotation - currentRotation;
                const smoothRotation = currentRotation + rotationDiff * NPCBase.ROTATION_SPEED;
                
                this.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                    BABYLON.Vector3.Up(),
                    smoothRotation
                );
            }
            
            return;
        }

        // Rest of the movement update logic continues as normal for other NPCs
        this.patternTimer -= NPCBase.MOVEMENT_SPEED;
        if (this.patternTimer <= 0) {
            this.currentPattern = this.getRandomPattern();
            this.patternTimer = this.getRandomTime(15, 30);
            console.log(`NPC switching to ${this.currentPattern} pattern`);
        }

        // Rest of the movement update logic
        this.stateTimer -= NPCBase.MOVEMENT_SPEED;
        if (this.stateTimer <= 0) {
            const nextState = this.currentState === NPCBase.States.WALKING ? 
                NPCBase.States.IDLE : NPCBase.States.WALKING;
            this.setState(nextState);
        }

        if (this.currentState === NPCBase.States.WALKING) {
            this.movementTime += NPCBase.MOVEMENT_SPEED;
            
            // Update position based on current pattern
            this.updatePosition();

            // Calculate movement direction
            const newDirection = new BABYLON.Vector3(
                this.position.x - this.mesh.position.x,
                0,
                this.position.z - this.mesh.position.z
            );
            
            if (newDirection.length() > 0.1) {
                this.currentDirection = newDirection.normalize();
                this.targetRotation = Math.atan2(this.currentDirection.x, this.currentDirection.z);
            }

            this.mesh.position = this.position;
        }

        // Always update rotation smoothly
        const currentRotation = this.mesh.rotationQuaternion.toEulerAngles().y;
        const rotationDiff = this.targetRotation - currentRotation;
        const smoothRotation = currentRotation + rotationDiff * NPCBase.ROTATION_SPEED;
        
        this.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
            BABYLON.Vector3.Up(),
            smoothRotation
        );
    }

    dispose() {
        if (this.mesh) {
            this.mesh.dispose();
            this.mesh = null;
        }
    }
} 