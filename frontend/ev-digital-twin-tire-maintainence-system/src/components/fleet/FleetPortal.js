import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import agentCoreService from '../../services/agentcore';
import './fleetportal.css';

const FleetPortal = () => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State for window size tracking
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // State for AI-powered maintenance recommendations
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // State for approval modal
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [approvalInstructions, setApprovalInstructions] = useState('');
  const [submittingApproval, setSubmittingApproval] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch AI recommendations on demand
  const fetchRecommendations = async () => {
      try {
        setLoadingRecommendations(true);
        console.log('Starting to fetch AI recommendations...');

        // Get recommendations for vehicles 1, 2, and 3
        const vehicleIds = [1, 2, 3];
        const recommendations = [];

        for (const vehicleId of vehicleIds) {
          try {
            console.log(`Fetching recommendations for vehicle ${vehicleId}...`);
            const startTime = Date.now();

            const response = await agentCoreService.getMaintenanceRecommendations(vehicleId);

            const elapsed = Date.now() - startTime;
            console.log(`Received response for vehicle ${vehicleId} in ${elapsed}ms:`, response);

            // Parse the response to extract key recommendations
            const rec = parseRecommendation(response, vehicleId);
            if (rec) {
              console.log(`Parsed recommendation for vehicle ${vehicleId}:`, rec);
              recommendations.push(rec);
              // Update state incrementally so user sees results as they come in
              setAiRecommendations([...recommendations]);
            }
          } catch (error) {
            console.error(`Error fetching recommendations for vehicle ${vehicleId}:`, error);
            // Add error as a recommendation so user knows something went wrong
            recommendations.push({
              vehicleId,
              vehicleName: getVehicleName(vehicleId),
              description: `Failed to fetch recommendations: ${error.message}`,
              priority: 'normal',
              timestamp: new Date().toISOString(),
              error: true
            });
            setAiRecommendations([...recommendations]);
          }
        }

        console.log('Finished fetching all recommendations:', recommendations);
      } catch (error) {
        console.error('Error fetching AI recommendations:', error);
      } finally {
        setLoadingRecommendations(false);
      }
    };

  // Parse AI response into structured recommendation
  const parseRecommendation = (response, vehicleId) => {
    // Extract key information from the AI response
    const lines = response.split('\n').filter(line => line.trim());

    // Look for recommendations or critical issues
    let description = '';
    let priority = 'normal';

    const lowerResponse = response.toLowerCase();
    
    // Check for explicit "no critical/urgent" phrases FIRST
    if (lowerResponse.match(/no (critical|urgent|immediate)/)) {
      priority = 'normal';
    }
    // Then check for actual critical issues
    else if (lowerResponse.match(/(critical|urgent|immediate).*(issue|problem|attention|required)/)) {
      priority = 'critical';
    }
    else if (lowerResponse.match(/(warning|soon|attention).*(needed|required|recommended)/)) {
      priority = 'warning';
    }

    // Extract the most important recommendation
    const recLines = lines.filter(line =>
      line.includes('Recommendation') ||
      line.includes('Inflate') ||
      line.includes('Monitor') ||
      line.includes('Replace') ||
      line.includes('Check') ||
      line.includes('Schedule')
    );

    if (recLines.length > 0) {
      description = recLines[0].replace(/^[#\-*\d.]+\s*/, '').trim();
    } else if (lines.length > 0) {
      // Use first meaningful line
      description = lines.find(line => line.length > 20) || lines[0];
    }

    return {
      vehicleId,
      vehicleName: getVehicleName(vehicleId),
      description: description.substring(0, 150), // Limit length for display
      fullRecommendation: response, // Store full AI response
      priority,
      timestamp: new Date().toISOString()
    };
  };

  const getVehicleName = (vehicleId) => {
    const vehicles = {
      1: '1C4BJWCG8DL501255',
      2: '1FVHG3DX3DHFE3747',
      3: '1GCEC14W6TZ225573'
    };
    return vehicles[vehicleId] || `Vehicle ${vehicleId}`;
  };

  const handleDismiss = (index) => {
    setAiRecommendations(prev => prev.filter((_, i) => i !== index));
  };

  const handleApprove = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setApprovalInstructions('');
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!approvalInstructions.trim()) {
      alert('Please provide instructions for this maintenance');
      return;
    }

    setSubmittingApproval(true);
    try {
      const prompt = `Approve maintenance for vehicle ${selectedRecommendation.vehicleId} (VIN: ${selectedRecommendation.vehicleName}). Recommendation: ${selectedRecommendation.description}. Operator instructions: ${approvalInstructions}. Please schedule the appropriate maintenance using the schedule_appointment tool.`;
      
      const response = await agentCoreService.chat(prompt);
      console.log('Agent response:', response);
      
      alert(`Maintenance approved for ${selectedRecommendation.vehicleName}\n\nAgent Response: ${response.substring(0, 200)}...`);
      
      // Remove from recommendations after approval
      handleDismiss(aiRecommendations.indexOf(selectedRecommendation));
      setShowApprovalModal(false);
    } catch (error) {
      console.error('Error submitting approval:', error);
      alert('Failed to submit approval. Please try again.');
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleReject = (recommendation) => {
    console.log('Rejected:', recommendation);
    alert(`Maintenance rejected for ${recommendation.vehicleName}`);
  };

  const getScale = () => {
    const width = windowSize.width;
    if (width <= 1024) return width / 1440;  // Mobile only
    return 1.0;  // Let CSS media queries handle everything else
  };

  const scale = getScale();

  return (
    <div className="fleet-portal" style={{
      transform: scale !== 1 ? `scale(${scale})` : undefined,
      transformOrigin: scale !== 1 ? 'top left' : undefined,
      width: scale !== 1 ? `${100 / scale}%` : undefined,
      height: scale !== 1 ? `${100 / scale}%` : undefined
    }}>
      <header className="main-header">
        <div className="header-left">
          <svg width="43px" height="20px" viewBox="0 0 43 20" style={{ marginRight: '8px' }}>
            <path d="M4.94797 15.7069C4.9294 15.7069 4.91155 15.7069 4.89299 15.7055L2.88435 15.5905C2.10174 15.5834 1.42482 15.3042 0.924977 14.7815C-0.045425 13.7661 -0.00543786 12.2002 0.00241676 12.0245C0.0452601 11.0727 0.283755 10.3158 0.712903 9.77598C0.742179 9.73885 0.771455 9.70458 0.800732 9.67102C0.692195 8.92483 1.01209 8.46426 1.09492 8.3593C1.11634 8.33288 1.13848 8.30717 1.16276 8.28289C2.7958 6.61986 7.60712 5.66159 10.3298 5.23887C11.2152 5.10106 12.07 4.87042 12.8711 4.55266C14.0008 4.10352 15.3054 3.43659 16.45 2.72182C18.3144 1.55791 20.3494 0.773878 22.4995 0.393286C25.1943 -0.0844178 33.9429 -0.0251512 38.9178 0.0526809C41.1885 0.0883838 43.0357 1.96492 43.0357 4.23562C43.0357 6.50632 41.1592 8.41928 38.8521 8.41928L31.7686 8.41928C31.2402 8.41928 30.8111 7.99084 30.8111 7.46173C30.8111 6.93261 31.2395 6.50418 31.7686 6.50418L38.8521 6.50418C40.1031 6.50418 41.1206 5.48665 41.1206 4.23562C41.1206 2.9846 40.1188 1.98635 38.8878 1.96707C30.5383 1.83639 24.6866 1.94993 22.8336 2.27839C20.9264 2.61614 19.1198 3.31163 17.4639 4.34559C16.7363 4.79973 15.2647 5.66159 13.5773 6.33209C12.6434 6.70269 11.6501 6.97117 10.624 7.13041C6.82094 7.72164 3.7862 8.62136 2.71155 9.46323C2.72297 9.50179 2.74082 9.55248 2.77081 9.61532C2.8922 9.87024 2.89434 10.1659 2.77724 10.4229C2.67441 10.6486 2.48805 10.8249 2.26026 10.9156C2.16601 10.992 1.95036 11.3255 1.91537 12.1109C1.90752 12.343 1.96321 13.1021 2.31167 13.4619C2.40093 13.5541 2.56017 13.6769 2.91434 13.6769C2.9329 13.6769 2.95075 13.6769 2.96932 13.6783L4.11895 13.744C4.58951 11.3291 6.72169 9.50036 9.27158 9.50036C11.8215 9.50036 13.8644 11.2327 14.3928 13.5862L32.8526 13.1813C33.1403 12.2623 33.6802 11.4319 34.4164 10.7907C35.3718 9.95878 36.5957 9.50036 37.8638 9.50036C40.3759 9.50036 42.5437 11.2884 43.0186 13.7526C43.1186 14.2717 42.7787 14.7737 42.2595 14.8736C41.7404 14.9736 41.2384 14.6337 41.1385 14.1146C40.8371 12.5508 39.4604 11.4155 37.8638 11.4155C36.2672 11.4155 34.8012 12.6393 34.5634 14.2617C34.4956 14.7237 34.1043 15.07 33.6373 15.08L13.5809 15.5199C13.0604 15.5341 12.6262 15.1243 12.6034 14.6037C12.5262 12.8157 11.0631 11.4155 9.27158 11.4155C7.48001 11.4155 5.93694 12.9114 5.93622 14.7501C5.93622 15.2678 5.52421 15.6919 5.00652 15.7069L4.9751 15.7069C4.96582 15.7084 4.95725 15.7084 4.94797 15.7084L4.94797 15.7069Z" fill="#37bc12" />
            <circle cx="32.5" cy="10.5" r="5.25" fill="#37bc12" />
            <circle cx="10.5" cy="10.5" r="5.25" fill="#37bc12" />
          </svg>
          <h1 style={{ fontSize: '24px', fontWeight: '700', fontFamily: 'Amazon Ember' }}>Fleet Management Portal</h1>
        </div>
        <div className="header-right">
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <span className="username">newuser</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>
            {dropdownOpen && (
              <div style={{
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
                <div onClick={() => navigate('/')} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img src={require('../assets/car.png')} alt="Car" style={{ width: '16px', height: '16px' }} />
                  Connected Vehicles
                </div>
                <div onClick={() => navigate('/fleet')} style={{ padding: '10px 15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
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

      <div className="sub-header">
        <button className="back-btn" onClick={() => navigate('/fleet')}>
          ← Seattle, WA
        </button>
      </div>

      <div className="dashboard-content">
        <div className="left-panel" style={{ marginTop: windowSize.width <= 1700 ? '-20px' : windowSize.width <= 1815 ? '-10px' : windowSize.width >= 1900 ? '-30px' : '0', height: windowSize.width <= 1700 ? 'calc(100vh - 140px)' : windowSize.width <= 1815 ? 'calc(100vh - 160px)' : 'auto' }}>
          <div className="panel-title">Vehicles (10)</div>
          <div className="map-container">
            <div className="mini-map">
              <div className="marker green" style={{ top: '20%', left: '15%' }}></div>
              <div className="marker green" style={{ top: '40%', left: '60%' }}></div>
              <div className="marker green" style={{ top: '70%', left: '30%' }}></div>
              <div className="marker orange" style={{ top: '30%', left: '80%' }}></div>
              <div className="marker orange" style={{ top: '80%', left: '70%' }}></div>
              <div className="marker gray" style={{ top: '50%', left: '40%' }}></div>
            </div>
            <div className="map-legend fleet-legend" style={{ marginTop: windowSize.width <= 1700 ? '80px' : windowSize.width <= 1815 ? '60px' : '40px', paddingTop: '0', width: '120%' }}>
              <div className="legend-item">
                <div className="legend-dot green"></div>
                <span className="legend-text">Charging (3)</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot orange"></div>
                <span className="legend-text">Below 20%</span>
              </div>
              <div className="legend-item">
                <div className="legend-dot" style={{ background: '#666' }}></div>
                <span className="legend-text">Not Charging</span>
              </div>
            </div>
          </div>
          <div className="search-section" style={{ marginTop: windowSize.width <= 1700 ? '-78px' : windowSize.width <= 1815 ? '-75px' : '0' }}>
            <input type="text" placeholder="Search for vehicle" />
          </div>
          <div className="vehicle-list" style={{ marginTop: windowSize.width <= 1700 ? '-68px' : windowSize.width <= 1815 ? '-35px' : '0', paddingTop: windowSize.width <= 1700 ? '95px' : windowSize.width <= 1815 ? '50px' : '0' }}>
            <div className="vehicle-row">
              <div className="vehicle-info">
                <div className="vehicle-id" onClick={() => navigate('/car/1')}>1C4BJWCG8DL501255</div>
                <div className="vehicle-address">1779 Dale Avenue</div>
              </div>
              <div className="battery-section">
                <div className="battery-row">
                  <span>100%</span>
                  <div className="battery-bar">
                    <div className="battery-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="miles-text">315 Miles</div>
              </div>
            </div>
            <div className="vehicle-row">
              <div className="vehicle-info">
                <div className="vehicle-id" onClick={() => navigate('/car/2')}>1FVHG3DX3DHFE3747</div>
                <div className="vehicle-address">Address</div>
              </div>
              <div className="battery-section">
                <div className="battery-row">
                  <span>100%</span>
                  <div className="battery-bar">
                    <div className="battery-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="miles-text">XXX Miles</div>
              </div>
            </div>
            <div className="vehicle-row">
              <div className="vehicle-info">
                <div className="vehicle-id" onClick={() => navigate('/car/3')}>1GCEC14W6TZ225573</div>
                <div className="vehicle-address">Address</div>
              </div>
              <div className="battery-section">
                <div className="battery-row">
                  <span>100%</span>
                  <div className="battery-bar">
                    <div className="battery-fill" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div className="miles-text">XXX Miles</div>
              </div>
            </div>
            <div className="vehicle-row">
              <div className="vehicle-info">
                <div className="vehicle-id" onClick={() => navigate('/car/4')}>3B7HC13Z7TG112627</div>
                <div className="vehicle-address">Address</div>
              </div>
              <div className="battery-section">
                <div className="battery-row">
                  <span>19%</span>
                  <div className="battery-bar">
                    <div className="battery-fill low" style={{ width: '19%' }}></div>
                  </div>
                </div>
                <div className="miles-text">XXX Miles</div>
              </div>
            </div>
            <div className="vehicle-row">
              <div className="vehicle-info">
                <div className="vehicle-id" onClick={() => navigate('/car/5')}>WAUHGAFC6DN030356</div>
                <div className="vehicle-address">Address</div>
              </div>
              <div className="battery-section">
                <div className="battery-row">
                  <span>15%</span>
                  <div className="battery-bar">
                    <div className="battery-fill low" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div className="miles-text">XXX Miles</div>
              </div>
            </div>
          </div>
        </div>

        <div className="center-panel" style={{ marginTop: windowSize.width <= 1700 ? '-20px' : windowSize.width <= 1815 ? '-10px' : windowSize.width >= 1900 ? '-30px' : '0', height: windowSize.width <= 1700 ? 'calc(100vh - 140px)' : windowSize.width <= 1815 ? 'calc(100vh - 160px)' : 'auto' }}>
          <div className="panel-title">Resource Allocation</div>
          <div className="top-sections">
            <div className="resource-section">
              <div className="section-header">
                <span>📦 Active Shipments</span>
                <span className="count-badge">4</span>
              </div>
              <div className="shipment-list">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: windowSize.width <= 1700 ? '12px' : windowSize.width <= 1815 ? '11px' : '14px' }}>
                  <span>A-B: 12 tons</span>
                  <span>1C4BJWCG8DL501255</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: windowSize.width <= 1700 ? '12px' : windowSize.width <= 1815 ? '11px' : '14px' }}>
                  <span>A-C: 6 tons</span>
                  <span>1FVHG3DX3DHFE3747</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: windowSize.width <= 1700 ? '12px' : windowSize.width <= 1815 ? '11px' : '14px' }}>
                  <span>C-B: 8 tons</span>
                  <span>1GCEC14W6TZ225573</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: windowSize.width <= 1700 ? '12px' : windowSize.width <= 1815 ? '11px' : '14px' }}>
                  <span>B-D: 4 tons</span>
                  <span>3B7HC13Z7TG112627</span>
                </div>
              </div>
            </div>
            <div className="resource-section">
              <div className="section-header">
                <span>🔋 Charging Use</span>
                <span className="count-badge">3</span>
              </div>
              <div className="charging-status">
                <div>2 at depot</div>
                <div>1 on route</div>
              </div>
            </div>
          </div>
          <div className="capacity-section">
            <div className="capacity-header">
              <h4>🚛 Vehicle Capacity Utilization</h4>
              <div className="capacity-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#ffa500' }}></div>
                  <span>Assigned</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#666' }}></div>
                  <span>Max</span>
                </div>
              </div>
            </div>
            <div className="capacity-bars">
              <div className="capacity-column">
                <div className="capacity-assigned"></div>
                <div className="capacity-max"></div>
              </div>
              <div className="capacity-column">
                <div className="capacity-assigned"></div>
                <div className="capacity-max"></div>
              </div>
              <div className="capacity-column">
                <div className="capacity-assigned"></div>
                <div className="capacity-max"></div>
              </div>
              <div className="capacity-column">
                <div className="capacity-assigned"></div>
                <div className="capacity-max"></div>
              </div>
            </div>
          </div>
          <div className="recommendations-section">
            <h4>💡 Recommended Reassignments</h4>
            <div className="recommendation" style={{ padding: windowSize.width <= 1700 ? '5px 0' : windowSize.width <= 1815 ? '10px 0' : '15px 0' }}>
              <div className="rec-vehicle">1C4BJWCG8DL501255</div>
              <div className="rec-text">Showing Low SoC, charge needed. Replace by 1FVHG3DX3DHFE3747</div>
              <div className="rec-actions" style={{ marginBottom: windowSize.width <= 1700 ? '0px' : windowSize.width <= 1815 ? '15px' : '30px' }}>
                <button className="btn-dismiss">Dismiss</button>
                <button className="btn-reject">🔄 Reject</button>
                <button className="btn-approve">👍 Approve</button>
              </div>
            </div>
            <div className="recommendation" style={{ padding: windowSize.width <= 1700 ? '5px 0' : windowSize.width <= 1815 ? '10px 0' : '15px 0' }}>
              <div className="rec-vehicle">1GCEC14W6TZ225573</div>
              <div className="rec-text">Schedule for maintenance (Brake check)</div>
              <div className="rec-actions" style={{ marginBottom: windowSize.width <= 1700 ? '0px' : windowSize.width <= 1815 ? '15px' : '30px' }}>
                <button className="btn-dismiss">Dismiss</button>
                <button className="btn-reject">🔄 Reject</button>
                <button className="btn-approve">👍 Approve</button>
              </div>
            </div>
          </div>
        </div>

        <div className="right-panel" style={{ marginTop: windowSize.width <= 1700 ? '-20px' : windowSize.width <= 1815 ? '-10px' : windowSize.width >= 1900 ? '-30px' : '0', height: windowSize.width <= 1700 ? 'calc(100vh - 140px)' : windowSize.width <= 1815 ? 'calc(100vh - 160px)' : 'auto' }}>
          <div className="panel-title">Maintenance</div>
          <div className="maintenance-top-sections">
            <div className="maintenance-section">
              <div className="section-header">
                <span>🔧 In Maintenance</span>
                <span className="count-badge">2</span>
              </div>
              <div className="maintenance-list">
                <div>1C4BJWCG8DL501255</div>
                <div>1FVHG3DX3DHFE3747</div>
              </div>
            </div>
            <div className="maintenance-types">
              <div className="section-header">
                <span>🔧 Maintenance Type</span>
              </div>
              <div className="type-list">
                <div className="type-row">
                  <span>Brake</span>
                  <span>1</span>
                </div>
                <div className="type-row">
                  <span>Oil</span>
                  <span>3</span>
                </div>
                <div className="type-row">
                  <span>Sensor</span>
                  <span>4</span>
                </div>
                <div className="type-row">
                  <span>General</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </div>
          <div className="recommended-maintenance">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
              <h4 style={{ margin: 0 }}>📋 Recommended Maintenance <span style={{ fontSize: '12px', color: '#37bc12', marginLeft: '8px' }}>🤖 AI-Powered</span></h4>
              <button
                onClick={fetchRecommendations}
                disabled={loadingRecommendations}
                style={{
                  padding: '5px 10px',
                  background: loadingRecommendations ? '#666' : '#37bc12',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '11px',
                  cursor: loadingRecommendations ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loadingRecommendations ? '⏳ Generating...' : '🤖 Generate'}
              </button>
            </div>

            {loadingRecommendations ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <div style={{ fontSize: '14px' }}>🔄 Loading AI recommendations...</div>
              </div>
            ) : aiRecommendations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <div style={{ fontSize: '14px' }}>Click "Generate" to analyze fleet vehicles</div>
              </div>
            ) : (
              aiRecommendations.map((rec, index) => (
                <div
                  key={index}
                  className="maintenance-item"
                  style={{
                    borderLeft: rec.priority === 'critical' ? '3px solid #ff4444' :
                      rec.priority === 'warning' ? '3px solid #ffa500' :
                        '3px solid #37bc12'
                  }}
                >
                  <div className="maint-vehicle">
                    {rec.vehicleName}
                    {rec.priority === 'critical' && <span style={{ color: '#ff4444', marginLeft: '8px', fontSize: '12px' }}>⚠️ URGENT</span>}
                  </div>
                  <div className="maint-desc">{rec.description}</div>
                  <div className="maint-actions">
                    <button className="btn-dismiss" onClick={() => handleDismiss(index)}>Dismiss</button>
                    <button className="btn-reject" onClick={() => handleReject(rec)}>🔄 Reject</button>
                    <button className="btn-approve" onClick={() => handleApprove(rec)}>👍 Approve</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1b1e20',
            border: '1px solid #37bc12',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '700px',
            width: '90%'
          }}>
            <h3 style={{ color: '#37bc12', marginBottom: '20px' }}>Approve Maintenance</h3>
            
            {selectedRecommendation && (
              <>
                <div style={{ marginBottom: '20px', color: '#ccc' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Vehicle:</strong> {selectedRecommendation.vehicleName}
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Priority:</strong> <span style={{ 
                      color: selectedRecommendation.priority === 'critical' ? '#ff4444' : 
                             selectedRecommendation.priority === 'warning' ? '#ffa500' : '#37bc12'
                    }}>{selectedRecommendation.priority.toUpperCase()}</span>
                  </div>
                  <div style={{ 
                    marginTop: '15px',
                    padding: '15px',
                    background: '#2a2d2f',
                    borderRadius: '4px',
                    borderLeft: '3px solid #37bc12',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '10px', color: '#37bc12' }}>AI Recommendation:</strong>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {selectedRecommendation.fullRecommendation
                        .replace(/#{1,6}\s*/g, '')  // Remove markdown headers
                        .replace(/\*\*/g, '')        // Remove bold markdown
                        .replace(/\*/g, '')          // Remove italic markdown
                        .replace(/^[-•]\s*/gm, '• ') // Normalize bullet points
                        .trim()
                      }
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Add scheduling details or special instructions:
                  </label>
                  <textarea
                    value={approvalInstructions}
                    onChange={(e) => setApprovalInstructions(e.target.value)}
                    placeholder="e.g., Schedule for Monday 9am, use OEM parts, notify driver beforehand..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '10px',
                      background: '#2a2d2f',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    disabled={submittingApproval}
                    style={{
                      padding: '10px 20px',
                      background: '#444',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: submittingApproval ? 'not-allowed' : 'pointer',
                      opacity: submittingApproval ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitApproval}
                    disabled={submittingApproval}
                    style={{
                      padding: '10px 20px',
                      background: '#37bc12',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: submittingApproval ? 'not-allowed' : 'pointer',
                      opacity: submittingApproval ? 0.5 : 1
                    }}
                  >
                    {submittingApproval ? 'Submitting...' : 'Submit Approval'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetPortal;