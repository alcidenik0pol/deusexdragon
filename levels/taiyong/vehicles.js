import { BaseComponent } from '../../components/BaseComponent.js';

export class TaiyongCar extends BaseComponent {
    constructor() {
        super('car03');
        this.lights = [];
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('furniture', 'car03');
        
        // Enable transparency on the car's material
        if (this.mesh.material) {
            this.mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            this.mesh.material.backFaceCulling = false;
        }

        // Handle rotation properly using Quaternion
        if (options.rotation) {
            this.rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, options.rotation);
            this.mesh.rotationQuaternion = this.rotation;
        }

        // Override BaseComponent's floor positioning for ground-level cars
        this.position.y = options.height || 0.5; // Default to just above ground level
        this.mesh.position = this.position;
        
        // Add vehicle lights
        await this.createVehicleLights(scene);
        
        return this;
    }

    async createVehicleLights(scene) {
        // Create intense core glow materials
        const redCoreMaterial = new BABYLON.StandardMaterial("redCoreMat", scene);
        redCoreMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        redCoreMaterial.disableLighting = true;
        redCoreMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        redCoreMaterial.backFaceCulling = false;
        redCoreMaterial.alpha = 0.9;

        const whiteCoreMaterial = new BABYLON.StandardMaterial("whiteCoreMat", scene);
        whiteCoreMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        whiteCoreMaterial.disableLighting = true;
        whiteCoreMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        whiteCoreMaterial.backFaceCulling = false;
        whiteCoreMaterial.alpha = 0.9;

        // Create outer glow materials with more diffuse colors
        const redGlowMaterial = new BABYLON.StandardMaterial("redGlowMat", scene);
        redGlowMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.2, 0.1);
        redGlowMaterial.disableLighting = true;
        redGlowMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        redGlowMaterial.backFaceCulling = false;
        redGlowMaterial.alpha = 0.4;

        const whiteGlowMaterial = new BABYLON.StandardMaterial("whiteGlowMat", scene);
        whiteGlowMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 1.0);
        whiteGlowMaterial.disableLighting = true;
        whiteGlowMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        whiteGlowMaterial.backFaceCulling = false;
        whiteGlowMaterial.alpha = 0.4;

        // Create much smaller, properly sized planes for the glow effect
        const glowWidth = 0.4;    
        const glowHeight = 0.06;  

        // Create core lights (smaller)
        const backCore = BABYLON.MeshBuilder.CreatePlane("backCore", {
            width: glowWidth * 0.5,
            height: glowHeight * 0.5
        }, scene);
        const frontCore = BABYLON.MeshBuilder.CreatePlane("frontCore", {
            width: glowWidth * 0.5,
            height: glowHeight * 0.5
        }, scene);

        // Create outer glow (larger)
        const backGlow = BABYLON.MeshBuilder.CreatePlane("backGlow", {
            width: glowWidth,
            height: glowHeight
        }, scene);
        const frontGlow = BABYLON.MeshBuilder.CreatePlane("frontGlow", {
            width: glowWidth,
            height: glowHeight
        }, scene);

        // Apply materials
        backCore.material = redCoreMaterial;
        frontCore.material = whiteCoreMaterial;
        backGlow.material = redGlowMaterial;
        frontGlow.material = whiteGlowMaterial;

        // Position values
        const lightHeight = 0.03;
        const frontOffset = 0.6;     // White lights at front
        const backOffset = -0.6;     // Red lights at back

        // Position lights and set their rotation
        [backCore, backGlow].forEach(light => {
            light.position = new BABYLON.Vector3(0, lightHeight, backOffset);
            light.rotation = new BABYLON.Vector3(0, Math.PI, 0); // Face backward
        });

        [frontCore, frontGlow].forEach(light => {
            light.position = new BABYLON.Vector3(0, lightHeight, frontOffset);
            light.rotation = new BABYLON.Vector3(0, 0, 0); // Face forward
        });

        // Remove billboard mode completely - we want fixed orientation
        [backCore, frontCore, backGlow, frontGlow].forEach(plane => {
            plane.billboardMode = 0; // No billboard mode
        });

        // Parent all lights to the car mesh
        this.lights = [backCore, frontCore, backGlow, frontGlow];
        this.lights.forEach(light => {
            light.parent = this.mesh;
        });

        // Add glow layer with heavy blur
        if (!scene.glowLayer) {
            const glowLayer = new BABYLON.GlowLayer("carGlow", scene, {
                mainTextureFixedSize: 1024,
                blurKernelSize: 128,
                mainTextureSamples: 4
            });
            glowLayer.intensity = 0.8;
            
            glowLayer.horizontalBlur = true;
            glowLayer.blurDirectionX = 1.0;
            glowLayer.blurDirectionY = 0.2;
        }
    }

    // ... rest of the Car03 class methods remain the same ...
}

export class TaiyongVehicleSystem {
    constructor(scene) {
        this.scene = scene;
        this.vehicles = [];
        this.paths = this.createVehiclePaths();
    }

    createVehiclePaths() {
        // Much further from level bounds (600m out)
        const offset = 600; // Doubled to 600 meters from center
        const innerOffset = 500; // Secondary path at 500 meters
        
        return {
            // Straight paths in four directions
            eastToWest: [
                { x: offset, z: -200 },
                { x: -offset, z: -200 }
            ],
            westToEast: [
                { x: -offset, z: 200 },
                { x: offset, z: 200 }
            ],
            northToSouth: [
                { x: -200, z: offset },
                { x: -200, z: -offset }
            ],
            southToNorth: [
                { x: 200, z: -offset },
                { x: 200, z: offset }
            ],
            // Inner paths (still far from building)
            innerEastToWest: [
                { x: innerOffset, z: -150 },
                { x: -innerOffset, z: -150 }
            ],
            innerWestToEast: [
                { x: -innerOffset, z: 150 },
                { x: innerOffset, z: 150 }
            ]
        };
    }

    async initialize() {
        // Define vehicle configurations with different depths
        const vehicleConfigs = [
            // East-West Routes
            { path: 'eastToWest', height: -100, speed: 0.8 },
            { path: 'eastToWest', height: -80, speed: 0.75 },
            { path: 'westToEast', height: -120, speed: 0.85 },
            { path: 'westToEast', height: -90, speed: 0.9 },
            
            // North-South Routes (adding more)
            { path: 'northToSouth', height: -70, speed: 0.7 },
            { path: 'northToSouth', height: -85, speed: 0.65 },
            { path: 'southToNorth', height: -75, speed: 0.7 },
            { path: 'southToNorth', height: -65, speed: 0.8 },
            { path: 'northToSouth', height: -95, speed: 0.75 },
            { path: 'southToNorth', height: -110, speed: 0.85 },
            
            // Inner Routes
            { path: 'innerEastToWest', height: -70, speed: 0.7 },
            { path: 'innerWestToEast', height: -85, speed: 0.65 },
            { path: 'eastToWest', height: -75, speed: 0.7 },
            { path: 'westToEast', height: -65, speed: 0.8 },
            
            // Deep Vehicles
            { path: 'northToSouth', height: -150, speed: 0.6 },
            { path: 'southToNorth', height: -130, speed: 0.65 },
            { path: 'eastToWest', height: -140, speed: 0.7 }
        ];

        // Create vehicles based on configurations
        for (const config of vehicleConfigs) {
            const car = new TaiyongCar();
            await car.initialize(this.scene, { height: config.height });

            const pathPoints = this.paths[config.path];
            car.setWorldPosition(pathPoints[0].x, pathPoints[0].z);

            // Calculate initial rotation based on path direction
            const direction = new BABYLON.Vector3(
                pathPoints[1].x - pathPoints[0].x,
                0,
                pathPoints[1].z - pathPoints[0].z
            );
            const angle = Math.atan2(direction.x, direction.z);
            car.rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, angle);
            car.mesh.rotationQuaternion = car.rotation;

            this.vehicles.push({
                car,
                pathPoints,
                currentPoint: 0,
                speed: config.speed,
                height: config.height
            });
        }

        // Start animation loop
        this.scene.registerBeforeRender(() => this.updateVehicles());
    }

    updateVehicles() {
        for (const vehicle of this.vehicles) {
            const currentPos = vehicle.car.mesh.position;
            const targetPoint = vehicle.pathPoints[1];
            
            // Calculate direction to target
            const direction = new BABYLON.Vector3(
                targetPoint.x - currentPos.x,
                0,
                targetPoint.z - currentPos.z
            );
            
            // Calculate distance to end point
            const distanceToEnd = direction.length();
            
            // Start fading out when within 60 meters of the end point
            const fadeStartDistance = 60;
            if (distanceToEnd < fadeStartDistance) {
                // Use a smoother fade curve with Math.pow
                const fadeAlpha = Math.pow(distanceToEnd / fadeStartDistance, 0.5);
                
                // Apply fade to car
                if (vehicle.car.mesh.material) {
                    vehicle.car.mesh.material.alpha = fadeAlpha;
                }
                
                // Apply fade to lights
                vehicle.car.lights.forEach(light => {
                    if (light.material) {
                        const originalAlpha = light.material.name.includes("CoreMat") ? 0.9 : 0.4;
                        light.material.alpha = originalAlpha * fadeAlpha;
                    }
                });
            } else {
                // Reset alpha when not fading
                if (vehicle.car.mesh.material) {
                    vehicle.car.mesh.material.alpha = 1;
                }
                vehicle.car.lights.forEach(light => {
                    if (light.material && light.material.name.includes("CoreMat")) {
                        light.material.alpha = 0.9;
                    } else if (light.material && light.material.name.includes("GlowMat")) {
                        light.material.alpha = 0.4;
                    }
                });
            }

            // If we've reached the end, reset to start
            if (distanceToEnd < 0.5) {
                const startPoint = vehicle.pathPoints[0];
                vehicle.car.setWorldPosition(startPoint.x, startPoint.z);
                continue;
            }

            // Move in straight line
            direction.normalize();
            direction.scaleInPlace(vehicle.speed);

            // Update position while maintaining height
            const newPos = currentPos.add(direction);
            vehicle.car.mesh.position = new BABYLON.Vector3(
                newPos.x,
                vehicle.height,
                newPos.z
            );
        }
    }

    dispose() {
        for (const vehicle of this.vehicles) {
            vehicle.car.dispose();
        }
        this.vehicles = [];
    }
} 