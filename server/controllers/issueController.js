const Issue = require('../models/Issue');
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

const initialIssuesSeed = [];

let isIssueSeeded = false;

const seedIssuesIfNeeded = async () => {
  if (isIssueSeeded) return;
  try {
    const count = await Issue.countDocuments();
    if (count === 0) {
      await Issue.insertMany(initialIssuesSeed);
    }
    isIssueSeeded = true;
  } catch (e) {
    console.error('Issue notice:', e.message);
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

const getIssues = async (req, res) => {
  try {
    await seedIssuesIfNeeded();
    const { role, department } = req.query;
    let items = await Issue.find({});
    items = items.filter((i) => !isInactiveLab(i.labLocation));

    if (role !== 'admin' && department && department !== 'All') {
      items = items.filter((i) => isLabMatch(i.labLocation, department));
    }

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error fetching issues from MongoDB Atlas' });
  }
};

const createIssue = async (req, res) => {
  try {
    await seedIssuesIfNeeded();
    const { deviceId, equipmentName, quantity, title, category, subCategory, severity, labLocation, reportedBy, userRole, userDepartment, serialNo, invoiceNo, invoiceDate, assignedTech, assignedStaff } = req.body;

    const finalEquipName = equipmentName || deviceId;
    const issueQty = Math.max(1, Number(quantity || 1));

    if (!title || !finalEquipName) {
      return res.status(400).json({ message: 'Equipment Name and Issue Title are required' });
    }

    const targetLab = (userRole && userRole !== 'admin' && userDepartment)
      ? userDepartment
      : (labLocation || 'Lab 12');

    const todayStr = new Date().toISOString().split('T')[0];

    const newDoc = {
      id: req.body.id || 'ISS-' + Math.floor(Math.random() * 800 + 100),
      deviceId: deviceId || finalEquipName,
      equipmentName: finalEquipName,
      quantity: issueQty,
      title,
      category: category || 'Hardware',
      subCategory: subCategory || 'cpu',
      severity: severity || 'High',
      status: 'Pending Repair',
      labLocation: targetLab,
      reportedBy: reportedBy || 'Lab Staff',
      serialNo: serialNo || '',
      invoiceNo: invoiceNo || '',
      invoiceDate: invoiceDate || '',
      assignedTech: assignedTech || {},
      assignedStaff: assignedStaff || '',
      postedDate: req.body.postedDate || req.body.date || todayStr,
      date: req.body.postedDate || req.body.date || todayStr
    };

    const newIssue = await Issue.create(newDoc);
    res.status(201).json({ message: 'Issue logged successfully in MongoDB Atlas', issue: newIssue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let issue = null;

    if (req.body.status === 'Completed' && (!req.body.daysTaken || req.body.daysTaken === '0 Days' || req.body.daysTaken === '0')) {
      const todayStr = new Date().toISOString().split('T')[0];
      const pDate = req.body.postedDate || req.body.date || todayStr;
      const rDate = req.body.resolvedDate || todayStr;
      try {
        const d1 = new Date(pDate);
        const d2 = new Date(rDate);
        const diffMs = Math.abs(d2 - d1);
        const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        req.body.daysTaken = `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;
      } catch (e) {
        req.body.daysTaken = '1 Day';
      }
      req.body.resolvedDate = rDate;
    }

    if (mongoose.Types.ObjectId.isValid(id)) {
      issue = await Issue.findByIdAndUpdate(id, req.body, { new: true });
    }
    if (!issue) {
      issue = await Issue.findOneAndUpdate({ id: id }, req.body, { new: true });
    }

    if (!issue) {
      return res.status(404).json({ message: 'Issue ticket not found in MongoDB Atlas' });
    }

    res.json({ message: 'Issue ticket updated successfully in MongoDB Atlas', issue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let issue = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      issue = await Issue.findById(id).catch(() => null);
    }
    if (!issue) {
      issue = await Issue.findOne({ id: id });
    }

    if (!issue) {
      return res.status(404).json({ message: 'Issue ticket not found in MongoDB Atlas' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const pDate = req.body.postedDate || issue.postedDate || issue.date || (issue.createdAt ? new Date(issue.createdAt).toISOString().split('T')[0] : todayStr);
    const rDate = req.body.resolvedDate || todayStr;

    let diffDays = 1;
    try {
      const d1 = new Date(pDate);
      const d2 = new Date(rDate);
      const diffMs = Math.abs(d2 - d1);
      diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } catch (e) {
      diffDays = 1;
    }

    const daysText = (req.body.daysTaken && req.body.daysTaken !== '0 Days' && req.body.daysTaken !== '0')
      ? req.body.daysTaken
      : `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`;

    issue.status = 'Completed';
    issue.postedDate = pDate;
    issue.resolvedDate = rDate;
    issue.daysTaken = daysText;

    if (req.body.assignedTech) issue.assignedTech = req.body.assignedTech;
    if (req.body.assignedStaff) issue.assignedStaff = req.body.assignedStaff;

    await issue.save();

    res.json({ message: 'Issue resolved successfully in MongoDB Atlas', issue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { userRole } = req.query;

    if (userRole && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only Administrators can delete issue tickets.' });
    }

    await Issue.deleteOne({ id: id });
    await Issue.findByIdAndDelete(id).catch(() => {});

    res.json({ message: 'Issue ticket deleted successfully from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearAllIssues = async (req, res) => {
  try {
    const { userRole } = req.query;
    if (userRole && userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only Administrators can clear issue tickets.' });
    }
    await Issue.deleteMany({});
    res.json({ message: 'All issue tickets cleared from MongoDB Atlas' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIssues,
  createIssue,
  updateIssue,
  resolveIssue,
  deleteIssue,
  clearAllIssues
};
