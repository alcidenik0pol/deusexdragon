export class GameCamera {
    constructor(canvas, scene) {
        this.canvas = canvas;
        this.scene = scene;
        this.currentCharacter = null;
        this.mouseSensitivity = 0.05;
        this.rotationY = 0;

        // Camera profiles
        this.thirdPersonProfile = {
            radius: 7,
            heightOffset: 4,
            rotationOffset: 180,
            cameraAcceleration: 0.015,
            maxCameraSpeed: 10
        };

        this.npcFocusProfile = {
            radius: 3.2,
            heightOffset: 3.15,
            rotationOffset: 180,
            cameraAcceleration: 0.03,
            maxCameraSpeed: 20
        };

        this.waitingProfile = {
            radius: 3.2,
            heightOffset: 3.2,
            rotationOffset: 180,
            cameraAcceleration: 0.03,
            maxCameraSpeed: 20
        };

        this.defaultProfile = { ...this.thirdPersonProfile };
        this.isInNPCFocus = false;
        this.focusedNPC = null;
        this.isInWaitingMode = false;

        this.setupCamera();
        this.setupMouseControl();
    }

    setupCamera() {
        // Create follow camera
        this.camera = new BABYLON.FollowCamera("FollowCam", 
            new BABYLON.Vector3(100, 20, 50),
            this.scene
        );

        // Set initial camera properties
        this.camera.radius = this.thirdPersonProfile.radius;
        this.camera.heightOffset = this.thirdPersonProfile.heightOffset;
        this.camera.rotationOffset = this.thirdPersonProfile.rotationOffset;
        this.camera.cameraAcceleration = this.thirdPersonProfile.cameraAcceleration;
        this.camera.maxCameraSpeed = this.thirdPersonProfile.maxCameraSpeed;

        // Enable pointer lock
        this.scene.onPointerDown = () => {
            if (!this.scene.getEngine().isPointerLock) {
                this.canvas.requestPointerLock = this.canvas.requestPointerLock || 
                                               this.canvas.msRequestPointerLock || 
                                               this.canvas.mozRequestPointerLock || 
                                               this.canvas.webkitRequestPointerLock;
                if (this.canvas.requestPointerLock) {
                    this.canvas.requestPointerLock();
                }
            }
        };
    }

    setupMouseControl() {
        this.scene.onPointerMove = (evt) => {
            if (this.scene.getEngine().isPointerLock) {
                // Directly set the rotation offset without acceleration
                this.camera.rotationOffset += evt.movementX * this.mouseSensitivity;
                
                // Ensure the camera updates immediately
                this.camera.update();
            }
        };
    }

    setCharacter(character) {
        this.currentCharacter = character;
        this.camera.lockedTarget = character;
    }

    focusOnNPC(npc) {
        if (!npc || !npc.mesh) return;
        
        this.focusedNPC = npc;
        this.isInNPCFocus = true;

        // Update camera properties for NPC focus
        this.camera.radius = this.npcFocusProfile.radius;
        this.camera.heightOffset = this.npcFocusProfile.heightOffset;
        this.camera.cameraAcceleration = this.npcFocusProfile.cameraAcceleration;
        
        // Lock camera to NPC
        this.camera.lockedTarget = npc.mesh;
    }

    clearNPCFocus() {
        this.isInNPCFocus = false;
        this.focusedNPC = null;
        
        // Reset camera properties
        this.camera.radius = this.thirdPersonProfile.radius;
        this.camera.heightOffset = this.thirdPersonProfile.heightOffset;
        this.camera.cameraAcceleration = this.thirdPersonProfile.cameraAcceleration;
        
        // Lock back to player
        this.camera.lockedTarget = this.currentCharacter;
    }

    focusOnPlayer() {
        if (!this.currentCharacter) return;
        
        this.isInWaitingMode = true;
        this.isInNPCFocus = false;

        // Update camera properties for waiting mode
        this.camera.radius = this.waitingProfile.radius;
        this.camera.heightOffset = this.waitingProfile.heightOffset;
        this.camera.cameraAcceleration = this.waitingProfile.cameraAcceleration;
        
        // Ensure camera is locked to player
        this.camera.lockedTarget = this.currentCharacter;
    }

    clearWaitingFocus() {
        this.isInWaitingMode = false;
        
        // Reset to default properties
        this.camera.radius = this.thirdPersonProfile.radius;
        this.camera.heightOffset = this.thirdPersonProfile.heightOffset;
        this.camera.cameraAcceleration = this.thirdPersonProfile.cameraAcceleration;
    }

    getCameraDirection() {
        const cameraForward = this.camera.position.subtract(this.currentCharacter.position);
        cameraForward.y = 0;
        return cameraForward.normalize();
    }

    getCameraYaw() {
        const direction = this.getCameraDirection();
        return Math.atan2(direction.x, direction.z);
    }
} 