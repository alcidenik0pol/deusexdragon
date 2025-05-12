import { ChatUI } from './ui/chatUI.js';

export class GameCamera {
    constructor(canvas, scene) {
        this.canvas = canvas;
        this.scene = scene;
        this.currentCharacter = null;
        this.mouseSensitivityX = 0.002; // Horizontal (yaw) sensitivity
        this.mouseSensitivityY = 0.002; // Vertical (pitch) sensitivity - matched with X for consistency
        this.cameraOffset = new BABYLON.Vector3(0, 2.5, 4); // These values are good
        
        // Camera profiles
        this.thirdPersonProfile = {
            offsetY: 2.5,  // Good
            offsetZ: 4     // Good
        };

        this.npcFocusProfile = {
            offsetY: 2.15, // Good
            offsetZ: 2.2   // Good
        };

        this.waitingProfile = {
            offsetY: 2.2,  // Good
            offsetZ: 2.2   // Good
        };

        this.isInNPCFocus = false;
        this.focusedNPC = null;
        this.isInWaitingMode = false;

        this.setupCamera();
        this.setupMouseControl();
    }

    setupCamera() {
        this.camera = new BABYLON.UniversalCamera(
            "UniversalCamera",
            new BABYLON.Vector3(0, 0, 0),
            this.scene
        );

        // Enable camera collisions
        this.camera.checkCollisions = true;
        this.camera.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);

        this.scene.activeCamera = this.camera;

        this.scene.registerBeforeRender(() => {
            if (this.currentCharacter) {
                const targetPosition = this.currentCharacter.position.clone();
                targetPosition.y += 2;

                const yaw = this.camera.rotation.y;
                const pitch = this.camera.rotation.x;

                // Calculate desired camera position
                const radius = Math.sqrt(this.cameraOffset.z * this.cameraOffset.z + this.cameraOffset.y * this.cameraOffset.y);
                const desiredPosition = new BABYLON.Vector3(
                    targetPosition.x - Math.sin(yaw) * radius * Math.cos(pitch),
                    targetPosition.y + radius * Math.sin(pitch),
                    targetPosition.z - Math.cos(yaw) * radius * Math.cos(pitch)
                );

                // Ray test for collision
                const ray = new BABYLON.Ray(targetPosition, desiredPosition.subtract(targetPosition), radius);
                const hit = this.scene.pickWithRay(ray);

                let finalPosition;
                if (hit.hit) {
                    // If there's a collision, place camera at hit point (slightly offset to prevent clipping)
                    const offset = targetPosition.subtract(hit.pickedPoint).normalize().scale(0.2);
                    finalPosition = hit.pickedPoint.add(offset);
                } else {
                    // No collision, use desired position
                    finalPosition = desiredPosition;
                }

                // Add maximum distance check
                const maxDistance = 6; // Adjust this value as needed
                const distanceToTarget = BABYLON.Vector3.Distance(finalPosition, targetPosition);
                if (distanceToTarget > maxDistance) {
                    const direction = finalPosition.subtract(targetPosition).normalize();
                    finalPosition = targetPosition.add(direction.scale(maxDistance));
                }

                this.camera.position.copyFrom(finalPosition);
                this.camera.setTarget(targetPosition);
            }
        });
    }

    setupMouseControl() {
        this.scene.onPointerMove = (evt) => {
            if (ChatUI.isActive || this.scene.getEngine().isPointerLock) {
                this.camera.rotation.y += evt.movementX * this.mouseSensitivityX;
                this.camera.rotation.x += evt.movementY * this.mouseSensitivityY;
                
                // Clamp vertical rotation
                const upperLimit = Math.PI / 3;  // 60 degrees up
                const lowerLimit = -Math.PI / 3; // 60 degrees down
                this.camera.rotation.x = Math.min(upperLimit, Math.max(lowerLimit, this.camera.rotation.x));
            }
        };
    }

    setCharacter(character) {
        this.currentCharacter = character;
    }

    focusOnNPC(npc) {
        if (!npc || !npc.mesh) return;
        this.focusedNPC = npc;
        this.isInNPCFocus = true;
        this.cameraOffset.y = this.npcFocusProfile.offsetY;
        this.cameraOffset.z = this.npcFocusProfile.offsetZ;
    }

    clearNPCFocus() {
        this.isInNPCFocus = false;
        this.focusedNPC = null;
        this.cameraOffset.y = this.thirdPersonProfile.offsetY;
        this.cameraOffset.z = this.thirdPersonProfile.offsetZ;
    }

    focusOnPlayer() {
        if (!this.currentCharacter) return;
        this.isInWaitingMode = true;
        this.isInNPCFocus = false;
        this.cameraOffset.y = this.waitingProfile.offsetY;
        this.cameraOffset.z = this.waitingProfile.offsetZ;
    }

    clearWaitingFocus() {
        this.isInWaitingMode = false;
        this.cameraOffset.y = this.thirdPersonProfile.offsetY;
        this.cameraOffset.z = this.thirdPersonProfile.offsetZ;
    }

    getCameraDirection() {
        const forward = this.camera.getForwardRay().direction;
        forward.y = 0;
        return forward.normalize();
    }

    getCameraYaw() {
        return this.camera.rotation.y;
    }

    getCameraPitch() {
        return this.camera.rotation.x;
    }
} 