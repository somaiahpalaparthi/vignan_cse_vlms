import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Grid, 
  Monitor, 
  Package,
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  LogOut,
  Shield,
  FileText,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.role === 'admin';

  const getIssueCounts = () => {
    let pendingCount = 0;
    let completedCount = 0;
    try {
      const saved = localStorage.getItem('vlms_issues');
      if (saved) {
        const issues = JSON.parse(saved);
        if (Array.isArray(issues)) {
          pendingCount = issues.filter((i) => i.status !== 'Completed' && i.status !== 'Resolved').length;
          completedCount = issues.filter((i) => i.status === 'Completed' || i.status === 'Resolved').length;
        }
      }
    } catch (e) {}
    return { pendingCount, completedCount };
  };

  const { pendingCount, completedCount } = getIssueCounts();

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, hasActiveBadge: true }
      ]
    },
    {
      title: 'INVENTORY',
      items: [
        { id: 'stock', label: 'Stock Entry', icon: Package, badge: 'New', badgeColor: '#00f2fe' }
      ]
    },
    {
      title: 'WORKFLOW & ISSUES',
      items: [
        { id: 'issues', label: 'Issue Entry', icon: AlertTriangle },
        { id: 'pending', label: 'Pending Status', icon: Clock, badge: String(pendingCount), badgeColor: '#ff9f43' },
        { id: 'completed', label: 'Completed Status', icon: CheckCircle, badge: String(completedCount), badgeColor: '#10b981' }
      ]
    },
    {
      title: 'REPORTS & AUDIT',
      items: [
        { id: 'reports', label: 'Reports & Analytics', icon: FileText, badge: 'CSV', badgeColor: '#10b981' }
      ]
    },
    ...(isAdmin ? [{
      title: 'ADMINISTRATION',
      items: [
        { id: 'staff', label: 'Staff Access', icon: Users, adminOnly: true },
        { id: 'settings', label: 'Admin Settings', icon: Settings, adminOnly: true }
      ]
    }] : [])
  ];

  return (
    <aside 
      style={{ 
        width: isCollapsed ? '78px' : '260px', 
        minHeight: '100vh', 
        background: 'var(--sidebar-bg)', 
        borderRight: '1px solid var(--glass-border)', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px 14px',
        backdropFilter: 'blur(16px)',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        userSelect: 'none'
      }}
    >
      
      {/* Sidebar Header */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: isCollapsed ? 'center' : 'space-between', 
          marginBottom: '28px', 
          padding: '0 4px' 
        }}
      >
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            fontWeight: 800, 
            fontSize: '1.15rem', 
            color: 'var(--cyan-bright)',
            cursor: 'pointer'
          }}
        >
          <div 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '10px', 
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

          {!isCollapsed && (
            <span style={{ letterSpacing: '0.5px', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              Vignan's LMS
            </span>
          )}
        </div>

        <button 
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{ 
            background: 'rgba(125, 125, 125, 0.08)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '8px',
            color: 'var(--text-secondary)', 
            cursor: 'pointer',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            marginLeft: isCollapsed ? 0 : '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--cyan-bright)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto', paddingRight: '2px' }}>
        {menuSections.map((section, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!isCollapsed && (
              <div 
                style={{ 
                  fontSize: '0.68rem', 
                  fontWeight: 800, 
                  letterSpacing: '1px', 
                  color: 'var(--text-muted)', 
                  padding: '4px 10px',
                  marginBottom: '2px'
                }}
              >
                {section.title}
              </div>
            )}

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '12px' : '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--cyan-glow)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--cyan-bright)' : '3px solid transparent',
                    borderTop: '1px solid transparent',
                    borderRight: '1px solid transparent',
                    borderBottom: '1px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(125, 125, 125, 0.08)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={19} color={isActive ? 'var(--cyan-bright)' : 'var(--text-muted)'} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isCollapsed && item.hasActiveBadge && isActive && (
                    <span className="status-pill status-completed" style={{ fontSize: '0.62rem', padding: '2px 8px' }}>
                      Active
                    </span>
                  )}

                  {item.badge && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.badgeColor }} />
                      {!isCollapsed && (
                        <span 
                          style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 700, 
                            color: item.badgeColor, 
                            background: `${item.badgeColor}20`, 
                            padding: '1px 7px', 
                            borderRadius: '999px' 
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Theme Switcher Toggle (Dark & Light Click Option) */}
      <div style={{ padding: '12px 0', borderTop: '1px solid var(--glass-border)' }}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Appearance</span>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.12)', borderRadius: '16px', padding: '2px', border: '1px solid var(--glass-border)' }}>
              <button 
                type="button" 
                onClick={() => setTheme('dark')} 
                title="Switch to Dark Mode"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '4px 10px', 
                  borderRadius: '14px', 
                  border: 'none', 
                  background: isDark ? 'var(--cyan-bright)' : 'transparent', 
                  color: isDark ? 'var(--btn-text)' : 'var(--text-muted)', 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Moon size={13} /> Dark
              </button>
              <button 
                type="button" 
                onClick={() => setTheme('light')} 
                title="Switch to Light Mode"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  padding: '4px 10px', 
                  borderRadius: '14px', 
                  border: 'none', 
                  background: !isDark ? 'var(--cyan-bright)' : 'transparent', 
                  color: !isDark ? 'var(--btn-text)' : 'var(--text-muted)', 
                  fontWeight: 700, 
                  fontSize: '0.75rem', 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Sun size={13} /> Light
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              width: '100%',
              padding: '10px 0',
              background: 'var(--bg-input)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--cyan-bright)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
      </div>

      {/* User Profile Footer & Logout */}
      <div 
        style={{ 
          paddingTop: '12px', 
          borderTop: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: isCollapsed ? 'center' : 'space-between',
            padding: isCollapsed ? '4px' : '8px 10px',
            background: 'rgba(125, 125, 125, 0.05)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: 34, 
                height: 34, 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--cyan-dark), var(--cyan-bright))', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'var(--btn-text)',
                fontWeight: 800,
                fontSize: '0.85rem',
                flexShrink: 0
              }}
            >
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AM'}
            </div>

            {!isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Admin Manager'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Shield size={11} color="var(--cyan-bright)" />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {user?.role || 'admin'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Logout"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>

        {isCollapsed && (
          <button
            type="button"
            onClick={logout}
            title="Logout"
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>

    </aside>
  );
};
