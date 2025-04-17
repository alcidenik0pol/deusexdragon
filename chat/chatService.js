import { config } from '../config/env.js';

export class ChatService {
  constructor() {
    console.log('ChatService initialized');
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = config.OPENROUTER_API_URL;
    this.model = config.OPENROUTER_MODEL;
    // Conversation history storage - a Map with NPC IDs as keys
    this.conversationHistories = new Map();
  }

  /**
   * Get or create a conversation history for an NPC
   * @param {object} npc - The NPC object
   * @returns {Array} - The conversation history array
   */
  getConversationHistory(npc) {
    if (!npc) {
      console.warn('No NPC provided to getConversationHistory');
      return [];
    }
    
    // Use NPC ID or name as the key
    const npcId = npc?.id || npc?.name || 'unknown-npc';
    
    if (!this.conversationHistories.has(npcId)) {
      console.log(`Creating new conversation history for NPC: ${npcId}`);
      this.conversationHistories.set(npcId, []);
    }
    
    return this.conversationHistories.get(npcId);
  }

  /**
   * Add a message to the conversation history
   * @param {object} npc - The NPC object
   * @param {string} role - The role of the message sender ('user' or 'assistant')
   * @param {string} content - The message content
   */
  addToHistory(npc, role, content) {
    const history = this.getConversationHistory(npc);
    history.push({ role, content });
    
    // Strictly limit history length
    const MAX_HISTORY_LENGTH = 5; // Reduced from 10
    if (history.length > MAX_HISTORY_LENGTH) {
      history.shift();
    }
    
    // Evaluate conversation for objectives after NPC responses
    // and only after a meaningful exchange (at least 2 messages)
    if (role === 'assistant' && history.length >= 2 && window.resolutionManager) {
      // Use a slight delay to avoid blocking the UI
      setTimeout(() => {
        const npcId = npc?.id || npc?.name || 'unknown-npc';
        window.resolutionManager.evaluateConversation(npcId, history);
      }, 1000);
    }
  }

  /**
   * Clear conversation history for an NPC
   * @param {object} npc - The NPC object
   */
  clearHistory(npc) {
    if (!npc) {
      console.warn('No NPC provided to clearHistory');
      return;
    }
    
    const npcId = npc?.id || npc?.name || 'unknown-npc';
    this.conversationHistories.delete(npcId);
    console.log(`Cleared conversation history for NPC: ${npcId}`);
  }

  /**
   * Stream a chat response from the AI model
   * @param {string} content - The user's message content
   * @param {object} npc - The NPC the player is talking to
   * @param {function} onChunk - Callback function for each text chunk received
   * @param {function} onComplete - Callback function when streaming is complete
   * @param {function} onError - Callback function for handling errors
   * @returns {Promise<void>}
   */
  async streamChat(content, npc, onChunk = null, onComplete = null, onError = null) {
    if (!npc) {
      const error = new Error('No NPC provided to streamChat');
      console.error(error);
      if (onError) onError(error);
      return;
    }

    // Add this at the start of streamChat
    console.log("NPC Object Keys:", Object.keys(npc));
    console.log("questDetails exists:", npc.hasOwnProperty('questDetails'));
    console.log("questDetails value:", npc.questDetails);
    
    // Store the accumulated response
    let accumulatedResponse = '';
    
    // Default callbacks if not provided
    const handleChunk = typeof onChunk === 'function' ? onChunk : (chunk) => {
      // Just accumulate the chunk without default logging
      // We'll handle the display at the end
    };
    
    const handleComplete = typeof onComplete === 'function' ? onComplete : (response) => {
      // Display the complete response at the end
      console.log('Complete NPC response:');
      console.log(response);
    };
    
    const handleError = typeof onError === 'function' ? onError : (error) => {
      console.error('Default error handler:', error);
    };
    
    console.log(`Starting chat stream for message: "${content.substring(0, 50)}..." with NPC: ${npc?.name || 'Unknown'}`);
    
    try {
      // Modify this section in your streamChat function
      const npcName = npc?.name || 'NPC';
      const npcPersona = npc?.persona || `a citizen in Deus Ex world`;
      const questInfo = npc?.questDetails ? `
      IMPORTANT INFORMATION:
      ${npc.questDetails.relevantInfo.join('\n')}
      
      YOUR CONNECTIONS:
      ${npc.questDetails.connections.join('\n')}
      
      HOW TO RESPOND:
      ${npc.questDetails.playerObjectives.join('\n')}
      
      Always stay in character and keep responses brief (2-3 sentences maximum). DO NOT include any action text, asterisks, or descriptions of physical actions.
      ` : '';

      const npcContext = `You are ${npcName}, ${npcPersona}. ${questInfo}`;

      // Get conversation history for this NPC
      const conversationHistory = this.getConversationHistory(npc);
      
      // Add the user's message to history before sending
      this.addToHistory(npc, 'user', content);

      // Prepare request payload with history
      const messages = [
        { role: 'system', content: npcContext },
        ...conversationHistory // Include previous conversation history
      ];
      
      // Don't add the user message again if it's already the last one in history
      const lastMessage = conversationHistory.length > 0 ? 
                           conversationHistory[conversationHistory.length - 1] : null;
                           
      if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== content) {
        messages.push({ role: 'user', content });
      }
      
      const payload = {
        model: this.model,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000
      };
      
      console.log(`Sending request to ${this.baseUrl} with model: ${this.model}`);
      console.log(`Including ${conversationHistory.length} previous messages in context`);
      console.log("Full NPC Context being sent:", npcContext);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorData}`);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      console.log('Stream connection established, beginning to read chunks');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullResponse = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('Stream completed');
            break;
          }

          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;

            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);

            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('Received [DONE] signal');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const contentChunk = parsed.choices[0]?.delta?.content;
                
                if (contentChunk) {
                  // Add to accumulated response
                  accumulatedResponse += contentChunk;
                  
                  // Keep minimal logging for debugging
                  console.log(`Received chunk: "${contentChunk.substring(0, 20)}${contentChunk.length > 20 ? '...' : ''}"`);
                  
                  fullResponse += contentChunk;
                  handleChunk(contentChunk);
                }
              } catch (e) {
                console.warn('Error parsing JSON from stream:', e.message);
                // Continue processing despite JSON errors
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Stream reading error:', streamError);
        
        // If we have accumulated some response, save it
        if (accumulatedResponse) {
          console.log('Saving partial response before error:', accumulatedResponse);
          this.addToHistory(npc, 'assistant', accumulatedResponse);
          handleComplete(accumulatedResponse);
        } else {
          // If no response was accumulated, propagate the error
          throw streamError;
        }
      } finally {
        try {
          console.log('Closing reader');
          await reader.cancel();
        } catch (closeError) {
          console.warn('Error closing reader:', closeError);
        }
        
        // Only add to history and call complete if we haven't done so in the catch block
        if (fullResponse) {
          console.log('Complete response from NPC:');
          console.log(accumulatedResponse);
          
          // Add the assistant's response to history
          this.addToHistory(npc, 'assistant', accumulatedResponse);
          
          handleComplete(fullResponse);
        }
      }
    } catch (error) {
      console.error('Error in streamChat:', error);
      
      // Provide a fallback response if the API fails
      const fallbackResponse = `I'm sorry, I seem to be having trouble with my communication systems right now. Could you try again in a moment?`;
      
      // Add fallback response to history
      this.addToHistory(npc, 'assistant', fallbackResponse);
      
      // Send the fallback to the UI
      handleChunk(fallbackResponse);
      handleComplete(fallbackResponse);
      
      // Also call the error handler
      handleError(error);
    }
  }
}