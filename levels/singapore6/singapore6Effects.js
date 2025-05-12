import { EffectManager } from '../../fx/EffectManager.js';
import { FogEffect } from '../../fx/FogEffect.js';
import { VolumetricLightEffect } from '../../fx/VolumetricLightEffect.js';
import { RainEffect4 } from '../../fx/RainEffect4.js';
import { FogEffect2 } from '../../fx/FogEffect2.js';

export class Singapore6Effects {
    constructor(scene, clusterManager) {
        this.scene = scene;
        this.clusterManager = clusterManager;
        this.effectManager = new EffectManager(scene);
        this.initialized = false;
        
        // Add direct update to scene render loop for consistent animation
        this.scene.onBeforeRenderObservable.add(() => {
            if (this.initialized) {
                this.effectManager.update();
            }
        });
    }

    async initialize() {
        if (this.initialized) return;
        
        // Add cyberpunk-inspired fog effect with limited colors and height boundaries
        this.effectManager.addEffect('fog2', {
            baseColors: [
                '#1E3F57',  // Deep blue (primary for night scene)
                '#FFA000'   // Amber/orange accent
            ],
            minOpacity: 0.1,
            maxOpacity: 0.4,
            fogStart: 30,
            fogEnd: 150,
            heightLimit: 50  // Keep fog below this height to preserve skybox visibility
        });
        
        // Add volumetric light effect with custom settings for night scene
        this.effectManager.addEffect('volumetricLight', {
            beamTypes: {
                security: { color: '#FF3030', intensity: 0.5, width: 0.2 },
                corporate: { color: '#4169E1', intensity: 0.4, width: 0.5 },
                underground: { color: '#CDB105', intensity: 0.3, width: 0.8 }
            },
            position: new BABYLON.Vector3(0, -1000, 0) // Position far below ground
        });
        
        // Add the ParticleHelper-based rain effect
        await this.effectManager.addEffect('rain4', {
            updateSpeed: 0.1,
            emitterOffset: new BABYLON.Vector3(0, 10, 0)
        });
        
        this.initialized = true;
        console.log("Singapore6Effects initialized with improved fog effect");
    }
    
    // Keep this method for compatibility
    update() {
        // This is now redundant but kept for compatibility
    }
    
    dispose() {
        // Remove the scene observable first
        if (this.scene && this.scene.onBeforeRenderObservable) {
            // Find and remove our specific observer
            const observers = this.scene.onBeforeRenderObservable.observers;
            for (let i = 0; i < observers.length; i++) {
                if (observers[i].callback && observers[i].callback.toString().includes('this.effectManager.update')) {
                    this.scene.onBeforeRenderObservable.remove(observers[i]);
                    break;
                }
            }
        }
        
        if (this.effectManager) {
            // Remove all effects
            this.effectManager.removeEffect('fog2');
            this.effectManager.removeEffect('volumetricLight');
            this.effectManager.removeEffect('rain4');
        }
    }
    
    // Toggle methods
    async toggleRain(enabled) {
        if (enabled && !this.effectManager.activeEffects.has('rain4')) {
            await this.effectManager.addEffect('rain4', {
                updateSpeed: 0.1,
                emitterOffset: new BABYLON.Vector3(0, 10, 0)
            });
        } else if (!enabled && this.effectManager.activeEffects.has('rain4')) {
            this.effectManager.removeEffect('rain4');
        }
    }
    
    toggleFog(enabled) {
        if (enabled && !this.effectManager.activeEffects.has('fog2')) {
            this.effectManager.addEffect('fog2', {
                baseColors: [
                    '#1E3F57',  // Deep blue (primary for night scene)
                    '#FFA000'   // Amber/orange accent
                ],
                minOpacity: 0.1,
                maxOpacity: 0.4,
                fogStart: 30,
                fogEnd: 150,
                heightLimit: 50
            });
        } else if (!enabled && this.effectManager.activeEffects.has('fog2')) {
            this.effectManager.removeEffect('fog2');
        }
    }
    
    toggleVolumetricLight(enabled) {
        if (enabled && !this.effectManager.activeEffects.has('volumetricLight')) {
            this.effectManager.addEffect('volumetricLight', {
                beamTypes: {
                    security: { color: '#FF3030', intensity: 0.5, width: 0.2 },
                    corporate: { color: '#4169E1', intensity: 0.4, width: 0.5 },
                    underground: { color: '#CDB105', intensity: 0.3, width: 0.8 }
                },
                position: new BABYLON.Vector3(0, -1000, 0)
            });
        } else if (!enabled && this.effectManager.activeEffects.has('volumetricLight')) {
            this.effectManager.removeEffect('volumetricLight');
        }
    }
} 