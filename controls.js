import { ChatUI } from './chat/chatUI.js';

export class Controls {
    constructor(scene, idleCharacter, forwardCharacter, backwardCharacter, leftCharacter, rightCharacter, gameCamera) {
        this.scene = scene;
        this.idleCharacter = idleCharacter;
        this.forwardCharacter = forwardCharacter;
        this.backwardCharacter = backwardCharacter;
        this.leftCharacter = leftCharacter;
        this.rightCharacter = rightCharacter;
        this.currentCharacter = idleCharacter;
        this.gameCamera = gameCamera;
        this.keys = { w: false, a: false, s: false, d: false, '0': false };
        this.moveSpeed = this.gameCamera.thirdPersonProfile.speed;
        
        this.setupKeyboardControls();
        this.setupAnimationLoop();
    }

    setAllCharactersInvisible() {
        this.idleCharacter.setEnabled(false);
        this.forwardCharacter.setEnabled(false);
        this.backwardCharacter.setEnabled(false);
        this.leftCharacter.setEnabled(false);
        this.rightCharacter.setEnabled(false);
    }

    updateCharacterPositions() {
        const pos = this.currentCharacter.position.clone();
        this.idleCharacter.position = pos;
        this.forwardCharacter.position = pos;
        this.backwardCharacter.position = pos;
        this.leftCharacter.position = pos;
        this.rightCharacter.position = pos;
    }

    updateCharacterRotations(quaternion) {
        this.idleCharacter.rotationQuaternion = quaternion;
        this.forwardCharacter.rotationQuaternion = quaternion;
        this.backwardCharacter.rotationQuaternion = quaternion;
        this.leftCharacter.rotationQuaternion = quaternion;
        this.rightCharacter.rotationQuaternion = quaternion;
    }

    setupKeyboardControls() {
        window.addEventListener("keydown", (e) => {
            if (ChatUI.isActive && e.key !== "e") return;
            
            // Add free camera mode toggle
            if (e.key === '0') {
                if (!this.keys['0']) {  // Only toggle on initial press
                    this.keys['0'] = true;
                    if (this.gameCamera.isInFreeMode) {
                        this.gameCamera.exitFreeMode();
                    } else {
                        this.gameCamera.enterFreeMode();
                    }
                }
                return;
            }

            // Don't allow movement in free camera mode
            if (this.gameCamera.isInFreeMode) return;

            if (e.key in this.keys) {
                this.keys[e.key] = true;
                this.setAllCharactersInvisible();
                
                // Get camera direction for all movements
                const cameraDirection = this.gameCamera.getCameraDirection();
                const targetAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
                
                // Set the appropriate animation and rotation based on key pressed
                switch(e.key) {
                    case 'w':
                        this.forwardCharacter.setEnabled(true);
                        this.currentCharacter = this.forwardCharacter;
                        // Face away from camera
                        this.forwardCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            targetAngle
                        );
                        break;
                    case 's':
                        this.backwardCharacter.setEnabled(true);
                        this.currentCharacter = this.backwardCharacter;
                        // Face towards camera (opposite of forward)
                        this.backwardCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            targetAngle
                        );
                        break;
                    case 'a':
                        this.leftCharacter.setEnabled(true);
                        this.currentCharacter = this.leftCharacter;
                        // Face 90 degrees left relative to camera
                        this.leftCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            targetAngle + Math.PI  // Add 90 degrees
                        );
                        break;
                    case 'd':
                        this.rightCharacter.setEnabled(true);
                        this.currentCharacter = this.rightCharacter;
                        this.rightCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            targetAngle + Math.PI
                        );
                        break;
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            if (ChatUI.isActive && e.key !== "e") return;
            
            if (e.key === '0') {
                this.keys['0'] = false;
                return;
            }

            if (e.key in this.keys) {
                this.keys[e.key] = false;
                
                // If no movement keys are pressed, return to idle
                if (!Object.values(this.keys).some(key => key)) {
                    this.setAllCharactersInvisible();
                    this.idleCharacter.setEnabled(true);
                    this.currentCharacter = this.idleCharacter;
                    // Reset rotation to default when returning to idle
                    this.idleCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                        BABYLON.Vector3.Up(),
                        -Math.PI/2  // Return to default rotation
                    );
                }
            }
        });
    }

    setupAnimationLoop() {
        this.scene.registerBeforeRender(() => {
            // Don't move character if in free camera mode
            if (this.gameCamera.isInFreeMode) {
                this.gameCamera.update();
                return;
            }

            // Get camera's forward direction
            const cameraDirection = this.gameCamera.getCameraDirection();
            
            // Calculate right vector
            const right = BABYLON.Vector3.Cross(cameraDirection, BABYLON.Vector3.Up());

            // Calculate movement
            let moveVector = BABYLON.Vector3.Zero();
            
            if (this.keys.w || this.keys.s) {
                moveVector.addInPlace(cameraDirection.scale(this.keys.w ? this.moveSpeed : -this.moveSpeed));
            }
            
            if (this.keys.a || this.keys.d) {
                moveVector.addInPlace(right.scale(this.keys.a ? this.moveSpeed : -this.moveSpeed));
            }

            if (moveVector.length() > 0) {
                // Calculate rotation based on movement direction
                const targetAngle = Math.atan2(moveVector.x, moveVector.z);
                const targetQuaternion = BABYLON.Quaternion.RotationAxis(
                    BABYLON.Vector3.Up(), 
                    targetAngle
                );
                
                // Apply movement and update all characters
                this.currentCharacter.position.addInPlace(moveVector);
                this.updateCharacterPositions();
                // Don't update rotations here anymore as we handle them in keydown
            }

            // Update camera
            this.gameCamera.update();
        });
    }

    getCurrentCharacter() {
        return this.currentCharacter;
    }
}
