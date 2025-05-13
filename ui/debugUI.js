export class DebugUI {
    constructor() {
        // Create debug overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.id = 'debugOverlay';
        this.overlayElement.className = `
            absolute top-2.5 left-2.5
            bg-black/70
            text-amber-400
            font-mono text-sm
            px-2 py-0.5
            min-w-[200px]
            flex flex-col items-start justify-center
            select-none
            overflow-hidden
            z-[1000]
        `;
        this.overlayElement.style.mixBlendMode = 'normal';
        this.overlayElement.style.isolation = 'isolate';
        document.body.appendChild(this.overlayElement);
        
        // Create API notification container with Tailwind
        this.apiNotificationContainer = document.createElement('div');
        this.apiNotificationContainer.className = `
            fixed top-20 left-2.5
            bg-black/70
            text-orange-400
            font-mono text-xs
            px-2.5 py-1.5
            border-l-2 border-orange-400
            opacity-0
            transition-opacity duration-300
            pointer-events-none
            z-[1000]
        `;
        document.body.appendChild(this.apiNotificationContainer);

        // Create API error container with Tailwind
        this.apiErrorContainer = document.createElement('div');
        this.apiErrorContainer.className = `
            fixed top-2.5 left-52
            bg-black/70
            text-red-400
            font-mono text-xs
            px-2.5 py-1.5
            border-l-2 border-red-400
            opacity-0
            transition-opacity duration-300
            pointer-events-none
            z-[1000]
        `;
        document.body.appendChild(this.apiErrorContainer);
        
        this.isEnabled = true;
        
        // Add event listener for debug toggle
        window.addEventListener('toggleDebugOverlay', () => {
            this.toggle();
        });
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