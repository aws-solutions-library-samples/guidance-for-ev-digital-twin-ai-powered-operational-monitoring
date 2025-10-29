// AgentCore Service for AI-powered vehicle maintenance recommendations
const AGENTCORE_API_ENDPOINT = "https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat";

class AgentCoreService {
  constructor() {
    this.sessionId = null;
    this.cache = new Map();
    this.CACHE_TTL = 300000; // 5 minutes for GenAI responses
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
  async chat(prompt, retryAttempt = 0) {
    const now = Date.now();

    // Check if we should make the call (skip check on retries)
    if (!this.shouldCallService() && retryAttempt === 0) {
      throw new Error('Service call throttled - using cached data or fallback');
    }

    try {
      this.lastCallTime = now;

      const response = await fetch(AGENTCORE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          session_id: this.sessionId
        }),
        timeout: 10000 // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
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
        console.log('Session corrupted, resetting session ID');
        this.sessionId = null;
        throw new Error('Session reset due to conversation state error. Please retry.');
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
  async getTireAnalysis(vehicleId, tireData) {
    const cacheKey = `tire_analysis_${vehicleId}_${JSON.stringify(tireData).slice(0, 50)}`;
    const cached = this.cache.get(cacheKey);

    // Use cached data if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Using cached GenAI analysis for vehicle ${vehicleId} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return { ...cached.data, fromCache: true };
    }

    // Try to get fresh analysis if service timing allows
    try {
      if (!this.shouldCallService()) {
        // Use stale cache if available, otherwise return throttled indicator
        if (cached) {
          console.log(`Using stale cached data due to service throttling`);
          return { ...cached.data, fromCache: true, stale: true };
        }
        console.log(`Service throttled and no cache available - indicating fallback needed`);
        return {
          throttled: true,
          error: 'Service throttled - use enhanced fallback',
          fromCache: false
        };
      }

      console.log(`Fetching fresh GenAI analysis for vehicle ${vehicleId}`);
      const response = await this.chat(`Analyze tire condition for vehicle ${vehicleId}. Current metrics: Pressure ${tireData.pressure_psi} PSI, Tread ${tireData.tread_depth_mm}mm, Temperature ${tireData.temperature_c}°C. Provide specific maintenance recommendations focusing on safety and performance.`);

      // Store successful response in cache
      const analysisData = { response, timestamp: Date.now(), fromCache: false };
      this.cache.set(cacheKey, analysisData);

      return analysisData;
    } catch (error) {
      // Try to use stale cache on error
      if (cached) {
        console.log(`Service error - using stale cached data:`, error.message);
        return { ...cached.data, fromCache: true, stale: true, error: error.message };
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
  async getMotorAnalysis(vehicleId, motorData) {
    const cacheKey = `motor_analysis_${vehicleId}_${JSON.stringify(motorData).slice(0, 50)}`;
    const cached = this.cache.get(cacheKey);

    // Use cached data if available and fresh
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Using cached Motor GenAI analysis for vehicle ${vehicleId} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return { ...cached.data, fromCache: true };
    }

    // Try to get fresh analysis if service timing allows
    try {
      if (!this.shouldCallService()) {
        // Use stale cache if available, otherwise return throttled indicator
        if (cached) {
          console.log(`Using stale cached motor data due to service throttling`);
          return { ...cached.data, fromCache: true, stale: true };
        }
        console.log(`Motor service throttled and no cache available - indicating fallback needed`);
        return {
          throttled: true,
          error: 'Motor service throttled - use enhanced fallback',
          fromCache: false
        };
      }

      console.log(`Fetching fresh Motor GenAI analysis for vehicle ${vehicleId}`);
      const response = await this.chat(`Analyze motor condition for vehicle ${vehicleId}. Current metrics: Engine temp ${motorData.engine_temp_c}°C, Oil pressure ${motorData.oil_pressure_psi} PSI, RPM ${motorData.rpm_avg}, Performance ${motorData.performance_score}%, Vibration ${motorData.vibration_level}. Provide specific motor maintenance recommendations focusing on performance and reliability.`);

      // Store successful response in cache
      const analysisData = { response, timestamp: Date.now(), fromCache: false };
      this.cache.set(cacheKey, analysisData);

      return analysisData;
    } catch (error) {
      // Try to use stale cache on error
      if (cached) {
        console.log(`Motor service error - using stale cached data:`, error.message);
        return { ...cached.data, fromCache: true, stale: true, error: error.message };
      }

      throw error;
    }
  }

  /**
   * Get maintenance recommendations for a specific vehicle
   * @param {number} vehicleId - The vehicle ID
   * @returns {Promise<string>} - Maintenance recommendations
   */
  async getMaintenanceRecommendations(vehicleId) {
    // Check cache first
    const cacheKey = `vehicle_${vehicleId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Using cached data for vehicle ${vehicleId} (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return cached.data;
    }

    // Not cached or expired - fetch fresh with improved prompt
    console.log(`Fetching fresh data for vehicle ${vehicleId}`);
    const prompt = `Analyze ONLY the tire condition for vehicle ${vehicleId} using the analyze_tire_condition tool. Look for tire pressure issues (below 30 PSI), low tread depth, and wear patterns. Give me specific tire maintenance recommendations in 1-2 sentences. Do NOT analyze motor or engine.`;
    const response = await this.chat(prompt);

    // Store in cache
    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    return response;
  }

  /**
   * Get fleet-wide maintenance recommendations
   * @returns {Promise<string>} - Fleet maintenance overview
   */
  async getFleetMaintenanceRecommendations() {
    const prompt = `Analyze the entire fleet and provide maintenance recommendations. Which vehicles need immediate attention? Keep it concise and actionable.`;
    return await this.chat(prompt);
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
   * Reset the session (start a new conversation)
   */
  resetSession() {
    this.sessionId = null;
  }
}

// Export a singleton instance
const agentCoreService = new AgentCoreService();
export default agentCoreService;
