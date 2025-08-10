/**
 * LLM Configuration - Model-Specific Settings
 * Each model has its own capabilities and optimal parameters
 * Last updated: December 2024
 */

export const LLM_CONFIG = {
    // === MODEL-SPECIFIC CONFIGURATIONS ===
    MODELS: {
        'google/gemma-3-27b-it:free': {
            provider: 'google',
            supports_system: false,
            dialogue: {
                temperature: 0.8,
                max_tokens: 800,
                max_history_length: 4,
                stream: true
            },
            resolution: {
                temperature: 0.2,
                max_tokens: 50,
                stream: false
            }
        },
        'qwen/qwen3-14b-04-28:free': {
            provider: 'qwen',
            supports_system: true,
            dialogue: {
                temperature: 0.7,
                max_tokens: 1000,
                max_history_length: 6,
                stream: true
            },
            resolution: {
                temperature: 0.1,
                max_tokens: 100,
                stream: false
            }
        },
        'openai/gpt-oss-20b:free': {
            provider: 'openai',
            supports_system: true,
            dialogue: {
                temperature: 0.7,
                max_tokens: 1200,
                max_history_length: 8,
                stream: true
            },
            resolution: {
                temperature: 0.05,
                max_tokens: 150,
                stream: false
            }
        },
        'deepseek/deepseek-chat-v3-0324:free': {
            provider: 'deepseek',
            supports_system: true,
            dialogue: {
                temperature: 0.6,
                max_tokens: 1000,
                max_history_length: 6,
                stream: true
            },
            resolution: {
                temperature: 0.1,
                max_tokens: 200,
                stream: false
            }
        },
        'deepseek/deepseek-r1-0528:free': {
            provider: 'deepseek',
            supports_system: true,
            dialogue: {
                temperature: 0.5,
                max_tokens: 800,
                max_history_length: 5,
                stream: true
            },
            resolution: {
                temperature: 0.05,
                max_tokens: 300,
                stream: false
            }
        },
        'deepseek/deepseek-r1:free': {
            provider: 'deepseek',
            supports_system: true,
            dialogue: {
                temperature: 0.5,
                max_tokens: 800,
                max_history_length: 5,
                stream: true
            },
            resolution: {
                temperature: 0.05,
                max_tokens: 300,
                stream: false
            }
        }
    },
    
    // === FALLBACK DEFAULTS ===
    DEFAULT: {
        supports_system: true,
        dialogue: {
            temperature: 0.7,
            max_tokens: 1000,
            max_history_length: 5,
            stream: true
        },
        resolution: {
            temperature: 0.1,
            max_tokens: 300,
            stream: false
        }
    },
    
    // === PROMPT TEMPLATES ===
    PROMPTS: {
        // Standard system message format
        SYSTEM_DIALOGUE: (npcName, npcPersona, questInfo) => 
            `You are ${npcName}, ${npcPersona}. ${questInfo}`,
        
        // For models without system support - embed in user message
        USER_WITH_CONTEXT: (npcName, npcPersona, questInfo, userMessage) => 
            `${questInfo ? questInfo + '\n\n' : ''}You are ${npcName}, ${npcPersona}.\n\nPlayer: ${userMessage}\n\n${npcName}:`,
        
        // Quest information template
        QUEST_INFO: (questDetails) => questDetails ? `
IMPORTANT INFORMATION:
${questDetails.relevantInfo.join('\n')}

YOUR CONNECTIONS:
${questDetails.connections.join('\n')}

HOW TO RESPOND:
${questDetails.playerObjectives.join('\n')}

Always stay in character and keep responses brief (2-3 sentences maximum). DO NOT include any action text, asterisks, or descriptions of physical actions.
` : '',
        
        // Resolution evaluation prompt
        EVALUATION: (conversationContext, condition) => `
You are evaluating a conversation in a video game to determine if a specific objective has been completed.

${conversationContext}

CRITICAL INSTRUCTION:
Reply with EXACTLY ONE WORD, either "yes" or "no".
Do not include any other text, explanation, punctuation, or whitespace.

QUESTION: ${condition}

ONE-WORD ANSWER:`,
        
        // Conversation formatting
        CONVERSATION_FORMAT: (npcName, npcId, history) => {
            let formatted = `Conversation between Player and ${npcName} (${npcId}):\n\n`;
            history.forEach(msg => {
                const speaker = msg.role === 'user' ? 'Player' : npcName;
                formatted += `${speaker}: ${msg.content}\n`;
            });
            return formatted;
        },
        
        // Fallback response
        FALLBACK_RESPONSE: "I'm sorry, I seem to be having trouble with my communication systems right now. Could you try again in a moment?"
    },
    
    // === SHARED SETTINGS ===
    SHARED: {
        api_headers: {
            'Content-Type': 'application/json',
            'HTTP-Referer': () => window.location.origin,
            'X-Title': 'Deus Ex Dragon'
        },
        retry_attempts: 3,
        retry_delay: 1000,
        enable_logging: true
    }
};

// === CONVENIENCE FUNCTIONS ===

// Get model-specific configuration
export const getModelConfig = (modelId, type = 'dialogue') => {
    const modelConfig = LLM_CONFIG.MODELS[modelId] || LLM_CONFIG.DEFAULT;
    return modelConfig[type] || LLM_CONFIG.DEFAULT[type];
};

// Check if model supports system messages
export const supportsSystemMessages = (modelId) => {
    const modelConfig = LLM_CONFIG.MODELS[modelId] || LLM_CONFIG.DEFAULT;
    return modelConfig.supports_system !== false;
};

// Build dialogue prompt (system or user-embedded)
export const buildDialoguePrompt = (npcName, npcPersona, questDetails, currentModel) => {
    const questInfo = LLM_CONFIG.PROMPTS.QUEST_INFO(questDetails);
    
    if (supportsSystemMessages(currentModel)) {
        return LLM_CONFIG.PROMPTS.SYSTEM_DIALOGUE(npcName, npcPersona, questInfo);
    }
    
    return null; // Will use user-embedded format instead
};

export const buildUserPromptWithContext = (npcName, npcPersona, questDetails, userMessage) => {
    const questInfo = LLM_CONFIG.PROMPTS.QUEST_INFO(questDetails);
    return LLM_CONFIG.PROMPTS.USER_WITH_CONTEXT(npcName, npcPersona, questInfo, userMessage);
};

export const buildResolutionPrompt = (conversationContext, condition) => {
    return LLM_CONFIG.PROMPTS.EVALUATION(conversationContext, condition);
};

export const formatConversation = (npcName, npcId, history) => {
    return LLM_CONFIG.PROMPTS.CONVERSATION_FORMAT(npcName, npcId, history);
};

export const getFallbackResponse = () => {
    return LLM_CONFIG.PROMPTS.FALLBACK_RESPONSE;
};
