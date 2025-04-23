import { BaseComponent } from '../../components/BaseComponent.js';
import { WORLD_CONFIG } from '../../config/config.js';

export class TaiyongBillboard extends BaseComponent {
    constructor() {
        super('taiyong-billboard');
        this.width = 4 * WORLD_CONFIG.GRID_CELL_SIZE;    
        this.height = 4 * WORLD_CONFIG.GRID_CELL_SIZE;   
    }

    async initialize(scene, options = {}) {
        super.initialize(scene, options);
        
        this.mesh = BABYLON.MeshBuilder.CreatePlane(this.id, {
            width: this.width,
            height: this.height
        }, scene);
        
        const billboardMaterial = new BABYLON.StandardMaterial(`${this.id}-material`, scene);
        billboardMaterial.diffuseTexture = new BABYLON.Texture("assets\\static\\taiyong.png", scene);
        billboardMaterial.diffuseTexture.hasAlpha = true;
        billboardMaterial.backFaceCulling = false;
        billboardMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        
        this.mesh.material = billboardMaterial;
    }
}
