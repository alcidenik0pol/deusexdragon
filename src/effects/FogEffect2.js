export class FogEffect2 {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            // Limited color palette - just dark blue and orange
            baseColors: [
                '#1E3F57',  // Deep blue
                '#FFA000'   // Amber/orange
            ],
            minOpacity: 0.1,
            maxOpacity: 0.5,  // Lower max opacity to allow skybox visibility
            fogStart: 30,     // Distance where fog starts
            fogEnd: 150,      // Distance where fog reaches maximum density
            heightLimit: 50,  // Height limit for fog effect (to preserve skybox)
            ...config
        };
        this.currentColorIndex = 0;
        this.transitionTime = 0;
        this.originalFogMode = null;
        this.fogLayer = null;
    }

    start() {
        // Store original fog mode to restore on dispose
        this.originalFogMode = this.scene.fogMode;
        
        // Use linear fog mode for better control over fog boundaries
        this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
        this.scene.fogStart = this.config.fogStart;
        this.scene.fogEnd = this.config.fogEnd;
        this.scene.fogColor = BABYLON.Color3.FromHexString(this.config.baseColors[0]);
        
        // Create a post-process to limit fog by height
        this.createFogLayer();
    }

    createFogLayer() {
        // Create a custom shader to apply fog with height limit
        BABYLON.Effect.ShadersStore["fogLayerVertexShader"] = `
            precision highp float;
            attribute vec3 position;
            attribute vec2 uv;
            uniform mat4 worldViewProjection;
            varying vec2 vUV;
            void main() {
                gl_Position = worldViewProjection * vec4(position, 1.0);
                vUV = uv;
            }
        `;

        BABYLON.Effect.ShadersStore["fogLayerFragmentShader"] = `
            precision highp float;
            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform vec3 fogColor;
            uniform float fogDensity;
            uniform float heightLimit;
            uniform mat4 viewMatrix;
            
            void main() {
                vec4 baseColor = texture2D(textureSampler, vUV);
                
                // Get view space position (approximate)
                float depth = texture2D(textureSampler, vUV).a;
                vec3 viewPos = vec3(0.0, 0.0, depth);
                
                // Apply fog only below height limit
                float fogFactor = 1.0;
                if (viewPos.y < heightLimit) {
                    fogFactor = fogDensity;
                } else {
                    // Gradual transition at height boundary
                    float transition = clamp((viewPos.y - heightLimit) / 10.0, 0.0, 1.0);
                    fogFactor = mix(fogDensity, 0.0, transition);
                }
                
                gl_FragColor = mix(baseColor, vec4(fogColor, 1.0), fogFactor);
            }
        `;

        // Create the post-process
        this.fogLayer = new BABYLON.PostProcess(
            "fogLayer",
            "fogLayer",
            ["fogColor", "fogDensity", "heightLimit", "viewMatrix"],
            null,
            1.0,
            this.scene.activeCamera
        );

        // Update shader uniforms
        this.fogLayer.onApply = (effect) => {
            effect.setColor3("fogColor", this.scene.fogColor);
            effect.setFloat("fogDensity", this.config.minOpacity);
            effect.setFloat("heightLimit", this.config.heightLimit);
            effect.setMatrix("viewMatrix", this.scene.getViewMatrix());
        };
    }

    update() {
        // Slowly transition between colors
        this.transitionTime += 0.0005; // Slower transition
        if (this.transitionTime >= 1) {
            this.transitionTime = 0;
            this.currentColorIndex = (this.currentColorIndex + 1) % this.config.baseColors.length;
        }

        const currentColor = BABYLON.Color3.FromHexString(this.config.baseColors[this.currentColorIndex]);
        const nextColor = BABYLON.Color3.FromHexString(
            this.config.baseColors[(this.currentColorIndex + 1) % this.config.baseColors.length]
        );

        // Lerp between colors
        const lerpedColor = BABYLON.Color3.Lerp(currentColor, nextColor, this.transitionTime);
        this.scene.fogColor = lerpedColor;
        
        // Pulse the fog opacity slightly for atmospheric effect
        const time = performance.now() * 0.0005;
        const opacityPulse = this.config.minOpacity + 
            (Math.sin(time) * 0.5 + 0.5) * 
            (this.config.maxOpacity - this.config.minOpacity);
            
        if (this.fogLayer) {
            this.fogLayer.onApply = (effect) => {
                effect.setColor3("fogColor", this.scene.fogColor);
                effect.setFloat("fogDensity", opacityPulse);
                effect.setFloat("heightLimit", this.config.heightLimit);
                effect.setMatrix("viewMatrix", this.scene.getViewMatrix());
            };
        }
    }

    dispose() {
        if (this.fogLayer) {
            this.fogLayer.dispose();
            this.fogLayer = null;
        }
        
        // Restore original fog mode
        if (this.originalFogMode !== null) {
            this.scene.fogMode = this.originalFogMode;
        } else {
            this.scene.fogMode = BABYLON.Scene.FOGMODE_NONE;
        }
    }
} 