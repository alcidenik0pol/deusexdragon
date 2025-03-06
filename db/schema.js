import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new sqlite3.Database(join(__dirname, 'game.db'));

const schema = `
-- NPCs Table
CREATE TABLE IF NOT EXISTS npcs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  persona TEXT NOT NULL,
  position TEXT NOT NULL,
  model_path TEXT NOT NULL,  -- Will now store JSON string of animation paths
  current_animation TEXT NOT NULL DEFAULT 'idle'
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  npc_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (npc_id) REFERENCES npcs(id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
`;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error initializing database:', err);
        reject(err);
      } else {
        console.log('Database initialized successfully');
        resolve();
      }
    });
  });
}

export { db, initializeDatabase }; 