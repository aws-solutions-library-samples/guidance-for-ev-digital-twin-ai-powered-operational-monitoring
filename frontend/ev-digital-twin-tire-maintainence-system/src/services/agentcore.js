// AgentCore Service for AI-powered vehicle maintenance recommendations
const AGENTCORE_API_ENDPOINT = "https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/chat";

class AgentCoreService {
  constructor() {
    this.sessionId = null;
  }

  /**
   * Send a prompt to the AgentCore Runtime
   * @param {string} prompt - The question or request
   * @returns {Promise<string>} - The AI response
   */
  async chat(prompt) {
    try {
      const response = await fetch(AGENTCORE_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`AgentCore API error: ${response.statusText}`);
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

      return responseText;
    } catch (error) {
      console.error('AgentCore error:', error);
      throw error;
    }
  }

  /**
   * Get maintenance recommendations for a specific vehicle
   * @param {number} vehicleId - The vehicle ID
   * @returns {Promise<string>} - Maintenance recommendations
   */
  async getMaintenanceRecommendations(vehicleId) {
    const prompt = `Check vehicle ${vehicleId} tire and motor status. Give me ONE brief sentence about the most important issue or say "All systems normal". Be extremely concise.`;
    return await this.chat(prompt);
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
