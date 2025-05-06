import { loadCharacters } from './characters/pc/maincharacter.js';
import { GameCamera } from './camera.js';
import { getSpawnPosition } from './characters/pc/spawnPositions.js';

import { DebugUI } from './ui/debugUI.js';
import { Controls } from './ui/controls.js';
import { DebugControls } from './ui/debugControls.js';

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const debugUI = new DebugUI();

let currentScene = null;
let currentLevelType = 'nightclub';
let currentCharacter = null;

// Initialize debug controls at the start with the switchLevel callback
const debugControls = new DebugControls(async (newLevelType) => {
    if (currentScene) {
        currentScene.dispose();
    }
    currentLevelType = newLevelType;
    currentScene = await createScene(currentLevelType);
});

// Initialize FPS display
debugControls.initializeFPSDisplay(engine);

const createScene = async (levelType = 'default') => {
    const scene = new BABYLON.Scene(engine);
    
    // Create and configure camera
    const gameCamera = new GameCamera(canvas, scene);
    
    // Use the existing instance's getLevelGenerator method
    const levelGenerator = debugControls.getLevelGenerator(levelType, scene);
    
    // Enable pointer lock on scene click
    scene.onPointerDown = () => {
        if (!scene.getEngine().isPointerLock) {
            canvas.requestPointerLock = canvas.requestPointerLock || 
                                      canvas.msRequestPointerLock || 
                                      canvas.mozRequestPointerLock || 
                                      canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
                try {
                    canvas.requestPointerLock();
                } catch (error) {
                    console.error("Pointer lock request failed:", error);
                }
            }
        }
    };

    // Add pointer move event for camera control
    scene.onPointerMove = (evt) => {
        if (scene.getEngine().isPointerLock) {
            gameCamera.camera.rotation.y += evt.movementX * 0.002;
            gameCamera.camera.rotation.x += evt.movementY * 0.002;
            
            const upperLimit = Math.PI / 3;
            const lowerLimit = -Math.PI / 3;
            gameCamera.camera.rotation.x = Math.min(upperLimit, Math.max(lowerLimit, gameCamera.camera.rotation.x));
        }
    };

    scene.name = levelType;

    const { ground, walls, cellSize } = await levelGenerator.createLevel();

    // Load characters ONCE
    const { idleCharacter, forwardCharacter, backwardCharacter, leftCharacter, rightCharacter, runCharacter, danceCharacter } = await loadCharacters(scene);
    
    // Get the spawn position for this level
    const spawnPosition = getSpawnPosition(levelType);
    
    // Set the character position to the spawn position
    [idleCharacter, forwardCharacter, backwardCharacter, leftCharacter, rightCharacter, runCharacter, danceCharacter].forEach(character => {
        character.position.x = spawnPosition.x;
        character.position.z = spawnPosition.z;
    });
    
    // Initialize controls with all character models
    const controls = new Controls(
        scene, 
        idleCharacter, 
        forwardCharacter, 
        backwardCharacter, 
        leftCharacter, 
        rightCharacter, 
        runCharacter,
        danceCharacter,
        gameCamera
    );

    currentCharacter = controls.getCurrentCharacter();
    gameCamera.setCharacter(currentCharacter);

    // Add debug UI update to scene's render loop
    scene.registerBeforeRender(() => {
        debugUI.update(currentCharacter);
    });

    // Scene settings
    scene.materialsNeedSceneLighting = true;
    scene.clearColor = new BABYLON.Color4(0.4, 0.6, 1.0, 1.0);

    return scene;
};

// Add this function to recreate the scene with a new level
const recreateScene = async (levelType) => {
    // Dispose of the current scene if it exists
    if (currentScene) {
        currentScene.dispose();
    }
    
    // Create a new scene with the specified level type
    currentScene = await createScene(levelType);
    
    // Make sure the render loop is running
    if (!engine.isRenderLoopRunning) {
        engine.runRenderLoop(() => {
            if (currentScene) {
                currentScene.render();
            }
        });
    }
};

// Make recreateScene available globally
window.recreateScene = recreateScene;

const main = async () => {
    // Initialize MusicManager FIRST
    import('./quest/MusicManager.js').then(module => {
        new module.MusicManager();  // Create singleton instance
    });

    // Initialize level progression manager
    import('./quest/levelProgression.js').then(module => {
        window.levelProgression = new module.LevelProgression();
    });
    
    // Set up resize handler
    window.addEventListener("resize", () => {
        engine.resize();
    });
};

main(); 