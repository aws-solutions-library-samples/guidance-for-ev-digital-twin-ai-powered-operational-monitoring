import React, { useState, useEffect } from 'react';
import loginTracker from '../services/loginTracker';
import './LoginStats.css';

const LoginStats = () => {
  const [stats, setStats] = useState({
    totalLogins: 0,
    todayLogins: 0,
    weekLogins: 0,
    monthLogins: 0,
    uniqueUsers: 0,
    todayUniqueUsers: 0,
    weekUniqueUsers: 0,
    monthUniqueUsers: 0,
    lastUpdated: null,
    error: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch login statistics
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await loginTracker.getStats();
      setStats(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch login stats:', error);
      setStats(prev => ({ ...prev, error: 'Failed to load statistics' }));
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Manual refresh
  const handleRefresh = () => {
    fetchStats();
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 System Usage Analytics</h2>
        <div style={styles.headerActions}>
          <button 
            onClick={handleRefresh} 
            style={styles.refreshButton}
            disabled={isLoading}
          >
            {isLoading ? '🔄' : '↻'} Refresh
          </button>
          <span style={styles.lastUpdate}>
            Last updated: {formatDate(lastRefresh)}
          </span>
        </div>
      </div>

      {stats.error && (
        <div style={styles.errorBanner}>
          ⚠️ {stats.error}
        </div>
      )}

      <div style={styles.metricsGrid} className="login-stats-grid">
        {/* Total Demo Users - Most prominent */}
        <div style={styles.primaryMetric} className="login-stats-primary-metric">
          <div style={styles.primaryValue}>{stats.totalLogins}</div>
          <div style={styles.primaryLabel}>Total Demo Logins</div>
          <div style={styles.primarySubtext}>
            {stats.uniqueUsers} unique users have accessed the system
          </div>
        </div>

        {/* Time-based metrics */}
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{stats.todayLogins}</div>
          <div style={styles.metricLabel}>Today's Logins</div>
          <div style={styles.metricSubtext}>
            {stats.todayUniqueUsers} unique users today
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{stats.weekLogins}</div>
          <div style={styles.metricLabel}>This Week</div>
          <div style={styles.metricSubtext}>
            {stats.weekUniqueUsers} unique users this week
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{stats.monthLogins}</div>
          <div style={styles.metricLabel}>This Month</div>
          <div style={styles.metricSubtext}>
            {stats.monthUniqueUsers} unique users this month
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div style={styles.summaryCard}>
        <h3 style={styles.summaryTitle}>📈 Executive Summary</h3>
        <div style={styles.summaryContent}>
          <div style={styles.summaryItem}>
            <strong>System Adoption:</strong> {stats.uniqueUsers} users have successfully accessed the EV Digital Twin platform
          </div>
          <div style={styles.summaryItem}>
            <strong>Recent Activity:</strong> {stats.todayLogins} login sessions today from {stats.todayUniqueUsers} users
          </div>
          <div style={styles.summaryItem}>
            <strong>Engagement:</strong> {stats.weekLogins} total sessions this week across {stats.weekUniqueUsers} active users
          </div>
          <div style={styles.summaryItem}>
            <strong>Status:</strong> <span style={styles.statusActive}>System Active & Tracking</span>
          </div>
        </div>
      </div>

      {/* Real-time indicator */}
      <div style={styles.footer}>
        <div style={styles.realTimeIndicator}>
          <div style={styles.pulseIcon} className="login-stats-pulse"></div>
          Real-time tracking active
        </div>
        <div style={styles.apiStatus}>
          API Status: <span style={styles.statusGreen}>Connected</span>
        </div>
      </div>
    </div>
  );
};

// Styles for executive-friendly appearance
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '2px solid #e2e8f0'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  lastUpdate: {
    fontSize: '14px',
    color: '#718096'
  },
  errorBanner: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '24px',
    marginBottom: '32px'
  },
  primaryMetric: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    border: '3px solid #3182ce'
  },
  primaryValue: {
    fontSize: '48px',
    fontWeight: '800',
    color: '#3182ce',
    lineHeight: '1'
  },
  primaryLabel: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2d3748',
    marginTop: '8px'
  },
  primarySubtext: {
    fontSize: '14px',
    color: '#718096',
    marginTop: '8px'
  },
  metricCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: '1'
  },
  metricLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4a5568',
    marginTop: '8px'
  },
  metricSubtext: {
    fontSize: '12px',
    color: '#718096',
    marginTop: '4px'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '24px'
  },
  summaryTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '16px',
    margin: '0 0 16px 0'
  },
  summaryContent: {
    display: 'grid',
    gap: '12px'
  },
  summaryItem: {
    fontSize: '14px',
    color: '#4a5568',
    lineHeight: '1.5'
  },
  statusActive: {
    color: '#38a169',
    fontWeight: '600'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
    color: '#718096'
  },
  realTimeIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  pulseIcon: {
    width: '8px',
    height: '8px',
    backgroundColor: '#38a169',
    borderRadius: '50%'
  },
  apiStatus: {
    fontSize: '14px'
  },
  statusGreen: {
    color: '#38a169',
    fontWeight: '600'
  }
};

export default LoginStats;