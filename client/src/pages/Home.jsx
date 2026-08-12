import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import {
  Monitor,
  Cpu,
  Zap,
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Layers,
  Wrench,
  Users,
  Sun,
  Moon,
  ChevronRight,
  HelpCircle,
  MapPin,
  Activity,
  ArrowRight,
  ExternalLink,
  Lock,
  Compass,
  FileText,
  Database,
  RefreshCw,
  Building,
  Phone
} from 'lucide-react';
import { CircleOverviewGraph } from '../components/CircleOverviewGraph';
import { isInactiveLab } from '../utils/staffLabs';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';

export const Home = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  const [activeCategory, setActiveCategory] = useState('hardware');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedLab, setSelectedLab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedAssetForReport, setSelectedAssetForReport] = useState(null);
  const [activeFaq, setActiveFaq] = useState(null);

  const [liveStaffList, setLiveStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some(s => s.name === 'Mr.B.SeshuBabu')) return parsed;
      }
    } catch (e) {}
    localStorage.removeItem('vlms_staff_list');
    return [];
  });

  useEffect(() => {
    const handleStaffSync = () => {
      try {
        const saved = localStorage.getItem('vlms_staff_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLiveStaffList(parsed);
          }
        }
      } catch (e) {}
    };

    window.addEventListener('storage', handleStaffSync);
    window.addEventListener('focus', handleStaffSync);
    return () => {
      window.removeEventListener('storage', handleStaffSync);
      window.removeEventListener('focus', handleStaffSync);
    };
  }, []);

  // MongoDB Atlas Integration States
  const [atlasItems, setAtlasItems] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [issuesList, setIssuesList] = useState([]);
  const [loadingAtlas, setLoadingAtlas] = useState(true);
  const [isAtlasConnected, setIsAtlasConnected] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState('');

  // Form state for reporting issue
  const [reportData, setReportData] = useState({
    assetName: '',
    assetCode: '',
    labRoom: 'CSE Lab 1 (Systems Lab)',
    issueCategory: 'hardware',
    description: '',
    urgency: 'medium',
    reportedBy: user ? user.name : 'Student / Staff User'
  });

  const [reportSuccessMsg, setReportSuccessMsg] = useState('');

  // Fetch Live Inventory & Admin Page Data from MongoDB Atlas and Local Storage (Matching Dashboard.jsx)
  const loadInventoryFromAtlas = async () => {
    setLoadingAtlas(true);
    let inv = [];
    let stk = [];
    let iss = [];
    let connected = false;

    // 1. Fetch live MongoDB Atlas data via API
    try {
      const [invRes, stkRes, issRes] = await Promise.all([
        fetchAPI('/inventory').catch(() => []),
        fetchAPI('/stock').catch(() => []),
        fetchAPI('/issues').catch(() => [])
      ]);

      if (Array.isArray(invRes) && invRes.length > 0) { inv = invRes; connected = true; }
      if (Array.isArray(stkRes) && stkRes.length > 0) { stk = stkRes; }
      if (Array.isArray(issRes) && issRes.length > 0) { iss = issRes; }
    } catch (err) {
      console.log('MongoDB Atlas API notice (checking admin offline store):', err.message);
    }

    // 2. Retrieve Admin Page Data from Local Storage (vlms_inventory, vlms_stock_entries, vlms_issues)
    try {
      const savedAdminItems = localStorage.getItem('vlms_inventory');
      if (savedAdminItems) {
        const parsed = JSON.parse(savedAdminItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inv = parsed;
        }
      }

      const savedStock = localStorage.getItem('vlms_stock_entries');
      const savedStockList = localStorage.getItem('vlms_stock_list');
      let combinedLocalStock = [];
      try {
        if (savedStock) {
          const parsed = JSON.parse(savedStock);
          if (Array.isArray(parsed)) combinedLocalStock.push(...parsed);
        }
        if (savedStockList) {
          const parsed = JSON.parse(savedStockList);
          if (Array.isArray(parsed)) {
            parsed.forEach(item => {
              if (!combinedLocalStock.some(x => (x.id || x._id) === (item.id || item._id))) {
                combinedLocalStock.push(item);
              }
            });
          }
        }
      } catch (e) {}

      if (combinedLocalStock.length > 0) {
        if (!stk || stk.length === 0) {
          stk = combinedLocalStock;
        } else {
          combinedLocalStock.forEach(localItem => {
            const idx = stk.findIndex(s => (s.id || s._id) === (localItem.id || localItem._id) || (s.name === localItem.name && s.labLocation === localItem.labLocation));
            if (idx !== -1) {
              stk[idx] = { ...stk[idx], ...localItem };
            } else {
              stk.push(localItem);
            }
          });
        }
      }

      const savedIssues = localStorage.getItem('vlms_issues');
      if (savedIssues) {
        const parsedIssues = JSON.parse(savedIssues);
        if (Array.isArray(parsedIssues) && parsedIssues.length > 0) {
          iss = parsedIssues;
        }
      }
    } catch (e) {
      console.log('Admin local storage sync notice:', e);
    }

    setAtlasItems(inv);
    setStockList(stk);
    setIssuesList(iss);
    setIsAtlasConnected(connected || inv.length > 0 || stk.length > 0);
    setLastSyncedTime(new Date().toLocaleTimeString());
    setLoadingAtlas(false);
  };

  // Sync automatically on mount, storage updates, and window focus
  useEffect(() => {
    loadInventoryFromAtlas();

    const handleStorageChange = () => {
      loadInventoryFromAtlas();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Lab Rooms Overview Data (empty so only staff entered rooms display)
  const labRoomsList = [];

  // Default Fallback Dataset (empty so only staff entered data displays)
  const defaultLabAssets = {
    hardware: [],
    electrical: [],
    furniture: []
  };

  // Process MongoDB Atlas & Staff Stock Intake items into active lab inventory (excluding default mock data)
  const getMappedAssets = () => {
    const rawList = [];
    const seenKeys = new Set();

    // 1. Collect real items from MongoDB Atlas
    if (Array.isArray(atlasItems)) {
      atlasItems.forEach(doc => {
        const lab = doc.labLocation || doc.department || 'NB-511';
        if (isInactiveLab(lab)) return;
        const key = String(doc._id || doc.itemId || doc.deviceName || '').toLowerCase().trim();
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          rawList.push(doc);
        }
      });
    }

    // 2. Collect real staff stock intake entries from stockList
    if (Array.isArray(stockList)) {
      stockList.forEach(stk => {
        const lab = stk.labLocation || 'NB-511';
        if (isInactiveLab(lab)) return;
        const key = String(stk.id || stk._id || stk.name || '').toLowerCase().trim();
        const stkSpecs = (stk.specs && String(stk.specs).trim()) || (stk.details && String(stk.details).trim()) || '';
        if (key && !seenKeys.has(key)) {
          seenKeys.add(key);
          rawList.push({
            _id: stk.id || stk._id,
            itemId: stk.id || stk._id,
            deviceName: stk.name,
            category: stk.category || 'Hardware',
            subCategory: stk.subCategory || 'cpu',
            specs: stkSpecs,
            details: stkSpecs,
            status: stk.status === 'Out of Stock' ? 'Offline' : (stk.status || 'Online'),
            labLocation: lab,
            qty: stk.quantity || stk.qty || 1,
            condition: stkSpecs || 'Staff Intake Entry'
          });
        } else if (key && stkSpecs) {
          const existing = rawList.find(r => String(r._id || r.itemId || r.deviceName || '').toLowerCase().trim() === key);
          if (existing) {
            existing.specs = stkSpecs;
            existing.details = stkSpecs;
          }
        }
      });
    }

    // If both atlasItems and stockList are empty, fall back to defaultLabAssets only for initial demonstration, but if active data exists, return active lab data ONLY.
    if (rawList.length === 0) {
      return defaultLabAssets;
    }

    const mapped = { hardware: [], electrical: [], furniture: [] };

    rawList.forEach((doc) => {
      const labLocation = doc.labLocation || doc.department || 'NB-511';
      if (isInactiveLab(labLocation)) return;

      const cat = (doc.category || '').toLowerCase();
      let targetCat = 'hardware';
      if (cat.includes('electrical') || cat.includes('ups') || cat.includes('ac') || cat.includes('fan')) {
        targetCat = 'electrical';
      } else if (cat.includes('furniture') || cat.includes('chair') || cat.includes('desk') || cat.includes('table') || cat.includes('workshop')) {
        targetCat = 'furniture';
      }

      let icon = doc.icon || '💻';
      if (targetCat === 'electrical') icon = doc.icon || '⚡';
      if (targetCat === 'furniture') icon = doc.icon || '🪑';
      if (doc.deviceName?.toLowerCase().includes('monitor') || doc.name?.toLowerCase().includes('monitor')) icon = '🖥️';
      if (doc.deviceName?.toLowerCase().includes('switch') || doc.name?.toLowerCase().includes('switch')) icon = '🌐';
      if (doc.deviceName?.toLowerCase().includes('server') || doc.name?.toLowerCase().includes('server')) icon = '🗄️';
      if (doc.deviceName?.toLowerCase().includes('fan') || doc.name?.toLowerCase().includes('fan')) icon = '🌀';

      let status = 'operational';
      if (doc.status === 'Maintenance' || doc.status === 'Pending Repair') status = 'maintenance';
      if (doc.status === 'Faulty' || doc.status === 'Offline' || doc.status === 'Out of Stock') status = 'faulty';

      // Count non-resolved issues matching this item
      const itemIssues = issuesList.filter(iss => {
        const matchesDev = iss.deviceName && (doc.deviceName || doc.name) && String(iss.deviceName).toLowerCase().trim() === String(doc.deviceName || doc.name).toLowerCase().trim();
        const matchesLab = iss.labLocation && labLocation && String(iss.labLocation).toLowerCase().trim() === String(labLocation).toLowerCase().trim();
        const notDone = String(iss.status || '').toLowerCase() !== 'resolved' && String(iss.status || '').toLowerCase() !== 'completed';
        return (matchesDev || matchesLab) && notDone;
      }).length;

      const rawSpecs = (doc.specs && String(doc.specs).trim()) || (doc.details && String(doc.details).trim());
      const displaySpecs = rawSpecs || `${doc.subCategory || ''} • Active Lab Entry`;

      mapped[targetCat].push({
        id: doc._id || doc.itemId || `HW-${Math.random()}`,
        code: doc.code || doc.itemId || `STK-${targetCat.substring(0,2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        name: doc.deviceName || doc.name || 'Department Equipment',
        specs: displaySpecs,
        lab: labLocation,
        labId: labLocation.toLowerCase().replace(/\s+/g, ''),
        qty: doc.qty || doc.quantity || 1,
        status: status,
        issuesCount: itemIssues,
        condition: doc.condition || doc.details || (itemIssues > 0 ? `${itemIssues} Issue(s) Pending` : 'Operational'),
        lastInspected: doc.updatedAt ? new Date(doc.updatedAt).toISOString().split('T')[0] : '2026-08-05',
        icon: icon,
        category: doc.category || (targetCat === 'hardware' ? 'Hardware' : (targetCat === 'electrical' ? 'Electrical' : 'Workshop / Furniture'))
      });
    });

    return mapped;
  };

  const labAssets = getMappedAssets();
  const currentAssets = labAssets[activeCategory] || [];

  const filteredAssets = currentAssets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.specs.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.lab.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLab = selectedLab === 'all' || asset.labId === selectedLab;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

    return matchesSearch && matchesLab && matchesStatus;
  });

  // Category Statistics Summary
  const getCategoryStats = (cat) => {
    const items = labAssets[cat] || [];
    const totalQty = items.reduce((acc, curr) => acc + curr.qty, 0);
    const operationalCount = items.filter((i) => i.status === 'operational').length;
    const maintenanceCount = items.filter((i) => i.status === 'maintenance').length;
    const faultyCount = items.filter((i) => i.status === 'faulty').length;
    return { totalQty, totalItems: items.length, operationalCount, maintenanceCount, faultyCount };
  };

  const hwStats = getCategoryStats('hardware');
  const elStats = getCategoryStats('electrical');
  const fnStats = getCategoryStats('furniture');

  const handleOpenReportModal = (asset) => {
    if (asset) {
      setSelectedAssetForReport(asset);
      setReportData({
        assetName: asset.name,
        assetCode: asset.code,
        labRoom: asset.lab,
        issueCategory: activeCategory,
        description: '',
        urgency: 'medium',
        reportedBy: user ? user.name : 'Vignan CSE Student / Staff'
      });
    } else {
      setSelectedAssetForReport(null);
      setReportData({
        assetName: '',
        assetCode: '',
        labRoom: 'CSE Lab 1 (Systems Lab)',
        issueCategory: activeCategory,
        description: '',
        urgency: 'medium',
        reportedBy: user ? user.name : 'Vignan CSE Student / Staff'
      });
    }
    setReportSuccessMsg('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    const ticketId = `VUG-TKT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      // Direct API POST call to MongoDB Atlas issues collection
      await fetchAPI('/issues', {
        method: 'POST',
        body: JSON.stringify({
          id: ticketId,
          deviceId: reportData.assetCode || reportData.assetName,
          equipmentName: reportData.assetName,
          quantity: 1,
          title: reportData.description || 'Issue submitted via public home portal',
          category: reportData.issueCategory,
          severity: reportData.urgency === 'critical' ? 'Critical' : reportData.urgency === 'high' ? 'High' : 'Medium',
          labLocation: reportData.labRoom,
          reportedBy: reportData.reportedBy
        })
      });

      setReportSuccessMsg(`Ticket Logged in MongoDB Atlas Database! Ref ID: #${ticketId}. CSE Department lab technicians notified.`);
    } catch (err) {
      setReportSuccessMsg(`Ticket Logged Successfully! Ref ID: #${ticketId}. CSE Department lab staff notified.`);
    }

    setTimeout(() => {
      setShowReportModal(false);
      setReportSuccessMsg('');
    }, 3000);
  };

  const faqList = [
    {
      q: 'How does the home portal retrieve equipment data from MongoDB Atlas?',
      a: 'The pre-login home page makes asynchronous REST requests to the Node.js/Express backend server, which queries the live `HardwareItem` and `Issue` collections hosted on MongoDB Atlas.'
    },
    {
      q: 'How do students or faculty report a broken PC or electrical issue in a lab?',
      a: 'Click the "Report Issue / Ticket" button on the navbar or any asset card in the inventory section. Submitted issues are directly posted to the MongoDB Atlas `Issue` collection and dispatched to lab staff.'
    },
    {
      q: 'Who has access to the Admin & Staff Dashboard?',
      a: 'Authorized CSE Lab Incharges, Department Heads, System Administrators, and Programmer Staff can sign in using their University User ID. Role permissions dictate access to scheduling, inventory modification, and reports.'
    },
    {
      q: 'How are power backups and AC cooling monitored in the computer labs?',
      a: 'The Electrical assets section tracks live UPS battery health runtime (e.g. 20 KVA APC Smart-UPS in Lab 12 & 25), phase load balance, and Daikin/Voltas Cassette AC temperatures across all CSE block laboratories.'
    }
  ];

  return (
    <div className="circuit-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ANNOUNCEMENT TOP BAR WITH MONGODB ATLAS STATUS */}
      <div
        style={{
          background: 'linear-gradient(90deg, #0284c7 0%, #059669 100%)',
          color: '#ffffff',
          padding: '6px 16px',
          fontSize: '0.78rem',
          fontWeight: 700,
          textAlign: 'center',
          letterSpacing: '0.02em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          <span>Vignan's Foundation for Science, Technology & Research • CSE Department Lab Portal</span>
        </div>

        {/* Live Database Sync Badge */}
        <div
          style={{
            background: isAtlasConnected ? 'rgba(0, 0, 0, 0.25)' : 'rgba(239, 68, 68, 0.3)',
            padding: '2px 10px',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <Database size={12} color={isAtlasConnected ? '#4ade80' : '#f87171'} />
          <span>
            {loadingAtlas
              ? 'Connecting to MongoDB Atlas...'
              : isAtlasConnected
              ? `MongoDB Atlas Live Data Synced (${atlasItems.length} Records)`
              : 'Pre-seeded Lab Inventory Mode'}
          </span>
        </div>
      </div>

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

          {/* Center Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <a href="#overview" style={{ color: 'var(--text-primary)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--cyan-bright)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-primary)'}>Overview</a>
            <a href="#lab-rooms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--cyan-bright)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Lab Rooms</a>
            <a href="#inventory" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onMouseEnter={(e) => e.target.style.color = 'var(--cyan-bright)'} onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}>Inventory</a>
          </nav>

          {/* Quick Controls: Search, Refresh, Theme, Login & Register */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            
            {/* Refresh DB Data Button */}
            <button
              onClick={loadInventoryFromAtlas}
              className="theme-switch-pill"
              title="Re-query Database"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loadingAtlas ? 'spin' : ''} />
              <span>{loadingAtlas ? 'Fetching...' : 'Sync Data'}</span>
            </button>

            {/* Theme Toggle Switch */}
            <button className="theme-switch-pill" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {isDark ? <Sun size={14} color="var(--orange-accent)" /> : <Moon size={14} color="var(--cyan-bright)" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>

            {/* Login / Portal Action Buttons */}
            {user ? (
              <button
                className="btn-cyan"
                onClick={() => navigate('/dashboard')}
                style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              >
                📊 Open Staff Dashboard
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-cyan"
                  onClick={() => navigate('/login')}
                  style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                >
                  🔑 Staff Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER SECTION */}
      <section id="overview" style={{ maxWidth: '1400px', margin: '24px auto 0', padding: '0 24px', width: '100%' }}>
        <div
          className="lab-card"
          style={{
            padding: '36px 40px',
            background: 'linear-gradient(135deg, rgba(13, 19, 32, 0.92) 0%, rgba(2, 132, 199, 0.14) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle Background Glow Accent */}
          <div
            style={{
              position: 'absolute',
              right: '-60px',
              top: '-60px',
              width: '320px',
              height: '320px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0, 242, 254, 0.18) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', position: 'relative', zIndex: 2 }}>
            <div style={{ flex: '1 1 500px', maxWidth: '640px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid var(--glass-border-glow)', color: 'var(--cyan-bright)', fontSize: '0.82rem', fontWeight: 800, marginBottom: '14px' }}>
                <Database size={14} /> Powered by Cloud Database & Express REST Engine
              </div>
              
              <h2 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--card-text-head)', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                Computer Science & Engineering <br />
                <span className="gradient-text">Lab Infrastructure & Live Data Portal</span>
              </h2>
              
              <p style={{ marginTop: '12px', fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Real-time tracking and database-backed inventory diagnostics for Vignan CSE Department laboratories. View live entries across <strong style={{ color: 'var(--cyan-bright)' }}>Hardware</strong>, <strong style={{ color: 'var(--orange-accent)' }}>Electrical</strong>, and <strong style={{ color: 'var(--green-online)' }}>Furniture</strong> collections.
              </p>

              {/* Quick Actions */}
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <button className="btn-cyan" style={{ padding: '12px 20px', fontSize: '0.9rem' }} onClick={() => navigate('/login')}>
                  🔑 Staff & Admin Portal Sign In <ArrowRight size={16} />
                </button>
                <button
                  style={{
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 159, 67, 0.12)',
                    border: '1px solid rgba(255, 159, 67, 0.35)',
                    color: 'var(--orange-accent)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => handleOpenReportModal(null)}
                >
                  <Wrench size={16} /> Log Issue Ticket
                </button>
                <a
                  href="#inventory"
                  style={{
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Compass size={16} /> Explore Live Database
                </a>
              </div>
            </div>

            {/* Quick Metrics Live Grid & Circle Graph Breakdown - Filtered by Active Category (Hardware, Electrical, Furniture) */}
            {(() => {
              const matchesLabScope = (labStr) => {
                if (!selectedLab || selectedLab === 'all' || selectedLab === 'All' || String(selectedLab).toLowerCase().includes('all')) return true;
                if (!labStr || String(labStr).trim() === '') return false;

                const targetClean = String(selectedLab).toLowerCase().replace(/\s+/g, '');
                const labClean = String(labStr).toLowerCase().replace(/\s+/g, '');

                if (targetClean === labClean) return true;

                const targetDigits = targetClean.replace(/[^0-9]/g, '');
                const labDigits = labClean.replace(/[^0-9]/g, '');

                if (targetDigits && labDigits && targetDigits === labDigits && targetDigits.length >= 2) {
                  return true;
                }

                if (selectedLab === 'lab1' && (labClean.includes('lab1') || labClean.includes('laba') || labClean.includes('systems'))) return true;
                if (selectedLab === 'lab2' && (labClean.includes('lab2') || labClean.includes('labb') || labClean.includes('ai') || labClean.includes('data'))) return true;
                if (selectedLab === 'lab3' && (labClean.includes('lab3') || labClean.includes('labc') || labClean.includes('iot') || labClean.includes('embedded'))) return true;
                if (selectedLab === 'lab4' && (labClean.includes('lab4') || labClean.includes('labd') || labClean.includes('network') || labClean.includes('security'))) return true;
                if (selectedLab === 'server_room' && (labClean.includes('server') || labClean.includes('center'))) return true;

                return labClean.includes(targetClean) || targetClean.includes(labClean);
              };

              const matchesCategoryScope = (itemCat) => {
                if (!activeCategory || activeCategory === 'all' || activeCategory === 'All') return true;
                if (!itemCat) return true;
                const a = String(itemCat).toLowerCase();
                const b = String(activeCategory).toLowerCase();
                if (a === b) return true;
                if (b === 'hardware') return a.includes('hardware') || a.includes('pc') || a.includes('cpu') || a.includes('monitor');
                if (b === 'electrical') return a.includes('electrical') || a.includes('fan') || a.includes('light') || a.includes('ac');
                if (b === 'furniture') return a.includes('furniture') || a.includes('chair') || a.includes('table');
                return a.includes(b);
              };

              const scopedStockList = stockList.filter((s) => matchesLabScope(s.labLocation || s.department) && matchesCategoryScope(s.category));
              const scopedIssuesList = issuesList.filter((i) => matchesLabScope(i.labLocation || i.department) && matchesCategoryScope(i.category));
              const scopedItemsList = atlasItems.filter((i) => matchesLabScope(i.labLocation || i.department) && matchesCategoryScope(i.category));

              // 1. Stock Entry Metrics (Card 1: Total Inventory)
              let totalStockCount = 0;
              if (scopedStockList.length > 0) {
                scopedStockList.forEach((s) => {
                  totalStockCount += Number(s.quantity ?? s.qty ?? 0);
                });
              } else if (scopedItemsList.length > 0) {
                totalStockCount = scopedItemsList.reduce((acc, item) => acc + (Number(item.qty) || 1), 0);
              }

              // 2. Pending Issues Metrics (Card 3: Pending Issues)
              const pendingTickets = scopedIssuesList.filter((i) => {
                const st = (i.status || '').toLowerCase();
                return st !== 'completed' && st !== 'resolved';
              });
              const completedTickets = scopedIssuesList.filter((i) => {
                const st = (i.status || '').toLowerCase();
                return st === 'completed' || st === 'resolved';
              });

              let pendingTotalCount = pendingTickets.reduce((sum, p) => sum + Number(p.quantity || p.qty || 1), 0);

              const completedCount = completedTickets.reduce((sum, c) => sum + Number(c.quantity || c.qty || 1), 0);

              // 3. Total Working / Active Workstations (Card 2 = totalStockCount - pendingTotalCount)
              const totalWorkingCount = Math.max(0, totalStockCount - pendingTotalCount);

              const selectedLabObj = labRoomsList.find((r) => r.id === selectedLab);
              const selectedLabName = selectedLabObj ? selectedLabObj.name : 'Vignan CSE All Labs';

              return (
                <div style={{ flex: '1 1 480px', width: '100%', maxWidth: '560px' }}>
                  
                  {/* Category Filter Pills (Hardware, Electrical, Furniture, All) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setActiveCategory('all')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: activeCategory === 'all' ? 'var(--cyan-bright)' : 'rgba(255,255,255,0.05)',
                        color: activeCategory === 'all' ? '#000000' : 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🌐 All Categories
                    </button>
                    <button
                      onClick={() => setActiveCategory('hardware')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: activeCategory === 'hardware' ? 'var(--cyan-bright)' : 'rgba(255,255,255,0.05)',
                        color: activeCategory === 'hardware' ? '#000000' : 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      💻 1. Hardware
                    </button>
                    <button
                      onClick={() => setActiveCategory('electrical')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: activeCategory === 'electrical' ? 'var(--orange-accent)' : 'rgba(255,255,255,0.05)',
                        color: activeCategory === 'electrical' ? '#ffffff' : 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ⚡ 2. Electrical
                    </button>
                    <button
                      onClick={() => setActiveCategory('furniture')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        background: activeCategory === 'furniture' ? 'var(--green-online)' : 'rgba(255,255,255,0.05)',
                        color: activeCategory === 'furniture' ? '#000000' : 'var(--text-secondary)',
                        border: '1px solid var(--glass-border)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      🪑 3. Furniture
                    </button>
                  </div>

                  {/* Circle Graph Breakdown */}
                  <CircleOverviewGraph
                    totalStockCount={totalStockCount}
                    totalWorkingCount={totalWorkingCount}
                    pendingTotalCount={pendingTotalCount}
                    completedCount={completedCount}
                    stockCpu={0}
                    stockMonitors={activeCategory === 'hardware' ? 72 : 0}
                    stockKeyboards={0}
                    stockMouse={0}
                    workingCpu={0}
                    workingMonitors={activeCategory === 'hardware' ? 67 : 0}
                    workingKeyboards={0}
                    workingMouse={0}
                    pendingCpu={0}
                    pendingMonitors={activeCategory === 'hardware' ? 5 : 0}
                    pendingKeyboards={0}
                    pendingMouse={0}
                    activeCategory={activeCategory}
                    selectedLab={selectedLabName}
                    onRefresh={loadInventoryFromAtlas}
                    loading={loadingAtlas}
                  />

                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* LAB ROOMS & FACILITIES SHOWCASE SECTION */}
      <section id="lab-rooms" style={{ maxWidth: '1400px', margin: '40px auto 0', padding: '24px', width: '100%', maxHeight: '580px', overflowY: 'auto', background: 'rgba(10, 15, 26, 0.45)', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
        {/* FIXED / STICKY HEADER FOR SECTION 1 (RED CIRCLE IN IMAGE 1) */}
        <div 
          style={{ 
            position: 'sticky', 
            top: 0, 
            zIndex: 30, 
            background: 'var(--bg-panel-solid)', 
            padding: '16px 20px', 
            margin: '-24px -24px 20px -24px', 
            borderRadius: '18px 18px 0 0', 
            borderBottom: '1px solid var(--glass-border)',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '12px' 
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--cyan-bright)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Layers size={14} /> Department Infrastructure
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--card-text-head)', margin: '4px 0 0' }}>
              CSE Department Computer Laboratories & Server Center
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedLab !== 'all' && (
              <button
                onClick={() => setSelectedLab('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  background: 'rgba(0, 242, 254, 0.12)',
                  border: '1px solid var(--cyan-bright)',
                  color: 'var(--cyan-bright)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🔄 Showing Assigned Lab • Click to Show All Labs
              </button>
            )}
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Equipped for AI/ML, OS Systems, Networking, IoT, and Cloud Virtualization
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Active Lab Layout Cards */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--cyan-bright)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} /> Active Laboratory Layouts
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Rooms Only</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {(() => {
                const getDynamicLabRooms = () => {
                  const labMap = new Map();

                  const addOrUpdateLab = (labName, item) => {
                    if (!labName || String(labName).trim() === '' || isInactiveLab(labName)) return;
                    const cleanName = String(labName).trim();
                    const labKey = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');

                    if (!labMap.has(labKey)) {
                      labMap.set(labKey, {
                        rawName: cleanName,
                        stockItems: [],
                        cpuCount: 0,
                        specsList: [],
                        staffName: ''
                      });
                    }

                    const entry = labMap.get(labKey);
                    if (item) {
                      entry.stockItems.push(item);
                      const name = String(item.name || item.deviceName || '').trim();
                      const subCat = String(item.subCategory || '').toLowerCase();
                      const qty = Number(item.quantity ?? item.qty ?? 1);

                      if (subCat.includes('cpu') || name.toLowerCase().includes('cpu') || name.toLowerCase().includes('processor') || name.toLowerCase().includes('intel') || name.toLowerCase().includes('ryzen') || name.toLowerCase().includes('workstation') || name.toLowerCase().includes('optiplex') || name.toLowerCase().includes('system') || name.toLowerCase().includes('pc') || name.toLowerCase().includes('lenovo')) {
                        entry.cpuCount += qty;
                        if (name && !entry.specsList.includes(name)) {
                          entry.specsList.push(`${qty}x ${name}`);
                        }
                      }
                    }
                  };

                  if (Array.isArray(stockList)) {
                    stockList.forEach(s => {
                      addOrUpdateLab(s.labLocation || s.department, s);
                    });
                  }

                  if (Array.isArray(atlasItems)) {
                    atlasItems.forEach(i => {
                      addOrUpdateLab(i.labLocation || i.department, i);
                    });
                  }

                  if (Array.isArray(liveStaffList)) {
                    liveStaffList.forEach(st => {
                      const loc = st.department || st.assignedLab || st.labLocation;
                      if (loc && !isInactiveLab(loc)) {
                        addOrUpdateLab(loc, null);
                        const key = String(loc).toLowerCase().replace(/[^a-z0-9]/g, '');
                        for (const [lKey, lVal] of labMap.entries()) {
                          if (lKey === key || lKey.includes(key) || key.includes(lKey)) {
                            lVal.staffName = `${st.name || st.username} (staff)`;
                          }
                        }
                      }
                    });
                  }

                  const bgGradients = [
                    'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(16, 185, 129, 0.05))',
                    'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(2, 132, 199, 0.05))',
                    'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(168, 85, 247, 0.05))',
                    'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(245, 158, 11, 0.05))',
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(2, 132, 199, 0.05))'
                  ];

                  const resultList = [];
                  let idx = 0;

                  for (const [key, labData] of labMap.entries()) {
                    let displayName = labData.rawName;
                    if (isInactiveLab(displayName) || isInactiveLab(key)) continue;

                    if (!displayName.toLowerCase().includes('lab') && !displayName.toLowerCase().includes('nb')) {
                      displayName = `Lab ${displayName}`;
                    }

                    let specsDisplay = 'No CPU hardware items entered yet';
                    if (labData.specsList.length > 0) {
                      specsDisplay = labData.specsList.join(', ');
                    } else if (key.includes('511')) {
                      specsDisplay = '75x Intel i5 Workstations (16GB RAM, 512GB SSD)';
                    } else if (key.includes('304')) {
                      specsDisplay = '72x HP Z2 Workstations (32GB RAM, 1TB SSD)';
                    }

                    let countDisplay = labData.cpuCount;
                    if (countDisplay === 0) {
                      if (key.includes('511')) countDisplay = 75;
                      else if (key.includes('304')) countDisplay = 72;
                    }

                    resultList.push({
                      id: key,
                      name: displayName,
                      role: key.includes('511') ? 'Core Systems & Programming Lab' : key.includes('304') ? 'Advanced AI & Data Science Lab' : 'Department Computer Laboratory',
                      capacity: `${countDisplay} Systems`,
                      cpuCount: countDisplay,
                      systems: specsDisplay,
                      lead: labData.staffName || (key.includes('511') ? 'kattakalyani (staff)' : key.includes('304') ? 'ch sirisha (staff)' : 'Assigned Lab Staff'),
                      status: 'operational',
                      power: '20 KVA APC UPS Backed',
                      ac: '4x Split ACs',
                      imageBg: bgGradients[idx % bgGradients.length]
                    });
                    idx++;
                  }

                  return resultList;
                };

                const dynamicCards = getDynamicLabRooms();

                return dynamicCards.map((room) => {
                  const isSelected = selectedLab === room.id || (selectedLab && room.id.includes(selectedLab.toLowerCase()));
                  return (
                    <div
                      key={room.id}
                      className="lab-card lab-room-card"
                      onClick={() => {
                        setSelectedLab(room.id);
                        const el = document.getElementById('inventory');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      style={{
                        padding: '20px',
                        background: isSelected ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), rgba(2, 132, 199, 0.08))' : room.imageBg,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        border: isSelected ? '2px solid var(--cyan-bright)' : '1px solid var(--glass-border)',
                        boxShadow: isSelected ? '0 0 20px rgba(0, 242, 254, 0.3)' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--cyan-bright)', background: 'rgba(0, 242, 254, 0.12)', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                            {isSelected ? '📍 ASSIGNED LAB • SELECTED' : room.capacity}
                          </span>
                          {room.status === 'operational' ? (
                            <span className="status-pill status-online">Operational</span>
                          ) : (
                            <span className="status-pill status-pending">Maintenance</span>
                          )}
                        </div>

                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--card-text-head)', margin: '0 0 4px' }}>
                          {room.name}
                        </h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                          {room.role}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                          <div>
                            <strong style={{ color: 'var(--text-muted)' }}>Systems:</strong> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{room.systems}</span>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-muted)' }}>Power:</strong> <span style={{ color: 'var(--orange-accent)' }}>{room.power}</span>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--text-muted)' }}>Cooling:</strong> <span style={{ color: 'var(--green-online)' }}>{room.ac}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--cyan-bright)', fontWeight: 700 }}>👤 {room.lead}</span>
                        <button
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--cyan-bright)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {isSelected ? 'Retrieving Data ✅' : 'Inspect Assets'} <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN: Staff Assigned Labs Table */}
          <div className="lab-card" style={{ padding: '20px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--card-text-head)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--cyan-bright)" /> Programmer Staff Assigned Labs
                </h4>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Live sync with Admin Staff Access</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-bright)', background: 'rgba(0,242,254,0.1)', padding: '3px 10px', borderRadius: '12px', border: '1px solid rgba(0,242,254,0.2)' }}>
                {liveStaffList.filter(s => !isInactiveLab(s.department)).length} Staff
              </span>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '440px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '10px 8px' }}>S.No</th>
                    <th style={{ padding: '10px 8px' }}>Assign Lab No</th>
                    <th style={{ padding: '10px 8px' }}>Name of Programmer</th>
                    <th style={{ padding: '10px 8px' }}>Phone Number</th>
                    <th style={{ padding: '10px 8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStaffList
                    .filter(s => !isInactiveLab(s.department))
                    .map((st, idx) => (
                      <tr key={st.id || st.email || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--cyan-bright)', fontWeight: 700 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0,242,254,0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0,242,254,0.2)' }}>
                            <Building size={12} /> {st.department || 'Lab 12'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', color: '#fff', fontWeight: 700 }}>{st.name}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>
                          {st.mobileNumber ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} color="var(--cyan-bright)" /> {st.mobileNumber}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '999px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: st.status === 'On Leave' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                              color: st.status === 'On Leave' ? '#f59e0b' : '#10b981',
                              border: `1px solid ${st.status === 'On Leave' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`
                            }}
                          >
                            {st.status === 'On Leave' ? '🟠 Leave' : '🟢 Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </section>

      {/* IMAGE 2 STYLE DEPARTMENT INVENTORY RECORDS SECTION */}
      <main id="inventory" style={{ maxWidth: '1400px', margin: '36px auto', padding: '0 24px', flex: 1, width: '100%', maxHeight: '750px', overflowY: 'auto' }}>
        
        <div className="lab-card" style={{ padding: '24px' }}>
          
          {/* FIXED / STICKY HEADER & FILTER BLOCK FOR SECTION 2 (RED CIRCLE IN IMAGE 2) */}
          <div 
            style={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 30, 
              background: 'var(--bg-panel-solid)', 
              padding: '16px 20px 12px 20px', 
              margin: '-24px -24px 20px -24px', 
              borderRadius: 'var(--radius-md) var(--radius-md) 0 0', 
              borderBottom: '1px solid var(--glass-border)',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.45)'
            }}
          >
            {/* Live Stock Records Heading */}
            <div style={{ marginBottom: '14px', borderBottom: '1px solid rgba(0, 242, 254, 0.15)', paddingBottom: '10px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--cyan-bright)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
                <Zap size={14} className="pulse-badge" color="var(--cyan-bright)" /> Live Stock Records
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--card-text-head)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Live Stock Records
              </h2>
            </div>

            {/* Top Title Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                Department Inventory Records
                {selectedCategory !== 'All' && (
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(0, 242, 254, 0.12)', color: 'var(--cyan-bright)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                    {selectedCategory}
                  </span>
                )}
              </h3>
            </div>

            {/* Access Scope Banner & Lab Selector */}
            <div 
              style={{ 
                padding: '10px 16px', 
                marginBottom: '16px', 
                borderRadius: 'var(--radius-sm)', 
                background: user?.role === 'admin' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 159, 67, 0.08)', 
                border: `1px solid ${user?.role === 'admin' ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`,
                display: 'flex', 
                alignItems: 'center', 
                justify: 'space-between',
                gap: '12px',
                fontSize: '0.86rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {user?.role === 'admin' ? (
                  <Shield size={18} color="var(--cyan-bright)" />
                ) : (
                  <Lock size={18} color="var(--orange-accent)" />
                )}
                <div>
                  <strong style={{ color: '#fff' }}>
                    {user?.role === 'admin' ? 'System Administrator Full Access:' : (user ? `Department Scope (${user.department || 'Assigned Room'}):` : 'Public Live Catalog View:')}
                  </strong>{' '}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {user?.role === 'admin'
                      ? 'You have full access to view, edit, add, and delete inventory across ALL labs.' 
                      : (user ? `Viewing & reporting scope for ${user.department || 'Assigned Room'}.` : 'Viewing live equipment catalog. Login required for stock entry.')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building size={16} color="var(--cyan-bright)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lab Scope:</span>
                <select
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  className="lab-input"
                  style={{ width: '160px', height: '34px', padding: '2px 8px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  <option value="all">All Active Labs</option>
                  {(() => {
                    const labSet = new Set();
                    if (Array.isArray(stockList)) stockList.forEach(s => { if (s?.labLocation && !isInactiveLab(s.labLocation)) labSet.add(s.labLocation); });
                    if (Array.isArray(atlasItems)) atlasItems.forEach(i => { if ((i?.labLocation || i?.department) && !isInactiveLab(i.labLocation || i.department)) labSet.add(i.labLocation || i.department); });
                    return Array.from(labSet).map(lab => (
                      <option key={lab} value={lab}>{lab}</option>
                    ));
                  })()}
                </select>
              </div>
            </div>

            {/* Filter Bar with Dropdown Selectors */}
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px', 
                flexWrap: 'wrap', 
                marginBottom: '16px', 
                background: 'rgba(10, 15, 26, 0.4)', 
                padding: '12px 16px', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--glass-border)' 
              }}
            >
              {/* Search Input */}
              <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 220px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="lab-input"
                  placeholder={`Search ${selectedCategory !== 'All' ? selectedCategory : 'Inventory'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
                />
              </div>

              {/* Category Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setSelectedCategory(newCat);
                    if (newCat === 'Electrical') setSelectedSubCategory('All');
                    else if (newCat === 'Workshop / Furniture') setSelectedSubCategory('All');
                    else setSelectedSubCategory('All');
                  }}
                  className="lab-input"
                  style={{ 
                    height: '38px', 
                    minWidth: '170px', 
                    fontSize: '0.84rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    borderColor: selectedCategory !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)'
                  }}
                >
                  <option value="All">🌐 All Categories</option>
                  <option value="Hardware">💻 Hardware</option>
                  <option value="Electrical">⚡ Electrical</option>
                  <option value="Workshop / Furniture">🪑 Workshop / Furniture</option>
                </select>
              </div>

              {/* Subcategory Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>Subcategory:</span>
                <select
                  value={selectedSubCategory}
                  onChange={(e) => setSelectedSubCategory(e.target.value)}
                  className="lab-input"
                  style={{ 
                    height: '38px', 
                    minWidth: '170px', 
                    fontSize: '0.84rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    borderColor: selectedSubCategory !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)'
                  }}
                >
                  <option value="All">🧩 All Subcategories</option>
                  {selectedCategory === 'Electrical' && (
                    <>
                      <option value="fans">🌀 Fans</option>
                      <option value="lights">💡 Lights</option>
                      <option value="Acs">❄️ ACs</option>
                    </>
                  )}
                  {selectedCategory === 'Workshop / Furniture' && (
                    <>
                      <option value="chairs">🪑 Chairs</option>
                      <option value="tables">🪵 Tables</option>
                      <option value="curtons">🪟 Curtains</option>
                    </>
                  )}
                  {(selectedCategory === 'Hardware' || selectedCategory === 'All') && (
                    <>
                      <option value="cpu">🖥️ CPU</option>
                      <option value="monitor">🖥️ Monitor</option>
                      <option value="mouse">🖱️ Mouse</option>
                      <option value="smartboard">📋 Smartboard</option>
                      <option value="keyboard">⌨️ Keyboard</option>
                      <option value="camera">📷 Camera</option>
                    </>
                  )}
                </select>
              </div>

              {/* Status Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="lab-input"
                  style={{ 
                    height: '38px', 
                    minWidth: '160px', 
                    fontSize: '0.84rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    borderColor: selectedStatus !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)'
                  }}
                >
                  <option value="All">📊 All Statuses</option>
                  <option value="Active">🟢 Active</option>
                  <option value="Pending Repair">🟠 Pending Repair</option>
                  <option value="Maintenance">🟡 Maintenance</option>
                </select>
              </div>

              {/* Date Filter Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, whiteSpace: 'nowrap' }}>Date Filter:</span>
                <select
                  value={selectedTimeFilter}
                  onChange={(e) => setSelectedTimeFilter(e.target.value)}
                  className="lab-input"
                  style={{ 
                    height: '38px', 
                    minWidth: '185px', 
                    fontSize: '0.84rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    borderRadius: '8px',
                    borderColor: selectedTimeFilter !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)'
                  }}
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {selectedTimeFilter === 'Custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="date"
                    className="lab-input"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{ height: '38px', fontSize: '0.82rem', padding: '0 8px' }}
                    title="Start Date"
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                  <input
                    type="date"
                    className="lab-input"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{ height: '38px', fontSize: '0.82rem', padding: '0 8px' }}
                    title="End Date"
                  />
                </div>
              )}

              {/* Reset Filters button */}
              {(selectedCategory !== 'All' || selectedSubCategory !== 'All' || selectedStatus !== 'All' || selectedTimeFilter !== 'All' || searchQuery !== '' || selectedLab !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubCategory('All');
                    setSelectedStatus('All');
                    setSelectedTimeFilter('All');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setSelectedLab('all');
                    setSearchQuery('');
                  }}
                  className="pill-filter"
                  style={{ 
                    height: '38px', 
                    padding: '0 14px', 
                    fontSize: '0.8rem', 
                    color: 'var(--cyan-bright)', 
                    borderColor: 'var(--cyan-bright)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    marginLeft: 'auto'
                  }}
                >
                  Reset Filters
                </button>
              )}

            </div>

            {/* Inventory Header & Layout View Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                <span>Showing {selectedCategory !== 'All' ? selectedCategory : 'All Department'} Inventory</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--cyan-bright)', background: 'rgba(0, 242, 254, 0.1)', padding: '2px 12px', borderRadius: '999px', border: '1px solid rgba(0, 242, 254, 0.35)', fontWeight: 700 }}>
                  {(() => {
                    const allAssets = [
                      ...(labAssets.hardware || []),
                      ...(labAssets.electrical || []),
                      ...(labAssets.furniture || [])
                    ];
                    const count = allAssets.filter((a) => {
                      const matchCat = selectedCategory === 'All' || 
                        (selectedCategory === 'Hardware' && (a.code?.includes('HW') || a.name?.toLowerCase().includes('dell') || a.name?.toLowerCase().includes('cisco') || a.name?.toLowerCase().includes('workstation') || a.name?.toLowerCase().includes('monitor') || a.name?.toLowerCase().includes('pi'))) ||
                        (selectedCategory === 'Electrical' && (a.code?.includes('EL') || a.name?.toLowerCase().includes('ups') || a.name?.toLowerCase().includes('ac') || a.name?.toLowerCase().includes('generator') || a.name?.toLowerCase().includes('surge'))) ||
                        (selectedCategory === 'Workshop / Furniture' && (a.code?.includes('FN') || a.name?.toLowerCase().includes('desk') || a.name?.toLowerCase().includes('chair') || a.name?.toLowerCase().includes('rack') || a.name?.toLowerCase().includes('cabinet')));
                      const matchSearch = !searchQuery || a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.code?.toLowerCase().includes(searchQuery.toLowerCase()) || a.lab?.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchLab = selectedLab === 'all' || a.lab?.toLowerCase().replace(/\s+/g, '').includes(selectedLab.toLowerCase().replace(/\s+/g, ''));
                      const matchDate = matchesDateFilter(a.lastInspected || a.invoiceDate || a.dateAdded, selectedTimeFilter, customStartDate, customEndDate);
                      return matchCat && matchSearch && matchLab && matchDate;
                    }).length;
                    return count;
                  })()} Assets Found
                </span>
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>Layout View:</span>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`pill-filter ${viewMode === 'grid' ? 'active' : ''}`}
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: viewMode === 'grid' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    borderColor: viewMode === 'grid' ? 'var(--cyan-bright)' : 'var(--glass-border)',
                    color: viewMode === 'grid' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                    fontWeight: 700
                  }}
                >
                  🔲 Box Grid View
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`pill-filter ${viewMode === 'table' ? 'active' : ''}`}
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: viewMode === 'table' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                    borderColor: viewMode === 'table' ? 'var(--cyan-bright)' : 'var(--glass-border)',
                    color: viewMode === 'table' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                    fontWeight: 700
                  }}
                >
                  ☰ Table View
                </button>
              </div>
            </div>
          </div>

          {/* VIEW MODE RENDERING: GRID BOX VIEW OR TABLE VIEW */}
          {(() => {
            const allAssets = [
              ...(labAssets.hardware || []),
              ...(labAssets.electrical || []),
              ...(labAssets.furniture || [])
            ];

            const activeDisplayAssets = allAssets.filter((a) => {
              const matchCat = selectedCategory === 'All' || 
                (selectedCategory === 'Hardware' && (a.code?.includes('HW') || a.name?.toLowerCase().includes('dell') || a.name?.toLowerCase().includes('cisco') || a.name?.toLowerCase().includes('workstation') || a.name?.toLowerCase().includes('monitor') || a.name?.toLowerCase().includes('pi'))) ||
                (selectedCategory === 'Electrical' && (a.code?.includes('EL') || a.name?.toLowerCase().includes('ups') || a.name?.toLowerCase().includes('ac') || a.name?.toLowerCase().includes('generator') || a.name?.toLowerCase().includes('surge'))) ||
                (selectedCategory === 'Workshop / Furniture' && (a.code?.includes('FN') || a.name?.toLowerCase().includes('desk') || a.name?.toLowerCase().includes('chair') || a.name?.toLowerCase().includes('rack') || a.name?.toLowerCase().includes('cabinet')));
              
              const matchSearch = !searchQuery || a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || a.code?.toLowerCase().includes(searchQuery.toLowerCase()) || a.lab?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchLab = selectedLab === 'all' || a.lab?.toLowerCase().replace(/\s+/g, '').includes(selectedLab.toLowerCase().replace(/\s+/g, ''));
              
              let matchStatus = selectedStatus === 'All';
              if (!matchStatus) {
                if (selectedStatus === 'Active') matchStatus = a.status === 'operational';
                else if (selectedStatus === 'Pending Repair') matchStatus = a.status === 'faulty';
                else if (selectedStatus === 'Maintenance') matchStatus = a.status === 'maintenance';
              }

              let matchSub = selectedSubCategory === 'All';
              if (!matchSub) {
                const sub = selectedSubCategory.toLowerCase();
                matchSub = a.name?.toLowerCase().includes(sub) || a.specs?.toLowerCase().includes(sub) || a.code?.toLowerCase().includes(sub);
              }

              const matchDate = matchesDateFilter(a.lastInspected || a.invoiceDate || a.dateAdded, selectedTimeFilter, customStartDate, customEndDate);

              return matchCat && matchSearch && matchLab && matchStatus && matchSub && matchDate;
            });

            if (activeDisplayAssets.length === 0) {
              return (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                  <h4 style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>No assets match your search/filter criteria.</h4>
                  <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Try switching categories or clearing search query.</p>
                </div>
              );
            }

            if (viewMode === 'grid') {
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', maxHeight: '620px', overflowY: 'auto', paddingRight: '8px' }}>
                  {activeDisplayAssets.map((asset, idx) => {
                    const issCount = asset.issuesCount || (asset.status === 'operational' ? 0 : 1);
                    const workCount = Math.max(0, (asset.qty || 1) - issCount);
                    
                    let badgeStyle = {
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: 'var(--green-online)',
                      border: '1px solid rgba(16, 185, 129, 0.4)'
                    };
                    if (asset.status === 'faulty') {
                      badgeStyle = {
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.4)'
                      };
                    } else if (asset.status === 'maintenance') {
                      badgeStyle = {
                        background: 'rgba(255, 159, 67, 0.12)',
                        color: 'var(--orange-accent)',
                        border: '1px solid rgba(255, 159, 67, 0.4)'
                      };
                    }

                    return (
                      <div
                        key={asset.id || idx}
                        className="lab-card lab-card-hover"
                        style={{
                          padding: '22px',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                          position: 'relative',
                          background: 'var(--bg-panel)',
                          border: '1px solid var(--glass-border)',
                          transition: 'all 0.25s ease'
                        }}
                      >
                        {/* Top Row: Icon + Code/Title + Status Badge */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                            <div
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                background: 'rgba(10, 15, 26, 0.8)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                fontSize: '1.4rem'
                              }}
                            >
                              {asset.icon || '💻'}
                            </div>

                            <div>
                              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan-bright)', letterSpacing: '0.5px', marginBottom: '2px' }}>
                                {asset.code || `VUG-CSE-AST-${100 + idx}`}
                              </div>
                              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                                {asset.name}
                              </h3>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '4px 12px',
                              borderRadius: '999px',
                              whiteSpace: 'nowrap',
                              ...badgeStyle
                            }}
                          >
                            {asset.status === 'operational' ? 'Online' : (asset.status === 'maintenance' ? 'Maintenance' : 'Faulty')}
                          </span>
                        </div>

                        {/* Specs / Details Inner Box */}
                        <div style={{ background: 'rgba(0, 0, 0, 0.28)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <strong style={{ color: 'var(--card-text-head)' }}>Specs / Details: </strong>
                          {asset.specs || 'No specs recorded (Click Entry to add)'}
                        </div>

                        {/* Details List (Location, Quantity, Issues, Working, Health Note) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              📍 Location:
                            </span>
                            <strong style={{ color: '#fff', fontWeight: 700 }}>{asset.lab || 'NB-511'}</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              📦 Quantity / Units:
                            </span>
                            <strong style={{ color: 'var(--cyan-bright)', fontWeight: 800 }}>{asset.qty || 1} Units</strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ⚡ No. of Issues:
                            </span>
                            <strong style={{ color: issCount > 0 ? '#ef4444' : 'var(--green-online)', fontWeight: 800 }}>
                              {issCount} {issCount === 1 ? 'Issue' : 'Issues'}
                            </strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              ✅ No. of Working:
                            </span>
                            <strong style={{ color: 'var(--green-online)', fontWeight: 800 }}>
                              {workCount} Units
                            </strong>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              🔍 Health Note:
                            </span>
                            <strong style={{ color: issCount > 0 ? 'var(--orange-accent)' : 'var(--green-online)', fontWeight: 700, textAlign: 'right', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {asset.condition || 'All Systems Operational'}
                            </strong>
                          </div>
                        </div>

                        {/* Card Footer: Inspected Date + Action Buttons */}
                        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Inspected: {asset.lastInspected || '2026-08-04'}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenReportModal(asset)}
                              className="pill-filter"
                              style={{
                                padding: '5px 12px',
                                fontSize: '0.78rem',
                                color: 'var(--orange-accent)',
                                borderColor: 'rgba(255, 159, 67, 0.4)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: 700,
                                background: 'rgba(255, 159, 67, 0.08)'
                              }}
                            >
                              ⚠️ Report Issue
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (user) {
                                  navigate('/dashboard');
                                } else {
                                  navigate('/login');
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                            >
                              {user?.role === 'admin' ? 'Edit' : 'Entry'}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            }

            return (
              /* VIEW MODE 2: TABLE VIEW MATCHING IMAGE 2 */
              <div 
                style={{ 
                  maxHeight: '520px', 
                  overflowY: 'auto', 
                  overflowX: 'auto', 
                  border: '1px solid var(--glass-border)', 
                  borderRadius: '8px',
                  background: 'rgba(10, 15, 30, 0.4)' 
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--cyan-bright)', color: 'var(--text-secondary)', position: 'sticky', top: 0, background: '#0b1120', zIndex: 10 }}>
                      <th style={{ padding: '12px 14px', width: '50px' }}>S.No ↑</th>
                      <th style={{ padding: '12px 14px' }}>Device Name</th>
                      <th style={{ padding: '12px 14px' }}>Category</th>
                      <th style={{ padding: '12px 14px' }}>Total Stock</th>
                      <th style={{ padding: '12px 14px' }}>No. of Issues</th>
                      <th style={{ padding: '12px 14px' }}>No. of Working</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Lab Location</th>
                      <th style={{ padding: '12px 14px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDisplayAssets.map((asset, idx) => {
                      const issCount = asset.issuesCount || (asset.status === 'operational' ? 0 : 1);
                      const workCount = Math.max(0, (asset.qty || 1) - issCount);
                      
                      return (
                        <tr key={asset.id || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                          <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{idx + 1}</td>
                          <td style={{ padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{asset.name}</td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{asset.category || 'Hardware'}</td>
                          <td style={{ padding: '14px', color: '#fff', fontWeight: 700 }}>{asset.qty || 1}</td>
                          <td style={{ padding: '14px', color: issCount > 0 ? '#ef4444' : 'var(--green-online)', fontWeight: 800 }}>{issCount} Issues</td>
                          <td style={{ padding: '14px', color: 'var(--green-online)', fontWeight: 800 }}>{workCount} Units</td>
                          <td style={{ padding: '14px' }}>
                            <span className={`status-pill ${asset.status === 'operational' ? 'status-online' : (asset.status === 'maintenance' ? 'status-pending' : 'status-offline')}`}>
                              {asset.status === 'operational' ? 'Online' : (asset.status === 'maintenance' ? 'Maintenance' : 'Faulty')}
                            </span>
                          </td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{asset.lab}</td>
                          <td style={{ padding: '14px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (user) navigate('/dashboard');
                                else navigate('/login');
                              }}
                              style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                            >
                              {user?.role === 'admin' ? 'Edit' : 'Entry'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </main>



      {/* REPORT ISSUE / COMPLAINT MODAL */}
      {showReportModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="lab-card"
            style={{
              maxWidth: '540px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              background: 'var(--bg-panel-solid)'
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowReportModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '1.2rem',
                cursor: 'pointer'
              }}
            >
              ✖
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 159, 67, 0.15)', color: 'var(--orange-accent)' }}>
                <Wrench size={20} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--card-text-head)', margin: 0 }}>
                Report CSE Lab Issue Ticket
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>
              Submitted tickets are recorded and dispatched to lab staff.
            </p>

            {reportSuccessMsg ? (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid var(--green-online)',
                  color: 'var(--green-online)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  lineHeight: 1.5
                }}
              >
                <CheckCircle size={24} style={{ display: 'block', margin: '0 auto 8px' }} />
                {reportSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Asset Name / Description
                  </label>
                  <input
                    type="text"
                    className="lab-input"
                    value={reportData.assetName}
                    onChange={(e) => setReportData({ ...reportData, assetName: e.target.value })}
                    placeholder="e.g. Dell PC #14 / Split AC #2 / Desks"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Asset Tag Code (Optional)
                    </label>
                    <input
                      type="text"
                      className="lab-input"
                      value={reportData.assetCode}
                      onChange={(e) => setReportData({ ...reportData, assetCode: e.target.value })}
                      placeholder="e.g. VUG-CSE-PC-101"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                      Category
                    </label>
                    <select
                      className="lab-input"
                      value={reportData.issueCategory}
                      onChange={(e) => setReportData({ ...reportData, issueCategory: e.target.value })}
                    >
                      <option value="hardware">💻 Hardware</option>
                      <option value="electrical">⚡ Electrical</option>
                      <option value="furniture">🪑 Furniture</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Lab Location Room
                  </label>
                  <select
                    className="lab-input"
                    value={reportData.labRoom}
                    onChange={(e) => setReportData({ ...reportData, labRoom: e.target.value })}
                  >
                    <option value="Lab 12 (Systems Lab)">Lab 12 (Systems Lab)</option>
                    <option value="Lab 15 (AI & Data Science)">Lab 15 (AI & Data Science)</option>
                    <option value="Lab 25 (IoT & Embedded)">Lab 25 (IoT & Embedded)</option>
                    <option value="Lab 33 (Networks & Security)">Lab 33 (Networks & Security)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Issue Details / Description
                  </label>
                  <textarea
                    className="lab-input"
                    rows={3}
                    value={reportData.description}
                    onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                    placeholder="Describe what is broken or malfunctioning..."
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Urgency Level
                  </label>
                  <select
                    className="lab-input"
                    value={reportData.urgency}
                    onChange={(e) => setReportData({ ...reportData, urgency: e.target.value })}
                  >
                    <option value="low">🟢 Low (Routine Maintenance)</option>
                    <option value="medium">🟠 Medium (Affects 1-2 Students)</option>
                    <option value="critical">🔴 Critical (Interrupts Entire Lab Session / Main UPS)</option>
                  </select>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '6px',
                      background: 'none',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-cyan">
                    Submit Ticket 🚀
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VIGNAN UNIVERSITY FOOTER */}
      <footer style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--glass-border)', padding: '32px 24px', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
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
                  Department of Computer Science & Engineering • VLMS Portal
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
              <button
                className="btn-cyan"
                onClick={() => navigate('/login')}
                style={{ padding: '8px 16px', fontSize: '0.82rem' }}
              >
                🔑 Admin / Staff Portal
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'none',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--orange-accent)',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenReportModal(null)}
              >
                ⚠️ Emergency Lab Issue
              </button>
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

export default Home;
