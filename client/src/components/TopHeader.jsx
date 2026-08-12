import React from 'react';
import { Sun, Moon, Calendar, Building, Shield, Cpu, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const TopHeader = ({ 
  activeTab, 
  title, 
  subtitle,
  selectedLab = 'All',
  onSelectLab,
  activeLabs = []
}) => {
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'Admin';

  const getTabTitle = () => {
    if (title) return title;
    switch (activeTab) {
      case 'dashboard':
      case 'hardware':
        return 'Lab Management Dashboard';
      case 'stock':
        return 'Stock Entry & Hardware Intake';
      case 'issues':
        return 'Issue Ticket Management';
      case 'pending':
        return 'Pending Repair Status';
      case 'completed':
        return 'Completed Maintenance Logs';
      case 'reports':
        return 'Reports & Audit Analytics';
      case 'staff':
        return 'Staff Access Control';
      case 'settings':
        return 'Admin & System Settings';
      default:
        return 'Vignan Lab Management System';
    }
  };

  const getTabSubtitle = () => {
    if (subtitle) return subtitle;
    switch (activeTab) {
      case 'dashboard':
      case 'hardware':
        return 'Real-time monitoring, hardware overview & equipment tracking';
      case 'stock':
        return 'Record and manage inventory intake across lab rooms';
      case 'issues':
        return 'Log, assign, and track technical faults & maintenance requests';
      case 'pending':
        return 'Active issues awaiting technician resolution';
      case 'completed':
        return 'Historical record of fixed and verified hardware items';
      case 'reports':
        return 'Export analytics, CSV audit logs, and status summaries';
      case 'staff':
        return 'Manage user accounts, roles, and assigned lab scope permissions';
      case 'settings':
        return 'System endpoints, database settings, and theme preferences';
      default:
        return 'Hardware & Lab Resource Administration';
    }
  };

  return (
    <header 
      className="lab-card" 
      style={{ 
        padding: '16px 24px', 
        marginBottom: '24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)'
      }}
    >
      {/* Title & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div 
          style={{ 
            width: 42, 
            height: 42, 
            borderRadius: '12px', 
            background: 'var(--cyan-glow)', 
            border: '1px solid var(--cyan-bright)', 
            boxShadow: '0 0 12px var(--cyan-glow)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Cpu size={22} color="var(--cyan-bright)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--card-text-head)', margin: 0, lineHeight: 1.2 }}>
            {getTabTitle()}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', margin: 0, marginTop: '2px' }}>
            {getTabSubtitle()}
          </p>
        </div>
      </div>

      {/* Header Controls: Date, User Lab Scope & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* Date Badge */}
        <div style={{ padding: '6px 12px', background: 'rgba(125, 125, 125, 0.05)', borderRadius: '8px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <Calendar size={15} color="var(--cyan-bright)" />
          <span>{new Date().toISOString().split('T')[0]}</span>
        </div>

        {/* Active Lab Scope Filter Selector (Hidden on Staff Access Control view) */}
        {activeTab !== 'staff-access' && activeTab !== 'staff' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 242, 254, 0.08)', padding: '5px 12px', borderRadius: '12px', border: '1px solid var(--cyan-bright)' }}>
            <Building size={16} color="var(--cyan-bright)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--cyan-bright)' }}>Lab Filter:</span>
            {isAdmin ? (
              <select 
                value={selectedLab} 
                onChange={(e) => onSelectLab && onSelectLab(e.target.value)}
                className="lab-input"
                style={{ 
                  height: '32px', 
                  fontSize: '0.82rem', 
                  padding: '0 8px',
                  borderRadius: '8px',
                  background: 'var(--bg-panel)',
                  color: 'var(--card-text-head)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <option value="All">🏢 All Active Labs</option>
                {activeLabs.map((lab) => (
                  <option key={lab} value={lab}>
                    📍 {lab}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📍 {user?.department || 'Lab 1'}
              </span>
            )}
          </div>
        )}

        {/* Dark & Light Click Toggle Button Option */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'var(--bg-input)', 
            padding: '3px', 
            borderRadius: '20px', 
            border: '1px solid var(--glass-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <button
            type="button"
            onClick={() => setTheme('dark')}
            title="Switch to Dark Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '16px',
              border: 'none',
              background: isDark ? 'var(--cyan-bright)' : 'transparent',
              color: isDark ? 'var(--btn-text)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Moon size={14} /> Dark
          </button>
          
          <button
            type="button"
            onClick={() => setTheme('light')}
            title="Switch to Light Mode"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              borderRadius: '16px',
              border: 'none',
              background: !isDark ? 'var(--cyan-bright)' : 'transparent',
              color: !isDark ? 'var(--btn-text)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Sun size={14} /> Light
          </button>
        </div>

      </div>
    </header>
  );
};
