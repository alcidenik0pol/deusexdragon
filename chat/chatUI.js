import { ChatService } from './chatService.js';

export class ChatUI {
    static isActive = false;  // Add static property to track chat state

    constructor() {
        this.container = null;
        this.textArea = null;
        this.outputBlock = null;
        this.isVisible = false;
        this.chatService = new ChatService();
        this.currentNPC = null;
    }

    create() {
        // Load Tailwind CSS
        if (!document.getElementById('tailwind-css')) {
            const tailwindLink = document.createElement('link');
            tailwindLink.id = 'tailwind-css';
            tailwindLink.rel = 'stylesheet';
            tailwindLink.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
            document.head.appendChild(tailwindLink);
        }

        // Load futuristic font
        if (!document.getElementById('futuristic-font')) {
            const fontLink = document.createElement('link');
            fontLink.id = 'futuristic-font';
            fontLink.rel = 'stylesheet';
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap';
            document.head.appendChild(fontLink);
        }

        // Create main container - docked at bottom (reduced height to ~25% of screen)
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            max-height: 25vh;
            background-color: #111827;
            border-top: 2px solid #d97706;
            box-shadow: 0 -4px 6px -1px rgba(217, 119, 6, 0.3);
            font-family: 'Share Tech Mono', monospace;
            display: none;
            z-index: 1000;
        `;

        // Create header bar (made even smaller)
        const headerBar = document.createElement('div');
        headerBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #d97706;
            padding: 0.1rem 0.5rem;  // Further reduced padding
            border-bottom: 1px solid #b45309;
            height: 20px; // Explicitly set small height
        `;

        // Create NPC name display in header (adjusted for larger size)
        this.npcNameDisplay = document.createElement('div');
        this.npcNameDisplay.style.cssText = `
            color: #111827;
            font-weight: bold;
            letter-spacing: 1px;
            font-size: 16px;  // Increased from 11px to be larger than chat font (14px)
            line-height: 1;
        `;

        // Spacer element
        const spacer = document.createElement('div');
        spacer.style.cssText = `
            flex-grow: 1;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        closeButton.style.cssText = `
            background: none;
            border: none;
            color: #111827;
            cursor: pointer;
            padding: 4px;
        `;
        closeButton.onclick = () => this.hide();

        // Add diagonal stripe decoration (thinner)
        const topDecoration = document.createElement('div');
        topDecoration.style.cssText = `
            height: 2px;
            width: 100%;
            background-color: #d97706;
            position: relative;
            overflow: hidden;
        `;
        
        const diagonalStripes = document.createElement('div');
        diagonalStripes.style.cssText = `
            position: absolute;
            inset: 0;
            background-image: repeating-linear-gradient(
                45deg,
                rgba(0,0,0,0.1),
                rgba(0,0,0,0.1) 10px,
                transparent 10px,
                transparent 20px
            );
        `;
        topDecoration.appendChild(diagonalStripes);

        // Create output block (larger font)
        this.outputBlock = document.createElement('div');
        this.outputBlock.style.cssText = `
            width: 100%;
            height: 4rem;
            overflow-y: auto;
            padding: 0.5rem;
            color: #fbbf24;
            font-size: 14px;  // Increased font size
            background-color: #111827;
            border-top: 1px solid rgba(217, 119, 6, 0.5);
            white-space: pre-wrap;
        `;
        
        // Add custom scrollbar styles
        const styleEl = document.createElement('style');
        styleEl.textContent = `
            #chat-output::-webkit-scrollbar {
                width: 8px;
            }
            #chat-output::-webkit-scrollbar-track {
                background: #111827;
            }
            #chat-output::-webkit-scrollbar-thumb {
                background: #d97706;
                border-radius: 0;
            }
            #chat-output::-webkit-scrollbar-thumb:hover {
                background: #f59e0b;
            }
        `;
        document.head.appendChild(styleEl);
        this.outputBlock.id = 'chat-output';

        // Create input container (adjusted padding)
        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            padding: 0.25rem 0.5rem;  // Reduced padding
            background-color: #1f2937;
            border-top: 1px solid rgba(217, 119, 6, 0.3);
        `;

        // Create text area (larger font + blinking cursor)
        this.textArea = document.createElement('textarea');
        this.textArea.style.cssText = `
            width: 100%;
            padding: 0.25rem;
            margin-bottom: 0.25rem;
            background-color: #111827;
            color: #fbbf24;
            border: 1px solid #d97706;
            border-radius: 0;
            font-family: 'Share Tech Mono', monospace;
            font-size: 14px;  // Increased font size
            resize: none;
            height: 40px;
            caret-color: #fbbf24;  // Makes the cursor orange
            animation: blink 1s step-end infinite;
        `;
        this.textArea.placeholder = "Enter your message...";
        
        // Create button container (adjusted margin)
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            justify-content: flex-start;
            align-items: center;
            margin-top: -2px;  // Negative margin to reduce space
        `;

        // Create submit button (smaller, less prominent)
        const submitButton = document.createElement('button');
        submitButton.style.cssText = `
            background-color: #d97706;
            color: #111827;
            border: none;
            border-bottom: 2px solid #92400e;
            padding: 0.25rem 0.75rem;
            font-size: 11px;
            cursor: pointer;
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 1px;
            transition: background-color 0.2s;
        `;
        submitButton.textContent = 'TRANSMIT';
        submitButton.onmouseover = () => {
            submitButton.style.backgroundColor = '#f59e0b';
            submitButton.style.borderBottomColor = '#d97706';
        };
        submitButton.onmouseout = () => {
            submitButton.style.backgroundColor = '#d97706';
            submitButton.style.borderBottomColor = '#92400e';
        };
        submitButton.onclick = () => this.handleSubmit();

        // Create bye button (smaller, less prominent)
        const byeButton = document.createElement('button');
        byeButton.style.cssText = `
            background-color: #374151;
            color: #fbbf24;
            border: none;
            border-bottom: 2px solid #1f2937;
            padding: 0.25rem 0.75rem;
            margin-left: 0.5rem;
            font-size: 11px;
            cursor: pointer;
            font-family: 'Share Tech Mono', monospace;
            letter-spacing: 1px;
            transition: background-color 0.2s;
        `;
        byeButton.textContent = 'GOOD BYE';
        byeButton.onmouseover = () => {
            byeButton.style.backgroundColor = '#4b5563';
            byeButton.style.borderBottomColor = '#374151';
        };
        byeButton.onmouseout = () => {
            byeButton.style.backgroundColor = '#374151';
            byeButton.style.borderBottomColor = '#1f2937';
        };
        byeButton.onclick = () => {
            this.chatService.addGoodbye();
            this.hide();
        };

        // Add keydown handler for Escape key
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });

        // Add keydown handler for Enter key
        this.textArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent new line in textarea
                this.handleSubmit(); // Call submit handler
            }
        });

        // Add blinking cursor animation
        const cursorStyle = document.createElement('style');
        cursorStyle.textContent = `
            @keyframes blink {
                0% { opacity: 1; }
                50% { opacity: 0; }
                100% { opacity: 1; }
            }
        `;
        document.head.appendChild(cursorStyle);

        // Assemble UI
        headerBar.appendChild(this.npcNameDisplay);
        headerBar.appendChild(spacer);
        headerBar.appendChild(closeButton);
        
        buttonContainer.appendChild(submitButton);
        buttonContainer.appendChild(byeButton);
        
        inputContainer.appendChild(this.textArea);
        inputContainer.appendChild(buttonContainer);
        
        this.container.appendChild(topDecoration);
        this.container.appendChild(headerBar);
        this.container.appendChild(this.outputBlock);
        this.container.appendChild(inputContainer);
        
        document.body.appendChild(this.container);
    }

    setNPC(npc) {
        this.currentNPC = npc;
        if (!this.container) {
            this.create();  // Create the UI elements if they don't exist
        }
        if (npc && npc.name) {
            this.npcNameDisplay.textContent = `${npc.name.toUpperCase()}`;
        } else {
            this.npcNameDisplay.textContent = '';
        }
    }

    show() {
        if (!this.container) {
            this.create();
        }
        if (!this.currentNPC) {
            console.log("No NPC selected for conversation");
            return;
        }
        this.container.style.display = 'block';
        this.isVisible = true;
        ChatUI.isActive = true;
        
        // Focus camera on NPC
        if (window.gameCamera) {  // Assuming gameCamera is accessible globally
            window.gameCamera.focusOnNPC(this.currentNPC);
        }
        
        this.textArea.focus();
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
            ChatUI.isActive = false;
            
            // Clear NPC focus and return to normal camera
            if (window.gameCamera) {
                window.gameCamera.clearNPCFocus();
            }
        }
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    async handleSubmit() {
        const question = this.textArea.value.trim();
        if (!question) return;

        this.outputBlock.textContent = 'Thinking...';
        this.textArea.value = '';

        try {
            // Switch to player focus
            if (window.gameCamera) {
                console.log("Switching to player focus while waiting for response");
                window.gameCamera.focusOnPlayer();
            }

            // After 1 second, switch back to NPC regardless of API status
            setTimeout(() => {
                if (window.gameCamera) {
                    console.log("Switching back to NPC focus after delay");
                    window.gameCamera.clearWaitingFocus();
                    window.gameCamera.focusOnNPC(this.currentNPC);
                }
            }, 1000);

            // Start the API call immediately
            await this.streamResponse(question);
        } catch (error) {
            this.outputBlock.textContent = `Error: ${error.message}`;
        }
    }

    async streamResponse(question) {
        this.outputBlock.textContent = '';
        await this.chatService.streamChat(question, (content) => {
            this.outputBlock.textContent += content;
        }, this.currentNPC);
    }

    async handleChat(question) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        const userDiv = document.createElement('div');
        userDiv.className = 'user-message';
        userDiv.textContent = question;
        messageDiv.appendChild(userDiv);
        
        const aiDiv = document.createElement('div');
        aiDiv.className = 'ai-message';
        messageDiv.appendChild(aiDiv);
        
        this.outputBlock.appendChild(messageDiv);
        
        // Auto-scroll to bottom when adding new message
        this.outputBlock.scrollTop = this.outputBlock.scrollHeight;

        await this.chatService.streamChat(
            question,
            (content) => {
                aiDiv.textContent += content;
                // Auto-scroll as content streams in
                this.outputBlock.scrollTop = this.outputBlock.scrollHeight;
            },
            this.currentNPC
        );
    }
}