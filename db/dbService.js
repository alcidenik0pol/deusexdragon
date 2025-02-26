import { db, initializeDatabase } from './schema.js';

class DbService {
    // NPC operations
    async createNPC(npc) {
        return new Promise((resolve, reject) => {
            const { id, name, persona, position, model_path } = npc;
            const query = `INSERT INTO npcs (id, name, persona, position, model_path) 
                          VALUES (?, ?, ?, ?, ?)`;
            
            db.run(query, [id, name, persona, JSON.stringify(position), model_path], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }

    async getNPC(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM npcs WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                if (row) row.position = JSON.parse(row.position);
                resolve(row);
            });
        });
    }

    // Conversation operations
    async createConversation(npcId) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const query = `INSERT INTO conversations (npc_id, timestamp) VALUES (?, ?)`;
            
            db.run(query, [npcId, timestamp], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }

    async addMessage(conversationId, sender, content) {
        return new Promise((resolve, reject) => {
            const timestamp = Date.now();
            const query = `INSERT INTO messages (conversation_id, sender, content, timestamp) 
                          VALUES (?, ?, ?, ?)`;
            
            db.run(query, [conversationId, sender, content, timestamp], function(err) {
                if (err) reject(err);
                resolve(this.lastID);
            });
        });
    }

    async getConversationHistory(conversationId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM messages 
                          WHERE conversation_id = ? 
                          ORDER BY timestamp ASC`;
            
            db.all(query, [conversationId], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }
}

export const dbService = new DbService(); 