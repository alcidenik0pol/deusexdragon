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
        this.volumetricLights = [];
        this.spotLights = [];
    }

    start() {
        const beamConfig = this.config.beamTypes.nightclub;
        const positions = this.config.positions || [];

        positions.forEach(position => {
            // Create the actual spotlight FROM THE CEILING
            const spotlight = new BABYLON.SpotLight(
                "spotlight",
                position,  // This is now at ceiling height from the config
                new BABYLON.Vector3(0, -1, 0),  // Pointing straight down
                Math.PI / 3,  // Wider angle for better spread
                4,  // Higher exponent for softer edges
                this.scene
            );
            spotlight.intensity = beamConfig.intensity;
            spotlight.diffuse = BABYLON.Color3.FromHexString(beamConfig.color);

            // Create a ground light effect for the spot where light hits the floor
            const groundLight = BABYLON.MeshBuilder.CreateDisc("groundLight", {
                radius: 3,
                tessellation: 64  // Higher tessellation for smoother circle
            }, this.scene);
            
            // Position the ground light effect directly below the spotlight
            groundLight.position = new BABYLON.Vector3(
                position.x,
                0.01,  // Slightly above floor to prevent z-fighting
                position.z
            );
            groundLight.rotation = new BABYLON.Vector3(Math.PI/2, 0, 0);  // Lay flat

            // Create gradient material for ground light
            const groundMaterial = new BABYLON.StandardMaterial("groundLightMat", this.scene);
            groundMaterial.emissiveColor = BABYLON.Color3.FromHexString(beamConfig.color);
            groundMaterial.alpha = 0.6;  // Base transparency
            groundMaterial.disableLighting = true;

            // Add gradient texture for soft edges and internal glow
            const gradientTexture = new BABYLON.DynamicTexture("gradientTex", 256, this.scene, false);
            const ctx = gradientTexture.getContext();
            const grd = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            grd.addColorStop(0, 'rgba(255, 255, 255, 0.8)');  // Center is brighter
            grd.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)'); // Mid fade
            grd.addColorStop(1, 'rgba(255, 255, 255, 0)');  // Edges are transparent
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, 256, 256);
            gradientTexture.update();

            groundMaterial.opacityTexture = gradientTexture;
            groundMaterial.emissiveTexture = gradientTexture;
            groundLight.material = groundMaterial;
            
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
        this.spotLights.forEach(spot => {
            spot.light.dispose();
            spot.groundEffect.dispose();
        });
    }
} 