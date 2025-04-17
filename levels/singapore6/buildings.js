import { BaseComponent } from '../../components/BaseComponent.js';

export class UOBBuilding extends BaseComponent {
    constructor() {
        super('sg_uob');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Use the new loadAsset method
        await this.loadAsset('buildings', 'sg_uob');

        // Create collision box using standardDimensions
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("uob_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale the collision box
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }
}

export class MBSBuilding extends BaseComponent {
    constructor() {
        super('sg_mbs_high');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);

        // Load the MBS high-rise model
        await this.loadAsset('buildings', 'sg_mbs_low02');
        // await this.loadAsset('buildings', 'sg_mbs_high');

        // Create collision box
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox("mbs_collision", {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        // Scale using dimensions from the JSON
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = false;  // Disable collisions
        this.collisionMesh.isWalkthrough = true;    // Add special flag for MBS
        this.collisionMesh.position = this.mesh.position;
        this.collisionMesh.rotationQuaternion = this.mesh.rotationQuaternion;
    }
}

export class CapitasBuilding extends BaseComponent {
    constructor() {
        super('sg_capitas_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_capitas_high01');
        this.createCollisionBox(scene);
    }
}

export class FultonBuilding extends BaseComponent {
    constructor() {
        super('sg_ful_high02');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_ful_high02');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class ParkviewBuilding extends BaseComponent {
    constructor() {
        super('sg_parkview_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_parkview_high01');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class OUCBuilding extends BaseComponent {
    constructor() {
        super('sg_ouc_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_ouc_high01');
        this.createCollisionBox(scene);
    }
}

export class RepublicBuilding extends BaseComponent {
    constructor() {
        super('sg_rep_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_rep_high01');
        this.createCollisionBox(scene);
        
        // Add the Tai Yong billboard to the east face
        await this.addTaiYongBillboard(scene);
    }
    
    async addTaiYongBillboard(scene) {
        // Create a plane for the billboard
        const billboardWidth = 6;  // Width of the billboard
        const billboardHeight = 8; // Height of the billboard
        const billboard = BABYLON.MeshBuilder.CreatePlane("taiYongBillboard", {
            width: billboardWidth,
            height: billboardHeight
        }, scene);
        
        // Load the texture
        const billboardMaterial = new BABYLON.StandardMaterial("taiYongMaterial", scene);
        billboardMaterial.diffuseTexture = new BABYLON.Texture("assets/taiyong.png", scene);
        
        // Optimize texture for performance
        billboardMaterial.diffuseTexture.hasAlpha = true;
        billboardMaterial.backFaceCulling = false;
        billboardMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular highlights
        
        // Add emissive component to make it glow
        billboardMaterial.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Subtle self-illumination
        
        // Apply the material to the billboard
        billboard.material = billboardMaterial;
        
        // Based on the information:
        // - Building is at (-70, 0, 10)
        // - NPC is at (-65, 0.1, 10)
        // - East is positive X direction
        
        // Create the billboard as a direct world-space object (not parented)
        billboard.position = new BABYLON.Vector3(
            -66,                    // X: 4 meters east of building center (-70 + 4)
            4 + billboardHeight/2,  // Y: 4 meters above ground + half height
            10                      // Z: Same as building
        );
        
        // Rotate to face east (90 degrees around Y axis)
        // Since we're placing it on the east face, it should face west (negative X)
        billboard.rotation.y = -Math.PI / 2;
        
        // Log the position for debugging
        console.log("Tai Yong billboard added at absolute position:", billboard.position);
        
        // Store reference to the billboard
        this.billboard = billboard;
        
        // Add glow effect to the billboard
        this.addBillboardGlowEffect(scene, billboard);
    }

    addBillboardGlowEffect(scene, billboard) {
        // Create a glow layer if it doesn't exist in the scene
        if (!scene.glowLayer) {
            scene.glowLayer = new BABYLON.GlowLayer("glow", scene);
            scene.glowLayer.intensity = 0.7; // Adjust intensity to control glow strength
        }
        
        // Add the billboard to the glow layer
        scene.glowLayer.addIncludedOnlyMesh(billboard);
        
        // Create a backlight effect (a plane slightly behind the billboard)
        const backlightWidth = billboard.scaling.x * 1.1;  // Slightly larger than billboard
        const backlightHeight = billboard.scaling.y * 1.1;
        
        const backlight = BABYLON.MeshBuilder.CreatePlane("taiYongBacklight", {
            width: backlightWidth,
            height: backlightHeight
        }, scene);
        
        // Create a material for the backlight - much more subtle now
        const backlightMaterial = new BABYLON.StandardMaterial("backlightMaterial", scene);
        backlightMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.02, 0.02); // Very subtle reddish glow
        backlightMaterial.alpha = 0.3; // More transparent
        backlightMaterial.disableLighting = true;
        
        // Apply the material to the backlight
        backlight.material = backlightMaterial;
        
        // Position the backlight slightly behind the billboard
        backlight.position = new BABYLON.Vector3(
            billboard.position.x - 0.1, // Slightly behind the billboard
            billboard.position.y,
            billboard.position.z
        );
        
        // Match the billboard's rotation
        backlight.rotation = billboard.rotation.clone();
        
        // Store reference for disposal
        this.billboardBacklight = backlight;
        
        // Create small point lights only at the corners where there's white text
        // Reducing the number and intensity of corner lights
        this.createCornerLights(scene, billboard);
    }

    createCornerLights(scene, billboard) {
        // Only create lights at the top corners where the logo is
        const halfWidth = billboard.scaling.x / 2;
        const halfHeight = billboard.scaling.y / 2;
        
        // Reduced number of corner positions - only at top where logo appears
        const corners = [
            { x: -halfWidth * 0.7, y: halfHeight * 0.7 },   // Near top left
            { x: halfWidth * 0.7, y: halfHeight * 0.7 },    // Near top right
        ];
        
        this.cornerLights = [];
        
        corners.forEach((corner, index) => {
            // Create a smaller sphere for each corner
            const light = BABYLON.MeshBuilder.CreateSphere(`cornerLight_${index}`, {
                diameter: 0.15 // Smaller diameter
            }, scene);
            
            // Create less intense emissive material
            const lightMaterial = new BABYLON.StandardMaterial(`cornerLightMat_${index}`, scene);
            lightMaterial.emissiveColor = new BABYLON.Color3(0.5, 0.1, 0.1); // Less intense reddish glow
            lightMaterial.disableLighting = true;
            
            // Apply the material
            light.material = lightMaterial;
            
            // Position the corner light
            const xOffset = corner.x * Math.cos(billboard.rotation.y) - 0.1;
            const zOffset = corner.x * Math.sin(billboard.rotation.y);
            
            light.position = new BABYLON.Vector3(
                billboard.position.x + xOffset,
                billboard.position.y + corner.y,
                billboard.position.z + zOffset
            );
            
            // Add to the glow layer with reduced intensity
            if (scene.glowLayer) {
                scene.glowLayer.addIncludedOnlyMesh(light);
            }
            
            // Store reference for disposal
            this.cornerLights.push(light);
        });
    }
}

export class ShopsBuilding extends BaseComponent {
    constructor() {
        super('sg_shops_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_shops_high01');
        this.createCollisionBox(scene);
        
        // Rotate 90 degrees around Y axis
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.PI / 2);
        this.mesh.rotationQuaternion = rotation;
        this.collisionMesh.rotationQuaternion = rotation;
    }
}

export class UOBHighBuilding extends BaseComponent {
    constructor() {
        super('sg_uob_high01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'sg_uob_high01');
        this.createCollisionBox(scene);
    }
}

export class MerlionBuilding extends BaseComponent {
    constructor() {
        super('merlion01');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'merlion01');
        
        // Read the facing direction from the metadata
        const facing = this.metadata?.facing || 'unknown';
        
        // Calculate rotation based on facing direction
        // If facing is "north" and we want it to face "east", we need to rotate 90 degrees clockwise
        let rotationAngle = 0;
        
        if (facing === 'north') {
            // Rotate 90 degrees to face east (from north)
            rotationAngle = Math.PI / 2;
        } else if (facing === 'east') {
            // Already facing east, no rotation needed
            rotationAngle = 0;
        } else if (facing === 'south') {
            // Rotate 270 degrees to face east (from south)
            rotationAngle = 3 * Math.PI / 2;
        } else if (facing === 'west') {
            // Rotate 180 degrees to face east (from west)
            rotationAngle = Math.PI;
        }
        
        // Apply rotation
        const rotation = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, rotationAngle);
        this.mesh.rotationQuaternion = rotation;
        
        // Create collision box with the same rotation
        this.createCollisionBox(scene);
        if (this.collisionMesh) {
            this.collisionMesh.rotationQuaternion = rotation;
        }
        
        console.log(`Merlion facing: ${facing}, applied rotation: ${rotationAngle} radians`);
    }
}

export class ContainerShip extends BaseComponent {
    constructor() {
        super('containership');
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        await this.loadAsset('buildings', 'containership');
        
        // Create collision box without applying any automatic rotation
        this.createCollisionBox(scene);
        
        // Log the facing direction from metadata but don't apply rotation
        const facing = this.metadata?.facing || 'unknown';
        console.log(`ContainerShip facing direction from JSON: ${facing}`);
        console.log(`ContainerShip loaded without automatic rotation`);
    }
}

// Add this helper method to all classes through the prototype
[CapitasBuilding, FultonBuilding, ParkviewBuilding, OUCBuilding, 
 RepublicBuilding, ShopsBuilding, UOBHighBuilding, MBSBuilding, MerlionBuilding, ContainerShip].forEach(cls => {
    cls.prototype.createCollisionBox = function(scene) {
        this.collisionMesh = BABYLON.MeshBuilder.CreateBox(`${this.id}_collision`, {
            width: 1,
            height: 1,
            depth: 1
        }, scene);
        
        this.collisionMesh.scaling = new BABYLON.Vector3(
            this.dimensions.width,
            this.dimensions.height,
            this.dimensions.depth
        );
        
        this.collisionMesh.visibility = 0;
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.position = this.position;
        this.collisionMesh.rotationQuaternion = this.rotation;
    }
}); 