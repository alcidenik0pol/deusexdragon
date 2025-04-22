import { ChatService } from './chatService.js';

export class ChatUI {
    static isActive = false;  // Static property to track chat state

    constructor() {
        this.container = null;
        this.textArea = null;
        this.outputBlock = null;
        this.isVisible = false;
        this.chatService = new ChatService();
        this.currentNPC = null;
        
        // Make the chatUI instance globally accessible
        window.chatUI = this;
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
            font-size: 14px;
            line-height: 1.2;
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
            // Say goodbye and clear conversation history
            this.handleGoodbye();
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
        
        // Display any previous conversation history
        this.displayConversationHistory();
    }
    
    // Display conversation history for the current NPC
    displayConversationHistory() {
        if (!this.currentNPC) return;
        
        // Clear the output block
        this.outputBlock.textContent = '';
        
        // Get conversation history for the current NPC
        const history = this.chatService.getConversationHistory(this.currentNPC);
        
        // Display each message
        if (history && history.length > 0) {
            // Only show assistant messages in history
            for (const message of history) {
                if (message.role === 'assistant') {
                    this.outputBlock.textContent += message.content + '\n';
                }
            }
        }
        
        // Scroll to the bottom
        this.outputBlock.scrollTop = this.outputBlock.scrollHeight;
    }

    show() {
        this.container.style.display = 'block';
        this.isVisible = true;
        ChatUI.isActive = true;
        
        // Focus camera on NPC
        if (window.gameCamera) {
            window.gameCamera.focusOnNPC(this.currentNPC);
        }
        
        // Lock player controls when chat UI is shown
        const lockEvent = new CustomEvent('lockPlayerControls', { detail: true });
        window.dispatchEvent(lockEvent);
        
        // Stop character movement
        const stopEvent = new CustomEvent('stopCharacterMovement');
        window.dispatchEvent(stopEvent);
        
        // Create a bound function with proper 'this' context
        this.boundPreventHandler = (e) => {
            if (e.key.toLowerCase() === 'e') {
                e.stopPropagation();
                e.preventDefault();
                // Remove the listener immediately after handling the first 'e'
                document.removeEventListener('keydown', this.boundPreventHandler, true);
            }
        };
        
        // Add the event listener with the bound function
        document.addEventListener('keydown', this.boundPreventHandler, true);
        
        // Focus on the text area
        setTimeout(() => {
            this.textArea.focus();
            // Also remove the handler after a short delay as a backup
            setTimeout(() => {
                document.removeEventListener('keydown', this.boundPreventHandler, true);
            }, 100);
        }, 0);
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
    
            // Unlock player controls
            const event = new CustomEvent('lockPlayerControls', { detail: false });
            window.dispatchEvent(event);
    
            // Remove 'E' key prevention
            if (this.boundPreventHandler) {
                document.removeEventListener('keydown', this.boundPreventHandler, true);
            }
        }
    }

    // New method to handle goodbye button click
    async handleGoodbye() {
        if (!this.currentNPC) {
            this.hide();
            return;
        }
        
        // Reset color to original before displaying goodbye
        this.outputBlock.style.color = '#fbbf24';
        // Display a goodbye message
        this.outputBlock.textContent = "Goodbye!";
        
        // Clear the conversation history for this NPC
        this.chatService.clearHistory(this.currentNPC);
        
        // Wait a moment before hiding the UI
        setTimeout(() => {
            this.hide();
        }, 800);
    }

    preventEKeyDuringActivation(e) {
        if (e.key === 'e' && !this.isVisible) {
            e.stopPropagation();
            e.preventDefault();
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

        // Add the thinking message with character name and cyan color
        const thinkingMsg = `${this.currentNPC?.name || 'Character'} is thinking...`;
        this.outputBlock.textContent = thinkingMsg;
        this.outputBlock.style.color = '#8FEFEF'; // Light cyan color
        this.textArea.value = '';

        try {
            // Switch to player focus
            if (window.gameCamera) {
                window.gameCamera.focusOnPlayer();
            }

            // After 1 second, switch back to NPC regardless of API status
            setTimeout(() => {
                if (window.gameCamera) {
                    window.gameCamera.clearWaitingFocus();
                    window.gameCamera.focusOnNPC(this.currentNPC);
                }
            }, 1000);

            await this.streamResponse(question);
        } catch (error) {
            this.outputBlock.textContent = `Error: ${error.message}`;
            this.outputBlock.style.color = '#fbbf24'; // Reset to original color
        }
    }

    async streamResponse(question) {
        try {
            await this.chatService.streamChat(
                question,
                this.currentNPC,
                // Chunk handler
                (chunk) => {
                    // Only clear the "thinking" message when we get the first real chunk
                    if (this.outputBlock.textContent.includes('thinking...')) {
                        this.outputBlock.textContent = '';
                        this.outputBlock.style.color = '#fbbf24'; // Reset to original color
                    }
                    this.outputBlock.textContent += chunk;
                    // Auto-scroll as content streams in
                    this.outputBlock.scrollTop = this.outputBlock.scrollHeight;
                },
                // Complete handler
                (fullResponse) => {
                    // Filter out action text in asterisks for the full response too
                    const filteredResponse = fullResponse.replace(/\*[^*]*\*/g, '');
                    // Replace the current text with the filtered version
                    this.outputBlock.textContent = filteredResponse;
                    // Ensure we're scrolled to bottom when complete
                    this.outputBlock.scrollTop = this.outputBlock.scrollHeight;
                },
                // Error handler
                (error) => {
                    console.error("Error in chat response:", error);
                    if (this.outputBlock.textContent === '') {
                        this.outputBlock.textContent = `I'm having trouble communicating. Let's try again in a moment.`;
                    } else {
                        // If we already have some text, don't overwrite it with an error
                        console.log("Not displaying error because we already have partial response");
                    }
                }
            );
        } catch (error) {
            console.error("Fatal error in streamResponse:", error);
            this.outputBlock.textContent = `I'm having trouble with my communication systems. Let's try again later.`;
        }
    }
}