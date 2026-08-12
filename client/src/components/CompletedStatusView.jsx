import React, { useState } from 'react';
import { CheckCircle, Search, Download, ShieldCheck, RefreshCw, Lock, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getTechnicianDisplay, getDaysToResolveDisplay } from './IssuesView';
import { isInactiveLab } from '../utils/staffLabs';
import { DATE_FILTER_OPTIONS, matchesDateFilter } from '../utils/dateFilter';
import { printIndividualIssue, printCompletedIssues } from '../utils/printHelper';

export const CompletedStatusView = ({ selectedLab: globalSelectedLab, items = [], issuesList = [], onReload }) => {
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

  // Combine completed issue tickets from issuesList and completed inventory items
  const completedIssues = effectiveIssues.filter((i) => {
    const isCompleted = i.status === 'Completed' || i.status === 'Resolved';
    return isCompleted && matchesLabScope(i.labLocation);
  }).map((i) => ({
    ...i,
    serialNo: getSerialForIssue(i),
    itemId: i.id || i._id || i.deviceId,
    deviceName: i.equipmentName || i.deviceId || i.title || 'Hardware Equipment',
    isIssueTicket: true
  }));

  const completedInventory = (items || []).filter((i) => {
    const isCompleted = i.status === 'Online' || i.status === 'In Stock' || i.status === 'Completed' || i.status === 'Active';
    return isCompleted && matchesLabScope(i.labLocation || i.department);
  });

  const completedMap = new Map();
  completedIssues.forEach((item) => {
    const key = item.id || item._id || item.itemId;
    completedMap.set(key, item);
  });

  completedInventory.forEach((item) => {
    const key = item.itemId || item._id;
    if (!completedMap.has(key)) {
      completedMap.set(key, item);
    } else {
      const existing = completedMap.get(key);
      completedMap.set(key, {
        ...item,
        ...existing,
        serialNo: existing.serialNo || existing.serialNumber || item.serialNo || item.serialNumber || item.deviceSerialNo || ''
      });
    }
  });

  const completedItems = Array.from(completedMap.values());

  const filtered = completedItems.filter((i) => {
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

    const matchDate = matchesDateFilter(i.resolvedDate || i.postedDate || i.date || i.invoiceDate || i.dateAdded || i.createdAt, dateFilter, customStart, customEnd);

    return matchSearch && matchTech && matchSerial && matchSev && matchDate;
  });

  // Dynamically extract unique technicians
  const availableTechs = Array.from(new Set(
    completedItems.map((i) => {
      const tech = getTechnicianDisplay(i);
      return tech?.name || i.assignedStaff || null;
    }).filter(Boolean)
  ));

  const handleExportCSV = () => {
    const headers = "Ticket/Item ID,Device Name,Category,Status,Lab Location,Posted Date,Assigned Technician,Days Taken";
    const rows = filtered.map(i => {
      const tech = getTechnicianDisplay(i);
      const techStr = tech ? `${tech.name} ${tech.phone}` : (i.assignedStaff || 'Technician Verified');
      const daysStr = getDaysToResolveDisplay(i);
      return `"${i.id || i.itemId || i._id}","${i.equipmentName || i.deviceName || i.name}","${i.category || 'Hardware'}","${i.status || 'Completed'}","${i.labLocation || 'Lab 12'}","${i.postedDate || i.date || ''}","${techStr}","${daysStr}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Maintenance_Done_Audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic item-wise count of resolved items
  const itemWiseCounts = (() => {
    const map = {};
    filtered.forEach((i) => {
      const name = i.equipmentName || i.deviceName || i.title || i.name || 'Hardware Equipment';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  })();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Maintenance Done & Resolved Items {!isAdmin && `(${userLab})`}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Verified operational assets and successfully resolved repair tickets log
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => printCompletedIssues(filtered, globalSelectedLab || (isAdmin ? 'All' : userLab))} 
            className="btn-cyan" 
            style={{ height: '38px', padding: '0 14px', fontSize: '0.82rem', background: 'rgba(16,185,129,0.15)', borderColor: 'var(--green-online)', color: 'var(--green-online)', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Print Maintenance Done PDF Report"
          >
            <Printer size={15} /> Print Complete Status (PDF)
          </button>
          <button onClick={handleExportCSV} className="pill-filter" style={{ height: '38px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={15} /> Export Audit Log (.CSV)
          </button>
          <button onClick={onReload} className="btn-cyan" style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh Audit
          </button>
        </div>
      </div>

      {/* Audit Banner */}
      <div 
        className="lab-card" 
        style={{ 
          padding: '20px', 
          border: '1px solid var(--green-glow)', 
          background: 'rgba(16,185,129,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={22} color="var(--green-online)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {completedItems.length} Resolved Repair Records (Maintenance Done)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              All hardware items listed here have passed maintenance inspection and are operational in assigned labs.
            </p>
          </div>
        </div>

        <span className="status-pill status-online" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
          100% Maintenance Done
        </span>
      </div>

      {/* Completed Table */}
      <div className="lab-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: '220px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="lab-input"
                placeholder="Search Maintenance Done..."
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
            Showing {filtered.length} of {completedItems.length} Resolved Records
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
                <th style={{ padding: '12px' }}>Assigned Tech / Verification</th>
                <th style={{ padding: '12px' }}>Resolved Date</th>
                <th style={{ padding: '12px' }}>Time Taken</th>
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
                      <span className="status-pill status-completed">
                        <CheckCircle size={14} /> Maintenance Done
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.labLocation || 'Lab 12'}</td>
                    <td style={{ padding: '14px', color: 'var(--orange-accent)', fontWeight: 600 }}>
                      {(() => {
                        const tech = getTechnicianDisplay(item);
                        if (!tech) return <span style={{ color: 'var(--text-muted)' }}>{item.assignedStaff || 'Verified Repaired'}</span>;
                        return (
                          <span>
                            👤 {tech.name} {tech.phone ? `(📱 ${tech.phone})` : ''}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--cyan-bright)', fontWeight: 600 }}>{item.resolvedDate || item.postedDate || item.date || 'Resolved'}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green-online)', background: 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.3)' }}>
                        ⚡ {getDaysToResolveDisplay(item)}
                      </span>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <button
                        onClick={() => printIndividualIssue(item)}
                        className="btn-cyan"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', height: '30px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        title="Print Maintenance Certificate / PDF"
                      >
                        <Printer size={13} /> Print Ticket
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={36} color="var(--green-online)" />
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>No Maintenance Done Records Found</span>
                      <span style={{ fontSize: '0.85rem' }}>Resolved repair tickets will automatically appear here once marked as repaired.</span>
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
