import { npcService } from '../services/npcService.js';

export class NPCBase {
    constructor(npcData, scene) {
        this.data = npcData;
        this.scene = scene;
        this.mesh = null;
        this.currentConversationId = null;
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
                model_path: this.data.model_path,
                scene: this.data.scene,
                rotation: this.data.rotation,
                scale: this.data.scale,
                interactionRadius: this.data.interactionRadius,
                initialMemories: this.data.initialMemories
            });

            console.log('NPC created in database, loading 3D model from:', this.data.model_path);

            try {
                // Load 3D model
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    "", 
                    "", 
                    this.data.model_path, 
                    this.scene
                );
                
                console.log('3D model loaded successfully:', result);
                this.mesh = result.meshes[0];
                this.setupMesh(result);
                return this;
            } catch (modelError) {
                console.error('Error loading 3D model:', modelError);
                throw new Error(`Failed to load 3D model: ${modelError.message}`);
            }
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
        this.mesh.scaling = new BABYLON.Vector3(
            this.data.scale,
            this.data.scale,
            this.data.scale
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