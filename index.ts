import '@babylonjs/core/Loading/Plugins/babylonFileLoader';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/materials/water';
import '@babylonjs/loaders';
import * as GUI from '@babylonjs/gui';
import * as Materials from '@babylonjs/materials';

// Add this for debugging
console.log('Index.ts loaded');

// Initialize the game after everything is loaded
export const initGame = async () => {
    try {
        // Make BABYLON available globally first
        (window as any).BABYLON = BABYLON;
        (window as any).BABYLON.GUI = GUI;
        (window as any).BABYLON.Materials = Materials;

        console.log('BABYLON loaded:', !!window.BABYLON);
        
        // Import and initialize ChatUI before camera
        await import('./ui/chatUI.js').then(module => {
            new module.ChatUI();  // This will set window.chatUI
            console.log('ChatUI loaded');
        });

        // Now load the game
        const { initGame: startGame } = await import('./main');
        await startGame();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
};

// Check if we're running standalone (not in the SPA)
// We can check this by looking for the SPA's app container
if (!document.getElementById('app')) {
    window.addEventListener('DOMContentLoaded', () => {
        console.log('Running in standalone mode, initializing game...');
        initGame();
    });
}

