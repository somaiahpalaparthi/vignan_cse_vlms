import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Search, Calendar, Plus, Edit2, Eye, TrendingUp, CheckCircle, Clock, Monitor, Shield, Building, Lock, Filter, Package, Trash2, Sun, Moon, Laptop, Cpu, Keyboard, Server, Zap, Users, Phone } from 'lucide-react';
import { TopHeader } from '../components/TopHeader';
import { CategoriesView } from '../components/CategoriesView';
import { StockEntryView } from '../components/StockEntryView';
import { IssuesView } from '../components/IssuesView';
import { PendingStatusView } from '../components/PendingStatusView';
import { CompletedStatusView } from '../components/CompletedStatusView';
import { ReportsView } from '../components/ReportsView';
import { StaffAccessView } from '../components/StaffAccessView';
import { SettingsView } from '../components/SettingsView';
import { CircleOverviewGraph } from '../components/CircleOverviewGraph';
import { getAssignedStaffLabs, isInactiveLab } from '../utils/staffLabs';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';

class TabErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Tab view render error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="lab-card" style={{ padding: '36px', textAlign: 'center', margin: '40px auto', maxWidth: '560px', border: '1px solid var(--cyan-bright)' }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 800 }}>
            Unable to load view content
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this tab view.'}
          </p>
          <button 
            className="btn-cyan" 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Dashboard = ({ activeTab = 'dashboard', setActiveTab }) => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';

  const defaultHardwareItems = [];

  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return defaultHardwareItems;
  });

  const defaultIssuesSeed = [
    { id: 'ISS-100', deviceId: 'MON-01', equipmentName: 'Dell UltraSharp 24" Monitor', quantity: 1, title: 'Display backlight flickering fixed', category: 'Hardware', subCategory: 'monitor', severity: 'Medium', status: 'Completed', labLocation: 'Lab 12', reportedBy: 'Admin Manager', postedDate: '2026-08-01', resolvedDate: '2026-08-03', daysTaken: '2 Days', assignedTech: { name: 'Ramesh Tech', phone: '9876543210' }, assignedStaff: 'Ramesh Tech' },
    { id: 'ISS-101', deviceId: 'PC-01', equipmentName: 'Workstation CPU Tower i7', quantity: 1, title: 'Workstation boot failure & RAM error', category: 'Hardware', subCategory: 'cpu', severity: 'Critical', status: 'Pending Repair', labLocation: 'Lab 12', reportedBy: 'Admin Manager', postedDate: '2026-08-08', assignedTech: { name: 'Suresh Kumar', phone: '9848012345' }, assignedStaff: 'Suresh Kumar' },
    { id: 'ISS-102', deviceId: 'MON-02', equipmentName: 'UltraSharp 27" Monitor', quantity: 1, title: 'Display flickering on HDMI port', category: 'Hardware', subCategory: 'monitor', severity: 'High', status: 'Pending Repair', labLocation: 'Lab 12', reportedBy: 'Programmer Staff A', postedDate: '2026-08-09', assignedTech: { name: 'Ramesh Tech', phone: '9876543210' }, assignedStaff: 'Ramesh Tech' },
    { id: 'ISS-103', deviceId: 'FAN-03', equipmentName: 'High Efficiency Ceiling Fan', quantity: 1, title: 'Ceiling fan bearing noise & slow rotation', category: 'Electrical', subCategory: 'fans', severity: 'Medium', status: 'Pending Repair', labLocation: 'Lab 25', reportedBy: 'Jamer Smrey', postedDate: '2026-08-10' }
  ];

  const [stockList, setStockList] = useState([]);
  const [issuesList, setIssuesList] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_issues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultIssuesSeed;
  });
  const defaultStaffListSeed = [
    { id: 'usr-1', name: 'Mr.B.SeshuBabu', mobileNumber: '9491186974', department: 'NB-301', status: 'On Leave' },
    { id: 'usr-2', name: 'kattakalyani', mobileNumber: '7981669620', department: 'NB-511', status: 'Active' },
    { id: 'usr-3', name: 'ch sirisha', mobileNumber: '837428829', department: 'NB-304', status: 'Active' },
    { id: 'usr-4', name: 'Programmer Staff A', mobileNumber: '+1 555-0184', department: 'Lab 12', status: 'Active' },
    { id: 'usr-5', name: 'Jamer Smrey', mobileNumber: '+1 555-0177', department: 'Lab 25', status: 'Active' }
  ];

  const [liveStaffList, setLiveStaffList] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultStaffListSeed;
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

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedLab, setSelectedLab] = useState(isAdmin ? 'All' : userLab);
  const [selectedItems, setSelectedItems] = useState({});
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const getSubcategoryFilterOptions = (cat = 'All') => {
    const catStr = String(cat).toLowerCase();
    if (catStr.includes('hardware')) {
      return ['cpu', 'monitor', 'mouse', 'smartboard', 'keyboard', 'camera'];
    }
    if (catStr.includes('electrical')) {
      return ['fans', 'lights', 'Acs'];
    }
    if (catStr.includes('furniture') || catStr.includes('workshop')) {
      return ['chairs', 'tables', 'curtons'];
    }
    return ['cpu', 'monitor', 'mouse', 'smartboard', 'keyboard', 'fans', 'lights', 'Acs', 'chairs', 'tables', 'curtons', 'camera'];
  };

  const handleCategorySelectChange = (newCat) => {
    setSelectedCategory(newCat);
    const validSubs = getSubcategoryFilterOptions(newCat);
    if (selectedSubCategory !== 'All' && !validSubs.includes(selectedSubCategory)) {
      setSelectedSubCategory('All');
    }
  };

  const getDeviceIcon = (item) => {
    const name = String(item.deviceName || item.name || '').toLowerCase();
    const sub = String(item.subCategory || '').toLowerCase();
    const cat = String(item.category || '').toLowerCase();
    
    if (sub === 'keyboard' || name.includes('keyboard') || name.includes('mouse set') || name.includes('logitech')) return Keyboard;
    if (sub === 'monitor' || name.includes('monitor') || name.includes('display')) return Monitor;
    if (sub === 'cpu' || name.includes('workstation') || name.includes('optiplex') || name.includes('pc') || name.includes('tower')) return Laptop;
    if (name.includes('switch') || name.includes('cisco') || name.includes('router') || name.includes('hub')) return Server;
    if (sub === 'fans' || sub === 'lights' || sub === 'acs' || cat.includes('electrical')) return Zap;
    if (sub === 'chairs' || sub === 'tables' || cat.includes('furniture')) return Package;
    return Cpu;
  };

  const getStaffSpecs = (item, matchingStock = null) => {
    if (item?.specs && String(item.specs).trim()) return item.specs;
    if (item?.details && String(item.details).trim()) return item.details;
    if (matchingStock?.specs && String(matchingStock.specs).trim()) return matchingStock.specs;
    if (matchingStock?.details && String(matchingStock.details).trim()) return matchingStock.details;
    if (item?.description && String(item.description).trim()) return item.description;

    return 'No specs recorded (Click Entry to add)';
  };

  useEffect(() => {
    if (!isAdmin && userLab) {
      setSelectedLab(userLab);
    }
  }, [userLab, isAdmin]);

  useEffect(() => {
    localStorage.setItem('vlms_inventory', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (activeTab === 'categories') {
      setActiveTab('dashboard');
    } else if (activeTab === 'pending') {
      setSelectedCategory('All');
      setSelectedStatus('Pending Repair');
    } else if (activeTab === 'completed') {
      setSelectedCategory('All');
      setSelectedStatus('Completed');
    } else if (activeTab === 'hardware') {
      setSelectedCategory('All');
      setSelectedStatus('All');
    } else if (activeTab === 'dashboard') {
      setSelectedCategory('All');
      setSelectedStatus('All');
    }
  }, [activeTab]);

  useEffect(() => {
    loadInventory();
  }, [user, activeTab]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const roleParam = user?.role || 'staff';
      const deptParam = user?.department || 'Lab 1';
      const [invData, stockData, issueData] = await Promise.all([
        fetchAPI(`/inventory?role=${roleParam}&department=${deptParam}`).catch(() => []),
        fetchAPI(`/stock?role=${roleParam}&department=${deptParam}`).catch(() => []),
        fetchAPI(`/issues?role=${roleParam}&department=${deptParam}`).catch(() => [])
      ]);

      if (Array.isArray(invData) && invData.length > 0) {
        setItems(invData);
        localStorage.setItem('vlms_inventory', JSON.stringify(invData));
      } else {
        try {
          const savedInv = localStorage.getItem('vlms_inventory');
          if (savedInv) {
            const parsed = JSON.parse(savedInv);
            if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
          }
        } catch (e) {}
      }

      if (Array.isArray(stockData) && stockData.length > 0) {
        setStockList(stockData);
        localStorage.setItem('vlms_stock_list', JSON.stringify(stockData));
      } else {
        try {
          const savedStock = localStorage.getItem('vlms_stock_list');
          if (savedStock) {
            const parsed = JSON.parse(savedStock);
            if (Array.isArray(parsed) && parsed.length > 0) setStockList(parsed);
          }
        } catch (e) {}
      }

      if (Array.isArray(issueData) && issueData.length > 0) {
        setIssuesList(issueData);
        localStorage.setItem('vlms_issues', JSON.stringify(issueData));
      } else {
        try {
          const savedIssues = localStorage.getItem('vlms_issues');
          if (savedIssues) {
            const parsed = JSON.parse(savedIssues);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setIssuesList(parsed);
            } else {
              setIssuesList(defaultIssuesSeed);
              localStorage.setItem('vlms_issues', JSON.stringify(defaultIssuesSeed));
            }
          } else {
            setIssuesList(defaultIssuesSeed);
            localStorage.setItem('vlms_issues', JSON.stringify(defaultIssuesSeed));
          }
        } catch (e) {
          setIssuesList(defaultIssuesSeed);
        }
      }
    } catch (err) {
      console.error('Error loading inventory from MongoDB Atlas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const newSelected = {};
    if (isChecked) {
      items.forEach((item) => (newSelected[item.itemId] = true));
    }
    setSelectedItems(newSelected);
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleDeleteItem = async (itemId, mongoId) => {
    if (!isAdmin) {
      alert('Forbidden: Only Administrators are authorized to delete hardware items.');
      return;
    }

    const targetId = mongoId || itemId;
    if (window.confirm(`Are you sure you want to delete equipment item ${itemId || targetId}?`)) {
      try {
        await fetchAPI(`/inventory/${targetId}?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {
        console.log('API delete call fallback');
      }
      const updated = items.filter((i) => i.itemId !== itemId && i._id !== targetId);
      setItems(updated);
      localStorage.setItem('vlms_inventory', JSON.stringify(updated));
    }
  };

  const handleClearAllInventory = async () => {
    if (!isAdmin) {
      alert('Forbidden: Only Administrators are authorized to clear hardware inventory.');
      return;
    }

    if (window.confirm('⚠️ ARE YOU SURE? This will DELETE ALL hardware equipment records in the system!')) {
      try {
        await fetchAPI(`/inventory/clear/all?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {}
      setItems([]);
      localStorage.setItem('vlms_inventory', JSON.stringify([]));
    }
  };

  const matchesLabScope = (labStr) => {
    if (!labStr || isInactiveLab(labStr)) return false;

    const targetLab = isAdmin ? selectedLab : userLab;
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

  const scopedItemsList = items.filter((i) => matchesLabScope(i.labLocation || i.department));

  // Combine explicit inventory items + stock intake items for complete Hardware Overview display
  const combinedItems = scopedItemsList.map((i) => ({ ...i }));
  stockList.filter((s) => matchesLabScope(s.labLocation)).forEach((s) => {
    const existingItem = combinedItems.find(
      (i) => (i.itemId && s.id && String(i.itemId).toLowerCase().trim() === String(s.id).toLowerCase().trim()) ||
             (i.deviceName && s.name && String(i.deviceName).toLowerCase().trim() === String(s.name).toLowerCase().trim() && matchesLabScope(i.labLocation))
    );
    if (existingItem) {
      if ((!existingItem.specs || !String(existingItem.specs).trim()) && (s.specs || s.details)) {
        existingItem.specs = s.specs || s.details;
      }
    } else {
      combinedItems.push({
        _id: s.id,
        itemId: s.id,
        deviceName: s.name,
        category: s.category || 'Hardware',
        subCategory: s.subCategory || 'cpu',
        specs: s.specs || s.details || '',
        status: s.status === 'Out of Stock' ? 'Offline' : 'Online',
        labLocation: s.labLocation,
        assignedStaff: `Staff ${s.labLocation}`
      });
    }
  });

  const filteredItems = combinedItems.filter((item) => {
    const matchesSearch =
      item.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.assignedStaff && item.assignedStaff.toLowerCase().includes(searchQuery.toLowerCase()));

    const catSelStr = String(selectedCategory || 'All').toLowerCase();
    const itemCatStr = String(item.category || '').toLowerCase();
    const itemSubStr = String(item.subCategory || '').toLowerCase();

    let matchesCategory = catSelStr === 'all';
    if (!matchesCategory) {
      if (catSelStr.includes('hardware')) {
        matchesCategory = itemCatStr.includes('hardware') || itemCatStr.includes('pc') || itemCatStr.includes('monitor') || 
                          ['cpu', 'monitor', 'mouse', 'smartboard', 'keyboard', 'camera'].includes(itemSubStr);
      } else if (catSelStr.includes('electrical')) {
        matchesCategory = itemCatStr.includes('electrical') || itemCatStr.includes('electric') || 
                          ['fans', 'lights', 'acs', 'fan', 'light', 'ac'].includes(itemSubStr);
      } else if (catSelStr.includes('furniture') || catSelStr.includes('workshop')) {
        matchesCategory = itemCatStr.includes('furniture') || itemCatStr.includes('workshop') || 
                          ['chairs', 'tables', 'curtons', 'chair', 'table', 'curton'].includes(itemSubStr);
      } else {
        matchesCategory = itemCatStr === catSelStr || itemCatStr.includes(catSelStr);
      }
    }

    const itemLab = item.labLocation || item.department || '';
    const matchesLab = matchesLabScope(itemLab);

    // Dynamic issue count for this item
    const itemIssuesCount = issuesList.filter((iss) => {
      if (!iss) return false;
      if (iss.status === 'Completed' || iss.status === 'Resolved') return false;
      const sameLab = !iss.labLocation || !item.labLocation || String(iss.labLocation).toLowerCase().replace(/\s+/g, '') === String(item.labLocation).toLowerCase().replace(/\s+/g, '');
      const issEquip = (iss.equipmentName || '').toLowerCase();
      const issDev = (iss.deviceId || '').toLowerCase();
      const itemDev = (item.deviceName || '').toLowerCase();
      const itemId = (item.itemId || '').toLowerCase();

      return sameLab && (
        (issEquip && itemDev && (issEquip === itemDev || issEquip.includes(itemDev) || itemDev.includes(issEquip))) ||
        (issDev && itemId && (issDev === itemId || issDev.includes(itemId) || itemId.includes(issDev))) ||
        (issDev && itemDev && (issDev === itemDev || issDev.includes(itemDev) || itemDev.includes(issDev)))
      );
    }).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    const calculatedStatus = itemIssuesCount > 0 ? 'Pending Repair' : (item.status || 'Active');

    let matchesStatus = selectedStatus === 'All' || !selectedStatus;
    if (!matchesStatus) {
      const targetSt = String(selectedStatus || '').toLowerCase();
      const curSt = String(calculatedStatus || '').toLowerCase();
      if (targetSt === 'active') {
        matchesStatus = curSt === 'active' || curSt === 'online' || curSt === 'in stock' || curSt === 'completed';
      } else if (targetSt === 'pending repair') {
        matchesStatus = curSt === 'pending repair' || curSt === 'offline' || curSt === 'out of stock';
      } else if (targetSt === 'maintenance') {
        matchesStatus = curSt === 'maintenance' || curSt === 'repair';
      } else {
        matchesStatus = curSt.includes(targetSt);
      }
    }

    const detectedSubCat = categorizeEquipment(item.deviceName, item.category, item.subCategory).toLowerCase();
    const itemSubCatStr = (item.subCategory || '').toLowerCase();
    const targetSubCat = String(selectedSubCategory || 'All').toLowerCase();

    let matchesSubCategory = selectedSubCategory === 'All';
    if (!matchesSubCategory) {
      if (targetSubCat === 'cpu') {
        matchesSubCategory = detectedSubCat === 'cpu' || itemSubCatStr.includes('cpu') || itemSubCatStr.includes('pc') || itemSubCatStr.includes('workstation');
      } else if (targetSubCat === 'monitor') {
        matchesSubCategory = detectedSubCat === 'monitor' || itemSubCatStr.includes('monitor') || itemSubCatStr.includes('display');
      } else if (targetSubCat === 'acs') {
        matchesSubCategory = detectedSubCat === 'acs' || itemSubCatStr === 'ac' || itemSubCatStr.includes('air conditioner') || itemSubCatStr.includes('cooling');
      } else if (targetSubCat === 'mouse') {
        matchesSubCategory = detectedSubCat === 'mouse';
      } else if (targetSubCat === 'keyboard') {
        matchesSubCategory = detectedSubCat === 'keyboard';
      } else if (targetSubCat === 'smartboard') {
        matchesSubCategory = detectedSubCat === 'smartboard';
      } else if (targetSubCat === 'fans') {
        matchesSubCategory = detectedSubCat === 'fans' || itemSubCatStr.includes('fan');
      } else if (targetSubCat === 'lights') {
        matchesSubCategory = detectedSubCat === 'lights' || itemSubCatStr.includes('light');
      } else if (targetSubCat === 'chairs') {
        matchesSubCategory = detectedSubCat === 'chairs' || itemSubCatStr.includes('chair');
      } else if (targetSubCat === 'tables') {
        matchesSubCategory = detectedSubCat === 'tables' || itemSubCatStr.includes('table') || itemSubCatStr.includes('desk') || itemSubCatStr.includes('bench');
      } else if (targetSubCat === 'curtons') {
        matchesSubCategory = detectedSubCat === 'curtons' || itemSubCatStr.includes('curton') || itemSubCatStr.includes('curtain');
      } else if (targetSubCat === 'camera') {
        matchesSubCategory = detectedSubCat === 'camera' || itemSubCatStr.includes('cam');
      } else {
        matchesSubCategory = detectedSubCat === targetSubCat || itemSubCatStr === targetSubCat;
      }
    }

    const matchesDate = matchesDateFilter(item.invoiceDate || item.dateAdded || item.lastInspected || item.createdAt, selectedTimeFilter, customStartDate, customEndDate);

    return matchesSearch && matchesCategory && matchesSubCategory && matchesStatus && matchesLab && matchesDate;
  });

  // Categorization helper for equipment subcategories using strict word boundaries
  function categorizeEquipment(name = '', cat = '', subCat = '') {
    const rawSub = (subCat || '').toLowerCase().trim();
    if (rawSub === 'cpu' || rawSub === 'pcs & workstations' || rawSub === 'pcs' || rawSub === 'workstation' || rawSub === 'workstations') return 'cpu';
    if (rawSub === 'monitor' || rawSub === 'monitors & displays' || rawSub === 'display' || rawSub === 'screens') return 'monitor';
    if (rawSub === 'mouse' || rawSub === 'mice') return 'mouse';
    if (rawSub === 'keyboard' || rawSub === 'keyboards') return 'keyboard';
    if (rawSub === 'smartboard' || rawSub === 'interactive board') return 'smartboard';
    if (rawSub === 'fans' || rawSub === 'fan') return 'fans';
    if (rawSub === 'lights' || rawSub === 'light') return 'lights';
    if (rawSub === 'acs' || rawSub === 'ac') return 'Acs';
    if (rawSub === 'chairs' || rawSub === 'chair') return 'chairs';
    if (rawSub === 'tables' || rawSub === 'table') return 'tables';
    if (rawSub === 'curtons' || rawSub === 'curton' || rawSub === 'curtain') return 'curtons';
    if (rawSub === 'camera' || rawSub === 'webcam') return 'camera';

    const t = `${name} ${cat} ${subCat}`.toLowerCase();

    if (/\b(smart\s*board|smartboard|interactive\s*board|smb|promethean)\b/i.test(t)) return 'smartboard';
    if (/\b(keyboard|keyboards|kbd)\b/i.test(t)) return 'keyboard';
    if (/\b(mouse|mice)\b/i.test(t)) return 'mouse';
    if (/\b(monitor|monitors|display|screen|ultrafine|lg)\b/i.test(t)) return 'monitor';
    if (/\b(fan|fans|ceiling\s*fan)\b/i.test(t)) return 'fans';
    if (/\b(light|lights|bulb|led|lighting)\b/i.test(t)) return 'lights';
    if (/\b(ac|acs|air\s*conditioner|aircon|cooling|air\s*conditioning)\b/i.test(t)) return 'Acs';
    if (/\b(chair|chairs|stool|seating)\b/i.test(t)) return 'chairs';
    if (/\b(table|tables|desk|desks|workbench|benches)\b/i.test(t)) return 'tables';
    if (/\b(curton|curtons|curtain|curtains|blind|blinds)\b/i.test(t)) return 'curtons';
    if (/\b(camera|cams|webcam)\b/i.test(t)) return 'camera';
    if (/\b(cpu|cpus|workstation|workstations|pc|pcs|tower|optiplex|precision|computer|dell)\b/i.test(t)) return 'cpu';

    return 'cpu';
  }

  // Extract active labs strictly and dynamically from live database items, stock entries, and issue tickets
  const databaseActiveLabs = Array.from(
    new Set(
      [
        ...items.map((i) => i?.labLocation || i?.department),
        ...stockList.map((s) => s?.labLocation || s?.department),
        ...issuesList.map((iss) => iss?.labLocation)
      ].filter(lab => Boolean(lab) && !isInactiveLab(lab))
    )
  ).sort((a, b) => {
    const strA = String(a || '');
    const strB = String(b || '');
    const numA = parseInt(strA.replace(/\D/g, ''), 10);
    const numB = parseInt(strB.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return strA.localeCompare(strB);
  });

  const matchesCategoryScope = (itemCat) => {
    if (!selectedCategory || selectedCategory === 'All' || selectedCategory === 'all') return true;
    if (!itemCat) return true;
    const a = String(itemCat).toLowerCase();
    const b = String(selectedCategory).toLowerCase();
    if (a === b) return true;
    if (b.includes('hardware')) return a.includes('hardware') || a.includes('pc') || a.includes('cpu') || a.includes('monitor');
    if (b.includes('electrical')) return a.includes('electrical') || a.includes('fan') || a.includes('light') || a.includes('ac');
    if (b.includes('furniture')) return a.includes('furniture') || a.includes('chair') || a.includes('table');
    return a.includes(b);
  };

  // Filtered Stock & Issues by Lab Location Scope & Category Scope
  const scopedStockList = stockList.filter((s) => s && matchesLabScope(s.labLocation) && matchesCategoryScope(s.category));
  const scopedIssuesList = issuesList.filter((i) => i && matchesLabScope(i.labLocation) && matchesCategoryScope(i.category));

  // Stock Entry Metrics (Card 1: Total Inventory - Actual Total Stock from Staff Stock Entry or Admin Inventory)
  let stockCpu = 0, stockMonitors = 0, stockKeyboards = 0, stockMouse = 0, stockSmartBoards = 0;
  let totalStockCount = 0;

  if (scopedStockList.length > 0) {
    scopedStockList.forEach((s) => {
      const qty = Number(s.quantity ?? 0);
      totalStockCount += qty;
      const catType = categorizeEquipment(s.name, s.category, s.subCategory);
      if (catType === 'cpu') stockCpu += qty;
      else if (catType === 'monitor') stockMonitors += qty;
      else if (catType === 'keyboard') stockKeyboards += qty;
      else if (catType === 'mouse') stockMouse += qty;
      else if (catType === 'smartboard') stockSmartBoards += qty;
    });
  } else if (scopedItemsList.length > 0) {
    scopedItemsList.forEach((item) => {
      const qty = Number(item.qty || 1);
      totalStockCount += qty;
      const catType = categorizeEquipment(item.deviceName, item.category, item.subCategory);
      if (catType === 'cpu') stockCpu += qty;
      else if (catType === 'monitor') stockMonitors += qty;
      else if (catType === 'keyboard') stockKeyboards += qty;
      else if (catType === 'mouse') stockMouse += qty;
      else if (catType === 'smartboard') stockSmartBoards += qty;
    });
  }

  // Pending Issues Metrics (Card 3: Pending Issues)
  const pendingTickets = scopedIssuesList.filter((i) => i.status !== 'Completed' && i.status !== 'Resolved');
  const completedTickets = scopedIssuesList.filter((i) => i.status === 'Completed' || i.status === 'Resolved');

  let pendingCpu = 0, pendingMonitors = 0, pendingKeyboards = 0, pendingMouse = 0, pendingSmartBoards = 0;
  let pendingTotalCount = 0;

  pendingTickets.forEach((p) => {
    const pQty = Number(p.quantity || 1);
    pendingTotalCount += pQty;
    const catType = categorizeEquipment(p.equipmentName || p.title || p.deviceId, p.category, p.subCategory);
    if (catType === 'cpu') pendingCpu += pQty;
    else if (catType === 'monitor') pendingMonitors += pQty;
    else if (catType === 'keyboard') pendingKeyboards += pQty;
    else if (catType === 'mouse') pendingMouse += pQty;
    else if (catType === 'smartboard') pendingSmartBoards += pQty;
  });

  let completedCount = completedTickets.reduce((sum, c) => sum + Number(c.quantity || 1), 0);

  // Total Working Metrics (Card 2: Active Workstations / Total Working = Actual Total Stock - Pending Issues)
  const workingCpu = Math.max(0, stockCpu - pendingCpu);
  const workingMonitors = Math.max(0, stockMonitors - pendingMonitors);
  const workingKeyboards = Math.max(0, stockKeyboards - pendingKeyboards);
  const workingMouse = Math.max(0, stockMouse - pendingMouse);
  const workingSmartBoards = Math.max(0, stockSmartBoards - pendingSmartBoards);
  const totalWorkingCount = Math.max(0, totalStockCount - pendingTotalCount);

  // Dynamic list-type item calculation across ALL sub-categories & registered items
  const getSubItemBreakdown = () => {
    const catStr = String(selectedCategory || 'All').toLowerCase();

    const isHardware = catStr.includes('hardware');
    const isElectrical = catStr.includes('electrical');
    const isFurniture = catStr.includes('furniture');

    const stockItems = scopedStockList.length > 0 ? scopedStockList : scopedItemsList;

    // Standard sub-categories from modal drop-down entries
    const knownHardware = [
      { key: 'cpu', label: 'CPU' },
      { key: 'monitor', label: 'Monitors' },
      { key: 'mouse', label: 'Mouse' },
      { key: 'smartboard', label: 'Smartboard' },
      { key: 'keyboard', label: 'Keyboards' },
      { key: 'camera', label: 'Camera' }
    ];

    const knownElectrical = [
      { key: 'fans', label: 'Fans' },
      { key: 'lights', label: 'Lights' },
      { key: 'acs', label: 'ACs' },
      { key: 'ups', label: 'UPS / Power' }
    ];

    const knownFurniture = [
      { key: 'chairs', label: 'Chairs' },
      { key: 'tables', label: 'Tables' },
      { key: 'curtons', label: 'Curtains' },
      { key: 'racks', label: 'Racks' },
      { key: 'boards', label: 'Boards' }
    ];

    const itemMap = new Map();

    const addSubItem = (key, label, catGroup, stockQty = 0, pendQty = 0, compQty = 0) => {
      const cleanKey = String(key || label || '').toLowerCase().trim();
      if (!cleanKey) return;
      
      if (!itemMap.has(cleanKey)) {
        let formattedLabel = label || cleanKey;
        if (cleanKey === 'cpu') formattedLabel = 'CPU';
        else if (cleanKey === 'acs' || cleanKey === 'ac') formattedLabel = 'ACs';
        else if (cleanKey === 'ups') formattedLabel = 'UPS / Power';
        else formattedLabel = cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1);

        itemMap.set(cleanKey, {
          key: cleanKey,
          label: formattedLabel,
          catGroup,
          stock: 0,
          pending: 0,
          completed: 0
        });
      }

      const entry = itemMap.get(cleanKey);
      entry.stock += stockQty;
      entry.pending += pendQty;
      entry.completed += compQty;
    };

    // Pre-populate standard keys for scope
    if (isHardware) {
      knownHardware.forEach(k => addSubItem(k.key, k.label, 'hardware'));
    } else if (isElectrical) {
      knownElectrical.forEach(k => addSubItem(k.key, k.label, 'electrical'));
    } else if (isFurniture) {
      knownFurniture.forEach(k => addSubItem(k.key, k.label, 'furniture'));
    } else {
      // All Categories: Pre-populate all sub-categories across Hardware, Electrical, Furniture
      knownHardware.forEach(k => addSubItem(k.key, k.label, 'hardware'));
      knownElectrical.forEach(k => addSubItem(k.key, k.label, 'electrical'));
      knownFurniture.forEach(k => addSubItem(k.key, k.label, 'furniture'));
    }

    // Now scan actual stock items and aggregate counts
    stockItems.forEach((s) => {
      const sCat = String(s.category || '').toLowerCase();
      const subCat = String(s.subCategory || s.subCategoryName || '').toLowerCase().trim();
      const name = String(s.name || s.deviceName || s.title || '').toLowerCase();
      const qty = Number(s.quantity ?? s.qty ?? 1);

      if (isHardware && !sCat.includes('hardware') && !['cpu','monitor','mouse','smartboard','keyboard','camera'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isElectrical && !sCat.includes('electrical') && !['fan','light','ac','ups'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isFurniture && !sCat.includes('furniture') && !sCat.includes('workshop') && !['chair','table','curton','curtain','rack','board'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }

      let key = subCat;
      if (!key) {
        if (name.includes('cpu')) key = 'cpu';
        else if (name.includes('monitor')) key = 'monitor';
        else if (name.includes('mouse')) key = 'mouse';
        else if (name.includes('smartboard') || name.includes('smart board')) key = 'smartboard';
        else if (name.includes('keyboard')) key = 'keyboard';
        else if (name.includes('camera') || name.includes('webcam')) key = 'camera';
        else if (name.includes('fan')) key = 'fans';
        else if (name.includes('light') || name.includes('led') || name.includes('tube')) key = 'lights';
        else if (name.includes('ac') || name.includes('air conditioner')) key = 'acs';
        else if (name.includes('ups') || name.includes('power')) key = 'ups';
        else if (name.includes('chair')) key = 'chairs';
        else if (name.includes('table') || name.includes('desk')) key = 'tables';
        else if (name.includes('curton') || name.includes('curtain')) key = 'curtons';
        else if (name.includes('rack')) key = 'racks';
        else if (name.includes('board')) key = 'boards';
        else key = name.split(' ')[0] || 'other';
      }

      addSubItem(key, null, sCat, qty, 0);
    });

    // Scan pending tickets
    pendingTickets.forEach((p) => {
      const pCat = String(p.category || '').toLowerCase();
      const subCat = String(p.subCategory || '').toLowerCase().trim();
      const name = String(p.equipmentName || p.title || p.deviceId || '').toLowerCase();
      const qty = Number(p.quantity || 1);

      if (isHardware && !pCat.includes('hardware') && !['cpu','monitor','mouse','smartboard','keyboard','camera'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isElectrical && !pCat.includes('electrical') && !['fan','light','ac','ups'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isFurniture && !pCat.includes('furniture') && !pCat.includes('workshop') && !['chair','table','curton','curtain','rack','board'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }

      let key = subCat;
      if (!key) {
        if (name.includes('cpu')) key = 'cpu';
        else if (name.includes('monitor')) key = 'monitor';
        else if (name.includes('mouse')) key = 'mouse';
        else if (name.includes('smartboard')) key = 'smartboard';
        else if (name.includes('keyboard')) key = 'keyboard';
        else if (name.includes('camera')) key = 'camera';
        else if (name.includes('fan')) key = 'fans';
        else if (name.includes('light')) key = 'lights';
        else if (name.includes('ac')) key = 'acs';
        else if (name.includes('ups')) key = 'ups';
        else if (name.includes('chair')) key = 'chairs';
        else if (name.includes('table')) key = 'tables';
        else if (name.includes('curton') || name.includes('curtain')) key = 'curtons';
        else if (name.includes('rack')) key = 'racks';
        else if (name.includes('board')) key = 'boards';
        else key = name.split(' ')[0] || 'other';
      }

      addSubItem(key, null, pCat, 0, qty, 0);
    });

    // Scan completed tickets
    completedTickets.forEach((c) => {
      const cCat = String(c.category || '').toLowerCase();
      const subCat = String(c.subCategory || '').toLowerCase().trim();
      const name = String(c.equipmentName || c.title || c.deviceId || '').toLowerCase();
      const qty = Number(c.quantity || 1);

      if (isHardware && !cCat.includes('hardware') && !['cpu','monitor','mouse','smartboard','keyboard','camera'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isElectrical && !cCat.includes('electrical') && !['fan','light','ac','ups'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }
      if (isFurniture && !cCat.includes('furniture') && !cCat.includes('workshop') && !['chair','table','curton','curtain','rack','board'].some(k => name.includes(k) || subCat.includes(k))) {
        return;
      }

      let key = subCat;
      if (!key) {
        if (name.includes('cpu')) key = 'cpu';
        else if (name.includes('monitor')) key = 'monitor';
        else if (name.includes('mouse')) key = 'mouse';
        else if (name.includes('smartboard')) key = 'smartboard';
        else if (name.includes('keyboard')) key = 'keyboard';
        else if (name.includes('camera')) key = 'camera';
        else if (name.includes('fan')) key = 'fans';
        else if (name.includes('light')) key = 'lights';
        else if (name.includes('ac')) key = 'acs';
        else if (name.includes('ups')) key = 'ups';
        else if (name.includes('chair')) key = 'chairs';
        else if (name.includes('table')) key = 'tables';
        else if (name.includes('curton') || name.includes('curtain')) key = 'curtons';
        else if (name.includes('rack')) key = 'racks';
        else if (name.includes('board')) key = 'boards';
        else key = name.split(' ')[0] || 'other';
      }

      addSubItem(key, null, cCat, 0, 0, qty);
    });

    const result = [];
    itemMap.forEach((val) => {
      val.working = Math.max(0, val.stock - val.pending);
      result.push(val);
    });

    return result;
  };

  const subBreakdown = getSubItemBreakdown();

  return (
    <div style={{ flex: 1, padding: '28px 32px', height: '100vh', maxHeight: '100vh', overflowY: 'auto' }}>
      
      <TopHeader 
        activeTab={activeTab} 
        selectedLab={selectedLab} 
        onSelectLab={(lab) => setSelectedLab(lab)} 
        activeLabs={databaseActiveLabs} 
      />

      {activeTab === 'categories' && (
        <TabErrorBoundary>
          <CategoriesView items={scopedItemsList} onSelectCategory={(cat) => setSelectedCategory(cat)} />
        </TabErrorBoundary>
      )}

      {activeTab === 'stock' && (
        <TabErrorBoundary>
          <StockEntryView selectedLab={selectedLab} onReload={loadInventory} />
        </TabErrorBoundary>
      )}

      {activeTab === 'issues' && (
        <TabErrorBoundary>
          <IssuesView selectedLab={selectedLab} items={scopedItemsList} onReload={loadInventory} />
        </TabErrorBoundary>
      )}

      {activeTab === 'pending' && (
        <TabErrorBoundary>
          <PendingStatusView selectedLab={selectedLab} items={scopedItemsList} issuesList={scopedIssuesList} onReload={loadInventory} />
        </TabErrorBoundary>
      )}

      {activeTab === 'completed' && (
        <TabErrorBoundary>
          <CompletedStatusView selectedLab={selectedLab} items={scopedItemsList} issuesList={scopedIssuesList} onReload={loadInventory} />
        </TabErrorBoundary>
      )}

      {activeTab === 'reports' && (
        <TabErrorBoundary>
          <ReportsView selectedLab={selectedLab} items={scopedItemsList} />
        </TabErrorBoundary>
      )}

      {(activeTab === 'staff-access' || activeTab === 'staff') && (
        <TabErrorBoundary>
          <StaffAccessView />
        </TabErrorBoundary>
      )}

      {(activeTab === 'settings' || activeTab === 'admin-settings') && (
        <TabErrorBoundary>
          <SettingsView />
        </TabErrorBoundary>
      )}

      {activeTab === 'dashboard' && (
        <TabErrorBoundary>
          
          {/* Category Filter Pills Top Switcher */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div
              className="lab-card"
              onClick={() => setSelectedCategory('All')}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                border: selectedCategory === 'All' ? '2px solid var(--cyan-bright)' : '1px solid var(--glass-border)',
                background: selectedCategory === 'All' ? 'rgba(0, 242, 254, 0.08)' : 'var(--bg-panel)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>🌐</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--card-text-head)' }}>All Categories</div>
                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>Complete Department Overview</div>
              </div>
            </div>

            <div
              className="lab-card"
              onClick={() => setSelectedCategory('Hardware')}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                border: selectedCategory.includes('Hardware') ? '2px solid var(--cyan-bright)' : '1px solid var(--glass-border)',
                background: selectedCategory.includes('Hardware') ? 'rgba(0, 242, 254, 0.08)' : 'var(--bg-panel)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>💻</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--card-text-head)' }}>1. Hardware</div>
                <div style={{ fontSize: '0.70rem', color: 'var(--cyan-bright)' }}>PCs, Monitors, CPUs, Peripherals</div>
              </div>
            </div>

            <div
              className="lab-card"
              onClick={() => setSelectedCategory('Electrical')}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                border: selectedCategory.includes('Electrical') ? '2px solid var(--orange-accent)' : '1px solid var(--glass-border)',
                background: selectedCategory.includes('Electrical') ? 'rgba(255, 159, 67, 0.08)' : 'var(--bg-panel)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>⚡</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--card-text-head)' }}>2. Electrical</div>
                <div style={{ fontSize: '0.70rem', color: 'var(--orange-accent)' }}>Fans, ACs, Lights, Power Rails</div>
              </div>
            </div>

            <div
              className="lab-card"
              onClick={() => setSelectedCategory('Furniture')}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                border: selectedCategory.includes('Furniture') ? '2px solid var(--green-online)' : '1px solid var(--glass-border)',
                background: selectedCategory.includes('Furniture') ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-panel)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>🪑</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--card-text-head)' }}>3. Furniture</div>
                <div style={{ fontSize: '0.70rem', color: 'var(--green-online)' }}>Chairs, Tables, Workbenches</div>
              </div>
            </div>
          </div>

          {/* 1. The 4 Summary Metric Boxes (Inline in 1 Row at Top) with List Type Display */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
            
            {/* Card 1: Total Inventory */}
            <div className="lab-card lab-card-hover" style={{ padding: '14px 16px', position: 'relative', background: 'var(--bg-panel)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>1. Total Inventory</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--card-text-head)' }}>{totalStockCount}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stock Items</span>
              </div>

              {/* List Type Display Format (Fans : 25) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '8px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: '1px solid var(--glass-border)', maxHeight: '160px', overflowY: 'auto' }}>
                {subBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      padding: '2px 0',
                      borderBottom: idx < subBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}
                  >
                    <span style={{ minWidth: '75px', textAlign: 'left' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                    <strong style={{ color: 'var(--cyan-bright)', fontWeight: 800 }}>{item.stock}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stock Source</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--cyan-bright)' }}>Active</span>
              </div>
            </div>

            {/* Card 2: Active Workstations */}
            <div className="lab-card lab-card-hover" style={{ padding: '14px 16px', position: 'relative', background: 'var(--bg-panel)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>2. Active Workstations</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '2px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--green-online)' }}>{totalWorkingCount}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Working</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--cyan-bright)', marginBottom: '4px' }}>
                {totalStockCount > 0 ? `${Math.round((totalWorkingCount / totalStockCount) * 100)}% Uptime` : '100% Uptime'}
              </div>

              {/* List Type Display Format (Fans : 25) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '8px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: '1px solid var(--glass-border)', maxHeight: '160px', overflowY: 'auto' }}>
                {subBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      padding: '2px 0',
                      borderBottom: idx < subBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}
                  >
                    <span style={{ minWidth: '75px', textAlign: 'left' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                    <strong style={{ color: 'var(--green-online)', fontWeight: 800 }}>{item.working}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Stock Math</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green-online)' }}>Verified</span>
              </div>
            </div>

            {/* Card 3: Pending Issues */}
            <div className="lab-card lab-card-hover" style={{ padding: '14px 16px', position: 'relative', background: 'var(--bg-panel)', border: '1px solid var(--orange-glow)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>3. Pending Issues</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--orange-accent)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--orange-accent)' }}>{pendingTotalCount}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Faults</span>
              </div>

              {/* List Type Display Format (Fans : 25) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '8px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: '1px solid var(--glass-border)', maxHeight: '160px', overflowY: 'auto' }}>
                {subBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      padding: '2px 0',
                      borderBottom: idx < subBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}
                  >
                    <span style={{ minWidth: '75px', textAlign: 'left' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                    <strong style={{ color: item.pending > 0 ? '#ef4444' : 'var(--orange-accent)', fontWeight: 800 }}>{item.pending}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Issue Tickets</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--orange-accent)' }}>Action</span>
              </div>
            </div>

            {/* Card 4: Maintenance Completed */}
            <div className="lab-card lab-card-hover" style={{ padding: '14px 16px', position: 'relative', background: 'var(--bg-panel)', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>4. Maintenance Done</span>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green-online)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--card-text-head)' }}>{completedTickets.length}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolved</span>
              </div>

              {/* List Type Display Format (CPU : 3, Monitors : 2) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', margin: '8px 0', padding: '6px 10px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: '1px solid var(--glass-border)', maxHeight: '160px', overflowY: 'auto' }}>
                {subBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      padding: '2px 0',
                      borderBottom: idx < subBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none'
                    }}
                  >
                    <span style={{ minWidth: '75px', textAlign: 'left' }}>{item.label}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>:</span>
                    <strong style={{ color: 'var(--green-online)', fontWeight: 800 }}>{item.completed || 0}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '4px' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Target 100%</span>
              </div>
            </div>

          </div>

          {/* 2. Circle Based Graph over all 4 Metrics (Placed BELOW the 4 boxes) */}
          <CircleOverviewGraph
            totalStockCount={totalStockCount}
            totalWorkingCount={totalWorkingCount}
            pendingTotalCount={pendingTotalCount}
            completedCount={completedTickets.length}
            stockCpu={stockCpu}
            stockMonitors={stockMonitors}
            stockKeyboards={stockKeyboards}
            stockMouse={stockMouse}
            stockSmartBoards={stockSmartBoards}
            workingCpu={workingCpu}
            workingMonitors={workingMonitors}
            workingKeyboards={workingKeyboards}
            workingMouse={workingMouse}
            pendingCpu={pendingCpu}
            pendingMonitors={pendingMonitors}
            activeCategory={String(selectedCategory || 'all').toLowerCase()}
            selectedLab={selectedLab}
            onRefresh={loadInventory}
            loading={loading}
          />

          {/* Programmer Staff Assigned Labs Table Widget (Synced with Admin Staff Access) */}
          <div className="lab-card" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--card-text-head)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={16} color="var(--cyan-bright)" /> Programmer Staff Assigned Labs
                </h4>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Live sync with Admin Staff Access</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--cyan-bright)', background: 'rgba(0,242,254,0.1)', padding: '3px 12px', borderRadius: '16px', border: '1px solid rgba(0,242,254,0.3)' }}>
                {liveStaffList.filter(s => !isInactiveLab(s.department)).length} Staff
              </span>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '340px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 10px', width: '60px' }}>S.No</th>
                    <th style={{ padding: '12px 10px' }}>Assign Lab No</th>
                    <th style={{ padding: '12px 10px' }}>Name of Programmer</th>
                    <th style={{ padding: '12px 10px' }}>Phone Number</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {liveStaffList
                    .filter(s => !isInactiveLab(s.department))
                    .map((st, idx) => (
                      <tr key={st.id || st.email || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(0,242,254,0.08)', color: 'var(--cyan-bright)', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(0,242,254,0.25)', fontSize: '0.82rem' }}>
                            <Building size={13} /> {st.department || 'Lab 12'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 700 }}>{st.name}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                          {st.mobileNumber ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={14} color="var(--cyan-bright)" /> {st.mobileNumber}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 10px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: (st.status === 'On Leave' || st.status === 'Leave') ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                              color: (st.status === 'On Leave' || st.status === 'Leave') ? '#f59e0b' : '#10b981',
                              border: `1px solid ${(st.status === 'On Leave' || st.status === 'Leave') ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`
                            }}
                          >
                            {(st.status === 'On Leave' || st.status === 'Leave') ? '🟠 Leave' : '🟢 Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lab-card" style={{ padding: '24px' }}>
            
            {/* FIXED / STICKY HEADER & FILTER BLOCK (RED CIRCLE AREA) */}
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
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  Department Inventory Records 
                  {selectedCategory !== 'All' && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, padding: '3px 10px', borderRadius: '6px', background: 'rgba(0, 242, 254, 0.12)', color: 'var(--cyan-bright)', border: '1px solid rgba(0, 242, 254, 0.3)' }}>
                      {selectedCategory}
                    </span>
                  )}
                </h3>
                {isAdmin && (
                  <button
                    onClick={handleClearAllInventory}
                    className="pill-filter"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Trash2 size={15} /> Clear All Inventory
                  </button>
                )}
              </div>

              <div 
                style={{ 
                  padding: '10px 16px', 
                  marginBottom: '16px', 
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
                      {isAdmin ? 'System Administrator Full Access:' : `Programmer / Staff Data Entry Scope (${userLab}):`}
                    </strong>{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {isAdmin 
                        ? 'You have full access to view, edit, add, and delete inventory across ALL labs.' 
                        : `Restricted permissions. You can ONLY view & entry data assigned to ${userLab}.`}
                    </span>
                  </div>
                </div>

                {isAdmin ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building size={16} color="var(--cyan-bright)" />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Lab Scope:</span>
                    <select
                      value={selectedLab}
                      onChange={(e) => setSelectedLab(e.target.value)}
                      className="lab-input"
                      style={{ width: '160px', height: '34px', padding: '2px 8px', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      <option value="All">All Active Labs ({databaseActiveLabs.length})</option>
                      {databaseActiveLabs.map((lab) => (
                        <option key={lab} value={lab}>
                          {lab}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span 
                    className="status-pill status-pending" 
                    style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Building size={14} /> Assigned: {userLab} Only
                  </span>
                )}
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
                {/* Search Hardware Input */}
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
                    onChange={(e) => handleCategorySelectChange(e.target.value)}
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
                    {getSubcategoryFilterOptions(selectedCategory).map((scat) => (
                      <option key={scat} value={scat}>
                        {scat === 'cpu' ? '💻 CPU' :
                         scat === 'monitor' ? '🖥️ Monitor' :
                         scat === 'mouse' ? '🖱️ Mouse' :
                         scat === 'smartboard' ? '📋 Smartboard' :
                         scat === 'keyboard' ? '⌨️ Keyboard' :
                         scat === 'fans' ? '🌀 Fans' :
                         scat === 'lights' ? '💡 Lights' :
                         scat === 'Acs' ? '❄️ ACs' :
                         scat === 'chairs' ? '🪑 Chairs' :
                         scat === 'tables' ? '🪵 Tables' :
                         scat === 'curtons' ? '🪟 Curtains' :
                         scat === 'camera' ? '📷 Camera' : scat}
                      </option>
                    ))}
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
                {(selectedCategory !== 'All' || selectedSubCategory !== 'All' || selectedStatus !== 'All' || selectedTimeFilter !== 'All' || searchQuery !== '') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubCategory('All');
                      setSelectedStatus('All');
                      setSelectedTimeFilter('All');
                      setCustomStartDate('');
                      setCustomEndDate('');
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
                    {filteredItems.length} Assets Found
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
                      color: viewMode === 'grid' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                      borderColor: viewMode === 'grid' ? 'var(--cyan-bright)' : 'var(--glass-border)',
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
                      color: viewMode === 'table' ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                      borderColor: viewMode === 'table' ? 'var(--cyan-bright)' : 'var(--glass-border)',
                      fontWeight: 700
                    }}
                  >
                    ☰ Table View
                  </button>
                </div>
              </div>
            </div>

            {/* View Mode 1: Box Grid View (Image 3 Card Style) */}
            {viewMode === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginTop: '12px', maxHeight: '620px', overflowY: 'auto', paddingRight: '8px' }}>
                {filteredItems.map((item, idx) => {
                  const isSelected = !!selectedItems[item.itemId];

                  // Dynamic Issue Count & Health Note matching this item
                  const matchedIssues = issuesList.filter((iss) => {
                    if (iss.status === 'Completed' || iss.status === 'Resolved') return false;
                    const sameLab = !iss.labLocation || !item.labLocation || iss.labLocation.toLowerCase().replace(/\s+/g, '') === item.labLocation.toLowerCase().replace(/\s+/g, '');
                    if (!sameLab) return false;

                    const issEquip = (iss.equipmentName || '').toLowerCase().trim();
                    const issDev = (iss.deviceId || '').toLowerCase().trim();
                    const itemDev = (item.deviceName || '').toLowerCase().trim();
                    const itemId = (item.itemId || '').toLowerCase().trim();

                    const matchesName = issEquip && itemDev && (issEquip === itemDev || issEquip.includes(itemDev) || itemDev.includes(issEquip));
                    const matchesId = issDev && itemId && (issDev === itemId || issDev.includes(itemId) || itemId.includes(issDev));
                    const matchesDevName = issDev && itemDev && (issDev === itemDev || issDev.includes(itemDev) || itemDev.includes(issDev));

                    return matchesName || matchesId || matchesDevName;
                  });

                  const itemIssuesCount = matchedIssues.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
                  const healthNote = matchedIssues.length > 0 ? (matchedIssues[0].title || matchedIssues[0].equipmentName || `${itemIssuesCount} Issue Ticket(s) Open`) : 'All Systems Operational';

                  // Dynamic Stock Item lookup for stock quantity & custom specs
                  const matchingStock = stockList.find((s) => {
                    if (!s) return false;
                    const sId = String(s.id || s._id || s.code || '').toLowerCase().trim();
                    const itemId = String(item.itemId || item._id || item.code || '').toLowerCase().trim();
                    if (sId && itemId && sId === itemId) return true;

                    const sName = String(s.name || '').toLowerCase().trim();
                    const devName = String(item.deviceName || item.name || '').toLowerCase().trim();
                    if (sName && devName && (sName === devName || sName.includes(devName) || devName.includes(sName))) return true;

                    const sameLab = !s.labLocation || !item.labLocation || s.labLocation.toLowerCase().replace(/\s+/g, '') === item.labLocation.toLowerCase().replace(/\s+/g, '');
                    const sameCat = s.category === item.category || s.subCategory === item.category || (item.category === 'PCs' && s.subCategory?.includes('CPU'));
                    return sameLab && sameCat;
                  });
                  const itemTotalStock = matchingStock ? matchingStock.quantity : (item.quantity || 30);

                  // Dynamic Working Status
                  const currentStatus = itemIssuesCount > 0 ? 'Faulty' : (item.status === 'Pending Repair' ? 'Faulty' : (item.status || 'Operational'));
                  
                  let badgeStyle = {
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--green-online)',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  };
                  if (currentStatus === 'Faulty' || currentStatus === 'Pending Repair' || currentStatus === 'Offline') {
                    badgeStyle = {
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      border: '1px solid rgba(239, 68, 68, 0.4)'
                    };
                  } else if (currentStatus === 'Maintenance') {
                    badgeStyle = {
                      background: 'rgba(255, 159, 67, 0.12)',
                      color: 'var(--orange-accent)',
                      border: '1px solid rgba(255, 159, 67, 0.4)'
                    };
                  }

                  const DeviceIconComp = getDeviceIcon(item);
                  const codeId = item.itemId || item.code || `VUG-CSE-${(item.subCategory || 'KB').toUpperCase()}-${100 + idx}`;
                  const specsText = getStaffSpecs(item, matchingStock);

                  return (
                    <div
                      key={item.itemId || idx}
                      className="lab-card lab-card-hover"
                      style={{
                        padding: '22px',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px',
                        position: 'relative',
                        background: 'var(--bg-panel)',
                        border: isSelected ? '2px solid var(--cyan-bright)' : '1px solid var(--glass-border)',
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
                              justify: 'center',
                              flexShrink: 0
                            }}
                          >
                            <DeviceIconComp size={22} color="var(--cyan-bright)" />
                          </div>

                          <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cyan-bright)', letterSpacing: '0.5px', marginBottom: '2px' }}>
                              {codeId}
                            </div>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.3 }}>
                              {item.deviceName || item.name}
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
                          {currentStatus}
                        </span>
                      </div>

                      {/* Specs / Details Inner Box */}
                      <div style={{ background: 'rgba(0, 0, 0, 0.28)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--card-text-head)' }}>Specs / Details: </strong>
                        {specsText}
                      </div>

                      {/* Details List (Location, Quantity, Health Note) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.83rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📍 Location:
                          </span>
                          <strong style={{ color: '#fff', fontWeight: 700 }}>{item.labLocation || 'NB-304'}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📦 Quantity / Units:
                          </span>
                          <strong style={{ color: 'var(--cyan-bright)', fontWeight: 800 }}>{itemTotalStock} Units</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ⚡ No. of Issues:
                          </span>
                          <strong style={{ color: itemIssuesCount > 0 ? '#ef4444' : 'var(--green-online)', fontWeight: 800 }}>
                            {itemIssuesCount} {itemIssuesCount === 1 ? 'Issue' : 'Issues'}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ✅ No. of Working:
                          </span>
                          <strong style={{ color: 'var(--green-online)', fontWeight: 800 }}>
                            {Math.max(0, itemTotalStock - itemIssuesCount)} Units
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            🔍 Health Note:
                          </span>
                          <strong style={{ color: itemIssuesCount > 0 ? 'var(--orange-accent)' : 'var(--green-online)', fontWeight: 700, textAlign: 'right', maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {healthNote}
                          </strong>
                        </div>
                      </div>

                      {/* Card Footer: Inspected Date + Action Buttons */}
                      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Inspected: {item.invoiceDate || '2026-08-04'}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setActiveTab('issues')}
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
                              setEditingItem(item);
                              setShowItemModal(true);
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}
                          >
                            {isAdmin ? 'Edit' : 'Entry'}
                          </button>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.itemId, item._id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                              title="Delete Item"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              /* View Mode 2: Table View */
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
                      <th style={{ padding: '12px 14px' }}>Subcategory</th>
                      <th style={{ padding: '12px 14px' }}>Total Stock</th>
                      <th style={{ padding: '12px 14px' }}>Invoice No</th>
                      <th style={{ padding: '12px 14px' }}>Serial No</th>
                      <th style={{ padding: '12px 14px' }}>Invoice Date</th>
                      <th style={{ padding: '12px 14px' }}>No. of Issues</th>
                      <th style={{ padding: '12px 14px' }}>No. of Working</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Lab Location</th>
                      <th style={{ padding: '12px 14px' }}>Assigned Staff</th>
                      <th style={{ padding: '12px 14px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const isSelected = !!selectedItems[item.itemId];
                      
                      const itemIssuesCount = issuesList.filter((iss) => {
                        if (iss.status === 'Completed' || iss.status === 'Resolved') return false;
                        const sameLab = !iss.labLocation || !item.labLocation || iss.labLocation.toLowerCase().replace(/\s+/g, '') === item.labLocation.toLowerCase().replace(/\s+/g, '');
                        if (!sameLab) return false;

                        const issEquip = (iss.equipmentName || '').toLowerCase().trim();
                        const issDev = (iss.deviceId || '').toLowerCase().trim();
                        const itemDev = (item.deviceName || '').toLowerCase().trim();
                        const itemId = (item.itemId || '').toLowerCase().trim();

                        const matchesName = issEquip && itemDev && (issEquip === itemDev || issEquip.includes(itemDev) || itemDev.includes(issEquip));
                        const matchesId = issDev && itemId && (issDev === itemId || issDev.includes(itemId) || itemId.includes(issDev));
                        const matchesDevName = issDev && itemDev && (issDev === itemDev || issDev.includes(itemDev) || itemDev.includes(issDev));

                        return matchesName || matchesId || matchesDevName;
                      }).reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

                      const matchingStock = stockList.find((s) => {
                        const sameLab = s.labLocation && item.labLocation && s.labLocation.toLowerCase().replace(/\s+/g, '') === item.labLocation.toLowerCase().replace(/\s+/g, '');
                        const sameCat = s.category === item.category || s.subCategory === item.category || (item.category === 'PCs' && s.subCategory?.includes('CPU'));
                        return sameLab && sameCat;
                      });
                      const itemTotalStock = matchingStock ? matchingStock.quantity : (item.quantity || 25);

                      const currentStatus = itemIssuesCount > 0 ? 'Pending Repair' : (item.status === 'Pending Repair' ? 'Online' : (item.status || 'Online'));
                      let statusClass = 'status-online';
                      if (currentStatus === 'Offline') statusClass = 'status-offline';
                      if (currentStatus === 'Pending Repair') statusClass = 'status-pending';
                      if (currentStatus === 'Completed' || currentStatus === 'Online') statusClass = 'status-completed';

                      return (
                        <tr
                          key={item.itemId || idx}
                          style={{
                            borderBottom: '1px solid var(--glass-border)',
                            background: isSelected ? 'rgba(0, 242, 254, 0.05)' : 'transparent',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{idx + 1}</td>
                          <td style={{ padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.deviceName}</td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{item.category}</td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.subCategory || categorizeEquipment(item.deviceName, item.category, item.subCategory)}</td>
                          <td style={{ padding: '14px', color: '#fff', fontWeight: 700 }}>{itemTotalStock}</td>
                          <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.invoiceNo || '-'}</td>
                          <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.serialNo || '-'}</td>
                          <td style={{ padding: '14px', color: 'var(--text-muted)' }}>{item.invoiceDate || '-'}</td>
                          <td style={{ padding: '14px' }}>
                            <button
                              onClick={() => {
                                if (itemIssuesCount > 0) {
                                  setActiveTab('pending');
                                } else {
                                  alert(`0 open issues for ${item.deviceName} in ${item.labLocation}. All equipment working!`);
                                }
                              }}
                              style={{
                                background: itemIssuesCount > 0 ? 'rgba(255, 159, 67, 0.18)' : 'rgba(16, 185, 129, 0.15)',
                                border: itemIssuesCount > 0 ? '1px solid rgba(255, 159, 67, 0.5)' : '1px solid rgba(16, 185, 129, 0.4)',
                                color: itemIssuesCount > 0 ? 'var(--orange-accent)' : 'var(--green-online)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title={itemIssuesCount > 0 ? "Click to view and resolve pending issues" : "0 issues logged"}
                            >
                              {itemIssuesCount} {itemIssuesCount === 1 ? 'Issue' : 'Issues'} {itemIssuesCount > 0 ? '→ Resolve' : ''}
                            </button>
                          </td>
                          <td style={{ padding: '14px', color: 'var(--green-online)', fontWeight: 800 }}>
                            {Math.max(0, itemTotalStock - itemIssuesCount)} Units
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span className={`status-pill ${statusClass}`}>{currentStatus}</span>
                          </td>
                          <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{item.labLocation}</td>
                          <td style={{ padding: '14px', color: 'var(--text-primary)' }}>{item.assignedStaff}</td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                onClick={() => alert(`Item details for S.No ${idx + 1}: ${item.deviceName} (${item.labLocation})\nTotal Stock: ${itemTotalStock}\nIssues Count: ${itemIssuesCount}\nStatus: ${currentStatus}`)}
                                style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setShowItemModal(true);
                                }}
                                style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                              >
                                {isAdmin ? 'Edit' : 'Entry/Update'}
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteItem(item.itemId, item._id)}
                                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </TabErrorBoundary>
      )}

      {showItemModal && (
        <ItemModal
          item={editingItem}
          onClose={() => setShowItemModal(false)}
          onSave={loadInventory}
        />
      )}

    </div>
  );
};

const ItemModal = ({ item, onClose, onSave }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const defaultLab = !isAdmin ? (user?.department || 'Lab A') : 'Lab A';

  const [itemId, setItemId] = useState(item ? item.itemId : '');
  const [deviceName, setDeviceName] = useState(item ? item.deviceName : '');
  const [category, setCategory] = useState(item ? (item.category === 'PCs' || item.category === 'Monitors' ? 'Hardware' : item.category) : 'Hardware');
  const [subCategory, setSubCategory] = useState(item ? (item.subCategory || 'cpu') : 'cpu');
  const [specs, setSpecs] = useState(item ? (item.specs || item.details || '') : '');
  const [invoiceNo, setInvoiceNo] = useState(item ? (item.invoiceNo || '') : '');
  const [serialNo, setSerialNo] = useState(item ? (item.serialNo || '') : '');
  const [invoiceDate, setInvoiceDate] = useState(item ? (item.invoiceDate || '') : '');
  const [status, setStatus] = useState(item ? item.status : 'Online');
  const [labLocation, setLabLocation] = useState(item ? item.labLocation : defaultLab);
  const [assignedStaff, setAssignedStaff] = useState(item ? (item.assignedStaff || '') : (user?.name || ''));

  const getAvailableSubcategories = (cat) => {
    if (cat === 'Electrical') return ['fans', 'lights', 'Acs'];
    if (cat === 'Workshop / Furniture') return ['chairs', 'tables', 'curtons'];
    return ['cpu', 'monitor', 'mouse', 'smartboard', 'keyboard', 'camera'];
  };

  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const subOpts = getAvailableSubcategories(newCat);
    if (!subOpts.includes(subCategory)) {
      setSubCategory(subOpts[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { itemId, deviceName, category, subCategory, specs, invoiceNo, serialNo, invoiceDate, status, labLocation, assignedStaff };
      if (item && (item._id || item.itemId)) {
        await fetchAPI(`/inventory/${item._id || item.itemId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchAPI('/inventory', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSave();
      onClose();
    } catch (err) {
      alert(err.message || 'Error saving item');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div className="lab-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
          {item ? 'Edit Hardware Item' : 'Add New Hardware Item'}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Item ID (e.g. PC-01)</label>
            <input type="text" required className="lab-input" value={itemId} onChange={(e) => setItemId(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Device Name</label>
            <input type="text" required className="lab-input" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Specs / Details</label>
            <input type="text" className="lab-input" placeholder="e.g. 2.4GHz Wireless USB Nano Receiver, Full-size layout" value={specs} onChange={(e) => setSpecs(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select className="lab-input" value={category} onChange={(e) => handleCategoryChange(e.target.value)}>
                <option value="Hardware">Hardware</option>
                <option value="Electrical">Electrical</option>
                <option value="Workshop / Furniture">Workshop / Furniture</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subcategory</label>
              <select className="lab-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                {getAvailableSubcategories(category).map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Invoice No</label>
              <input type="text" className="lab-input" placeholder="e.g. INV-9921" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Invoice Date</label>
              <input type="date" className="lab-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
            <select className="lab-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Pending Repair">Pending Repair</option>
              <option value="Completed">Completed</option>
            </select>
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
                  value={`${defaultLab} (Assigned Staff Room)`}
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assigned Staff</label>
              <input type="text" className="lab-input" value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="pill-filter">Cancel</button>
            <button type="submit" className="btn-cyan">Save Item</button>
          </div>
        </form>
      </div>
    </div>
  );
};
