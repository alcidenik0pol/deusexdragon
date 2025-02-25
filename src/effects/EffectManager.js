import { FogEffect } from './FogEffect.js';
import { VolumetricLightEffect } from './VolumetricLightEffect.js';
import { RainEffect } from './RainEffect.js';

export class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Map();
    }

    addEffect(effectName, effectConfig) {
        let effect;
        switch (effectName) {
            case 'fog':
                effect = new FogEffect(this.scene, effectConfig);
                break;
            case 'volumetricLight':
                effect = new VolumetricLightEffect(this.scene, effectConfig);
                break;
            case 'rain':
                effect = new RainEffect(this.scene, effectConfig);
                break;
        }
        
        if (effect) {
            this.activeEffects.set(effectName, effect);
            effect.start();
        }
    }

    removeEffect(effectName) {
        const effect = this.activeEffects.get(effectName);
        if (effect) {
            effect.dispose();
            this.activeEffects.delete(effectName);
        }
    }

    update() {
        this.activeEffects.forEach(effect => effect.update());
    }
} 