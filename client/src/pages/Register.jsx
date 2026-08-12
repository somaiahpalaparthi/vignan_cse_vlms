import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, AlertCircle, User, Mail, Lock, Shield, Sun, Moon } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [department, setDepartment] = useState('Lab 12');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role, department);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="circuit-bg" 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '20px', 
        position: 'relative' 
      }}
    >
      {/* Floating Theme Switcher Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-switch-pill"
        style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 10 }}
        title={`Current: ${isDark ? 'Dark' : 'Light'} Mode. Click to toggle.`}
      >
        {isDark ? <Sun size={15} color="var(--orange-accent)" /> : <Moon size={15} color="var(--cyan-bright)" />}
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      </button>

      <div 
        className="lab-card" 
        style={{ 
          width: '100%', 
          maxWidth: '460px', 
          padding: '36px 32px', 
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div 
            style={{ 
              width: 48, 
              height: 48, 
              borderRadius: '12px', 
              background: 'rgba(0, 242, 254, 0.12)', 
              border: '1px solid var(--cyan-bright)',
              boxShadow: '0 0 16px var(--cyan-glow)',
              margin: '0 auto 12px auto', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            <UserPlus size={24} color="var(--cyan-bright)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Create Lab Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Register new administrator or staff account</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', color: '#ef4444', fontSize: '0.85rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              required
              className="lab-input"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Mail size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="email"
              required
              className="lab-input"
              placeholder="Email / User ID"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="password"
              required
              minLength={4}
              className="lab-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Shield size={18} color="var(--cyan-bright)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <select className="lab-input" value={role} onChange={(e) => setRole(e.target.value)} style={{ paddingLeft: '44px', cursor: 'pointer' }}>
              <option value="staff">Programmer / Staff Member</option>
              <option value="admin">System Administrator</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-cyan" style={{ width: '100%', marginTop: '8px', height: '46px' }}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--cyan-bright)', fontWeight: 600 }}>Log In</Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Powered by CLMS | © 2024
        </div>
      </div>
    </div>
  );
};

