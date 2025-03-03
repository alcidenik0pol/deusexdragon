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
        
        // Simple movement keys state
        this.keys = { w: false, a: false, s: false, d: false };
        this.moveSpeed = 0.15; // Adjust this value to control movement speed
        
        this.setupKeyboardControls();
        this.setupMovementLoop();
    }

    setAllCharactersInvisible() {
        this.idleCharacter.setEnabled(false);
        this.forwardCharacter.setEnabled(false);
        this.backwardCharacter.setEnabled(false);
        this.leftCharacter.setEnabled(false);
        this.rightCharacter.setEnabled(false);
    }

    updateCharacterPositions(newPosition) {
        this.idleCharacter.position = newPosition;
        this.forwardCharacter.position = newPosition;
        this.backwardCharacter.position = newPosition;
        this.leftCharacter.position = newPosition;
        this.rightCharacter.position = newPosition;
    }

    setupKeyboardControls() {
        window.addEventListener("keydown", (e) => {
            if (ChatUI.isActive && e.key !== "e") return;
            
            if (e.key in this.keys) {
                this.keys[e.key] = true;
                this.setAllCharactersInvisible();
                
                // Show appropriate animation
                switch(e.key) {
                    case 'w':
                        this.forwardCharacter.setEnabled(true);
                        this.currentCharacter = this.forwardCharacter;
                        break;
                    case 's':
                        this.backwardCharacter.setEnabled(true);
                        this.currentCharacter = this.backwardCharacter;
                        break;
                    case 'a':
                        this.leftCharacter.setEnabled(true);
                        this.currentCharacter = this.leftCharacter;
                        break;
                    case 'd':
                        this.rightCharacter.setEnabled(true);
                        this.currentCharacter = this.rightCharacter;
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
                }
            }
        });
    }

    setupMovementLoop() {
        this.scene.registerBeforeRender(() => {
            // Get camera's forward direction (ignoring Y component for ground movement)
            const cameraDirection = this.gameCamera.getCameraDirection();
            const right = BABYLON.Vector3.Cross(cameraDirection, BABYLON.Vector3.Up());
            
            // Calculate movement based on camera direction
            const moveVector = new BABYLON.Vector3(0, 0, 0);
            
            if (this.keys.w) {
                moveVector.addInPlace(cameraDirection.scale(-this.moveSpeed));
            }
            if (this.keys.s) {
                moveVector.addInPlace(cameraDirection.scale(this.moveSpeed));
            }
            if (this.keys.a) {
                moveVector.addInPlace(right.scale(-this.moveSpeed));
            }
            if (this.keys.d) {
                moveVector.addInPlace(right.scale(this.moveSpeed));
            }

            // Apply movement if any keys are pressed
            if (moveVector.length() > 0) {
                const newPosition = this.currentCharacter.position.add(moveVector);
                this.updateCharacterPositions(newPosition);
            }
        });
    }

    getCurrentCharacter() {
        return this.currentCharacter;
    }
}
