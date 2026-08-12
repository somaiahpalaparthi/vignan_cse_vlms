import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PlayCircle, BookOpen, PlusCircle, LogOut, User, Search, ShieldCheck, Sun, Moon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, sticky: 'top', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 800, fontSize: '1.4rem', color: 'var(--text-primary)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--cyan-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px var(--cyan-glow)' }}>
            <PlayCircle size={22} color="var(--btn-text)" />
          </div>
          <span>VLMS<span style={{ color: 'var(--cyan-bright)', fontSize: '0.8em' }}>.dev</span></span>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            className="theme-switch-pill"
            title={`Current: ${isDark ? 'Dark' : 'Light'} Mode`}
          >
            {isDark ? <Sun size={15} color="var(--orange-accent)" /> : <Moon size={15} color="var(--cyan-bright)" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 600 }}>
            <BookOpen size={18} /> Catalog
          </Link>

          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <Link to="/instructor" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontSize: '0.95rem', fontWeight: 600 }}>
              <PlusCircle size={18} /> Studio Dashboard
            </Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', border: '1px solid var(--glass-border)' }}>
                <img src={user.avatar} alt={user.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>{user.role}</span>
              </div>
              
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
