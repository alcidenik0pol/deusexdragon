export class DebugUI {
    constructor(overlayElement) {
        this.overlayElement = overlayElement;
        this.isEnabled = true;
    }

    update(character) {
        if (!this.isEnabled || !character) return;

        // Format position to 2 decimal places
        const position = character.position;
        const positionText = `Position: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;

        // Get rotation in degrees for better readability
        // Using rotationQuaternion since that's what we use in maincharacter.js
        let yRotation = 0;
        if (character.rotationQuaternion) {
            const euler = character.rotationQuaternion.toEulerAngles();
            yRotation = BABYLON.Tools.ToDegrees(euler.y);
        }
        const rotationText = `Rotation: ${yRotation.toFixed(1)}°`;

        // Update the overlay text
        this.overlayElement.innerHTML = `${positionText}<br>${rotationText}`;
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        this.overlayElement.style.display = this.isEnabled ? 'block' : 'none';
    }
} 