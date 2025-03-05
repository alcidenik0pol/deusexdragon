export class GameCamera {
    constructor(canvas, scene) {
        this.canvas = canvas;
        this.scene = scene;
        this.currentCharacter = null;
        this.mouseSensitivityX = 0.002; // Horizontal (yaw) sensitivity
        this.mouseSensitivityY = 0.002; // Vertical (pitch) sensitivity - matched with X for consistency
        this.cameraOffset = new BABYLON.Vector3(0, 2.5, 4); // Reduced from (0, 4, 7)
        
        // Camera profiles (adjusted to be closer)
        this.thirdPersonProfile = {
            offsetY: 2.5,  // Reduced from 4
            offsetZ: 4     // Reduced from 7
        };

        this.npcFocusProfile = {
            offsetY: 2.15, // Reduced from 3.15
            offsetZ: 2.2   // Reduced from 3.2
        };

        this.waitingProfile = {
            offsetY: 2.2,  // Reduced from 3.2
            offsetZ: 2.2   // Reduced from 3.2
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

        this.scene.activeCamera = this.camera;

        this.scene.registerBeforeRender(() => {
            if (this.currentCharacter) {
                const targetPosition = this.currentCharacter.position.clone();
                targetPosition.y += 2; // Look at character's head level

                const yaw = this.camera.rotation.y;
                const pitch = this.camera.rotation.x;

                // Calculate orbital camera position
                const radius = Math.sqrt(this.cameraOffset.z * this.cameraOffset.z + this.cameraOffset.y * this.cameraOffset.y);
                
                const cameraPosition = new BABYLON.Vector3(
                    targetPosition.x - Math.sin(yaw) * radius * Math.cos(pitch),
                    targetPosition.y + radius * Math.sin(pitch),
                    targetPosition.z - Math.cos(yaw) * radius * Math.cos(pitch)
                );

                this.camera.position.copyFrom(cameraPosition);
                this.camera.setTarget(targetPosition);
            }
        });
    }

    setupMouseControl() {
        this.scene.onPointerMove = (evt) => {
            if (this.scene.getEngine().isPointerLock) {
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