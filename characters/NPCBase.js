import { npcService } from '../services/npcService.js';

export class NPCBase {
    // Add static default values at class level
    static DEFAULT_SCALE = 2.0;  // Twice the size of main character
    static DEFAULT_Y_POSITION = 0.1;  // Same as main character's y position

    constructor(npcData, scene) {
        this.data = npcData;
        this.scene = scene;
        this.mesh = null;
        this.currentAnimation = npcData.defaultAnimation;
        this.currentConversationId = null;
        
        // Apply default scale if not specified in npcData
        this.data.scale = npcData.scale || NPCBase.DEFAULT_SCALE;
        // Ensure consistent Y position
        this.data.position.y = NPCBase.DEFAULT_Y_POSITION;
    }

    async loadModel(animationName) {
        const modelPath = this.data.animations[animationName];
        if (!modelPath) {
            throw new Error(`Animation ${animationName} not found`);
        }

        try {
            // If we already have a mesh, remove it
            if (this.mesh) {
                this.mesh.dispose();
            }

            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                "", 
                modelPath, 
                this.scene
            );
            
            this.mesh = result.meshes[0];
            this.setupMesh(result);
            this.currentAnimation = animationName;
            return result;
        } catch (error) {
            console.error(`Error loading animation ${animationName}:`, error);
            throw error;
        }
    }

    async setAnimation(animationName) {
        if (this.currentAnimation === animationName) return;
        if (!this.data.animations[animationName]) {
            throw new Error(`Animation ${animationName} not found`);
        }

        try {
            // Store current position and rotation before loading new model
            const currentPosition = this.mesh ? this.mesh.position.clone() : null;
            const currentRotation = this.mesh ? this.mesh.rotationQuaternion.clone() : null;

            await this.loadModel(animationName);

            // Restore position and rotation after loading new model
            if (currentPosition && currentRotation) {
                this.mesh.position = currentPosition;
                this.mesh.rotationQuaternion = currentRotation;
            }
        } catch (error) {
            console.error(`Failed to set animation ${animationName}:`, error);
            // Fallback to default animation if available
            if (animationName !== this.data.defaultAnimation) {
                await this.setAnimation(this.data.defaultAnimation);
            }
        }
    }

    async initialize() {
        try {
            console.log('Initializing NPC with data:', this.data);
            
            // Create or get NPC in database
            await npcService.createNPC({
                id: this.data.id,
                name: this.data.name,
                persona: this.data.persona,
                position: this.data.position,
                model_path: JSON.stringify(this.data.animations), // Store all animation paths
                scene: this.data.scene,
                rotation: this.data.rotation,
                scale: this.data.scale,
                interactionRadius: this.data.interactionRadius,
                initialMemories: this.data.initialMemories
            });

            // Load the default animation
            await this.loadModel(this.data.defaultAnimation);
            return this;
        } catch (error) {
            console.error('Error initializing NPC:', error);
            throw error;
        }
    }

    setupMesh(modelResult) {
        if (!this.mesh) {
            console.warn('No mesh to setup');
            return;
        }

        console.log('Setting up mesh with position:', this.data.position);

        // Use class defaults for consistent scaling
        this.mesh.scaling = new BABYLON.Vector3(
            NPCBase.DEFAULT_SCALE,
            NPCBase.DEFAULT_SCALE,
            NPCBase.DEFAULT_SCALE
        );

        // Set position, rotation, and scale
        this.mesh.position = new BABYLON.Vector3(
            this.data.position.x,
            this.data.position.y,
            this.data.position.z
        );
        this.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
            BABYLON.Vector3.Up(), 
            this.data.rotation
        );

        // Setup materials
        if (modelResult && modelResult.meshes) {
            modelResult.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissiveColor = BABYLON.Color3.Black();
                    mesh.material.ambientColor = BABYLON.Color3.Black();
                }
            });
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
} 