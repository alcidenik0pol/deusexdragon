import { config } from '../config/env.js';

export class ResolutionManager {
  constructor() {
    this.levelConditions = {};
    this.completedConditions = {};
    this.levelPoints = {};
    this.levelThresholds = {};
    this.apiKey = config.OPENROUTER_API_KEY;
    this.evaluationEndpoint = config.OPENROUTER_API_URL;
    this.evaluationModel = config.OPENROUTER_MODEL;
    
    // Clear sessionStorage on fresh page load
    if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
        console.log('[ResolutionManager] Page reload detected, clearing session state');
        sessionStorage.removeItem('gameProgress');
    }
    
    // Initialize from sessionStorage if available
    this.loadProgressState();
    
    console.log('ResolutionManager initialized');
  }
  
  registerLevel(levelId, conditions, pointThreshold) {
    this.levelConditions[levelId] = conditions;
    this.levelThresholds[levelId] = pointThreshold;
    this.levelPoints[levelId] = this.levelPoints[levelId] || 0;
    console.log(`Registered level ${levelId} with ${conditions.length} conditions and threshold ${pointThreshold}`);
  }
  
  async evaluateConversation(npcId, conversationHistory) {
    const currentLevel = this.getCurrentLevel();
    const conditions = this.levelConditions[currentLevel] || [];
    
    // Filter conditions that apply to this NPC and aren't already completed
    const applicableConditions = conditions.filter(condition => 
      (condition.npcIds.includes(npcId) || 
       condition.npcIds.includes("ANY")) && 
      !this.completedConditions[condition.id]
    );
    
    if (applicableConditions.length === 0) {
      console.log(`[ResolutionManager] No applicable conditions for NPC ${npcId}`);
      return;
    }
    
    console.log(`[ResolutionManager] Evaluating ${applicableConditions.length} conditions for NPC ${npcId}`);
    
    // Create a context string from the history to pass to LLM
    const context = this.formatConversationForLLM(npcId, conversationHistory);
    
    // For each applicable condition, check if it's met
    for (const condition of applicableConditions) {
      console.log(`[ResolutionManager] Checking condition: ${condition.id}`);
      const isConditionMet = await this.checkConditionWithLLM(condition, context);
      
      if (isConditionMet) {
        console.log(`[ResolutionManager] ✅ CONDITION MET: ${condition.id}`);
        this.completeCondition(currentLevel, condition);
      } else {
        console.log(`[ResolutionManager] ❌ CONDITION NOT MET: ${condition.id}`);
      }
    }
  }
  
  formatConversationForLLM(npcId, history) {
    let formattedConversation = `Conversation between Player and ${npcId}:\n\n`;
    
    history.forEach(msg => {
      const speaker = msg.role === 'user' ? 'Player' : npcId;
      formattedConversation += `${speaker}: ${msg.content}\n`;
    });
    
    return formattedConversation;
  }
  
  async checkConditionWithLLM(condition, conversationContext) {
    try {
      // Extremely explicit prompt demanding a one-word response
      const prompt = `
      You are evaluating a conversation in a video game to determine if a specific objective has been completed.
      
      ${conversationContext}
      
      CRITICAL INSTRUCTION:
      Reply with EXACTLY ONE WORD, either "yes" or "no".
      Do not include any other text, explanation, punctuation, or whitespace.
      
      QUESTION: ${condition.condition}
      
      ONE-WORD ANSWER:`;
      
      console.log(`[ResolutionManager] Sending evaluation request for condition: ${condition.id}`);
      console.log(`[ResolutionManager] Full prompt being sent:`, prompt);
      
      const requestBody = {
        model: this.evaluationModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300  // Keep higher to ensure we get a complete response
      };
      
      console.log(`[ResolutionManager] Request body:`, JSON.stringify(requestBody));
      
      const response = await fetch(this.evaluationEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log(`[ResolutionManager] Response status:`, response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ResolutionManager] API error: ${response.status} - ${errorText}`);
        return false;
      }
      
      const responseText = await response.text();
      console.log(`[ResolutionManager] Raw API response:`, responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`[ResolutionManager] Failed to parse JSON response:`, e);
        console.log(`[ResolutionManager] Non-JSON response:`, responseText);
        return false;
      }
      
      console.log(`[ResolutionManager] Parsed API response:`, data);
      
      // Check if the response contains an error
      if (data.error) {
        console.error('[ResolutionManager] API returned an error:', data.error);
        return false;
      }
      
      // Add error checking for the response structure
      if (!data || !data.choices || !data.choices.length || !data.choices[0].message) {
        console.error('[ResolutionManager] Unexpected API response format:', data);
        return false;
      }
      
      const answer = data.choices[0].message.content.trim().toLowerCase();
      console.log(`[ResolutionManager] Final extracted answer: "${answer}"`);
      
      // Check if we hit the token limit
      if (data.choices[0].finish_reason === "length" || 
          data.choices[0].native_finish_reason === "MAX_TOKENS") {
        console.error(`[ResolutionManager] ⚠️ TOKEN LIMIT REACHED: The model response was cut off due to token limits. Consider increasing max_tokens.`);
        console.error(`[ResolutionManager] Attempted to use ${data.usage?.completion_tokens || 'unknown'} tokens but limited to ${requestBody.max_tokens}.`);
      }
      
      // Check if the answer is empty after trimming
      if (!answer) {
        console.error(`[ResolutionManager] ⚠️ EMPTY RESPONSE: The model returned an empty response.`);
        return false;
      }
      
      console.log(`[ResolutionManager] Condition evaluation result: "${answer}" for condition: ${condition.id}`);
      return answer.includes('yes');
    } catch (error) {
      console.error('[ResolutionManager] Error evaluating condition with LLM:', error);
      console.error('[ResolutionManager] Error stack:', error.stack);
      return false;
    }
  }
  
  completeCondition(levelId, condition) {
    // Mark as completed
    this.completedConditions[condition.id] = true;
    
    // Add points
    this.levelPoints[levelId] = (this.levelPoints[levelId] || 0) + condition.points;
    
    console.log(`[ResolutionManager] ✅ COMPLETED: ${condition.id}, awarded ${condition.points} points. Total: ${this.levelPoints[levelId]}/${this.levelThresholds[levelId]}`);
    
    // Show notification
    this.showNotification(`Objective completed: ${condition.id.replace(/_/g, ' ')}`);
    
    // Dispatch condition completed event
    const event = new CustomEvent('conditionCompleted', { 
        detail: { 
            conditionId: condition.id,
            levelId: levelId 
        } 
    });
    window.dispatchEvent(event);
    
    // Check if level completion threshold reached
    this.checkLevelCompletion(levelId);
    
    // Save progress
    this.saveProgressState();
  }
  
  checkLevelCompletion(levelId) {
    const threshold = this.levelThresholds[levelId] || 0;
    const points = this.levelPoints[levelId] || 0;
    
    // Check if all required conditions are met
    const allRequiredMet = (this.levelConditions[levelId] || [])
      .filter(c => c.required)
      .every(c => this.completedConditions[c.id]);
    
    console.log(`[ResolutionManager] Level completion check: ${points}/${threshold} points, all required: ${allRequiredMet}`);
    
    // Level is complete if points threshold met and all required conditions met
    if (points >= threshold && allRequiredMet) {
      console.log(`[ResolutionManager] 🎉 LEVEL COMPLETE: ${levelId}`);
      this.unlockLevelExit(levelId);
    }
  }
  
  unlockLevelExit(levelId) {
    // Mark level exit as available
    console.log(`Level exit for ${levelId} is now available!`);
    
    // Dispatch event for game systems
    const event = new CustomEvent('levelExitUnlocked', { detail: { levelId } });
    window.dispatchEvent(event);
    
    // Show prominent notification
    this.showNotification('Exit is now accessible!', 10000, true);
  }
  
  showNotification(message, duration = 5000, isImportant = false) {
    // Use notification system if available, otherwise fallback to console
    if (window.notificationUI) {
      window.notificationUI.showNotification(message, duration, isImportant);
    } else {
      // Create a simple notification if no UI exists
      this.createSimpleNotification(message, duration, isImportant);
    }
  }
  
  createSimpleNotification(message, duration = 5000, isImportant = false) {
    // Only create if no notification system exists
    if (window.notificationUI) return;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${isImportant ? '#d97706' : '#1f2937'};
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      z-index: 9999;
      font-family: sans-serif;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: opacity 0.3s ease-in-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, duration);
  }
  
  saveProgressState() {
    // Save to sessionStorage instead of localStorage
    try {
      sessionStorage.setItem('gameProgress', JSON.stringify({
        completedConditions: this.completedConditions,
        levelPoints: this.levelPoints
      }));
      console.log('Progress saved to sessionStorage');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }
  
  loadProgressState() {
    try {
      // Load from sessionStorage instead of localStorage
      const savedState = JSON.parse(sessionStorage.getItem('gameProgress'));
      if (savedState) {
        this.completedConditions = savedState.completedConditions || {};
        this.levelPoints = savedState.levelPoints || {};
        console.log('Progress loaded from sessionStorage');
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  }
  
  getCurrentLevel() {
    // Get level ID using a consistent approach
    let levelId;
    
    if (window.currentLevel) {
      // If the level has an explicit ID property, use it
      if (window.currentLevel.levelId) {
        levelId = window.currentLevel.levelId;
      }
      // Otherwise, derive from class name
      else if (window.currentLevel.constructor && window.currentLevel.constructor.name) {
        // Convert class name to ID format (e.g., "Singapore6Level" -> "singapore6")
        levelId = window.currentLevel.constructor.name
          .replace(/Level$/, '')  // Remove "Level" suffix
          .toLowerCase();         // Convert to lowercase
      }
      // Last resort: use object's toString representation
      else {
        levelId = window.currentLevel.toString();
        console.warn('[ResolutionManager] Using fallback level ID method:', levelId);
      }
    } else {
      console.warn('[ResolutionManager] No current level found');
      levelId = 'unknown';
    }
    
    console.log(`[ResolutionManager] Current level: ${levelId}`);
    return levelId;
  }
  
  resetProgress() {
    this.completedConditions = {};
    this.levelPoints = {};
    this.saveProgressState();
    console.log('Progress reset');
  }
} 