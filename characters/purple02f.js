import { NPCBase } from './NPCBase.js';
import npcData from '../npcs/data/purple02f.js';

export class Purple02F extends NPCBase {
    constructor(scene) {
        super(npcData, scene);
        this.name = npcData.name;
        this.id = npcData.id;
        this.interactionRadius = npcData.interactionRadius || 5;
        this.persona = npcData.persona;
    }

    async initialize() {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            npcData.animations[this.data.defaultAnimation], 
            "", 
            this.scene
        );

        this.mesh = result.meshes[0];
        this.mesh.position = new BABYLON.Vector3(
            this.data.position.x,
            this.data.position.y,
            this.data.position.z
        );
        this.setupMesh(result);

        return this;
    }

    setupMesh(modelResult) {
        if (!this.mesh) {
            console.warn('No mesh to setup');
            return;
        }

        // Use the updated position and rotation from this.data
        this.mesh.position = new BABYLON.Vector3(
            this.data.position.x,
            this.data.position.y,
            this.data.position.z
        );

        this.mesh.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
            BABYLON.Vector3.Up(),
            this.data.rotation
        );

        // console.log(`Mesh setup for ${this.name}: Position - ${this.mesh.position}, Rotation - ${this.data.rotation}`);

        // Use class defaults for consistent scaling
        this.mesh.scaling = new BABYLON.Vector3(
            NPCBase.DEFAULT_SCALE,
            NPCBase.DEFAULT_SCALE,
            NPCBase.DEFAULT_SCALE
        );

        // Apply same material properties as main character
        if (modelResult && modelResult.meshes) {
            modelResult.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissiveColor = BABYLON.Color3.Black();
                    mesh.material.ambientColor = BABYLON.Color3.Black();
                    mesh.material.needDepthPrePass = true;

                    // Add shadow-friendly properties
                    if (this.scene.name === "Singapore4Level") {
                        mesh.material.specularColor = BABYLON.Color3.Black();
                        mesh.material.ambientColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                    }
                }
            });
        }
    }
}

export const loadPurple02F = async (scene) => {
    const npc = new Purple02F(scene);
    await npc.initialize();
    return npc;
}; 