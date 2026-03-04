import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
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
  { id: '5', name: 'Vehicle 2', vin: '5YJSA1E26HF123456', issue: 'Motor' },
  { id: '3', name: 'Vehicle 3', vin: '3VWDX7AJ9DM456321', issue: 'Inverter' },
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
      const sorted = (data.history || []).sort((a, b) => {
        if (!a.created_at || !b.created_at) return 0;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setHistory(sorted);
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

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    const vehicle = VEHICLES.find(v => v.id === selectedVehicle);
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFillColor(27, 30, 32);
    doc.rect(0, 0, pageWidth, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Vehicle Maintenance Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`${vehicle?.name || ''} | ${vehicle?.vin || ''} | Generated ${formatDate(report.generated_at)}`, 14, 28);
    doc.setFontSize(9);
    doc.setTextColor(55, 188, 18);
    doc.text('Powered by AgentCore Gateway + Memory', 14, 35);
    y = 50;

    // Summary stats
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.text('Summary', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Total Records: ${report.total_records}`, 14, y);
    y += 6;
    if (report.sections) {
      Object.entries(report.sections).forEach(([key, section]) => {
        const cat = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.general;
        doc.text(`${cat.label}: ${section.count} records`, 14, y);
        y += 6;
      });
    }
    y += 6;

    // Recommendations
    if (report.recommendations && report.recommendations.length > 0) {
      doc.setFontSize(13);
      doc.text('Recommendations', 14, y);
      y += 8;
      doc.setFontSize(10);
      report.recommendations.forEach((rec) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const priorityColor = rec.priority === 'HIGH' ? [231, 76, 60] : rec.priority === 'MEDIUM' ? [243, 156, 18] : [52, 152, 219];
        doc.setTextColor(...priorityColor);
        doc.text(`[${rec.priority}]`, 14, y);
        doc.setTextColor(0, 0, 0);
        doc.text(`${rec.action}`, 36, y, { maxWidth: pageWidth - 50 });
        y += 10;
      });
      y += 4;
    }

    // History items per section
    if (report.sections) {
      Object.entries(report.sections).forEach(([key, section]) => {
        if (section.items && section.items.length > 0) {
          if (y > 240) { doc.addPage(); y = 20; }
          const cat = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.general;
          doc.setFontSize(12);
          doc.setTextColor(0, 0, 0);
          doc.text(`${cat.label} History (${section.count})`, 14, y);
          y += 7;
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          section.items.forEach((item, idx) => {
            if (y > 270) { doc.addPage(); y = 20; }
            const lines = doc.splitTextToSize(`${idx + 1}. ${item}`, pageWidth - 28);
            doc.text(lines, 14, y);
            y += lines.length * 4.5 + 3;
          });
          y += 4;
        }
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`EV Digital Twin - Maintenance Report | Page ${i} of ${pageCount}`, 14, 290);
    }

    doc.save(`vehicle-${selectedVehicle}-maintenance-report.pdf`);
  };

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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="report-download" onClick={downloadPDF} title="Download PDF">📥 PDF</button>
                <button className="report-close" onClick={() => setReport(null)}>✕</button>
              </div>
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
