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
        this.fpsElement.style.position = 'absolute';
        this.fpsElement.style.backgroundColor = 'black';
        this.fpsElement.style.border = '2px solid red';
        this.fpsElement.style.textAlign = 'center';
        this.fpsElement.style.fontSize = '16px';
        this.fpsElement.style.color = 'white';
        this.fpsElement.style.top = '15px';
        this.fpsElement.style.right = '10px';
        this.fpsElement.style.width = '60px';
        this.fpsElement.style.height = '20px';
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
                this.fpsElement.innerHTML = this.engine.getFps().toFixed() + " fps";
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