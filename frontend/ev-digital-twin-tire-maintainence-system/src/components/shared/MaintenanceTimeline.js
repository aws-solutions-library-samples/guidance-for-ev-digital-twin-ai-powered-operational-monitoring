import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import agentCoreService from '../../services/agentcore';
import './MaintenanceTimeline.css';

const CATEGORY_CONFIG = {
  tire: { icon: '🛞', color: '#e74c3c', label: 'Tire' },
  motor: { icon: '⚙️', color: '#f39c12', label: 'Motor' },
  inverter: { icon: '⚡', color: '#9b59b6', label: 'Inverter' },
  appointment: { icon: '📅', color: '#3498db', label: 'Appointment' },
  general: { icon: '📋', color: '#95a5a6', label: 'General' },
};

const VEHICLES = [
  { id: '1', name: 'Vehicle 1', vin: '2T1BURHE8JC987654', issue: 'Tire' },
  { id: '3', name: 'Vehicle 3', vin: '3VWDX7AJ9DM456321', issue: 'Inverter' },
  { id: '5', name: 'Vehicle 2', vin: '5YJSA1E26HF123456', issue: 'Motor' },
];

const MaintenanceTimeline = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState('1');
  const [activeCategory, setActiveCategory] = useState('all');
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set());

  useEffect(() => {
    fetchHistory();
  }, [selectedVehicle, activeCategory]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const data = await agentCoreService.getVehicleHistory(selectedVehicle, activeCategory, 20);
      setHistory(data.history || []);
    } catch (err) {
      setError(err.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    setReportLoading(true);
    try {
      const data = await agentCoreService.getVehicleReport(selectedVehicle);
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const currentVehicle = VEHICLES.find(v => v.id === selectedVehicle);

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <div className="timeline-header-left">
          <button className="timeline-back-btn" onClick={() => navigate('/fleet/portal')}>←</button>
          <h2 className="timeline-title">🕐 Maintenance Timeline</h2>
          <span className="timeline-badge">Powered by AgentCore Gateway</span>
        </div>
      </div>

      <div className="timeline-controls">
        <div className="vehicle-selector">
          {VEHICLES.map(v => (
            <button
              key={v.id}
              className={`vehicle-tab ${selectedVehicle === v.id ? 'active' : ''}`}
              onClick={() => setSelectedVehicle(v.id)}
            >
              {v.name} <span className="vehicle-tab-sub">{v.issue}</span>
            </button>
          ))}
        </div>
        <div className="category-filters">
          {['all', 'tire', 'motor', 'inverter', 'appointment'].map(cat => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
              style={activeCategory === cat && cat !== 'all' ? { borderColor: CATEGORY_CONFIG[cat]?.color } : {}}
            >
              {cat === 'all' ? '📊 All' : `${CATEGORY_CONFIG[cat].icon} ${CATEGORY_CONFIG[cat].label}`}
            </button>
          ))}
          <button
            className="report-btn"
            onClick={fetchReport}
            disabled={reportLoading}
          >
            {reportLoading ? '⏳ Generating...' : '📄 Generate Report'}
          </button>
        </div>
      </div>

      <div className="timeline-body">
        <div className="timeline-main">
          {currentVehicle && (
            <div className="vehicle-info-bar">
              <span className="vehicle-info-name">{currentVehicle.name}</span>
              <span className="vehicle-info-vin">{currentVehicle.vin}</span>
              <span className="vehicle-info-count">{history.length} records</span>
            </div>
          )}

          {loading && (
            <div className="timeline-loading">
              <div className="timeline-spinner"></div>
              <span>Loading history from AgentCore Memory...</span>
            </div>
          )}

          {error && <div className="timeline-error">❌ {error}</div>}

          {!loading && !error && history.length === 0 && (
            <div className="timeline-empty">No maintenance records found for this vehicle.</div>
          )}

          {!loading && history.length > 0 && (
            <div className="timeline-list">
              {history.map((item, idx) => {
                const cat = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.general;
                const isExpanded = expandedItems.has(item.id);
                const isLong = item.text && item.text.length > 150;
                return (
                  <div key={item.id || idx} className="timeline-item">
                    <div className="timeline-dot-col">
                      <div className="timeline-dot" style={{ background: cat.color }}></div>
                    </div>
                    <div className="timeline-content" style={{ borderLeftColor: cat.color }} onClick={() => isLong && toggleExpand(item.id)}>
                      <div className="timeline-content-header">
                        <span className="timeline-cat-badge" style={{ background: cat.color + '22', color: cat.color, borderColor: cat.color }}>
                          {cat.icon} {cat.label}
                        </span>
                        <span className="timeline-date">{formatDate(item.created_at)}</span>
                      </div>
                      <p className={`timeline-text ${isExpanded ? 'expanded' : ''}`}>
                        {isExpanded || !isLong ? item.text : item.text.substring(0, 150) + '...'}
                      </p>
                      <div className="timeline-meta">
                        <span className="timeline-score">Relevance: {(item.relevance_score * 100).toFixed(0)}%</span>
                        {isLong && (
                          <span className="timeline-expand">{isExpanded ? '▲ Less' : '▼ More'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {report && (
          <div className="timeline-report">
            <div className="report-header">
              <h3>📊 Maintenance Report</h3>
              <button className="report-close" onClick={() => setReport(null)}>✕</button>
            </div>
            <div className="report-summary">
              <div className="report-stat">
                <span className="report-stat-num">{report.total_records}</span>
                <span className="report-stat-label">Total Records</span>
              </div>
              {report.sections && Object.entries(report.sections).map(([key, section]) => (
                <div key={key} className="report-stat">
                  <span className="report-stat-num" style={{ color: CATEGORY_CONFIG[key]?.color }}>
                    {section.count}
                  </span>
                  <span className="report-stat-label">{CATEGORY_CONFIG[key]?.icon} {CATEGORY_CONFIG[key]?.label}</span>
                </div>
              ))}
            </div>
            {report.recommendations && (
              <div className="report-recs">
                <h4>Recommendations</h4>
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className={`report-rec-item priority-${rec.priority.toLowerCase()}`}>
                    <span className="rec-priority">{rec.priority}</span>
                    <span className="rec-system">{CATEGORY_CONFIG[rec.system]?.icon}</span>
                    <span className="rec-action">{rec.action}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="report-footer">
              Generated {formatDate(report.generated_at)} via AgentCore Gateway
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceTimeline;
