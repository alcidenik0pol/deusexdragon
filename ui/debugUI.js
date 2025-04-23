export class DebugUI {
    constructor(overlayElement) {
        this.overlayElement = overlayElement;
        this.isEnabled = true;
        
        // Create a separate container for API notifications
        this.apiNotificationContainer = document.createElement('div');
        this.apiNotificationContainer.style.cssText = `
            position: fixed;
            top: 80px;  // Below the debug overlay
            left: 10px;
            color: #ff9900;  // Orange color for warnings
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.7);
            padding: 5px 10px;
            border-left: 2px solid #ff9900;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(this.apiNotificationContainer);

        // Create API error notification container
        this.apiErrorContainer = document.createElement('div');
        this.apiErrorContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 200px;  // Positioned to the right of the debug overlay
            color: #ff4444;  // Red for errors
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.7);
            padding: 5px 10px;
            border-left: 2px solid #ff4444;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.apiErrorContainer);
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

    showApiError(error) {
        let message;
        
        // First check if error is nested in an error property
        const errorObj = error.error || error;
        
        // Parse common API errors
        if (errorObj.code === 429) {
            message = "API: Too Many Requests - Please wait...";
        } else if (errorObj.message?.includes('token limit')) {
            message = "API: Token limit reached";
        } else if (errorObj.message?.includes('Provider returned error')) {
            message = "API: Provider Error (429) - Please wait...";
        } else if (errorObj.status) {
            // Handle HTTP error responses
            switch (errorObj.status) {
                case 401:
                    message = "API: Authentication failed";
                    break;
                case 403:
                    message = "API: Access forbidden";
                    break;
                case 500:
                    message = "API: Server error";
                    break;
                case 502:
                case 503:
                case 504:
                    message = "API: Service unavailable";
                    break;
                default:
                    message = `API: Response not OK (${errorObj.status})`;
            }
        } else if (errorObj.message?.includes('Failed to fetch')) {
            message = "API: Network error - Check connection";
        } else {
            message = `API Error: ${errorObj.message || 'Unknown error'}`;
        }

        // Show the error message
        this.apiErrorContainer.textContent = message;
        this.apiErrorContainer.style.opacity = '1';
        
        // Clear any existing timeout
        if (this.apiErrorTimeout) {
            clearTimeout(this.apiErrorTimeout);
        }
        
        // Hide after 3 seconds
        this.apiErrorTimeout = setTimeout(() => {
            this.apiErrorContainer.style.opacity = '0';
        }, 3000);
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        this.overlayElement.style.display = this.isEnabled ? 'block' : 'none';
    }

    dispose() {
        if (this.apiNotificationTimeout) {
            clearTimeout(this.apiNotificationTimeout);
        }
        if (this.apiNotificationContainer) {
            document.body.removeChild(this.apiNotificationContainer);
        }
        if (this.apiErrorTimeout) {
            clearTimeout(this.apiErrorTimeout);
        }
        if (this.apiErrorContainer) {
            document.body.removeChild(this.apiErrorContainer);
        }
    }
} 