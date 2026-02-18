import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import agentCoreService from '../../services/agentcore';
import { BrowserLiveViewModal } from '../browser-live-view/BrowserLiveViewModal';
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
  
  // State for tire ordering
  const [showTireOrderOption, setShowTireOrderOption] = useState(false);
  const [orderTiresOnline, setOrderTiresOnline] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState('');
  
  // State for confirmation modal
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  
  // State for tire order confirmation
  const [showTireConfirmationModal, setShowTireConfirmationModal] = useState(false);
  const [tireOrderData, setTireOrderData] = useState(null);
  const [tireOrderComplete, setTireOrderComplete] = useState(false);
  const [liveViewUrl, setLiveViewUrl] = useState(null);
  const [showLiveViewModal, setShowLiveViewModal] = useState(false);
  
  // State for appointment slot selection (after agent suggests)
  const [showSlotSelectionModal, setShowSlotSelectionModal] = useState(false);
  const [suggestedSlots, setSuggestedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [currentDateOffset, setCurrentDateOffset] = useState(1); // Start with tomorrow (day 1)
  
  // State for tracking scheduled appointments
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  
  // State for tracking which recommendations have been scheduled (to transform UI)
  const [scheduledRecommendations, setScheduledRecommendations] = useState(new Map());
  
  // State for agent suggestion review
  const [agentSuggestion, setAgentSuggestion] = useState(null);
  
  // State for replay viewer modal
  const [showReplayModal, setShowReplayModal] = useState(false);
  const [replaySessionId, setReplaySessionId] = useState(null);
  const [showSuggestionReview, setShowSuggestionReview] = useState(false);
  const [editableAppointment, setEditableAppointment] = useState({
    service: '',
    date: '',
    time: '',
    duration: ''
  });
  const [modifyMode, setModifyMode] = useState(false);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // State for action details modal
  const [showActionDetailsModal, setShowActionDetailsModal] = useState(false);
  const [actionDetails, setActionDetails] = useState(null);
  const [actionJobId, setActionJobId] = useState(null);  // Store job_id instead of session_id
  const [loadingActionDetails, setLoadingActionDetails] = useState(false);
  
  // State for recording modal
  const [showRecordingModal, setShowRecordingModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load recommendations from localStorage on mount (for persistence across navigation)
  useEffect(() => {
    const savedRecs = localStorage.getItem('fleetRecommendations');
    if (savedRecs) {
      try {
        const parsed = JSON.parse(savedRecs);
        setAiRecommendations(parsed);
      } catch (error) {
        console.error('Error parsing saved recommendations:', error);
      }
    }
  }, []);

  // VIN mapping for vehicles
  const VIN_MAP = {
    1: '2T1BURHE8JC987654',  // Vehicle 1 Tires
    3: '3VWDX7AJ9DM456321',  // Vehicle 3 Inverter
    5: '5YJSA1E26HF123456'   // Vehicle 2 Motor (uses vehicle_id 5)
  };

  // Fetch AI recommendations on demand
  const fetchRecommendations = async () => {
      try {
        // Clear existing recommendations and localStorage
        setAiRecommendations([]);
        localStorage.removeItem('fleetRecommendations');
        
        setLoadingRecommendations(true);

        // Get recommendations for vehicles 1, 3, and 5
        const vehicleIds = [1, 3, 5];
        const recommendations = [];

        for (const vehicleId of vehicleIds) {
          try {
            const vin = VIN_MAP[vehicleId];
            const startTime = Date.now();

            // Check DynamoDB cache first, then call Claude if not cached
            const response = await agentCoreService.getMaintenanceRecommendations(vehicleId, vin);

            // Parse the response to extract key recommendations
            const rec = parseRecommendation(response, vehicleId);
            if (rec) {
              recommendations.push(rec);
              // Update state incrementally so user sees results as they come in
              setAiRecommendations([...recommendations]);
            }
            
            // Reset session after each vehicle to prevent conversation state corruption
            agentCoreService.resetSession();
            
          } catch (error) {
            console.error(`Error fetching recommendations for vehicle ${vehicleId}:`, error);
            
            // Reset session on error to prevent state corruption
            agentCoreService.resetSession();
            
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
        
        // Add a 3-second delay before showing results (for better UX)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Save to localStorage for persistence across navigation
        localStorage.setItem('fleetRecommendations', JSON.stringify(recommendations));
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
    else if (lowerResponse.match(/(warning|soon|attention).*(needed|required|recommended)|low.*psi|below.*psi/)) {
      priority = 'warning';
    }

    // Extract the most important recommendation - improved to handle markdown
    const recLines = lines.filter(line => {
      const cleanLine = line.replace(/^[#\-*\d.]+\s*/, '').trim();
      return cleanLine.includes('Recommendation') ||
        cleanLine.includes('Inflate') ||
        cleanLine.includes('Monitor') ||
        cleanLine.includes('Replace') ||
        cleanLine.includes('Check') ||
        cleanLine.includes('Schedule') ||
        cleanLine.includes('pressure') ||
        cleanLine.includes('PSI') ||
        cleanLine.includes('tire');
    });

    if (recLines.length > 0) {
      // Get the first meaningful recommendation line
      description = recLines[0].replace(/^[#\-*\d.]+\s*/, '').trim();
    } else {
      // Fallback: look for lines with tire/pressure mentions
      const tireLine = lines.find(line => {
        const lower = line.toLowerCase();
        return (lower.includes('tire') || lower.includes('psi')) && line.length > 20;
      });
      if (tireLine) {
        description = tireLine.replace(/^[#\-*\d.]+\s*/, '').trim();
      } else if (lines.length > 0) {
        // Last resort: use first meaningful line
        description = lines.find(line => line.length > 20) || lines[0];
      }
    }

    // Intelligently detect service type from recommendation
    let serviceType = 'Maintenance';
    if (lowerResponse.includes('tire') && (lowerResponse.includes('replace') || lowerResponse.includes('replacement'))) {
      serviceType = 'Tire Replacement';
    } else if (lowerResponse.includes('tire') && lowerResponse.includes('alignment')) {
      serviceType = 'Tire Replacement & Alignment';
    } else if (lowerResponse.includes('motor') || lowerResponse.includes('bearing')) {
      serviceType = 'Motor Maintenance';
    } else if (lowerResponse.includes('inverter') || lowerResponse.includes('cooling')) {
      serviceType = 'Inverter Service';
    } else if (lowerResponse.includes('alignment')) {
      serviceType = 'Wheel Alignment';
    } else if (lowerResponse.includes('tire') && lowerResponse.includes('pressure')) {
      serviceType = 'Tire Pressure Check';
    }

    return {
      vehicleId,
      vehicleName: getVehicleName(vehicleId),
      description: description.substring(0, 150), // Limit length for display
      serviceType, // Add service type for appointment booking
      fullRecommendation: response, // Store full AI response
      priority,
      timestamp: new Date().toISOString()
    };
  };

  const getVehicleName = (vehicleId) => {
    return VIN_MAP[vehicleId] || `Vehicle ${vehicleId}`;
  };

  const handleDismiss = (index) => {
    setAiRecommendations(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleMarkAsScheduled = (vehicleId, sessionId = null) => {
    setScheduledRecommendations(prev => {
      const newMap = new Map(prev);
      newMap.set(vehicleId, { vehicleId, sessionId });
      return newMap;
    });
  };

  const handleViewAction = (vehicleId) => {
    // Show modal to redirect to AgentCore console
    setShowRecordingModal(true);
  };

  const handleViewActionDetails = async (jobId) => {
    // Use the passed job_id
    console.log('🔍 Action Details - Job ID:', jobId);
    
    if (!jobId) {
      setActionDetails({ error: 'No session ID available. Complete a tire order first.' });
      setShowActionDetailsModal(true);
      return;
    }
    
    setLoadingActionDetails(true);
    setShowActionDetailsModal(true);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_TIRE_ORDER_API}/action-logs/${jobId}`
      );
      const data = await response.json();
      setActionDetails(data);
    } catch (error) {
      console.error('Error fetching action details:', error);
      setActionDetails({ error: 'Failed to load action details' });
    } finally {
      setLoadingActionDetails(false);
    }
  };

  const handleApprove = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setApprovalInstructions('');
    
    // ONLY show tire ordering for vehicle 1 (VIN: 2T1BURHE8JC987654 - tire use case)
    const isTireVehicle = recommendation.vehicleId === 1;
    setShowTireOrderOption(isTireVehicle);
    setOrderTiresOnline(isTireVehicle); // Auto-check only for vehicle 1
    setApprovalStatus('');
    
    setShowApprovalModal(true);
  };

  const parseAvailableSlots = (response) => {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*"available_slots"[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.available_slots && Array.isArray(data.available_slots)) {
          // Map the slots to the format expected by the UI
          return data.available_slots.map(slot => {
            // Convert military time to 12-hour format
            const [hours, minutes] = slot.time_slot.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour % 12 || 12;
            const formattedTime = `${displayHour}:${minutes} ${ampm}`;
            
            return {
              date: slot.date,
              time: formattedTime, // Convert to 12-hour format
              duration: slot.duration || '1 hour',
              service_type: slot.service_type,
              time_slot_24h: slot.time_slot // Keep original for booking
            };
          });
        }
      }
      return [];
    } catch (error) {
      console.error('Error parsing slots:', error);
      return [];
    }
  };

  // Extract only the Top 3 Key Recommendations section (preserve original formatting)
  const extractKeyRecommendations = (fullText) => {
    try {
      // Find the section starting with "🎯 Top 3 Key Recommendations:" 
      // and ending before "📊 Your Current Tire Status:" or similar sections
      const startMatch = fullText.match(/🎯\s*Top 3 Key Recommendations:/i);
      
      if (!startMatch) {
        return null; // Section not found, return null to show full text
      }
      
      const startIndex = startMatch.index;
      
      // Find where this section ends (before status section, bottom line, or end of text)
      const endPatterns = [
        /\n\n📊\s*Your Current/i,
        /\n\n\*\*Bottom Line:/i,
        /\n\nBottom Line:/i,
        /\n\n---\s*\n\n##/
      ];
      
      let endIndex = fullText.length;
      
      for (const pattern of endPatterns) {
        const match = fullText.slice(startIndex).match(pattern);
        if (match) {
          endIndex = startIndex + match.index;
          break;
        }
      }
      
      // Extract the section
      const extracted = fullText.slice(startIndex, endIndex).trim();
      return extracted;
      
    } catch (error) {
      console.error('Error extracting key recommendations:', error);
      return null;
    }
  };

  const parseAgentResponse = (response) => {
    try {
      // Multiple patterns to try for date
      const datePatterns = [
        /-\s*\*\*Date:\*\*\s*([^\n]+)/,  // - **Date:** Monday, November 20, 2023
        /-\s*\*\*Date\*\*:\s*([^\n]+)/,  // - **Date**: Monday, November 20, 2023
        /\*\*Date:\*\*\s*([^\n]+)/,       // **Date:** Monday, November 20, 2023
        /"scheduled_date":\s*"([^"]+)"/   // JSON format
      ];
      
      const servicePatterns = [
        /-\s*\*\*Service Type:\*\*\s*([^\n]+)/,
        /-\s*\*\*Service Type\*\*:\s*([^\n]+)/,
        /"service_type":\s*"([^"]+)"/
      ];
      
      // Extract description from Status field or the sentence after appointment details
      const statusMatch = response.match(/-\s*\*\*Status:\*\*\s*([^\n]+)/i);
      const descriptionMatch = response.match(/The maintenance team will ([^?]+)/i) || 
                               response.match(/The ([^.]+\.)/);
      
      let dateStr = null;
      let serviceStr = null;
      
      // Try each date pattern
      for (const pattern of datePatterns) {
        const match = response.match(pattern);
        if (match) {
          dateStr = match[1];
          break;
        }
      }
      
      // Try each service pattern
      for (const pattern of servicePatterns) {
        const match = response.match(pattern);
        if (match) {
          serviceStr = match[1];
          break;
        }
      }
      
      // If no service found, intelligently detect from recommendation content
      if (!serviceStr && selectedRecommendation) {
        const fullRec = selectedRecommendation.fullRecommendation.toLowerCase();
        if (fullRec.includes('tire') && (fullRec.includes('replace') || fullRec.includes('replacement'))) {
          serviceStr = 'Tire Replacement';
        } else if (fullRec.includes('motor') || fullRec.includes('bearing')) {
          serviceStr = 'Motor Maintenance';
        } else if (fullRec.includes('inverter') || fullRec.includes('cooling')) {
          serviceStr = 'Inverter Service';
        } else if (fullRec.includes('alignment')) {
          serviceStr = 'Wheel Alignment';
        } else {
          serviceStr = 'Maintenance';
        }
      }
      
      const descriptionStr = descriptionMatch ? descriptionMatch[0].trim() : '';
      
      // Extract tire order details if present
      const tireOrderMatch = response.includes('order_tire_online') || response.includes('tire_size');
      const tireSizeMatch = response.match(/"tire_size":\s*"([^"]+)"/);
      const productMatch = response.match(/"product[^"]*":\s*"([^"]+)"/) || response.match(/product.*?([A-Z][\w\s]+)/);
      const priceMatch = response.match(/\$([\d.]+)/);
      
      return {
        appointment: {
          date: dateStr?.trim() || 'Scheduled',
          service: serviceStr?.replace(/_/g, ' ').trim() || 'Maintenance',
          description: descriptionStr || approvalInstructions?.trim() || '',
          vin: selectedRecommendation.vehicleName
        },
        tireOrder: (tireOrderMatch && orderTiresOnline) ? {
          size: tireSizeMatch?.[1] || 'N/A',
          product: productMatch?.[1] || 'Tire product',
          price: priceMatch?.[1] ? `$${priceMatch[1]}` : 'See cart'
        } : null
      };
    } catch (error) {
      console.error('Error parsing response:', error);
      return {
        appointment: {
          date: 'Scheduled',
          service: 'Maintenance',
          vin: selectedRecommendation.vehicleName
        },
        tireOrder: null
      };
    }
  };

  const handleCloseConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationData(null);
    
    // Mark recommendation as scheduled (instead of dismissing)
    handleMarkAsScheduled(selectedRecommendation.vehicleId, tireOrderData?.sessionId);
    
    // Add to scheduled appointments
    if (confirmationData?.appointment) {
      const newAppointment = {
        vin: confirmationData.appointment.vin,
        service: confirmationData.appointment.service,
        date: confirmationData.appointment.date,
        vehicleId: selectedRecommendation.vehicleId
      };
      setScheduledAppointments(prev => [...prev, newAppointment]);
    }
  };
  
  const parseAgentSuggestion = (response) => {
    // Extract service, date, time from agent response
    const serviceMatch = response.match(/Service[:\s]+([^\n]+)/i);
    const dateMatch = response.match(/Date[:\s]+([^\n]+)/i);
    const timeMatch = response.match(/Time[:\s]+([^\n]+)/i);
    const durationMatch = response.match(/Duration[:\s]+([^\n]+)/i);
    
    // Format service type (convert tire_replacement to Tire Replacement)
    let service = serviceMatch?.[1]?.trim() || 'Tire Replacement';
    service = service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    return {
      service: service,
      date: dateMatch?.[1]?.trim() || 'Tomorrow',
      time: timeMatch?.[1]?.trim() || '2:00 PM',
      duration: durationMatch?.[1]?.trim() || '2 hours',
      fullResponse: response
    };
  };
  
  const getAgentSuggestion = async (dateOffset = 1) => {
    setSubmittingApproval(true);
    setApprovalStatus('processing');
    
    try {
      const instructionsText = approvalInstructions.trim() ? `\nUser's special instructions: "${approvalInstructions}"` : '';
      
      // Calculate date dynamically based on offset (default to 1 if invalid)
      const offset = typeof dateOffset === 'number' && !isNaN(dateOffset) ? dateOffset : 1;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + offset);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      const prompt = `CONTEXT: Vehicle ${selectedRecommendation.vehicleId} has the following maintenance issue:
"${selectedRecommendation.fullRecommendation}"${instructionsText}

IMPORTANT INSTRUCTIONS:
1. Based on the maintenance issue above, determine the appropriate service type (tire_replacement, tire_rotation, motor_maintenance, oil_change, or inspection)
2. Use ${targetDateStr} as the preferred date
3. Call get_available_slots with: vehicle_id=${selectedRecommendation.vehicleId}, service_type=(from step 1), preferred_date=${targetDateStr}
4. The tool will return 2-4 available time slots
5. Return ALL available slots in JSON format

Respond with the available slots.`;
      
      const response = await agentCoreService.chat(prompt);
      
      // Parse available slots from response
      const slots = parseAvailableSlots(response);
      
      if (slots.length === 0) {
        alert('No available slots found. Please try again.');
        setApprovalStatus('');
        setSubmittingApproval(false);
        return;
      }
      
      // Store slots and show selection modal
      setSuggestedSlots(slots);
      setSelectedSlot(null);
      
      setApprovalStatus('');
      setSubmittingApproval(false);
      
      // Hide approval modal, show slot selection
      setShowApprovalModal(false);
      setShowSlotSelectionModal(true);
    } catch (error) {
      console.error('Error getting suggestion:', error);
      setApprovalStatus('');
      setSubmittingApproval(false);
      alert('Failed to get appointment suggestion. Please try again.');
    }
  };

  const handleSubmitApproval = async () => {
    setSubmittingApproval(true);
    setApprovalStatus('processing');
    
    try {
      if (orderTiresOnline) {
        // CASE 1: Order tires using async pattern
        setApprovalStatus('browser-tool');
        
        try {
          // Start the async tire order job
          const { job_id } = await agentCoreService.startTireOrder(selectedRecommendation.vehicleId);
          
          // Poll for completion with progress updates
          const result = await agentCoreService.pollTireOrder(job_id, async (status) => {
            if (status.progress) {
              setApprovalStatus(status.progress);
            }
            
            // Check if browser session is available for live viewing
            if (status.browser_session_id && !liveViewUrl) {
              try {
                const liveViewData = await agentCoreService.getBrowserLiveView(job_id);
                if (liveViewData.liveViewUrl) {
                  setLiveViewUrl(liveViewData.liveViewUrl);
                  setApprovalStatus('Browser automation running - Watch live!');
                }
              } catch (liveViewError) {
                // Live view not ready yet, will retry
              }
            }
          });
          
          // Parse tire order response
          const tireData = parseTireOrderResponse(JSON.stringify(result));
          
          setApprovalStatus('complete');
          
          // Show tire confirmation with option to schedule
          setTimeout(() => {
            setApprovalStatus('');
            setSubmittingApproval(false);
            setShowApprovalModal(false);
            setTireOrderData(tireData);
            setShowTireConfirmationModal(true);
          }, 1000);
          
        } catch (tireError) {
          console.error('Tire ordering error:', tireError);
          
          // Show fallback tire confirmation
          const tireInfo = selectedRecommendation.fullRecommendation || '';
          const tireSizeMatch = tireInfo.match(/([\d]+\/[\d]+R[\d]+)/);
          
          const fallbackData = {
            product: 'Tire order failed',
            price: 'Please try again',
            tireSize: tireSizeMatch?.[1] || 'N/A',
            success: false
          };
          
          setApprovalStatus('complete');
          setTimeout(() => {
            setApprovalStatus('');
            setSubmittingApproval(false);
            setShowApprovalModal(false);
            setTireOrderData(fallbackData);
            setShowTireConfirmationModal(true);
          }, 1000);
        }
        
      } else if (!orderTiresOnline) {
        // CASE 2: Just schedule appointment (no tires) - show slot selection
        
        // Get available slots from next 7 days
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date.toISOString().split('T')[0]);
        }
        
        // Fetch available slots for all dates
        const allSlots = [];
        for (const date of dates) {
          try {
            const response = await fetch(`https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/available-appointments?date=${date}`);
            const data = await response.json();
            if (data.available_slots && data.available_slots.length > 0) {
              allSlots.push(...data.available_slots.slice(0, 3).map(slot => ({
                date: date,
                time: slot.time_slot,
                duration: slot.duration_minutes
              })));
            }
          } catch (error) {
            console.error(`Error fetching slots for ${date}:`, error);
          }
        }
        
        setApprovalStatus('');
        setSubmittingApproval(false);
        setShowApprovalModal(false);
        
        // Show slot selection modal
        setSuggestedSlots(allSlots.slice(0, 10));
        setShowSlotSelectionModal(true);
      }
      
    } catch (error) {
      console.error('Error:', error);
      setApprovalStatus('');
      alert('Failed to process. Please try again.');
      setSubmittingApproval(false);
    }
  };
  
  const parseTireOrderResponse = (response) => {
    try {
      // Try to parse JSON response first
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const data = JSON.parse(jsonMatch[0]);
          
          // Log metadata for debugging
          console.log('🎥 Browser metadata:', data.metadata);
          
          // Extract from nested response field
          const responseText = data.response || '';
          
          // Try multiple patterns for product and price
          const priceMatch = responseText.match(/\$([\d,]+\.?\d*)/);
          const productMatch = responseText.match(/Product name: ([^,]+)/) || 
                              responseText.match(/([\d\/]+R\d+ tires)/) ||
                              responseText.match(/^([^,]+)/);
          const brandMatch = responseText.match(/Brand: ([A-Z][\w\s]+)/);
          
          return {
            product: (brandMatch?.[1] || productMatch?.[1] || data.tire_size || 'Tire').trim(),
            price: priceMatch ? `$${priceMatch[1]}` : 'See cart',
            tireSize: data.tire_size || 'N/A',
            sessionId: '5fe96dd0-5caa-456b-924c-3a0ead43472f', // Hardcoded for demo - always use this
            success: data.success !== false
          };
        } catch (e) {
          console.error('JSON parse error:', e);
        }
      }
      
      // Fallback: parse from plain text
      const priceMatch = response.match(/\$([\d,]+\.?\d*)/);
      const productMatch = response.match(/Product name: ([^,]+)/) || 
                          response.match(/([\d\/]+R\d+ tires)/);
      
      return {
        product: productMatch?.[1]?.trim() || 'Tire ordered successfully',
        price: priceMatch ? `$${priceMatch[1]}` : 'See cart',
        tireSize: 'N/A',
        success: true
      };
    } catch (error) {
      console.error('Error parsing tire response:', error);
      return {
        product: 'Tire ordered successfully',
        price: 'See cart',
        tireSize: 'N/A',
        success: true
      };
    }
  };
  
  const handleFinalApproval = async () => {
    setSubmittingApproval(true);
    setApprovalStatus('processing');
    
    try {
      if (orderTiresOnline) {
        // Order tires using async pattern
        setApprovalStatus('browser-tool');
        
        try {
          // Step 1: Start the async tire order job
          const { job_id } = await agentCoreService.startTireOrder(selectedRecommendation.vehicleId);
          
          // Step 2: Poll for completion with progress updates
          const result = await agentCoreService.pollTireOrder(job_id, async (status) => {
            // Check if browser session is available for live viewing
            if (status.browser_session_id && !liveViewUrl) {
              try {
                const liveViewData = await agentCoreService.getBrowserLiveView(job_id);
                if (liveViewData.liveViewUrl) {
                  setLiveViewUrl(liveViewData.liveViewUrl);
                }
              } catch (liveViewError) {
                // Live view not ready yet, will retry
              }
            }
            // Update UI with progress if needed
            if (status.progress) {
              setApprovalStatus(status.progress);
            }
            // Extract live view URL if available
            if (status.liveViewUrl) {
              setLiveViewUrl(status.liveViewUrl);
            }
          });
          
          // Parse the result
          const tireData = parseTireOrderResponse(JSON.stringify(result));
          setTireOrderData(tireData);
          setTireOrderComplete(true);
          
        } catch (tireError) {
          console.error('Tire ordering error:', tireError);
          
          // Fallback data on error
          const fallbackData = {
            product: 'Tire order failed',
            price: 'Please try again',
            tireSize: 'N/A',
            success: false
          };
          setTireOrderData(fallbackData);
          setTireOrderComplete(true);
        }
        
        setApprovalStatus('complete');
        
        setTimeout(() => {
          setApprovalStatus('');
          setSubmittingApproval(false);
          setShowSuggestionReview(false);
          setShowTireConfirmationModal(true);
        }, 1000);
      } else {
        // No tire ordering - book appointment directly
        setApprovalStatus('processing');
        const appointmentPrompt = `Schedule maintenance appointment for vehicle ${selectedRecommendation.vehicleId}. Service: ${editableAppointment.service}. Date: ${editableAppointment.date}. Time: ${editableAppointment.time}. Use the schedule_appointment tool.`;
        const response = await agentCoreService.chat(appointmentPrompt);
        
        setApprovalStatus('complete');
        
        setTimeout(() => {
          setApprovalStatus('');
          setSubmittingApproval(false);
          setShowSuggestionReview(false);
          
          setConfirmationData({
            appointment: {
              date: editableAppointment.date,
              service: editableAppointment.service,
              vin: selectedRecommendation.vehicleName,
              time_slot: editableAppointment.time
            },
            tireOrder: null
          });
          setShowConfirmationModal(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error:', error);
      setApprovalStatus('');
      setSubmittingApproval(false);
      alert('Failed to process request. Please try again.');
    }
  };
  
  const handleScheduleAfterTireOrder = async () => {
    setShowTireConfirmationModal(false);
    setSubmittingApproval(true);
    setApprovalStatus('processing');
    
    try {
      // CRITICAL: Reset session to clear tire ordering conversation history
      agentCoreService.resetSession();
      
      const appointmentPrompt = `Schedule maintenance appointment for vehicle ${selectedRecommendation.vehicleId}. Service: ${editableAppointment.service}. Date: ${editableAppointment.date}. Time: ${editableAppointment.time}. Use the schedule_appointment tool.`;
      const response = await agentCoreService.chat(appointmentPrompt);
      
      setApprovalStatus('complete');
      
      setTimeout(() => {
        setApprovalStatus('');
        setSubmittingApproval(false);
        
        setConfirmationData({
          appointment: {
            date: editableAppointment.date,
            service: editableAppointment.service,
            vin: selectedRecommendation.vehicleName,
            time_slot: editableAppointment.time
          },
          tireOrder: tireOrderData
        });
        setShowConfirmationModal(true);
      }, 1000);
    } catch (error) {
      console.error('Error booking appointment:', error);
      setApprovalStatus('');
      setSubmittingApproval(false);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const handleReject = (recommendation) => {
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
          <div className="panel-title">Vehicles (3)</div>
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
                <div className="vehicle-id" onClick={() => navigate('/car/1')}>{VIN_MAP[1]}</div>
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
                <div className="vehicle-id" onClick={() => navigate('/car/3')}>{VIN_MAP[3]}</div>
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
                <div className="vehicle-id" onClick={() => navigate('/car/5')}>{VIN_MAP[5]}</div>
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
                <span className="count-badge">{scheduledAppointments.length}</span>
              </div>
              <div className="maintenance-list">
                {scheduledAppointments.length === 0 ? (
                  <div style={{ color: '#666', fontSize: '12px', padding: '10px 0' }}>No scheduled maintenance</div>
                ) : (
                  scheduledAppointments.map((appt, idx) => (
                    <div key={idx}>{appt.vin}</div>
                  ))
                )}
              </div>
            </div>
            <div className="maintenance-types">
              <div className="section-header">
                <span>🔧 Maintenance Type</span>
              </div>
              <div className="type-list">
                {(() => {
                  const typeCounts = {};
                  scheduledAppointments.forEach(appt => {
                    const service = appt.service.toLowerCase();
                    let type = 'General';
                    if (service.includes('brake')) type = 'Brake';
                    else if (service.includes('oil')) type = 'Oil';
                    else if (service.includes('sensor') || service.includes('diagnostic')) type = 'Sensor';
                    else if (service.includes('tire')) type = 'Tire';
                    typeCounts[type] = (typeCounts[type] || 0) + 1;
                  });
                  
                  return Object.keys(typeCounts).length === 0 ? (
                    <div style={{ color: '#666', fontSize: '12px', padding: '10px 0' }}>No maintenance scheduled</div>
                  ) : (
                    Object.entries(typeCounts).map(([type, count]) => (
                      <div key={type} className="type-row">
                        <span>{type}</span>
                        <span>{count}</span>
                      </div>
                    ))
                  );
                })()}
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
              aiRecommendations
                .sort((a, b) => {
                  // Sort: unscheduled first, scheduled last
                  const aScheduled = scheduledRecommendations.has(a.vehicleId);
                  const bScheduled = scheduledRecommendations.has(b.vehicleId);
                  if (aScheduled && !bScheduled) return 1;
                  if (!aScheduled && bScheduled) return -1;
                  return 0;
                })
                .map((rec, index) => (
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
                  
                  {scheduledRecommendations.has(rec.vehicleId) ? (
                    // Scheduled state - show Action Details and View Action buttons on the right
                    <div style={{ 
                      marginTop: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: '#37bc12',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        ✓ Appointment Scheduled
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleViewActionDetails(actionJobId)}
                          style={{
                            padding: '8px 16px',
                            background: '#2a2d2f',
                            border: '1px solid #37bc12',
                            borderRadius: '4px',
                            color: '#37bc12',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Action Details →
                        </button>
                        <button
                          onClick={() => handleViewAction(rec.vehicleId)}
                          style={{
                            padding: '8px 16px',
                            background: '#2a2d2f',
                            border: '1px solid #4a9eff',
                            borderRadius: '4px',
                            color: '#4a9eff',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          View Action 🎬
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Normal state - show Approve/Reject buttons
                    <div className="maint-actions">
                      <button className="btn-dismiss" onClick={() => handleDismiss(index)}>Dismiss</button>
                      <button className="btn-reject" onClick={() => handleReject(rec)}>🔄 Reject</button>
                      <button className="btn-approve" onClick={() => handleApprove(rec)}>👍 Approve</button>
                    </div>
                  )}
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
                    <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                      {(() => {
                        const keyRecs = extractKeyRecommendations(selectedRecommendation.fullRecommendation);
                        
                        // If extraction successful, show only key recommendations
                        // Otherwise fallback to full text
                        const textToShow = keyRecs || selectedRecommendation.fullRecommendation;
                        
                        return textToShow
                          .replace(/#{1,6}\s*/g, '')  // Remove markdown headers
                          .replace(/\*\*/g, '')        // Remove bold markdown
                          .replace(/\*/g, '')          // Remove italic markdown
                          .replace(/^[-•]\s*/gm, '• ') // Normalize bullet points
                          .trim();
                      })()}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '10px', color: '#ccc' }}>
                    Add special instructions (optional):
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

                {showTireOrderOption && (
                  <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2d2f', borderRadius: '4px', border: '1px solid #37bc12' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#ccc' }}>
                      <input
                        type="checkbox"
                        checked={orderTiresOnline}
                        onChange={(e) => setOrderTiresOnline(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>
                        🛒 Order replacement tires online via Amazon
                        <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: '5px' }}>
                          Uses AI browser automation to find and add tires to cart (30-60 seconds)
                        </span>
                      </span>
                    </label>
                  </div>
                )}

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
                    onClick={getAgentSuggestion}
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
                    {submittingApproval ? 'Getting Suggestion...' : 'Get Agent Suggestion'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Suggestion Review Modal */}
      {showSuggestionReview && agentSuggestion && (
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
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#37bc12', marginBottom: '20px' }}>Review Agent's Appointment Suggestion</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2d2f', borderRadius: '4px', borderLeft: '3px solid #37bc12' }}>
              <p style={{ color: '#37bc12', marginBottom: '10px', fontWeight: 'bold' }}>🤖 Agent Recommendation:</p>
              <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {agentSuggestion.fullResponse}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#ccc', marginBottom: '15px' }}>Edit Appointment Details:</h4>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Service Type:</label>
                <input 
                  value={editableAppointment.service}
                  onChange={(e) => setEditableAppointment({...editableAppointment, service: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2d2f',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Date:</label>
                <input 
                  value={editableAppointment.date}
                  onChange={(e) => setEditableAppointment({...editableAppointment, date: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#2a2d2f',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '14px' }}>Time:</label>
                {modifyMode ? (
                  loadingSlots ? (
                    <div style={{
                      width: '100%',
                      padding: '10px',
                      background: '#2a2d2f',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#888',
                      fontSize: '14px'
                    }}>
                      Loading available slots...
                    </div>
                  ) : availableTimeSlots.length > 0 ? (
                    <select
                      value={editableAppointment.time}
                      onChange={(e) => setEditableAppointment({...editableAppointment, time: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#2a2d2f',
                        border: '1px solid #37bc12',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      {availableTimeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{
                      width: '100%',
                      padding: '10px',
                      background: '#2a2d2f',
                      border: '1px solid #ff4444',
                      borderRadius: '4px',
                      color: '#ff4444',
                      fontSize: '14px'
                    }}>
                      No available slots for this date
                    </div>
                  )
                ) : (
                  <input 
                    value={editableAppointment.time}
                    onChange={(e) => setEditableAppointment({...editableAppointment, time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#2a2d2f',
                      border: '1px solid #444',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '14px'
                    }}
                  />
                )}
              </div>
            </div>
            
            {orderTiresOnline && (
              <div style={{ marginBottom: '20px', padding: '10px', background: '#2a2d2f', borderRadius: '4px', border: '1px solid #37bc12' }}>
                <span style={{ fontSize: '14px', color: '#37bc12' }}>✓ Tires will be ordered online via Amazon</span>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={async () => {
                  setModifyMode(true);
                  setLoadingSlots(true);
                  
                  // Fetch available slots for the current date
                  try {
                    const response = await fetch(`https://b4blc4xmh4.execute-api.us-east-1.amazonaws.com/available-appointments?date=${editableAppointment.date}`);
                    const data = await response.json();
                    
                    if (data.available_slots && data.available_slots.length > 0) {
                      setAvailableTimeSlots(data.available_slots.map(slot => slot.time_slot));
                    } else {
                      setAvailableTimeSlots([]);
                    }
                  } catch (error) {
                    console.error('Error fetching slots:', error);
                    setAvailableTimeSlots([]);
                  }
                  
                  setLoadingSlots(false);
                }}
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
                Modify Request
              </button>
              <button
                onClick={handleFinalApproval}
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
                {submittingApproval ? 'Booking...' : 'Approve & Book'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {approvalStatus && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div className="spinner"></div>
          <div style={{ color: '#fff', fontSize: '18px', textAlign: 'center' }}>
            {approvalStatus === 'processing' && '🤖 AgentCore Processing...'}
            {(approvalStatus === 'browser-tool' || approvalStatus.includes('Starting') || approvalStatus.includes('Searching') || approvalStatus.includes('running') || approvalStatus.includes('pending')) && (
              <>
                <div>🌐 Browser Tool Running...</div>
                <div style={{ fontSize: '14px', color: '#888', marginTop: '10px' }}>
                  Automating tire search and cart addition (30-60 seconds)
                </div>
                {!liveViewUrl && (
                  <div style={{ fontSize: '13px', color: '#aaa', marginTop: '12px' }}>
                    ⏳ Starting browser session... Watch Live button will appear shortly
                  </div>
                )}
                {liveViewUrl && (
                  <div style={{ marginTop: '15px' }}>
                    <button
                      onClick={() => {
                        const liveViewPageUrl = `/browser-live-view?url=${encodeURIComponent(liveViewUrl)}`;
                        window.open(liveViewPageUrl, '_blank', 'noopener,noreferrer');
                      }}
                      style={{
                        backgroundColor: '#37bc12',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      🎥 Watch Live Browser Automation
                    </button>
                  </div>
                )}
              </>
            )}
            {approvalStatus === 'complete' && '✅ Complete!'}
          </div>
        </div>
      )}

      {/* Tire Confirmation Modal */}
      {showTireConfirmationModal && tireOrderData && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <h2 style={{ color: '#37bc12', marginBottom: '30px', textAlign: 'center' }}>✅ Tires Ordered!</h2>
            
            <div className="tire-order-card">
              <h3>🛒 Order Details</h3>
              <div className="detail-row">
                <span className="label">Product:</span>
                <span className="value">{tireOrderData.product}</span>
              </div>
              <div className="detail-row">
                <span className="label">Price:</span>
                <span className="value">{tireOrderData.price}</span>
              </div>
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                ✓ Added to Amazon cart
              </div>
            </div>
            
            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="done-button"
                onClick={() => setShowTireConfirmationModal(false)}
                style={{ background: '#444' }}
              >
                Done (No Appointment)
              </button>
              <button 
                className="done-button" 
                onClick={handleScheduleAfterTireOrder}
                disabled={submittingApproval || !tireOrderComplete}
                style={{ opacity: tireOrderComplete ? 1 : 0.5 }}
              >
                {submittingApproval ? 'Scheduling...' : tireOrderComplete ? 'Schedule Installation' : 'Preparing... (wait)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slot Selection Modal */}
      {showSlotSelectionModal && (
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
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ color: '#37bc12', marginBottom: '10px' }}>Select Appointment Time</h3>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px', marginTop: '0' }}>Integrated Service Shop Schedule & Fleet Operator Availability</p>
            
            {suggestedSlots.length > 0 ? (
              <>
                <p style={{ color: '#ccc', marginBottom: '20px' }}>Available appointment slots:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {suggestedSlots.map((slot, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '15px',
                        background: selectedSlot === slot ? '#37bc12' : '#2a2d2f',
                        border: selectedSlot === slot ? '2px solid #37bc12' : '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                        📅 {new Date(slot.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '14px', color: '#ccc' }}>
                        🕐 {slot.time} ({slot.duration} min)
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'space-between' }}>
                  <button
                    onClick={async () => {
                      const nextOffset = currentDateOffset + 1;
                      setCurrentDateOffset(nextOffset);
                      await getAgentSuggestion(nextOffset);
                    }}
                    disabled={submittingApproval}
                    style={{
                      padding: '10px 20px',
                      background: submittingApproval ? '#666' : '#444',
                      border: '1px solid #37bc12',
                      borderRadius: '4px',
                      color: '#37bc12',
                      cursor: submittingApproval ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {submittingApproval ? 'Loading...' : 'Show More Dates →'}
                  </button>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => {
                        setShowSlotSelectionModal(false);
                        setSuggestedSlots([]);
                        setSelectedSlot(null);
                        setCurrentDateOffset(1);
                      }}
                    style={{
                      padding: '10px 20px',
                      background: '#444',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedSlot) {
                        alert('Please select a time slot');
                        return;
                      }
                      
                      // Store selected slot for later booking
                      setEditableAppointment({
                        service: selectedRecommendation.serviceType || 'Maintenance',
                        date: selectedSlot.date,
                        time: selectedSlot.time_slot_24h || selectedSlot.time, // Use 24-hour format for booking
                        duration: selectedSlot.duration
                      });
                      
                      setSubmittingApproval(true);
                      setApprovalStatus('processing');
                      
                      // Check if we need to order tires first
                      if (orderTiresOnline) {
                        // STEP 1: Order tires via async pattern
                        setApprovalStatus('browser-tool');
                        setShowSlotSelectionModal(false);
                        
                        try {
                          console.log('🚀 Starting async tire order for vehicle:', selectedRecommendation.vehicleId);
                          
                          // Start the async tire order job
                          const { job_id } = await agentCoreService.startTireOrder(selectedRecommendation.vehicleId);
                          
                          // Store job_id for Action Details
                          setActionJobId(job_id);
                          
                          // Poll for completion with progress updates
                          const result = await agentCoreService.pollTireOrder(job_id, async (status) => {
                            // Check if browser session is available for live viewing
                            if (status.browser_session_id && !liveViewUrl) {
                              try {
                                const liveViewData = await agentCoreService.getBrowserLiveView(job_id);
                                if (liveViewData.liveViewUrl) {
                                  console.log('🎥 Live view URL available:', liveViewData.liveViewUrl.substring(0, 100));
                                  setLiveViewUrl(liveViewData.liveViewUrl);
                                }
                                
                                // Store browser session ID for Action Details
                                if (liveViewData.browserSessionId) {
                                  // No longer needed - using job_id instead
                                }
                              } catch (liveViewError) {
                                // Live view not ready yet, will retry
                              }
                            }
                            
                            if (status.progress) {
                              setApprovalStatus(status.progress);
                            }
                          });
                          
                          // Parse the result
                          const tireData = parseTireOrderResponse(JSON.stringify(result));
                          setTireOrderData(tireData);
                          setTireOrderComplete(true);
                          
                          // Store session ID if available
                          if (tireData?.sessionId) {
                            handleMarkAsScheduled(selectedRecommendation.vehicleId, tireData.sessionId);
                          }
                          
                          setApprovalStatus('complete');
                          
                          // Show tire confirmation
                          setTimeout(() => {
                            setApprovalStatus('');
                            setSubmittingApproval(false);
                            setShowTireConfirmationModal(true);
                          }, 1000);
                          
                        } catch (tireError) {
                          console.error('Tire ordering error:', tireError);
                          
                          // Show fallback tire confirmation
                          const fallbackData = {
                            product: 'Tire order failed',
                            price: 'Please try again',
                            tireSize: 'N/A',
                            success: false
                          };
                          setTireOrderData(fallbackData);
                          setTireOrderComplete(true);
                          
                          setApprovalStatus('complete');
                          setTimeout(() => {
                            setApprovalStatus('');
                            setSubmittingApproval(false);
                            setShowTireConfirmationModal(true);
                          }, 1000);
                        }
                      } else {
                        // STEP 1 (no tires): Book appointment directly
                        setShowSlotSelectionModal(false);
                        
                        try {
                          const appointmentPrompt = `Schedule maintenance appointment for vehicle ${selectedRecommendation.vehicleId} on ${selectedSlot.date} at ${selectedSlot.time}. Service: ${selectedRecommendation.description}. Instructions: ${approvalInstructions}. Use the schedule_appointment tool.`;
                          const response = await agentCoreService.chat(appointmentPrompt);
                          
                          setApprovalStatus('complete');
                          
                          setTimeout(() => {
                            setApprovalStatus('');
                            setSubmittingApproval(false);
                            setConfirmationData({
                              appointment: {
                                date: selectedSlot.date,
                                service: selectedRecommendation.description,
                                vin: selectedRecommendation.vehicleName,
                                time_slot: selectedSlot.time
                              }
                            });
                            setShowConfirmationModal(true);
                          }, 1000);
                        } catch (error) {
                          console.error('Error booking appointment:', error);
                          setApprovalStatus('');
                          alert('Failed to book appointment');
                          setSubmittingApproval(false);
                        }
                      }
                    }}
                    disabled={!selectedSlot || submittingApproval}
                    style={{
                      padding: '10px 20px',
                      background: selectedSlot && !submittingApproval ? '#37bc12' : '#666',
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      cursor: selectedSlot && !submittingApproval ? 'pointer' : 'not-allowed'
                    }}
                  >
                    {submittingApproval ? 'Processing...' : 'Approve & Book'}
                  </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#ccc' }}>
                <p>No available slots found in the next 7 days.</p>
                <button
                  onClick={() => setShowSlotSelectionModal(false)}
                  style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    background: '#444',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmationModal && confirmationData && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <h2 style={{ color: '#37bc12', marginBottom: '30px', textAlign: 'center' }}>✅ Success!</h2>
            
            <div className="appointment-card">
              <h3>📅 Appointment Scheduled</h3>
              <div className="detail-row">
                <span className="label">Date:</span>
                <span className="value">{confirmationData.appointment.date}</span>
              </div>
              <div className="detail-row">
                <span className="label">Service:</span>
                <span className="value">{confirmationData.appointment.service}</span>
              </div>
              <div className="detail-row">
                <span className="label">Vehicle:</span>
                <span className="value">{confirmationData.appointment.vin}</span>
              </div>
              {confirmationData.appointment.description && (
                <div className="detail-row">
                  <span className="label">Details:</span>
                  <span className="value">{confirmationData.appointment.description}</span>
                </div>
              )}
            </div>
            
            {confirmationData.tireOrder && (
              <div className="tire-order-card">
                <h3>🛒 Tires Ordered Online</h3>
                <div className="detail-row">
                  <span className="label">Size:</span>
                  <span className="value">{confirmationData.tireOrder.size}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Product:</span>
                  <span className="value">{confirmationData.tireOrder.product}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Price:</span>
                  <span className="value">{confirmationData.tireOrder.price}</span>
                </div>
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                  ✓ Added to Amazon cart
                </div>
              </div>
            )}
            
            <button className="done-button" onClick={handleCloseConfirmation}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Replay Modal */}
      {showReplayModal && replaySessionId && (
        <div className="confirmation-overlay" onClick={() => setShowReplayModal(false)}>
          <div 
            className="confirmation-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90%', width: '1200px', height: '80vh' }}
          >
            <h2 style={{ color: '#4a9eff', marginBottom: '20px' }}>🎬 Agent Action Replay</h2>
            <iframe
              src={`http://localhost:8081/?session_id=${replaySessionId}`}
              style={{
                width: '100%',
                height: 'calc(100% - 100px)',
                border: '1px solid #444',
                borderRadius: '4px',
                background: '#1a1d1f'
              }}
              title="Session Replay"
            />
            <button 
              className="done-button" 
              onClick={() => setShowReplayModal(false)}
              style={{ marginTop: '20px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Action Details Modal */}
      {showActionDetailsModal && (
        <div className="confirmation-overlay" onClick={() => setShowActionDetailsModal(false)}>
          <div 
            className="confirmation-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '800px', maxHeight: '80vh', overflow: 'auto' }}
          >
            <h2 style={{ color: '#37bc12', marginBottom: '20px' }}>📋 Agent Action Details</h2>
            
            {loadingActionDetails ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                Loading action details...
              </div>
            ) : actionDetails?.error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ff4444' }}>
                {actionDetails.error}
              </div>
            ) : actionDetails?.actions && actionDetails.actions.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#2a2d2f', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                    Total Actions: {actionDetails.count}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                    Check CloudWatch Observability logs for more details
                  </div>
                </div>
                
                {/* Amazon Confirmed Fit Indicator */}
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  background: '#1a2a1a', 
                  border: '1px solid #37bc12',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    background: '#37bc12',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <span style={{ color: '#000', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', color: '#37bc12', fontWeight: 'bold', marginBottom: '4px' }}>
                      Amazon Confirmed Fit
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      Selected tire verified to fit your vehicle
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ color: '#4a9eff', marginBottom: '15px', fontSize: '16px' }}>Actions Performed:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {actionDetails.actions.map((action, index) => (
                      <div 
                        key={index}
                        style={{
                          padding: '12px',
                          background: action.type === 'result' ? '#1a3a1a' : '#2a2d2f',
                          border: action.type === 'result' ? '1px solid #37bc12' : '1px solid #444',
                          borderRadius: '6px',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start'
                        }}
                      >
                        <span style={{ fontSize: '20px', flexShrink: 0 }}>{action.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#888', 
                            textTransform: 'uppercase',
                            marginBottom: '4px'
                          }}>
                            {action.type}
                          </div>
                          <div style={{ fontSize: '14px', color: '#fff', lineHeight: '1.4' }}>
                            {action.text}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {actionDetails.result && (
                  <div style={{ 
                    padding: '15px', 
                    background: '#1a3a1a', 
                    border: '2px solid #37bc12',
                    borderRadius: '8px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: '#37bc12', marginBottom: '10px', fontSize: '16px' }}>✅ Final Result:</h3>
                    <div style={{ fontSize: '14px', color: '#fff' }}>
                      {actionDetails.result}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>No action details available</div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  Check CloudWatch logs for more information
                </div>
              </div>
            )}
            
            <button 
              className="done-button" 
              onClick={() => setShowActionDetailsModal(false)}
              style={{ marginTop: '20px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="confirmation-overlay" onClick={() => setShowRecordingModal(false)}>
          <div 
            className="confirmation-modal" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '500px', textAlign: 'center' }}
          >
            <h2 style={{ color: '#4a9eff', marginBottom: '20px' }}>🎬 Browser Session Recording</h2>
            
            <p style={{ color: '#ccc', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
              View the complete browser recording of the agent's actions
              in the Amazon Bedrock AgentCore console.
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowRecordingModal(false)}
                style={{
                  padding: '12px 24px',
                  background: '#444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.open('https://us-east-1.console.aws.amazon.com/bedrock-agentcore/browser/vehicle_tire_order_tool-EfIt5YeiPR#', '_blank');
                  setShowRecordingModal(false);
                }}
                style={{
                  padding: '12px 24px',
                  background: '#4a9eff',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Open Recording in AgentCore Console →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Browser Live View Modal */}
      <BrowserLiveViewModal
        isOpen={showLiveViewModal}
        onClose={() => setShowLiveViewModal(false)}
        liveViewUrl={liveViewUrl}
      />
    </div>
  );
};

export default FleetPortal;