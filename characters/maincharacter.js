export const loadCharacters = async (scene) => {
    try {
        console.log("Starting to load character models...");
        
        // Load all character animations
        const modelPromises = [
            BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pdenton_idle.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pdenton_walk.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pdenton_walkb.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pdenton_sleft.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pdenton_sright.glb", scene)
        ];

        const results = await Promise.all(modelPromises.map(p => p.catch(error => {
            console.error("Error loading model:", error);
            return null;
        })));

        // Check if any models failed to load
        if (results.some(result => result === null)) {
            throw new Error("Failed to load one or more character models");
        }

        const [
            idleCharacterResult,
            forwardCharacterResult,
            backwardCharacterResult,
            leftCharacterResult,
            rightCharacterResult
        ] = results;

        console.log("All models loaded, extracting root meshes...");
        
        // Get the root mesh for each animation
        const idleCharacter = idleCharacterResult.meshes[0];
        const forwardCharacter = forwardCharacterResult.meshes[0];
        const backwardCharacter = backwardCharacterResult.meshes[0];
        const leftCharacter = leftCharacterResult.meshes[0];
        const rightCharacter = rightCharacterResult.meshes[0];

        // Verify all meshes exist
        if (!idleCharacter || !forwardCharacter || !backwardCharacter || 
            !leftCharacter || !rightCharacter) {
            throw new Error("One or more character meshes are missing");
        }

        console.log("Applying material properties...");

        // Apply material properties to all character meshes
        [
            idleCharacterResult,
            forwardCharacterResult,
            backwardCharacterResult,
            leftCharacterResult,
            rightCharacterResult
        ].forEach(result => {
            result.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissiveColor = BABYLON.Color3.Black();
                    mesh.material.ambientColor = BABYLON.Color3.Black();
                    
                    // Enable material to work with shadows
                    mesh.material.needDepthPrePass = true;
                    
                    // If we're in Singapore4Level, make materials more shadow-friendly
                    if (scene.name === "Singapore4Level") {
                        mesh.material.specularColor = BABYLON.Color3.Black();
                        mesh.material.ambientColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                    }
                }
            });
        });

        console.log("Setting up common properties...");

        // Set up common properties for all character states
        [
            idleCharacter,
            forwardCharacter,
            backwardCharacter,
            leftCharacter,
            rightCharacter
        ].forEach(char => {
            char.scaling = new BABYLON.Vector3(1, 1, 1);
            char.position = new BABYLON.Vector3(0, 0.1, 0);
            char.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                BABYLON.Vector3.Up(), 
                -Math.PI/2
            );
        });

        console.log("Setting initial visibility states...");

        // Start with idle animation visible, others hidden
        idleCharacter.setEnabled(true);
        forwardCharacter.setEnabled(false);
        backwardCharacter.setEnabled(false);
        leftCharacter.setEnabled(false);
        rightCharacter.setEnabled(false);

        console.log("Character loading complete!");

        return {
            idleCharacter,
            forwardCharacter,
            backwardCharacter,
            leftCharacter,
            rightCharacter
        };
    } catch (error) {
        console.error("Error in loadCharacters:", error);
        throw error;
    }
};
