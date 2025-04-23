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
        // Load Tailwind CSS if not already loaded
        if (!document.getElementById('tailwind-css')) {
            const tailwindLink = document.createElement('link');
            tailwindLink.id = 'tailwind-css';
            tailwindLink.rel = 'stylesheet';
            tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
            document.head.appendChild(tailwindLink);
        }

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
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: rgba(0, 0, 0, 0.9);
            font-family: 'Share Tech Mono', monospace;
            z-index: 1000;
        `;

        // Create title with cyberpunk styling
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = `
            margin-bottom: 3rem;
            text-align: center;
        `;

        const mainTitle = document.createElement('h1');
        mainTitle.style.cssText = `
            color: #fbbf24;
            font-size: 4rem;
            font-weight: bold;
            letter-spacing: 2px;
            text-shadow: 0 0 10px rgba(251, 191, 36, 0.7), 0 0 20px rgba(251, 191, 36, 0.5);
            margin-bottom: 0.5rem;
        `;
        mainTitle.textContent = 'DEUS EX';

        const subTitle = document.createElement('h2');
        subTitle.style.cssText = `
            color: #d97706;
            font-size: 2rem;
            letter-spacing: 4px;
            text-shadow: 0 0 8px rgba(217, 119, 6, 0.7);
        `;
        subTitle.textContent = 'NEON MERLION';

        // Create start button with hover effects
        const startButton = document.createElement('button');
        startButton.style.cssText = `
            background-color: #d97706;
            color: #111827;
            border: none;
            border-bottom: 3px solid #92400e;
            padding: 0.75rem 2rem;
            font-size: 1.5rem;
            cursor: pointer;
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 2px;
            transition: all 0.2s;
            margin-bottom: 2rem;
        `;
        startButton.textContent = 'START';
        startButton.onmouseover = () => {
            startButton.style.backgroundColor = '#f59e0b';
            startButton.style.borderBottomColor = '#d97706';
            startButton.style.transform = 'translateY(-2px)';
        };
        startButton.onmouseout = () => {
            startButton.style.backgroundColor = '#d97706';
            startButton.style.borderBottomColor = '#92400e';
            startButton.style.transform = 'translateY(0)';
        };
        startButton.onclick = () => this.handleStart();

        // Add decorative elements - horizontal line
        const decorLine = document.createElement('div');
        decorLine.style.cssText = `
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, rgba(217,119,6,0) 0%, rgba(217,119,6,1) 50%, rgba(217,119,6,0) 100%);
            margin-bottom: 3rem;
        `;

        // Create music button with different styling
        const musicButton = document.createElement('button');
        musicButton.style.cssText = `
            background-color: transparent;
            color: #d97706;
            border: 1px solid #d97706;
            padding: 0.5rem 1rem;
            font-size: 1rem;
            cursor: pointer;
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 1px;
            transition: all 0.2s;
            margin-top: 2rem;
            opacity: 0.7;
        `;
        musicButton.textContent = '🔇 ACTIVATE MUSIC';
        musicButton.onmouseover = () => {
            musicButton.style.opacity = '1';
            musicButton.style.transform = 'translateY(-1px)';
        };
        musicButton.onmouseout = () => {
            musicButton.style.opacity = '0.7';
            musicButton.style.transform = 'translateY(0)';
        };
        musicButton.onclick = () => {
            this.musicEnabled = true;
            musicButton.textContent = '🔊 MUSIC ENABLED';
            musicButton.style.color = '#059669'; // Change to green
            musicButton.style.borderColor = '#059669';
            musicButton.style.cursor = 'default';
            musicButton.disabled = true;
            
            // Dispatch music enabled event
            const musicEvent = new CustomEvent('musicEnabled');
            window.dispatchEvent(musicEvent);
        };

        // Assemble UI
        titleContainer.appendChild(mainTitle);
        titleContainer.appendChild(subTitle);
        
        this.container.appendChild(titleContainer);
        this.container.appendChild(decorLine);
        this.container.appendChild(startButton);
        this.container.appendChild(musicButton);
        
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