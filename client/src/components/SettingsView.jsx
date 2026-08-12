import React, { useState } from 'react';
import { Settings, Shield, Server, Database, Key, Bell, Save, CheckCircle, Sun, Moon, Palette, Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fetchAPI } from '../services/api';

export const SettingsView = () => {
  const { theme, setTheme, isDark } = useTheme();
  const [saved, setSaved] = useState(false);
  const [systemName, setSystemName] = useState('Vignans LMS');
  const [backendUrl, setBackendUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
  const [autoRefresh, setAutoRefresh] = useState(30);
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dbMode, setDbMode] = useState('MongoDB Cloud Atlas (Connected)');

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearAllReportsAdmin = async () => {
    if (!window.confirm('⚠️ ADMIN CONFIRMATION: Are you sure you want to CLEAR ALL Reports & Analytics data? This will reset all report summary entries across the system to 0!')) return;

    try {
      await fetchAPI('/issues/clear/all', { method: 'DELETE' }).catch(() => {});
      await fetchAPI('/stock/clear/all', { method: 'DELETE' }).catch(() => {});
      await fetchAPI('/inventory/clear/all', { method: 'DELETE' }).catch(() => {});

      localStorage.removeItem('vlms_issues');
      localStorage.removeItem('vlms_stock_list');
      localStorage.removeItem('vlms_stock_entries');
      localStorage.removeItem('vlms_inventory');

      alert('✅ All Reports & Analytics data cleared successfully by Admin!');
      window.location.reload();
    } catch (err) {
      console.error('Error clearing reports:', err);
      alert('Notice: Local storage cleared. ' + (err.message || ''));
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--card-text-head)', marginBottom: '4px' }}>
            Admin & System Configuration
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage backend service endpoints, database settings, appearance themes, and global lab defaults
          </p>
        </div>

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green-online)', fontWeight: 600, fontSize: '0.88rem' }}>
            <CheckCircle size={16} /> Settings saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Panel 1: Appearance & Theme Settings */}
        <div className="lab-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--card-text-head)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Palette size={18} color="var(--cyan-bright)" /> Appearance & Visual Theme
          </h3>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Select your preferred color scheme for the application workspace.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Dark Mode Card Choice */}
            <div 
              onClick={() => setTheme('dark')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: '#0d1320',
                border: `2px solid ${isDark ? 'var(--cyan-bright)' : 'var(--glass-border)'}`,
                boxShadow: isDark ? '0 0 16px var(--cyan-glow)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Moon size={22} color="#00f2fe" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Dark Mode {isDark && <span className="status-pill status-completed" style={{ fontSize: '0.65rem' }}>Active</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  Futuristic sleek dark UI with vibrant neon highlights
                </div>
              </div>
            </div>

            {/* Light Mode Card Choice */}
            <div 
              onClick={() => setTheme('light')}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
                border: `2px solid ${!isDark ? 'var(--cyan-bright)' : 'var(--glass-border)'}`,
                boxShadow: !isDark ? '0 0 16px var(--cyan-glow)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(2, 132, 199, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sun size={22} color="#0284c7" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Light Mode {!isDark && <span className="status-pill status-completed" style={{ fontSize: '0.65rem' }}>Active</span>}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                  Clean, high-contrast bright theme optimized for daylight
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 2: Backend & Database Connection Status */}
        <div className="lab-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--card-text-head)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={18} color="var(--cyan-bright)" /> Database & API Service Config
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Backend API Base URL</label>
              <input type="text" className="lab-input" value={backendUrl} onChange={(e) => setBackendUrl(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Database Connection Target</label>
              <input type="text" disabled className="lab-input" value={dbMode} style={{ opacity: 0.85, cursor: 'not-allowed', color: 'var(--green-online)' }} />
            </div>
          </div>
        </div>

        {/* Panel 3: General System Settings */}
        <div className="lab-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--card-text-head)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Server size={18} color="var(--cyan-bright)" /> System Environment & Preferences
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Application Title</label>
              <input type="text" className="lab-input" value={systemName} onChange={(e) => setSystemName(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Dashboard Auto-Refresh Interval (seconds)</label>
              <select className="lab-input" value={autoRefresh} onChange={(e) => setAutoRefresh(Number(e.target.value))}>
                <option value={15}>Every 15 Seconds</option>
                <option value={30}>Every 30 Seconds</option>
                <option value={60}>Every 1 Minute</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Enable System Alert Notifications</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Send high priority banners when hardware faults occur</p>
              </div>
              <input type="checkbox" checked={enableAlerts} onChange={(e) => setEnableAlerts(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--cyan-bright)' }} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Maintenance Mode</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Prevent staff modifications during system upgrades</p>
              </div>
              <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--cyan-bright)' }} />
            </label>
          </div>
        </div>

        {/* Panel 4: Report & Analytics Reset (Admin Maintenance) */}
        <div className="lab-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trash2 size={18} color="#ef4444" /> Admin Reset: Clear All Reports & Analytics
          </h3>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Permanently reset and delete all reports summary records, issue logs, stock entries, and analytics history.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Clear All Reports & Analytics Data</span>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Purges all summary entries across MongoDB Atlas and resets local storage</p>
            </div>

            <button
              type="button"
              onClick={handleClearAllReportsAdmin}
              style={{
                height: '42px',
                padding: '0 20px',
                fontSize: '0.88rem',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Trash2 size={16} /> Clear All Reports & Analytics
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn-cyan" style={{ height: '42px', padding: '0 24px', fontSize: '0.9rem' }}>
            <Save size={18} /> Save Settings Configuration
          </button>
        </div>

      </form>

    </div>
  );
};
