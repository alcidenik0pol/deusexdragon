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
        this.keys = { w: false, a: false, s: false, d: false };
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
            if (e.key in this.keys) {
                this.keys[e.key] = true;
                this.setAllCharactersInvisible();
                
                // Set the appropriate animation and rotation based on key pressed
                switch(e.key) {
                    case 'w':
                        this.forwardCharacter.setEnabled(true);
                        this.currentCharacter = this.forwardCharacter;
                        // Forward keeps default rotation
                        break;
                    case 's':
                        this.backwardCharacter.setEnabled(true);
                        this.currentCharacter = this.backwardCharacter;
                        // Rotate 90 degrees for backward walking
                        this.backwardCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            -Math.PI/2  // 90 degrees
                        );
                        break;
                    case 'a':
                        this.leftCharacter.setEnabled(true);
                        this.currentCharacter = this.leftCharacter;
                        // Rotate 90 degrees for left strafe
                        this.leftCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            Math.PI/2  // 90 degrees
                        );
                        break;
                    case 'd':
                        this.rightCharacter.setEnabled(true);
                        this.currentCharacter = this.rightCharacter;
                        this.rightCharacter.rotationQuaternion = BABYLON.Quaternion.RotationAxis(
                            BABYLON.Vector3.Up(),
                            Math.PI/2
                        );
                        break;
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            if (ChatUI.isActive && e.key !== "e") return;
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
