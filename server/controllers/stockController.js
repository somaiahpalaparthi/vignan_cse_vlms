const StockItem = require('../models/StockItem');

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

const initialStockSeed = [];

let isStockSeeded = false;

const seedStockIfNeeded = async () => {
  if (isStockSeeded) return;
  try {
    isStockSeeded = true;
  } catch (e) {
    console.error('Stock notice:', e.message);
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

const getStock = async (req, res) => {
  try {
    await seedStockIfNeeded();
    const { role, department, category, search } = req.query;

    let items = await StockItem.find({});
    items = items.filter((i) => !isInactiveLab(i.labLocation));

    if (department && department !== 'All') {
      items = items.filter((i) => isLabMatch(i.labLocation, department));
    }

    if (category && category !== 'All') {
      items = items.filter((i) => i.category === category || (category.includes('Workshop') && i.category.includes('Workshop')));
    }

    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (i) =>
          (i.id && i.id.toLowerCase().includes(q)) ||
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.supplier && i.supplier.toLowerCase().includes(q))
      );
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching stock from MongoDB Atlas' });
  }
};

const createStockEntry = async (req, res) => {
  try {
    await seedStockIfNeeded();
    const { name, category, subCategory, specs, details, quantity, unitCost, labLocation, supplier, userRole, userDepartment } = req.body;

    if (!name || !category || !quantity) {
      return res.status(400).json({ message: 'Name, Category, and Quantity are required.' });
    }

    const targetLab = (labLocation && labLocation !== 'All') ? labLocation : (userDepartment || 'Lab 12');
    const prefix = category === 'Hardware' ? 'HW' : category === 'Electrical' ? 'EL' : 'WF';
    const itemSpecs = specs || details || req.body.specs || req.body.details || '';

    const newDoc = {
      id: req.body.id || `STK-${prefix}-${Math.floor(Math.random() * 800 + 100)}`,
      name,
      category: category || 'Hardware',
      subCategory: subCategory || 'cpu',
      specs: itemSpecs,
      details: itemSpecs,
      quantity: Number(quantity),
      unitCost: Number(unitCost || 0),
      invoiceNo: req.body.invoiceNo || '',
      serialNo: req.body.serialNo || '',
      invoiceDate: req.body.invoiceDate || '',
      labLocation: targetLab,
      supplier: supplier || 'Authorized Supplier',
      status: Number(quantity) > 8 ? 'In Stock' : 'Low Stock',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const newItem = await StockItem.create(newDoc);
    res.status(201).json({ message: 'Stock entry created successfully', item: newItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateBody = { ...req.body };
    if (updateBody.specs && !updateBody.details) updateBody.details = updateBody.specs;
    if (updateBody.details && !updateBody.specs) updateBody.specs = updateBody.details;

    let item = await StockItem.findOneAndUpdate({ id: id }, updateBody, { new: true });
    if (!item) {
      item = await StockItem.findByIdAndUpdate(id, updateBody, { new: true });
    }

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found in MongoDB Atlas' });
    }

    res.json({ message: 'Stock item updated successfully in MongoDB Atlas', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStockEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole } = req.query;

    if (userRole && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only Administrators can delete stock items.' });
    }

    await StockItem.deleteOne({ id: id });
    await StockItem.findByIdAndDelete(id).catch(() => {});

    res.json({ message: 'Stock item deleted successfully from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { adjustment } = req.body;

    let item = await StockItem.findOne({ id: id });
    if (!item) {
      item = await StockItem.findById(id).catch(() => null);
    }

    if (!item) {
      return res.status(404).json({ message: 'Stock item not found' });
    }

    const newQty = Math.max(0, item.quantity + Number(adjustment));
    item.quantity = newQty;
    item.status = newQty > 8 ? 'In Stock' : newQty > 0 ? 'Low Stock' : 'Out of Stock';
    await item.save();

    res.json({ message: 'Stock adjusted successfully in MongoDB Atlas', item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearAllStock = async (req, res) => {
  try {
    const { userRole } = req.query;
    if (userRole && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only Administrators can clear stock entries.' });
    }
    await StockItem.deleteMany({});
    res.json({ message: 'All stock data cleared from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStock,
  createStockEntry,
  updateStockEntry,
  deleteStockEntry,
  adjustStock,
  clearAllStock
};
