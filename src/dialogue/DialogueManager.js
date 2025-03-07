import { ChatUI } from '../../chat/chatUI.js';

export class DialogueManager {
    constructor(scene) {
        this.scene = scene;
        this.npcs = [];
        this.chatUI = new ChatUI();
        this.enabled = false;
    }

    initialize() {
        this.enabled = true;
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    registerNPCs(npcs) {
        if (!Array.isArray(npcs)) {
            npcs = [npcs];
        }
        this.npcs = this.npcs.concat(npcs);
    }

    handleKeyPress(e) {
        if (!this.enabled || e.key !== 'e') return;
        
        if (ChatUI.isActive) {
            return;
        }

        const nearbyNPC = this.findClosestNPC();
        if (nearbyNPC) {
            this.chatUI.setNPC(nearbyNPC);
            this.chatUI.show();
            this.lockPlayerControls(true);
        } else {
            console.log("No NPCs nearby. Get closer to talk to someone!");
        }
    }

    findClosestNPC() {
        if (!this.scene.activeCamera || this.npcs.length === 0) {
            console.log("No camera or NPCs:", {
                camera: !!this.scene.activeCamera,
                npcsCount: this.npcs.length
            });
            return null;
        }
        
        const playerCharacter = this.scene.getMeshByName("PlayerCharacter");
        if (!playerCharacter) {
            console.log("Player character not found");
            return null;
        }
        
        const playerPos = playerCharacter.position;
        console.log(`Player Position: ${playerPos.x}, ${playerPos.y}, ${playerPos.z}`);
        
        let closestNPC = null;
        let closestDistance = Infinity;
        
        this.npcs.forEach(npc => {
            if (!npc.mesh) {
                console.log("NPC missing mesh:", npc);
                return;
            }
            
            const npcPos = npc.mesh.position;
            console.log(`NPC Position: ${npc.name} - ${npcPos.x}, ${npcPos.y}, ${npcPos.z}`);
            
            const distance = BABYLON.Vector3.Distance(playerPos, npcPos);
            
            console.log(`Distance to ${npc.name}: ${distance}`);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestNPC = npc;
            }
        });
        
        const interactionRadius = closestNPC?.interactionRadius || 3;
        console.log(`Closest NPC: ${closestNPC?.name}, Distance: ${closestDistance}, Radius: ${interactionRadius}`);
        
        return closestDistance <= interactionRadius ? closestNPC : null;
    }

    lockPlayerControls(lock) {
        const event = new CustomEvent('lockPlayerControls', { detail: lock });
        window.dispatchEvent(event);
    }

    dispose() {
        this.enabled = false;
        document.removeEventListener('keydown', this.handleKeyPress.bind(this));
        if (this.chatUI) {
            this.chatUI.dispose();
        }
        this.npcs = [];
    }
} 