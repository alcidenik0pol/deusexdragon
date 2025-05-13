export class FPSDisplay {
    constructor(engine) {
        this.engine = engine;
        this.fpsElement = null;
        this.isVisible = true;
        this.initialize();
    }

    initialize() {
        // Create the FPS display element
        this.fpsElement = document.createElement('div');
        this.fpsElement.id = 'fps';
        this.fpsElement.className = `
            absolute top-2.5 right-2.5
            bg-black/70
            text-amber-400
            font-mono text-sm
            px-2 py-0.5
            min-w-[70px] h-6
            flex items-center justify-center
            select-none
            overflow-hidden
            z-[1000]
        `;
        this.fpsElement.style.mixBlendMode = 'normal';
        this.fpsElement.style.isolation = 'isolate';
        this.fpsElement.innerHTML = '0 fps';
        
        // Add to document
        document.body.appendChild(this.fpsElement);
        
        // Start updating FPS
        this.startUpdating();
    }

    startUpdating() {
        // Update FPS every frame
        this.engine.runRenderLoop(() => {
            if (this.isVisible) {
                this.fpsElement.innerHTML = `${this.engine.getFps().toFixed()} fps`;
            }
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.fpsElement.style.display = this.isVisible ? 'block' : 'none';
    }

    show() {
        this.isVisible = true;
        this.fpsElement.style.display = 'block';
    }

    hide() {
        this.isVisible = false;
        this.fpsElement.style.display = 'none';
    }
} 