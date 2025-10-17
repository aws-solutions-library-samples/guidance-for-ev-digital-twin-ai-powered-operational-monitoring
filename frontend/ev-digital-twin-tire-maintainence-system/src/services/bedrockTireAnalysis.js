// Direct Bedrock Claude 3.7 Sonnet service for tire analysis
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { getAWSCredentials, hasValidCredentials } from '../utils/awsCredentials';

class BedrockTireAnalysisService {
  constructor() {
    this.modelId = "us.anthropic.claude-3-7-sonnet-20250219-v1:0";
    this.cache = new Map();
    this.CACHE_TTL = 30000; // 30 seconds cache
    this.client = null; // Initialize on first use
  }

  /**
   * Initialize Bedrock client with current credentials
   */
  initializeClient() {
    if (!hasValidCredentials()) {
      throw new Error('AWS credentials not available for Bedrock access');
    }
    
    const credentials = getAWSCredentials();
    this.client = new BedrockRuntimeClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken
      }
    });
    
    console.log('Bedrock client initialized with fresh credentials');
  }

  /**
   * Analyze tire data and generate GenAI recommendations
   * @param {Object} tireData - Current tire metrics
   * @returns {Promise<Object>} - GenAI analysis and recommendations
   */
  async analyzeTireCondition(tireData) {
    try {
      // Initialize client if needed
      if (!this.client) {
        this.initializeClient();
      }
      
      // Create cache key from tire data
      const cacheKey = this.createCacheKey(tireData);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log('Using cached GenAI tire analysis');
        return cached.data;
      }

      console.log('Generating fresh GenAI tire analysis...');
      
      // Prepare the prompt with current tire data
      const prompt = this.createTireAnalysisPrompt(tireData);
      
      // Call Claude 3.7 Sonnet
      const response = await this.invokeClaude(prompt);
      
      // Parse the response
      const analysis = this.parseClaudeResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });
      
      return analysis;
      
    } catch (error) {
      console.error('Bedrock tire analysis error:', error);
      return this.getFallbackAnalysis(tireData);
    }
  }

  /**
   * Create a detailed prompt for tire analysis
   */
  createTireAnalysisPrompt(tireData) {
    const {
      pressure_psi,
      temperature_c,
      tread_depth_mm,
      vehicle_id,
      make,
      model,
      year,
      driving_pattern,
      weather_condition,
      anomaly_type,
      mileage,
      tire_brand,
      tire_size
    } = tireData;

    return `You are an expert tire maintenance specialist analyzing real-time tire data. Provide specific, actionable recommendations based on this data:

VEHICLE: ${year} ${make} ${model} (ID: ${vehicle_id})
TIRE SPECIFICATIONS: ${tire_brand} ${tire_size}

CURRENT TIRE METRICS:
- Pressure: ${pressure_psi} PSI
- Temperature: ${temperature_c}°C  
- Tread Depth: ${tread_depth_mm}mm
- Mileage: ${mileage} miles
- Driving Pattern: ${driving_pattern}
- Weather Conditions: ${weather_condition}
- Anomaly Status: ${anomaly_type || 'none detected'}

ANALYSIS REQUIREMENTS:
1. Evaluate each metric against optimal ranges (Pressure: 30-35 PSI, Tread: >4mm safe, Temperature: 20-40°C normal)
2. Consider the interaction between metrics (low pressure + high temp = danger)
3. Factor in driving conditions and vehicle type
4. Provide 2-4 specific, prioritized recommendations
5. Include urgency level (CRITICAL/HIGH/MEDIUM/LOW)
6. Mention specific measurements when relevant

RESPONSE FORMAT (JSON):
{
  "overall_status": "CRITICAL|WARNING|GOOD",
  "risk_level": "HIGH|MEDIUM|LOW", 
  "key_findings": ["finding1", "finding2"],
  "recommendations": [
    {
      "action": "specific action to take",
      "priority": "CRITICAL|HIGH|MEDIUM|LOW",
      "reason": "why this is needed",
      "urgency": "timeframe for action"
    }
  ],
  "next_inspection": "recommended timeframe"
}

Focus on real safety concerns and maintenance needs. Be specific about measurements and actionable steps.`;
  }

  /**
   * Invoke Claude 3.7 Sonnet via Bedrock
   */
  async invokeClaude(prompt) {
    const payload = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      top_p: 0.9
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload)
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  /**
   * Parse Claude's response into structured data
   */
  parseClaudeResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if no JSON found
      return this.parseTextResponse(response);
      
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return this.parseTextResponse(response);
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  parseTextResponse(response) {
    const lines = response.split('\n').filter(line => line.trim());
    
    return {
      overall_status: "GOOD",
      risk_level: "LOW",
      key_findings: [lines[0] || "Analysis completed"],
      recommendations: [
        {
          action: lines[1] || "Continue regular maintenance",
          priority: "LOW",
          reason: "Based on current tire condition",
          urgency: "Next scheduled maintenance"
        }
      ],
      next_inspection: "30 days",
      raw_response: response
    };
  }

  /**
   * Create cache key from tire data
   */
  createCacheKey(tireData) {
    const key = `${tireData.vehicle_id}_${tireData.pressure_psi}_${tireData.tread_depth_mm}_${tireData.temperature_c}`;
    return key.replace(/\./g, '_'); // Replace dots for safe key
  }

  /**
   * Fallback analysis when Bedrock fails
   */
  getFallbackAnalysis(tireData) {
    const pressure = parseFloat(tireData.pressure_psi) || 32;
    const tread = parseFloat(tireData.tread_depth_mm) || 8;
    const temp = parseFloat(tireData.temperature_c) || 25;
    
    let status = "GOOD";
    let recommendations = [];
    
    if (pressure < 28 || tread < 3 || temp > 45) {
      status = "CRITICAL";
      recommendations.push({
        action: "Immediate inspection required - critical tire condition detected",
        priority: "CRITICAL",
        reason: "Safety threshold exceeded",
        urgency: "Immediately"
      });
    } else if (pressure < 30 || tread < 5 || temp > 40) {
      status = "WARNING";
      recommendations.push({
        action: "Schedule tire service within 1 week",
        priority: "HIGH", 
        reason: "Approaching safety limits",
        urgency: "Within 7 days"
      });
    } else {
      recommendations.push({
        action: "Continue regular monitoring and maintenance",
        priority: "LOW",
        reason: "Tire condition within normal parameters",
        urgency: "Next scheduled service"
      });
    }
    
    return {
      overall_status: status,
      risk_level: status === "CRITICAL" ? "HIGH" : status === "WARNING" ? "MEDIUM" : "LOW",
      key_findings: [`Fallback analysis - Pressure: ${pressure} PSI, Tread: ${tread}mm`],
      recommendations,
      next_inspection: "30 days",
      fallback: true
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
const bedrockTireAnalysisService = new BedrockTireAnalysisService();
export default bedrockTireAnalysisService;