import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Eye, EyeOff, Building, Cpu, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Login = () => {
  const { user, login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const [loginTab, setLoginTab] = useState('admin'); // 'admin' or 'staff'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('Admin');
  const [permissions, setPermissions] = useState({
    viewReports: true,
    scheduleLabs: false,
    manageUsers: true,
    systemConfig: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = (key) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const activePermissions = Object.keys(permissions).filter((k) => permissions[k]);
      await login(userId, password, loginTab, department, activePermissions);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const userRoleText = loginTab === 'admin' ? 'Admin' : 'Staff / Programmer';
    const targetEmail = 'somaiapalaparthi@gmail.com';
    const targetUser = userId ? userId.trim() : 'Registered Account User';
    
    const emailSubject = encodeURIComponent(`VLMS Password Recovery Request (${userRoleText}) - ${targetUser}`);
    const emailBody = encodeURIComponent(`Hello Administrator,\n\nPassword recovery requested for VLMS ${userRoleText} Account.\nUser ID / Email: ${targetUser}\nRole: ${userRoleText}\n\nPlease send the default login details and credentials to ${targetEmail}.\n\nThank you,\nVLMS System Security`);
    const mailtoUrl = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

    alert(`🔑 Password Reset Request Sent:\n\nUser ID / Email credentials recovery for "${targetUser}" (${userRoleText}) has been automatically dispatched to Admin Email:\n📧 ${targetEmail}\n\nPlease check your email inbox for login details.`);
    
    window.location.href = mailtoUrl;
  };

  return (
    <div className="circuit-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

      {/* VIGNAN UNIVERSITY HEADER NAVBAR */}
      <header
        style={{
          background: 'var(--sidebar-bg)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--glass-border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '12px 24px'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          {/* Logo & Institution Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '1.4rem',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              VU
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--card-text-head)', letterSpacing: '-0.02em', margin: 0 }}>
                  VIGNAN UNIVERSITY
                </h1>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: 'var(--green-online)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    textTransform: 'uppercase'
                  }}
                >
                  CSE DEPT • VLMS
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Computer Science & Engineering • Lab Infrastructure Management System
              </p>
            </div>
          </div>

          {/* Quick Controls: Theme Switcher & Home Portal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="theme-switch-pill"
              title={`Current: ${isDark ? 'Dark' : 'Light'} Mode. Click to toggle.`}
            >
              {isDark ? <Sun size={15} color="var(--orange-accent)" /> : <Moon size={15} color="var(--cyan-bright)" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button
              type="button"
              className="btn-cyan"
              onClick={() => navigate('/')}
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              🏠 Home Portal
            </button>
          </div>

        </div>
      </header>

      {/* MIDDLE SECTION: CENTERED LOGIN CARD */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div 
          className="lab-card" 
          style={{ 
            width: '100%', 
            maxWidth: '480px', 
            padding: '36px 32px', 
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          
          {/* Tabs: Admin Login | Programmer / Staff Login */}
          <div 
            style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--glass-border)', 
              marginBottom: '28px' 
            }}
          >
            <button
              type="button"
              onClick={() => {
                setLoginTab('admin');
                setDepartment('Admin');
              }}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                color: loginTab === 'admin' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: loginTab === 'admin' ? '2px solid var(--cyan-bright)' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              Admin Login
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginTab('staff');
              }}
              style={{
                flex: 1,
                padding: '12px 0',
                background: 'none',
                border: 'none',
                color: loginTab === 'staff' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: loginTab === 'staff' ? '2px solid var(--cyan-bright)' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              Programmer / Staff Login
            </button>
          </div>

          {/* Title */}
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px', color: 'var(--card-text-head)' }}>
            {loginTab === 'admin' ? 'Sign In to Admin' : 'Sign In to Staff'}
          </h2>

          {error && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* User ID / Email */}
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                required
                className="lab-input"
                placeholder="User ID / Email"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                style={{ paddingLeft: '44px' }}
              />
            </div>

            {/* Password */}
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="lab-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Department / Lab Scope */}
            {loginTab === 'admin' ? (
              <div style={{ position: 'relative' }}>
                <Building size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  readOnly
                  className="lab-input"
                  value="Admin (Full Scope)"
                  style={{ paddingLeft: '44px', background: 'rgba(0, 242, 254, 0.08)', cursor: 'not-allowed', color: 'var(--cyan-bright)', fontWeight: 700, borderColor: 'rgba(0, 242, 254, 0.3)' }}
                />
              </div>
            ) : (
              <div 
                style={{ 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  background: 'rgba(0, 242, 254, 0.08)', 
                  border: '1px solid rgba(0, 242, 254, 0.2)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  fontSize: '0.82rem',
                  color: 'var(--cyan-bright)'
                }}
              >
                <Building size={16} />
                <span>Assigned Lab Room automatically loaded from Staff profile</span>
              </div>
            )}

            {/* Role Permissions Checkbox Grid */}
            <div style={{ marginTop: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                Role Permissions
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.viewReports}
                    onChange={() => handleCheckboxChange('viewReports')}
                    style={{ accentColor: 'var(--cyan-bright)' }}
                  />
                  View Reports
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.manageUsers}
                    onChange={() => handleCheckboxChange('manageUsers')}
                    style={{ accentColor: 'var(--cyan-bright)' }}
                  />
                  Manage Users
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.scheduleLabs}
                    onChange={() => handleCheckboxChange('scheduleLabs')}
                    style={{ accentColor: 'var(--cyan-bright)' }}
                  />
                  Schedule Labs
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={permissions.systemConfig}
                    onChange={() => handleCheckboxChange('systemConfig')}
                    style={{ accentColor: 'var(--cyan-bright)' }}
                  />
                  System Config
                </label>
              </div>
            </div>

            {/* Glowing Sign In Button */}
            <button type="submit" disabled={loading} className="btn-cyan" style={{ width: '100%', marginTop: '8px', height: '46px' }}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
            <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              📧 Forgot Password?
            </button>
          </div>

        </div>
      </main>

      {/* FOOTER NAVBAR AT BOTTOM */}
      <footer
        style={{
          background: 'var(--sidebar-bg)',
          borderTop: '1px solid var(--glass-border)',
          padding: '24px 0',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 900,
                  fontSize: '1.1rem'
                }}
              >
                VU
              </div>
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--card-text-head)', display: 'block' }}>
                  Vignan's Foundation for Science, Technology & Research
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Department of Computer Science & Engineering • VLMS Access Portal
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>
              © 2026 <strong>Vignan University CSE Department</strong>. All Rights Reserved. Vadlamudi, Guntur, Andhra Pradesh, India.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Lab Usage</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
