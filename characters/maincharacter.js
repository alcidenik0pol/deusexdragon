export const loadCharacters = async (scene) => {
    try {
        console.log("Starting to load character models...");
        
        // Load character metadata first
        const characterData = await fetch('./assets/characters/pc/pc.json').then(r => r.json());
        const basePath = "./assets/characters/pc/";
        
        // Load all character animations with updated paths
        const modelPromises = [
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_idle.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_walk.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_walkb.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_sleft.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_sright.glb", scene),
            BABYLON.SceneLoader.ImportMeshAsync("", basePath, "pdenton_run.glb", scene)
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
            rightCharacterResult,
            runCharacterResult
        ] = results;

        console.log("All models loaded, applying standard dimensions...");
        
        // Get the standard dimensions from JSON
        const { width, height, depth } = characterData.standardDimensions;
        
        // Apply standard dimensions to all character states
        [idleCharacterResult, forwardCharacterResult, backwardCharacterResult, 
            leftCharacterResult, rightCharacterResult, runCharacterResult].forEach(result => {
            const rootMesh = result.meshes[0];
            
            // Debug log the current dimensions
            console.log("Raw model dimensions:", {
                height: rootMesh.getBoundingInfo().boundingBox.maximumWorld.y - 
                        rootMesh.getBoundingInfo().boundingBox.minimumWorld.y,
                desired: characterData.standardDimensions.height
            });
            
            // Use the scaleFactor from the metadata instead of calculating it
            const scaleFactor = characterData.scaleFactor;
            console.log("Using scaleFactor from metadata:", scaleFactor);
            
            // Apply uniform scaling to maintain proportions
            rootMesh.scaling = new BABYLON.Vector3(scaleFactor, scaleFactor, scaleFactor);
            
            // Ensure the mesh is visible and positioned correctly
            rootMesh.position = new BABYLON.Vector3(0, 0, 0);
            rootMesh.visibility = 1;
            rootMesh.isVisible = true;
            
            // Keep the rotation setup
            rootMesh.rotationQuaternion = BABYLON.Quaternion.Identity();

            // Apply material properties
            result.meshes.forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissiveColor = BABYLON.Color3.Black();
                    mesh.material.ambientColor = BABYLON.Color3.Black();
                    mesh.material.needDepthPrePass = false;
                    mesh.material.alpha = 1;
                    
                    if (scene.name === "Singapore4Level") {
                        mesh.material.specularColor = BABYLON.Color3.Black();
                        mesh.material.ambientColor = new BABYLON.Color3(0.02, 0.02, 0.03);
                    }
                }
            });
        });

        // Get references to the root meshes
        const idleCharacter = idleCharacterResult.meshes[0];
        const forwardCharacter = forwardCharacterResult.meshes[0];
        const backwardCharacter = backwardCharacterResult.meshes[0];
        const leftCharacter = leftCharacterResult.meshes[0];
        const rightCharacter = rightCharacterResult.meshes[0];
        const runCharacter = runCharacterResult.meshes[0];

        // Add rotation update function to the scene's render loop
        scene.registerBeforeRender(() => {
            const camera = scene.getCameraByName("UniversalCamera");
            if (camera) {
                const yaw = camera.rotation.y;
                [idleCharacter, forwardCharacter, backwardCharacter, 
                 leftCharacter, rightCharacter, runCharacter].forEach(char => {
                    char.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                        BABYLON.Vector3.Up(),
                        yaw
                    );
                });
            }
        });

        // Set initial visibility states
        idleCharacter.setEnabled(true);
        forwardCharacter.setEnabled(false);
        backwardCharacter.setEnabled(false);
        leftCharacter.setEnabled(false);
        rightCharacter.setEnabled(false);
        runCharacter.setEnabled(false);

        idleCharacter.name = "PlayerCharacter";

        console.log("Character loading complete!");

        console.log("Run character loaded:", runCharacter);
        console.log("Run character enabled:", runCharacter.isEnabled());
        console.log("Run character visible:", runCharacter.isVisible);

        return {
            idleCharacter,
            forwardCharacter,
            backwardCharacter,
            leftCharacter,
            rightCharacter,
            runCharacter
        };
    } catch (error) {
        console.error("Error in loadCharacters:", error);
        throw error;
    }
};
