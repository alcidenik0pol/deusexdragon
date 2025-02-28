export class GameCamera {
    constructor(canvas, scene) {
        this.canvas = canvas;
        this.scene = scene;
        this.currentCharacter = null;

        // Camera profiles
        this.thirdPersonProfile = {
            radius: 5,
            beta: Math.PI / 2.2,
            target: new BABYLON.Vector3(0, 2.0, 0),
            lowerRadiusLimit: 3,
            upperRadiusLimit: 10,
            lowerBetaLimit: 0.1,
            upperBetaLimit: Math.PI / 1.2,
            speed: 0.1,
            minRadiusAtMaxBeta: 1.5,
            radiusAdjustThreshold: Math.PI / 2.5
        };

        this.npcFocusProfile = {
            radius: 2.0,         // Distance from target
            beta: Math.PI / 2.2, // Slightly higher angle
            heightOffset: 1.65,  // Eye level
            forwardOffset: 1.0,  // NEW: Offset in front of NPC
            transitionSpeed: 0.1
        };

        this.waitingProfile = {
            radius: 2.0,           // Increased from 0.8 to pull back
            beta: Math.PI / 2.5,   // Slightly adjusted angle
            heightOffset: 1.7,     // Keep eye level
            forwardOffset: 0.8,    // Increased from 0.3 for better framing
            transitionSpeed: 0.05  // Keep smooth transitions
        };

        this.freeCameraProfile = {
            radius: 5,
            beta: Math.PI / 2.2,
            transitionSpeed: 0.1,
            moveSpeed: 0.5  // Increased from 0.2 to 0.5 for faster movement
        };

        this.defaultProfile = { ...this.thirdPersonProfile };
        this.isInNPCFocus = false;
        this.focusedNPC = null;
        this.isInWaitingMode = false;
        this.isInFreeMode = false;

        // Add keyboard state tracking
        this.keys = { w: false, a: false, s: false, d: false };
        this.setupKeyboardControls();

        this.setupCamera();
    }

    setupCamera() {
        this.camera = new BABYLON.ArcRotateCamera("camera",
            0,
            this.thirdPersonProfile.beta,
            this.thirdPersonProfile.radius,
            this.thirdPersonProfile.target,
            this.scene
        );

        this.camera.lowerRadiusLimit = this.thirdPersonProfile.lowerRadiusLimit;
        this.camera.upperRadiusLimit = this.thirdPersonProfile.upperRadiusLimit;
        this.camera.lowerBetaLimit = this.thirdPersonProfile.lowerBetaLimit;
        this.camera.upperBetaLimit = this.thirdPersonProfile.upperBetaLimit;

        // Make camera movement smooth and remove click requirement
        this.camera.inputs.attached.mousewheel.detachControl();
        this.camera.inputs.attached.pointers.detachControl();
        this.camera.inputs.add(new BABYLON.FreeCameraMouseInput());
        this.camera.attachControl(this.canvas, true);
        this.camera.inertia = 0.5;
        this.camera.angularSensibilityX = 500;
        this.camera.angularSensibilityY = 500;
    }

    setupKeyboardControls() {
        // Handle keydown
        window.addEventListener("keydown", (e) => {
            if (this.isInFreeMode && e.key.toLowerCase() in this.keys) {
                this.keys[e.key.toLowerCase()] = true;
            }
        });

        // Handle keyup
        window.addEventListener("keyup", (e) => {
            if (this.isInFreeMode && e.key.toLowerCase() in this.keys) {
                this.keys[e.key.toLowerCase()] = false;
            }
        });
    }

    updateFreeCameraPosition() {
        if (!this.isInFreeMode) return;

        // Get camera's forward direction, keeping the Y component for vertical movement
        const forward = this.camera.target.subtract(this.camera.position).normalize();
        const right = BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).normalize();

        // Calculate movement based on keys
        const moveVector = new BABYLON.Vector3(0, 0, 0);
        
        if (this.keys.w) moveVector.addInPlace(forward.scale(this.freeCameraProfile.moveSpeed));
        if (this.keys.s) moveVector.addInPlace(forward.scale(-this.freeCameraProfile.moveSpeed));
        if (this.keys.a) moveVector.addInPlace(right.scale(this.freeCameraProfile.moveSpeed));  // Swapped A/D
        if (this.keys.d) moveVector.addInPlace(right.scale(-this.freeCameraProfile.moveSpeed)); // Swapped A/D

        // Apply movement to both camera and target
        if (moveVector.length() > 0) {
            this.camera.position.addInPlace(moveVector);
            this.camera.target.addInPlace(moveVector);
        }
    }

    setCharacter(character) {
        this.currentCharacter = character;
    }

    focusOnNPC(npc) {
        if (!npc || !npc.mesh) return;
        console.log("Focusing camera on NPC:", npc.name);
        
        this.focusedNPC = npc;
        this.isInNPCFocus = true;

        // Calculate direction NPC is facing (assuming they face -Z by default)
        const npcForward = new BABYLON.Vector3(
            Math.sin(npc.mesh.rotation.y),
            0,
            Math.cos(npc.mesh.rotation.y)
        );

        // Calculate target position in front of NPC
        const targetPosition = new BABYLON.Vector3(
            npc.mesh.position.x + (npcForward.x * this.npcFocusProfile.forwardOffset),
            npc.mesh.position.y + this.npcFocusProfile.heightOffset,
            npc.mesh.position.z + (npcForward.z * this.npcFocusProfile.forwardOffset)
        );

        // Set camera properties
        this.camera.radius = this.npcFocusProfile.radius;
        this.camera.beta = this.npcFocusProfile.beta;
        
        // Calculate alpha to face NPC
        const directionToNPC = npc.mesh.position.subtract(this.currentCharacter.position);
        this.camera.alpha = Math.atan2(directionToNPC.x, directionToNPC.z);
        
        // Set target to the point in front of NPC
        this.camera.target = targetPosition;

        // Adjust camera limits
        this.camera.lowerRadiusLimit = 1.5;
        this.camera.upperRadiusLimit = 2.5;
    }

    clearNPCFocus() {
        console.log("Clearing NPC camera focus");
        this.isInNPCFocus = false;
        this.focusedNPC = null;
        
        // Force immediate return to default camera
        this.camera.radius = this.thirdPersonProfile.radius;
        this.camera.beta = this.thirdPersonProfile.beta;

        // Reset camera limits to third person values
        this.camera.lowerRadiusLimit = this.thirdPersonProfile.lowerRadiusLimit;
        this.camera.upperRadiusLimit = this.thirdPersonProfile.upperRadiusLimit;
        this.camera.lowerBetaLimit = this.thirdPersonProfile.lowerBetaLimit;
        this.camera.upperBetaLimit = this.thirdPersonProfile.upperBetaLimit;
    }

    focusOnPlayer() {
        if (!this.currentCharacter) {
            console.log("No character to focus on");
            return;
        }
        console.log("Focusing camera on player while waiting");
        
        this.isInWaitingMode = true;
        this.isInNPCFocus = false;

        // Calculate alpha to look at player's face from the front
        // Adding Math.PI (180 degrees) to face the front of the character
        this.camera.alpha = this.currentCharacter.rotation.y + Math.PI;

        // Set camera properties with adjusted values
        this.camera.radius = this.waitingProfile.radius;
        this.camera.beta = this.waitingProfile.beta;
        
        // Set target to player's face, slightly in front
        const playerForward = new BABYLON.Vector3(
            Math.sin(this.currentCharacter.rotation.y),
            0,
            Math.cos(this.currentCharacter.rotation.y)
        );

        // Position the target slightly in front of the player
        this.camera.target = new BABYLON.Vector3(
            this.currentCharacter.position.x + (playerForward.x * this.waitingProfile.forwardOffset),
            this.currentCharacter.position.y + this.waitingProfile.heightOffset,
            this.currentCharacter.position.z + (playerForward.z * this.waitingProfile.forwardOffset)
        );

        // Adjust camera limits for medium shot
        this.camera.lowerRadiusLimit = 1.8;
        this.camera.upperRadiusLimit = 2.2;
    }

    enterFreeMode() {
        console.log("Entering free camera mode");
        this.isInFreeMode = true;
        
        // Store current camera settings to restore later
        this.previousRadius = this.camera.radius;
        this.previousBeta = this.camera.beta;
        
        // Set free camera properties
        this.camera.radius = this.freeCameraProfile.radius;
        this.camera.beta = this.freeCameraProfile.beta;
        
        // Remove radius limits to allow free movement
        this.camera.lowerRadiusLimit = 2;
        this.camera.upperRadiusLimit = 20;
        this.camera.lowerBetaLimit = 0.1;
        this.camera.upperBetaLimit = Math.PI - 0.1;
        
        // Reset key states
        Object.keys(this.keys).forEach(key => this.keys[key] = false);
    }

    exitFreeMode() {
        console.log("Exiting free camera mode");
        this.isInFreeMode = false;
        
        // Restore previous camera settings
        this.camera.radius = this.previousRadius;
        this.camera.beta = this.previousBeta;
        
        // Reset camera limits to third person values
        this.camera.lowerRadiusLimit = this.thirdPersonProfile.lowerRadiusLimit;
        this.camera.upperRadiusLimit = this.thirdPersonProfile.upperRadiusLimit;
        this.camera.lowerBetaLimit = this.thirdPersonProfile.lowerBetaLimit;
        this.camera.upperBetaLimit = this.thirdPersonProfile.upperBetaLimit;
        
        // Reset key states
        Object.keys(this.keys).forEach(key => this.keys[key] = false);
    }

    update() {
        if (!this.currentCharacter) return;

        if (this.isInFreeMode) {
            this.updateFreeCameraPosition();
            return;
        }

        if (this.isInNPCFocus && this.focusedNPC) {
            // Existing NPC focus behavior
            const targetPosition = new BABYLON.Vector3(
                this.focusedNPC.mesh.position.x,
                this.focusedNPC.mesh.position.y + this.npcFocusProfile.heightOffset,
                this.focusedNPC.mesh.position.z
            );

            // Update target position
            this.camera.target = BABYLON.Vector3.Lerp(
                this.camera.target,
                targetPosition,
                this.npcFocusProfile.transitionSpeed
            );
            return;
        } 
        
        if (this.isInWaitingMode) {
            console.log("Updating camera in waiting mode"); // Debug log
            
            // Calculate direction player is facing
            const playerForward = new BABYLON.Vector3(
                Math.sin(this.currentCharacter.rotation.y),
                0,
                Math.cos(this.currentCharacter.rotation.y)
            );

            // Calculate target position in front of player
            const targetPosition = new BABYLON.Vector3(
                this.currentCharacter.position.x + (playerForward.x * this.waitingProfile.forwardOffset),
                this.currentCharacter.position.y + this.waitingProfile.heightOffset,
                this.currentCharacter.position.z + (playerForward.z * this.waitingProfile.forwardOffset)
            );

            // Smoothly update camera properties
            this.camera.radius = BABYLON.Scalar.Lerp(
                this.camera.radius,
                this.waitingProfile.radius,
                this.waitingProfile.transitionSpeed
            );
            
            this.camera.beta = BABYLON.Scalar.Lerp(
                this.camera.beta,
                this.waitingProfile.beta,
                this.waitingProfile.transitionSpeed
            );

            // Update target position
            this.camera.target = BABYLON.Vector3.Lerp(
                this.camera.target,
                targetPosition,
                this.waitingProfile.transitionSpeed
            );
            return;
        }

        // Original third-person camera behavior
        if (this.camera.beta > this.thirdPersonProfile.radiusAdjustThreshold) {
            const betaProgress = (this.camera.beta - this.thirdPersonProfile.radiusAdjustThreshold) /
                (this.thirdPersonProfile.upperBetaLimit - this.thirdPersonProfile.radiusAdjustThreshold);
            const targetRadius = BABYLON.Scalar.Lerp(
                this.thirdPersonProfile.radius,
                this.thirdPersonProfile.minRadiusAtMaxBeta,
                betaProgress
            );
            this.camera.radius = BABYLON.Scalar.Lerp(this.camera.radius, targetRadius, 0.1);
        } else {
            this.camera.radius = BABYLON.Scalar.Lerp(
                this.camera.radius,
                this.thirdPersonProfile.radius,
                0.1
            );
        }

        // Update camera target to follow character
        this.camera.target.x = this.currentCharacter.position.x;
        this.camera.target.z = this.currentCharacter.position.z;
        this.camera.target.y = this.currentCharacter.position.y + 2.0;
    }

    clearWaitingFocus() {
        console.log("Clearing waiting focus state");
        this.isInWaitingMode = false;
        // Don't set any camera properties here - let focusOnNPC handle that
    }

    getCameraDirection() {
        const cameraDirection = this.camera.getTarget().subtract(this.camera.position);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        return cameraDirection;
    }
} 