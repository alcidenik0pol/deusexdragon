"use strict";
// import sqlite3 from 'sqlite3';
// import { NPCData, Message } from '../shared/types.js';
// export class Database {
//   private db: sqlite3.Database;
//   constructor() {
//     this.db = new sqlite3.Database('./game.db');
//     this.initialize().catch(console.error);
//   }
//   private async initialize(): Promise<void> {
//     const schema = `
//       CREATE TABLE IF NOT EXISTS npcs (
//         id TEXT PRIMARY KEY,
//         name TEXT NOT NULL,
//         persona TEXT NOT NULL,
//         position TEXT NOT NULL,
//         model_path TEXT NOT NULL,
//         scene TEXT NOT NULL,
//         rotation REAL NOT NULL,
//         scale REAL NOT NULL,
//         interaction_radius REAL NOT NULL,
//         initial_memories TEXT NOT NULL
//       );
//       CREATE TABLE IF NOT EXISTS conversations (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         npc_id TEXT NOT NULL,
//         timestamp INTEGER NOT NULL,
//         FOREIGN KEY (npc_id) REFERENCES npcs(id)
//       );
//       CREATE TABLE IF NOT EXISTS messages (
//         id INTEGER PRIMARY KEY AUTOINCREMENT,
//         conversation_id INTEGER NOT NULL,
//         sender TEXT NOT NULL,
//         content TEXT NOT NULL,
//         timestamp INTEGER NOT NULL,
//         FOREIGN KEY (conversation_id) REFERENCES conversations(id)
//       );
//     `;
//     return new Promise((resolve, reject) => {
//       this.db.exec(schema, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });
//   }
//   async createNPC(npc: NPCData): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const query = `
//         INSERT OR REPLACE INTO npcs (
//           id, name, persona, position, model_path, scene, 
//           rotation, scale, interaction_radius, initial_memories
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//       `;
//       this.db.run(
//         query, 
//         [
//           npc.id,
//           npc.name,
//           npc.persona,
//           JSON.stringify(npc.position),
//           npc.model_path,
//           npc.scene,
//           npc.rotation,
//           npc.scale,
//           npc.interactionRadius,
//           JSON.stringify(npc.initialMemories)
//         ],
//         (err) => {
//           if (err) {
//             console.error('Database error:', err);
//             reject(err);
//           } else {
//             resolve();
//           }
//         }
//       );
//     });
//   }
//   async getNPC(id: string): Promise<NPCData | null> {
//     return new Promise((resolve, reject) => {
//       this.db.get(
//         'SELECT * FROM npcs WHERE id = ?',
//         [id],
//         (err, row: any) => {
//           if (err) reject(err);
//           if (!row) resolve(null);
//           else {
//             resolve({
//               id: row.id,
//               name: row.name,
//               persona: row.persona,
//               position: JSON.parse(row.position),
//               model_path: row.model_path,
//               scene: row.scene,
//               rotation: row.rotation,
//               scale: row.scale,
//               interactionRadius: row.interaction_radius,
//               initialMemories: JSON.parse(row.initial_memories)
//             });
//           }
//         }
//       );
//     });
//   }
//   // ... rest of the methods ...
// }
// export const db = new Database(); 
