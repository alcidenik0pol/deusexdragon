import type { NPCData, Message } from '../../shared/types.js';

class NPCService {
    private async fetchAPI(path: string, options: RequestInit = {}) {
        const response = await fetch(`/api${path}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'API request failed');
        }
        return response.json();
    }

    async getNPC(id: string): Promise<NPCData> {
        return this.fetchAPI(`/npc/${id}`);
    }

    async createNPC(npc: NPCData): Promise<void> {
        console.log('Sending NPC data to server:', npc);
        await this.fetchAPI('/npc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(npc)
        });
    }

    async startConversation(npcId: string): Promise<number> {
        const response = await this.fetchAPI('/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ npcId })
        });
        return response.id;
    }

    async addMessage(conversationId: number, sender: 'user' | 'npc', content: string): Promise<void> {
        await this.fetchAPI('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, sender, content })
        });
    }

    async getConversationHistory(conversationId: number): Promise<Message[]> {
        return this.fetchAPI(`/conversation/${conversationId}/messages`);
    }
}

export const npcService = new NPCService(); 