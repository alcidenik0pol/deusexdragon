const dbService = require('./dbService');
const { initializeDatabase } = require('./schema');

async function example() {
    // Initialize the database
    await initializeDatabase();

    // Create an NPC
    const npc = {
        id: 'npc1',
        name: 'John Doe',
        persona: 'A friendly shopkeeper',
        position: { x: 0, y: 0, z: 0 },
        model_path: '/models/shopkeeper.glb'
    };
    await dbService.createNPC(npc);

    // Start a conversation
    const conversationId = await dbService.createConversation('npc1');

    // Add some messages
    await dbService.addMessage(conversationId, 'user', 'Hello!');
    await dbService.addMessage(conversationId, 'npc', 'Welcome to my shop!');

    // Get conversation history
    const history = await dbService.getConversationHistory(conversationId);
    console.log('Conversation history:', history);
}

// Run the example
example().catch(console.error); 