import { FogEffect } from './FogEffect.js';
import { FogEffect2 } from './FogEffect2.js';
import { VolumetricLightEffect } from './VolumetricLightEffect.js';
import { RainEffect } from './RainEffect.js';
import { RainEffect2 } from './RainEffect2.js';
import { RainEffect3 } from './RainEffect3.js';
import { RainEffect4 } from './RainEffect4.js';

export class EffectManager {
    constructor(scene) {
        this.scene = scene;
        this.activeEffects = new Map();
    }

    async addEffect(effectName, effectConfig) {
        let effect;
        switch (effectName) {
            case 'fog':
                effect = new FogEffect(this.scene, effectConfig);
                break;
            case 'fog2':
                effect = new FogEffect2(this.scene, effectConfig);
                break;
            case 'volumetricLight':
                effect = new VolumetricLightEffect(this.scene, effectConfig);
                break;
            case 'rain':
                effect = new RainEffect(this.scene, effectConfig);
                break;
            case 'rain2':
                effect = new RainEffect2(this.scene, this.scene.activeCamera, effectConfig);
                break;
            case 'rain3':
                effect = new RainEffect3(this.scene, this.scene.activeCamera, effectConfig);
                break;
            case 'rain4':
                effect = new RainEffect4(this.scene, this.scene.activeCamera, effectConfig);
                // Need to await the start for this effect
                await effect.start();
                this.activeEffects.set(effectName, effect);
                return effect;
        }
        
        if (effect) {
            this.activeEffects.set(effectName, effect);
            effect.start();
        }
        
        return effect;
    }

    removeEffect(effectName) {
        const effect = this.activeEffects.get(effectName);
        if (effect) {
            effect.dispose();
            this.activeEffects.delete(effectName);
        }
    }

    getEffect(effectName) {
        return this.activeEffects.get(effectName);
    }

    update() {
        this.activeEffects.forEach(effect => effect.update());
    }
} 