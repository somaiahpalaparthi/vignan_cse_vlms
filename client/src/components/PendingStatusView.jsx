import React, { useState } from 'react';
import { Clock, CheckCircle, Search, RefreshCw, AlertTriangle, Lock, Printer, Trash2 } from 'lucide-react';
import { fetchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getTechnicianDisplay, getDaysToResolveDisplay } from './IssuesView';
import { isInactiveLab } from '../utils/staffLabs';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';
import { printPendingIssues } from '../utils/printHelper';

export const PendingStatusView = ({ selectedLab: globalSelectedLab, items = [], issuesList = [], onReload }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [selectedTech, setSelectedTech] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [serialSearch, setSerialSearch] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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

  const getEffectiveIssuesList = () => {
    if (Array.isArray(issuesList) && issuesList.length > 0) {
      return issuesList;
    }
    try {
      const saved = localStorage.getItem('vlms_issues');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [];
  };

  const effectiveIssues = getEffectiveIssuesList();

  const getSerialForIssue = (iss) => {
    if (iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo) {
      return iss.serialNo || iss.serialNumber || iss.deviceSerialNo || iss.itemSerialNo;
    }
    const match = (items || []).find((stk) =>
      (stk.id && stk.id === iss.deviceId) ||
      (stk.name && stk.name === iss.equipmentName) ||
      (stk.deviceName && stk.deviceName === iss.equipmentName)
    );
    return match?.serialNo || match?.serialNumber || match?.deviceSerialNo || match?.itemSerialNo || '';
  };

  // Combine pending issue tickets from issuesList and pending inventory items
  const pendingIssues = effectiveIssues.filter((i) => {
    const isPending = i.status !== 'Completed' && i.status !== 'Resolved';
    return isPending && matchesLabScope(i.labLocation);
  }).map((i) => ({
    ...i,
    serialNo: getSerialForIssue(i),
    itemId: i.id || i._id || i.deviceId,
    deviceName: i.equipmentName || i.deviceId || i.title || 'Hardware Equipment',
    isIssueTicket: true
  }));

  const pendingInventory = (items || []).filter((i) => {
    const isPending = i.status === 'Pending Repair' || i.status === 'Offline' || i.status === 'Pending';
    return isPending && matchesLabScope(i.labLocation || i.department);
  });

  const pendingMap = new Map();
  pendingIssues.forEach((item) => {
    const key = item.id || item._id || item.itemId;
    pendingMap.set(key, item);
  });

  pendingInventory.forEach((item) => {
    const key = item.itemId || item._id;
    if (!pendingMap.has(key)) {
      pendingMap.set(key, item);
    } else {
      const existing = pendingMap.get(key);
      pendingMap.set(key, {
        ...item,
        ...existing,
        serialNo: existing.serialNo || existing.serialNumber || item.serialNo || item.serialNumber || item.deviceSerialNo || ''
      });
    }
  });

  const pendingItems = Array.from(pendingMap.values());

  const handleResolve = async (item) => {
    const issueId = item.id || item._id || item.itemId;
    const invId = item.itemId || item.deviceId || item._id;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      if (issueId) {
        await fetchAPI(`/issues/${issueId}/resolve`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'Completed',
            resolvedDate: todayStr
          })
        }).catch(() => {});

        await fetchAPI(`/issues/${issueId}`, {
          method: 'PUT',
          body: JSON.stringify({
            status: 'Completed',
            resolvedDate: todayStr
          })
        }).catch(() => {});
      }

      if (invId) {
        await fetchAPI(`/inventory/${invId}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'Online' })
        }).catch(() => {});
      }

      // Synchronize localStorage vlms_issues
      let currentIssues = [];
      try {
        const saved = localStorage.getItem('vlms_issues');
        if (saved) currentIssues = JSON.parse(saved);
      } catch (e) {}

      if (currentIssues.length > 0) {
        const updatedIssues = currentIssues.map((i) => {
          if (i.id === issueId || i._id === issueId || i.deviceId === invId || i.id === invId) {
            return {
              ...i,
              status: 'Completed',
              resolvedDate: todayStr,
              daysTaken: getDaysToResolveDisplay({ ...i, resolvedDate: todayStr })
            };
          }
          return i;
        });

        localStorage.setItem('vlms_issues', JSON.stringify(updatedIssues));
      } else {
        localStorage.setItem('vlms_issues', JSON.stringify([{
          id: issueId,
          status: 'Completed',
          resolvedDate: todayStr,
          daysTaken: '1 Day'
        }]));
      }
    } catch (e) {}

    // Also update state dynamically
    try {
      const savedIssues = localStorage.getItem('vlms_issues');
      const issueArray = savedIssues ? JSON.parse(savedIssues) : [];
      let updatedIssues = [];

      if (issueArray.some((i) => i.id === issueId || i._id === issueId)) {
        updatedIssues = issueArray.map((i) => {
          if (i.id === issueId || i._id === issueId) {
            return {
              ...i,
              status: 'Completed',
              resolvedDate: todayStr,
              daysTaken: getDaysToResolveDisplay({ ...i, resolvedDate: todayStr })
            };
          }
          return i;
        });
      } else {
        updatedIssues = issueArray.concat({
          ...item,
          status: 'Completed',
          resolvedDate: todayStr,
          daysTaken: getDaysToResolveDisplay({ ...item, resolvedDate: todayStr })
        });
      }
      localStorage.setItem('vlms_issues', JSON.stringify(updatedIssues));
    } catch (e) {
      console.error('Error updating local storage issues:', e);
    }

    // Synchronize localStorage vlms_inventory
    try {
      const savedInv = localStorage.getItem('vlms_inventory');
      if (savedInv) {
        const invList = JSON.parse(savedInv);
        const updatedInv = invList.map((i) => {
          if (i.itemId === invId || i._id === invId || i.itemId === issueId) {
            return { ...i, status: 'Online' };
          }
          return i;
        });
        localStorage.setItem('vlms_inventory', JSON.stringify(updatedInv));
      }
    } catch (e) {}

    if (onReload) onReload();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete this pending issue?`)) return;
    const issueId = item.id || item._id || item.itemId;

    try {
      if (issueId) {
        await fetchAPI(`/issues/${issueId}`, { method: 'DELETE' }).catch(() => {});
        await fetchAPI(`/inventory/${issueId}`, { method: 'DELETE' }).catch(() => {});
      }

      let currentIssues = [];
      try {
        const saved = localStorage.getItem('vlms_issues');
        if (saved) currentIssues = JSON.parse(saved);
      } catch (e) {}

      const updatedIssues = currentIssues.filter((i) => (i.id || i._id || i.itemId) !== issueId);
      localStorage.setItem('vlms_issues', JSON.stringify(updatedIssues));

      if (onReload) onReload();
    } catch (err) {
      console.error('Error deleting pending issue:', err);
    }
  };

  const filtered = pendingItems.filter((i) => {
    const matchSearch =
      !search ||
      (i.itemId || i._id || i.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.deviceName || i.equipmentName || i.name || i.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.assignedStaff || (i.assignedTech?.name) || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.labLocation || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.serialNo || i.serialNumber || '').toLowerCase().includes(search.toLowerCase());

    const techInfo = getTechnicianDisplay(i);
    const techName = techInfo?.name || i.assignedStaff || '';
    const matchTech = selectedTech === 'All' || techName.toLowerCase() === selectedTech.toLowerCase();

    const itemSerial = String(i.serialNo || i.serialNumber || '').toLowerCase();
    const matchSerial = !serialSearch || itemSerial.includes(serialSearch.toLowerCase());

    const matchSev = severityFilter === 'All' || (i.severity || 'Medium').toLowerCase() === severityFilter.toLowerCase();

    const matchDate = matchesDateFilter(i.postedDate || i.date || i.invoiceDate || i.dateAdded || i.createdAt, dateFilter, customStart, customEnd);

    return matchSearch && matchTech && matchSerial && matchSev && matchDate;
  });

  // Dynamically extract unique technicians
  const availableTechs = Array.from(new Set(
    pendingItems.map((i) => {
      const tech = getTechnicianDisplay(i);
      return tech?.name || i.assignedStaff || null;
    }).filter(Boolean)
  ));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Pending Repairs & Maintenance Queue {!isAdmin && `(${userLab})`}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Monitor hardware items undergoing repairs or awaiting technical maintenance
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => printPendingIssues(filtered, globalSelectedLab || (isAdmin ? 'All' : userLab))} 
            className="btn-cyan" 
            style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem', background: 'rgba(255,159,67,0.15)', borderColor: 'var(--orange-accent)', color: 'var(--orange-accent)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Pending Repairs PDF Report"
          >
            <Printer size={15} /> Print Pending Status (PDF)
          </button>
          <button onClick={onReload} className="pill-filter" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={15} /> Refresh Status
          </button>
        </div>
      </div>

      {/* KPI Alert Banner */}
      <div 
        className="lab-card" 
        style={{ 
          padding: '20px', 
          border: '1px solid var(--orange-glow)', 
          background: 'rgba(255,159,67,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(255,159,67,0.15)', border: '1px solid rgba(255,159,67,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} color="var(--orange-accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {pendingItems.length} Items Awaiting Maintenance
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Hardware in this queue requires technical diagnosis or component replacement.
            </p>
          </div>
        </div>

        <span className="status-pill status-pending" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          Priority Attention Required
        </span>
      </div>

      {/* Pending Table */}
      <div className="lab-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="lab-input"
                placeholder="Search Pending Items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            {/* Filter by Severity */}
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

            {/* Filter by Assigned Technician */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>Technician:</span>
              <select
                value={selectedTech}
                onChange={(e) => setSelectedTech(e.target.value)}
                className="lab-input"
                style={{ height: '36px', minWidth: '165px', fontSize: '0.82rem', padding: '0 8px', cursor: 'pointer', fontWeight: 600, borderColor: selectedTech !== 'All' ? 'var(--cyan-bright)' : 'var(--glass-border)' }}
              >
                <option value="All">👤 All Technicians</option>
                {availableTechs.map((techName) => (
                  <option key={techName} value={techName}>👤 {techName}</option>
                ))}
              </select>
            </div>

            {/* Filter by Serial Number */}
            <div style={{ position: 'relative', width: '170px' }}>
              <input
                type="text"
                className="lab-input"
                placeholder="Filter Serial No (S/N)..."
                value={serialSearch}
                onChange={(e) => setSerialSearch(e.target.value)}
                style={{ height: '36px', fontSize: '0.82rem', padding: '0 10px' }}
              />
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

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {pendingItems.length} Pending Records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Ticket / Item ID</th>
                <th style={{ padding: '12px' }}>Device / Equipment Name</th>
                <th style={{ padding: '12px' }}>Category</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Lab Location</th>
                <th style={{ padding: '12px' }}>Assigned Tech / Issue Notes</th>
                <th style={{ padding: '12px' }}>Quick Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((item, idx) => (
                  <tr key={item.id || item.itemId || item._id || idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{item.id || item.itemId || item._id}</td>
                    <td style={{ padding: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      <div>{item.equipmentName || item.deviceName || item.title || item.name}</div>
                      {(item.serialNo || item.serialNumber) && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--cyan-bright)', fontWeight: 700, marginTop: '2px', fontFamily: 'monospace' }}>
                          🏷️ S/N: {item.serialNo || item.serialNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{item.category || 'Hardware'}</td>
                    <td style={{ padding: '14px' }}>
                      <span className="status-pill status-pending">{item.status || 'Pending Repair'}</span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.labLocation || 'Lab 12'}</td>
                    <td style={{ padding: '14px', color: 'var(--orange-accent)', fontWeight: 600 }}>
                      {(() => {
                        const tech = getTechnicianDisplay(item);
                        if (!tech) return <span style={{ color: 'var(--text-muted)' }}>{item.assignedStaff || item.title || 'Unassigned'}</span>;
                        return (
                          <span>
                            👤 {tech.name} {tech.phone ? `(📱 ${tech.phone})` : ''}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        onClick={() => handleResolve(item)}
                        className="btn-cyan"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', height: '30px', cursor: 'pointer' }}
                      >
                        <CheckCircle size={14} /> Mark Repaired
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        style={{ padding: '6px 10px', fontSize: '0.78rem', height: '30px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Delete Pending Issue"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={36} color="var(--green-online)" />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>No Pending Repairs Found</span>
                      <span style={{ fontSize: '0.85rem' }}>All hardware items matching your filter criteria are operational.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
