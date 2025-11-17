import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Papa from 'papaparse';
import DataNeededModal from "./DataNeededModal";
import agentCoreService from '../services/agentcore';
import "../css/invertor.css";

const Invertor = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [csvData, setCsvData] = useState([]);
  const [dataIndex, setDataIndex] = useState(0);
  const [mlResults, setMlResults] = useState([]);
  const [genAiAnalysis, setGenAiAnalysis] = useState(null);
  const [genAiLoading, setGenAiLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [chartData, setChartData] = useState({
    inputVoltage: { current: [], expected: [] },
    outputVoltage: { current: [], expected: [] },
    inputCurrent: { current: [], expected: [] },
    outputCurrent: { current: [], expected: [] }
  });
  const [gaugeAngles, setGaugeAngles] = useState({
    inputVoltage: 0,
    outputVoltage: 0,
    inputCurrent: 0,
    outputCurrent: 0
  });


  // Calculate clamped scale - grows with screen but never too big


  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const csvPath = (carId === '1HGBH41JXMN109876' || carId === 'WBADT43452G123789')
      ? '/normal_data/inverter_sensor_data_normal.csv'
      : '/data/inverter_sensor_data.csv';
    
    Papa.parse(csvPath, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          let filteredData;
          if (carId === '1HGBH41JXMN109876') {
            filteredData = results.data.filter(row => row.vehicle_id === '2');
          } else if (carId === 'WBADT43452G123789') {
            filteredData = results.data.filter(row => row.vehicle_id === '4');
          } else {
            filteredData = results.data.filter(row => row.vehicle_id);
          }
          setCsvData(filteredData);
          console.log('Inverter CSV data loaded:', filteredData.length, 'records');
          console.log('Sample inverter record:', filteredData[0]);
        } else {
          console.error('No inverter CSV data loaded');
        }
      },
      error: (error) => {
        console.error('Error loading inverter CSV:', error);
      }
    });
    
    // Load ML results
    fetch('/data/inverter_ml_results.json')
      .then(res => res.json())
      .then(data => {
        setMlResults(data);
        console.log('Inverter ML results loaded:', data);
      })
      .catch(err => console.log('Inverter ML results not available:', err));
  }, []);

  // Dynamic chart data generation for Power Metrics
  useEffect(() => {
    const generateChartData = () => {
      if (!csvData.length) return;
      
      const currentData = csvData.find(row => row.vehicle_id === '1') || csvData[0] || {};
      const inputVoltage = parseFloat(currentData.ac_voltage_v) || 230;
      const outputVoltage = parseFloat(currentData.dc_voltage_v) || 400;
      const inputCurrent = parseFloat(currentData.ac_current_a) || 90;
      const outputCurrent = parseFloat(currentData.dc_current_a) || 125;
      
      // Generate realistic waveform data points (20 points for smooth curves)
      const generateWaveform = (baseValue, amplitude = 5, frequency = 1, phase = 0) => {
        const points = [];
        const time = Date.now() * 0.001; // Convert to seconds
        
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 90; // Scale to SVG width
          const variation = Math.sin((time + phase) * frequency + (i * 0.3)) * amplitude;
          const noise = (Math.random() - 0.5) * 2; // Small random noise
          const y = 22 + variation + noise; // Center around y=22
          points.push({ x, y: Math.max(8, Math.min(36, y)) }); // Clamp to chart bounds
        }
        return points;
      };
      
      // Generate expected (baseline) waveforms - more stable
      const generateExpectedWaveform = (baseValue, amplitude = 3, frequency = 0.5, phase = 0) => {
        const points = [];
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < 20; i++) {
          const x = (i / 19) * 90;
          const variation = Math.sin((time + phase) * frequency + (i * 0.2)) * amplitude;
          const y = 25 + variation; // Slightly offset from current
          points.push({ x, y: Math.max(8, Math.min(36, y)) });
        }
        return points;
      };
      
      // Update chart data with realistic waveforms
      const newChartData = {
        inputVoltage: {
          current: generateWaveform(inputVoltage, 4, 1.2, 0),
          expected: generateExpectedWaveform(inputVoltage, 2, 0.8, 0.5)
        },
        outputVoltage: {
          current: generateWaveform(outputVoltage, 3, 1.0, 1.0),
          expected: generateExpectedWaveform(outputVoltage, 2, 0.6, 1.2)
        },
        inputCurrent: {
          current: generateWaveform(inputCurrent, 5, 1.5, 2.0),
          expected: generateExpectedWaveform(inputCurrent, 3, 0.9, 2.5)
        },
        outputCurrent: {
          current: generateWaveform(outputCurrent, 4, 1.1, 3.0),
          expected: generateExpectedWaveform(outputCurrent, 2, 0.7, 3.5)
        }
      };
      
      setChartData(newChartData);
      console.log('📊 Dynamic Power Metrics Charts Updated:', {
        inputVoltage: inputVoltage + 'V',
        outputVoltage: outputVoltage + 'V', 
        inputCurrent: inputCurrent + 'A',
        outputCurrent: outputCurrent + 'A',
        chartPoints: newChartData.inputVoltage.current.length
      });
      
      // Calculate gauge angles based on actual values (0-180 degrees for semi-circle)
      const calculateGaugeAngle = (value, min, max) => {
        const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return percentage * 180; // 0-180 degrees for semi-circle
      };
      
      const newGaugeAngles = {
        inputVoltage: calculateGaugeAngle(inputVoltage, 110, 240),
        outputVoltage: calculateGaugeAngle(outputVoltage, 300, 450),
        inputCurrent: calculateGaugeAngle(inputCurrent, 50, 150),
        outputCurrent: calculateGaugeAngle(outputCurrent, 80, 200)
      };
      
      setGaugeAngles(newGaugeAngles);
      console.log('🎯 Dynamic Semi-Circle Gauges Updated:', {
        inputVoltage: newGaugeAngles.inputVoltage.toFixed(1) + '°',
        outputVoltage: newGaugeAngles.outputVoltage.toFixed(1) + '°',
        inputCurrent: newGaugeAngles.inputCurrent.toFixed(1) + '°',
        outputCurrent: newGaugeAngles.outputCurrent.toFixed(1) + '°'
      });
    };
    
    // Generate initial data and update every 2 seconds for smooth animation
    generateChartData();
    const chartInterval = setInterval(generateChartData, 2000);
    
    return () => clearInterval(chartInterval);
  }, [csvData]);

  // Note: Removed data rotation interval - using fixed vehicle like Tires and Motor pages

  // Animation effect for prediction toggle
  useEffect(() => {
    if (showPrediction) {
      setAnimationProgress(0);
      const animationInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 1) {
            clearInterval(animationInterval);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(animationInterval);
    }
  }, [showPrediction]);

  // GenAI Analysis - Call Claude Sonnet 4.5 for inverter analysis
  useEffect(() => {
    const analyzeInverterWithGenAI = async () => {
      // Use the same fixed vehicle data for GenAI analysis
      const currentData = csvData.find(row => row.vehicle_id === '1') || csvData[0] || {};
      
      if (!csvData.length || !currentData.vehicle_id) {
        console.log('Inverter GenAI Analysis skipped - missing data:', { csvDataLength: csvData.length, vehicleId: currentData.vehicle_id });
        return;
      }
      
      console.log('Starting enhanced Inverter GenAI analysis...');
      setGenAiLoading(true);
      
      // Prepare inverter data for analysis
      const inverterDataForAnalysis = {
        vehicle_id: currentData.vehicle_id,
        make: currentData.make,
        model: currentData.model,
        year: currentData.year,
        dc_voltage_v: parseFloat(currentData.dc_voltage_v) || 400,
        dc_current_a: parseFloat(currentData.dc_current_a) || 125,
        ac_voltage_v: parseFloat(currentData.ac_voltage_v) || 230,
        ac_current_a: parseFloat(currentData.ac_current_a) || 90,
        power_output_kw: parseFloat(currentData.power_output_kw) || 35,
        efficiency_percent: parseFloat(currentData.efficiency_percent) || 95,
        temperature_c: parseFloat(currentData.temperature_c) || 65,
        switching_frequency_khz: parseFloat(currentData.switching_frequency_khz) || 10,
        modulation_index: parseFloat(currentData.modulation_index) || 0.85,
        thd_percent: parseFloat(currentData.thd_percent) || 2.0,
        fault_codes: currentData.fault_codes,
        inverter_anomaly: currentData.inverter_anomaly === 'True',
        anomaly_type_inverter: currentData.anomaly_type_inverter,
        failure_risk: parseFloat(currentData.failure_risk) || 1,
        drivetrain: currentData.drivetrain,
        vehicle_class: currentData.vehicle_class
      };
      
      try {
        console.log('Calling enhanced AgentCore service for inverter analysis...');
        
        // Use the enhanced service method
        const analysisResult = await agentCoreService.getInverterAnalysis(currentData.vehicle_id, inverterDataForAnalysis, 'W1KZF8EB8NA123456');
        
        console.log('Received enhanced Inverter GenAI analysis:', analysisResult);
        
        // Check if service was throttled and no cache available
        if (analysisResult.throttled) {
          console.log('Inverter service throttled - using enhanced fallback');
          const enhancedFallback = createEnhancedInverterFallback(inverterDataForAnalysis, new Error('Service throttled'));
          setGenAiAnalysis(enhancedFallback);
          return;
        }
        
        // Parse the response into structured format
        const analysis = parseInverterAgentCoreResponse(analysisResult.response, inverterDataForAnalysis, analysisResult);
        
        console.log('Parsed Inverter GenAI analysis:', analysis);
        console.log('Inverter analysis has recommendations:', analysis?.recommendations?.length);
        
        setGenAiAnalysis(analysis);
        
      } catch (error) {
        console.error('Inverter GenAI analysis failed:', error);
        console.error('Inverter error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        // Create enhanced fallback with rule-based intelligence
        const enhancedFallback = createEnhancedInverterFallback(inverterDataForAnalysis, error);
        setGenAiAnalysis(enhancedFallback);
      } finally {
        setGenAiLoading(false);
      }
    };
    
    // Debounce the GenAI calls - longer interval for stability
    const debounceTimer = setTimeout(analyzeInverterWithGenAI, 5000); // 5 seconds for better stability
    return () => clearTimeout(debounceTimer);
    
  }, [csvData.length]); // Trigger when CSV data is loaded

  // Use a fixed vehicle for consistent inverter analysis (like Tires and Motor pages)
  const currentData = csvData.find(row => row.vehicle_id === '1') || csvData[0] || {};
  
  // Get ML data for current vehicle
  const currentMlData = mlResults.find(r => r.vehicle_id === parseInt(currentData.vehicle_id));

  // Create enhanced fallback with intelligent rule-based inverter analysis
  const createEnhancedInverterFallback = (inverterData, error) => {
    const dcVoltage = parseFloat(inverterData.dc_voltage_v) || 400;
    const efficiency = parseFloat(inverterData.efficiency_percent) || 95;
    const temperature = parseFloat(inverterData.temperature_c) || 65;
    const thd = parseFloat(inverterData.thd_percent) || 2.0;
    const hasAnomaly = inverterData.inverter_anomaly;
    const hasFaultCodes = inverterData.fault_codes && inverterData.fault_codes !== 'None';
    
    let status = 'GOOD';
    let riskLevel = 'LOW';
    let summary = '';
    const recommendations = [];
    
    // Intelligent analysis based on inverter data
    if (hasAnomaly || hasFaultCodes || temperature > 80 || efficiency < 90) {
      status = 'CRITICAL';
      riskLevel = 'HIGH';
      summary = 'Critical inverter conditions detected requiring immediate attention. ';
      recommendations.push({
        action: 'URGENT: Stop operation and inspect inverter immediately',
        priority: 'CRITICAL',
        reason: 'Inverter anomaly or critical parameter exceeds safe operating limits',
        urgency: 'Immediately'
      });
    } else if (temperature > 70 || efficiency < 94 || thd > 3.0) {
      status = 'WARNING';
      riskLevel = 'MEDIUM';
      summary = 'Inverter performance issues detected that should be addressed soon. ';
      recommendations.push({
        action: 'Schedule inverter inspection within 48 hours',
        priority: 'HIGH',
        reason: 'Temperature, efficiency, or THD approaching critical levels',
        urgency: 'Within 48 hours'
      });
    }
    
    if (dcVoltage < 350 || dcVoltage > 450) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
      summary += 'DC voltage instability detected requiring investigation. ';
      recommendations.push({
        action: 'Check DC bus voltage stability and connections',
        priority: 'HIGH',
        reason: 'DC voltage outside optimal operating range',
        urgency: 'Within 24 hours'
      });
    }
    
    if (thd > 5.0) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      recommendations.push({
        action: 'Investigate harmonic distortion - THD exceeds acceptable limits',
        priority: 'MEDIUM',
        reason: 'High THD may indicate switching issues or filter problems',
        urgency: 'Within 1 week'
      });
    }
    
    // Default good condition
    if (recommendations.length === 0) {
      summary = 'Inverter analysis shows good overall performance with routine maintenance recommended. ';
      recommendations.push({
        action: 'Continue regular inverter monitoring and scheduled maintenance',
        priority: 'LOW',
        reason: 'Preventive maintenance for optimal inverter performance',
        urgency: 'Next scheduled maintenance'
      });
    }
    
    // Complete summary
    if (!summary.includes('All inverter metrics')) {
      summary += 'Enhanced rule-based analysis provides reliable inverter maintenance guidance.';
    }
    
    return {
      error: true,
      error_message: error.message.includes('throttled') ? 
        'GenAI service throttled for stability. Using enhanced inverter rule-based analysis.' :
        'GenAI service temporarily unavailable. Using intelligent inverter fallback analysis.',
      overall_status: status,
      risk_level: riskLevel,
      key_findings_summary: summary,
      recommendations: recommendations,
      next_inspection: "30 days",
      source: "Enhanced Inverter Rule-Based Analysis",
      fallback: true
    };
  };

  // Create natural language summary from Claude's inverter response
  const createInverterNaturalLanguageSummary = (response, inverterData) => {
    try {
      // Extract key metrics and issues from the response
      const voltageIssues = response.toLowerCase().includes('voltage') || response.toLowerCase().includes('dc') || response.toLowerCase().includes('ac');
      const efficiencyIssues = response.toLowerCase().includes('efficiency') || response.toLowerCase().includes('power');
      const temperatureIssues = response.toLowerCase().includes('temperature') || response.toLowerCase().includes('temp') || response.toLowerCase().includes('hot');
      const criticalIssues = response.toLowerCase().includes('critical') || response.toLowerCase().includes('urgent') || response.toLowerCase().includes('immediate');
      
      let summary = '';
      
      // First sentence - overall condition
      if (criticalIssues) {
        summary = 'Claude has identified critical inverter conditions requiring immediate attention. ';
      } else if (voltageIssues || efficiencyIssues || temperatureIssues) {
        summary = 'Claude has detected inverter maintenance needs that should be addressed soon. ';
      } else {
        summary = 'Claude reports your inverter is in good condition with routine maintenance recommended. ';
      }
      
      // Second sentence - specific findings
      const specificIssues = [];
      if (voltageIssues) specificIssues.push('voltage stability');
      if (efficiencyIssues) specificIssues.push('power efficiency');
      if (temperatureIssues) specificIssues.push('thermal management');
      
      if (specificIssues.length > 0) {
        summary += `Key areas of focus include ${specificIssues.join(' and ')} based on current inverter data.`;
      } else {
        summary += 'All inverter metrics are within acceptable ranges for continued reliable operation.';
      }
      
      return summary;
    } catch (error) {
      return 'Claude has analyzed your inverter condition and provided maintenance recommendations based on current power electronics data.';
    }
  };

  // Parse AgentCore response into structured format for inverter analysis
  const parseInverterAgentCoreResponse = (response, inverterData, analysisResult = {}) => {
    try {
      console.log('Parsing Inverter AgentCore response:', response);
      
      // AgentCore returns text responses, not JSON
      // Let's create structured recommendations from the text
      const recommendations = [];
      
      // Split response into sentences for analysis
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
      
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        
        // Look for actionable recommendations
        if (trimmed.toLowerCase().includes('recommend') || 
            trimmed.toLowerCase().includes('should') || 
            trimmed.toLowerCase().includes('need') ||
            trimmed.toLowerCase().includes('check') ||
            trimmed.toLowerCase().includes('replace') ||
            trimmed.toLowerCase().includes('service') ||
            trimmed.toLowerCase().includes('inspect') ||
            trimmed.toLowerCase().includes('monitor')) {
          
          const priority = trimmed.toLowerCase().includes('urgent') || trimmed.toLowerCase().includes('critical') || trimmed.toLowerCase().includes('immediate') ? 'CRITICAL' :
                          trimmed.toLowerCase().includes('soon') || trimmed.toLowerCase().includes('warning') || trimmed.toLowerCase().includes('attention') ? 'HIGH' :
                          trimmed.toLowerCase().includes('consider') || trimmed.toLowerCase().includes('schedule') ? 'MEDIUM' : 'LOW';
          
          recommendations.push({
            action: trimmed,
            priority: priority,
            reason: "Based on Claude Sonnet 4.5 analysis of current inverter condition",
            urgency: priority === 'CRITICAL' ? 'Immediately' : priority === 'HIGH' ? 'Within 24 hours' : priority === 'MEDIUM' ? 'Within 1 week' : 'Next maintenance'
          });
        }
      });
      
      // Determine overall status from response content
      const status = determineInverterStatusFromResponse(response);
      
      // Create natural language summary instead of bullet points
      const naturalSummary = createInverterNaturalLanguageSummary(response, inverterData);

      // Determine source and status based on analysis result
      let sourceInfo = "AgentCore Claude Sonnet 4.5";
      if (analysisResult.fromCache) {
        sourceInfo += analysisResult.stale ? " (Cached - Stale)" : " (Cached)";
      }
      if (analysisResult.error) {
        sourceInfo += " (Service Issues)";
      }

      return {
        overall_status: status,
        risk_level: status === 'CRITICAL' ? 'HIGH' : status === 'WARNING' ? 'MEDIUM' : 'LOW',
        key_findings_summary: naturalSummary,
        recommendations: recommendations.slice(0, 4),
        next_inspection: "30 days",
        source: sourceInfo,
        fromCache: analysisResult.fromCache || false,
        stale: analysisResult.stale || false,
        serviceError: analysisResult.error || null,
        raw_response: response
      };
      
    } catch (error) {
      console.error('Error parsing Inverter AgentCore response:', error);
      return createEnhancedInverterFallback(inverterData, error);
    }
  };

  const determineInverterStatusFromResponse = (response) => {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('critical') || lowerResponse.includes('urgent') || lowerResponse.includes('immediate') || lowerResponse.includes('stop')) {
      return 'CRITICAL';
    }
    if (lowerResponse.includes('warning') || lowerResponse.includes('attention') || lowerResponse.includes('soon') || lowerResponse.includes('schedule')) {
      return 'WARNING';
    }
    return 'GOOD';
  };

  // Create dynamic UI page summary based on current inverter data and component state
  const createInverterUIPageSummary = () => {
    const dcVoltage = parseFloat(currentData.dc_voltage_v) || 400;
    const acVoltage = parseFloat(currentData.ac_voltage_v) || 230;
    const efficiency = parseFloat(currentData.efficiency_percent) || 95;
    const temperature = parseFloat(currentData.temperature_c) || 65;
    const powerOutput = parseFloat(currentData.power_output_kw) || 35;
    const thd = parseFloat(currentData.thd_percent) || 2.0;
    const hasAnomaly = currentData.inverter_anomaly === 'True';
    const hasFaultCodes = currentData.fault_codes && currentData.fault_codes !== 'None';
    const vehicleInfo = `${currentData.make || 'Unknown Vehicle'} - ${currentData.model || 'Electric Vehicle'} (${currentData.year || '2023'})`;
    
    // Determine overall system status
    let systemStatus = 'optimal';
    let statusColor = '#00ff88';
    let statusIcon = '✅';
    
    if (hasAnomaly || hasFaultCodes || temperature > 80 || efficiency < 90) {
      systemStatus = 'critical';
      statusColor = '#ff4444';
      statusIcon = '🚨';
    } else if (temperature > 70 || efficiency < 94 || thd > 3.0) {
      systemStatus = 'warning';
      statusColor = '#ff9900';
      statusIcon = '⚠️';
    }
    
    // Create dynamic summary
    let summary = '';
    
    // First line - overall status and vehicle info
    if (systemStatus === 'critical') {
      summary = `Inverter monitoring system detecting critical conditions on ${vehicleInfo} requiring immediate attention. `;
    } else if (systemStatus === 'warning') {
      summary = `Inverter monitoring system showing warning indicators for ${vehicleInfo} with maintenance needs identified. `;
    } else {
      summary = `Inverter monitoring system operating normally for ${vehicleInfo} with all parameters within acceptable ranges. `;
    }
    
    // Second line - specific metrics and data flow
    const dataUpdateFreq = '5-second intervals';
    const activeMetrics = [];
    
    if (temperature > 65) activeMetrics.push(`temperature ${temperature.toFixed(1)}°C`);
    if (efficiency < 95) activeMetrics.push(`efficiency ${efficiency.toFixed(1)}%`);
    if (thd > 2.0) activeMetrics.push(`THD ${thd.toFixed(1)}%`);
    if (dcVoltage < 390 || dcVoltage > 410) activeMetrics.push(`DC voltage ${dcVoltage.toFixed(1)}V`);
    
    if (activeMetrics.length > 0) {
      summary += `Real-time data streaming at ${dataUpdateFreq} shows active monitoring of ${activeMetrics.join(', ')} with integrated ML analysis and predictive maintenance alerts.`;
    } else {
      summary += `Real-time data streaming at ${dataUpdateFreq} with comprehensive inverter health monitoring, ML-powered analysis, and predictive maintenance recommendations.`;
    }
    
    return {
      summary,
      status: systemStatus,
      statusColor,
      statusIcon,
      vehicleInfo,
      dataPoints: {
        dcVoltage: dcVoltage.toFixed(1),
        acVoltage: acVoltage.toFixed(1),
        efficiency: efficiency.toFixed(1),
        temperature: temperature.toFixed(1),
        powerOutput: powerOutput.toFixed(1),
        thd: thd.toFixed(1)
      }
    };
  };

  // Get AI recommendations - prioritize GenAI (Claude Sonnet 4.5) over rule-based
  const getAiRecommendations = () => {
    // Priority 1: Use GenAI analysis if available
    if (genAiAnalysis && genAiAnalysis.recommendations) {
      console.log('Using Inverter GenAI (Claude Sonnet 4.5) recommendations');
      return genAiAnalysis.recommendations.map(rec => ({
        action: rec.action,
        priority: rec.priority,
        reason: rec.reason,
        urgency: rec.urgency,
        genai: true // Mark as GenAI generated
      }));
    }
    
    // Priority 2: Use ML analysis if available
    if (currentMlData?.ml_analysis?.recommendations) {
      console.log('Using Inverter ML analysis recommendations');
      const allRecs = currentMlData.ml_analysis.recommendations;
      return allRecs.slice(0, 3).map(rec => ({...rec, ml: true}));
    }
    
    // Priority 3: Fallback to rule-based recommendations
    console.log('Using fallback rule-based inverter recommendations');
    
    const dcVoltage = parseFloat(currentData.dc_voltage_v) || 400;
    const efficiency = parseFloat(currentData.efficiency_percent) || 95;
    const temperature = parseFloat(currentData.temperature_c) || 65;
    
    if (temperature > 75 || efficiency < 92) {
      return [
        { action: "Monitor inverter temperature and efficiency closely", priority: "HIGH", fallback: true },
        { action: "Schedule inverter diagnostic within 1 week", priority: "MEDIUM", fallback: true }
      ];
    } else if (dcVoltage < 380 || dcVoltage > 420) {
      return [
        { action: "Check DC bus voltage stability", priority: "MEDIUM", fallback: true },
        { action: "Inspect power connections and filters", priority: "LOW", fallback: true }
      ];
    }
    
    return [
      { action: "Continue regular inverter maintenance schedule", priority: "LOW", fallback: true },
      { action: "Monitor power electronics performance monthly", priority: "LOW", fallback: true }
    ];
  };

  const aiRecommendations = getAiRecommendations();

  // Helper function to generate SVG path from data points
  const generateSVGPath = (points) => {
    if (!points || points.length === 0) return '';
    
    let path = `M${points[0].x},${points[0].y}`;
    
    // Use quadratic curves for smooth lines
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = current.x + (next.x - current.x) * 0.5;
      const controlY = current.y;
      path += ` Q${controlX},${controlY} ${next.x},${next.y}`;
    }
    
    return path;
  };

  // Helper function to create dynamic gauge arc
  const createGaugeArc = (angle, radius = 35, strokeWidth = 3) => {
    const centerX = 45;
    const centerY = 45;
    const startAngle = 0;
    const endAngle = Math.min(180, Math.max(0, angle));
    
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
  };

  // Dynamic power metrics calculations based on current inverter data
  const getDynamicPowerMetrics = () => {
    const dcVoltage = parseFloat(currentData.dc_voltage_v) || 400;
    const acVoltage = parseFloat(currentData.ac_voltage_v) || 230;
    const dcCurrent = parseFloat(currentData.dc_current_a) || 125;
    const acCurrent = parseFloat(currentData.ac_current_a) || 90;
    const powerOutput = parseFloat(currentData.power_output_kw) || 35;
    const efficiency = parseFloat(currentData.efficiency_percent) || 95;
    
    return {
      inputVoltage: Math.round(acVoltage), // AC input voltage
      outputVoltage: Math.round(dcVoltage), // DC output voltage  
      inputCurrent: Math.round(acCurrent), // AC input current
      outputCurrent: Math.round(dcCurrent), // DC output current
      powerOutput: powerOutput.toFixed(1),
      efficiency: efficiency.toFixed(1)
    };
  };

  // Dynamic fault codes based on current inverter data
  const getDynamicFaultCodes = () => {
    const faultCodes = currentData.fault_codes;
    const hasAnomaly = currentData.inverter_anomaly === 'True';
    const anomalyType = currentData.anomaly_type_inverter;
    
    if (faultCodes && faultCodes !== 'None') {
      // Map fault codes to descriptions
      const faultDescriptions = {
        'I001': { name: 'Overheating', description: 'Inverter temperature exceeds safe operating limits.' },
        'I002': { name: 'Voltage Fluctuation', description: 'DC bus voltage instability detected.' },
        'I003': { name: 'Current Overload', description: 'Output current exceeds rated capacity.' },
        'I004': { name: 'THD High', description: 'Total harmonic distortion above acceptable levels.' },
        'I005': { name: 'Switching Fault', description: 'IGBT switching frequency irregularities detected.' }
      };
      
      const fault = faultDescriptions[faultCodes] || { 
        name: 'Unknown Fault', 
        description: 'Unidentified fault code detected.' 
      };
      
      return {
        hasFault: true,
        faultCode: faultCodes,
        faultName: fault.name,
        faultDescription: fault.description,
        severity: hasAnomaly ? 'HIGH' : 'MEDIUM'
      };
    } else if (hasAnomaly && anomalyType && anomalyType !== 'normal') {
      return {
        hasFault: true,
        faultCode: 'ANOM',
        faultName: anomalyType.replace('_', ' ').toUpperCase(),
        faultDescription: `Anomaly detected in inverter operation: ${anomalyType}.`,
        severity: 'MEDIUM'
      };
    }
    
    return {
      hasFault: false,
      faultCode: null,
      faultName: 'No Faults',
      faultDescription: 'All systems operating normally.',
      severity: 'NORMAL'
    };
  };

  // Dynamic THD and modulation data
  const getDynamicModulationData = () => {
    const thd = parseFloat(currentData.thd_percent) || 2.0;
    const modulationIndex = parseFloat(currentData.modulation_index) || 0.85;
    const switchingFreq = parseFloat(currentData.switching_frequency_khz) || 10.5;
    
    return {
      thd: thd.toFixed(1),
      modulationIndex: (modulationIndex * 100).toFixed(1), // Convert to percentage
      switchingFrequency: switchingFreq.toFixed(1),
      harmonicStatus: thd > 5 ? 'HIGH' : thd > 3 ? 'MEDIUM' : 'LOW'
    };
  };

  const powerMetrics = getDynamicPowerMetrics();
  const faultData = getDynamicFaultCodes();
  const modulationData = getDynamicModulationData();

  // Dynamic failure prediction calculations based on current inverter data
  const calculateInverterHealthMetrics = () => {
    const efficiency = parseFloat(currentData.efficiency_percent) || 95;
    const temperature = parseFloat(currentData.temperature_c) || 65;
    const thd = parseFloat(currentData.thd_percent) || 2.0;
    const dcVoltage = parseFloat(currentData.dc_voltage_v) || 400;
    const hasAnomaly = currentData.inverter_anomaly === 'True';
    const hasFaultCodes = currentData.fault_codes && currentData.fault_codes !== 'None';
    
    // Calculate current health percentage based on multiple factors
    let healthScore = 100;
    
    // Efficiency impact (30% weight)
    if (efficiency < 90) healthScore -= 25;
    else if (efficiency < 94) healthScore -= 15;
    else if (efficiency < 96) healthScore -= 5;
    
    // Temperature impact (25% weight)
    if (temperature > 80) healthScore -= 20;
    else if (temperature > 70) healthScore -= 12;
    else if (temperature > 65) healthScore -= 6;
    
    // THD impact (20% weight)
    if (thd > 5) healthScore -= 15;
    else if (thd > 3) healthScore -= 8;
    else if (thd > 2.5) healthScore -= 4;
    
    // Voltage stability impact (15% weight)
    if (dcVoltage < 350 || dcVoltage > 450) healthScore -= 12;
    else if (dcVoltage < 380 || dcVoltage > 420) healthScore -= 6;
    
    // Anomaly impact (10% weight)
    if (hasAnomaly || hasFaultCodes) healthScore -= 15;
    
    // Ensure health score is within bounds
    healthScore = Math.max(20, Math.min(100, healthScore));
    
    return {
      currentHealth: healthScore,
      efficiency,
      temperature,
      thd,
      dcVoltage,
      hasAnomaly,
      hasFaultCodes
    };
  };

  // Generate realistic failure prediction graph data (stable for Vehicle 1)
  const generateFailurePredictionData = () => {
    const metrics = calculateInverterHealthMetrics();
    
    // Fixed pattern for Vehicle 1 (EV-1001) - consistent and realistic
    const pattern = { baseHealth: 85, trend: 'declining', severity: 'moderate' };
    
    // Generate stable historical data points
    const historicalPoints = [];
    const baseHealthStart = pattern.baseHealth + 10; // Start higher
    
    for (let i = 0; i < 7; i++) {
      const x = 35 + (i * 15);
      let health;
      
      if (pattern.trend === 'declining') {
        // Gradual decline with some variation
        const decline = (15 * i / 6) + (pattern.severity === 'high' ? 5 : 2);
        health = baseHealthStart - decline;
      } else {
        // Stable with minor fluctuations
        const fluctuation = Math.sin((1 + i) * 0.1) * 2;
        health = pattern.baseHealth + fluctuation;
      }
      
      const y = 155 - (health * 1.3);
      historicalPoints.push({ x, y, health: Math.max(20, health) });
    }
    
    // Generate stable predicted data points
    const predictedPoints = [];
    const currentHealth = historicalPoints[6].health;
    
    // Determine realistic degradation rate based on vehicle pattern and current metrics
    let degradationRate;
    if (pattern.severity === 'high' || metrics.hasAnomaly || metrics.hasFaultCodes) {
      degradationRate = 2.0; // High degradation
    } else if (pattern.severity === 'moderate' || metrics.temperature > 70 || metrics.efficiency < 94) {
      degradationRate = 1.0; // Moderate degradation
    } else {
      degradationRate = 0.3; // Low degradation
    }
    
    // Add slight real-time adjustment based on current conditions (max ±0.5)
    const conditionAdjustment = (metrics.temperature > 75 ? 0.3 : 0) + 
                               (metrics.efficiency < 92 ? 0.2 : 0) + 
                               (metrics.thd > 3 ? 0.2 : 0);
    degradationRate += Math.min(0.5, conditionAdjustment);
    
    let futureHealth = currentHealth;
    for (let i = 1; i <= 6; i++) {
      const x = 125 + (i * 15);
      
      // Gradual decline with vehicle-specific pattern
      if (pattern.trend === 'declining') {
        futureHealth = Math.max(20, futureHealth - degradationRate);
      } else {
        // Stable trend with very gradual decline
        futureHealth = Math.max(20, futureHealth - (degradationRate * 0.5));
      }
      
      const y = 155 - (futureHealth * 1.3);
      predictedPoints.push({ x, y, health: futureHealth });
    }
    
    return {
      historical: historicalPoints,
      predicted: predictedPoints,
      currentHealth,
      degradationRate,
      vehiclePattern: pattern
    };
  };

  // Get dynamic graph data
  const graphData = generateFailurePredictionData();

  // Calculate remaining useful life percentage
  const calculateRemainingLife = () => {
    // Check if this is a normal/healthy vehicle
    const isHealthyVehicle = carId === '1HGBH41JXMN109876' || carId === 'WBADT43452G123789';
    
    // Healthy vehicle starts at 92% and stays high
    let baseRemainingLife = isHealthyVehicle ? 92 : 68;
    
    // Small adjustments based on current real-time conditions
    let adjustment = 0;
    const metrics = calculateInverterHealthMetrics();
    
    if (isHealthyVehicle) {
      // Healthy vehicle: very minor adjustments (max ±3%)
      if (metrics.temperature > 65) adjustment -= 1;
      if (metrics.efficiency < 95) adjustment -= 1;
      if (metrics.thd > 2.0) adjustment -= 1;
    } else {
      // Problem vehicle: larger adjustments (max ±10%)
      if (metrics.hasAnomaly) adjustment -= 8;
      if (metrics.temperature > 75) adjustment -= 5;
      if (metrics.efficiency < 90) adjustment -= 7;
      if (metrics.thd > 4) adjustment -= 3;
    }
    
    // Apply adjustment but keep it reasonable
    const finalRemainingLife = Math.max(15, Math.min(95, baseRemainingLife + adjustment));
    
    return Math.round(finalRemainingLife);
  };

  const remainingLife = calculateRemainingLife();
  
  // Log stable calculations for debugging (Vehicle 1 - EV-1001)
  console.log('Inverter Fixed Vehicle Analysis:', {
    vehicle: `${currentData.year} ${currentData.make}`,
    vehicleId: currentData.vehicle_id,
    currentHealth: Math.round(graphData.currentHealth),
    remainingLife: remainingLife + '%',
    efficiency: parseFloat(currentData.efficiency_percent) || 95,
    temperature: parseFloat(currentData.temperature_c) || 65,
    status: 'Fixed vehicle - no rotation'
  });

  // Responsive sizing functions
  const spacing = useMemo(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      fontSize: width < 1200 ? '13px' : width < 1400 ? '15px' : '16px',
      smallFontSize: width < 1200 ? '9px' : width < 1400 ? '10px' : '10px',
      titleFontSize: width < 1200 ? '15px' : width < 1400 ? '17px' : '18px',
      gaugeSize: width < 1200 ? 80 : width < 1400 ? 90 : 100,
      chartHeight: height < 800 ? 200 : height < 900 ? 220 : 240,
      containerPadding: width < 1200 ? '10px' : '15px',
      margin: width < 1200 ? '10px' : '15px',
      bottomContainerHeight: `${Math.max(280, Math.min(600, height * 0.4))}px`
    };
  }, []);

  return (
    <div className="invertor-page">
      <div className="invertor-container" style={{ 
        zoom: windowWidth <= 1024 ? windowWidth / 1440 : (windowWidth >= 1820 && windowWidth <= 2400 ? windowWidth / 2560 : (windowWidth >= 2685 ? windowWidth / 1920 : undefined)),
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '100vh'
      }}>
        {/* Header */}
        <header className="header" style={{ height: windowWidth <= 1440 ? '45px' : windowWidth <= 1700 ? '50px' : windowWidth <= 1815 ? '60px' : 'auto', padding: windowWidth <= 1440 ? '8px 15px' : windowWidth <= 1700 ? '10px 20px' : windowWidth <= 1815 ? '15px 20px' : '20px' }}>
          <div className="header-left">
            <svg width="43px" height="20px" viewBox="0 0 43 20" style={{ marginRight: '8px' }}>
              <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12"/>
              <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12"/>
              <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12"/>
            </svg>
            <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Amazon Ember' }}>EV Digital Twin</h1>
          </div>
          <div className="header-right">
            <div className="user-dropdown" style={{ position: 'relative' }}>
              <div 
                className="user-profile-container" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <span className="user-profile">newuser</span>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              {dropdownOpen && (
                <div className="dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  background: '#1b1e20',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  minWidth: '250px',
                  zIndex: 1000,
                  marginTop: '5px'
                }}>
                  <div className="dropdown-item" onClick={() => navigate('/')} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={require('./assets/car.png')} alt="Car" style={{ width: '16px', height: '16px' }} />
                    Connected Vehicles
                  </div>
                  <div className="dropdown-item" onClick={() => navigate('/fleet')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
                      <path d="M15 18H9"/>
                      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
                      <circle cx="17" cy="18" r="2"/>
                      <circle cx="7" cy="18" r="2"/>
                    </svg>
                    Fleet
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Navigation Header */}
        <div className="nav-header" style={{ margin: '20px 20px 20px', borderBottom: 'none' }}>
          <button 
            className="back-button"
            onClick={() => navigate(`/car/${carId}`)}
          >
            <span>←</span>
            <span>Inverter</span>
          </button>
        </div>
        


        <div style={{ margin: windowWidth <= 1440 ? '-15px 20px 5px' : windowWidth <= 1700 ? '-10px 20px 5px' : windowWidth <= 1815 ? '0px 20px 5px' : '10px 20px 5px' }}>
          <div className="invertor-layout">
            {/* Main Content */}
            <div className="main-panel" style={{ marginTop: windowWidth <= 1700 ? '70px' : '90px' }}>
              {/* Power Metrics Container - Top */}
              <div className="data-container" style={{ marginBottom: '20px', marginTop: '-20px', minHeight: windowWidth <= 1440 ? '400px' : windowWidth <= 1700 ? '430px' : windowWidth <= 1815 ? '480px' : '530px', overflow: 'visible', width: 'calc(100% + 30px)', marginLeft: '-15px' }}>
                <h3 style={{ fontSize: spacing.titleFontSize }}>Power Metrics</h3>
                <img 
                  src={require('./assets/invertor.png')} 
                  alt="Invertor" 
                  className="invertor-image-positioned"
                />
                <div className="invertor-metrics-grid" style={{ marginTop: '30px' }}>
                  <div className="invertor-gauge">
                    <div className="gauge-container" style={{ position: 'relative' }}>
                      {/* Dynamic Semi-Circle Gauge */}
                      <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                        {/* Background arc */}
                        <path
                          d="M 10 45 A 35 35 0 0 1 80 45"
                          fill="none"
                          stroke="rgba(104,111,120,0.3)"
                          strokeWidth="3"
                        />
                        {/* Dynamic progress arc */}
                        <path
                          d={createGaugeArc(gaugeAngles.inputVoltage)}
                          fill="none"
                          stroke="#37bc12"
                          strokeWidth="3"
                          strokeLinecap="round"
                          style={{ 
                            transition: 'all 0.5s ease-in-out',
                            filter: 'drop-shadow(0 0 3px rgba(55, 188, 18, 0.5))'
                          }}
                        />
                        {/* Center indicator */}
                        <circle cx="45" cy="45" r="2" fill="#37bc12" />
                      </svg>
                      <div className="gauge-value" style={{ marginTop: '15px', fontSize: spacing.fontSize, fontWeight: 'bold', color: '#37bc12' }}>
                        {powerMetrics.inputVoltage}V
                      </div>
                      <div className="gauge-label" style={{ fontSize: spacing.smallFontSize }}>Input Voltage</div>
                      <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.6)' }}>(AC)</div>
                      <span style={{ position: 'absolute', left: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>110</span>
                      <span style={{ position: 'absolute', right: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>240</span>
                    </div>
                    <svg width={`${spacing.gaugeSize}px`} height="45px" viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      {/* Dynamic Current Waveform */}
                      <path
                        d={generateSVGPath(chartData.inputVoltage.current)}
                        fill="none"
                        stroke="#37bc12"
                        strokeWidth="1.5"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(55, 188, 18, 0.3))'
                        }}
                      />
                      {/* Dynamic Expected Waveform */}
                      <path
                        d={generateSVGPath(chartData.inputVoltage.expected)}
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                        }}
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: spacing.smallFontSize, marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>
                  <div className="invertor-gauge">
                    <div className="gauge-container" style={{ position: 'relative' }}>
                      {/* Dynamic Semi-Circle Gauge */}
                      <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                        {/* Background arc */}
                        <path
                          d="M 10 45 A 35 35 0 0 1 80 45"
                          fill="none"
                          stroke="rgba(104,111,120,0.3)"
                          strokeWidth="3"
                        />
                        {/* Dynamic progress arc */}
                        <path
                          d={createGaugeArc(gaugeAngles.outputVoltage)}
                          fill="none"
                          stroke="#0088ff"
                          strokeWidth="3"
                          strokeLinecap="round"
                          style={{ 
                            transition: 'all 0.5s ease-in-out',
                            filter: 'drop-shadow(0 0 3px rgba(0, 136, 255, 0.5))'
                          }}
                        />
                        {/* Center indicator */}
                        <circle cx="45" cy="45" r="2" fill="#0088ff" />
                      </svg>
                      <div className="gauge-value" style={{ marginTop: '15px', fontSize: spacing.fontSize, fontWeight: 'bold', color: '#0088ff' }}>
                        {powerMetrics.outputVoltage}V
                      </div>
                      <div className="gauge-label" style={{ fontSize: spacing.smallFontSize }}>Output Voltage</div>
                      <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.6)' }}>(DC)</div>
                      <span style={{ position: 'absolute', left: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>300</span>
                      <span style={{ position: 'absolute', right: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>450</span>
                    </div>
                    <svg width="90px" height="45px" viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      {/* Dynamic Current Waveform */}
                      <path
                        d={generateSVGPath(chartData.outputVoltage.current)}
                        fill="none"
                        stroke="#0088ff"
                        strokeWidth="1.5"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(0, 136, 255, 0.3))'
                        }}
                      />
                      {/* Dynamic Expected Waveform */}
                      <path
                        d={generateSVGPath(chartData.outputVoltage.expected)}
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                        }}
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '6px', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>
                  <div className="invertor-gauge">
                    <div className="gauge-container" style={{ position: 'relative' }}>
                      {/* Dynamic Semi-Circle Gauge */}
                      <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                        {/* Background arc */}
                        <path
                          d="M 10 45 A 35 35 0 0 1 80 45"
                          fill="none"
                          stroke="rgba(104,111,120,0.3)"
                          strokeWidth="3"
                        />
                        {/* Dynamic progress arc */}
                        <path
                          d={createGaugeArc(gaugeAngles.inputCurrent)}
                          fill="none"
                          stroke="#ff6b35"
                          strokeWidth="3"
                          strokeLinecap="round"
                          style={{ 
                            transition: 'all 0.5s ease-in-out',
                            filter: 'drop-shadow(0 0 3px rgba(255, 107, 53, 0.5))'
                          }}
                        />
                        {/* Center indicator */}
                        <circle cx="45" cy="45" r="2" fill="#ff6b35" />
                      </svg>
                      <div className="gauge-value" style={{ marginTop: '15px', fontSize: spacing.fontSize, fontWeight: 'bold', color: '#ff6b35' }}>
                        {powerMetrics.inputCurrent}A
                      </div>
                      <div className="gauge-label" style={{ fontSize: spacing.smallFontSize }}>Input Current</div>
                      <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.6)' }}>(AC)</div>
                      <span style={{ position: 'absolute', left: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>50</span>
                      <span style={{ position: 'absolute', right: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>150</span>
                    </div>
                    <svg width="90px" height="45px" viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      {/* Dynamic Current Waveform */}
                      <path
                        d={generateSVGPath(chartData.inputCurrent.current)}
                        fill="none"
                        stroke="#ff6b35"
                        strokeWidth="1.5"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(255, 107, 53, 0.3))'
                        }}
                      />
                      {/* Dynamic Expected Waveform */}
                      <path
                        d={generateSVGPath(chartData.inputCurrent.expected)}
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                        }}
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '6px', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>
                  <div className="invertor-gauge">
                    <div className="gauge-container" style={{ position: 'relative' }}>
                      {/* Dynamic Semi-Circle Gauge */}
                      <svg width="90px" height="50px" viewBox="0 0 90 50" style={{ position: 'absolute', top: '0', left: '0' }}>
                        {/* Background arc */}
                        <path
                          d="M 10 45 A 35 35 0 0 1 80 45"
                          fill="none"
                          stroke="rgba(104,111,120,0.3)"
                          strokeWidth="3"
                        />
                        {/* Dynamic progress arc */}
                        <path
                          d={createGaugeArc(gaugeAngles.outputCurrent)}
                          fill="none"
                          stroke="#9b59b6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          style={{ 
                            transition: 'all 0.5s ease-in-out',
                            filter: 'drop-shadow(0 0 3px rgba(155, 89, 182, 0.5))'
                          }}
                        />
                        {/* Center indicator */}
                        <circle cx="45" cy="45" r="2" fill="#9b59b6" />
                      </svg>
                      <div className="gauge-value" style={{ marginTop: '15px', fontSize: spacing.fontSize, fontWeight: 'bold', color: '#9b59b6' }}>
                        {powerMetrics.outputCurrent}A
                      </div>
                      <div className="gauge-label" style={{ fontSize: spacing.smallFontSize }}>Output Current</div>
                      <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.6)' }}>(DC)</div>
                      <span style={{ position: 'absolute', left: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>80</span>
                      <span style={{ position: 'absolute', right: '0', bottom: '8px', fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'normal' }}>200</span>
                    </div>
                    <svg width="90px" height="45px" viewBox="0 0 90 45" style={{ marginTop: '5px' }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <line key={i} x1="0" y1={8 + i * 8} x2="90" y2={8 + i * 8} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                      ))}
                      {/* Dynamic Current Waveform */}
                      <path
                        d={generateSVGPath(chartData.outputCurrent.current)}
                        fill="none"
                        stroke="#9b59b6"
                        strokeWidth="1.5"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(155, 89, 182, 0.3))'
                        }}
                      />
                      {/* Dynamic Expected Waveform */}
                      <path
                        d={generateSVGPath(chartData.outputCurrent.expected)}
                        fill="none"
                        stroke="#ff9900"
                        strokeWidth="1.5"
                        strokeDasharray="2,2"
                        style={{ 
                          transition: 'all 0.3s ease-in-out',
                          filter: 'drop-shadow(0 0 2px rgba(255, 153, 0, 0.3))'
                        }}
                      />
                    </svg>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '6px', marginTop: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color current"></span>
                        <span>Current</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span className="legend-color expected"></span>
                        <span>Expected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temperature & DC Link Box */}
                <div style={{ 
                  position: 'absolute', 
                  right: windowWidth <= 1440 ? '20px' : windowWidth <= 1700 ? '80px' : windowWidth <= 1815 ? '100px' : '150px', 
                  top: windowWidth <= 1440 ? '350px' : windowWidth <= 1700 ? '360px' : windowWidth <= 1815 ? '370px' : '380px',
                  background: '#000',
                  border: '1px solid #3a4552',
                  borderRadius: '8px',
                  padding: '15px 20px',
                  display: 'flex',
                  gap: '30px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: windowWidth <= 1440 ? '13px' : windowWidth <= 1700 ? '14px' : windowWidth <= 1815 ? '15px' : '16px' }}>🌡️</span>
                      <div style={{ fontSize: windowWidth <= 1440 ? '13px' : windowWidth <= 1700 ? '14px' : windowWidth <= 1815 ? '16px' : spacing.titleFontSize }}><span style={{ fontSize: windowWidth <= 1440 ? '18px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '22px' : `calc(${spacing.titleFontSize} * 1.5)` }}>54</span>°C</div>
                    </div>
                    <div style={{ fontSize: windowWidth <= 1440 ? '9px' : windowWidth <= 1700 ? '10px' : windowWidth <= 1815 ? '11px' : spacing.fontSize }}>Inverter Temperature</div>
                  </div>
                  <div style={{ borderLeft: '1px solid #3a4552', paddingLeft: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.8)' }}>
                      DC Link Voltage: <span style={{ color: 'white', fontWeight: 'bold' }}>{powerMetrics.outputVoltage}V</span>
                    </div>
                    <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                      Power Output: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{powerMetrics.powerOutput}kW</span>
                    </div>
                    <div style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.8)', marginTop: '5px' }}>
                      Efficiency: <span style={{ color: parseFloat(powerMetrics.efficiency) > 94 ? '#00ff88' : parseFloat(powerMetrics.efficiency) > 90 ? '#ff9900' : '#ff4444', fontWeight: 'bold' }}>{powerMetrics.efficiency}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Containers */}
              <div className="bottom-containers" style={{ 
                marginBottom: '0',
                marginTop: windowWidth <= 1440 ? '-40px' : windowWidth <= 1700 ? '-35px' : windowWidth <= 1815 ? '-30px' : '-30px',
                transform: windowWidth <= 1440 ? 'scaleY(0.75)' : windowWidth <= 1700 ? 'scaleY(0.8)' : windowWidth <= 1815 ? 'scaleY(0.9)' : 'none',
                transformOrigin: 'top'
              }}>
                <div className="data-container" style={{ 
                  height: windowWidth <= 1700 ? spacing.bottomContainerHeight : windowWidth <= 1815 ? '350px !important' : '450px', 
                  minHeight: windowWidth <= 1700 ? 'auto' : windowWidth <= 1815 ? '350px !important' : 'auto', 
                  maxHeight: windowWidth <= 1700 ? 'auto' : windowWidth <= 1815 ? '350px !important' : 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: windowWidth >= 1600 ? 'flex-start' : 'normal',
                  padding: '15px',
                  overflow: 'hidden'
                }}>
                  <h4 style={{ fontSize: spacing.titleFontSize }}>Pulse with Modulations</h4>
                  <img src={require('./assets/pulsemod.png')} alt="Pulse Modulation" style={{ width: '100%', height: 'auto', marginTop: '10px' }} />
                  <div className="invertor-pulse-metrics" style={{ 
                    marginTop: '10px', 
                    padding: '10px 15px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.7)' }}>THD:</span>
                      <span style={{ fontSize: spacing.smallFontSize, color: modulationData.harmonicStatus === 'HIGH' ? '#ff4444' : modulationData.harmonicStatus === 'MEDIUM' ? '#ff9900' : '#00ff88', fontWeight: 'bold' }}>
                        {modulationData.thd}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.7)' }}>Modulation:</span>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'bold' }}>{modulationData.modulationIndex}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'rgba(255,255,255,0.7)' }}>Switching:</span>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'white', fontWeight: 'bold' }}>{modulationData.switchingFrequency} kHz</span>
                    </div>
                    <div style={{ 
                      borderTop: '1px solid rgba(255,255,255,0.2)', 
                      paddingTop: '8px', 
                      marginTop: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        fontSize: spacing.smallFontSize, 
                        color: modulationData.harmonicStatus === 'HIGH' ? '#ff4444' : modulationData.harmonicStatus === 'MEDIUM' ? '#ff9900' : '#00ff88',
                        fontWeight: 'bold'
                      }}>
                        Harmonic Distortion: {modulationData.harmonicStatus}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="data-container" style={{ 
                  height: windowWidth <= 1700 ? spacing.bottomContainerHeight : windowWidth <= 1815 ? '350px !important' : '450px', 
                  minHeight: windowWidth <= 1700 ? 'auto' : windowWidth <= 1815 ? '350px !important' : 'auto', 
                  maxHeight: windowWidth <= 1700 ? 'auto' : windowWidth <= 1815 ? '350px !important' : 'auto', 
                  position: 'relative', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: windowWidth > 1815 ? 'flex-start' : 'normal', 
                  marginLeft: windowWidth <= 1700 ? '-10px' : '0',
                  padding: '15px',
                  overflow: 'hidden'
                }}>
                  <h4 style={{ fontSize: spacing.titleFontSize }}>Fault Codes</h4>
                  <div style={{ 
                    padding: '12px 16px', 
                    textAlign: 'center', 
                    border: `1px solid ${faultData.hasFault ? (faultData.severity === 'HIGH' ? '#ff4444' : '#ff9900') : 'rgba(255,255,255,0.3)'}`, 
                    borderRadius: '8px', 
                    width: '100%',
                    maxWidth: '200px',
                    margin: '10px auto 0 auto',
                    backgroundColor: faultData.hasFault ? (faultData.severity === 'HIGH' ? 'rgba(255,68,68,0.1)' : 'rgba(255,153,0,0.1)') : 'rgba(0,0,0,0.3)',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ fontSize: spacing.smallFontSize, color: faultData.hasFault ? (faultData.severity === 'HIGH' ? '#ff4444' : '#ff9900') : '#00ff88', fontWeight: 'bold' }}>
                      {faultData.faultCode || 'CLEAR'}
                    </div>
                    <div style={{ fontSize: spacing.smallFontSize, color: 'white', marginTop: '2px' }}>
                      {faultData.faultName}
                    </div>
                  </div>
                  <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.3)' }}></div>
                  <div className="invertor-fault-desc" style={{ 
                    fontSize: spacing.smallFontSize, 
                    color: 'rgba(255,255,255,0.6)', 
                    marginTop: '15px', 
                    textAlign: 'center', 
                    lineHeight: '1.4',
                    padding: '0 10px',
                    wordWrap: 'break-word',
                    overflow: 'hidden'
                  }}>
                    {faultData.faultDescription}
                  </div>
                  {faultData.hasFault && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '6px 12px', 
                      backgroundColor: faultData.severity === 'HIGH' ? 'rgba(255,68,68,0.2)' : 'rgba(255,153,0,0.2)',
                      borderRadius: '4px',
                      textAlign: 'center',
                      border: `1px solid ${faultData.severity === 'HIGH' ? 'rgba(255,68,68,0.4)' : 'rgba(255,153,0,0.4)'}`,
                      maxWidth: '150px',
                      margin: '10px auto 0 auto'
                    }}>
                      <span style={{ fontSize: spacing.smallFontSize, color: faultData.severity === 'HIGH' ? '#ff4444' : '#ff9900', fontWeight: 'bold' }}>
                        {faultData.severity} PRIORITY
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="right-panel" style={{ overflow: 'hidden' }}>
              <div className="battery-prediction">
                <div className="prediction-header">
                  <h2 style={{ fontSize: windowWidth <= 1440 ? '16px' : windowWidth <= 1700 ? '18px' : windowWidth <= 1815 ? '22px' : '24px', marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }}>Inverter Prediction</h2>
                  <img src={require('./assets/warning.png')} alt="Warning" className="info-icon" style={{ width: '20px', height: '20px', cursor: 'pointer', zIndex: 99999, position: 'relative', marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }} onClick={() => setShowModal(true)} />
                </div>

                {/* Failure Prediction Chart */}
                <div className="motor-prediction-container" style={{ paddingLeft: '30px' }}>
                  <div className="failure-prediction" style={{ marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: windowWidth <= 1440 ? '12px' : windowWidth <= 1700 ? '14px' : windowWidth <= 1815 ? '17px' : '20px', marginTop: windowWidth <= 1700 ? '-25px' : '-15px' }}>Inverter Failure Prediction</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: windowWidth <= 1700 ? '5px' : '10px', position: 'relative', zIndex: 100 }}>
                        <span style={{ fontSize: windowWidth <= 1440 ? '10px' : '11px', color: 'rgba(255,255,255,0.7)' }}>
                          Show Prediction
                        </span>
                        <button
                          onClick={() => {
                            console.log('Toggle button clicked! Current state:', showPrediction);
                            setShowPrediction(!showPrediction);
                          }}
                          style={{
                            background: showPrediction ? '#37bc12' : 'rgba(255,255,255,0.2)',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '12px',
                            width: '40px',
                            height: '20px',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 1000,
                            transition: 'all 0.3s ease',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: showPrediction ? 'flex-end' : 'flex-start',
                            paddingLeft: showPrediction ? '0' : '2px',
                            paddingRight: showPrediction ? '2px' : '0',
                            pointerEvents: 'auto'
                          }}
                        >
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}></div>
                        </button>
                      </div>
                    </div>
                    <div className="prediction-legend" style={{ marginTop: windowWidth <= 1700 ? '5px' : '10px', fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                      <div className="legend-item" style={{ fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                        <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                        <span>Past</span>
                      </div>
                      <div className="legend-item" style={{ fontSize: windowWidth <= 1700 ? '11px' : '12px' }}>
                        <div style={{ width: '15px', height: '2px', backgroundColor: 'transparent', borderTop: '2px dashed rgba(56,239,125,1)' }}></div>
                        <span>Predicted</span>
                      </div>
                    </div>
                    <div style={{ position: 'relative', marginTop: '100px' }}>
                      <div className="prediction-chart" style={{ marginTop: windowWidth <= 1440 ? '-180px' : windowWidth <= 1700 ? '-160px' : windowWidth <= 1815 ? '-80px' : windowWidth > 1815 && windowWidth <= 1950 ? '-60px' : windowWidth >= 2560 ? '-100px' : '-60px' }}>
                        <svg width="290" height="180" viewBox="0 0 290 180">
                        {/* Grid lines */}
                        {Array.from({ length: 8 }, (_, i) => (
                          <line key={i} x1="35" y1={20 + i * 20} x2="255" y2={20 + i * 20} stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        {Array.from({ length: 8 }, (_, i) => (
                          <line key={i} x1={35 + i * 30} y1="20" x2={35 + i * 30} y2="160" stroke="rgba(104,111,120,0.3)" strokeWidth="0.5"/>
                        ))}
                        
                        {/* Y-axis labels */}
                        <text x="25" y="25" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">100</text>
                        <text x="25" y="45" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">85</text>
                        <text x="25" y="65" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">70</text>
                        <text x="25" y="85" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">55</text>
                        <text x="25" y="105" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">40</text>
                        <text x="25" y="125" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">25</text>
                        <text x="25" y="145" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">10</text>
                        
                        {/* X-axis labels */}
                        <text x="35" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">0</text>
                        <text x="65" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">30</text>
                        <text x="95" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">60</text>
                        <text x="125" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">90</text>
                        <text x="155" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">120</text>
                        <text x="185" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">150</text>
                        <text x="215" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">180</text>
                        
                        {/* Axis labels */}
                        <text x="145" y="190" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle">Days</text>
                        <text x="8" y="90" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" transform="rotate(-90 8 90)">Health %</text>
                        
                        {/* Critical failure threshold line */}
                        <line x1="35" y1="105" x2="255" y2="105" stroke="rgba(255,68,68,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                        <text x="260" y="110" fill="rgba(255,68,68,0.9)" fontSize="7">Critical</text>
                        
                        {/* Warning threshold line */}
                        <line x1="35" y1="85" x2="255" y2="85" stroke="rgba(255,153,0,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                        <text x="260" y="90" fill="rgba(255,153,0,0.9)" fontSize="7">Warning</text>
                        
                        {/* Dynamic Past data (orange) - Based on current inverter health */}
                        <polyline
                          points={graphData.historical.map(point => `${point.x},${point.y}`).join(' ')}
                          fill="none"
                          stroke="rgba(255,153,0,1)"
                          strokeWidth="2"
                        />
                        
                        {/* Dynamic Predicted data (green/orange based on trend) - Animated based on toggle */}
                        {showPrediction && (
                          <polyline
                            points={`125,${graphData.historical[6].y} ${graphData.predicted.map(point => `${point.x},${point.y}`).join(' ')}`}
                            fill="none"
                            stroke={graphData.degradationRate > 1.5 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}
                            strokeWidth="2"
                            strokeDasharray="4,4"
                            opacity={animationProgress}
                          />
                        )}
                        
                        {/* Dynamic Data points - Historical */}
                        {graphData.historical.slice(0, 6).map((point, index) => (
                          <circle key={`hist-${index}`} cx={point.x} cy={point.y} r="1.5" fill="rgba(255,153,0,1)"/>
                        ))}
                        
                        {/* Current point - Highlighted with dynamic position */}
                        <circle cx="125" cy={graphData.historical[6].y} r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                        
                        {/* Dynamic Data points - Predicted (appear progressively) */}
                        {graphData.predicted.map((point, index) => {
                          const threshold = 0.15 + (index * 0.15); // 0.15, 0.3, 0.45, 0.6, 0.75, 0.9
                          return showPrediction && animationProgress > threshold && (
                            <circle 
                              key={`pred-${index}`} 
                              cx={point.x} 
                              cy={point.y} 
                              r="1.5" 
                              fill={point.health < 40 ? "rgba(255,68,68,1)" : point.health < 60 ? "rgba(255,153,0,1)" : "rgba(56,239,125,1)"}
                              opacity={Math.min(1, (animationProgress - threshold) * 5)}
                            />
                          );
                        })}
                        
                        {/* Dynamic Annotations */}
                        <text x="125" y={graphData.historical[6].y - 7} fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                        <text x="125" y={graphData.historical[6].y + 15} fill="rgba(255,255,255,0.7)" fontSize="6" textAnchor="middle">{Math.round(graphData.currentHealth)}%</text>
                        
                        {/* Dynamic status annotation - Animated */}
                        {showPrediction && animationProgress > 0.5 && (
                          <text 
                            x="185" 
                            y={graphData.predicted[3]?.y - 5 || 70} 
                            fill={graphData.degradationRate > 1.5 ? "rgba(255,153,0,0.9)" : "rgba(56,239,125,0.9)"} 
                            fontSize="6" 
                            textAnchor="middle"
                            opacity={Math.min(1, (animationProgress - 0.5) * 2)}
                          >
                            {graphData.degradationRate > 1.5 ? "Declining" : "Stable"}
                          </text>
                        )}
                        
                        {/* End point status - Animated */}
                        {showPrediction && animationProgress > 0.8 && (
                          <text 
                            x="215" 
                            y={graphData.predicted[5]?.y + 12 || 85} 
                            fill={graphData.predicted[5]?.health < 40 ? "rgba(255,68,68,0.9)" : graphData.predicted[5]?.health < 60 ? "rgba(255,153,0,0.9)" : "rgba(56,239,125,0.9)"} 
                            fontSize="6" 
                            textAnchor="middle"
                            opacity={Math.min(1, (animationProgress - 0.8) * 5)}
                          >
                            {graphData.predicted[5]?.health < 40 ? "Critical" : graphData.predicted[5]?.health < 60 ? "Warning" : "Good"}
                          </text>
                        )}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Remaining Useful Life */}
                  <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth <= 1440 ? '-110px' : windowWidth <= 1700 ? '-90px' : windowWidth <= 1815 ? '-40px' : windowWidth >= 2560 ? '80px' : '0px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span style={{ fontSize: spacing.smallFontSize, color: 'white' }}>Remaining useful life</span>
                      <span style={{ fontSize: spacing.fontSize, color: 'white', fontWeight: 'bold' }}>{remainingLife}%</span>
                    </div>
                    <div className="life-bar" style={{ borderRadius: '0' }}>
                      <div className="life-fill" style={{ 
                        width: `${remainingLife}%`, 
                        borderRadius: '0',
                        background: 83 < 30 ? '#ff4444' : 
                                   83 < 60 ? '#ff9900' : 
                                   'linear-gradient(90deg, #ff9900 0%, #37bc12 100%)'
                      }}></div>
                    </div>
                  </div>

                </div>

                {/* UI Page Summary */}
                <div className="ui-page-summary" style={{ 
                  marginTop: '20px',
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  border: `1px solid ${createInverterUIPageSummary().statusColor}40`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{createInverterUIPageSummary().statusIcon}</span>
                    <h3 style={{ margin: 0, fontSize: '14px', color: createInverterUIPageSummary().statusColor }}>
                      Inverter System Status: {createInverterUIPageSummary().status.toUpperCase()}
                    </h3>
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#888', 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      padding: '2px 6px', 
                      borderRadius: '10px',
                      marginLeft: 'auto'
                    }}>
                      Live Data
                    </div>
                  </div>
                  
                  <p style={{ 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.9)', 
                    lineHeight: '1.4', 
                    margin: '0 0 8px 0' 
                  }}>
                    {createInverterUIPageSummary().summary}
                  </p>
                  
                  {/* Quick Metrics Display */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    fontSize: '10px', 
                    color: 'rgba(255,255,255,0.7)',
                    flexWrap: 'wrap'
                  }}>
                    <span>⚡ {createInverterUIPageSummary().dataPoints.dcVoltage}V DC</span>
                    <span>🔌 {createInverterUIPageSummary().dataPoints.acVoltage}V AC</span>
                    <span>📊 {createInverterUIPageSummary().dataPoints.efficiency}%</span>
                    <span>🌡️ {createInverterUIPageSummary().dataPoints.temperature}°C</span>
                    <span>⚡ {createInverterUIPageSummary().dataPoints.powerOutput}kW</span>
                    <span>📈 {createInverterUIPageSummary().dataPoints.thd}% THD</span>
                    <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                      Vehicle: {createInverterUIPageSummary().vehicleInfo}
                    </span>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: '0px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3>GenAI Recommendations</h3>
                    {genAiLoading && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#ff9900' }}>
                        <div className="spinner" style={{ width: '12px', height: '12px', border: '2px solid #333', borderTop: '2px solid #ff9900', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Analyzing...
                      </div>
                    )}
                    {genAiAnalysis && !genAiLoading && (
                      <div style={{ fontSize: '11px', color: genAiAnalysis.error ? '#ff6b6b' : genAiAnalysis.fromCache ? '#ffa500' : '#00ff88', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{genAiAnalysis.error ? '🛡️' : genAiAnalysis.fromCache ? '💾' : '🤖'}</span> 
                        {genAiAnalysis.error ? 'Enhanced Fallback' : 
                         genAiAnalysis.fromCache ? 'Claude (Cached)' : 'Claude Sonnet 4.5'}
                      </div>
                    )}
                  </div>
                  
                  <p style={{ fontSize: '12px', marginBottom: '12px' }}>
                    {genAiAnalysis ? 
                      (genAiAnalysis.error ? 
                        genAiAnalysis.error_message :
                        `Real-time inverter analysis by Claude Sonnet 4.5. Status: ${genAiAnalysis.overall_status} | Risk: ${genAiAnalysis.risk_level}`
                      ) :
                      'AI-powered inverter optimization. Connecting to Claude Sonnet 4.5 for real-time analysis...'
                    }
                  </p>
                  
                  {/* GenAI Key Findings - Natural Language Summary */}
                  {genAiAnalysis?.key_findings_summary && !genAiAnalysis.error && (
                    <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(0,255,136,0.1)', borderRadius: '4px', border: '1px solid rgba(0,255,136,0.3)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#00ff88', marginBottom: '4px' }}>🔍 Analysis Summary:</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4' }}>
                        {genAiAnalysis.key_findings_summary}
                      </div>
                    </div>
                  )}
                  
                  <div className="recommendations-list" style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto', 
                    paddingRight: '8px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#00ff88 rgba(255,255,255,0.1)'
                  }}>
                    <style>
                      {`
                        .recommendations-list::-webkit-scrollbar {
                          width: 6px;
                        }
                        .recommendations-list::-webkit-scrollbar-track {
                          background: rgba(255,255,255,0.1);
                          border-radius: 3px;
                        }
                        .recommendations-list::-webkit-scrollbar-thumb {
                          background: #00ff88;
                          border-radius: 3px;
                        }
                        .recommendations-list::-webkit-scrollbar-thumb:hover {
                          background: #00cc6a;
                        }
                      `}
                    </style>
                    {aiRecommendations.map((rec, index) => (
                      <div key={index} style={{ marginBottom: '12px' }}>
                        <div className="recommendation-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="warning-icon">
                            {rec.priority === 'CRITICAL' ? '🚨' : rec.priority === 'HIGH' ? '⚠️' : rec.priority === 'MEDIUM' ? '⚡' : 'ℹ️'}
                          </span>
                          <span style={{ flex: 1 }}>{rec.action}</span>
                          {rec.genai && <span style={{ fontSize: '10px', color: '#00ff88', backgroundColor: 'rgba(0,255,136,0.2)', padding: '2px 6px', borderRadius: '10px' }}>GenAI</span>}
                          {rec.ml && <span style={{ fontSize: '10px', color: '#ff9900', backgroundColor: 'rgba(255,153,0,0.2)', padding: '2px 6px', borderRadius: '10px' }}>ML</span>}
                          {rec.fallback && <span style={{ fontSize: '10px', color: '#888', backgroundColor: 'rgba(136,136,136,0.2)', padding: '2px 6px', borderRadius: '10px' }}>Rule</span>}
                        </div>
                        {(rec.reason || rec.urgency || rec.description) && (
                          <div className="recommendation-details" style={{ marginLeft: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                            {rec.reason && <p><strong>Reason:</strong> {rec.reason}</p>}
                            {rec.urgency && <p><strong>Urgency:</strong> {rec.urgency}</p>}
                            {rec.description && <p><strong>Details:</strong> {rec.description}</p>}
                            {rec.estimated_cost && <p><strong>Cost:</strong> {rec.estimated_cost}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {genAiAnalysis?.next_inspection && (
                      <div style={{ marginTop: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                        Next inspection recommended: {genAiAnalysis.next_inspection}
                      </div>
                    )}
                    
                    <div className="more-link" style={{ marginTop: '16px', fontSize: '12px', color: '#ff9900', cursor: 'pointer' }}>More.....</div>
                  </div>
                  
                  {(genAiAnalysis?.overall_status === 'CRITICAL') && (
                    <div style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '10px', padding: '8px', border: '1px solid #ff4444', borderRadius: '3px', backgroundColor: 'rgba(255,68,68,0.1)' }}>
                      🚨 CRITICAL: {genAiAnalysis?.key_findings_summary?.split('.')[0] || 'Inverter requires immediate attention'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="inverter" />
    </div>
  );
};

export default Invertor;