import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Papa from 'papaparse';
import DataNeededModal from "./DataNeededModal";
import agentCoreService from '../services/agentcore';

const VehicleSVG = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="300.000000pt"
    height="416.000000pt"
    viewBox="0 0 300.000000 416.000000"
    preserveAspectRatio="xMidYMid meet"
    {...props}
  >
    <g
      transform="translate(0.000000,416.000000) scale(0.100000,-0.100000)"
      fill="#3a4552"
      stroke="#000000"
      strokeWidth="35"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M280 3930 c-75 -6 -100 -18 -135 -64 l-25 -33 -1 -381 c-1 -376 -1 -382 21 -417 37 -60 67 -70 222 -72 151 -3 177 3 225 49 34 33 46 77 47 173 l1 50 60 6 c33 4 68 10 77 14 24 10 48 67 48 113 0 27 5 42 16 46 29 11 192 7 196 -5 3 -9 10 -9 26 0 25 13 280 14 302 1 16 -10 21 -2665 5 -2687 -9 -12 -41 -14 -173 -11 -89 2 -163 0 -165 -3 -1 -3 -47 -3 -102 0 l-100 6 -6 60 c-9 79 -37 105 -114 105 -32 0 -57 5 -62 13 -4 6 -10 46 -13 88 -5 56 -12 84 -29 107 -38 55 -76 64 -243 60 -163 -3 -183 -10 -222 -78 -18 -30 -19 -56 -19 -405 0 -422 -1 -418 79 -462 35 -20 53 -23 178 -23 131 0 142 1 182 25 24 14 49 36 56 48 7 12 15 63 18 112 l5 90 60 5 c33 3 70 11 82 18 21 12 39 52 45 102 3 24 6 25 98 31 52 3 100 3 105 0 6 -3 116 -4 245 -1 129 3 309 3 400 0 91 -3 170 -3 175 0 10 5 207 0 213 -5 1 -1 5 -20 7 -41 6 -47 22 -80 44 -90 9 -4 43 -10 76 -13 l60 -6 6 -88 c6 -94 18 -121 73 -161 24 -18 45 -21 164 -24 92 -3 149 1 175 9 51 17 94 68 102 121 3 24 5 198 3 388 -2 263 -6 351 -16 371 -8 14 -32 38 -55 53 -42 27 -43 27 -197 24 -137 -3 -158 -5 -182 -23 -43 -32 -59 -70 -65 -150 -3 -41 -11 -79 -17 -84 -7 -6 -38 -11 -70 -13 -71 -4 -93 -26 -100 -102 -2 -26 -8 -52 -13 -56 -7 -7 -180 -16 -208 -11 -5 1 -87 2 -181 1 -130 -1 -173 2 -182 12 -7 10 -11 393 -11 1346 0 1320 0 1332 20 1343 24 12 306 10 332 -3 11 -6 17 -5 17 2 0 12 204 10 216 -3 4 -4 9 -31 12 -61 6 -75 32 -99 115 -106 l62 -5 5 -85 c7 -96 16 -118 66 -157 34 -25 44 -27 157 -31 191 -7 262 20 287 109 13 44 13 703 0 748 -5 19 -20 45 -32 59 -45 47 -71 54 -219 54 -126 0 -142 -3 -180 -24 -54 -30 -76 -75 -78 -163 -2 -38 -4 -71 -6 -73 -1 -2 -25 -5 -51 -8 -99 -9 -119 -24 -128 -97 -3 -21 -8 -42 -11 -47 -8 -13 -215 -12 -215 1 0 6 -6 6 -17 0 -23 -11 -739 -12 -770 0 -14 5 -23 5 -23 -1 0 -15 -183 -13 -198 2 -7 7 -12 27 -12 44 0 20 -10 44 -26 63 -23 28 -32 31 -79 31 -72 0 -85 14 -85 93 0 71 -20 120 -63 151 -22 16 -48 22 -125 26 -53 3 -126 3 -162 0z" stroke="#000000" strokeWidth="3" />
      <path d="M225 3858 c-34 -18 -45 -40 -45 -92 l0 -50 30 29 c23 22 33 26 42 17 6 -6 10 -13 7 -15 -2 -2 -21 -16 -41 -31 -36 -27 -37 -29 -40 -102 -2 -41 -1 -74 3 -74 3 0 20 16 39 35 19 19 40 35 47 35 27 0 11 -30 -37 -70 l-50 -42 0 -76 1 -77 22 28 c22 26 57 37 57 17 0 -5 -18 -24 -40 -41 l-40 -32 0 -76 0 -75 43 42 c41 40 57 45 57 16 0 -6 -22 -29 -50 -50 -35 -27 -50 -45 -50 -62 0 -57 49 -92 130 -92 l50 0 0 425 0 425 -57 0 c-32 0 -67 -6 -78 -12z" />
      <path d="M390 3445 l0 -425 50 0 c56 0 104 20 120 49 16 30 12 69 -8 83 -58 41 -84 69 -78 85 6 13 15 9 51 -27 l45 -44 0 76 c0 76 0 78 -35 105 -35 28 -46 53 -23 53 6 0 22 -10 35 -22 l23 -21 0 74 0 74 -50 40 c-39 31 -47 42 -38 52 9 11 19 7 50 -24 l38 -37 0 76 c0 75 0 76 -35 102 -36 28 -46 56 -21 56 8 0 24 -12 35 -27 l20 -28 1 48 c0 41 -5 53 -29 78 -26 26 -36 29 -90 29 l-61 0 0 -425z" />
      <path d="M2364 3860 c-33 -13 -54 -50 -54 -92 0 -43 9 -47 35 -18 19 21 45 27 45 11 0 -5 -18 -25 -40 -44 -40 -34 -40 -34 -40 -107 l0 -74 40 39 c32 32 42 37 52 26 11 -10 4 -20 -32 -52 -25 -21 -48 -39 -52 -39 -5 0 -8 -34 -8 -75 0 -75 10 -93 30 -55 11 20 50 28 50 11 0 -5 -18 -24 -40 -41 l-40 -32 0 -76 0 -76 43 42 c47 46 52 49 61 27 3 -9 -14 -29 -49 -57 -64 -50 -69 -72 -26 -120 25 -29 35 -32 95 -36 l66 -4 0 426 0 426 -57 -1 c-32 0 -68 -4 -79 -9z" />
      <path d="M2520 3444 l0 -426 66 4 c60 4 70 7 95 36 41 46 37 64 -26 114 -30 23 -55 48 -55 55 0 26 19 20 55 -17 22 -22 43 -40 47 -40 4 0 8 31 8 70 l0 69 -45 38 c-25 20 -45 41 -45 45 0 17 35 6 62 -19 l28 -27 0 75 0 74 -55 45 c-57 47 -62 54 -44 66 6 3 27 -10 48 -30 20 -20 40 -36 44 -36 4 0 7 30 7 68 l0 67 -47 42 c-42 37 -46 42 -29 49 14 5 25 0 42 -19 13 -15 26 -27 29 -27 11 0 4 73 -10 101 -19 37 -50 49 -121 49 l-54 0 0 -426z" />
      <path d="M600 3450 l0 -150 69 0 c46 0 72 5 80 14 8 9 11 57 9 147 l-3 134 -77 3 -78 3 0 -151z" />
      <path d="M2132 3453 l3 -148 78 -3 77 -3 0 151 0 150 -80 0 -81 0 3 -147z" />
      <path d="M211 1064 c-27 -23 -31 -32 -31 -77 l0 -51 30 29 c24 23 33 26 43 16 9 -10 9 -15 -4 -24 -68 -52 -67 -50 -71 -125 -1 -40 -1 -72 3 -72 3 0 20 16 39 35 19 19 40 35 47 35 27 0 11 -30 -37 -70 l-50 -42 0 -76 1 -77 24 28 c23 26 55 37 55 17 0 -5 -18 -24 -40 -41 l-40 -32 0 -76 0 -75 38 37 c21 20 43 37 50 37 27 0 9 -31 -38 -67 -57 -44 -64 -75 -26 -119 20 -24 32 -28 90 -32 l66 -4 0 426 0 426 -59 0 c-49 0 -65 -4 -90 -26z" />
      <path d="M390 665 l0 -427 66 4 c58 4 70 8 90 32 39 45 32 78 -26 122 -27 21 -50 43 -50 49 0 28 17 23 57 -17 l43 -42 0 76 c0 76 0 77 -35 104 -34 26 -46 54 -23 54 6 0 22 -10 35 -22 l23 -21 0 74 -1 74 -49 39 c-40 31 -48 42 -38 53 9 11 18 7 50 -24 l38 -37 0 76 c0 75 0 76 -35 102 -33 26 -47 56 -25 56 6 0 22 -12 35 -27 l24 -28 1 47 c0 73 -29 101 -114 106 l-66 4 0 -427z" />
      <path d="M2363 1080 c-29 -12 -53 -60 -53 -106 l0 -38 30 29 c23 22 33 26 42 17 11 -11 3 -20 -59 -67 -10 -8 -13 -31 -11 -83 l3 -73 38 37 c30 29 40 35 50 25 9 -10 1 -22 -41 -59 l-52 -47 0 -67 c0 -38 4 -68 8 -68 5 0 17 9 27 20 19 21 45 27 45 10 0 -5 -18 -24 -40 -41 l-40 -32 0 -76 0 -75 39 38 c29 28 45 37 58 32 15 -6 10 -14 -32 -51 -28 -24 -53 -44 -57 -45 -12 0 -10 -35 3 -63 17 -37 60 -57 123 -57 l56 0 0 425 0 425 -57 -1 c-32 0 -68 -4 -80 -9z" />
      <path d="M2520 665 l0 -425 56 0 c63 0 106 20 123 57 18 40 13 50 -44 95 -53 41 -69 68 -42 68 7 0 28 -16 47 -35 19 -19 38 -35 42 -35 4 0 8 30 8 68 l0 67 -47 42 c-40 35 -45 43 -30 49 13 4 28 -2 48 -22 l29 -28 0 75 0 74 -55 44 c-30 24 -55 48 -55 52 0 24 26 17 59 -15 20 -20 40 -36 44 -36 4 0 7 30 7 68 l0 67 -47 42 c-41 35 -45 42 -30 48 12 5 24 -1 40 -19 13 -14 26 -26 30 -26 13 0 7 71 -8 101 -19 37 -50 49 -121 49 l-54 0 0 -425z" />
      <path d="M600 670 l0 -150 75 0 c90 0 87 -7 83 170 l-3 125 -77 3 -78 3 0 -151z" />
      <path d="M2132 673 l3 -148 78 -3 77 -3 0 151 0 150 -80 0 -81 0 3 -147z" />
    </g>
  </svg>
);


// tire data rotates through csv entries every 30 seconds
const TiresPage = () => {
  const navigate = useNavigate();
  const { carId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [displayTirePrediction, setDisplayTirePrediction] = useState(false);
  const [tireAnimationStep, setTireAnimationStep] = useState(0);
  const [csvData, setCsvData] = useState([]);
  const [dataIndex, setDataIndex] = useState(0);
  const [mlResults, setMlResults] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [pressureVariation, setPressureVariation] = useState(0);
  const [genAiAnalysis, setGenAiAnalysis] = useState(null);
  const [genAiLoading, setGenAiLoading] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);


  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Check if this is a normal/healthy vehicle
    const csvPath = (carId === '1HGBH41JXMN109876' || carId === 'WBADT43452G123789' || carId === '3VWDX7AJ9DM456321')
      ? '/normal_data/tire_wear_data_normal.csv'
      : '/tire_wear_data.csv';
    
    Papa.parse(csvPath, {
      download: true,
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          let filteredData;
          if (carId === '1HGBH41JXMN109876') {
            // Vehicle 2 uses VIN 1HGBH41JXMN109876
            filteredData = results.data.filter(row => row.vehicle_id === '1HGBH41JXMN109876');
          } else if (carId === 'WBADT43452G123789') {
            // Vehicle 4 uses VIN WBADT43452G123789
            filteredData = results.data.filter(row => row.vehicle_id === 'WBADT43452G123789');
          } else if (carId === '3VWDX7AJ9DM456321') {
            // Vehicle 3 uses VIN 3VWDX7AJ9DM456321 with normal tire data
            filteredData = results.data.filter(row => row.vehicle_id === '3VWDX7AJ9DM456321');
          } else if (carId === '5YJSA1E26HF123456') {
            // Motor vehicle uses VIN 5YJSA1E26HF123456
            filteredData = results.data.filter(row => row.vehicle_id === '5YJSA1E26HF123456');
          } else {
            filteredData = results.data.filter(row => row.vehicle_id);
          }
          setCsvData(filteredData);
          console.log('CSV data loaded:', filteredData.length, 'records');
          console.log('Sample record:', filteredData[0]);
        } else {
          console.error('No CSV data loaded');
        }
      },
      error: (error) => {
        console.error('Error loading CSV:', error);
      }
    });
    
    // Load ML results
    fetch('/data/ml_results.json')
      .then(res => res.json())
      .then(data => {
        setMlResults(data);
        console.log('ML results loaded:', data);
      })
      .catch(err => console.log('ML results not available:', err));
  }, []);

  // Realistic pressure simulation - gradual changes instead of jumps
  useEffect(() => {
    if (csvData.length > 0) {
      // Initialize pressure variation system
      
      const interval = setInterval(() => {
        setDataIndex(prev => (prev + 1) % csvData.length);
        
        // Force component re-render for fresh data
        setMlResults(prev => [...prev]);
      }, 30000); // Changed to 30 seconds for more realistic data rotation
      return () => clearInterval(interval);
    }
  }, [csvData]);

  // Realistic pressure variation - small changes every few seconds
  useEffect(() => {
    const pressureInterval = setInterval(() => {
      setPressureVariation(prev => {
        // Create realistic pressure fluctuations
        const currentData = csvData[dataIndex] || {};
        
        // Calculate realistic variation based on conditions
        let maxVariation = 0.3; // Base variation ±0.3 PSI
        
        // Increase variation based on driving conditions
        if (currentData.driving_pattern === 'highway') maxVariation = 0.5;
        if (currentData.weather_condition === 'snow') maxVariation = 0.4;
        if (currentData.anomaly_detected === 'True') maxVariation = 0.8;
        
        // Generate small random variation
        const randomChange = (Math.random() - 0.5) * 0.2; // ±0.1 PSI random
        const newVariation = Math.max(-maxVariation, Math.min(maxVariation, prev + randomChange));
        
        return newVariation;
      });
    }, 3000); // Update every 3 seconds for realistic monitoring
    
    return () => clearInterval(pressureInterval);
  }, [csvData, dataIndex]);

  // On-demand GenAI Analysis function
  const analyzeWithGenAI = async () => {
    const currentData = csvData[dataIndex] || {};
    
    if (!csvData.length || !currentData.vehicle_id) {
      console.log('GenAI Analysis skipped - missing data:', { csvDataLength: csvData.length, vehicleId: currentData.vehicle_id });
      return;
    }
    
    console.log('Starting enhanced GenAI analysis...');
    setGenAiLoading(true);
    
    const tireDataForAnalysis = {
      vehicle_id: currentData.vehicle_id,
      make: currentData.make,
      model: currentData.model,
      year: currentData.year,
      tire_brand: currentData.tire_brand,
      tire_size: currentData.tire_size,
      pressure_psi: getRealisticPressure(),
      temperature_c: getRealisticTemperature(),
      tread_depth_mm: getRealisticTreadDepth(),
      mileage: currentData.mileage,
      driving_pattern: currentData.driving_pattern,
      weather_condition: currentData.weather_condition,
      anomaly_type: currentData.anomaly_type
    };
    
    try {
      console.log('Calling enhanced AgentCore service...');
      
      const analysisResult = await agentCoreService.getTireAnalysis(currentData.vehicle_id, tireDataForAnalysis);
      
      console.log('Received enhanced GenAI analysis:', analysisResult);
      
      if (analysisResult.throttled) {
        console.log('Service throttled - using enhanced fallback');
        const enhancedFallback = createEnhancedFallback(tireDataForAnalysis, new Error('Service throttled'));
        setGenAiAnalysis(enhancedFallback);
        return;
      }
      
      const analysis = parseAgentCoreResponse(analysisResult.response, tireDataForAnalysis, analysisResult);
      
      console.log('Parsed GenAI analysis:', analysis);
      setGenAiAnalysis(analysis);
      
    } catch (error) {
      console.error('GenAI analysis failed:', error);
      const enhancedFallback = createEnhancedFallback(tireDataForAnalysis, error);
      setGenAiAnalysis(enhancedFallback);
    } finally {
      setGenAiLoading(false);
    }
  };

  // Parse AgentCore response into structured format
  const parseAgentCoreResponse = (response, tireData, analysisResult = {}) => {
    try {
      console.log('Parsing AgentCore response:', response);
      
      // Safety check for undefined/null response
      if (!response || typeof response !== 'string') {
        console.warn('Invalid response format, using fallback');
        return parseTextResponse('No analysis available', tireData);
      }
      
      // AgentCore returns text responses, not JSON
      // Let's create structured recommendations from the text
      const recommendations = [];
      const keyFindings = [];
      
      // Extract numbered list items (1. Check tires, 2. Inspect, etc.)
      const numberedPattern = /\d+\.\s*\*\*[^*]+\*\*[^\n]*(?:\n[^\d\n][^\n]*)*|\d+\.\s*[^\n]+/g;
      const numberedItems = response.match(numberedPattern) || [];
      
      // Action verbs that indicate real recommendations
      const actionVerbs = ['check', 'inspect', 'replace', 'service', 'monitor', 'test', 'verify', 'inflate', 'rotate', 'balance', 'align', 'repair', 'schedule', 'perform', 'examine', 'diagnose', 'adjust'];
      
      numberedItems.forEach(item => {
        const cleaned = item.replace(/\d+\.\s*/, '').replace(/\*\*/g, '').trim();
        if (cleaned.length < 15) return;
        
        // Only include if it contains an action verb
        const lowerCleaned = cleaned.toLowerCase();
        const hasActionVerb = actionVerbs.some(verb => lowerCleaned.includes(verb));
        if (!hasActionVerb) return;
        
        const lowerItem = item.toLowerCase();
        const priority = lowerItem.includes('urgent') || lowerItem.includes('critical') || lowerItem.includes('immediate') || lowerItem.includes('stop') ? 'CRITICAL' :
                        lowerItem.includes('soon') || lowerItem.includes('warning') || lowerItem.includes('attention') ? 'HIGH' :
                        lowerItem.includes('consider') || lowerItem.includes('schedule') ? 'MEDIUM' : 'LOW';
        
        recommendations.push({
          action: cleaned,
          priority: priority,
          reason: "",
          urgency: priority === 'CRITICAL' ? 'Immediately' : priority === 'HIGH' ? 'Within 24 hours' : priority === 'MEDIUM' ? 'Within 1 week' : 'Next maintenance'
        });
      });
      
      // Extract key findings from full response
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.toLowerCase().includes('psi') || 
            trimmed.toLowerCase().includes('pressure') ||
            trimmed.toLowerCase().includes('tread') ||
            trimmed.toLowerCase().includes('temperature') ||
            trimmed.toLowerCase().includes('wear')) {
          keyFindings.push(trimmed);
        }
      });
      
      // Determine overall status from response content
      const status = determineStatusFromResponse(response);
      
      // Create natural language summary instead of bullet points
      const naturalSummary = createNaturalLanguageSummary(response, tireData);

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
      console.error('Error parsing AgentCore response:', error);
      return parseTextResponse(response, tireData);
    }
  };

  // Create enhanced fallback with intelligent rule-based analysis
  const createEnhancedFallback = (tireData, error) => {
    const pressure = parseFloat(tireData.pressure_psi) || 32;
    const treadDepth = parseFloat(tireData.tread_depth_mm) || 8;
    const temperature = parseFloat(tireData.temperature_c) || 25;
    
    let status = 'GOOD';
    let riskLevel = 'LOW';
    let summary = '';
    const recommendations = [];
    
    // Check for uneven wear patterns
    const unevenWear = detectUnevenWear();
    if (unevenWear && unevenWear.detected) {
      if (unevenWear.severity === 'CRITICAL') {
        status = 'CRITICAL';
        riskLevel = 'HIGH';
        summary = `🚨 UNEVEN TIRE WEAR DETECTED - ${unevenWear.difference}mm difference across tires. `;
        recommendations.push({
          action: 'Get wheel alignment and suspension inspection immediately - severe uneven wear detected',
          priority: 'CRITICAL',
          reason: `Tread depth varies by ${unevenWear.difference}mm (${unevenWear.minDepth}mm to ${unevenWear.maxDepth}mm). This indicates alignment problems, suspension damage, or improper inflation causing safety concerns.`,
          urgency: 'Immediate - within 24 hours'
        });
        recommendations.push({
          action: 'Check for vehicle pulling to one side or steering wheel off-center when driving straight',
          priority: 'HIGH',
          reason: 'These are early warning signs of alignment issues that cause uneven tire wear.',
          urgency: 'Before next drive'
        });
      } else if (unevenWear.severity === 'WARNING') {
        status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
        riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
        summary = `⚠️ Uneven tire wear pattern detected - ${unevenWear.difference}mm difference. `;
        recommendations.push({
          action: 'Schedule wheel alignment check within 1 week',
          priority: 'HIGH',
          reason: `Tread depth difference of ${unevenWear.difference}mm indicates developing alignment or suspension issues. Addressing now prevents costly tire replacement.`,
          urgency: 'Within 1 week'
        });
        recommendations.push({
          action: 'Inspect tires for inner or outer edge wearing faster than center',
          priority: 'MEDIUM',
          reason: 'Visual inspection helps identify wear patterns. Look for feathering on tread blocks (feels rough one direction, smooth the other).',
          urgency: 'This week'
        });
      } else if (unevenWear.severity === 'ATTENTION') {
        summary = `Minor uneven wear developing - ${unevenWear.difference}mm difference. `;
        recommendations.push({
          action: 'Check wheel alignment at next scheduled service',
          priority: 'MEDIUM',
          reason: `Slight tread depth difference of ${unevenWear.difference}mm detected. Preventive alignment check recommended.`,
          urgency: 'Within 1 month'
        });
      }
    }
    
    // Driver-friendly analysis based on EV Maintenance Manual thresholds
    if (pressure < 25) {
      status = 'CRITICAL';
      riskLevel = 'HIGH';
      summary = '🚨 STOP DRIVING - Your tire pressure is critically low and unsafe. ';
      recommendations.push({
        action: 'STOP and add air immediately - do not drive until inflated to 32 PSI',
        priority: 'CRITICAL',
        reason: 'Pressure below 25 PSI can cause tire failure, blowout, or loss of control. This is a safety emergency.',
        urgency: 'RIGHT NOW - find nearest gas station (free air at most)'
      });
    } else if (pressure < 28) {
      status = 'CRITICAL';
      riskLevel = 'HIGH';
      summary = 'Your tire pressure is dangerously low - inflate today. ';
      recommendations.push({
        action: 'Add air to your tires today at any gas station (free at most stations)',
        priority: 'CRITICAL',
        reason: 'Low pressure increases stopping distance, causes tire failure, and wastes fuel. For EVs, reduces range by 3-5%.',
        urgency: 'Today - takes 5 minutes'
      });
    } else if (pressure < 32) {
      status = 'WARNING';
      riskLevel = 'MEDIUM';
      summary = 'Your tire pressure is a bit low - easy fix that saves money. ';
      recommendations.push({
        action: 'Check and inflate tires to 32-36 PSI (check your driver door sticker for exact number)',
        priority: 'HIGH',
        reason: 'Proper pressure improves fuel economy by 3% and extends tire life. For EVs, proper pressure is critical for range.',
        urgency: 'This week - takes 5 minutes'
      });
    }
    
    if (treadDepth < 3) {
      status = 'CRITICAL';
      riskLevel = 'HIGH';
      summary += 'Your tire tread is below safe minimum - replace immediately. ';
      recommendations.push({
        action: 'Replace your tires this week - below legal minimum (shop Costco, Discount Tire, or local shops)',
        priority: 'CRITICAL',
        reason: 'Tread below 3mm is dangerous in wet conditions - much longer stopping distance and hydroplaning risk. This is a safety issue.',
        urgency: 'Within 24 hours - unsafe to drive in rain'
      });
    } else if (treadDepth < 4) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
      summary += 'Your tire tread is at replacement threshold - schedule soon. ';
      recommendations.push({
        action: 'Schedule tire replacement within 2 weeks - at recommended replacement point',
        priority: 'HIGH',
        reason: 'Manual recommends replacement at 4mm (5/32") for safety. Below this, wet traction is significantly reduced.',
        urgency: 'Within 2 weeks'
      });
    } else if (treadDepth < 6) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      riskLevel = riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM';
      summary += 'Your tire tread is getting low - start planning for new tires. ';
      recommendations.push({
        action: 'Start shopping for new tires - you have 1-2 months left',
        priority: 'MEDIUM',
        reason: 'Tires are approaching replacement point. Planning ahead helps you find better deals and avoid emergency purchases.',
        urgency: 'Within 1-2 months'
      });
    }
    
    if (temperature > 80) {
      status = status === 'CRITICAL' ? 'CRITICAL' : 'WARNING';
      recommendations.push({
        action: 'Your tire is running hot - let it cool down and check pressure when cold',
        priority: 'MEDIUM',
        reason: 'Hot tires (>80°C) can indicate low pressure, overload, or aggressive driving. Check pressure when tires are cold (before driving).',
        urgency: 'Before your next drive - let cool 15-30 minutes'
      });
    }
    
    // Default good condition
    if (recommendations.length === 0) {
      summary = 'Your tires look good! Keep up the routine checks. ';
      recommendations.push({
        action: 'Weekly: Check tire pressure with gauge (all 4 tires + spare)',
        priority: 'LOW',
        reason: 'Weekly checks recommended for EVs. Proper pressure improves range by 3-5% and extends tire life. Takes 5 minutes.',
        urgency: 'Weekly - set a phone reminder'
      });
      recommendations.push({
        action: 'Monthly: Inspect for cuts, bulges, uneven wear, and check tread depth',
        priority: 'LOW',
        reason: 'Monthly visual inspection catches problems early. Look for embedded objects, sidewall damage, and wear patterns.',
        urgency: 'Monthly inspection - 5 minutes'
      });
      recommendations.push({
        action: 'Every 8,000-10,000 km: Rotate tires for even wear',
        priority: 'LOW',
        reason: 'Rotation extends tire life by 20-30%. EVs are heavier and wear tires 20% faster than gas cars.',
        urgency: 'Every 6 months or at oil change'
      });
      recommendations.push({
        action: 'Check tire age: Replace tires older than 6 years regardless of tread',
        priority: 'LOW',
        reason: 'Rubber degrades over time. Check DOT code on sidewall (last 4 digits = week/year). Tires >6 years old are unsafe.',
        urgency: 'Annual check - mark calendar'
      });
    }
    
    // Complete summary
    if (!summary.includes('All tire metrics')) {
      summary += 'Enhanced rule-based analysis provides reliable maintenance guidance.';
    }
    
    return {
      error: true,
      error_message: error.message.includes('throttled') ? 
        'GenAI service throttled for stability. Using enhanced rule-based analysis.' :
        'GenAI service temporarily unavailable. Using intelligent fallback analysis.',
      overall_status: status,
      risk_level: riskLevel,
      key_findings_summary: summary,
      recommendations: recommendations,
      next_inspection: "30 days",
      source: "Enhanced Rule-Based Analysis",
      fallback: true
    };
  };

  // Create natural language summary from Claude's response
  const createNaturalLanguageSummary = (response, tireData) => {
    try {
      // Extract key metrics and issues from the response
      const pressureIssues = response.toLowerCase().includes('pressure') || response.toLowerCase().includes('psi');
      const treadIssues = response.toLowerCase().includes('tread') || response.toLowerCase().includes('wear');
      const temperatureIssues = response.toLowerCase().includes('temperature') || response.toLowerCase().includes('hot');
      const criticalIssues = response.toLowerCase().includes('critical') || response.toLowerCase().includes('urgent') || response.toLowerCase().includes('immediate');
      
      let summary = '';
      
      // First sentence - overall condition
      if (criticalIssues) {
        summary = 'Claude has identified critical tire conditions requiring immediate attention. ';
      } else if (pressureIssues || treadIssues) {
        summary = 'Claude has detected tire maintenance needs that should be addressed soon. ';
      } else {
        summary = 'Claude reports your tires are in good condition with routine maintenance recommended. ';
      }
      
      // Second sentence - specific findings
      const specificIssues = [];
      if (pressureIssues) specificIssues.push('pressure adjustments');
      if (treadIssues) specificIssues.push('tread wear monitoring');
      if (temperatureIssues) specificIssues.push('temperature concerns');
      
      if (specificIssues.length > 0) {
        summary += `Key areas of focus include ${specificIssues.join(' and ')} based on current vehicle data.`;
      } else {
        summary += 'All tire metrics are within acceptable ranges for continued safe operation.';
      }
      
      return summary;
    } catch (error) {
      return 'Claude has analyzed your tire condition and provided maintenance recommendations based on current vehicle data.';
    }
  };

  const determineStatusFromResponse = (response) => {
    const lowerResponse = response.toLowerCase();
    if (lowerResponse.includes('critical') || lowerResponse.includes('urgent') || lowerResponse.includes('immediate')) {
      return 'CRITICAL';
    } else if (lowerResponse.includes('warning') || lowerResponse.includes('caution') || lowerResponse.includes('attention')) {
      return 'WARNING';
    }
    return 'GOOD';
  };

  const determineRiskFromResponse = (response) => {
    const status = determineStatusFromResponse(response);
    return status === 'CRITICAL' ? 'HIGH' : status === 'WARNING' ? 'MEDIUM' : 'LOW';
  };

  const extractKeyFindings = (response) => {
    const findings = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    // Look for key insights in the response
    lines.forEach(line => {
      if (line.includes('PSI') || line.includes('pressure')) {
        findings.push(line.trim());
      } else if (line.includes('tread') || line.includes('depth')) {
        findings.push(line.trim());
      } else if (line.includes('temperature') || line.includes('temp')) {
        findings.push(line.trim());
      }
    });
    
    return findings.slice(0, 3); // Limit to 3 key findings
  };

  const parseTextResponse = (response, tireData) => {
    const lines = response.split('\n').filter(line => line.trim());
    const recommendations = [];
    
    // Extract recommendations from text
    lines.forEach(line => {
      if (line.includes('recommend') || line.includes('should') || line.includes('need')) {
        const priority = line.toLowerCase().includes('urgent') || line.toLowerCase().includes('critical') ? 'HIGH' : 
                        line.toLowerCase().includes('soon') || line.toLowerCase().includes('warning') ? 'MEDIUM' : 'LOW';
        
        recommendations.push({
          action: line.trim(),
          priority: priority,
          reason: "Based on current tire condition analysis",
          urgency: priority === 'HIGH' ? 'Within 24 hours' : priority === 'MEDIUM' ? 'Within 1 week' : 'Next maintenance'
        });
      }
    });
    
    // If no recommendations found, create default ones
    if (recommendations.length === 0) {
      const pressure = parseFloat(tireData.pressure_psi) || 32;
      const tread = parseFloat(tireData.tread_depth_mm) || 8;
      
      if (pressure < 30) {
        recommendations.push({
          action: `Inflate tire to 32-35 PSI (currently ${pressure.toFixed(1)} PSI)`,
          priority: 'HIGH',
          reason: 'Tire pressure below optimal range',
          urgency: 'Within 24 hours'
        });
      }
      
      if (tread < 4) {
        recommendations.push({
          action: `Schedule tire replacement - tread depth ${tread.toFixed(1)}mm below safety threshold`,
          priority: 'CRITICAL',
          reason: 'Tread depth approaching safety limit',
          urgency: 'Immediately'
        });
      }
      
      if (recommendations.length === 0) {
        recommendations.push({
          action: 'Continue regular tire monitoring and maintenance',
          priority: 'LOW',
          reason: 'Tire condition within normal parameters',
          urgency: 'Next scheduled service'
        });
      }
    }
    
    return {
      overall_status: determineStatusFromResponse(response),
      risk_level: determineRiskFromResponse(response),
      key_findings: extractKeyFindings(response),
      recommendations: recommendations.slice(0, 4), // Limit to 4 recommendations
      next_inspection: "30 days",
      source: "AgentCore"
    };
  };

  // Tire prediction animation effect
  useEffect(() => {
    if (displayTirePrediction) {
      setTireAnimationStep(0);
      const tireAnimationTimer = setInterval(() => {
        setTireAnimationStep(prev => {
          if (prev >= 1) {
            clearInterval(tireAnimationTimer);
            return 1;
          }
          return prev + 0.02;
        });
      }, 50);
      return () => clearInterval(tireAnimationTimer);
    }
  }, [displayTirePrediction]);

  const currentData = csvData[dataIndex] || {};
  
  // Get ML data for current vehicle
  const currentMlData = mlResults.find(r => r.vehicle_id === parseInt(currentData.vehicle_id));
  
  // Get realistic pressure with gradual variations
  const getRealisticPressure = () => {
    const currentData = csvData[dataIndex] || {};
    const basePsi = parseFloat(currentData.pressure_psi) || 32.0;
    const realisticPressure = basePsi + pressureVariation;
    return Math.max(25.0, Math.min(40.0, realisticPressure)); // Keep within realistic bounds
  };

  // Get realistic temperature with seasonal adjustments
  const getRealisticTemperature = () => {
    const currentData = csvData[dataIndex] || {};
    let baseTemp = parseFloat(currentData.temperature_c) || 25;
    
    // Adjust extreme temperatures to be more realistic for tire surface temp
    if (baseTemp < 0) {
      // Winter conditions - tire temp is usually warmer than air due to friction
      baseTemp = Math.max(5, baseTemp + 15);
    } else if (baseTemp > 40) {
      // Very hot conditions - cap at reasonable tire temp
      baseTemp = Math.min(45, baseTemp);
    }
    
    // Add small variation for realism
    const variation = (Math.random() - 0.5) * 2; // ±1°C variation
    return Math.round(baseTemp + variation);
  };

  // Get realistic tread depth with proper rounding
  const getRealisticTreadDepth = () => {
    const currentData = csvData[dataIndex] || {};
    const baseTread = parseFloat(currentData.tread_depth_mm) || 8.0;
    
    // Round to realistic precision (0.5mm increments)
    return Math.round(baseTread * 2) / 2;
  };

  // Detect uneven tire wear patterns (Section 5.6 from manual)
  const detectUnevenWear = () => {
    if (!csvData || csvData.length === 0) return null;
    
    // Get tread depths for all tire positions for current vehicle
    const vehicleTires = csvData.filter(row => row.vehicle_id === currentData.vehicle_id);
    if (vehicleTires.length < 4) return null;
    
    // Get latest reading for each position
    const positions = ['front_left', 'front_right', 'rear_left', 'rear_right'];
    const treadDepths = {};
    
    positions.forEach(pos => {
      const posData = vehicleTires.filter(row => row.position === pos);
      if (posData.length > 0) {
        const latest = posData[posData.length - 1];
        treadDepths[pos] = parseFloat(latest.tread_depth_mm) || 0;
      }
    });
    
    // Calculate tread depth differences
    const depths = Object.values(treadDepths);
    if (depths.length < 4) return null;
    
    const maxDepth = Math.max(...depths);
    const minDepth = Math.min(...depths);
    const difference = maxDepth - minDepth;
    
    // Check for uneven wear based on manual thresholds
    let severity = null;
    let status = null;
    
    if (difference > 2.0) {
      severity = 'CRITICAL';
      status = 'Immediate service needed - tread depth difference >2mm indicates severe alignment or suspension issues';
    } else if (difference >= 1.0) {
      severity = 'WARNING';
      status = 'Schedule alignment check within 1 week - tread depth difference 1-2mm detected';
    } else if (difference >= 0.5) {
      severity = 'ATTENTION';
      status = 'Minor wear pattern developing - check alignment within 1 month';
    }
    
    return severity ? {
      detected: true,
      severity: severity,
      difference: difference.toFixed(1),
      maxDepth: maxDepth.toFixed(1),
      minDepth: minDepth.toFixed(1),
      status: status,
      treadDepths: treadDepths
    } : null;
  };
  
  // Dynamic prediction calculation functions
  const calculateWearPercentage = (treadDepth) => {
    const newTireDepth = 11.0; // mm for new tire
    const wornDepth = Math.max(0, newTireDepth - treadDepth);
    return Math.min(100, (wornDepth / newTireDepth) * 100);
  };

  const determineStatus = (treadDepth, hasAnomaly) => {
    if (hasAnomaly || treadDepth < 3.0) return "CRITICAL";
    if (treadDepth < 6.0) return "WARNING";
    return "GOOD";
  };

  const calculateDaysRemaining = (treadDepth, hasAnomaly) => {
    if (hasAnomaly || treadDepth < 3.0) return 7;
    if (treadDepth < 6.0) return 30;
    if (treadDepth < 8.0) return 90;
    return 180;
  };

  const generateMessage = (status, daysRemaining) => {
    if (status === "CRITICAL") return "Immediate replacement needed";
    if (status === "WARNING") return `Replace within ${Math.ceil(daysRemaining/7)} weeks`;
    const months = Math.ceil(daysRemaining/30);
    return `Continue current maintenance - ${months} months remaining`;
  };

  // Calculate dynamic predictions from current CSV data
  const calculateDynamicPredictions = (currentData) => {
    if (!currentData) return null;
    
    const treadDepth = parseFloat(currentData.tread_depth_mm) || 10.0;
    const hasAnomaly = currentData.anomaly_detected === 'True' || currentData.anomaly_detected === true;
    
    const wearPercentage = calculateWearPercentage(treadDepth);
    const status = determineStatus(treadDepth, hasAnomaly);
    const daysRemaining = calculateDaysRemaining(treadDepth, hasAnomaly);
    const message = generateMessage(status, daysRemaining);
    
    return {
      wear_percentage: wearPercentage,
      status: status,
      days_remaining: daysRemaining,
      message: message,
      tread_depth: treadDepth,
      has_anomaly: hasAnomaly
    };
  };

  // Get dynamic predictions from current CSV data
  const getRemainingLife = () => {
    const predictions = calculateDynamicPredictions(currentData);
    if (predictions) {
      return Math.round(100 - predictions.wear_percentage);
    }
    return 60; // fallback
  };
  
  // Get AI recommendations - prioritize GenAI (Claude Sonnet 4.5) over rule-based
  const getAiRecommendations = () => {
    // ONLY show recommendations from GenAI analysis (Analyze button)
    if (genAiAnalysis && genAiAnalysis.recommendations) {
      console.log('Using GenAI (Claude Sonnet 4.5) recommendations');
      return genAiAnalysis.recommendations.map(rec => ({
        action: rec.action,
        priority: rec.priority,
        reason: rec.reason,
        urgency: rec.urgency,
        genai: true // Mark as GenAI generated
      }));
    }
    
    // Return empty array if no GenAI analysis - user must click Analyze button
    return [];
  };

  // Create dynamic UI page summary based on current tire data and component state
  const createTireUIPageSummary = () => {
    const pressure = getRealisticPressure();
    const temperature = getRealisticTemperature();
    const treadDepth = getRealisticTreadDepth();
    const vehicleInfo = `${currentData.make || 'Unknown Vehicle'} - ${currentData.model || 'Electric Vehicle'} (${currentData.year || '2023'})`;
    const tireInfo = `${currentData.tire_brand || 'Premium EV Tires'} ${currentData.tire_size || 'tires'}`;
    
    // Determine overall system status
    let systemStatus = 'optimal';
    let statusColor = '#00ff88';
    let statusIcon = '✅';
    
    if (pressure < 28 || treadDepth < 3 || temperature > 80) {
      systemStatus = 'critical';
      statusColor = '#ff4444';
      statusIcon = '🚨';
    } else if (pressure < 30 || treadDepth < 5 || temperature > 70) {
      systemStatus = 'warning';
      statusColor = '#ff9900';
      statusIcon = '⚠️';
    }
    
    // Create dynamic summary
    let summary = '';
    
    // First line - overall status and vehicle info
    if (systemStatus === 'critical') {
      summary = `Tire monitoring system detecting critical conditions on ${vehicleInfo} requiring immediate attention. `;
    } else if (systemStatus === 'warning') {
      summary = `Tire monitoring system showing warning indicators for ${vehicleInfo} with maintenance needs identified. `;
    } else {
      summary = `Tire monitoring system operating normally for ${vehicleInfo} with all parameters within acceptable ranges. `;
    }
    
    // Second line - specific metrics and data flow
    const dataUpdateFreq = '30-second intervals';
    const activeMetrics = [];
    
    if (pressure < 32) activeMetrics.push(`pressure ${pressure.toFixed(1)} PSI`);
    if (treadDepth < 8) activeMetrics.push(`tread depth ${treadDepth.toFixed(1)}mm`);
    if (temperature > 25) activeMetrics.push(`temperature ${temperature}°C`);
    
    if (activeMetrics.length > 0) {
      summary += `Real-time data streaming at ${dataUpdateFreq} shows active monitoring of ${activeMetrics.join(', ')}.`;
    } else {
      summary += `Real-time data streaming at ${dataUpdateFreq} with comprehensive tire health monitoring.`;
    }
    
    return {
      summary,
      status: systemStatus,
      statusColor,
      statusIcon,
      vehicleInfo,
      tireInfo,
      dataPoints: {
        pressure: pressure.toFixed(1),
        temperature: temperature,
        treadDepth: treadDepth.toFixed(1),
        mileage: currentData.mileage || 'N/A'
      }
    };
  };
  
  const formatValue = (value, unit, fallback) => {
    // Special handling for PSI to use realistic pressure
    if (unit === '' && fallback && fallback.includes('35')) {
      const realisticPsi = getRealisticPressure();
      return `${realisticPsi.toFixed(1)}`;
    }
    
    // Special handling for temperature
    if (unit === '°C') {
      const realisticTemp = getRealisticTemperature();
      return `${realisticTemp}°C`;
    }
    
    // Special handling for tread depth
    if (unit === 'mm') {
      const realisticTread = getRealisticTreadDepth();
      return `${realisticTread.toFixed(1)}mm`;
    }
    
    if (!value) return fallback;
    const num = parseFloat(value);
    if (isNaN(num)) return fallback;
    
    return `${Math.round(num)}`;
  };
  
  const formatLoad = (weight) => {
    if (!weight) return '234kg';
    const num = parseFloat(weight);
    if (isNaN(num)) return '234kg';
    // Convert lbs to kg and divide by 4 tires
    const kgPerTire = Math.round((num * 0.453592) / 4);
    return `${kgPerTire}kg`;
  };
  
  const formatWearPattern = (pattern) => {
    if (!pattern || pattern === 'normal') return 'Even';
    return pattern === 'irregular_wear' ? 'Uneven' : 'Even';
  };

  const getReplacementMessages = () => {
    const predictions = calculateDynamicPredictions(currentData);
    const currentStatus = predictions?.status || "GOOD";
    const daysRemaining = predictions?.days_remaining || 180;
    
    // Generate dynamic messages based on current CSV conditions
    if (currentStatus === "CRITICAL") {
      return {
        best: 'Emergency replacement required immediately',
        warning: 'Do not drive - safety risk detected', 
        critical: predictions?.has_anomaly ? 'Puncture detected - stop driving now' : 'Critical wear - replace within 7 days'
      };
    } else if (currentStatus === "WARNING") {
      const weeks = Math.ceil(daysRemaining / 7);
      return {
        best: `Monitor closely - ${weeks} weeks remaining`,
        warning: `Schedule replacement within ${weeks} weeks`,
        critical: 'Approaching replacement threshold'
      };
    }
    
    const months = Math.ceil(daysRemaining / 30);
    return {
      best: `Continue current maintenance - ${months} months remaining`,
      warning: 'Regular monitoring recommended',
      critical: 'No immediate action required'
    };
  };

  // ML INTEGRATION COMPLETE - Using real predictions from tire_predictor.py and enhanced_maintenance_agent.py
  const remainingLife = getRemainingLife();
  const aiRecommendations = getAiRecommendations();
  const replacementMessages = getReplacementMessages();
  
  // DYNAMIC VIBRATION CALCULATION - All data from CSV tire_wear_data.csv
  const calculateVibrationHz = (currentData) => {
    // Base frequency starts at 60 Hz (normal driving)
    let baseHz = 60;
    
    // CSV FIELD: driving_pattern - Primary factor for vibration frequency
    // City driving (25-35 mph) = lower frequency
    if (currentData.driving_pattern === 'city') baseHz = 45;
    // Highway driving (65-75 mph) = higher frequency  
    if (currentData.driving_pattern === 'highway') baseHz = 85;
    // Mixed driving (variable speeds) = medium frequency
    if (currentData.driving_pattern === 'mixed') baseHz = 65;
    
    // CSV FIELD: anomaly_type - Tire problems create additional vibrations
    // Puncture causes severe irregular bouncing (+35 Hz)
    if (currentData.anomaly_type === 'puncture') baseHz += 35;
    // Irregular wear creates consistent vibration pattern (+20 Hz)
    if (currentData.anomaly_type === 'irregular_wear') baseHz += 20;
    // Alignment issues cause steering wheel shake (+25 Hz)
    if (currentData.anomaly_type === 'alignment_issue') baseHz += 25;
    // Sidewall damage creates wobble effect (+30 Hz)
    if (currentData.anomaly_type === 'sidewall_damage') baseHz += 30;
    
    // CSV FIELD: pressure_psi - Pressure imbalance affects vibration
    // Calculate deviation from optimal 32 PSI
    const pressureDeviation = Math.abs((currentData.pressure_psi || 32) - 32);
    // Each PSI off optimal adds 2 Hz of vibration
    baseHz += pressureDeviation * 2;
    
    // CSV FIELD: tread_depth_mm - Worn tires create imbalance
    const treadDepth = parseFloat(currentData.tread_depth_mm) || 10;
    // Severely worn tires (< 4mm) add significant vibration
    if (treadDepth < 4) baseHz += 15;
    // Moderately worn tires (< 7mm) add some vibration
    else if (treadDepth < 7) baseHz += 8;
    
    // CSV FIELD: weather_condition - Road grip affects vibration transmission
    // Wet roads reduce vibration transmission (-5 Hz)
    if (currentData.weather_condition === 'wet') baseHz -= 5;
    // Snow creates additional road noise (+10 Hz)
    if (currentData.weather_condition === 'snow') baseHz += 10;
    
    // Return rounded frequency value
    return Math.round(Math.max(baseHz, 20)); // Minimum 20 Hz
  };
  
  // Calculate current vibration frequency from CSV data
  const currentVibrationHz = calculateVibrationHz(currentData);
  
  // ML PREDICTION CHART - Uses ML data for chart, keeps CSV for remaining life
  const getDynamicChartData = () => {
    // Try to get ML predictions first
    let mlStatus = null;
    let mlDaysRemaining = null;
    
    if (currentMlData?.ml_analysis?.predictions) {
      const predictions = Object.values(currentMlData.ml_analysis.predictions);
      const mostCritical = predictions.reduce((worst, current) => {
        const statusPriority = { 'CRITICAL': 3, 'WARNING': 2, 'BEST': 1 };
        return statusPriority[current.replacement_timeline.status] > statusPriority[worst.replacement_timeline.status] 
          ? current : worst;
      }, predictions[0]);
      
      mlStatus = mostCritical.replacement_timeline.status;
      mlDaysRemaining = mostCritical.replacement_timeline.days_remaining;
    }
    
    // Fallback to CSV if ML unavailable
    const csvPredictions = calculateDynamicPredictions(currentData);
    const status = mlStatus || csvPredictions?.status || "GOOD";
    const daysRemaining = mlDaysRemaining || csvPredictions?.days_remaining || 180;
    
    // Calculate junction point based on ML timeline (not CSV health)
    const baseJunctionY = 95;
    const timelineOffset = Math.max(-30, Math.min(30, (180 - daysRemaining) * 0.3));
    const junctionY = Math.max(40, Math.min(150, baseJunctionY + timelineOffset));
    
    // Calculate future slope based on ML status
    let futureSlope, futureColor;
    if (status === "CRITICAL") {
      futureSlope = 8; // Steep decline - ML predicts rapid failure
      futureColor = "rgba(255,100,100,1)"; // Red for critical
    } else if (status === "WARNING") {
      futureSlope = 5; // Moderate decline - ML predicts accelerated wear
      futureColor = "rgba(255,200,0,1)"; // Yellow for warning  
    } else {
      futureSlope = 3; // Gentle decline - ML predicts normal wear
      futureColor = "rgba(56,239,125,1)"; // Green for good
    }
    
    // Generate past data points (orange line) - leads to junction
    const pastY1 = Math.max(40, junctionY - 55);
    const pastY2 = Math.max(40, junctionY - 45);
    const pastY3 = Math.max(40, junctionY - 35);
    const pastY4 = Math.max(40, junctionY - 25);
    const pastY5 = Math.max(40, junctionY - 15);
    const pastY6 = Math.max(40, junctionY - 5);
    
    const pastPoints = `0,${pastY1} 18,${pastY2} 36,${pastY3} 54,${pastY4} 72,${pastY5} 90,${pastY6} 108,${junctionY}`;
    
    // Generate future prediction points (dynamic color line)
    const futureY1 = junctionY + futureSlope;
    const futureY2 = junctionY + (futureSlope * 2);
    const futureY3 = junctionY + (futureSlope * 3);
    const futureY4 = junctionY + (futureSlope * 4);
    const futureY5 = junctionY + (futureSlope * 5);
    const futureY6 = junctionY + (futureSlope * 6);
    const futureY7 = junctionY + (futureSlope * 7);
    
    const futurePoints = `108,${junctionY} 126,${futureY1} 144,${futureY2} 162,${futureY3} 180,${futureY4} 198,${futureY5} 216,${futureY6} 234,${futureY7}`;
    
    // Generate data point circles
    const dataPoints = [
      { x: 0, y: pastY1, color: "rgba(255,153,0,1)" },
      { x: 18, y: pastY2, color: "rgba(255,153,0,1)" },
      { x: 36, y: pastY3, color: "rgba(255,153,0,1)" },
      { x: 54, y: pastY4, color: "rgba(255,153,0,1)" },
      { x: 72, y: pastY5, color: "rgba(255,153,0,1)" },
      { x: 90, y: pastY6, color: "rgba(255,153,0,1)" },
      { x: 108, y: junctionY, color: "rgba(255,153,0,1)" }, // Junction point
      { x: 126, y: futureY1, color: futureColor },
      { x: 144, y: futureY2, color: futureColor },
      { x: 162, y: futureY3, color: futureColor },
      { x: 180, y: futureY4, color: futureColor },
      { x: 198, y: futureY5, color: futureColor },
      { x: 216, y: futureY6, color: futureColor }
    ];
    
    return {
      pastPoints,
      futurePoints,
      futureColor,
      dataPoints,
      junctionY,
      currentHealth: remainingLife,
      status,
      mlSource: !!mlStatus,
      daysRemaining
    };
  };
  
  // Get dynamic chart data based on current tire condition
  const chartData = getDynamicChartData();
  
  // DYNAMIC ROAD SURFACE CONDITIONS - Changes every 30 seconds based on CSV data
  const getSurfaceCondition = (currentData) => {
    // Priority 1: Check for hazardous conditions from anomaly_type
    if (currentData.anomaly_type === 'puncture') return "🚨 Hazardous Surface (Debris)";
    if (currentData.anomaly_type === 'irregular_wear') return "⚠️ Rough Surface Detected";
    if (currentData.anomaly_type === 'alignment_issue') return "⚠️ Uneven Surface Conditions";
    if (currentData.anomaly_type === 'sidewall_damage') return "🚨 Dangerous Road Hazards";
    
    // Priority 2: Normal conditions - combine weather + driving pattern
    const weather = currentData.weather_condition || 'dry';
    const pattern = currentData.driving_pattern || 'mixed';
    
    // Create descriptive surface condition from CSV fields
    const weatherMap = {
      'dry': 'Dry',
      'wet': 'Wet', 
      'snow': 'Snow-Covered'
    };
    
    const patternMap = {
      'city': 'City Streets',
      'highway': 'Highway Surface',
      'mixed': 'Mixed Roads'
    };
    
    const weatherDesc = weatherMap[weather] || 'Clear';
    const patternDesc = patternMap[pattern] || 'Surface';
    
    return `${weatherDesc} ${patternDesc}`;
  };
  
  // Get current dynamic surface condition
  const currentSurfaceCondition = getSurfaceCondition(currentData);
  
  const currentPredictions = calculateDynamicPredictions(currentData);

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#000', fontFamily: 'Amazon Ember' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div className="tires-container" style={{
        transform: windowWidth <= 1024 ? `scale(${windowWidth / 1440})` : (windowWidth >= 2685 ? `scale(${windowWidth / 1920})` : undefined),
        transformOrigin: windowWidth <= 1024 ? 'top left' : (windowWidth >= 2685 ? 'top left' : undefined),
        width: windowWidth <= 1024 ? `${100 / (windowWidth / 1440)}%` : (windowWidth >= 2685 ? `${100 / (windowWidth / 1920)}%` : undefined),
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}>
      {/* Header */}
      <header className="header" style={{ height: windowWidth <= 1440 ? '45px' : windowWidth <= 1700 ? '50px' : windowWidth <= 1815 ? '60px' : 'auto', padding: windowWidth <= 1440 ? '8px 15px' : windowWidth <= 1700 ? '10px 20px' : windowWidth <= 1815 ? '15px 20px' : '20px' }}>
        <div className="header-left">
          <svg width="43px" height="20px" viewBox="0 0 43 20" style={{ marginRight: '8px' }}>
            <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12"/>
            <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12"/>
            <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12"/>
          </svg>
          <h1 style={{ fontSize: windowWidth <= 1440 ? '18px' : windowWidth <= 1700 ? '20px' : windowWidth <= 1815 ? '22px' : '24px', fontWeight: '700', fontFamily: 'Amazon Ember' }}>EV Digital Twin</h1>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px', paddingBottom: '15px' }}>
        <div 
          onClick={() => navigate(`/car/${carId}`)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            fontSize: '24px',
            padding: '10px',
            margin: '0',
            zIndex: 9999,
            position: 'relative'
          }}
        >
          <span>←</span>
          <span>Tires</span>
        </div>
        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>VIN Number: ###</span>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: '32px', width: '100%', height: '100%', margin: '-100px 20px 20px 20px', alignItems: 'flex-start' }}>
        {/* Main Panel */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '60px' }}>
          {/* Details Container */}
          <div style={{ background: '#1b1e20', border: '1px solid #3a4552', padding: '20px', color: 'white' }}>
          <h3 style={{ color: 'white', fontSize: windowWidth <= 1440 ? '14px' : windowWidth <= 1700 ? '16px' : windowWidth <= 1815 ? '18px' : '20px' }}>Details</h3>

          <div className="tire-grid" style={{ marginTop: '15px' }}>
            {/* Vehicle Image in Center */}
            <div className="vehicle-center">
              <VehicleSVG className="vehicle-image" style={{ width: '120px', height: 'auto' }} />
            </div>
            
            {/* Front Tires */}
            <div className="tire-row">
              <div className="tire-info front-left" style={{ width: windowWidth <= 1440 ? '110%' : windowWidth <= 1700 ? '105%' : 'auto', display: windowWidth <= 1440 ? 'flex' : windowWidth <= 1700 ? 'flex' : 'block', justifyContent: windowWidth <= 1440 ? 'flex-end' : windowWidth <= 1700 ? 'flex-end' : 'normal' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: windowWidth <= 1440 ? '90%' : windowWidth <= 1700 ? '95%' : '100%' }}>
                  <div>
                    <div className="tire-position">Front Left</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern">{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Tread</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                </div>
              </div>
              <div className="tire-diagram"></div>
              <div className="tire-info front-right" style={{ marginLeft: windowWidth <= 1440 ? '8%' : windowWidth <= 1700 ? '5%' : '0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: window.innerWidth >= 1400 ? '60px' : '0px', transform: windowWidth <= 1440 ? 'translateX(-40px)' : windowWidth <= 1700 ? 'translateX(-30px)' : 'none' }}>
                  <div style={{ marginRight: '20px' }}>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Tread</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern" style={{ marginRight: '15px' }}>{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    <div className="tire-position">Front Right</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rear Tires */}
            <div className="tire-row">
              <div className="tire-info rear-left" style={{ width: windowWidth <= 1440 ? '110%' : windowWidth <= 1700 ? '105%' : 'auto', display: windowWidth <= 1440 ? 'flex' : windowWidth <= 1700 ? 'flex' : 'block', justifyContent: windowWidth <= 1440 ? 'flex-end' : windowWidth <= 1700 ? 'flex-end' : 'normal' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: windowWidth <= 1440 ? '90%' : windowWidth <= 1700 ? '95%' : '100%' }}>
                  <div>
                    <div className="tire-position">Rear Left</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern">{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Tread</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                </div>
              </div>
              <div className="tire-diagram"></div>
              <div className="tire-info rear-right" style={{ marginLeft: windowWidth <= 1440 ? '8%' : windowWidth <= 1700 ? '5%' : '0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', textAlign: 'right', marginLeft: window.innerWidth >= 1400 ? '60px' : '0px', transform: windowWidth <= 1440 ? 'translateX(-40px)' : windowWidth <= 1700 ? 'translateX(-30px)' : 'none' }}>
                  <div style={{ marginRight: '20px' }}>
                    {/* CSV DATA: Pressure from pressure_psi */}
                    <div className="load">{formatValue(currentData.pressure_psi, '', '35')}</div>
                    <div className="tire-position">PSI</div>
                  </div>
                  <div>
                    {/* CSV DATA: Temperature from temperature_c */}
                    <div className="load">{formatValue(currentData.temperature_c, '°C', '30°C')}</div>
                    <div className="tire-position">Temperature</div>
                  </div>
                  <div>
                    {/* CSV DATA: Tread depth from tread_depth_mm */}
                    <div className="load">{formatValue(currentData.tread_depth_mm, 'mm', '8.0mm')}</div>
                    <div className="tire-position">Tread</div>
                  </div>
                  {/* CSV DATA: Wear pattern from anomaly_type */}
                  <div className="wear-pattern" style={{ marginRight: '15px' }}>{formatWearPattern(currentData.anomaly_type)}</div>
                  <div>
                    <div className="tire-position">Rear Right</div>
                    {/* CSV DATA: Load from curb_weight_lbs */}
                    <div className="load">{formatLoad(currentData.curb_weight_lbs)}</div>
                    <div className="tire-position">Load</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Bottom Containers */}
          <div style={{ display: 'flex', gap: '24px', width: '100%', marginTop: windowWidth <= 1440 ? '-20px' : windowWidth <= 1700 ? '-15px' : windowWidth <= 1815 ? '-10px' : '0' }}>
            <div style={{ 
              background: '#1b1e20', 
              border: '1px solid #3a4552', 
              padding: '20px', 
              color: 'white', 
              flex: 1.5,
              height: window.innerWidth >= 2560 ? '380px' : window.innerWidth >= 1920 ? '340px' : window.innerWidth >= 1400 && window.innerWidth <= 1600 ? '240px' : window.innerWidth >= 1400 ? '280px' : '220px'
            }}>
              <h3 style={{ fontSize: windowWidth <= 1440 ? '14px' : windowWidth <= 1700 ? '16px' : windowWidth <= 1815 ? '18px' : '20px' }}>Road Surface Conditions</h3>
              <div className="surface-graph">
                {/* DYNAMIC CSV DATA: Distance from mileage field converted to miles */}
                <div className="surface-metric">{currentData.mileage ? `${Math.round(currentData.mileage * 0.621371)} miles` : '25 miles' /* Static fallback */}</div>
                {/* DYNAMIC CSV DATA: Surface condition from weather_condition + driving_pattern + anomaly_type */}
                <div className="surface-label">{currentSurfaceCondition || 'Smooth Surface' /* Static fallback */}</div>
                <img src={require('./assets/roadsurfacecond.png')} alt="Road Surface Condition" style={{ width: '100%', marginTop: '15px' }} />
              </div>
            </div>

            <div style={{ 
              background: '#1b1e20', 
              border: '1px solid #3a4552', 
              padding: '20px', 
              color: 'white', 
              flex: 0.8,
              height: window.innerWidth >= 2560 ? '380px' : window.innerWidth >= 1920 ? '340px' : window.innerWidth >= 1400 && window.innerWidth <= 1600 ? '240px' : window.innerWidth >= 1400 ? '280px' : '220px'
            }}>
              <h3 style={{ fontSize: windowWidth <= 1440 ? '14px' : windowWidth <= 1700 ? '16px' : windowWidth <= 1815 ? '18px' : '20px' }}>Vibration/Frequency Signatures</h3>
              <div className="vibration-graph">
                {/* DYNAMIC VIBRATION: Changes every 30 seconds based on CSV tire data */}
                <div className="vibration-metric">{currentVibrationHz} Hz</div>
                <div className="surface-label">Vibration/Frequency Signatures</div>
                <img src={require('./assets/vibration:signature.png')} alt="Vibration Signature" style={{ width: '100%', marginTop: '15px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1, background: '#434a54', borderRadius: 0, padding: '24px', minWidth: '350px', minHeight: 0, alignSelf: 'flex-start' }}>
            <div className="motor-prediction">
              <div className="prediction-header" style={{ marginBottom: windowWidth <= 1700 ? '30px' : '20px' }}>
                <h2 style={{ fontSize: windowWidth <= 1440 ? '16px' : windowWidth <= 1700 ? '18px' : windowWidth <= 1815 ? '22px' : '24px', marginTop: windowWidth <= 1440 ? '-25px' : windowWidth <= 1700 ? '-20px' : windowWidth <= 1815 ? '-10px' : '0' }}>Tire Prediction</h2>
                <img
                  src={require('./assets/warning.png')}
                  alt="Warning"
                  className="info-icon"
                  style={{ width: '20px', height: '20px', cursor: 'pointer', marginTop: windowWidth <= 1440 ? '-25px' : windowWidth <= 1700 ? '-20px' : windowWidth <= 1815 ? '-10px' : '0', zIndex: 99999, position: 'relative' }}
                  onClick={() => { console.log('Modal clicked, showModal:', showModal); setShowModal(true); }}
                />
              </div>

              {/* Failure Prediction Chart */}
              <div className="motor-prediction-container" style={{ paddingLeft: '30px', marginTop: windowWidth <= 1440 ? '-25px' : windowWidth <= 1700 ? '-20px' : windowWidth <= 1815 ? '-10px' : '0' }}>
                <div className="failure-prediction" style={{ marginTop: windowWidth <= 1440 ? '-15px' : windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : '0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: windowWidth <= 1440 ? '11px' : windowWidth <= 1700 ? '12px' : windowWidth <= 1815 ? '13px' : '14px', position: 'relative', top: windowWidth <= 1700 ? '-3px' : '0' }}>Tire Failure Prediction</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                        Show Prediction
                      </span>
                      <button
                        onClick={() => setDisplayTirePrediction(!displayTirePrediction)}
                        style={{
                          background: displayTirePrediction ? '#37bc12' : 'rgba(255,255,255,0.2)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '12px',
                          width: '40px',
                          height: '20px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          zIndex: 1000,
                          outline: 'none',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: displayTirePrediction ? 'flex-end' : 'flex-start',
                          paddingLeft: displayTirePrediction ? '0' : '2px',
                          paddingRight: displayTirePrediction ? '2px' : '0'
                        }}
                      >
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: 'white',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            pointerEvents: 'none'
                          }}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="prediction-legend" style={{ position: 'relative', top: windowWidth <= 1700 ? '-2px' : '0' }}>
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(255,153,0,1)' }}></div>
                      <span>Past</span>
                    </div>
                    <div className="legend-item">
                      <div style={{ width: '15px', height: '2px', backgroundColor: 'rgba(56,239,125,1)', borderTop: '2px dashed rgba(56,239,125,1)', backgroundColor: 'transparent' }}></div>
                      <span>Predicted</span>
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginTop: windowWidth <= 1700 ? '5px' : windowWidth === 1920 ? '-35px' : '5px' }}>
                    <div className="prediction-chart" style={{ marginTop: windowWidth <= 1700 ? '-120px' : windowWidth <= 1815 ? '-60px' : windowWidth === 1920 ? '-90px' : '-30px' }}>
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
                      <text x="65" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">10k</text>
                      <text x="95" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">20k</text>
                      <text x="125" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">30k</text>
                      <text x="155" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">40k</text>
                      <text x="185" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">50k</text>
                      <text x="215" y="175" fill="rgba(255,255,255,0.8)" fontSize="8" textAnchor="middle">60k</text>
                      
                      {/* Axis labels */}
                      <text x="145" y="190" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle">Miles</text>
                      <text x="8" y="90" fill="rgba(255,255,255,0.6)" fontSize="9" textAnchor="middle" transform="rotate(-90 8 90)">Health %</text>
                      
                      {/* Critical failure threshold line */}
                      <line x1="35" y1="105" x2="255" y2="105" stroke="rgba(255,68,68,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                      <text x="260" y="110" fill="rgba(255,68,68,0.9)" fontSize="7">Critical</text>
                      
                      {/* Warning threshold line */}
                      <line x1="35" y1="85" x2="255" y2="85" stroke="rgba(255,153,0,0.6)" strokeWidth="1" strokeDasharray="3,3"/>
                      <text x="260" y="90" fill="rgba(255,153,0,0.9)" fontSize="7">Warning</text>
                      
                      {/* Past data (orange) - Declining tire health */}
                      <polyline
                        points="35,35 50,40 65,45 80,50 95,55 110,60 125,65"
                        fill="none"
                        stroke="rgba(255,153,0,1)"
                        strokeWidth="2"
                      />
                      
                      {/* Predicted data (green) - Animated based on toggle */}
                      {displayTirePrediction && (
                        <polyline
                          points="125,65 140,70 155,75 170,82 185,90 200,100 215,112"
                          fill="none"
                          stroke="rgba(56,239,125,1)"
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          strokeDashoffset={100 * (1 - tireAnimationStep)}
                          style={{
                            transition: 'stroke-dashoffset 0.1s ease-out'
                          }}
                        />
                      )}
                      
                      {/* Data points - Historical */}
                      <circle cx="35" cy="35" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="50" cy="40" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="65" cy="45" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="80" cy="50" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="95" cy="55" r="1.5" fill="rgba(255,153,0,1)"/>
                      <circle cx="110" cy="60" r="1.5" fill="rgba(255,153,0,1)"/>
                      
                      {/* Current point - Highlighted */}
                      <circle cx="125" cy="65" r="2.5" fill="rgba(255,153,0,1)" stroke="white" strokeWidth="1.5"/>
                      
                      {/* Data points - Predicted (appear progressively) */}
                      {displayTirePrediction && tireAnimationStep > 0.15 && (
                        <circle cx="140" cy="70" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (tireAnimationStep - 0.15) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.3 && (
                        <circle cx="155" cy="75" r="1.5" fill="rgba(56,239,125,1)" opacity={Math.min(1, (tireAnimationStep - 0.3) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.45 && (
                        <circle cx="170" cy="82" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (tireAnimationStep - 0.45) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.6 && (
                        <circle cx="185" cy="90" r="1.5" fill="rgba(255,153,0,1)" opacity={Math.min(1, (tireAnimationStep - 0.6) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.75 && (
                        <circle cx="200" cy="100" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (tireAnimationStep - 0.75) * 5)}/>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.9 && (
                        <circle cx="215" cy="112" r="1.5" fill="rgba(255,68,68,1)" opacity={Math.min(1, (tireAnimationStep - 0.9) * 10)}/>
                      )}
                      
                      {/* Annotations */}
                      <text x="125" y="58" fill="rgba(255,255,255,0.9)" fontSize="7" textAnchor="middle" fontWeight="bold">NOW</text>
                      {displayTirePrediction && tireAnimationStep > 0.5 && (
                        <>
                          <text x="170" y="75" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.5) * 2)}>Replacement</text>
                          <text x="170" y="83" fill="rgba(255,153,0,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.5) * 2)}>Needed</text>
                        </>
                      )}
                      {displayTirePrediction && tireAnimationStep > 0.8 && (
                        <>
                          <text x="200" y="93" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.8) * 5)}>Failure</text>
                          <text x="200" y="101" fill="rgba(255,68,68,0.9)" fontSize="6" textAnchor="middle" opacity={Math.min(1, (tireAnimationStep - 0.8) * 5)}>Risk</text>
                        </>
                      )}
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Remaining Useful Life */}
                <div className="useful-life" style={{ marginBottom: '20px', marginTop: windowWidth <= 1700 ? '-110px' : windowWidth <= 1815 ? '-60px' : windowWidth === 1920 ? '-100px' : '-40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '10px', color: 'white' }}>Remaining useful life</span>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 'bold' }}>{remainingLife}%</span>
                  </div>
                  <div className="life-bar" style={{ borderRadius: '0' }}>
                    <div className="life-fill" style={{ width: `${remainingLife}%`, borderRadius: '0' }}></div>
                  </div>
                </div>

                {/* UI Page Summary */}
                <div className="ui-page-summary" style={{ 
                  marginTop: windowWidth <= 1700 ? '-10px' : windowWidth <= 1815 ? '-5px' : windowWidth === 1920 ? '-15px' : '0px',
                  marginBottom: '15px',
                  padding: '12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  border: `1px solid ${createTireUIPageSummary().statusColor}40`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{createTireUIPageSummary().statusIcon}</span>
                    <h3 style={{ margin: 0, fontSize: '14px', color: createTireUIPageSummary().statusColor }}>
                      Tire System Status: {createTireUIPageSummary().status.toUpperCase()}
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
                    {createTireUIPageSummary().summary}
                  </p>
                  
                  {/* Quick Metrics Display */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    fontSize: '10px', 
                    color: 'rgba(255,255,255,0.7)',
                    flexWrap: 'wrap'
                  }}>
                    <span>🔧 {createTireUIPageSummary().dataPoints.pressure} PSI</span>
                    <span>🌡️ {createTireUIPageSummary().dataPoints.temperature}°C</span>
                    <span>📏 {createTireUIPageSummary().dataPoints.treadDepth}mm</span>
                    <span>🛣️ {createTireUIPageSummary().dataPoints.mileage} mi</span>
                    <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                      {createTireUIPageSummary().vehicleInfo} | {createTireUIPageSummary().tireInfo}
                    </span>
                  </div>
                </div>

                {/* GenAI Recommendations */}
                <div className="genai-recommendations" style={{ marginTop: windowWidth === 1920 ? '-30px' : '0px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3>GenAI Recommendations</h3>
                    <button
                      onClick={analyzeWithGenAI}
                      disabled={genAiLoading}
                      style={{
                        background: genAiLoading ? '#666' : '#00ff88',
                        color: genAiLoading ? '#ccc' : '#000',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: genAiLoading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '-6px'
                      }}
                    >
                      {genAiLoading ? (
                        <>
                          <div className="spinner" style={{ width: '10px', height: '10px', border: '2px solid #999', borderTop: '2px solid #ccc', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Analyzing...
                        </>
                      ) : (
                        <>
                          🤖 Analyze
                        </>
                      )}
                    </button>
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
                        `Analysis by Claude Sonnet 4.5. Status: ${genAiAnalysis.overall_status} | Risk: ${genAiAnalysis.risk_level}`
                      ) :
                      'AI-powered tire optimization. Click "Analyze" to get Claude Sonnet 4.5 recommendations for current tire condition.'
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
                        {(rec.reason || rec.urgency) && (
                          <div className="recommendation-details" style={{ marginLeft: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                            {rec.reason && <p><strong>Reason:</strong> {rec.reason}</p>}
                            {rec.urgency && <p><strong>Urgency:</strong> {rec.urgency}</p>}
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
                    
                    {/* Citations from Knowledge Base */}
                    {genAiAnalysis?.citations && genAiAnalysis.citations.length > 0 && (
                      <div style={{ marginTop: '12px', padding: '8px', backgroundColor: 'rgba(100,149,237,0.1)', borderRadius: '4px', border: '1px solid rgba(100,149,237,0.3)' }}>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6495ED', marginBottom: '6px' }}>📚 Sources:</div>
                        {genAiAnalysis.citations.map((citation, idx) => (
                          <div key={idx} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px', paddingLeft: '8px' }}>
                            <span style={{ color: '#6495ED' }}>•</span> {citation.source}
                            {citation.confidence < 1.0 && (
                              <span style={{ marginLeft: '6px', color: 'rgba(255,255,255,0.6)' }}>
                                (Confidence: {(citation.confidence * 100).toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {genAiAnalysis?.raw_response && (
                      <div 
                        className="more-link" 
                        onClick={() => setShowFullAnalysis(!showFullAnalysis)}
                        style={{ marginTop: '16px', fontSize: '12px', color: '#ff9900', cursor: 'pointer', userSelect: 'none' }}
                      >
                        {showFullAnalysis ? 'Less ▲' : 'More... ▼'}
                      </div>
                    )}
                    
                    {showFullAnalysis && genAiAnalysis?.raw_response && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        backgroundColor: 'rgba(0,0,0,0.3)', 
                        borderRadius: '6px',
                        border: '1px solid rgba(0,255,136,0.3)',
                        fontSize: '11px',
                        lineHeight: '1.6',
                        color: 'rgba(255,255,255,0.9)',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '400px',
                        overflowY: 'auto'
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#00ff88', marginBottom: '8px' }}>
                          📋 Full Analysis from Claude Sonnet 4.5
                        </div>
                        {genAiAnalysis.raw_response}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      <DataNeededModal open={showModal} onClose={() => setShowModal(false)} type="tire" />
      </div>
    </div>
  );
};

export default TiresPage;