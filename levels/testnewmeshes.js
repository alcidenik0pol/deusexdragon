import { CustomLevel } from '../customLevel.js';

export class TestNewMeshes extends CustomLevel {
    constructor(scene) {
        super(scene);
    }

    async createLevel() {
        // First create the base level
        const { ground, walls, cellSize } = await super.createLevel();

        try {
            // Load the GLB model
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "assets/generation/20250305chartpose/",
                "purplef02.glb",
                this.scene
            );

            // Position the loaded model
            if (result.meshes.length > 0) {
                const model = result.meshes[0];
                // Position it just slightly above ground like the main character
                model.position = new BABYLON.Vector3(0, 0.1, 0); // Lowered to just above ground
                model.scaling = new BABYLON.Vector3(5, 5, 5);   // Keep the same scale

                // Add a spotlight above the model
                const spotlight = new BABYLON.SpotLight(
                    "modelSpotlight",
                    new BABYLON.Vector3(0, 10, 0), // Lowered the light accordingly
                    new BABYLON.Vector3(0, -1, 0), // Point downward
                    Math.PI / 2, // Cone angle
                    2, // Exponent
                    this.scene
                );
                spotlight.intensity = 1.5;
                spotlight.diffuse = new BABYLON.Color3(1, 0.95, 0.85); // Warm light color

                // Add ambient light for overall scene visibility
                const ambientLight = new BABYLON.HemisphericLight(
                    "ambientLight",
                    new BABYLON.Vector3(0, 1, 0),
                    this.scene
                );
                ambientLight.intensity = 0.3; // Subtle ambient light
            }
        } catch (error) {
            console.error("Error loading model:", error);
        }

        return {
            ground,
            walls,
            cellSize
        };
    }
} 