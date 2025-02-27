import { config } from '../config/env.js';

export class ChatService {
    constructor() {
        if (!config.OPENROUTER_API_KEY) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }
        this.API_KEY = config.OPENROUTER_API_KEY;
        this.conversationHistory = [];
    }

    addGoodbye() {
        const message = {
            timestamp: new Date().toISOString(),
            npcId: null,
            npcName: null,
            userMessage: "Good bye",
            aiResponse: ""
        };
        this.conversationHistory.push(message);
        console.log('Conversation History:', this.conversationHistory);
    }

    async streamChat(question, onContent, npc = null) {
        // Add message to history
        const message = {
            timestamp: new Date().toISOString(),
            npcId: npc?.id || null,
            npcName: npc?.name || null,
            userMessage: question,
            aiResponse: ''
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Deus Ex Dragon'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-pro-exp-02-05:free',
                messages: [
                    { role: 'system', content: (npc?.persona || 'You are a character in a 3D game.') + ' Always respond concisely in 2-3 sentences maximum.' },
                    ...this.conversationHistory.map(entry => ([
                        { role: 'user', content: entry.userMessage },
                        { role: 'assistant', content: entry.aiResponse }
                    ])).flat(),
                    { role: 'user', content: question }
                ],
                stream: true,
                max_tokens: 150,
                temperature: 0.3,
            }),
        });

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                while (true) {
                    const lineEnd = buffer.indexOf('\n');
                    if (lineEnd === -1) break;

                    const line = buffer.slice(0, lineEnd).trim();
                    buffer = buffer.slice(lineEnd + 1);

                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0].delta.content;
                            if (content) {
                                fullResponse += content;
                                onContent(content);
                            }
                        } catch (e) {
                            // Ignore invalid JSON
                        }
                    }
                }
            }
        } finally {
            reader.cancel();
        }

        // Update message with full response and add to history
        message.aiResponse = fullResponse || '...';
        this.conversationHistory.push(message);
        
        // Log the conversation history
        console.log('Conversation History:', this.conversationHistory);
    }
} 