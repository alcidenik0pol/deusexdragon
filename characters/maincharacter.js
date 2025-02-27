export const loadCharacters = async (scene) => {
    // Character setup (simplified) - load both models at start
    const idleCharacterResult = await BABYLON.SceneLoader.ImportMeshAsync("", 
        "./assets/", "pdenton_idle.glb", scene);
    const runningCharacterResult = await BABYLON.SceneLoader.ImportMeshAsync("", 
        "./assets/", "pdenton_walk.glb", scene);
    
    const idleCharacter = idleCharacterResult.meshes[0];
    const runningCharacter = runningCharacterResult.meshes[0];

    // Modify material properties for all meshes in the model
    idleCharacterResult.meshes.forEach(mesh => {
        if (mesh.material) {
            mesh.material.emissiveColor = BABYLON.Color3.Black(); // Remove any self-illumination
            mesh.material.ambientColor = BABYLON.Color3.Black();  // Make it fully affected by scene lighting
        }
    });

    // Set up both models with same properties
    [idleCharacter, runningCharacter].forEach(char => {
        char.scaling = new BABYLON.Vector3(1, 1, 1);
        char.position = new BABYLON.Vector3(0, 0.1, 0);
        // Create quaternion for 270 degree rotation around Y axis
        char.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
            BABYLON.Vector3.Up(), 
            -Math.PI/2
        );
    });

    // Start with idle animation visible, running hidden
    runningCharacter.setEnabled(false);
    idleCharacter.setEnabled(true);

    return { idleCharacter, runningCharacter };  // Return characters for use in createScene
};
