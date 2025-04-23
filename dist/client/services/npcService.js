class NPCService {
    async fetchAPI(path, options = {}) {
        const response = await fetch(`/api${path}`, options);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'API request failed');
        }
        return response.json();
    }
    async getNPC(id) {
        return this.fetchAPI(`/npc/${id}`);
    }
    async createNPC(npc) {
        console.log('Sending NPC data to server:', npc);
        await this.fetchAPI('/npc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(npc)
        });
    }
    async startConversation(npcId) {
        const response = await this.fetchAPI('/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ npcId })
        });
        return response.id;
    }
    async addMessage(conversationId, sender, content) {
        await this.fetchAPI('/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId, sender, content })
        });
    }
    async getConversationHistory(conversationId) {
        return this.fetchAPI(`/conversation/${conversationId}/messages`);
    }
}
export const npcService = new NPCService();
