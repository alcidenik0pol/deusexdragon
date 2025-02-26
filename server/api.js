import express from 'express';
import { dbService } from '../db/dbService.js';
import { initializeDatabase } from '../db/schema.js';

const router = express.Router();

// Initialize database on server start
initializeDatabase().catch(console.error);

// Logging middleware
router.use((req, res, next) => {
    console.log('API Request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query
    });
    next();
});

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// NPC APIs
router.get('/npc/:id', asyncHandler(async (req, res) => {
    const npc = await dbService.getNPC(req.params.id);
    if (!npc) {
        res.status(404).json({ error: 'NPC not found' });
        return;
    }
    res.json(npc);
}));

router.post('/npc', asyncHandler(async (req, res) => {
    console.log('Creating NPC with data:', req.body);
    const id = await dbService.createNPC(req.body);
    res.json({ id });
}));

// Conversation APIs
router.post('/conversation', asyncHandler(async (req, res) => {
    const id = await dbService.createConversation(req.body.npcId);
    res.json({ id });
}));

router.post('/message', asyncHandler(async (req, res) => {
    const id = await dbService.addMessage(
        req.body.conversationId,
        req.body.sender,
        req.body.content
    );
    res.json({ id });
}));

router.get('/conversation/:id/messages', asyncHandler(async (req, res) => {
    const messages = await dbService.getConversationHistory(req.params.id);
    res.json(messages);
}));

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

export default router; 