import { CopF01 } from '../../characters/gameplay/copf01.js';
import { GuardM01 } from '../../characters/gameplay/guardm01.js';
import { MaggieChow } from '../../characters/gameplay/maggiechow.js';
import { OrangeF01 } from '../../characters/gameplay/orangef01.js';
import { Purple02F } from '../../characters/gameplay/purple02f.js';
import { BlueF01 } from '../../characters/gameplay/bluef01.js';
import { NPCBase } from '../../characters/gameplay/NPCBase.js';

// Import the NPC data to get the canonical IDs
import guardm01Data from '../../characters/data/guardm01.js';
import copf01Data from '../../characters/data/copf01.js';
import maggiechowData from '../../characters/data/maggiechow.js';
import orangef01Data from '../../characters/data/orangef01.js';
import purple02fData from '../../characters/data/purple02f.js';
import bluef01Data from '../../characters/data/bluef01.js';

export class Singapore6NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        // Use the canonical ID from the data file
        this.stationaryNPCs = [guardm01Data.id];
    }

    async initialize() {
        const merlionPos = { x: -40, z: 70 };
        
        const npcConfigs = [
            { 
                Class: CopF01, 
                id: copf01Data.id,
                position: new BABYLON.Vector3(merlionPos.x + 5, 0.1, merlionPos.z - 15),
                rotation: Math.PI 
            },
            { 
                Class: GuardM01, 
                id: guardm01Data.id,
                position: new BABYLON.Vector3(-65, 0.1, 10),
                rotation: Math.PI * 0.5 
            },
            { 
                Class: MaggieChow, 
                id: maggiechowData.id,
                position: new BABYLON.Vector3(merlionPos.x + 15, 0.1, merlionPos.z - 25),
                rotation: Math.PI * 0.5 
            },
            { 
                Class: OrangeF01, 
                id: orangef01Data.id,
                position: new BABYLON.Vector3(merlionPos.x, 0.1, merlionPos.z - 30),
                rotation: Math.PI * 0.25 
            },
            { 
                Class: Purple02F, 
                id: purple02fData.id,
                position: new BABYLON.Vector3(merlionPos.x + 8, 0.1, merlionPos.z - 35),
                rotation: Math.PI * 1.75 
            },
            { 
                Class: BlueF01, 
                id: bluef01Data.id,
                position: new BABYLON.Vector3(merlionPos.x - 5, 0.1, merlionPos.z - 40),
                rotation: Math.PI 
            }
        ];

        for (const config of npcConfigs) {
            const npc = new config.Class(this.scene);
            npc.position = config.position;
            npc.rotation = config.rotation;
            
            if (this.stationaryNPCs.includes(config.id)) {
                npc.currentState = NPCBase.States.IDLE;
            }
            
            await npc.initialize();
            this.npcs.set(config.id, npc);
            console.log(`NPC ${config.id} initialized at:`, npc.position);
        }

        return this;
    }

    onUpdate() {
        for (const [id, npc] of this.npcs.entries()) {
            if (npc && npc.mesh && !this.stationaryNPCs.includes(id)) {
                npc.updateMovement();
            }
        }
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