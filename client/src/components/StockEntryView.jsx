import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Cpu, Zap, Wrench, Shield, ArrowUpRight, Filter, AlertCircle, RefreshCw, Layers, Edit2, Trash2, Lock, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import { getAssignedStaffLabs, isInactiveLab } from '../utils/staffLabs';
import { printStockEntries } from '../utils/printHelper';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';

export const StockEntryView = ({ selectedLab: globalSelectedLab, onReload }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';
  const [selectedLab, setSelectedLab] = useState(globalSelectedLab || (isAdmin ? 'All' : userLab));
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedSubCat, setSelectedSubCat] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (globalSelectedLab) {
      setSelectedLab(globalSelectedLab);
    }
  }, [globalSelectedLab]);

  const defaultStockList = [];

  const [stockItems, setStockItems] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_stock_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return defaultStockList;
  });

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [specs, setSpecs] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [subCategory, setSubCategory] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(100);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [labLocation, setLabLocation] = useState(!isAdmin ? userLab : 'Lab 12');

  useEffect(() => {
    loadStock();
  }, []);

  const matchesLabScope = (labStr) => {
    if (!labStr || isInactiveLab(labStr)) return false;

    const targetLab = globalSelectedLab || selectedLab || (isAdmin ? 'All' : userLab);
    if (!targetLab || targetLab === 'All' || targetLab === 'all' || String(targetLab).toLowerCase().includes('all')) return true;

    const targetClean = String(targetLab).toLowerCase().replace(/\s+/g, '');
    const labClean = String(labStr).toLowerCase().replace(/\s+/g, '');

    if (targetClean === labClean) return true;

    const targetDigits = targetClean.replace(/[^0-9]/g, '');
    const labDigits = labClean.replace(/[^0-9]/g, '');

    if (targetDigits && labDigits && targetDigits === labDigits && targetDigits.length >= 2) {
      return true;
    }

    return labClean.includes(targetClean) || targetClean.includes(labClean);
  };

  useEffect(() => {
    localStorage.setItem('vlms_stock_list', JSON.stringify(stockItems));
    localStorage.setItem('vlms_stock_entries', JSON.stringify(stockItems));
    window.dispatchEvent(new Event('storage'));
  }, [stockItems]);

  const loadStock = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/stock');
      if (Array.isArray(data)) {
        setStockItems(data);
      }
    } catch (err) {
      console.error('Error fetching stock from MongoDB Atlas:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setCode('');
    setName('');
    setSpecs('');
    setCategory('Hardware');
    setSubCategory('cpu');
    setQuantity(10);
    setUnitCost(100);
    setInvoiceNo('');
    setSerialNo('');
    setInvoiceDate('');
    setSupplier('');
    setLabLocation(!isAdmin ? userLab : 'Lab A');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setCode(item.id || '');
    setName(item.name || '');
    setSpecs(item.specs || item.details || '');
    setCategory(item.category || 'Hardware');
    setSubCategory(item.subCategory || 'cpu');
    setQuantity(item.quantity || 0);
    setUnitCost(item.unitCost || 0);
    setInvoiceNo(item.invoiceNo || '');
    setSerialNo(item.serialNo || '');
    setInvoiceDate(item.invoiceDate || '');
    setSupplier(item.supplier || '');
    setLabLocation(item.labLocation || 'Lab A');
    setShowModal(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      const cleanSpecs = (specs || '').trim();
      const targetLab = !isAdmin ? userLab : labLocation;

      if (editingItem) {
        // Edit existing stock item
        const payload = {
          name,
          category,
          subCategory,
          specs: cleanSpecs,
          details: cleanSpecs,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          invoiceNo,
          serialNo,
          invoiceDate,
          labLocation: targetLab,
          supplier
        };

        const res = await fetchAPI(`/stock/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        if (res && res.item) {
          const updatedItem = { ...res.item, specs: cleanSpecs, details: cleanSpecs };
          setStockItems(stockItems.map((i) => (i.id === editingItem.id ? updatedItem : i)));
        } else {
          setStockItems(stockItems.map((i) => (i.id === editingItem.id ? { ...i, ...payload } : i)));
        }
      } else {
        // Create new stock entry
        const prefix = category === 'Hardware' ? 'HW' : category === 'Electrical' ? 'EL' : 'WF';
        const generatedCode = code.trim() || `STK-${prefix}-${Math.floor(Math.random() * 800 + 100)}`;
        
        const payload = {
          id: generatedCode,
          name,
          category,
          subCategory: subCategory || 'cpu',
          specs: cleanSpecs,
          details: cleanSpecs,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
          invoiceNo,
          serialNo,
          invoiceDate,
          labLocation: targetLab,
          supplier: supplier || 'Approved Vendor',
          userRole: user?.role,
          userDepartment: user?.department,
          status: Number(quantity) > 8 ? 'In Stock' : 'Low Stock',
          dateAdded: new Date().toISOString().split('T')[0]
        };

        let newItem = payload;
        try {
          const res = await fetchAPI('/stock', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
          if (res && res.item) {
            newItem = { ...res.item, specs: cleanSpecs || res.item.specs, details: cleanSpecs || res.item.details };
          }
        } catch (apiErr) {
          console.warn('API save fallback to local state:', apiErr.message);
        }

        const updatedList = [newItem, ...stockItems];
        setStockItems(updatedList);
        localStorage.setItem('vlms_stock_list', JSON.stringify(updatedList));
        localStorage.setItem('vlms_stock_entries', JSON.stringify(updatedList));
      }

      setShowModal(false);
      window.dispatchEvent(new Event('storage'));
      if (onReload) onReload();
    } catch (err) {
      alert(err.message || 'Error saving stock entry');
    }
  };

  const handleDeleteStock = async (id) => {
    if (!isAdmin) {
      alert('Access Denied: Only Administrators are authorized to delete stock records.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete stock item ${id}?`)) {
      try {
        await fetchAPI(`/stock/${id}?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {
        console.log('API delete call fallback');
      }
      const updated = stockItems.filter((i) => (i?.id || i?._id) !== id);
      setStockItems(updated);
      localStorage.setItem('vlms_stock_list', JSON.stringify(updated));
      if (onReload) onReload();
    }
  };

  const handleClearAllStock = async () => {
    if (!isAdmin) {
      alert('Access Denied: Only Administrators can clear all stock records.');
      return;
    }
    if (window.confirm('⚠️ ARE YOU SURE? This will DELETE ALL stock items across all labs!')) {
      try {
        await fetchAPI(`/stock/clear/all?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {}
      setStockItems([]);
      localStorage.setItem('vlms_stock_list', JSON.stringify([]));
    }
  };

  const handleAdjustQuantity = (id, delta) => {
    const updated = stockItems.map((item) => {
      if (!item) return item;
      const itemIdKey = item.id || item._id;
      if (itemIdKey === id) {
        const currentQty = Number(item.quantity) || 0;
        const newQty = Math.max(0, currentQty + delta);
        return {
          ...item,
          quantity: newQty,
          status: newQty > 8 ? 'In Stock' : newQty > 0 ? 'Low Stock' : 'Out of Stock'
        };
      }
      return item;
    });
    setStockItems(updated);
    localStorage.setItem('vlms_stock_list', JSON.stringify(updated));
  };

  const filteredStock = stockItems.filter((item) => {
    if (!item) return false;
    const itemIdVal = String(item.id || item._id || '').toLowerCase();
    const itemNameVal = String(item.name || item.deviceName || '').toLowerCase();
    const itemSupplier = String(item.supplier || '').toLowerCase();
    const itemInvoiceNo = String(item.invoiceNo || '').toLowerCase();
    const itemSerialNo = String(item.serialNo || '').toLowerCase();
    const itemCategory = String(item.category || '').toLowerCase();

    const q = (search || '').toLowerCase();
    const matchesSearch =
      !q ||
      itemIdVal.includes(q) ||
      itemNameVal.includes(q) ||
      itemSupplier.includes(q) ||
      itemInvoiceNo.includes(q) ||
      itemSerialNo.includes(q) ||
      itemCategory.includes(q);

    const matchesCat = selectedCat === 'All' || item.category === selectedCat;
    const matchesSubCat = selectedSubCat === 'All' || (item.subCategory && String(item.subCategory).toLowerCase() === selectedSubCat.toLowerCase());
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;
    const matchesLab = matchesLabScope(item.labLocation);
    const matchesDate = matchesDateFilter(item.invoiceDate || item.dateAdded || item.createdAt, selectedDateFilter, customStart, customEnd);

    return matchesSearch && matchesCat && matchesSubCat && matchesStatus && matchesLab && matchesDate;
  });

  const scopedStockItems = stockItems.filter((i) => i && matchesLabScope(i.labLocation));

  const hwCount = scopedStockItems.filter((i) => i?.category === 'Hardware').reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const elCount = scopedStockItems.filter((i) => i?.category === 'Electrical').reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const wsCount = scopedStockItems.filter((i) => i?.category && String(i.category).includes('Workshop')).reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);

  const renderItemWiseList = (catName, themeColor) => {
    let subCategoriesList = [];
    if (catName === 'Hardware') {
      subCategoriesList = [
        { key: 'cpu', label: 'CPU' },
        { key: 'monitor', label: 'Monitor' },
        { key: 'mouse', label: 'Mouse' },
        { key: 'smartboard', label: 'Smartboard' },
        { key: 'keyboard', label: 'Keyboard' },
        { key: 'camera', label: 'Camera' }
      ];
    } else if (catName === 'Electrical') {
      subCategoriesList = [
        { key: 'fans', label: 'Fans' },
        { key: 'lights', label: 'Lights' },
        { key: 'acs', label: 'ACs' }
      ];
    } else {
      subCategoriesList = [
        { key: 'chairs', label: 'Chairs' },
        { key: 'tables', label: 'Tables' },
        { key: 'curtons', label: 'Curtains' }
      ];
    }

    const counts = {};
    scopedStockItems.forEach(item => {
      if (item && (item.category === catName || (catName.includes('Workshop') && String(item.category).includes('Workshop')))) {
        const sub = String(item.subCategory || item.name || '').toLowerCase();
        const qty = Number(item.quantity) || 0;
        for (const sObj of subCategoriesList) {
          if (sub.includes(sObj.key.toLowerCase())) {
            counts[sObj.key] = (counts[sObj.key] || 0) + qty;
          }
        }
      }
    });

    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '5px', 
          background: 'rgba(0, 0, 0, 0.25)', 
          padding: '10px 12px', 
          borderRadius: '8px', 
          border: `1px solid ${themeColor}30`,
          fontSize: '0.82rem',
          marginTop: '6px'
        }}
      >
        {subCategoriesList.map(({ key, label }) => {
          const val = counts[key] || 0;
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
              <span style={{ color: themeColor, fontWeight: 800 }}>: {val}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Stock Entry & Inventory Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Manage inward stock intake, edit stock items, and adjust inventory levels for Hardware, Electrical, and Workshop equipment
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAdmin && (
            <button 
              onClick={handleClearAllStock} 
              className="pill-filter" 
              style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <Trash2 size={15} /> Delete All Items
            </button>
          )}

          <button 
            onClick={loadStock} 
            className="pill-filter" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} /> Sync Data
          </button>

          <button 
            onClick={() => printStockEntries(filteredStock, selectedLab)} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 16px', fontSize: '0.85rem', background: 'rgba(0,242,254,0.15)', borderColor: 'var(--cyan-bright)', color: 'var(--cyan-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Stock Entry List / Generate PDF"
          >
            <Printer size={16} /> Print Stock (PDF)
          </button>

          <button onClick={openAddModal} className="btn-cyan" style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}>
            <Plus size={16} /> New Stock Intake Entry
          </button>
        </div>
      </div>

      {/* Category Metric Cards: Hardware, Electrical, Workshop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
        
        {/* Hardware Stock Card */}
        <div 
          onClick={() => setSelectedCat('Hardware')}
          className={`lab-card lab-card-hover ${selectedCat === 'Hardware' ? 'active-card' : ''}`} 
          style={{ padding: '20px', border: `1px solid ${selectedCat === 'Hardware' ? 'var(--cyan-bright)' : 'rgba(0, 242, 254, 0.2)'}`, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid var(--cyan-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} color="var(--cyan-bright)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Hardware Stock</h3>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(0,242,254,0.15)', color: 'var(--cyan-bright)', fontWeight: 700 }}>
              IT Assets
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{hwCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Units</span>
          </div>

          {renderItemWiseList('Hardware', 'var(--cyan-bright)')}
        </div>

        {/* Electrical Stock Card */}
        <div 
          onClick={() => setSelectedCat('Electrical')}
          className={`lab-card lab-card-hover ${selectedCat === 'Electrical' ? 'active-card' : ''}`} 
          style={{ padding: '20px', border: `1px solid ${selectedCat === 'Electrical' ? 'var(--orange-accent)' : 'rgba(255, 159, 67, 0.2)'}`, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(255, 159, 67, 0.12)', border: '1px solid var(--orange-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="var(--orange-accent)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Electrical Stock</h3>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(255,159,67,0.15)', color: 'var(--orange-accent)', fontWeight: 700 }}>
              Power & Wiring
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--orange-accent)' }}>{elCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Units</span>
          </div>

          {renderItemWiseList('Electrical', 'var(--orange-accent)')}
        </div>

        {/* Workshop / Furniture Stock Card */}
        <div 
          onClick={() => setSelectedCat('Workshop / Furniture')}
          className={`lab-card lab-card-hover ${selectedCat === 'Workshop / Furniture' ? 'active-card' : ''}`} 
          style={{ padding: '20px', border: `1px solid ${selectedCat === 'Workshop / Furniture' ? 'var(--green-online)' : 'rgba(16, 185, 129, 0.2)'}`, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--green-online)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} color="var(--green-online)" />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Workshop & Furniture</h3>
            </div>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '999px', background: 'rgba(16,185,129,0.15)', color: 'var(--green-online)', fontWeight: 700 }}>
              Tools & Seating
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green-online)' }}>{wsCount}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Units</span>
          </div>

          {renderItemWiseList('Workshop / Furniture', 'var(--green-online)')}
        </div>

      </div>

      {/* Main Stock Inventory Section */}
      <div className="lab-card" style={{ padding: '24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Stock Entry Overview</h2>
        </div>

        {/* Scope Banner */}
        <div 
          style={{ 
            padding: '12px 18px', 
            marginBottom: '24px', 
            borderRadius: 'var(--radius-sm)', 
            background: isAdmin ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 159, 67, 0.08)', 
            border: `1px solid ${isAdmin ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '12px',
            fontSize: '0.86rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAdmin ? (
              <Shield size={18} color="var(--cyan-bright)" />
            ) : (
              <Lock size={18} color="var(--orange-accent)" />
            )}
            <div>
              <strong style={{ color: '#fff' }}>
                {isAdmin ? 'System Administrator Stock Access:' : `Staff Stock Scope (${userLab}):`}
              </strong>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {isAdmin 
                  ? 'Full access to add, edit, and adjust stock intake entries across ALL lab rooms.' 
                  : `Restricted view. Viewing and intake limited to ${userLab}.`}
              </span>
            </div>
          </div>
        </div>

        {/* Filters Bar with Dropdown Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          
          {/* Search Stock Entry Input */}
          <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="lab-input"
              placeholder="Search Stock Entry..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {/* 1. Lab Scope Dropdown (Only Active / Staff Assigned Labs) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Lab Scope:</span>
            {isAdmin ? (
              <select
                value={selectedLab}
                onChange={(e) => setSelectedLab(e.target.value)}
                className="lab-input"
                style={{ width: '160px', height: '38px', fontSize: '0.82rem', padding: '0 10px', cursor: 'pointer', fontWeight: 600 }}
              >
                <option value="All">All Active Labs</option>
                {Array.from(new Set([
                  ...getAssignedStaffLabs(),
                  ...stockItems.map(s => s?.labLocation).filter(Boolean)
                ])).map(lab => (
                  <option key={lab} value={lab}>📍 {lab}</option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--orange-accent)', padding: '6px 12px', background: 'rgba(255, 159, 67, 0.12)', borderRadius: '6px', border: '1px solid rgba(255, 159, 67, 0.3)' }}>
                🔒 {userLab}
              </span>
            )}
          </div>

          {/* 2. Category Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Category:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="lab-input"
              style={{ width: '170px', height: '38px', fontSize: '0.82rem', padding: '0 10px', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="All">📦 All Categories</option>
              <option value="Hardware">💻 Hardware</option>
              <option value="Electrical">⚡ Electrical</option>
              <option value="Workshop / Furniture">🪑 Workshop / Furniture</option>
            </select>
          </div>

          {/* 3. Subcategory Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Subcategory:</span>
            <select
              value={selectedSubCat}
              onChange={(e) => setSelectedSubCat(e.target.value)}
              className="lab-input"
              style={{ width: '160px', height: '38px', fontSize: '0.82rem', padding: '0 10px', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="All">🧩 All Subcategories</option>
              {['cpu', 'monitor', 'mouse', 'smartboard', 'keyboard', 'fans', 'lights', 'Acs', 'chairs', 'tables', 'curtons', 'camera'].map((scat) => (
                <option key={scat} value={scat}>{scat}</option>
              ))}
            </select>
          </div>

          {/* 4. Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="lab-input"
              style={{ width: '150px', height: '38px', fontSize: '0.82rem', padding: '0 10px', cursor: 'pointer', fontWeight: 600 }}
            >
              <option value="All">📊 All Statuses</option>
              <option value="In Stock">🟢 In Stock</option>
              <option value="Low Stock">🟡 Low Stock</option>
              <option value="Out of Stock">🔴 Out of Stock</option>
            </select>
          </div>

          {/* 5. Date Filter (Custom, Monthly, Quarterly, Yearly) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Date Filter:</span>
            <select
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="lab-input"
              style={{ width: '185px', height: '38px', fontSize: '0.82rem', padding: '0 10px', cursor: 'pointer', fontWeight: 600, borderColor: selectedDateFilter !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)' }}
            >
              {DATE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {selectedDateFilter === 'Custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="date"
                className="lab-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{ height: '38px', fontSize: '0.8rem', padding: '0 8px' }}
                title="Start Date"
              />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
              <input
                type="date"
                className="lab-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{ height: '38px', fontSize: '0.8rem', padding: '0 8px' }}
                title="End Date"
              />
            </div>
          )}

          {/* Reset Filters button */}
          {(selectedCat !== 'All' || selectedSubCat !== 'All' || selectedStatus !== 'All' || selectedDateFilter !== 'All' || search !== '') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCat('All');
                setSelectedSubCat('All');
                setSelectedStatus('All');
                setSelectedDateFilter('All');
                setCustomStart('');
                setCustomEnd('');
                setSearch('');
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

        {/* Scrollbar Container Layout (Visible Items) */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--cyan-bright)' }}>Syncing Stock Intake Data...</div>
        ) : (
          <div 
            style={{ 
              maxHeight: '220px', 
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
                  <th style={{ padding: '12px 14px' }}>SKU Code</th>
                  <th style={{ padding: '12px 14px' }}>Equipment Name</th>
                  <th style={{ padding: '12px 14px' }}>Category</th>
                  <th style={{ padding: '12px 14px' }}>Subcategory</th>
                  <th style={{ padding: '12px 14px' }}>Stock Qty</th>
                  <th style={{ padding: '12px 14px' }}>Unit Cost</th>
                  <th style={{ padding: '12px 14px' }}>Invoice No</th>
                  <th style={{ padding: '12px 14px' }}>Serial No</th>
                  <th style={{ padding: '12px 14px' }}>Invoice Date</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Lab Location</th>
                  <th style={{ padding: '12px 14px' }}>Supplier</th>
                  <th style={{ padding: '12px 14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length > 0 ? (
                  filteredStock.map((item, idx) => {
                    if (!item) return null;
                    let statusClass = 'status-online';
                    if (item.status === 'Low Stock') statusClass = 'status-pending';
                    if (item.status === 'Out of Stock') statusClass = 'status-offline';

                    const itemIdKey = item.id || item._id || `STK-${idx + 1}`;
                    const itemNameVal = item.name || item.deviceName || 'Stock Equipment';

                    return (
                      <tr key={itemIdKey || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{idx + 1}</td>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{itemIdKey}</td>
                        <td style={{ padding: '14px', color: '#fff', fontWeight: 600 }}>{itemNameVal}</td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{item.category || 'Hardware'}</td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.subCategory || 'cpu'}</td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              type="button"
                              onClick={() => handleAdjustQuantity(itemIdKey, -1)}
                              style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--glass-border)', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 800, color: '#fff', minWidth: '24px', textAlign: 'center' }}>{item.quantity ?? 0}</span>
                            <button 
                              type="button"
                              onClick={() => handleAdjustQuantity(itemIdKey, 1)}
                              style={{ width: 22, height: 22, borderRadius: '4px', background: 'rgba(0,242,254,0.15)', border: '1px solid var(--cyan-bright)', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 700 }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--text-primary)' }}>${item.unitCost ?? 0}</td>
                        <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.invoiceNo || '-'}</td>
                        <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.serialNo || '-'}</td>
                        <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.invoiceDate || '-'}</td>
                        <td style={{ padding: '14px' }}>
                          <span className={`status-pill ${statusClass}`}>{item.status || 'In Stock'}</span>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{item.labLocation || 'Lab 1'}</td>
                        <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.supplier || '-'}</td>
                        <td style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer' }}
                              title="Edit Stock Item"
                            >
                              <Edit2 size={16} />
                            </button>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(itemIdKey)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                title="Delete Stock Item"
                              >
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => alert('Forbidden: Staff members can entry & update stock for their assigned lab. Deletion requires admin privileges.')}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.5 }}
                                title="Delete Restricted to Admin"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="14" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No stock intake records found matching current scope filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Stock Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              {editingItem ? 'Edit Stock Intake Record' : 'Create New Stock Intake Entry'}
            </h3>

            <form onSubmit={handleSaveStock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {!editingItem && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Item SKU Code (e.g. STK-HW-101)</label>
                  <input type="text" className="lab-input" placeholder="Auto-generated if left blank" value={code} onChange={(e) => setCode(e.target.value)} />
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Equipment Item Name</label>
                <input type="text" required className="lab-input" placeholder="e.g. Oscilloscope 100MHz or Dell Workstation" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Specs / Details</label>
                <input type="text" className="lab-input" placeholder="e.g. Intel Core i7 11th Gen, 32GB DDR4, 1TB NVMe SSD, Nvidia GTX 1650" value={specs} onChange={(e) => setSpecs(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select 
                    className="lab-input" 
                    value={category} 
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setCategory(newCat);
                      if (newCat === 'Electrical') setSubCategory('fans');
                      else if (newCat === 'Workshop / Furniture') setSubCategory('chairs');
                      else setSubCategory('cpu');
                    }}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Workshop / Furniture">Workshop / Furniture</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Sub-Category</label>
                  <select className="lab-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                    {category === 'Electrical' && (
                      <>
                        <option value="fans">fans</option>
                        <option value="lights">lights</option>
                        <option value="Acs">Acs</option>
                      </>
                    )}
                    {category === 'Workshop / Furniture' && (
                      <>
                        <option value="chairs">chairs</option>
                        <option value="tables">tables</option>
                        <option value="curtons">curtons</option>
                      </>
                    )}
                    {(category === 'Hardware' || (!['Electrical', 'Workshop / Furniture'].includes(category))) && (
                      <>
                        <option value="cpu">cpu</option>
                        <option value="monitor">monitor</option>
                        <option value="mouse">mouse</option>
                        <option value="smartboard">smartboard</option>
                        <option value="keyboard">keyboard</option>
                        <option value="camera">camera</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Stock Quantity</label>
                  <input type="number" min="0" required className="lab-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Unit Cost ($)</label>
                  <input type="number" required className="lab-input" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Invoice No</label>
                  <input type="text" className="lab-input" placeholder="e.g. INV-1002" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Invoice Date</label>
                  <input type="date" className="lab-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Lab Room / Assigned Staff Room
                  </label>
                  {!isAdmin ? (
                    <input
                      type="text"
                      disabled
                      className="lab-input"
                      value={`${userLab} (Assigned Staff Room)`}
                      style={{ opacity: 0.85, cursor: 'not-allowed', borderColor: 'var(--orange-accent)', color: '#fff', fontWeight: 700 }}
                    />
                  ) : (
                    <select
                      className="lab-input"
                      value={labLocation}
                      onChange={(e) => setLabLocation(e.target.value)}
                    >
                      {getAssignedStaffLabs().map((lab) => (
                        <option key={lab} value={lab}>{lab} (Assigned Staff Room)</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Supplier / Vendor</label>
                  <input type="text" className="lab-input" placeholder="e.g. Dell, APC, Weller" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan">{editingItem ? 'Update Stock Item' : 'Save Stock Entry'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
