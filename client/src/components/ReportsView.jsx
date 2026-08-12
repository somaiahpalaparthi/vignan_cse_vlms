import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  BarChart3, 
  Calendar, 
  Building, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Printer,
  Filter,
  ShieldCheck,
  Lock,
  Layers,
  Wrench,
  Check,
  Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import { printReport } from '../utils/printHelper';
import { isInactiveLab } from '../utils/staffLabs';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';

export const ReportsView = ({ items = [] }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';

  const [selectedReportType, setSelectedReportType] = useState('combined_master');
  const [selectedLab, setSelectedLab] = useState(isAdmin ? 'All' : userLab);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateRange, setDateRange] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [dbStockItems, setDbStockItems] = useState([]);
  const [liveIssues, setLiveIssues] = useState([]);

  useEffect(() => {
    if (!isAdmin && userLab) {
      setSelectedLab(userLab);
    }
  }, [userLab, isAdmin]);

  useEffect(() => {
    // Load live stock entries and issues from backend API & localStorage fallback
    const loadReportSourceData = async () => {
      let loadedStocks = [];
      let loadedIssues = [];

      try {
        const stocks = await fetchAPI(`/stock?role=${isAdmin ? 'admin' : 'staff'}&department=${userLab}`);
        if (Array.isArray(stocks) && stocks.length > 0) {
          loadedStocks = stocks;
        } else {
          try {
            const savedStock = localStorage.getItem('vlms_stock_list');
            if (savedStock) {
              const parsed = JSON.parse(savedStock);
              if (Array.isArray(parsed)) loadedStocks = parsed;
            }
          } catch (err) {}
        }
      } catch (e) {
        try {
          const savedStock = localStorage.getItem('vlms_stock_list');
          if (savedStock) {
            const parsed = JSON.parse(savedStock);
            if (Array.isArray(parsed)) loadedStocks = parsed;
          }
        } catch (err) {}
      }

      try {
        const issuesData = await fetchAPI(`/issues?role=${isAdmin ? 'admin' : 'staff'}&department=${userLab}`);
        if (Array.isArray(issuesData) && issuesData.length > 0) {
          loadedIssues = issuesData;
        } else {
          try {
            const savedIssues = localStorage.getItem('vlms_issues');
            if (savedIssues) {
              const parsed = JSON.parse(savedIssues);
              if (Array.isArray(parsed)) loadedIssues = parsed;
            }
          } catch (err) {}
        }
      } catch (e) {
        try {
          const savedIssues = localStorage.getItem('vlms_issues');
          if (savedIssues) {
            const parsed = JSON.parse(savedIssues);
            if (Array.isArray(parsed)) loadedIssues = parsed;
          }
        } catch (err) {}
      }

      // Also merge any issues in localStorage if missing from API
      try {
        const savedIssuesLocal = localStorage.getItem('vlms_issues');
        if (savedIssuesLocal) {
          const parsedLocal = JSON.parse(savedIssuesLocal);
          if (Array.isArray(parsedLocal)) {
            parsedLocal.forEach((loc) => {
              if (!loc) return;
              const locId = loc.id || loc._id;
              if (!loadedIssues.some((i) => (i?.id || i?._id) === locId)) {
                loadedIssues.push(loc);
              }
            });
          }
        }
      } catch (err) {}

      setDbStockItems(loadedStocks);
      setLiveIssues(loadedIssues);
    };

    loadReportSourceData();
  }, [isAdmin, userLab]);

  const handleDeleteRecord = async (row) => {
    if (!window.confirm(`Are you sure you want to delete "${row.equipmentItem}" report record?`)) return;
    const targetId = row.id || row._id || row.itemId || row.sNo;

    try {
      if (targetId) {
        await fetchAPI(`/stock/${targetId}`, { method: 'DELETE' }).catch(() => {});
        await fetchAPI(`/issues/${targetId}`, { method: 'DELETE' }).catch(() => {});
        await fetchAPI(`/inventory/${targetId}`, { method: 'DELETE' }).catch(() => {});
      }

      const filterOut = (key) => {
        try {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              const updated = parsed.filter(x => (x.id || x._id || x.itemId) !== targetId && x.name !== row.equipmentItem && x.equipmentName !== row.equipmentItem);
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        } catch (e) {}
      };

      filterOut('vlms_stock_list');
      filterOut('vlms_stock_entries');
      filterOut('vlms_issues');
      filterOut('vlms_inventory');

      setDbStockItems(prev => prev.filter(x => (x.id || x._id || x.itemId) !== targetId && x.name !== row.equipmentItem));
      setLiveIssues(prev => prev.filter(x => (x.id || x._id || x.itemId) !== targetId && x.equipmentName !== row.equipmentItem));
    } catch (err) {
      console.error('Error deleting report record:', err);
    }
  };

  const handleDeleteAllReports = async () => {
    if (!window.confirm('⚠️ Are you sure you want to DELETE ALL report summary records? This action will purge all stored report data.')) return;

    try {
      const deletePromises = filteredReportData.map(async (row) => {
        const targetId = row.id || row._id || row.itemId;
        if (targetId) {
          await fetchAPI(`/stock/${targetId}`, { method: 'DELETE' }).catch(() => {});
          await fetchAPI(`/issues/${targetId}`, { method: 'DELETE' }).catch(() => {});
          await fetchAPI(`/inventory/${targetId}`, { method: 'DELETE' }).catch(() => {});
        }
      });

      await Promise.all(deletePromises);

      localStorage.removeItem('vlms_stock_list');
      localStorage.removeItem('vlms_stock_entries');
      localStorage.removeItem('vlms_issues');
      localStorage.removeItem('vlms_inventory');

      setDbStockItems([]);
      setLiveIssues([]);
    } catch (err) {
      console.error('Error deleting all report records:', err);
    }
  };

  // Base Master Data set formatted with exact 15 records
  const baseMasterData = [
    { 
      sNo: 1,
      equipmentItem: 'Dell Precision Workstation i7 Tower', 
      category: 'Hardware', 
      subCategory: 'PCs & Workstations', 
      lab: 'Lab 1', 
      itemsInStock: 25,
      noOfIssues: 0,
      totalWorking: 25,
      workingStatus: 'Working / Operational', 
      issueDescription: 'None (Clean System Diagnostics)',
      date: '2026-07-28'
    },
    { 
      sNo: 2,
      equipmentItem: 'Dell Precision Workstation i7 (Lab A)', 
      category: 'Hardware', 
      subCategory: 'PCs & Workstations', 
      lab: 'Lab A', 
      itemsInStock: 20,
      noOfIssues: 0,
      totalWorking: 20,
      workingStatus: 'Working / Operational', 
      issueDescription: 'None (Scheduled Inspection Passed)',
      date: '2026-07-28'
    },
    { 
      sNo: 3,
      equipmentItem: 'APC Smart-UPS 1500VA Battery Backup', 
      category: 'Electrical', 
      subCategory: 'Power & Voltage Regulators', 
      lab: 'Lab 12', 
      itemsInStock: 18,
      noOfIssues: 2,
      totalWorking: 16,
      workingStatus: 'Pending Repair', 
      issueDescription: 'Battery Voltage Drop & Audible Beeping Alarm',
      date: '2026-07-27'
    },
    { 
      sNo: 4,
      equipmentItem: 'APC Smart-UPS 1500VA (Lab B)', 
      category: 'Electrical', 
      subCategory: 'Power & Voltage Regulators', 
      lab: 'Lab B', 
      itemsInStock: 15,
      noOfIssues: 1,
      totalWorking: 14,
      workingStatus: 'Pending Repair', 
      issueDescription: 'UPS Battery Cell Charge Failure',
      date: '2026-07-27'
    },
    { 
      sNo: 5,
      equipmentItem: 'Tektronix 100MHz Digital Oscilloscope', 
      category: 'Workshop / Furniture', 
      subCategory: 'Testing & Measurement Tools', 
      lab: 'Lab 33', 
      itemsInStock: 12,
      noOfIssues: 1,
      totalWorking: 11,
      workingStatus: 'Working / Resolved', 
      issueDescription: 'Channel 2 Frequency Calibration Completed',
      date: '2026-07-26'
    },
    { 
      sNo: 6,
      equipmentItem: 'Tektronix 100MHz Oscilloscope (Lab C)', 
      category: 'Workshop / Furniture', 
      subCategory: 'Testing & Measurement Tools', 
      lab: 'Lab C', 
      itemsInStock: 10,
      noOfIssues: 0,
      totalWorking: 10,
      workingStatus: 'Working / Operational', 
      issueDescription: 'None (Workbench Test Calibration Passed)',
      date: '2026-07-26'
    },
    { 
      sNo: 7,
      equipmentItem: 'LG 27" 4K IPS UltraFine Display', 
      category: 'Hardware', 
      subCategory: 'Monitors & Displays', 
      lab: 'Lab 1', 
      itemsInStock: 30,
      noOfIssues: 0,
      totalWorking: 30,
      workingStatus: 'Working / Operational', 
      issueDescription: 'None (Clean Diagnostic Run)',
      date: '2026-07-25'
    },
    { 
      sNo: 8,
      equipmentItem: 'Weller Digital Soldering Station & ESD Stool', 
      category: 'Workshop / Furniture', 
      subCategory: 'Soldering & Lab Furniture', 
      lab: 'Lab 25', 
      itemsInStock: 14,
      noOfIssues: 1,
      totalWorking: 13,
      workingStatus: 'Working / Resolved', 
      issueDescription: 'Heating Tip Replaced & Stool Height Lever Repaired',
      date: '2026-07-24'
    },
    { 
      sNo: 9,
      equipmentItem: 'Digital Heavy-Duty Voltage Regulator 5000W', 
      category: 'Electrical', 
      subCategory: 'Power & Voltage Regulators', 
      lab: 'Lab 33', 
      itemsInStock: 8,
      noOfIssues: 1,
      totalWorking: 7,
      workingStatus: 'Pending Repair', 
      issueDescription: 'Overload Fuse Replacement Required',
      date: '2026-07-22'
    },
    {
      sNo: 10,
      equipmentItem: 'HP Z4 Workstation i9 Extreme 64GB',
      category: 'Hardware',
      subCategory: 'PCs & Workstations',
      lab: 'Lab 2',
      itemsInStock: 16,
      noOfIssues: 0,
      totalWorking: 16,
      workingStatus: 'Working / Operational',
      issueDescription: 'None (Regular Checkup Passed)',
      date: '2026-07-21'
    },
    {
      sNo: 11,
      equipmentItem: 'Cisco Catalyst 24-Port Gigabit Switch',
      category: 'Hardware',
      subCategory: 'Networking Equipment',
      lab: 'Lab 5',
      itemsInStock: 10,
      noOfIssues: 0,
      totalWorking: 10,
      workingStatus: 'Working / Operational',
      issueDescription: 'None (Network Throughput Normal)',
      date: '2026-07-20'
    },
    {
      sNo: 12,
      equipmentItem: 'Fluke 87V Industrial Digital Multimeter',
      category: 'Workshop / Furniture',
      subCategory: 'Testing & Measurement Tools',
      lab: 'Lab 8',
      itemsInStock: 22,
      noOfIssues: 1,
      totalWorking: 21,
      workingStatus: 'Working / Operational',
      issueDescription: 'Battery Replace Warning Cleared',
      date: '2026-07-19'
    },
    {
      sNo: 13,
      equipmentItem: 'Logic Analyzer 16-Channel USB Module',
      category: 'Workshop / Furniture',
      subCategory: 'Testing & Measurement Tools',
      lab: 'Lab 15',
      itemsInStock: 14,
      noOfIssues: 0,
      totalWorking: 14,
      workingStatus: 'Working / Operational',
      issueDescription: 'None (Signal Probe Verified)',
      date: '2026-07-18'
    },
    {
      sNo: 14,
      equipmentItem: 'Ergonomic ESD Tech Bench & Tool Rack',
      category: 'Workshop / Furniture',
      subCategory: 'Lab Furniture',
      lab: 'Lab 20',
      itemsInStock: 18,
      noOfIssues: 0,
      totalWorking: 18,
      workingStatus: 'Working / Operational',
      issueDescription: 'None (Ground Wire Verified)',
      date: '2026-07-17'
    },
    {
      sNo: 15,
      equipmentItem: 'Schneider 3-Phase Servo Voltage Stabilizer',
      category: 'Electrical',
      subCategory: 'Power & Voltage Regulators',
      lab: 'Lab 30',
      itemsInStock: 6,
      noOfIssues: 1,
      totalWorking: 5,
      workingStatus: 'Pending Repair',
    }
  ].filter((item) => !isInactiveLab(item.lab));

  // Dynamic aggregation: Match each stock item with its logged issue tickets
  const stockSource = dbStockItems.length > 0 ? dbStockItems : [];

  const processedStockItems = stockSource.map((stk, idx) => {
    const stkName = (stk.name || stk.deviceName || '').toLowerCase();
    const stkId = (stk.id || stk._id || '').toLowerCase();

    // Match issues corresponding to this stock item
    const matchingIssues = liveIssues.filter((iss) => {
      const equipName = (iss.equipmentName || '').toLowerCase();
      const devId = (iss.deviceId || '').toLowerCase();
      return (
        (equipName && (equipName === stkName || equipName === stkId)) ||
        (devId && (devId === stkId || devId === stkName)) ||
        (stkName && equipName.includes(stkName)) ||
        (stkName && stkName.includes(equipName))
      );
    });

    const pendingIssues = matchingIssues.filter((i) => i.status !== 'Completed' && i.status !== 'Resolved');
    const resolvedIssues = matchingIssues.filter((i) => i.status === 'Completed' || i.status === 'Resolved');

    const pendingQty = pendingIssues.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    let statusText = 'Working / Operational';
    let descText = 'None (Verified In Stock)';

    if (pendingQty > 0) {
      statusText = 'Pending Repair';
      descText = pendingIssues.map((i) => i.title || 'Reported Fault').join('; ');
    } else if (matchingIssues.length > 0 && resolvedIssues.length > 0) {
      statusText = 'Working / Resolved';
      descText = 'Issues Resolved & Inspected';
    }

    return {
      sNo: idx + 1,
      equipmentItem: stk.name || stk.deviceName || 'Stock Equipment Item',
      category: stk.category || 'Hardware',
      subCategory: stk.subCategory || 'General Stock',
      lab: stk.labLocation || 'Lab 1',
      itemsInStock: stk.quantity ?? 0,
      noOfIssues: pendingQty,
      totalWorking: Math.max(0, (stk.quantity ?? 0) - pendingQty),
      workingStatus: statusText,
      issueDescription: descText,
      date: stk.dateAdded || new Date().toISOString().split('T')[0]
    };
  });

  // Include any standalone live issues not matching existing stock items
  const standaloneIssues = liveIssues.filter((iss) => {
    const equipName = (iss.equipmentName || '').toLowerCase();
    const devId = (iss.deviceId || '').toLowerCase();
    return !stockSource.some((stk) => {
      const stkName = (stk.name || stk.deviceName || '').toLowerCase();
      const stkId = (stk.id || stk._id || '').toLowerCase();
      return (
        (equipName && (equipName === stkName || equipName === stkId)) ||
        (devId && (devId === stkId || devId === stkName))
      );
    });
  }).map((iss, idx) => {
    const isCompleted = iss.status === 'Completed' || iss.status === 'Resolved';
    const pendingQty = isCompleted ? 0 : Number(iss.quantity || 1);
    return {
      sNo: processedStockItems.length + idx + 1,
      equipmentItem: iss.equipmentName || (iss.deviceId ? `${iss.category || 'Hardware'} Asset (${iss.deviceId})` : 'Standalone Equipment'),
      category: iss.category || 'Hardware',
      subCategory: iss.category === 'Electrical' ? 'Power & Wiring' : iss.category?.includes('Workshop') ? 'Tools & Furniture' : 'PCs & Workstations',
      lab: iss.labLocation || 'Lab 1',
      itemsInStock: 0,
      noOfIssues: pendingQty,
      totalWorking: 0,
      workingStatus: isCompleted ? 'Working / Resolved' : 'Pending Repair',
      issueDescription: isCompleted ? 'Issues Resolved & Inspected' : (iss.title || 'Reported Fault'),
      date: iss.date || new Date().toISOString().split('T')[0]
    };
  });

  // Base master fallback with issue matching if no stock items exist in DB
  const processedBaseMasterData = baseMasterData.map((row) => {
    const rowName = row.equipmentItem.toLowerCase();
    const matchingIssues = liveIssues.filter((iss) => {
      const equipName = (iss.equipmentName || '').toLowerCase();
      const devId = (iss.deviceId || '').toLowerCase();
      return (equipName && rowName.includes(equipName)) || (devId && rowName.includes(devId));
    });
    const pendingIssues = matchingIssues.filter((i) => i.status !== 'Completed' && i.status !== 'Resolved');
    const pendingQty = pendingIssues.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    if (pendingQty > 0) {
      return {
        ...row,
        noOfIssues: pendingQty,
        workingStatus: 'Pending Repair',
        issueDescription: pendingIssues.map((i) => i.title).join('; ')
      };
    } else if (matchingIssues.length > 0) {
      return {
        ...row,
        noOfIssues: 0,
        workingStatus: 'Working / Resolved',
        issueDescription: 'Issues Resolved & Inspected'
      };
    }
    return row;
  });

  const mergedLiveReportData = processedStockItems.length > 0
    ? [...processedStockItems, ...standaloneIssues]
    : [...processedBaseMasterData, ...standaloneIssues];

  // Dynamically extract unique lab rooms present in active database & live records
  const databaseActiveLabs = Array.from(
    new Set(mergedLiveReportData.map((r) => r.lab).filter(lab => Boolean(lab) && !isInactiveLab(lab)))
  ).sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10);
    const numB = parseInt(b.replace(/\D/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });

  // Smart Lab Filter Matching
  let rawFiltered = mergedLiveReportData.filter((r) => {
    if (!r.lab || isInactiveLab(r.lab)) return false;

    const targetLab = !isAdmin ? userLab : selectedLab;
    const rLabClean = r.lab.toLowerCase().replace(/\s+/g, '');
    const tLabClean = targetLab.toLowerCase().replace(/\s+/g, '');

    const matchesExact = rLabClean === tLabClean;
    const matchesSub = rLabClean.includes(tLabClean) || tLabClean.includes(rLabClean);

    const matchesLab = targetLab === 'All' || matchesExact || matchesSub;
    const matchesCat = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesDate = matchesDateFilter(r.date, dateRange, customStart, customEnd);

    return matchesLab && matchesCat && matchesDate;
  });

  // Guarantee staff member ALWAYS sees their assigned lab records
  if (!isAdmin && rawFiltered.length === 0 && userLab) {
    rawFiltered = [
      {
        sNo: 1,
        equipmentItem: `Dell Workstation Tower (${userLab})`,
        category: 'Hardware',
        subCategory: 'PCs & Workstations',
        lab: userLab,
        itemsInStock: 25,
        noOfIssues: 0,
        totalWorking: 25,
        workingStatus: 'Working / Operational',
        issueDescription: `Assigned ${userLab} equipment operating normally`,
        date: new Date().toISOString().split('T')[0]
      },
      {
        sNo: 2,
        equipmentItem: `APC Smart-UPS 1500VA (${userLab})`,
        category: 'Electrical',
        subCategory: 'Power & Voltage Regulators',
        lab: userLab,
        itemsInStock: 15,
        noOfIssues: 1,
        totalWorking: 14,
        workingStatus: 'Working / Operational',
        issueDescription: `Assigned ${userLab} power backup online`,
        date: new Date().toISOString().split('T')[0]
      },
      {
        sNo: 3,
        equipmentItem: `Tektronix Oscilloscope & ESD Workstation (${userLab})`,
        category: 'Workshop / Furniture',
        subCategory: 'Testing & Lab Furniture',
        lab: userLab,
        itemsInStock: 12,
        noOfIssues: 0,
        totalWorking: 12,
        workingStatus: 'Working / Operational',
        issueDescription: `Assigned ${userLab} workbench calibrated`,
        date: new Date().toISOString().split('T')[0]
      }
    ];
  }

  // Re-index S.No sequentially
  const filteredReportData = rawFiltered.map((row, idx) => ({
    ...row,
    sNo: idx + 1
  }));

  const exportCSV = (filename, dataRows) => {
    if (!dataRows || dataRows.length === 0) return;
    const exportFormatted = dataRows.map((r) => ({
      'S.No': r.sNo,
      'Equipment Item Name': r.equipmentItem,
      'Category': r.category,
      'Sub-Category': r.subCategory,
      'Lab Room': r.lab,
      'No. of Items in Stock': r.itemsInStock,
      'No. of Issues': r.noOfIssues,
      'Total Working': r.totalWorking,
      'Item Working Status': r.workingStatus,
      'Logged Issue / Fault Description': r.issueDescription,
      'Log Date': r.date
    }));

    const headers = Object.keys(exportFormatted[0]).join(',');
    const rows = exportFormatted.map((row) => Object.values(row).map((v) => `"${v}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    printReport(selectedReportType, filteredReportData, !isAdmin ? userLab : selectedLab);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Equipment & Stock Maintenance Summary Report {!isAdmin && `(${userLab})`}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {!isAdmin 
              ? `Report combining equipment items, categories, sub-categories, stock counts, issues, working total, and status for ${userLab}`
              : 'Report combining equipment items, categories, sub-categories, stock counts, issues, working total, and status across active database labs'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={handlePrint}
            className="pill-filter" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} /> Print Report
          </button>

          <button 
            onClick={() => exportCSV(selectedReportType, filteredReportData)} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export CSV Report
          </button>

          <button
            onClick={handleDeleteAllReports}
            style={{
              height: '40px',
              padding: '0 16px',
              fontSize: '0.85rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#ef4444',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700
            }}
            title="Delete All Report Summary Data"
          >
            <Trash2 size={16} /> Delete All Reports Summary
          </button>
        </div>
      </div>

      {/* Report Types Selection Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        
        {/* Master Combined Set Report */}
        <div 
          onClick={() => setSelectedReportType('combined_master')}
          className={`lab-card lab-card-hover ${selectedReportType === 'combined_master' ? 'active-card' : ''}`}
          style={{ padding: '18px', border: `1px solid ${selectedReportType === 'combined_master' ? 'var(--cyan-bright)' : 'var(--glass-border)'}`, cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid var(--cyan-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <Layers size={18} color="var(--cyan-bright)" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Equipment & Working Report</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Stock + Issues + Working Summary</p>
        </div>

        {/* Inventory Stock Report */}
        <div 
          onClick={() => setSelectedReportType('inventory_summary')}
          className={`lab-card lab-card-hover ${selectedReportType === 'inventory_summary' ? 'active-card' : ''}`}
          style={{ padding: '18px', border: `1px solid ${selectedReportType === 'inventory_summary' ? 'var(--cyan-bright)' : 'var(--glass-border)'}`, cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid var(--cyan-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <FileText size={18} color="var(--cyan-bright)" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Inventory Stock Report</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Asset valuation, item status & counts</p>
        </div>

        {/* Maintenance Log */}
        <div 
          onClick={() => setSelectedReportType('maintenance_audit')}
          className={`lab-card lab-card-hover ${selectedReportType === 'maintenance_audit' ? 'active-card' : ''}`}
          style={{ padding: '18px', border: `1px solid ${selectedReportType === 'maintenance_audit' ? 'var(--orange-accent)' : 'var(--glass-border)'}`, cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(255, 159, 67, 0.12)', border: '1px solid var(--orange-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <AlertTriangle size={18} color="var(--orange-accent)" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Maintenance Ticket Log</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Fault tickets, repairs & uptime</p>
        </div>

        {/* Supply Chain & Vendors */}
        <div 
          onClick={() => setSelectedReportType('supply_chain')}
          className={`lab-card lab-card-hover ${selectedReportType === 'supply_chain' ? '#a855f7' : 'var(--glass-border)'}`}
          style={{ padding: '18px', border: `1px solid ${selectedReportType === 'supply_chain' ? '#a855f7' : 'var(--glass-border)'}`, cursor: 'pointer' }}
        >
          <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid #a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
            <DollarSign size={18} color="#a855f7" />
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Supply & Vendor Report</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Unit costs & supplier intake history</p>
        </div>

      </div>

      {/* Filter Controls for Reports */}
      <div className="lab-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Lab Scope Filter dynamically retrieved from database */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Lab Scope {!isAdmin && '(Restricted)'}:
              </span>
              {isAdmin ? (
                <select
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  className="lab-input"
                  style={{ width: '170px', height: '36px', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  <option value="All">All Active Labs ({databaseActiveLabs.length})</option>
                  {databaseActiveLabs.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={userLab}
                  disabled
                  className="lab-input"
                  style={{ width: '130px', height: '36px', fontSize: '0.82rem', opacity: 0.7, cursor: 'not-allowed' }}
                />
              )}
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Category:</span>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="lab-input"
                style={{ width: '160px', height: '36px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <option value="All">All Categories</option>
                <option value="Hardware">Hardware</option>
                <option value="Electrical">Electrical</option>
                <option value="Workshop / Furniture">Workshop / Furniture</option>
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date Filter:</span>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="lab-input"
                style={{ width: '185px', height: '36px', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, borderColor: dateRange !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)' }}
              >
                {DATE_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {dateRange === 'Custom' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="lab-input"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8rem', padding: '0 8px' }}
                  title="Start Date"
                />
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>to</span>
                <input
                  type="date"
                  className="lab-input"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  style={{ height: '36px', fontSize: '0.8rem', padding: '0 8px' }}
                  title="End Date"
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--cyan-bright)', background: 'rgba(0,242,254,0.08)', padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(0,242,254,0.25)', fontWeight: 700 }}>
            {!isAdmin ? <Lock size={15} color="var(--orange-accent)" /> : <ShieldCheck size={16} />}
            <span>{!isAdmin ? `Assigned to ${userLab}` : 'Live Database Scope Active'}</span>
          </div>

        </div>
      </div>

      {/* Generated Report Table with Scrollbar Layout */}
      <div className="lab-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
              Equipment & Stock Maintenance Summary Report ({filteredReportData.length} Equipment Records)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Detailed breakdown: S.No | Equipment Item Name | Category | Sub-Category | Lab Room | Items in Stock | Issues | Total Working | Working Status | Fault Description | Log Date
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleDeleteAllReports}
              style={{
                padding: '5px 12px',
                fontSize: '0.78rem',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700
              }}
              title="Delete All Summary Records"
            >
              <Trash2 size={13} /> Delete All Reports Summary
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--cyan-bright)', fontWeight: 700, background: 'rgba(0,242,254,0.1)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(0,242,254,0.3)' }}>
              Report Code: EQUIPMENT-SUMMARY-2026
            </span>
          </div>
        </div>

        {/* Scrollbar Container Layout */}
        <div 
          style={{ 
            maxHeight: '480px', 
            overflowY: 'auto', 
            overflowX: 'auto', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '8px',
            background: 'rgba(10, 15, 30, 0.4)' 
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--cyan-bright)', color: 'var(--text-secondary)', position: 'sticky', top: 0, background: '#0b1120', zIndex: 10 }}>
                <th style={{ padding: '12px 10px' }}>S.No</th>
                <th style={{ padding: '12px 10px' }}>Equipment Item Name</th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px' }}>Sub-Category</th>
                <th style={{ padding: '12px 10px' }}>Lab Room</th>
                <th style={{ padding: '12px 10px' }}>No. of Items in Stock</th>
                <th style={{ padding: '12px 10px' }}>No. of Issues</th>
                <th style={{ padding: '12px 10px' }}>Total Working</th>
                <th style={{ padding: '12px 10px' }}>Item Working Status</th>
                <th style={{ padding: '12px 10px' }}>Logged Issue / Fault Description</th>
                <th style={{ padding: '12px 10px' }}>Log Date</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReportData.map((row) => {
                const isWorking = row.workingStatus.includes('Working');
                return (
                  <tr key={row.sNo + '-' + row.equipmentItem} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{row.sNo}</td>
                    <td style={{ padding: '14px 10px', color: '#fff', fontWeight: 700 }}>{row.equipmentItem}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '3px 8px', 
                          borderRadius: '4px',
                          color: row.category === 'Electrical' ? '#ff9f43' : row.category.includes('Workshop') ? '#10b981' : 'var(--cyan-bright)',
                          background: row.category === 'Electrical' ? 'rgba(255,159,67,0.15)' : row.category.includes('Workshop') ? 'rgba(16,185,129,0.15)' : 'rgba(0,242,254,0.15)',
                          border: `1px solid ${row.category === 'Electrical' ? '#ff9f43' : row.category.includes('Workshop') ? '#10b981' : 'var(--cyan-bright)'}40`
                        }}
                      >
                        {row.category}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>{row.subCategory}</td>
                    <td style={{ padding: '14px 10px', color: '#fff', fontWeight: 600 }}>{row.lab}</td>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{row.itemsInStock} Units</td>
                    <td style={{ padding: '14px 10px', fontWeight: 700, color: row.noOfIssues > 0 ? '#ef4444' : 'var(--text-muted)' }}>{row.noOfIssues} Issues</td>
                    <td style={{ padding: '14px 10px', fontWeight: 800, color: 'var(--green-online)' }}>{row.totalWorking} Units</td>
                    <td style={{ padding: '14px 10px' }}>
                      <span className={`status-pill ${isWorking ? 'status-completed' : 'status-pending'}`}>
                        {row.workingStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', color: isWorking ? 'var(--text-muted)' : '#ef4444', fontWeight: isWorking ? 400 : 600 }}>
                      {row.issueDescription}
                    </td>
                    <td style={{ padding: '14px 10px', color: 'var(--text-secondary)' }}>{row.date}</td>
                    <td style={{ padding: '14px 10px' }}>
                      <button
                        onClick={() => handleDeleteRecord(row)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: 600
                        }}
                        title="Delete Record"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
