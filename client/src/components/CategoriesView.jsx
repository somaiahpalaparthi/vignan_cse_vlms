import React, { useState } from 'react';
import { 
  Grid, 
  Cpu, 
  Monitor, 
  Keyboard, 
  Server, 
  HardDrive, 
  Zap, 
  Wrench, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ArrowRight,
  X,
  Building,
  CheckCircle,
  Clock,
  Laptop
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CategoriesView = ({ items = [], onSelectCategory }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userLab = user?.department || 'Lab 12';

  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategoryModal, setActiveCategoryModal] = useState(null);
  const [itemSearch, setItemSearch] = useState('');

  const [categoriesList, setCategoriesList] = useState([
    { id: 'cat-1', name: 'Hardware Assets', code: 'Hardware', icon: Cpu, desc: 'Desktop PCs, Monitors, Towers, CPU, Mouse, Keyboards & Smart Boards', color: '#00f2fe' },
    { id: 'cat-2', name: 'Electrical Equipment', code: 'Electrical', icon: Zap, desc: 'Fans, Lights, ACs, Power Regulators & Wiring', color: '#ff9f43' },
    { id: 'cat-3', name: 'Workshop / Furniture', code: 'Workshop / Furniture', icon: Wrench, desc: 'Chairs, Tables, Curtains & Lab Workbenches', color: '#10b981' }
  ]);

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const defaultItems = [];
  const rawSourceItems = items && items.length > 0 ? items : defaultItems;

  const sourceItems = rawSourceItems.filter((i) => {
    if (isAdmin) return true;
    const itemLab = i.labLocation || i.department || '';
    if (!itemLab) return false;
    return itemLab.toLowerCase().replace(/\s+/g, '') === userLab.toLowerCase().replace(/\s+/g, '');
  });

  const getCategoryStats = (code) => {
    const catItems = sourceItems.filter((i) => {
      if (code === 'Hardware') return i.category === 'Hardware' || i.category === 'PCs' || i.category === 'Monitors';
      return i.category === code || i.category?.toLowerCase().includes(code.toLowerCase());
    });
    const online = catItems.filter((i) => i.status === 'Online' || i.status === 'Active' || i.status === 'Completed').length;
    const total = catItems.length;
    return { count: total, online };
  };

  const handleOpenViewItems = (cat) => {
    setActiveCategoryModal(cat);
    setItemSearch('');
    if (onSelectCategory) {
      onSelectCategory(cat.code);
    }
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName) return;
    const newCat = {
      id: 'cat-' + Date.now(),
      name: newCatName,
      code: newCatName,
      icon: Grid,
      desc: newCatDesc || 'Custom Lab Inventory Category',
      color: '#00f2fe'
    };
    setCategoriesList([...categoriesList, newCat]);
    setNewCatName('');
    setNewCatDesc('');
    setShowAddModal(false);
  };

  const filteredCategories = categoriesList.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase())
  );

  // Filter items inside category inspection modal
  const categoryInspectionItems = activeCategoryModal
    ? sourceItems.filter((i) => {
        const matchesCategory = 
          activeCategoryModal.code === 'Hardware' 
            ? (i.category === 'Hardware' || i.category === 'PCs' || i.category === 'Monitors')
            : (i.category === activeCategoryModal.code || i.category?.toLowerCase().includes(activeCategoryModal.code.toLowerCase()));
        
        const matchesSearch = 
          !itemSearch || 
          (i.itemId && i.itemId.toLowerCase().includes(itemSearch.toLowerCase())) ||
          (i.deviceName && i.deviceName.toLowerCase().includes(itemSearch.toLowerCase())) ||
          (i.labLocation && i.labLocation.toLowerCase().includes(itemSearch.toLowerCase())) ||
          (i.assignedStaff && i.assignedStaff.toLowerCase().includes(itemSearch.toLowerCase()));

        return matchesCategory && matchesSearch;
      })
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
            Inventory Categories Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Organize equipment into categorized lab asset groups and inspect equipment items
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="lab-input"
              placeholder="Search Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="btn-cyan" style={{ height: '38px', padding: '0 16px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* Grid of Category Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredCategories.map((cat) => {
          const Icon = cat.icon;
          const stats = getCategoryStats(cat.code);

          return (
            <div 
              key={cat.id} 
              className="lab-card lab-card-hover" 
              style={{ padding: '22px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${cat.color}15`, border: `1px solid ${cat.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={22} color={cat.color} />
                </div>

                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {stats.count} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Items</span>
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{cat.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{cat.desc}</p>
              </div>

              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--green-online)', fontWeight: 600 }}>
                  ● {stats.online} Online / Active
                </span>

                <button 
                  onClick={() => handleOpenViewItems(cat)}
                  style={{ background: 'none', border: 'none', color: 'var(--cyan-bright)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  View Items <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Items Category Modal */}
      {activeCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '850px', padding: '28px', border: `1px solid ${activeCategoryModal.color}`, maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${activeCategoryModal.color}20`, border: `1px solid ${activeCategoryModal.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <activeCategoryModal.icon size={20} color={activeCategoryModal.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '2px' }}>
                    {activeCategoryModal.name} Equipment Items
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Showing items assigned to category: {activeCategoryModal.code}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => setActiveCategoryModal(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="lab-input"
                  placeholder="Search Item Name / ID / Lab..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={{ paddingLeft: '36px', height: '36px', fontSize: '0.84rem' }}
                />
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--cyan-bright)', fontWeight: 700 }}>
                Total Category Items: {categoryInspectionItems.length}
              </span>
            </div>

            {/* Modal Equipment Items Table */}
            <div style={{ overflowY: 'auto', overflowX: 'auto', maxHeight: '420px', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--cyan-bright)', color: 'var(--text-secondary)', position: 'sticky', top: 0, background: '#0b1120', zIndex: 10 }}>
                    <th style={{ padding: '12px' }}>Item ID</th>
                    <th style={{ padding: '12px' }}>Equipment Device Name</th>
                    <th style={{ padding: '12px' }}>Category</th>
                    <th style={{ padding: '12px' }}>Assigned Lab Room</th>
                    <th style={{ padding: '12px' }}>Staff / Tech</th>
                    <th style={{ padding: '12px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryInspectionItems.length > 0 ? (
                    categoryInspectionItems.map((row) => (
                      <tr key={row.itemId || row._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--cyan-bright)' }}>{row.itemId || row._id}</td>
                        <td style={{ padding: '14px', color: '#fff', fontWeight: 700 }}>{row.deviceName || row.name}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: `${activeCategoryModal.color}15`, color: activeCategoryModal.color, border: `1px solid ${activeCategoryModal.color}40` }}>
                            {row.category}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: '#fff', fontWeight: 600 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <Building size={14} color="var(--cyan-bright)" /> {row.labLocation || 'Lab 1'}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--text-secondary)' }}>{row.assignedStaff || 'Lab Staff'}</td>
                        <td style={{ padding: '14px' }}>
                          <span className={`status-pill ${row.status === 'Pending Repair' ? 'status-pending' : 'status-completed'}`}>
                            {row.status || 'Online'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No equipment items found for category: {activeCategoryModal.name}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
              <button onClick={() => setActiveCategoryModal(null)} className="btn-cyan" style={{ height: '36px', padding: '0 20px', fontSize: '0.85rem' }}>
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal for Adding New Category */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
          <div className="lab-card" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid var(--cyan-bright)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '20px' }}>
              Create New Inventory Category
            </h3>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Category Name</label>
                <input 
                  type="text" 
                  required 
                  className="lab-input" 
                  placeholder="e.g. Graphic Tablets"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Description</label>
                <textarea 
                  className="lab-input" 
                  rows={3}
                  placeholder="Short description of equipment in this category..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="pill-filter">Cancel</button>
                <button type="submit" className="btn-cyan">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
