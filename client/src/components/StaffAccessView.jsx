import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Shield, UserCheck, CheckSquare, Edit2, Trash2, Key, Eye, EyeOff, Building, Check, Phone, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAPI } from '../services/api';

export const StaffAccessView = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [loading, setLoading] = useState(false);

  const defaultStaffList = [
    { id: 'usr-1', name: 'Mr.B.SeshuBabu', email: 'seshubabu@labflow.dev', userId: 'seshubabu@labflow.dev', mobileNumber: '9491186974', role: 'staff', department: 'NB-301', status: 'On Leave', password: 'staff123' },
    { id: 'usr-2', name: 'kattakalyani', email: 'kattakalyani@labflow.dev', userId: 'kattakalyani@labflow.dev', mobileNumber: '7981669620', role: 'staff', department: 'NB-511', status: 'Active', password: 'staff123' },
    { id: 'usr-3', name: 'ch sirisha', email: 'sirisha@labflow.dev', userId: 'sirisha@labflow.dev', mobileNumber: '837428829', role: 'staff', department: 'NB-304', status: 'Active', password: 'staff123' },
    { id: 'usr-4', name: 'Programmer Staff A', email: 'staff@labflow.dev', userId: 'staff@labflow.dev', mobileNumber: '+1 555-0184', role: 'staff', department: 'Lab 12', status: 'Active', password: 'staff123' },
    { id: 'usr-5', name: 'Jamer Smrey', email: 'jamer@labflow.dev', userId: 'jamer@labflow.dev', mobileNumber: '+1 555-0177', role: 'staff', department: 'Lab 25', status: 'Active', password: 'jamer123' }
  ];

  const [staffList, setStaffList] = useState(() => {
    let deleted = [];
    let initial = defaultStaffList;
    try {
      const delStr = localStorage.getItem('vlms_deleted_staff');
      if (delStr) {
        const parsedDel = JSON.parse(delStr);
        if (Array.isArray(parsedDel)) deleted = parsedDel;
      }
    } catch (e) {}
    try {
      const saved = localStorage.getItem('vlms_staff_list');
      if (saved) {
        const parsedSaved = JSON.parse(saved);
        if (Array.isArray(parsedSaved) && parsedSaved.length > 0) initial = parsedSaved;
      }
    } catch (e) {}
    return initial.filter((s) => s && !deleted.includes(s.id) && !deleted.includes(s.userId) && !deleted.includes(s.email) && !deleted.includes(s._id));
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('staff123');
  const [mobileNumber, setMobileNumber] = useState('');
  const [role, setRole] = useState('staff');
  const [department, setDepartment] = useState('Lab 12');
  const [status, setStatus] = useState('Active');
  const [permReports, setPermReports] = useState(true);
  const [permUsers, setPermUsers] = useState(false);
  const [permLabs, setPermLabs] = useState(true);
  const [permConfig, setPermConfig] = useState(false);

  useEffect(() => {
    loadStaffUsers();
  }, []);

  useEffect(() => {
    localStorage.setItem('vlms_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  const loadStaffUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI('/auth/users');
      const deleted = JSON.parse(localStorage.getItem('vlms_deleted_staff') || '[]');
      const savedLocal = JSON.parse(localStorage.getItem('vlms_staff_list') || '[]');
      
      let merged = Array.isArray(savedLocal) && savedLocal.length > 0 ? [...savedLocal] : [];

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((apiStaff) => {
          if (!apiStaff) return;
          const idx = merged.findIndex(
            (s) =>
              (s._id && apiStaff._id && s._id === apiStaff._id) ||
              (s.id && apiStaff.id && s.id === apiStaff.id) ||
              (s.email && apiStaff.email && s.email.toLowerCase() === apiStaff.email.toLowerCase()) ||
              (s.userId && apiStaff.userId && s.userId.toLowerCase() === apiStaff.userId.toLowerCase())
          );
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...apiStaff };
          } else {
            merged.push(apiStaff);
          }
        });
      }

      const filteredData = merged.filter(
        (s) =>
          s &&
          !deleted.includes(s.id) &&
          !deleted.includes(s.userId) &&
          !deleted.includes(s.email) &&
          !deleted.includes(s._id)
      );

      if (filteredData.length > 0) {
        setStaffList(filteredData);
        localStorage.setItem('vlms_staff_list', JSON.stringify(filteredData));
      }
    } catch (err) {
      console.error('Error loading staff users from MongoDB Atlas:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswordMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStaffStatus = async (staff) => {
    if (!staff) return;
    const newStatus = staff.status === 'On Leave' ? 'Active' : 'On Leave';
    const targetId = staff._id || staff.userId || staff.id || staff.email;

    try {
      await fetchAPI(`/auth/users/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.log('Status toggle API notice:', err.message);
    }

    const updatedList = staffList.map((s) =>
      (s._id && s._id === staff._id) ||
      (s.id && s.id === staff.id) ||
      (s.email && s.email === staff.email) ||
      (s.userId && s.userId === staff.userId)
        ? { ...s, status: newStatus }
        : s
    );
    setStaffList(updatedList);
    localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setEmail('');
    setPassword('staff123');
    setMobileNumber('');
    setRole('staff');
    setDepartment('Lab 12');
    setStatus('Active');
    setPermReports(true);
    setPermUsers(false);
    setPermLabs(true);
    setPermConfig(false);
    setShowModal(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setName(staff.name || '');
    setEmail(staff.email || staff.userId || '');
    setPassword(staff.password || 'staff123');
    setMobileNumber(staff.mobileNumber || '');
    setRole(staff.role || 'staff');
    setDepartment(staff.department || 'Lab 12');
    setStatus(staff.status || 'Active');
    const perms = staff.permissions || [];
    setPermReports(perms.includes('View Reports'));
    setPermUsers(perms.includes('Manage Users'));
    setPermLabs(perms.includes('Schedule Labs'));
    setPermConfig(perms.includes('System Config'));
    setShowModal(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;

    const perms = [];
    if (permReports) perms.push('View Reports');
    if (permUsers) perms.push('Manage Users');
    if (permLabs) perms.push('Schedule Labs');
    if (permConfig) perms.push('System Config');

    if (editingStaff) {
      // Edit existing staff account
      const updatedStaff = {
        ...editingStaff,
        name,
        email,
        userId: email,
        password,
        mobileNumber,
        role,
        department,
        status: status || 'Active',
        permissions: perms
      };

      const targetId = editingStaff._id || editingStaff.userId || editingStaff.id || editingStaff.email;

      try {
        const res = await fetchAPI(`/auth/users/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify(updatedStaff)
        });
        if (res && res._id) {
          updatedStaff._id = res._id;
        }
      } catch (err) {
        console.log('Update staff API error:', err.message);
      }

      const updatedList = staffList.map((s) =>
        (s._id && s._id === editingStaff._id) ||
        (s.id && s.id === editingStaff.id) ||
        (s.email && s.email === editingStaff.email) ||
        (s.userId && s.userId === editingStaff.userId)
          ? { ...s, ...updatedStaff }
          : s
      );
      setStaffList(updatedList);
      localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
    } else {
      // Create new staff account
      const newStaff = {
        id: 'usr-' + Date.now(),
        name,
        userId: email,
        email,
        password,
        mobileNumber,
        role,
        department,
        status: status || 'Active',
        permissions: perms
      };

      try {
        const res = await fetchAPI('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            userId: email,
            email,
            password,
            mobileNumber,
            name,
            role,
            department,
            status: status || 'Active',
            permissions: perms
          })
        });
        if (res && (res._id || res.id)) {
          const finalStaff = { ...res, password: password };
          const updatedList = [finalStaff, ...staffList];
          setStaffList(updatedList);
          localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
        } else {
          const updatedList = [newStaff, ...staffList];
          setStaffList(updatedList);
          localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
        }
      } catch (err) {
        const updatedList = [newStaff, ...staffList];
        setStaffList(updatedList);
        localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
      }
    }

    setShowModal(false);
  };

  const handleDeleteStaff = async (staff) => {
    if (!isAdmin || !staff) return;
    const targetId = staff._id || staff.userId || staff.email || staff.id;
    const displayName = staff.name || staff.email || staff.userId || 'staff member';

    if (window.confirm(`Are you sure you want to delete staff account for ${displayName}?`)) {
      try {
        await fetchAPI(`/auth/users/${targetId}`, { method: 'DELETE' });
      } catch (err) {
        console.log('API delete fallback error:', err.message);
      }

      const deleted = JSON.parse(localStorage.getItem('vlms_deleted_staff') || '[]');
      const identifiersToAdd = [];
      if (staff._id) identifiersToAdd.push(staff._id);
      if (staff.userId) identifiersToAdd.push(staff.userId);
      if (staff.email) identifiersToAdd.push(staff.email);
      if (staff.id) identifiersToAdd.push(staff.id);
      if (targetId) identifiersToAdd.push(targetId);

      const updatedDeleted = Array.from(new Set([...deleted, ...identifiersToAdd]));
      localStorage.setItem('vlms_deleted_staff', JSON.stringify(updatedDeleted));

      const updatedList = staffList.filter(
        (s) =>
          s._id !== staff._id &&
          s.userId !== staff.userId &&
          s.email !== staff.email &&
          s.id !== staff.id &&
          s._id !== targetId &&
          s.userId !== targetId &&
          s.email !== targetId &&
          s.id !== targetId
      );
      setStaffList(updatedList);
      localStorage.setItem('vlms_staff_list', JSON.stringify(updatedList));
    }
  };

  const copyCredentials = (staff) => {
    const text = `User ID: ${staff.email || staff.userId}\nPassword: ${staff.password}\nMobile: ${staff.mobileNumber || 'N/A'}\nAssigned Lab: ${staff.department}`;
    navigator.clipboard.writeText(text);
    setCopiedId(staff.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase())) ||
      (s.userId && s.userId.toLowerCase().includes(search.toLowerCase())) ||
      (s.mobileNumber && s.mobileNumber.toLowerCase().includes(search.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Staff & Programmer Access Control
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Register staff accounts, enter mobile numbers, assign 33+ lab rooms, edit or delete staff credentials
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={loadStaffUsers} 
            className="pill-filter" 
            style={{ height: '40px', padding: '0 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} /> Sync Accounts
          </button>

          <button 
            onClick={openAddModal} 
            className="btn-cyan" 
            style={{ height: '40px', padding: '0 18px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <Plus size={16} /> Register Staff Account
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered Accounts</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>{staffList.length}</div>
        </div>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--cyan-bright)' }}>System Administrators</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--cyan-bright)', marginTop: '4px' }}>
            {staffList.filter((s) => s.role === 'admin').length}
          </div>
        </div>
        <div className="lab-card" style={{ padding: '18px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--orange-accent)' }}>Programmer Staff (33+ Labs)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--orange-accent)', marginTop: '4px' }}>
            {staffList.filter((s) => s.role === 'staff').length}
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="lab-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="lab-input"
              placeholder="Search Name / User ID / Lab / Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {filteredStaff.length} Staff Accounts
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Staff Name</th>
                <th style={{ padding: '12px' }}>Username / User ID</th>
                <th style={{ padding: '12px' }}>Mobile No.</th>
                <th style={{ padding: '12px' }}>Password</th>
                <th style={{ padding: '12px' }}>Role</th>
                <th style={{ padding: '12px' }}>Assigned Lab (1-33)</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s.id || s.email || s.userId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '14px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: s.role === 'admin' ? 'var(--cyan-glow)' : 'rgba(255,159,67,0.2)', color: s.role === 'admin' ? 'var(--cyan-bright)' : 'var(--orange-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {(s.name || 'SF').substring(0, 2).toUpperCase()}
                    </div>
                    {s.name}
                  </td>
                  <td style={{ padding: '14px', color: 'var(--cyan-bright)', fontWeight: 600 }}>{s.email || s.userId}</td>
                  <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>
                    {s.mobileNumber ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} color="var(--cyan-bright)" /> {s.mobileNumber}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff' }}>
                        {showPasswordMap[s.id || s.email] ? s.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(s.id || s.email)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                        title="Toggle Password"
                      >
                        {showPasswordMap[s.id || s.email] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span 
                      style={{ 
                        padding: '4px 10px', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        background: s.role === 'admin' ? 'rgba(0,242,254,0.15)' : 'rgba(255,159,67,0.15)',
                        color: s.role === 'admin' ? 'var(--cyan-bright)' : 'var(--orange-accent)',
                        border: `1px solid ${s.role === 'admin' ? 'var(--cyan-bright)' : 'var(--orange-accent)'}40`
                      }}
                    >
                      {s.role === 'admin' ? 'Administrator' : 'Programmer Staff'}
                    </span>
                  </td>
                  <td style={{ padding: '14px', color: '#fff', fontWeight: 700 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,242,254,0.08)', border: '1px solid rgba(0,242,254,0.2)', padding: '3px 10px', borderRadius: '6px' }}>
                      <Building size={14} color="var(--cyan-bright)" /> {s.department}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: s.status === 'On Leave' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: s.status === 'On Leave' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${s.status === 'On Leave' ? 'rgba(245,158,11,0.4)' : 'rgba(16,185,129,0.4)'}`
                      }}
                    >
                      {s.status === 'On Leave' ? '🟠 On Leave' : '🟢 Active'}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => toggleStaffStatus(s)}
                        className="pill-filter"
                        style={{
                          padding: '3px 10px',
                          fontSize: '0.78rem',
                          height: '28px',
                          fontWeight: 700,
                          color: s.status === 'On Leave' ? '#10b981' : '#f59e0b',
                          borderColor: s.status === 'On Leave' ? 'rgba(16,185,129,0.4)' : 'rgba(245,158,11,0.4)',
                          cursor: 'pointer'
                        }}
                        title="Toggle Staff Status (Active / Leave)"
                      >
                        {s.status === 'On Leave' ? 'Set Active' : 'Set Leave'}
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(s)}
                            style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit Staff Account"
                          >
                            <Edit2 size={14} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteStaff(s)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete Staff Account"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => copyCredentials(s)}
                        className="pill-filter"
                        style={{ padding: '3px 8px', fontSize: '0.75rem', height: '26px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {copiedId === s.id ? <Check size={13} color="var(--green-online)" /> : <Key size={13} />}
                        {copiedId === s.id ? 'Copied' : 'Copy Creds'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Registering / Editing Staff */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              {editingStaff ? `Edit Staff Account (${editingStaff.name})` : 'Register Staff Account & Assign Lab'}
            </h3>

            <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Staff Full Name</label>
                <input type="text" required className="lab-input" placeholder="e.g. Alex Tech" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Username / Email ID</label>
                  <input type="text" required className="lab-input" placeholder="e.g. alex@labflow.dev" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
                  <input type="text" className="lab-input" placeholder="e.g. +1 555-0192" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Set Staff Password</label>
                <input type="text" required className="lab-input" placeholder="e.g. staff123" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Account Role</label>
                  <select className="lab-input" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="staff">Programmer Staff</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Assigned Lab</label>
                  <input 
                    type="text" 
                    required 
                    className="lab-input" 
                    placeholder="e.g. NB-511, Lab 12" 
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)} 
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Status</label>
                  <select className="lab-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Active">🟢 Active</option>
                    <option value="On Leave">🟠 On Leave</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan">{editingStaff ? 'Update Staff Account' : 'Register Staff Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
