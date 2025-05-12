import { Maxeen } from '../../characters/gameplay/maxeen.js';
import { CSK } from '../../characters/gameplay/csk.js';
import { MReed } from '../../characters/gameplay/mreed.js';
import { BangWeiTun } from '../../characters/gameplay/bangweitun.js';
import { NPCBase } from '../../characters/gameplay/NPCBase.js';

// Import the NPC data to get the canonical IDs
import maxeenData from '../../characters/data/maxeen.js';
import cskData from '../../characters/data/csk.js';
import mreedData from '../../characters/data/mreed.js';
import bangweitunData from '../../characters/data/bangweitun.js';

// Define base orientation constant
const BASE_ORIENTATION = Math.PI;

export class TaiyongNPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        // All NPCs in Taiyong are stationary
        this.stationaryNPCs = [
            maxeenData.id,
            cskData.id,
            mreedData.id,
            bangweitunData.id
        ];
    }

    async initialize() {
        const npcConfigs = [
            {
                Class: Maxeen,
                id: maxeenData.id,
                position: new BABYLON.Vector3(-14, 0.1, 0),
                rotation: BASE_ORIENTATION
            },
            {
                Class: CSK,
                id: cskData.id,
                position: new BABYLON.Vector3(7, 0.1, 10),
                rotation: BASE_ORIENTATION * 0.7
            },
            {
                Class: MReed,
                id: mreedData.id,
                position: new BABYLON.Vector3(37, 0.1, 5),
                rotation: BASE_ORIENTATION * 0.7
            },
            {
                Class: BangWeiTun,
                id: bangweitunData.id,
                position: new BABYLON.Vector3(-7, 0.1, -7),
                rotation: BASE_ORIENTATION * 1.3
            }
        ];

        for (const config of npcConfigs) {
            const npc = new config.Class(this.scene);
            npc.position = config.position;
            npc.rotation = config.rotation;
            
            // Set all NPCs to IDLE state since they're stationary
            npc.currentState = NPCBase.States.IDLE;
            
            await npc.initialize();
            this.npcs.set(config.id, npc);
            console.log(`NPC ${config.id} initialized at:`, npc.position);
        }

        return this;
    }

    onUpdate() {
        // No updates needed since NPCs are completely stationary
    }

    dispose() {
        for (const npc of this.npcs.values()) {
            if (npc.dispose) {
                npc.dispose();
            }
        }
        this.npcs.clear();
    }
} 