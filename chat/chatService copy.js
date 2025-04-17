import { config } from '../config/env.js';

export class ChatService {
  constructor() {
    console.log('ChatService initialized');
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'google/gemini-2.5-pro-exp-03-25:free';
    // Add conversation history storage - a Map with NPC IDs as keys
    this.conversationHistories = new Map();
  }

  /**
   * Get or create a conversation history for an NPC
   * @param {object} npc - The NPC object
   * @returns {Array} - The conversation history array
   */
  getConversationHistory(npc) {
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
    
    // Optional: Limit history length to prevent token overflow
    const MAX_HISTORY_LENGTH = 10; // Adjust as needed
    if (history.length > MAX_HISTORY_LENGTH) {
      history.shift(); // Remove oldest message
    }
  }

  /**
   * Clear conversation history for an NPC
   * @param {object} npc - The NPC object
   */
  clearHistory(npc) {
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
      // Use NPC persona if available, otherwise fallback to generic description
      const npcName = npc?.name || 'NPC';
      const npcPersona = npc?.persona || `an NPC in this world`;
      const npcContext = `You are ${npcName}, ${npcPersona}. Always respond concisely in 2-3 sentences maximum.`;
      console.log(`Using NPC context: ${npcContext.substring(0, 100)}...`);

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
      if (conversationHistory.length === 0 || 
          conversationHistory[conversationHistory.length - 1].role !== 'user' ||
          conversationHistory[conversationHistory.length - 1].content !== content) {
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
      } finally {
        console.log('Closing reader');
        reader.cancel();
        
        // Display the complete response
        console.log('Complete response from NPC:');
        console.log(accumulatedResponse);
        
        // Add the assistant's response to history
        this.addToHistory(npc, 'assistant', accumulatedResponse);
        
        handleComplete(fullResponse);
      }
    } catch (error) {
      console.error('Error in streamChat:', error);
      handleError(error);
    }
  }

  /**
   * Utility method to handle stream with Promise
   * @param {string} content - The user's message content
   * @param {object} npc - The NPC the player is talking to
   * @returns {Promise<{fullResponse: string, stream: ReadableStream}>}
   */
  streamChatAsPromise(content, npc) {
    return new Promise((resolve, reject) => {
      let fullResponse = '';
      
      try {
        // Create a TransformStream to handle the text chunks
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        
        const handleChunk = (chunk) => {
          try {
            fullResponse += chunk;
            writer.write(new TextEncoder().encode(chunk))
              .catch(err => {
                console.error('Error writing to stream:', err);
              });
          } catch (error) {
            console.error('Error in chunk handler:', error);
          }
        };
        
        const handleComplete = () => {
          try {
            writer.close();
            console.log('Stream completed successfully, resolving promise');
            resolve({ fullResponse, stream: readable });
          } catch (error) {
            console.error('Error completing stream:', error);
            reject(error);
          }
        };
        
        const handleError = (error) => {
          console.error('Error in stream:', error);
          try {
            writer.abort(error);
          } catch (abortError) {
            console.error('Error aborting writer:', abortError);
          }
          reject(error);
        };
        
        this.streamChat(content, npc, handleChunk, handleComplete, handleError);
      } catch (error) {
        console.error('Error setting up stream promise:', error);
        reject(error);
      }
    });
  }
}