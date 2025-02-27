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

    setCharacter(character) {
        this.currentCharacter = character;
    }

    update() {
        if (!this.currentCharacter) return;

        // Dynamic camera radius adjustment based on beta angle
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
            // Gradually return to normal radius when looking down/forward
            this.camera.radius = BABYLON.Scalar.Lerp(this.camera.radius, this.thirdPersonProfile.radius, 0.1);
        }

        // Update camera target to follow character
        this.camera.target.x = this.currentCharacter.position.x;
        this.camera.target.z = this.currentCharacter.position.z;
        this.camera.target.y = this.currentCharacter.position.y + 2.0;
    }

    getCameraDirection() {
        const cameraDirection = this.camera.getTarget().subtract(this.camera.position);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        return cameraDirection;
    }
} 