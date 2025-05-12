import { WallComponent } from '../../components/WallComponent.js';
import { WORLD_CONFIG } from '../../config/config.js';

export class CityscapeBorder extends WallComponent {
    constructor(id = 'cityscape-border') {
        super(id);
        this.segments = [];
        this.segmentCount = 0;
        this.totalLength = 0;
        this.avgHeight = 45; // ~45 meters average height
        this.heightVariation = 15; // +/- 15 meters variation
        this.segmentWidth = 8; // Width of each building segment
        this.segmentWidthVariation = 4; // +/- 4 meters variation
        this.smallBuildingProbability = 0.3; // 30% chance of small buildings
        this.smallBuildingSizeFactor = 0.3; // Small buildings are 30% of average size
    }

    async initialize(scene, options = {}) {
        this.scene = scene;
        this.options = { ...options };
        
        // We'll override the parent's initialize to create multiple building segments
        // instead of a single wall mesh
        return this;
    }

    // Create a cityscape border along a line from start to end
    createBorder(startPoint, endPoint) {
        // Calculate direction and length
        const direction = endPoint.subtract(startPoint);
        this.totalLength = direction.length();
        const normalizedDir = direction.normalize();
        
        // Calculate how many segments we need
        this.segmentCount = Math.ceil(this.totalLength / this.segmentWidth);
        
        // Create building segments
        for (let i = 0; i < this.segmentCount; i++) {
            // Randomize building width (but ensure we fill the entire border)
            let segWidth;
            if (i === this.segmentCount - 1) {
                // Last segment - use remaining length
                const usedLength = this.segments.reduce((sum, seg) => sum + seg.width, 0);
                segWidth = this.totalLength - usedLength;
            } else {
                // Random width for variety
                segWidth = this.segmentWidth + (Math.random() * 2 - 1) * this.segmentWidthVariation;
            }
            
            // Determine if this should be a small building
            const isSmallBuilding = Math.random() < this.smallBuildingProbability;
            
            // Randomize building height
            let height;
            if (isSmallBuilding) {
                // Small building (30% of average size)
                height = this.avgHeight * this.smallBuildingSizeFactor + 
                         (Math.random() * 2 - 1) * this.heightVariation * this.smallBuildingSizeFactor;
            } else {
                // Regular building
                height = this.avgHeight + (Math.random() * 2 - 1) * this.heightVariation;
            }
            
            // Calculate position
            const segmentOffset = this.segments.reduce((sum, seg) => sum + seg.width, 0);
            const position = startPoint.add(normalizedDir.scale(segmentOffset + segWidth / 2));
            
            // Create building segment
            this.createBuildingSegment(position, segWidth, height, normalizedDir, isSmallBuilding);
        }
        
        return this;
    }
    
    createBuildingSegment(position, width, height, direction, isSmallBuilding) {
        // Create a unique ID for this segment
        const segmentId = `${this.id}-segment-${this.segments.length}`;
        
        // Create the building mesh
        const building = BABYLON.MeshBuilder.CreateBox(segmentId, {
            width: width,
            height: height,
            depth: this.thickness * 20 // Make buildings thicker than walls
        }, this.scene);
        
        // Position the building
        building.position = new BABYLON.Vector3(
            position.x,
            height / 2, // Position at half height (bottom at y=0)
            position.z
        );
        
        // Rotate to face the correct direction
        const angle = Math.atan2(direction.z, direction.x) + Math.PI/2;
        building.rotation = new BABYLON.Vector3(0, angle, 0);
        
        // Create a random gray material
        const material = new BABYLON.StandardMaterial(`${segmentId}-material`, this.scene);
        
        // Different color ranges for small vs large buildings
        let grayValue;
        if (isSmallBuilding) {
            // Lighter gray for small buildings
            grayValue = 0.4 + Math.random() * 0.3; // 0.4 to 0.7
        } else {
            // Darker gray for large buildings
            grayValue = 0.2 + Math.random() * 0.3; // 0.2 to 0.5
        }
        
        material.diffuseColor = new BABYLON.Color3(grayValue, grayValue, grayValue);
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        building.material = material;
        
        // Enable collisions
        building.checkCollisions = true;
        
        // Store segment info
        this.segments.push({
            mesh: building,
            width: width,
            height: height,
            isSmall: isSmallBuilding
        });
        
        return building;
    }
    
    setWorldPosition(x, z) {
        this.position = new BABYLON.Vector3(x, 0, z);
        return this;
    }
    
    getMeshes() {
        return this.segments.map(segment => segment.mesh);
    }
    
    dispose() {
        this.segments.forEach(segment => {
            if (segment.mesh) {
                segment.mesh.dispose();
            }
        });
        this.segments = [];
    }
} 