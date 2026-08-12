import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, CheckCircle, Clock, Wrench, ShieldAlert, Lock, RefreshCw, Edit2, Trash2, MessageSquare, Copy, Check, Send, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';
import { getAssignedStaffLabs, isInactiveLab } from '../utils/staffLabs';
import { printAllIssues, printPendingIssues, printCompletedIssues, printIndividualIssue } from '../utils/printHelper';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';

export const getTechnicianDisplay = (iss) => {
  if (!iss) return null;
  const tech = iss.assignedTech || iss.assignedTechnician || iss.technician || iss.assignedStaff;
  if (!tech) return null;

  if (typeof tech === 'object') {
    const name = tech.name || tech.technicianName || tech.staffName || '';
    const phone = tech.phone || tech.mobileNumber || tech.mobile || '';
    if (name && name.toLowerCase() !== 'unassigned') {
      return { name, phone };
    }
    if (phone) {
      return { name: 'Technician Assigned', phone };
    }
    return null;
  }

  if (typeof tech === 'string' && tech.trim() !== '' && tech.toLowerCase() !== 'unassigned') {
    return { name: tech.trim(), phone: '' };
  }

  return null;
};

export const getDaysToResolveDisplay = (iss) => {
  if (!iss) return '1 Day';

  const raw = iss.daysTaken ? String(iss.daysTaken).trim() : '';
  if (raw && raw !== '0 Days' && raw !== '0' && raw !== '0 Days (Same Day)') {
    return raw;
  }

  const startDateStr = iss.postedDate || iss.date || (iss.createdAt ? new Date(iss.createdAt).toISOString().split('T')[0] : null);
  const endDateStr = iss.resolvedDate || (iss.updatedAt ? new Date(iss.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

  if (!startDateStr) return '1 Day';

  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffMs = Math.abs(end - start);
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    return `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
  } catch (e) {
    return '1 Day';
  }
};

export const IssuesView = ({ selectedLab: globalSelectedLab, items = [], onReload }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';

  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [loading, setLoading] = useState(false);

  const defaultIssues = [];

  const [issuesList, setIssuesList] = useState(() => {
    try {
      const saved = localStorage.getItem('vlms_issues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && !parsed.some(i => i.id === 'ISS-100')) return parsed;
      }
    } catch (e) {}
    localStorage.removeItem('vlms_issues');
    return [];
  });

  const [stockItems, setStockItems] = useState([]);
  const [equipmentName, setEquipmentName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [title, setTitle] = useState('');
  const [issueCategory, setIssueCategory] = useState('Hardware');
  const [subCategory, setSubCategory] = useState('cpu');
  const [severity, setSeverity] = useState('High');
  const [issueStatus, setIssueStatus] = useState('Pending Repair');
  const [labLocation, setLabLocation] = useState(!isAdmin ? userLab : 'Lab 12');
  const [postedDate, setPostedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [assignedTechName, setAssignedTechName] = useState('');
  const [assignedTechPhone, setAssignedTechPhone] = useState('');

  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedTechIssue, setSelectedTechIssue] = useState(null);
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageIssue, setMessageIssue] = useState(null);
  const [selectedMessageTech, setSelectedMessageTech] = useState(null);
  const [messagePhone, setMessagePhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolvingIssue, setResolvingIssue] = useState(null);
  const [resPostedDate, setResPostedDate] = useState('');
  const [resResolvedDate, setResResolvedDate] = useState('');

  useEffect(() => {
    loadIssues();
    loadStockOptions();
  }, [user, isAdmin, userLab]);

  const loadStockOptions = async () => {
    try {
      const data = await fetchAPI('/stock');
      if (Array.isArray(data) && data.length > 0) {
        setStockItems(data);
      } else {
        try {
          const saved = localStorage.getItem('vlms_stock_list');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) setStockItems(parsed);
          }
        } catch (err) {}
      }
    } catch (err) {
      try {
        const saved = localStorage.getItem('vlms_stock_list');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) setStockItems(parsed);
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    localStorage.setItem('vlms_issues', JSON.stringify(issuesList));
  }, [issuesList]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/issues');
      if (Array.isArray(data)) {
        setIssuesList(data);
      }
    } catch (err) {
      console.error('Error fetching issues from MongoDB Atlas:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingIssue(null);
    setEquipmentName('');
    setDeviceId('');
    setSerialNo('');
    setIssueQuantity(1);
    setTitle('');
    setIssueCategory('Hardware');
    setSubCategory('cpu');
    setSeverity('High');
    setIssueStatus('Pending Repair');
    setLabLocation(!isAdmin ? userLab : 'Lab 1');
    setPostedDate(new Date().toISOString().split('T')[0]);
    setAssignedTechName('');
    setAssignedTechPhone('');
    setShowModal(true);
  };

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setEquipmentName(issue.equipmentName || issue.deviceId || '');
    setDeviceId(issue.deviceId || '');
    setSerialNo(issue.serialNo || issue.serialNumber || '');
    setIssueQuantity(issue.quantity || 1);
    setTitle(issue.title || '');
    setIssueCategory(issue.category || 'Hardware');
    setSubCategory(issue.subCategory || 'cpu');
    setSeverity(issue.severity || 'High');
    setIssueStatus(issue.status || 'Pending Repair');
    setLabLocation(issue.labLocation || (!isAdmin ? userLab : 'Lab 1'));
    setPostedDate(issue.postedDate || issue.date || new Date().toISOString().split('T')[0]);

    const techInfo = getTechnicianDisplay(issue);
    setAssignedTechName(techInfo?.name || '');
    setAssignedTechPhone(techInfo?.phone || '');
    setShowModal(true);
  };

  const handleEquipmentChange = (val) => {
    setEquipmentName(val);
    const matchedStock = stockItems.find((s) => (s.name || s.deviceName) === val || s.id === val);
    if (matchedStock) {
      setDeviceId(matchedStock.id || matchedStock._id || val);
      if (matchedStock.serialNo) setSerialNo(matchedStock.serialNo);
      if (matchedStock.category) setIssueCategory(matchedStock.category);
      if (matchedStock.subCategory) setSubCategory(matchedStock.subCategory);
    } else {
      setDeviceId(val);
    }
  };

  const handleCategoryChange = (cat) => {
    setIssueCategory(cat);
    if (cat === 'Electrical') setSubCategory('fans');
    else if (cat === 'Workshop / Furniture') setSubCategory('chairs');
    else setSubCategory('cpu');
  };

  const handleSaveIssue = async (e) => {
    e.preventDefault();
    const finalEquipName = equipmentName || deviceId;
    const qtyDeduct = Math.max(1, Number(issueQuantity || 1));
    if (!title || !finalEquipName) return;

    const targetLab = !isAdmin ? userLab : (labLocation || 'Lab 1');

    const existingTechInfo = getTechnicianDisplay(editingIssue);
    const finalTechName = assignedTechName || existingTechInfo?.name || '';
    const finalTechPhone = assignedTechPhone || existingTechInfo?.phone || '';
    const techObj = finalTechName ? { name: finalTechName, phone: finalTechPhone } : (editingIssue?.assignedTech || {});
    const techStaffStr = finalTechName || editingIssue?.assignedStaff || '';

    try {
      if (editingIssue) {
        // Edit existing issue
        const payload = {
          equipmentName: finalEquipName,
          deviceId: deviceId || finalEquipName,
          serialNo: serialNo || '',
          quantity: qtyDeduct,
          title,
          category: issueCategory,
          subCategory,
          severity,
          status: issueStatus,
          labLocation: targetLab,
          postedDate: postedDate || new Date().toISOString().split('T')[0],
          assignedTech: techObj,
          assignedStaff: techStaffStr
        };

        const res = await fetchAPI(`/issues/${editingIssue.id || editingIssue._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });

        const targetId = editingIssue.id || editingIssue._id;
        const savedDate = postedDate || new Date().toISOString().split('T')[0];

        if (res && res.issue) {
          setIssuesList(issuesList.map((i) => (i.id === targetId || i._id === targetId ? { ...res.issue, postedDate: res.issue.postedDate || savedDate, date: savedDate, assignedTech: techObj, assignedStaff: techStaffStr } : i)));
        } else {
          setIssuesList(
            issuesList.map((i) =>
              i.id === targetId || i._id === targetId
                ? { ...i, equipmentName: finalEquipName, deviceId: deviceId || finalEquipName, serialNo, quantity: qtyDeduct, title, category: issueCategory, subCategory, severity, status: issueStatus, labLocation: targetLab, postedDate: savedDate, date: savedDate, assignedTech: techObj, assignedStaff: techStaffStr }
                : i
            )
          );
        }
      } else {
        // Create new issue entry
        const savedDate = postedDate || new Date().toISOString().split('T')[0];

        const payload = {
          equipmentName: finalEquipName,
          deviceId: deviceId || finalEquipName,
          serialNo: serialNo || '',
          quantity: qtyDeduct,
          title,
          category: issueCategory,
          subCategory,
          severity,
          labLocation: targetLab,
          postedDate: savedDate,
          date: savedDate,
          reportedBy: user?.name || 'Lab Staff',
          userRole: user?.role,
          userDepartment: user?.department,
          assignedTech: techObj,
          assignedStaff: techStaffStr
        };

        const newLocally = {
          id: 'ISS-' + Math.floor(Math.random() * 800 + 100),
          equipmentName: finalEquipName,
          deviceId: deviceId || finalEquipName,
          serialNo: serialNo || '',
          quantity: qtyDeduct,
          title,
          category: issueCategory,
          subCategory,
          severity,
          status: 'Pending Repair',
          labLocation: targetLab,
          postedDate: savedDate,
          date: savedDate,
          reportedBy: user?.name || 'Lab Staff',
          assignedTech: techObj,
          assignedStaff: techStaffStr
        };

        const res = await fetchAPI('/issues', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res && res.issue) {
          setIssuesList([{ ...res.issue, postedDate: res.issue.postedDate || savedDate, date: savedDate, assignedTech: techObj, assignedStaff: techStaffStr }, ...issuesList]);
        } else {
          setIssuesList([newLocally, ...issuesList]);
        }
      }

      setShowModal(false);
      if (onReload) onReload();
    } catch (err) {
      alert(err.message || 'Error saving issue entry');
    }
  };

  const handleDeleteIssue = async (id) => {
    if (!isAdmin) {
      alert('Access Denied: Only Administrators are authorized to delete issue tickets.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete issue ticket ${id}?`)) {
      try {
        await fetchAPI(`/issues/${id}?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {}
      const updated = issuesList.filter((i) => (i.id || i._id) !== id);
      setIssuesList(updated);
      localStorage.setItem('vlms_issues', JSON.stringify(updated));
      if (onReload) onReload();
    }
  };

  const handleClearAllIssues = async () => {
    if (!isAdmin) {
      alert('Access Denied: Only Administrators can clear all issue tickets.');
      return;
    }
    if (window.confirm('⚠️ ARE YOU SURE? This will DELETE ALL issue tickets across all labs!')) {
      try {
        await fetchAPI(`/issues/clear/all?userRole=${user?.role}`, { method: 'DELETE' });
      } catch (err) {}
      setIssuesList([]);
      localStorage.setItem('vlms_issues', JSON.stringify([]));
      if (onReload) onReload();
    }
  };

  const getIssuePostedDate = (iss) => {
    if (!iss) return new Date().toISOString().split('T')[0];
    if (iss.postedDate) return iss.postedDate;
    if (iss.date) return iss.date;
    if (iss.createdAt) {
      try {
        return new Date(iss.createdAt).toISOString().split('T')[0];
      } catch (e) {}
    }
    return new Date().toISOString().split('T')[0];
  };

  const calculateDaysDiff = (startStr, endStr) => {
    if (!startStr || !endStr) return '1 Day';
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMs = Math.abs(end - start);
      const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return `${days} ${days === 1 ? 'Day' : 'Days'}`;
    } catch (e) {
      return '1 Day';
    }
  };

  const handleOpenResolveModal = (issue) => {
    setResolvingIssue(issue);
    const pDate = getIssuePostedDate(issue);
    const todayStr = new Date().toISOString().split('T')[0];
    setResPostedDate(pDate);
    setResResolvedDate(todayStr);
    setShowResolveModal(true);
  };

  const handleConfirmResolve = async (e) => {
    e.preventDefault();
    if (!resolvingIssue) return;

    const targetId = resolvingIssue.id || resolvingIssue._id;
    const daysText = calculateDaysDiff(resPostedDate, resResolvedDate);

    try {
      await fetchAPI(`/issues/${targetId}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({
          postedDate: resPostedDate,
          resolvedDate: resResolvedDate,
          daysTaken: daysText
        })
      });
    } catch (err) {}

    const updated = issuesList.map((iss) => {
      if (iss.id === targetId || iss._id === targetId) {
        return {
          ...iss,
          status: 'Completed',
          postedDate: resPostedDate,
          resolvedDate: resResolvedDate,
          daysTaken: daysText
        };
      }
      return iss;
    });

    setIssuesList(updated);
    localStorage.setItem('vlms_issues', JSON.stringify(updated));
    setShowResolveModal(false);
    if (onReload) onReload();
  };

  const [staffOptions, setStaffOptions] = useState([]);

  useEffect(() => {
    loadIssues();
    loadStockOptions();
    loadStaffOptions();
  }, [user, isAdmin, userLab]);

  const loadStaffOptions = async () => {
    try {
      const users = await fetchAPI('/auth/users');
      if (Array.isArray(users) && users.length > 0) {
        setStaffOptions(users);
        return;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('vlms_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setStaffOptions(parsed);
      }
    } catch (e) {}
  };

  const handleOpenTechModal = (issue) => {
    loadStaffOptions();
    setSelectedTechIssue(issue);
    setTechName(issue.assignedTech?.name || '');
    setTechPhone(issue.assignedTech?.phone || '');
    setShowTechModal(true);
  };

  const handleSaveTech = async (e) => {
    e.preventDefault();
    if (!selectedTechIssue || !techName) return;

    const targetId = selectedTechIssue.id || selectedTechIssue._id;
    const assignedTechObj = { name: techName, phone: techPhone };

    try {
      await fetchAPI(`/issues/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedTech: assignedTechObj,
          assignedStaff: techName
        })
      });
    } catch (err) {
      console.log('Update assigned tech API error:', err.message);
    }

    const updated = issuesList.map((iss) => {
      if (iss.id === targetId || iss._id === targetId) {
        return {
          ...iss,
          assignedTech: assignedTechObj,
          assignedStaff: techName
        };
      }
      return iss;
    });

    setIssuesList(updated);
    localStorage.setItem('vlms_issues', JSON.stringify(updated));
    setShowTechModal(false);
    if (onReload) onReload();
  };

  const handleOpenMessageModal = (issue, techDisplay) => {
    setMessageIssue(issue);
    setSelectedMessageTech(techDisplay);
    const phoneVal = techDisplay?.phone || '';
    setMessagePhone(phoneVal);

    const techName = techDisplay?.name || 'Technician';
    const lab = issue?.labLocation || 'Lab 1';
    const desc = issue?.title || 'Maintenance required';
    const equip = issue?.equipmentName || issue?.deviceId || 'Equipment';
    const ticketId = issue?.id || issue?._id || 'ISSUE';

    const defaultMsg = `Hello ${techName}, you have been assigned to repair ticket ${ticketId} (${equip}).
📍 Lab Location: ${lab}
⚠️ Issue Description: ${desc}
Please inspect and resolve at the earliest. Thank you!`;

    setMessageText(defaultMsg);
    setCopiedMessage(false);
    setShowMessageModal(true);
  };

  const handleCopyMessage = () => {
    if (!messageText) return;
    navigator.clipboard.writeText(messageText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const matchesLabScope = (labStr) => {
    if (!labStr || isInactiveLab(labStr)) return false;

    const targetLab = globalSelectedLab || (isAdmin ? 'All' : userLab);
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

  const activeIssuesList = issuesList.filter((iss) => matchesLabScope(iss.labLocation));

  const filteredIssues = activeIssuesList.filter((iss) => {
    const matchesSearch =
      (iss.id || iss._id || '').toLowerCase().includes(search.toLowerCase()) ||
      (iss.equipmentName || iss.deviceId || '').toLowerCase().includes(search.toLowerCase()) ||
      (iss.title || '').toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === 'All' || iss.severity === severityFilter;
    const matchesDate = matchesDateFilter(iss.postedDate || iss.date || iss.createdAt, dateFilter, customStart, customEnd);

    return matchesSearch && matchesSeverity && matchesDate;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Hardware Issue Entry & Ticket Tracking {!isAdmin && `(${userLab})`}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            {!isAdmin 
              ? `Report technical faults and manage repair tickets exclusively for ${userLab}`
              : 'Report technical faults, manage repair tickets, and track resolution progress across all 33+ labs'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--orange-accent)', background: 'rgba(255,159,67,0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,159,67,0.3)' }}>
              <Lock size={14} /> Restricted to {userLab}
            </div>
          )}

          {isAdmin && (
            <button 
              onClick={handleClearAllIssues} 
              className="pill-filter" 
              style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              <Trash2 size={15} /> Delete All Issues
            </button>
          )}

          <button 
            onClick={() => printPendingIssues(filteredIssues, globalSelectedLab || (isAdmin ? 'All' : userLab))} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', background: 'rgba(255,159,67,0.15)', borderColor: 'var(--orange-accent)', color: 'var(--orange-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Pending Repairs PDF Report"
          >
            <Printer size={16} /> Print Pending (PDF)
          </button>

          <button 
            onClick={() => printCompletedIssues(filteredIssues, globalSelectedLab || (isAdmin ? 'All' : userLab))} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', background: 'rgba(16,185,129,0.15)', borderColor: 'var(--green-online)', color: 'var(--green-online)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Maintenance Done PDF Report"
          >
            <Printer size={16} /> Print Complete (PDF)
          </button>

          <button 
            onClick={() => printAllIssues(filteredIssues, globalSelectedLab || (isAdmin ? 'All' : userLab))} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', background: 'rgba(0,242,254,0.15)', borderColor: 'var(--cyan-bright)', color: 'var(--cyan-bright)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print All Issue Tickets / Export PDF"
          >
            <Printer size={16} /> Print All Issues (PDF)
          </button>

          <button onClick={openAddModal} className="btn-cyan" style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Log New Issue Entry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reported Tickets {!isAdmin && `(${userLab})`}</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{activeIssuesList.length}</div>
        </div>
        <div className="lab-card" style={{ padding: '18px', border: '1px solid var(--orange-glow)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--orange-accent)' }}>Critical / High Priority</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--orange-accent)', marginTop: '4px' }}>
            {activeIssuesList.filter((i) => i.severity === 'Critical' || i.severity === 'High').length}
          </div>
        </div>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Maintenance</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ff9f43', marginTop: '4px' }}>
            {activeIssuesList.filter((i) => i.status === 'Pending Repair' || i.status === 'Offline').length}
          </div>
        </div>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--green-online)' }}>Resolved Tickets</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--green-online)', marginTop: '4px' }}>
            {activeIssuesList.filter((i) => i.status === 'Completed').length}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="lab-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="lab-input"
              placeholder="Search Issue ID or Equipment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="lab-input"
              style={{ height: '36px', minWidth: '130px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer', fontWeight: 600, borderColor: severityFilter !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)' }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Date Filter:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="lab-input"
              style={{ height: '36px', minWidth: '175px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer', fontWeight: 600, borderColor: dateFilter !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)' }}
            >
              {DATE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {dateFilter === 'Custom' && (
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

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Ticket ID</th>
                <th style={{ padding: '12px' }}>Equipment Name</th>
                <th style={{ padding: '12px' }}>Systems Affected (Qty)</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Subcategory</th>
                <th style={{ padding: '12px' }}>Issue Description</th>
                <th style={{ padding: '12px' }}>Severity</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Lab Location</th>
                <th style={{ padding: '12px' }}>Reported By</th>
                <th style={{ padding: '12px' }}>Posted Date</th>
                <th style={{ padding: '12px' }}>Assigned Technician</th>
                <th style={{ padding: '12px' }}>Days to Resolve</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((iss, idx) => {
                const issueIdKey = iss.id || iss._id || `ISS-${idx + 1}`;

                return (
                  <tr key={issueIdKey} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{issueIdKey}</td>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#fff' }}>
                      <div>{iss.equipmentName || iss.deviceId}</div>
                      {(iss.serialNo || iss.serialNumber) && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--cyan-bright)', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                          🏷️ S/N: {iss.serialNo || iss.serialNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--orange-accent)' }}>{iss.quantity || 1} Systems</td>
                    <td style={{ padding: '14px' }}>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          color: iss.category === 'Electrical' ? '#ff9f43' : iss.category?.includes('Workshop') ? '#10b981' : 'var(--cyan-bright)',
                          background: iss.category === 'Electrical' ? 'rgba(255,159,67,0.15)' : iss.category?.includes('Workshop') ? 'rgba(16,185,129,0.15)' : 'rgba(0,242,254,0.15)'
                        }}
                      >
                        {iss.category || 'Hardware'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {iss.subCategory || 'cpu'}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-primary)' }}>{iss.title}</td>
                    <td style={{ padding: '14px' }}>
                      <span 
                        style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: iss.severity === 'Critical' ? 'rgba(239, 68, 68, 0.2)' : iss.severity === 'High' ? 'rgba(255, 159, 67, 0.2)' : 'rgba(0, 242, 254, 0.1)',
                          color: iss.severity === 'Critical' ? '#ef4444' : iss.severity === 'High' ? '#ff9f43' : 'var(--cyan-bright)',
                          border: `1px solid ${iss.severity === 'Critical' ? '#ef4444' : iss.severity === 'High' ? '#ff9f43' : 'var(--cyan-bright)'}40`
                        }}
                      >
                        {iss.severity}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span className={`status-pill ${iss.status === 'Completed' ? 'status-completed' : 'status-pending'}`}>
                        {iss.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: '#fff', fontWeight: 600 }}>{iss.labLocation}</td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{iss.reportedBy}</td>
                    <td style={{ padding: '14px', color: 'var(--cyan-bright)', fontWeight: 600 }}>
                      {getIssuePostedDate(iss)}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {(() => {
                        const techDisplay = getTechnicianDisplay(iss);
                        return techDisplay ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--orange-accent)', fontWeight: 700 }}>
                              👤 {techDisplay.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {techDisplay.phone ? (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {techDisplay.phone}</span>
                              ) : null}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenMessageModal(iss, techDisplay)}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '0.72rem',
                                    height: '22px',
                                    borderRadius: '4px',
                                    background: 'rgba(0, 242, 254, 0.12)',
                                    border: '1px solid rgba(0, 242, 254, 0.3)',
                                    color: 'var(--cyan-bright)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title="Send SMS / WhatsApp message with Lab Location & Issue Description"
                                >
                                  <MessageSquare size={11} /> Send Msg
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Unassigned</span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {iss.status === 'Completed' ? (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green-online)', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)' }}>
                          ⚡ {getDaysToResolveDisplay(iss)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--orange-accent)', fontWeight: 600 }}>
                          ⏱️ In Progress
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenTechModal(iss)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px', background: 'rgba(255, 159, 67, 0.15)', border: '1px solid rgba(255, 159, 67, 0.4)', color: 'var(--orange-accent)', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Assign or Edit Technician"
                          >
                            <Wrench size={13} /> {getTechnicianDisplay(iss) ? 'Edit Tech' : 'Assign Tech'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(iss)}
                          style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer' }}
                          title="Edit Issue Ticket"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => printIndividualIssue(iss)}
                          style={{ background: 'none', border: 'none', color: 'var(--orange-accent)', cursor: 'pointer' }}
                          title="Print Individual Ticket Slip / PDF"
                        >
                          <Printer size={16} />
                        </button>

                        {iss.status !== 'Completed' && (
                          <button
                            type="button"
                            onClick={() => handleOpenResolveModal(iss)}
                            className="btn-cyan"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Resolve Ticket & Generate Dates"
                          >
                            <CheckCircle size={14} /> Resolve
                          </button>
                        )}

                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteIssue(issueIdKey)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            title="Delete Issue Ticket"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => alert('Forbidden: Only Administrators are authorized to delete issue tickets.')}
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
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log / Edit Issue Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              {editingIssue ? 'Edit Issue Ticket' : 'Log New Issue Entry'}
            </h3>

            <form onSubmit={handleSaveIssue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Equipment Name (Retrieved from Stock Entry)</label>
                <select
                  required
                  className="lab-input"
                  value={equipmentName}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                >
                  <option value="">-- Select Equipment from Stock --</option>
                  {stockItems.map((stk, i) => (
                    <option key={stk.id || stk._id || i} value={stk.name || stk.deviceName}>
                      {stk.name || stk.deviceName} (Stock: {stk.quantity ?? 0} | {stk.labLocation || 'Lab 1'})
                    </option>
                  ))}
                  {stockItems.length === 0 && (
                    <>
                      <option value="Workstation CPU Tower i7">Workstation CPU Tower i7 (Stock: 24)</option>
                      <option value="UltraSharp 27&quot; Monitor">UltraSharp 27" Monitor (Stock: 18)</option>
                      <option value="Dell OptiPlex 7090 Tower">Dell OptiPlex 7090 Tower (Stock: 15)</option>
                      <option value="High Efficiency Ceiling Fan">High Efficiency Ceiling Fan (Stock: 12)</option>
                      <option value="Ergonomic Lab Chair">Ergonomic Lab Chair (Stock: 30)</option>
                      <option value="Logitech MX Master Wireless Mouse">Logitech MX Master Wireless Mouse (Stock: 20)</option>
                      <option value="Smart Interactive Board 75&quot;">Smart Interactive Board 75" (Stock: 8)</option>
                      <option value="APC Smart-UPS 1500VA">APC Smart-UPS 1500VA (Stock: 10)</option>
                      <option value="Modular Electronics Workbench">Modular Electronics Workbench (Stock: 14)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Item Serial No (S/N)</label>
                <input
                  type="text"
                  className="lab-input"
                  placeholder="e.g. SN-9842104"
                  value={serialNo}
                  onChange={(e) => setSerialNo(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Systems Affected (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="lab-input"
                    placeholder="e.g. 72"
                    value={issueQuantity}
                    onChange={(e) => setIssueQuantity(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select className="lab-input" value={issueCategory} onChange={(e) => handleCategoryChange(e.target.value)}>
                    <option value="Hardware">Hardware</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Workshop / Furniture">Workshop / Furniture</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Subcategory</label>
                  <select className="lab-input" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                    {issueCategory === 'Electrical' && (
                      <>
                        <option value="fans">fans</option>
                        <option value="lights">lights</option>
                        <option value="Acs">Acs</option>
                      </>
                    )}
                    {issueCategory === 'Workshop / Furniture' && (
                      <>
                        <option value="chairs">chairs</option>
                        <option value="tables">tables</option>
                        <option value="curtons">curtons</option>
                      </>
                    )}
                    {(issueCategory === 'Hardware' || (!['Electrical', 'Workshop / Furniture'].includes(issueCategory))) && (
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

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Issue Description / Fault Summary</label>
                <input type="text" required className="lab-input" placeholder="Describe issue (e.g. Boot failure)" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editingIssue ? '1fr 1fr 1fr' : '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Severity Level</label>
                  <select className="lab-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                {editingIssue && (
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                    <select className="lab-input" value={issueStatus} onChange={(e) => setIssueStatus(e.target.value)}>
                      <option value="Pending Repair">Pending Repair</option>
                      <option value="Completed">Completed</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Posted Date (Reported On)
                  </label>
                  <input
                    type="date"
                    required
                    className="lab-input"
                    value={postedDate}
                    onChange={(e) => setPostedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Lab Room {!isAdmin && '(Assigned)'}
                  </label>
                  {!isAdmin ? (
                    <select
                      disabled
                      className="lab-input"
                      value={userLab}
                      style={{ opacity: 0.85, cursor: 'not-allowed', borderColor: 'var(--orange-accent)', color: '#fff', fontWeight: 700 }}
                    >
                      <option value={userLab}>{userLab} (Assigned Staff Room)</option>
                    </select>
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
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan">{editingIssue ? 'Update Issue Ticket' : 'Submit Issue Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician Modal */}
      {showTechModal && selectedTechIssue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 220, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid var(--orange-accent)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              🔧 Assign Technician to Ticket
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Assign a dedicated repair technician to ticket <strong style={{ color: 'var(--cyan-bright)' }}>{selectedTechIssue.id || selectedTechIssue._id}</strong> ({selectedTechIssue.equipmentName})
            </p>

            <form onSubmit={handleSaveTech} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Technician Full Name
                </label>
                <input
                  type="text"
                  required
                  className="lab-input"
                  placeholder="e.g. M. Suresh (Senior Engineer)"
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Mobile / Phone Number
                </label>
                <input
                  type="text"
                  required
                  className="lab-input"
                  placeholder="e.g. +91 9876543210"
                  value={techPhone}
                  onChange={(e) => setTechPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowTechModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan" style={{ background: 'var(--orange-accent)', borderColor: 'var(--orange-accent)', color: '#000' }}>
                  Save Technician Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Issue Ticket Modal */}
      {showResolveModal && resolvingIssue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 230, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '460px', padding: '28px', border: '1px solid var(--green-online)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={22} color="var(--green-online)" /> Resolve Issue Ticket & Calculate Days
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Mark ticket <strong style={{ color: 'var(--cyan-bright)' }}>{resolvingIssue.id || resolvingIssue._id}</strong> ({resolvingIssue.equipmentName}) as Completed/Resolved.
            </p>

            <form onSubmit={handleConfirmResolve} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    1. Posted Date
                  </label>
                  <input
                    type="date"
                    required
                    className="lab-input"
                    value={resPostedDate}
                    onChange={(e) => setResPostedDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                    2. Resolved Date
                  </label>
                  <input
                    type="date"
                    required
                    className="lab-input"
                    value={resResolvedDate}
                    onChange={(e) => setResResolvedDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated Days to Resolve Preview */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Days Taken to Solve:</span>
                  <strong style={{ fontSize: '1.2rem', color: 'var(--green-online)' }}>
                    ⚡ {calculateDaysDiff(resPostedDate, resResolvedDate)}
                  </strong>
                </div>
                <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--green-online)', fontWeight: 700 }}>
                  Status: Resolved
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowResolveModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan" style={{ background: 'var(--green-online)', borderColor: 'var(--green-online)', color: '#000' }}>
                  ✓ Confirm & Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message to Assigned Technician Modal */}
      {showMessageModal && messageIssue && selectedMessageTech && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 240, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="var(--cyan-bright)" /> Dispatch Message to Technician
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Send Lab Location & Issue details to <strong style={{ color: 'var(--orange-accent)' }}>{selectedMessageTech.name}</strong> ({selectedMessageTech.phone || 'No phone number set'})
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Technician Mobile / Phone No.
                </label>
                <input
                  type="text"
                  className="lab-input"
                  value={messagePhone}
                  onChange={(e) => setMessagePhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Message Content (Includes Lab Location & Issue Description)
                </label>
                <textarea
                  rows={5}
                  className="lab-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.83rem', lineHeight: '1.4', padding: '10px' }}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
              </div>

              {/* Quick Info Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.76rem' }}>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,242,254,0.1)', color: 'var(--cyan-bright)', border: '1px solid rgba(0,242,254,0.2)' }}>
                  📍 Lab Location: {messageIssue.labLocation}
                </span>
                <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,159,67,0.1)', color: 'var(--orange-accent)', border: '1px solid rgba(255,159,67,0.2)' }}>
                  ⚠️ Issue: {messageIssue.title}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '14px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setShowMessageModal(false)} className="pill-filter">
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="pill-filter"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedMessage ? <Check size={14} color="var(--green-online)" /> : <Copy size={14} />}
                  {copiedMessage ? 'Copied!' : 'Copy Text'}
                </button>

                {messagePhone && (
                  <>
                    <a
                      href={`sms:${messagePhone.replace(/[^0-9+]/g, '')}?body=${encodeURIComponent(messageText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cyan"
                      style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      📱 Send SMS
                    </a>

                    <a
                      href={`https://wa.me/${messagePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(messageText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cyan"
                      style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', background: '#25D366', borderColor: '#25D366', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      💬 WhatsApp
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
