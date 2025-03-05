import { LevelGenerator } from '../levelGenerator.js';
import { WallComponent } from '../components/WallComponent.js';
import { FloorComponent } from '../components/FloorComponent.js';
import { CeilingComponent } from '../components/NEWCeilingComponent.js';
import { MaterialFactory } from '../components/MaterialFactory.js';
import { loadNPC1 } from '../characters/npc1.js';

export class ModernOfficeLevel extends LevelGenerator {
    constructor(scene) {
        super(scene);
        this.components = [];
        this.roomWidth = 32;
        this.roomLength = 32;
        this.wallHeight = 4;
        this.materialFactory = new MaterialFactory(scene);
    }

    async createLevel() {
        // Create single light source
        const light = new BABYLON.HemisphericLight("mainLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        light.intensity = 0.7;

        // Create floor with basic material
        const floor = new FloorComponent('office-floor');
        floor.initialize(this.scene, {
            width: this.roomWidth,
            length: this.roomLength,
            materialType: 'basic'  // Changed to use basic material
        });
        
        floor.mesh.material = this.materialFactory.getFloorMaterial('basic');
        this.components.push(floor);

        // Create ceiling with basic material
        const ceiling = new CeilingComponent('office-ceiling');
        ceiling.initialize(this.scene, {
            width: this.roomWidth,
            length: this.roomLength,
            height: this.wallHeight,
            type: 'basic'  // Changed to use basic material
        });
        
        ceiling.mesh.material = this.materialFactory.getFloorMaterial('basic');
        this.components.push(ceiling);

        // Create walls with basic material
        const wallPositions = [
            { x: 0, z: this.roomLength/2, rotation: 0 },
            { x: this.roomWidth/2, z: 0, rotation: Math.PI/2 },
            { x: this.roomWidth, z: this.roomLength/2, rotation: 0 },
            { x: this.roomWidth/2, z: this.roomLength, rotation: Math.PI/2 }
        ];

        for (const pos of wallPositions) {
            const wall = new WallComponent(`wall-${this.components.length}`);
            wall.initialize(this.scene, {
                height: this.wallHeight,
                width: pos.x === 0 || pos.x === this.roomWidth ? this.roomLength : this.roomWidth,
                position: new BABYLON.Vector3(pos.x, this.wallHeight/2, pos.z)
            });
            
            wall.setRotation(0, pos.rotation, 0);
            wall.mesh.material = this.materialFactory.getWallMaterial('basic');
            this.components.push(wall);
        }

        // Add NPC
        const npc1 = await loadNPC1(this.scene);
        npc1.mesh.position = new BABYLON.Vector3(5, 0, 5);

        // Add interaction trigger for NPC
        const actionManager = new BABYLON.ActionManager(this.scene);
        npc1.mesh.actionManager = actionManager;
        
        actionManager.registerAction(
            new BABYLON.ExecuteCodeAction(
                BABYLON.ActionManager.OnPickTrigger,
                async () => {
                    const conversationId = await npc1.startConversation();
                }
            )
        );

        return {
            ground: floor.mesh,
            walls: this.components.slice(1).map(c => c.mesh),
            cellSize: 1,
            npc1
        };
    }
} 