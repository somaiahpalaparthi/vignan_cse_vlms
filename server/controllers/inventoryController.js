const HardwareItem = require('../models/HardwareItem');

const isInactiveLab = (labStr) => {
  if (!labStr) return false;
  const clean = String(labStr).trim().toLowerCase().replace(/\s+/g, '');
  if (
    clean.includes('serverroom') ||
    clean.includes('centerserver') ||
    clean.includes('server') ||
    clean.includes('center')
  ) return true;

  if (
    clean === 'cselab1' || clean === 'lab1' ||
    clean === 'cselab2' || clean === 'lab2' ||
    clean === 'cselab3' || clean === 'lab3' ||
    clean === 'cselab4' || clean === 'lab4'
  ) return true;

  return false;
};

const initialInventorySeed = [];

let isInventorySeeded = false;

const seedInventoryIfNeeded = async () => {
  if (isInventorySeeded) return;
  try {
    isInventorySeeded = true;
  } catch (e) {
    console.error('Inventory notice:', e.message);
  }
};

const isLabMatch = (itemLab, userDept) => {
  if (!itemLab || isInactiveLab(itemLab)) return false;
  if (!userDept || userDept === 'All') return true;
  const a = itemLab.toLowerCase().replace(/\s+/g, '');
  const b = userDept.toLowerCase().replace(/\s+/g, '');
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
};

const getInventory = async (req, res) => {
  try {
    await seedInventoryIfNeeded();
    const { role, department, category, status } = req.query;

    let allItems = await HardwareItem.find({});
    allItems = allItems.filter((i) => !isInactiveLab(i.labLocation || i.department));

    if (department && department !== 'All') {
      allItems = allItems.filter((i) => {
        const itemLab = i.labLocation || i.department || '';
        return isLabMatch(itemLab, department);
      });
    }

    if (category && category !== 'All') {
      allItems = allItems.filter((i) => {
        if (category === 'Hardware') return i.category === 'Hardware' || i.category === 'PCs' || i.category === 'Monitors';
        return i.category === category || (i.category && i.category.toLowerCase().includes(category.toLowerCase()));
      });
    }

    if (status && status !== 'All') {
      allItems = allItems.filter((i) => i.status === status);
    }

    res.json(allItems);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching inventory from MongoDB Atlas' });
  }
};

const createItem = async (req, res) => {
  try {
    await seedInventoryIfNeeded();
    const { itemId, deviceName, category, status, labLocation, assignedStaff, userRole, userDepartment } = req.body;
    
    const targetLab = (userRole && userRole !== 'admin' && userDepartment) 
      ? userDepartment 
      : (labLocation || 'Lab 12');

    const newDoc = {
      itemId: itemId || 'HW-' + Math.floor(Math.random() * 900 + 100),
      deviceName: deviceName || 'New Hardware Equipment',
      category: category || 'Hardware',
      subCategory: req.body.subCategory || '',
      invoiceNo: req.body.invoiceNo || '',
      serialNo: req.body.serialNo || '',
      invoiceDate: req.body.invoiceDate || '',
      status: status || 'Online',
      labLocation: targetLab,
      assignedStaff: assignedStaff || 'Lab Staff',
    };

    const newItem = await HardwareItem.create(newDoc);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    let item = await HardwareItem.findOneAndUpdate({ itemId: id }, req.body, { new: true });
    if (!item) {
      item = await HardwareItem.findByIdAndUpdate(id, req.body, { new: true });
    }

    if (item) return res.json(item);
    res.status(404).json({ message: 'Item not found in MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole } = req.query;

    if (userRole && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Staff members can only entry & update items for their assigned lab. Deletion requires admin privileges.' });
    }

    await HardwareItem.deleteOne({ itemId: id });
    await HardwareItem.findByIdAndDelete(id).catch(() => {});

    res.json({ message: 'Item deleted successfully from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearAllInventory = async (req, res) => {
  try {
    await HardwareItem.deleteMany({});
    res.json({ message: 'All inventory data wiped successfully from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getInventory, createItem, updateItem, deleteItem, clearAllInventory };
