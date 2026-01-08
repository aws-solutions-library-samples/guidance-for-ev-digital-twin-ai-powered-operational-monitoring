// AgentCore Service for AI-powered vehicle maintenance recommendations
const AGENTCORE_API_ENDPOINT = "https://vohmbll8l6.execute-api.us-east-1.amazonaws.com/chat";

class AgentCoreService {
  constructor() {
    this.sessionId = null;
    this.cache = new Map();
    this.CACHE_TTL = 600000; // 10 minutes for GenAI responses
    this.lastCallTime = 0;
    this.MIN_CALL_INTERVAL = 5000; // 5 seconds minimum between calls (reduced for booking flow)
    this.serviceAvailable = true;
    this.lastFailureTime = 0;
    this.FAILURE_COOLDOWN = 60000; // 1 minute cooldown after failure
    this.retryCount = 0;
    this.MAX_RETRIES = 2;
    this.allowFirstCall = true; // Allow the first call immediately
  }

  /**
   * Check if service should be called based on timing and availability
   */
  shouldCallService() {
    const now = Date.now();

    // Allow the first call immediately
    if (this.allowFirstCall) {
      this.allowFirstCall = false;
      return true;
    }

    // Check if we're in cooldown period after failure
    if (!this.serviceAvailable && (now - this.lastFailureTime) < this.FAILURE_COOLDOWN) {
      return false;
    }

    // Check minimum interval between calls
    if ((now - this.lastCallTime) < this.MIN_CALL_INTERVAL) {
      return false;
    }

    return true;
  }

  /**
   * Send a prompt to the AgentCore Runtime with retry logic
   * @param {string} prompt - The question or request
   * @returns {Promise<string>} - The AI response
   */
  async chat(prompt, vin = null, retryAttempt = 0) {
    const now = Date.now();

    // Check if we should make the call (skip check on retries)
    if (!this.shouldCallService() && retryAttempt === 0) {
      throw new Error('Service call throttled - using cached data or fallback');
    }

    try {
      this.lastCallTime = now;

      console.log('🔗 AgentCore API Endpoint:', AGENTCORE_API_ENDPOINT); // DEBUG: Log the actual endpoint being used

      const response = await fetch(AGENTCORE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          session_id: this.sessionId,
          vin: vin
        }),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ AgentCore API Response:', response.status, response.statusText, errorText); // DEBUG: Log response details
        throw new Error(`AgentCore API error (${response.status}): ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Update session ID for conversation continuity
      if (data.session_id) {
        this.sessionId = data.session_id;
      }

      // Parse the response (it comes as a JSON string)
      let responseText = data.response;
      if (typeof responseText === 'string' && responseText.startsWith('"')) {
        responseText = JSON.parse(responseText);
      }

      // Mark service as available and reset retry count
      this.serviceAvailable = true;
      this.retryCount = 0;

      return responseText;
    } catch (error) {
      console.error('AgentCore error:', error);

      // Mark service as potentially unavailable
      this.serviceAvailable = false;
      // Don't update lastFailureTime - it interferes with throttling after long operations

      // Reset session on ValidationException (corrupted conversation state)
      if (error.message.includes('ValidationException') || error.message.includes('tool_use')) {
        this.sessionId = null;
        throw new Error('Session reset due to conversation state error. Please retry.');
      }
      
      // Retry logic for 503 errors (Lambda cold start)
      // BUT: Don't retry browser tool calls (they take 60-90 seconds and will always timeout)
      const isBrowserTool = prompt.includes('order_tire_online');
      if (error.message.includes('503') && retryAttempt < this.MAX_RETRIES && !isBrowserTool) {
        const delay = Math.pow(2, retryAttempt) * 2000; // Exponential backoff: 2s, 4s - give Lambda more warmup time
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.chat(prompt, vin, retryAttempt + 1);
      }
      
      // Check if it's a network error or service unavailable
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('AgentCore service is currently unavailable. Using cached recommendations.');
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('AgentCore service is temporarily unavailable. Using fallback system.');
      }

      throw error;
    }
  }

  /**
   * Get tire analysis with enhanced caching and fallback
   * @param {string} vehicleId - The vehicle ID
   * @param {object} tireData - Current tire data
   * @returns {Promise<string>} - Tire analysis
   */
  async getTireAnalysis(vehicleId, tireData, vin = null) {
    const cacheKey = `tire_analysis_${vehicleId}_${JSON.stringify(tireData).slice(0, 50)}`;
    const cached = this.cache.get(cacheKey);

    // Use cached data if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { response: cached.response, fromCache: true, timestamp: cached.timestamp };
    }

    // Try to get fresh analysis if service timing allows
    try {
      if (!this.shouldCallService()) {
        // Use stale cache if available, otherwise return throttled indicator
        if (cached) {
          return { response: cached.response, fromCache: true, stale: true, timestamp: cached.timestamp };
        }
        return {
          throttled: true,
          error: 'Service throttled - use enhanced fallback',
          fromCache: false
        };
      }

      // Use VIN if available for proper vehicle identification
      const vehicleIdentifier = vin || vehicleId;
      
      // Different prompts for EV-1001 vs other vehicles
      const isEV1001 = vin === '2T1BURHE8JC987654' || vehicleId === '2T1BURHE8JC987654' || vehicleId === 'EV-1001';
      
      let prompt;
      if (isEV1001) {
        // EV-1001: Focus on uneven wear and Section 5.6 - use tool to check all tires
        prompt = `Analyze tire condition for vehicle ${vehicleIdentifier}. Focus on uneven wear and provide 2-3 key recommendations.`;
      } else {
        // Other vehicles: Generic tire maintenance recommendations - use provided data
        const pressure = tireData.pressure_psi || 32;
        const tread = tireData.tread_depth_mm || 8;
        const temp = tireData.temperature_c || 25;
        prompt = `Analyze tire condition for ${tireData.make} ${tireData.model} (${tireData.year}). Current readings: Pressure ${pressure} PSI, Tread ${tread}mm, Temperature ${temp}°C. Provide 2-3 practical maintenance recommendations. Keep it simple and driver-friendly.`;
      }
      
      const response = await this.chat(prompt, vin);

      // Store successful response in cache
      const analysisData = { response, timestamp: Date.now(), fromCache: false };
      this.cache.set(cacheKey, analysisData);

      return analysisData;
    } catch (error) {
      // Try to use stale cache on error
      if (cached) {
        return { response: cached.response, fromCache: true, stale: true, error: error.message, timestamp: cached.timestamp };
      }

      throw error;
    }
  }

  /**
   * Get motor analysis with enhanced caching and fallback
   * @param {string} vehicleId - The vehicle ID
   * @param {object} motorData - Current motor data
   * @returns {Promise<string>} - Motor analysis
   */
  async getMotorAnalysis(vehicleId, motorData, vin = null) {
    const cacheKey = `motor_analysis_${vehicleId}_${JSON.stringify(motorData).slice(0, 50)}`;
    const cached = this.cache.get(cacheKey);

    // Use cached data if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { response: cached.response, fromCache: true, timestamp: cached.timestamp };
    }

    // Try to get fresh analysis if service timing allows
    try {
      if (!this.shouldCallService()) {
        // Use stale cache if available, otherwise return throttled indicator
        if (cached) {
          return { response: cached.response, fromCache: true, stale: true, timestamp: cached.timestamp };
        }
        return {
          throttled: true,
          error: 'Motor service throttled - use enhanced fallback',
          fromCache: false
        };
      }

      const response = await this.chat(`Analyze motor performance for vehicle ${vehicleId}. Provide 2-3 key recommendations for the driver.`, vin);

      // Store successful response in cache
      const analysisData = { response, timestamp: Date.now(), fromCache: false };
      this.cache.set(cacheKey, analysisData);

      return analysisData;
    } catch (error) {
      // Try to use stale cache on error
      if (cached) {
        return { response: cached.response, fromCache: true, stale: true, error: error.message, timestamp: cached.timestamp };
      }

      throw error;
    }
  }

  /**
   * Get inverter analysis with enhanced caching and fallback
   * @param {string} vehicleId - The vehicle ID
   * @param {object} inverterData - Current inverter data
   * @returns {Promise<string>} - Inverter analysis
   */
  async getInverterAnalysis(vehicleId, inverterData, vin = null) {
    const cacheKey = `inverter_analysis_${vehicleId}_${JSON.stringify(inverterData).slice(0, 50)}`;
    const cached = this.cache.get(cacheKey);
    
    // Use cached data if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return { response: cached.response, fromCache: true, timestamp: cached.timestamp };
    }

    // Try to get fresh analysis if service timing allows
    try {
      if (!this.shouldCallService()) {
        // Use stale cache if available, otherwise return throttled indicator
        if (cached) {
          return { response: cached.response, fromCache: true, stale: true, timestamp: cached.timestamp };
        }
        return { 
          throttled: true, 
          error: 'Inverter service throttled - use enhanced fallback',
          fromCache: false 
        };
      }

      const response = await this.chat(`Analyze inverter performance for vehicle ${vehicleId}. Provide 2-3 key recommendations for the driver.`, vin);
      
      // Store successful response in cache
      const analysisData = { response, timestamp: Date.now(), fromCache: false };
      this.cache.set(cacheKey, analysisData);
      
      return analysisData;
    } catch (error) {
      // Try to use stale cache on error
      if (cached) {
        return { response: cached.response, fromCache: true, stale: true, error: error.message, timestamp: cached.timestamp };
      }
      
      throw error;
    }
  }

  /**
   * Query DynamoDB for cached GenAI recommendation by VIN
   * @param {string} vin - Vehicle VIN
   * @returns {Promise<object|null>} - Cached recommendation or null
   */
  async getCachedRecommendation(vin) {
    try {
      const response = await fetch(`https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/genai-recs/${vin}`);
      if (response.ok) {
        const data = await response.json();
        return data.recommendation ? data : null;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching cached recommendation for VIN ${vin}:`, error);
      return null;
    }
  }

  /**
   * Get maintenance recommendations for a specific vehicle
   * @param {number} vehicleId - The vehicle ID
   * @param {string} vin - Vehicle VIN (optional, for DynamoDB caching)
   * @returns {Promise<string>} - Maintenance recommendations
   */
  async getMaintenanceRecommendations(vehicleId, vin = null, useCache = true) {
    // Check DynamoDB cache first if VIN provided and useCache is true
    if (vin && useCache) {
      const cached = await this.getCachedRecommendation(vin);
      if (cached && cached.recommendation) {
        console.log(`💾 Using DynamoDB cached recommendation for VIN ${vin}`);
        return cached.recommendation;
      }
    }

    // Not cached - fetch fresh with improved prompt
    const prompt = `Analyze ONLY the tire condition for vehicle ${vehicleId} using the analyze_tire_condition tool. Give me specific tire maintenance recommendations in 1-2 sentences.`;
    const response = await this.chat(prompt, vin);

    return response;
  }



  /**
   * Get tire condition for a vehicle
   * @param {number} vehicleId - The vehicle ID
   * @returns {Promise<string>} - Tire condition analysis
   */
  async getTireCondition(vehicleId) {
    const prompt = `What is the tire condition for vehicle ${vehicleId}?`;
    return await this.chat(prompt);
  }

  /**
   * Get motor performance for a vehicle
   * @param {number} vehicleId - The vehicle ID
   * @returns {Promise<string>} - Motor performance analysis
   */
  async getMotorPerformance(vehicleId) {
    const prompt = `How is the motor performing for vehicle ${vehicleId}?`;
    return await this.chat(prompt);
  }

  /**
   * Start async tire order
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<{job_id: string, status: string}>}
   */
  async startTireOrder(vehicleId) {
    const response = await fetch('https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/tire-order/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicle_id: vehicleId })
    });

    if (!response.ok) {
      throw new Error(`Failed to start tire order: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check tire order status
   * @param {string} jobId - Job ID from startTireOrder
   * @returns {Promise<{status: string, result?: object, error?: string}>}
   */
  async getTireOrderStatus(jobId) {
    const response = await fetch(`https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/tire-order/status/${jobId}`);

    if (!response.ok) {
      throw new Error(`Failed to get tire order status: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Poll tire order until complete
   * @param {string} jobId - Job ID
   * @param {function} onProgress - Callback for progress updates
   * @returns {Promise<object>} - Final result
   */
  async pollTireOrder(jobId, onProgress = null) {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getTireOrderStatus(jobId);

          // Call progress callback if provided
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'complete') {
            clearInterval(pollInterval);
            resolve(status.result);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error(status.error || 'Tire order failed'));
          }
          // else: still running, keep polling

        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 3000); // Poll every 3 seconds
    });
  }

  /**
   * Get browser live view URL for a tire order job
   * @param {string} jobId - Job ID from startTireOrder
   * @returns {Promise<{liveViewUrl: string, browserSessionId: string, browserId: string}>}
   */
  async getBrowserLiveView(jobId) {
    const response = await fetch(`https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/browser-live-view/${jobId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Browser session not available yet');
      }
      throw new Error(`Failed to get live view URL: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Reset the session (start a new conversation)
   */
  resetSession() {
    this.sessionId = null;
  }
}

// Export a singleton instance
const agentCoreService = new AgentCoreService();
export default agentCoreService;
