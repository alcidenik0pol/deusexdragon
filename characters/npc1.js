import { NPCBase } from './NPCBase.js';
// import { npcService } from '../dist/client/services/npcService.js';
import npc1Data from '../npcs/data/npc1.js';

export class NPC1 extends NPCBase {
    constructor(scene) {
        super(npc1Data, scene);
        this.name = npc1Data.name;
        this.id = npc1Data.id;
        this.interactionRadius = npc1Data.interactionRadius;
        this.persona = npc1Data.persona;
    }

    async initialize() {
        // Load the NPC model
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            npc1Data.model, 
            "", 
            this.scene
        );

        this.mesh = result.meshes[0];
        this.mesh.position = new BABYLON.Vector3(
            npc1Data.position.x,
            npc1Data.position.y,
            npc1Data.position.z
        );
        
        // Set rotation
        this.mesh.rotation = new BABYLON.Vector3(0, npc1Data.rotation, 0);
        
        // Set scale
        this.mesh.scaling = new BABYLON.Vector3(
            npc1Data.scale,
            npc1Data.scale,
            npc1Data.scale
        );

        console.log(`NPC ${this.name} initialized with persona:`, this.persona);
        return this;
    }
}

export const loadNPC1 = async (scene) => {
    const npc = new NPC1(scene);
    await npc.initialize();
    return npc;
}; 