import { Tong } from '../../characters/gameplay/tong.js';
import { BangWeiTun } from '../../characters/gameplay/bangweitun.js';
import { BlueF01 } from '../../characters/gameplay/bluef01.js';
import { CopF01 } from '../../characters/gameplay/copf01.js';
import { CSK } from '../../characters/gameplay/csk.js';
import { GuardM01 } from '../../characters/gameplay/guardm01.js';
import { OrangeF01 } from '../../characters/gameplay/orangef01.js';
import { Purple02F } from '../../characters/gameplay/purple02f.js';
import { NPCBase } from '../../characters/gameplay/NPCBase.js';

// Import the NPC data to get the canonical IDs
import tongData from '../../characters/data/tong.js';
import bangweitunData from '../../characters/data/bangweitun.js';
import linmeihuaData from '../../characters/data/bluef01.js';
import zaratanData from '../../characters/data/copf01.js';
import cskData from '../../characters/data/csk.js';
import khaichenData from '../../characters/data/guardm01.js';
import victorialimData from '../../characters/data/orangef01.js';
import nikazhangData from '../../characters/data/purple02f.js';

// Define base orientation constant
const BASE_ORIENTATION = Math.PI;

export class NightClubNPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
        // All NPCs in Nightclub are stationary
        this.stationaryNPCs = [
            tongData.id,
            bangweitunData.id,
            linmeihuaData.id,
            zaratanData.id,
            cskData.id,
            khaichenData.id,
            victorialimData.id,
            nikazhangData.id
        ];
    }

    async initialize() {
        const npcConfigs = [
            {
                Class: Tong,
                id: tongData.id,
                position: new BABYLON.Vector3(-4, 0.1, -29),
                rotation: BASE_ORIENTATION
            },
            {
                Class: BangWeiTun,
                id: bangweitunData.id,
                position: new BABYLON.Vector3(-15, 0.1, -15),
                rotation: BASE_ORIENTATION * 0.8
            },
            {
                Class: BlueF01,
                id: linmeihuaData.id,
                position: new BABYLON.Vector3(15, 0.1, 15),
                rotation: BASE_ORIENTATION * 1.2
            },
            {
                Class: CopF01,
                id: zaratanData.id,
                position: new BABYLON.Vector3(20, 0.1, -10),
                rotation: BASE_ORIENTATION * 0.7
            },
            {
                Class: CSK,
                id: cskData.id,
                position: new BABYLON.Vector3(0, 0.1, 25),
                rotation: BASE_ORIENTATION * 1.1
            },
            {
                Class: GuardM01,
                id: khaichenData.id,
                position: new BABYLON.Vector3(-25, 0.1, -25),
                rotation: BASE_ORIENTATION * 0.9
            },
            {
                Class: OrangeF01,
                id: victorialimData.id,
                position: new BABYLON.Vector3(10, 0.1, -20),
                rotation: BASE_ORIENTATION * 0.6
            },
            {
                Class: Purple02F,
                id: nikazhangData.id,
                position: new BABYLON.Vector3(-10, 0.1, 20),
                rotation: BASE_ORIENTATION * 1.4
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