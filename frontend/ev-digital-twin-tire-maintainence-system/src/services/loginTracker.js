// Login Tracker Service for EV Digital Twin
// Lightweight service to track successful logins for leadership reporting

const LOGIN_TRACKER_API = process.env.REACT_APP_LOGIN_TRACKER_API;

class LoginTracker {
  constructor() {
    this.isEnabled = true;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Track a successful login event
   * Fire-and-forget approach - doesn't block authentication flow
   * @param {string} username - The username that logged in
   */
  async trackLogin(username) {
    // Skip tracking if disabled
    if (!this.isEnabled) {
      return;
    }

    // Handle development mode - still track demo users for testing
    const trackingUsername = this.isDevelopment ? `demo-${username}` : username;

    try {
      // Fire-and-forget API call
      fetch(`${LOGIN_TRACKER_API}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trackingUsername
        })
      }).catch(error => {
        // Silent failure - don't block authentication
        console.log('Login tracking failed (non-blocking):', error.message);
      });

      console.log(`Login tracked for user: ${trackingUsername}`);
    } catch (error) {
      // Silent failure - don't block authentication
      console.log('Login tracking error (non-blocking):', error.message);
    }
  }

  /**
   * Get current login statistics
   * @returns {Promise<Object>} Login statistics
   */
  async getStats() {
    try {
      const response = await fetch(`${LOGIN_TRACKER_API}/stats`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`API error: ${response.status}`);
    } catch (error) {
      console.error('Failed to fetch login stats:', error);
      // Return default stats on error
      return {
        totalLogins: 0,
        todayLogins: 0,
        weekLogins: 0,
        monthLogins: 0,
        uniqueUsers: 0,
        todayUniqueUsers: 0,
        weekUniqueUsers: 0,
        monthUniqueUsers: 0,
        lastUpdated: new Date().toISOString(),
        error: 'Failed to load stats'
      };
    }
  }

  /**
   * Enable or disable login tracking
   * @param {boolean} enabled - Whether to enable tracking
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`Login tracking ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
const loginTracker = new LoginTracker();
export default loginTracker;