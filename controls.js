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
        this.baseMoveSpeed = 0.04; // Base movement speed (reduced from 0.08)
        this.forwardSpeed = this.baseMoveSpeed * 0.75;  // Forward speed (75% of base)
        this.backwardSpeed = this.baseMoveSpeed * 0.25; // Backward speed (25% of base)
        this.strafeSpeed = this.baseMoveSpeed * 0.75;   // Strafe speed (75% of base)
        
        this.movementLocked = false;  // Add a flag to lock movement

        this.setupKeyboardControls();
        this.setupMovementLoop();

        window.addEventListener('lockPlayerControls', (e) => {
            this.movementLocked = e.detail;
        });

        window.addEventListener('stopCharacterMovement', () => {
            this.stopCharacterMovement();
        });
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

    stopCharacterMovement() {
        // Reset all movement keys
        this.keys = { w: false, a: false, s: false, d: false };
        this.setAllCharactersInvisible();
        this.idleCharacter.setEnabled(true);
        this.currentCharacter = this.idleCharacter;
    }

    setupKeyboardControls() {
        window.addEventListener("keydown", (e) => {
            // Allow 'E' key to be typed in the text area when chat UI is active
            if (ChatUI.isActive && e.target.tagName === 'TEXTAREA') return;

            if (this.movementLocked) return;
            
            if (e.key in this.keys) {
                this.keys[e.key] = true;
                this.setAllCharactersInvisible();
                
                // Show appropriate animation (swapped left and right)
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
                        this.rightCharacter.setEnabled(true);  // Swapped from leftCharacter
                        this.currentCharacter = this.rightCharacter;  // Swapped
                        break;
                    case 'd':
                        this.leftCharacter.setEnabled(true);   // Swapped from rightCharacter
                        this.currentCharacter = this.leftCharacter;   // Swapped
                        break;
                }
            }
        });

        window.addEventListener("keyup", (e) => {
            // Allow 'E' key to be typed in the text area when chat UI is active
            if (ChatUI.isActive && e.target.tagName === 'TEXTAREA') return;

            if (this.movementLocked) return;
            
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
            // Get camera's forward direction (ignoring vertical component for movement)
            const forward = new BABYLON.Vector3(
                Math.sin(this.gameCamera.getCameraYaw()),
                0,
                Math.cos(this.gameCamera.getCameraYaw())
            ).normalize();

            const right = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up());
            
            // Calculate movement based on camera direction
            const moveVector = new BABYLON.Vector3(0, 0, 0);
            
            if (this.keys.w) moveVector.addInPlace(forward.scale(this.forwardSpeed));
            if (this.keys.s) moveVector.addInPlace(forward.scale(-this.backwardSpeed));
            if (this.keys.a) moveVector.addInPlace(right.scale(this.strafeSpeed));
            if (this.keys.d) moveVector.addInPlace(right.scale(-this.strafeSpeed));

            // Apply movement if any keys are pressed and no collision detected
            if (moveVector.length() > 0) {
                const newPosition = this.currentCharacter.position.add(moveVector);
                
                // Create a ray for collision detection
                const origin = this.currentCharacter.position.clone();
                origin.y += 1; // Raise ray origin to middle of character
                const direction = moveVector.normalize();
                const length = moveVector.length() + 0.5; // Add small buffer for collision detection
                
                const ray = new BABYLON.Ray(origin, direction, length);
                const hit = this.scene.pickWithRay(ray, (mesh) => {
                    // Only check collision with meshes that have checkCollisions enabled
                    return mesh.checkCollisions === true;
                });

                // Only move if no collision detected
                if (!hit.hit) {
                    this.updateCharacterPositions(newPosition);
                }
            }
        });
    }

    getCurrentCharacter() {
        return this.currentCharacter;
    }
}
