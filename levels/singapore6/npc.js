import { CopF01 } from '../../characters/copf01.js';
import { GuardM01 } from '../../characters/guardm01.js';
import { MaggieChow } from '../../characters/maggiechow.js';
import { OrangeF01 } from '../../characters/orangef01.js';
import { Purple02F } from '../../characters/purple02f.js';
import { BlueF01 } from '../../characters/bluef01.js';

export class Singapore6NPCManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = new Map();
    }

    async initialize() {
        // Define NPC spawn positions relative to Merlion
        // Merlion is at { x: -40, z: 70 } according to object mapping
        const merlionPos = { x: -40, z: 70 };
        
        const npcConfigs = [
            { 
                Class: CopF01, 
                id: 'COP_F01',
                position: new BABYLON.Vector3(merlionPos.x + 5, 0.1, merlionPos.z - 15),
                rotation: Math.PI 
            },
            { 
                Class: GuardM01, 
                id: 'GUARD_M01',
                position: new BABYLON.Vector3(merlionPos.x - 10, 0.1, merlionPos.z - 20),
                rotation: Math.PI * 1.5 
            },
            { 
                Class: MaggieChow, 
                id: 'MAGGIE',
                position: new BABYLON.Vector3(merlionPos.x + 15, 0.1, merlionPos.z - 25),
                rotation: Math.PI * 0.5 
            },
            { 
                Class: OrangeF01, 
                id: 'ORANGE_F01',
                position: new BABYLON.Vector3(merlionPos.x, 0.1, merlionPos.z - 30),
                rotation: Math.PI * 0.25 
            },
            { 
                Class: Purple02F, 
                id: 'PURPLE_02F',
                position: new BABYLON.Vector3(merlionPos.x + 8, 0.1, merlionPos.z - 35),
                rotation: Math.PI * 1.75 
            },
            { 
                Class: BlueF01, 
                id: 'BLUE_F01',
                position: new BABYLON.Vector3(merlionPos.x - 5, 0.1, merlionPos.z - 40),
                rotation: Math.PI 
            }
        ];

        // Initialize all NPCs
        for (const config of npcConfigs) {
            const npc = new config.Class(this.scene);
            npc.position = config.position;
            npc.rotation = config.rotation;
            
            await npc.initialize();
            this.npcs.set(config.id, npc);
            console.log(`NPC ${config.id} initialized at:`, npc.position);
        }

        return this;
    }

    onUpdate() {
        // Update all NPCs
        for (const npc of this.npcs.values()) {
            if (npc && npc.mesh) {
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