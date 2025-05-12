import { SkyboxComponent } from '../../components/SkyboxComponent.js';

export class TaiyongSkybox extends SkyboxComponent {
    initialize() {
        // Use the same skybox textures as Singapore6
        this.setupSkybox({
            size: 1000,
            rootUrl: "assets/static/skybox/02/",
            fileNames: [
                "px.png", // positive X (right)
                "py.png", // positive Y (up)
                "pz.png", // positive Z (front)
                "nx.png", // negative X (left)
                "ny.png", // negative Y (down)
                "nz.png"  // negative Z (back)
            ]
        });
    }
} 