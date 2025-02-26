class NPCService {
    async getNPC(id) {
        try {
            const response = await fetch(`/api/npc/${id}`);
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch NPC');
            }
            return response.json();
        } catch (error) {
            console.error('Error fetching NPC:', error);
            throw error;
        }
    }

    async createNPC(npc) {
        try {
            const response = await fetch('/api/npc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(npc)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create NPC');
            }
            return response.json();
        } catch (error) {
            console.error('Error creating NPC:', error);
            throw error;
        }
    }

    async startConversation(npcId) {
        const response = await fetch('/api/conversation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ npcId })
        });
        if (!response.ok) throw new Error('Failed to start conversation');
        return response.json();
    }

    async addMessage(conversationId, sender, content) {
        const response = await fetch('/api/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversationId, sender, content })
        });
        if (!response.ok) throw new Error('Failed to add message');
        return response.json();
    }

    async getConversationHistory(conversationId) {
        const response = await fetch(`/api/conversation/${conversationId}/messages`);
        if (!response.ok) throw new Error('Failed to fetch conversation history');
        return response.json();
    }
}

export const npcService = new NPCService(); 