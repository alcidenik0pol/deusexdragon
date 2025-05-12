import * as BABYLON_CORE from '@babylonjs/core';
import * as BABYLON_GUI from '@babylonjs/gui';
import * as BABYLON_MATERIALS from '@babylonjs/materials';
import * as BABYLON_LOADERS from '@babylonjs/loaders';

declare global {
    const BABYLON: typeof BABYLON_CORE & {
        GUI: typeof BABYLON_GUI;
        Materials: typeof BABYLON_MATERIALS;
    };
} 