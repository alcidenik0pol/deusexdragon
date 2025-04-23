import sqlite3 from 'sqlite3';
export class Database {
    constructor() {
        this.db = new sqlite3.Database('./game.db');
        this.initialize();
    }
    async initialize() {
        const schema = `
      CREATE TABLE IF NOT EXISTS npcs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        persona TEXT NOT NULL,
        position TEXT NOT NULL,
        model_path TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        npc_id TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (npc_id) REFERENCES npcs(id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      );
    `;
        return new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async createNPC(npc) {
        return new Promise((resolve, reject) => {
            const { id, name, persona, position, animations, defaultAnimation } = npc;
            const query = `INSERT OR REPLACE INTO npcs (id, name, persona, position, model_path) 
                    VALUES (?, ?, ?, ?, ?)`;
            const model_path = animations[defaultAnimation] || '';
            this.db.run(query, [id, name, persona, JSON.stringify(position), model_path], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async getNPC(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM npcs WHERE id = ?', [id], (err, row) => {
                if (err)
                    reject(err);
                if (!row)
                    resolve(null);
                else {
                    const npcData = {
                        id: row.id,
                        name: row.name,
                        persona: row.persona,
                        position: JSON.parse(row.position),
                        animations: {
                            idle: row.model_path
                        },
                        defaultAnimation: 'idle',
                        scene: '',
                        rotation: 0,
                        scale: 1,
                        interactionRadius: 2,
                        initialMemories: []
                    };
                    resolve(npcData);
                }
            });
        });
    }
    async createConversation(npcId) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO conversations (npc_id, timestamp) VALUES (?, ?)`;
            this.db.run(query, [npcId, Date.now()], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
    }
    async addMessage(conversationId, sender, content) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO messages (conversation_id, sender, content, timestamp) 
                    VALUES (?, ?, ?, ?)`;
            this.db.run(query, [conversationId, sender, content, Date.now()], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
        });
    }
    async getConversationHistory(conversationId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM messages 
                    WHERE conversation_id = ? 
                    ORDER BY timestamp ASC`;
            this.db.all(query, [conversationId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
}
export const db = new Database();
