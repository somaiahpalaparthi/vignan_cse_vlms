export const isInactiveLab = (labStr) => {
  if (!labStr) return false;
  const clean = String(labStr).trim().toLowerCase().replace(/\s+/g, '');
  if (
    clean.includes('serverroom') ||
    clean.includes('centerserver') ||
    clean.includes('server') ||
    clean.includes('center')
  ) return true;

  if (
    clean.includes('cselab1') ||
    clean.includes('cselab2') ||
    clean.includes('cselab3') ||
    clean.includes('cselab4')
  ) return true;

  if (
    clean === 'lab1' || clean === 'lab2' || clean === 'lab3' || clean === 'lab4' ||
    clean === 'cselab1' || clean === 'cselab2' || clean === 'cselab3' || clean === 'cselab4' ||
    clean.startsWith('lab1(') || clean.startsWith('lab2(') || clean.startsWith('lab3(') || clean.startsWith('lab4(')
  ) return true;

  return false;
};

export const getAssignedStaffLabs = () => {
  const labSet = new Set();
  try {
    const savedStaff = localStorage.getItem('vlms_staff_list');
    if (savedStaff) {
      const parsed = JSON.parse(savedStaff);
      if (Array.isArray(parsed)) {
        parsed.forEach(s => {
          const loc = s.department || s.assignedLab || s.labLocation;
          if (loc && String(loc).trim() && !isInactiveLab(loc)) labSet.add(String(loc).trim());
        });
      }
    }

    const savedStock = localStorage.getItem('vlms_stock_list');
    if (savedStock) {
      const parsedStock = JSON.parse(savedStock);
      if (Array.isArray(parsedStock)) {
        parsedStock.forEach(s => {
          const loc = s.labLocation || s.department;
          if (loc && String(loc).trim() && !isInactiveLab(loc)) labSet.add(String(loc).trim());
        });
      }
    }

    const savedInv = localStorage.getItem('vlms_inventory');
    if (savedInv) {
      const parsedInv = JSON.parse(savedInv);
      if (Array.isArray(parsedInv)) {
        parsedInv.forEach(i => {
          const loc = i.labLocation || i.department;
          if (loc && String(loc).trim() && !isInactiveLab(loc)) labSet.add(String(loc).trim());
        });
      }
    }
  } catch (e) {
    console.error('Error fetching staff labs:', e);
  }

  const result = Array.from(labSet);
  return result.length > 0 ? result : ['Lab 12', 'Lab 25', 'Lab 33', 'Lab A', 'Lab B', 'Lab C'];
};

