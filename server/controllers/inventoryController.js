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

const initialInventorySeed = [
  { itemId: 'HW-001', code: 'VUG-CSE-PC-101', deviceName: 'Dell OptiPlex 7090 Tower Workstation', category: 'Hardware', subCategory: 'cpu', specs: 'Intel Core i7 11th Gen, 32GB DDR4, 1TB NVMe SSD, Nvidia GTX 1650 4GB', labLocation: 'Lab 12', assignedStaff: 'Mr. K. Ramesh', status: 'Online', qty: 45, condition: 'Excellent Condition' },
  { itemId: 'HW-002', code: 'VUG-CSE-GPU-204', deviceName: 'HP Z2 Tower AI / ML Workstation', category: 'Hardware', subCategory: 'gpu', specs: 'Intel Core i9 13th Gen, 64GB DDR5, 2TB SSD, Nvidia RTX 4080 16GB', labLocation: 'Lab 15', assignedStaff: 'Dr. P. Suresh', status: 'Online', qty: 30, condition: 'Excellent Condition' },
  { itemId: 'HW-003', code: 'VUG-CSE-SW-012', deviceName: 'Cisco Catalyst 9300 48-Port Gigabit Switch', category: 'Hardware', subCategory: 'switch', specs: 'Managed Layer 3 Switch, 48x 1GbE PoE+ Ports, 4x 10G Uplink', labLocation: 'Lab 33', assignedStaff: 'Mr. V. Anjaneyulu', status: 'Maintenance', qty: 6, condition: 'Port 12 Faulty - Inspection' },
  { itemId: 'HW-004', code: 'VUG-CSE-IOT-305', deviceName: 'Raspberry Pi 4 Model B (8GB) Lab Packs', category: 'Hardware', subCategory: 'iot', specs: 'ARM Cortex-A72, 8GB LPDDR4, 64GB MicroSD, GPIO Expansion Kit', labLocation: 'Lab 25', assignedStaff: 'Mrs. T. Lakshmi', status: 'Online', qty: 25, condition: 'Good Condition' },
  { itemId: 'HW-005', code: 'VUG-CSE-MON-114', deviceName: 'Dell 27" UltraSharp 4K IPS Monitor', category: 'Hardware', subCategory: 'monitor', specs: '3840x2160 UHD, 99% sRGB, USB-C Hub, Height Adjustable Stand', labLocation: 'Lab 12', assignedStaff: 'Mr. K. Ramesh', status: 'Online', qty: 45, condition: 'Good Condition' },
  { itemId: 'EL-001', code: 'VUG-CSE-UPS-001', deviceName: 'APC Smart-UPS VT 20 KVA 3-Phase Online UPS', category: 'Electrical', subCategory: 'ups', specs: '20 KVA / 16 kW, 400V 3-Phase, External 32-Battery Bank Tray', labLocation: 'Lab 12', assignedStaff: 'Electrical Maintenance', status: 'Online', qty: 2, condition: 'Backup Runtime: 45 Mins (94% Health)' },
  { itemId: 'EL-002', code: 'VUG-CSE-AC-101', deviceName: 'Daikin 3.0 Ton Inverter Cassette AC Unit 1', category: 'Electrical', subCategory: 'ac', specs: 'R-32 Refrigerant, 4-Way Airflow Ceiling Cassette, 5-Star Rating', labLocation: 'Lab 12', assignedStaff: 'HVAC Team', status: 'Online', qty: 4, condition: 'Cooling Target: 21°C' },
  { itemId: 'EL-003', code: 'VUG-CSE-AC-202', deviceName: 'Voltas 2.0 Ton Heavy Duty Split AC Unit 3', category: 'Electrical', subCategory: 'ac', specs: 'Copper Condenser, Anti-Dust Filter, Turbo Cool Mode', labLocation: 'Lab 15', assignedStaff: 'HVAC Team', status: 'Maintenance', qty: 4, condition: 'Filter Cleaning & Gas Top-up' },
  { itemId: 'FN-001', code: 'VUG-CSE-DSK-101', deviceName: 'Modular 4-Seater Dual Computer Workstation Desk', category: 'Furniture', subCategory: 'desk', specs: 'CRCA Steel Frame, Pre-laminated Top, Cable Tray & CPU Cage', labLocation: 'Lab 12', assignedStaff: 'Estate Manager', status: 'Online', qty: 12, condition: 'Seats 48 Students' },
  { itemId: 'FN-002', code: 'VUG-CSE-CHR-105', deviceName: 'Featherlite Ergonomic Revolving Mesh Chairs', category: 'Furniture', subCategory: 'chair', specs: 'Pneumatic Height Adjustment, Lumbar Support, Twin Wheel Castors', labLocation: 'Lab 12', assignedStaff: 'Estate Manager', status: 'Online', qty: 50, condition: '48 Good, 2 Cylinders Serviced' }
];

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
