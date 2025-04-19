import { SkyboxComponent } from '../../components/SkyboxComponent.js';

export class Singapore6Skybox extends SkyboxComponent {
    initialize() {
        // Call the parent's setupSkybox method with our custom options
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
