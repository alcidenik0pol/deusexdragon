import { config } from '../config/env.js';
import { userSettings } from './userSettings.js';
import { getModelConfig, supportsSystemMessages, buildDialoguePrompt, buildUserPromptWithContext, getFallbackResponse } from '../config/llm.js';

export class ChatService {
  constructor() {
    console.log('ChatService initialized');
    this.apiKey = config.OPENROUTER_API_KEY;
    this.baseUrl = config.OPENROUTER_API_URL;
    
    // Listen for model changes
    window.addEventListener('modelChanged', this._handleModelChange.bind(this));
    
    // Initialize with current model from userSettings
    this._handleModelChange();
    
    // Conversation history storage - a Map with NPC IDs as keys
    this.conversationHistories = new Map();
  }
  
  _handleModelChange() {
    // Update the model from userSettings
    this.model = userSettings.currentModel;
    console.log(`ChatService using model: ${this.model}`);
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
    
    // Strictly limit history length based on current model
    const currentModel = userSettings.currentModel;
    const modelConfig = getModelConfig(currentModel, 'dialogue');
    
    if (history.length > modelConfig.max_history_length) {
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
    
    // Instead of deleting the history, just log that we're keeping it
    // this.conversationHistories.delete(npcId);
    console.log(`Keeping conversation history for NPC: ${npcId}`);
    
    // Optionally, if you want to see what's in the history:
    const history = this.getConversationHistory(npc);
    console.log(`Current history has ${history.length} messages`);
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
    
    // Clear any "thinking" message when we start receiving actual content
    const handleChunk = typeof onChunk === 'function' ? 
        (chunk) => {
            if (chunk.trim()) {  // Only process non-empty chunks
                onChunk(chunk);
            }
        } : 
        (chunk) => {};
    
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
      // Build NPC context using centralized prompt builder
      const npcName = npc?.name || 'NPC';
      const npcPersona = npc?.persona || `a citizen in Deus Ex world`;
      const currentModel = userSettings.currentModel;
      
      // Get conversation history for this NPC
      const conversationHistory = this.getConversationHistory(npc);
      
      // Add the user's message to history before sending
      this.addToHistory(npc, 'user', content);

      let messages;
      let contextInfo; // For logging
      
      // Check if model supports system messages
      if (!supportsSystemMessages(currentModel)) {
        console.log(`Model ${currentModel} doesn't support system messages, using user prompt with context`);
        
        // For models without system support, embed everything in user messages
        const contextualPrompt = buildUserPromptWithContext(npcName, npcPersona, npc?.questDetails, content);
        messages = [{ role: 'user', content: contextualPrompt }];
        contextInfo = `User-embedded context for ${npcName}`;
        
        // Add previous conversation history as user/assistant pairs (but simplified)
        const recentHistory = conversationHistory.slice(-4); // Only last 2 exchanges
        recentHistory.forEach(msg => {
          if (msg.role === 'user') {
            messages.push({ role: 'user', content: `Player: ${msg.content}` });
          } else {
            messages.push({ role: 'assistant', content: `${npcName}: ${msg.content}` });
          }
        });
      } else {
        // Standard approach for models with system message support
        const npcContext = buildDialoguePrompt(npcName, npcPersona, npc?.questDetails, currentModel);
        contextInfo = npcContext;
        
        messages = [
          { role: 'system', content: npcContext },
          ...conversationHistory // Include previous conversation history
        ];
        
        // Don't add the user message again if it's already the last one in history
        const lastMessage = conversationHistory.length > 0 ? 
                             conversationHistory[conversationHistory.length - 1] : null;
                             
        if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== content) {
          messages.push({ role: 'user', content });
        }
      }
      
      // Get model-specific configuration
      const modelConfig = getModelConfig(currentModel, 'dialogue');
      
      const requestBody = {
        model: userSettings.currentModel,
        messages: messages,
        stream: modelConfig.stream,
        temperature: modelConfig.temperature,
        max_tokens: modelConfig.max_tokens
      };
      
      console.log(`Sending request to ${this.baseUrl} with model: ${userSettings.currentModel}`);
      console.log(`Including ${conversationHistory.length} previous messages in context`);
      console.log("Context info:", contextInfo);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Deus Ex Dragon'
        },
        body: JSON.stringify(requestBody),
      });

      // Handle all HTTP error statuses
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorData}`);
        
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        
        // Specific error messages for common issues
        if (response.status === 401) {
          errorMessage = 'API key is invalid, expired, or has insufficient credits. Please check your OpenRouter account.';
          console.error('401 Unauthorized - Possible causes:');
          console.error('1. API key is invalid or expired');
          console.error('2. Insufficient credits on account');
          console.error('3. API key has been revoked/disabled');
          console.error('4. Model may not be available anymore');
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait before making more requests.';
        } else if (response.status === 402) {
          errorMessage = 'Payment required. Please add credits to your OpenRouter account.';
        }
        
        // Show the error in UI if available
        if (window.debugUI) {
          window.debugUI.showApiError({ 
            code: response.status, 
            message: errorMessage,
            details: errorData 
          });
        }
        
        throw new Error(errorMessage);
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
                
                // When we get an unexpected format or error
                if (!parsed.choices) {
                    console.warn('Unexpected API response format:', parsed);
                    // Pass the entire parsed object
                    if (window.debugUI) {
                        window.debugUI.showApiError(parsed);
                    }
                    continue;
                }

                // Check for API errors
                if (parsed.error) {
                    console.error('API returned error:', parsed.error);
                    // Show the error in UI
                    if (window.debugUI) {
                        window.debugUI.showApiError(parsed.error);
                    }
                    continue;
                }

                const contentChunk = parsed.choices?.[0]?.delta?.content;
                
                if (contentChunk) {
                  // Add to accumulated response
                  accumulatedResponse += contentChunk;
                  
                  // Keep minimal logging for debugging
                  console.log(`Received chunk: "${contentChunk.substring(0, 20)}${contentChunk.length > 20 ? '...' : ''}"`);
                  
                  fullResponse += contentChunk;
                  handleChunk(contentChunk);
                }
              } catch (e) {
                // Log the problematic data
                console.warn('Error parsing JSON from stream:', e.message);
                console.warn('Problematic data:', data);
                // Show parsing error in UI
                if (window.debugUI) {
                    window.debugUI.showApiError({
                        message: `Stream parsing error: ${e.message}`
                    });
                }
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
      
      // Add this line to show the error in UI
      if (window.debugUI) window.debugUI.showApiError(error);
      
      // Provide a fallback response if the API fails
      const fallbackResponse = getFallbackResponse();
      
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