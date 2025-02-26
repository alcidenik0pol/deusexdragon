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
        // Create main container
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 10px;
            display: none;
            width: 80%;
            max-width: 600px;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            right: 10px;
            top: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        `;
        closeButton.onclick = () => this.hide();

        // Create text area
        this.textArea = document.createElement('textarea');
        this.textArea.style.cssText = `
            width: 100%;
            height: 100px;
            margin-bottom: 10px;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 5px;
            padding: 10px;
            font-family: Arial, sans-serif;
        `;

        // Create output block
        this.outputBlock = document.createElement('div');
        this.outputBlock.style.cssText = `
            width: 100%;
            min-height: 150px;
            max-height: 300px;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            white-space: pre-wrap;
        `;

        // Create submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Send';
        submitButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        `;
        submitButton.onclick = () => this.handleSubmit();

        // Create bye button
        const byeButton = document.createElement('button');
        byeButton.textContent = 'Bye';
        byeButton.style.cssText = `
            background: #f44336;  // Red background for visibility
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
            margin-left: 10px;  // Add margin to separate from submit button
        `;
        byeButton.onclick = () => this.hide();  // Call hide method on click

        // Add NPC name display
        this.npcNameDisplay = document.createElement('div');
        this.npcNameDisplay.style.cssText = `
            color: white;
            font-size: 18px;
            margin-bottom: 10px;
            font-family: Arial, sans-serif;
            font-weight: bold;
        `;

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

        // Assemble UI
        this.container.appendChild(closeButton);
        this.container.appendChild(this.npcNameDisplay);
        this.container.appendChild(this.outputBlock);
        this.container.appendChild(this.textArea);
        this.container.appendChild(submitButton);
        this.container.appendChild(byeButton);  // Add bye button next to submit button
        document.body.appendChild(this.container);
    }

    setNPC(npc) {
        this.currentNPC = npc;
        if (npc && npc.name) {
            this.npcNameDisplay.textContent = `Speaking with ${npc.name}`;
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
        ChatUI.isActive = true;  // Set active state when showing
        this.textArea.focus();
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
            ChatUI.isActive = false;  // Clear active state when hiding
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
            await this.streamResponse(question);
        } catch (error) {
            this.outputBlock.textContent = `Error: ${error.message}`;
        }
    }

    async streamResponse(question) {
        this.outputBlock.textContent = '';
        
        await this.chatService.streamChat(question, (content) => {
            this.outputBlock.textContent += content;
        }, this.currentNPC);  // Pass the current NPC to the chat service
    }
} 