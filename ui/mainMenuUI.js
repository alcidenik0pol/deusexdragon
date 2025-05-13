export class MainMenuUI {
    static isActive = false;

    constructor() {
        this.container = null;
        this.isVisible = false;
        this.musicEnabled = false;
        
        // Create the UI elements
        this.create();
    }

    create() {
        // Load futuristic font if not already loaded
        if (!document.getElementById('futuristic-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'futuristic-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
            document.head.appendChild(fontLink);
        }

        // Create main container - centered on screen
        this.container = document.createElement('div');
        this.container.className = 'fixed inset-0 flex flex-col justify-center items-center bg-black/90 font-["Share_Tech_Mono"] z-[1000]';

        // Create title with cyberpunk styling
        const titleContainer = document.createElement('div');
        titleContainer.className = 'mb-12 text-center';

        const mainTitle = document.createElement('h1');
        mainTitle.className = 'text-amber-400 text-6xl font-bold tracking-wider mb-2';
        mainTitle.style.textShadow = '0 0 10px rgba(251, 191, 36, 0.7), 0 0 20px rgba(251, 191, 36, 0.5)';
        mainTitle.textContent = 'DEUS EX';

        const subTitle = document.createElement('h2');
        subTitle.className = 'text-amber-600 text-4xl tracking-[0.2em]';
        subTitle.style.textShadow = '0 0 8px rgba(217, 119, 6, 0.7)';
        subTitle.textContent = 'NEON MERLION';

        // Create start button with hover effects
        const startButton = document.createElement('button');
        startButton.className = 'bg-amber-600 text-gray-900 border-b-3 border-amber-800 px-8 py-3 text-2xl cursor-pointer font-["Share_Tech_Mono"] tracking-wider mb-8 transition-all duration-200 hover:bg-amber-500 hover:border-amber-600 hover:-translate-y-0.5';
        startButton.textContent = 'START';
        startButton.onclick = () => this.handleStart();

        // Add decorative elements - horizontal line
        const decorLine = document.createElement('div');
        decorLine.className = 'w-3/5 h-0.5 mb-12';
        decorLine.style.background = 'linear-gradient(90deg, rgba(217,119,6,0) 0%, rgba(217,119,6,1) 50%, rgba(217,119,6,0) 100%)';

        // Assemble UI
        titleContainer.appendChild(mainTitle);
        titleContainer.appendChild(subTitle);
        
        this.container.appendChild(titleContainer);
        this.container.appendChild(decorLine);
        this.container.appendChild(startButton);
        
        document.body.appendChild(this.container);
    }

    handleStart() {
        // Hide the menu
        this.hide();
        
        // Dispatch event to start the game
        const startEvent = new CustomEvent('startGame');
        window.dispatchEvent(startEvent);
    }

    show() {
        this.container.style.display = 'flex';
        this.isVisible = true;
        MainMenuUI.isActive = true;
    }

    hide() {
        this.container.style.display = 'none';
        this.isVisible = false;
        MainMenuUI.isActive = false;
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 