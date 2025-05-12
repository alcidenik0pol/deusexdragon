import * as BABYLON from '@babylonjs/core';
import { loadCharacters } from './characters/pc/maincharacter.js';
import { GameCamera } from './camera.js';
import { getSpawnPosition } from './characters/pc/spawnPositions.js';
import { DebugUI } from './ui/debugUI.js';
import { Controls } from './ui/controls.js';
import { DebugControls } from './ui/debugControls.js';

// Global variables
let currentScene: BABYLON.Scene | null = null;
let currentLevelType = 'singapore6';
let currentCharacter = null;
let canvas: HTMLCanvasElement;
let engine: BABYLON.Engine;
let debugUI: DebugUI;
let debugControls: DebugControls;

interface ExtendedScene extends BABYLON.Scene {
    name: string;
    materialsNeedSceneLighting: boolean;
}

const createScene = async (levelType = 'singapore6') => {
    try {
        const scene = new BABYLON.Scene(engine) as ExtendedScene;
        scene.name = levelType;
        
        const gameCamera = new GameCamera(canvas, scene);
        const levelGenerator = debugControls.getLevelGenerator(levelType, scene);
        
        // Create level and load characters
        const { ground, walls, cellSize } = await levelGenerator.createLevel();
        const { 
            idleCharacter, 
            forwardCharacter, 
            backwardCharacter, 
            leftCharacter, 
            rightCharacter, 
            runCharacter, 
            danceCharacter 
        } = await loadCharacters(scene);
        
        // Set up pointer lock
        scene.onPointerDown = () => {
            if (!scene.getEngine().isPointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
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

        // Get the spawn position for this level
        const spawnPosition = getSpawnPosition(levelType);
        
        // Set the character position to the spawn position
        const characterArray = [
            idleCharacter, 
            forwardCharacter, 
            backwardCharacter, 
            leftCharacter, 
            rightCharacter, 
            runCharacter, 
            danceCharacter
        ];
        
        characterArray.forEach(character => {
            if (character && character.position) {
                character.position.x = spawnPosition.x;
                character.position.z = spawnPosition.z;
            }
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
    } catch (error) {
        console.error('Error creating scene:', error);
        throw error;
    }
};

export const initGame = async () => {
    // Initialize canvas and engine
    canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
    if (!canvas) {
        throw new Error("Canvas not found");
    }
    
    engine = new BABYLON.Engine(canvas, true);
    debugUI = new DebugUI();

    // Initialize debug controls
    debugControls = new DebugControls(async (newLevelType: string) => {
        if (currentScene) {
            currentScene.dispose();
        }
        currentLevelType = newLevelType;
        currentScene = await createScene(currentLevelType);
    });

    // Initialize FPS display
    debugControls.initializeFPSDisplay(engine);

    // Create initial scene
    currentScene = await createScene();

    // Start render loop
    engine.runRenderLoop(() => {
        if (currentScene) {
            currentScene.render();
        }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
        engine.resize();
    });

    // Initialize other systems
    await Promise.all([
        import('./quest/MusicManager.js').then(module => {
            new module.MusicManager();
        }),
        import('./quest/levelProgression.js').then(module => {
            window.levelProgression = new module.LevelProgression();
        })
    ]);
};

export const recreateScene = async (levelType: string) => {
    if (currentScene) {
        currentScene.dispose();
    }
    currentScene = await createScene(levelType);
};

// Make recreateScene available globally
(window as any).recreateScene = recreateScene;

// Update the global declaration
declare global {
    interface Window {
        BABYLON: typeof BABYLON & {
            GUI: any;
            Materials: any;
        };
        recreateScene: typeof recreateScene;
        levelProgression: any;
    }
} 