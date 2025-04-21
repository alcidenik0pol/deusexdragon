import { NPCBase } from './NPCBase.js';
import npcData from '../data/tong.js';

export class Tong extends NPCBase {
    constructor(scene) {
        super(npcData, scene);
        this.name = npcData.name;
        this.id = npcData.id;
        this.interactionRadius = npcData.interactionRadius || 5;
        this.persona = npcData.persona;
        this.initialMemories = npcData.initialMemories;
        this.questDetails = npcData.questDetails;
        this.currentAnimation = 'idle';
    }

    updateMovement() {
        super.updateMovement();
        
        // Check if we need to change animation based on movement state
        const desiredAnimation = this.currentState === NPCBase.States.WALKING ? 'walking' : 'idle';
        
        if (this.currentAnimation !== desiredAnimation) {
            // console.log(`Changing animation from ${this.currentAnimation} to ${desiredAnimation}`);
            this.setAnimation(desiredAnimation);
            this.currentAnimation = desiredAnimation;
        }
    }
} 