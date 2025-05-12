export class NightclubLightEffect {
    constructor(scene, config) {
        this.scene = scene;
        this.config = {
            beamTypes: {
                nightclub: { 
                    color: '#FF1493', 
                    intensity: 0.8, 
                    width: 0.3,
                    blurKernelSize: 32
                }
            },
            ...config
        };
        this.spotLights = [];
        this.sharedMaterial = null;
    }

    start() {
        const beamConfig = this.config.beamTypes.nightclub;
        const positions = this.config.positions || [];

        // Create shared material for ground effects
        if (!this.sharedMaterial) {
            this.sharedMaterial = new BABYLON.StandardMaterial("groundLightMat", this.scene);
            this.sharedMaterial.emissiveColor = BABYLON.Color3.FromHexString(beamConfig.color);
            this.sharedMaterial.alpha = 0.6;
            this.sharedMaterial.disableLighting = true;

            // Add gradient texture for soft edges and internal glow
            const gradientTexture = new BABYLON.DynamicTexture("gradientTex", 256, this.scene, false);
            const ctx = gradientTexture.getContext();
            const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            grd.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
            grd.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 256, 256);
            gradientTexture.update();

            this.sharedMaterial.opacityTexture = gradientTexture;
            this.sharedMaterial.emissiveTexture = gradientTexture;
        }

        // Create fewer spotlights for better performance
        positions.forEach((position, index) => {
            // Create the spotlight
            const spotlight = new BABYLON.SpotLight(
                "spotlight",
                position,
                new BABYLON.Vector3(0, -1, 0),
                Math.PI / 3,
                4,
                this.scene
            );
            spotlight.intensity = beamConfig.intensity;
            spotlight.diffuse = BABYLON.Color3.FromHexString(beamConfig.color);

            // Create a ground light effect
            const groundLight = BABYLON.MeshBuilder.CreateDisc("groundLight", {
                radius: 3,
                tessellation: 16  // Further reduced tessellation
            }, this.scene);
            
            groundLight.position = new BABYLON.Vector3(
                position.x,
                0.01,
                position.z
            );
            groundLight.rotation = new BABYLON.Vector3(Math.PI/2, 0, 0);
            groundLight.material = this.sharedMaterial;
            
            this.spotLights.push({
                light: spotlight,
                groundEffect: groundLight
            });
        });
    }

    update() {
        const time = performance.now() * 0.001;
        this.spotLights.forEach((spot, index) => {
            const rotationRadius = 0.2;
            const speed = 1.0;
            const phase = (index * Math.PI * 2) / this.spotLights.length;
            
            // Update spotlight direction with slight wobble
            const direction = new BABYLON.Vector3(
                Math.sin(time * speed + phase) * rotationRadius,
                -1,
                Math.cos(time * speed + phase) * rotationRadius
            );
            direction.normalize();
            spot.light.direction = direction;

            // Update ground effect position to follow the light
            const lightHeight = spot.light.position.y;
            const groundOffset = lightHeight * Math.tan(rotationRadius);
            spot.groundEffect.position.x = spot.light.position.x + direction.x * groundOffset;
            spot.groundEffect.position.z = spot.light.position.z + direction.z * groundOffset;
        });
    }

    dispose() {
        if (this.sharedMaterial) {
            this.sharedMaterial.dispose();
        }
        
        // Dispose lights and effects
        this.spotLights.forEach(spot => {
            spot.light.dispose();
            spot.groundEffect.dispose();
        });
    }
} 