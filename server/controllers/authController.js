const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initialUsersSeed = [
  { userId: 'admin@labflow.dev', email: 'admin@labflow.dev', password: 'admin123', name: 'Admin Manager', mobileNumber: '+1 555-0192', role: 'admin', department: 'Lab 12', status: 'Active', permissions: ['View Reports', 'Manage Users', 'Schedule Labs', 'System Config'] },
  { userId: 'kattakalyani@labflow.dev', email: 'kattakalyani@labflow.dev', password: 'staff123', name: 'kattakalyani', mobileNumber: '+91 9848012345', role: 'staff', department: 'NB-511', status: 'Active', permissions: ['View Reports', 'Schedule Labs'] },
  { userId: 'sirisha@labflow.dev', email: 'sirisha@labflow.dev', password: 'staff123', name: 'ch sirisha', mobileNumber: '+91 9440156789', role: 'staff', department: 'NB-304', status: 'Active', permissions: ['View Reports', 'Schedule Labs'] },
  { userId: 'staff@labflow.dev', email: 'staff@labflow.dev', password: 'staff123', name: 'Programmer Staff A', mobileNumber: '+1 555-0184', role: 'staff', department: 'Lab 12', status: 'Active', permissions: ['View Reports', 'Schedule Labs'] },
  { userId: 'jamer@labflow.dev', email: 'jamer@labflow.dev', password: 'jamer123', name: 'Jamer Smrey', mobileNumber: '+1 555-0177', role: 'staff', department: 'Lab 25', status: 'On Leave', permissions: ['View Reports'] },
  { userId: 'elena@labflow.dev', email: 'elena@labflow.dev', password: 'elena123', name: 'Elena Rostova', mobileNumber: '+1 555-0163', role: 'staff', department: 'Lab 33', status: 'Active', permissions: ['View Reports', 'Schedule Labs'] }
];

let isUserSeeded = false;

const seedUsersIfNeeded = async () => {
  if (isUserSeeded) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      for (const u of initialUsersSeed) {
        await User.create(u);
      }
      console.log('🌱 User collection seeded in MongoDB Atlas');
    }
    isUserSeeded = true;
  } catch (e) {
    console.error('User auto-seed notice:', e.message);
  }
};

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'labflow_cms_cyber_key_2026', {
    expiresIn: '30d',
  });
};

const loginUser = async (req, res) => {
  try {
    await seedUsersIfNeeded();
    const userIdInput = req.body.userId || req.body.email;
    const { password } = req.body;

    if (!userIdInput || !password) {
      return res.status(400).json({ message: 'User ID / Email and Password are required' });
    }

    const user = await User.findOne({ 
      $or: [{ userId: userIdInput }, { email: userIdInput }] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Account not registered. Please register first.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    return res.json({
      _id: user._id,
      userId: user.userId,
      email: user.email || user.userId,
      name: user.name,
      mobileNumber: user.mobileNumber || '',
      role: user.role,
      department: user.department,
      status: user.status || 'Active',
      permissions: user.permissions,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Login error' });
  }
};

const registerUser = async (req, res) => {
  try {
    await seedUsersIfNeeded();
    const { userId, email, password, mobileNumber, role, department, status, permissions, name } = req.body;

    const userEmail = email || userId;
    if (!userEmail || !password) {
      return res.status(400).json({ message: 'Please enter User ID / Email and password' });
    }

    let existing = await User.findOne({ $or: [{ userId: userEmail }, { email: userEmail }] });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email/ID' });
    }

    const newDoc = await User.create({
      userId: userEmail,
      email: userEmail,
      password,
      mobileNumber: mobileNumber || '',
      name: name || 'Lab Staff',
      role: role || 'staff',
      department: department || 'Lab 12',
      status: status || 'Active',
      permissions: permissions || ['View Reports'],
    });

    const token = generateToken(newDoc._id, newDoc.role);
    res.status(201).json({
      _id: newDoc._id,
      userId: newDoc.userId,
      email: newDoc.email,
      name: newDoc.name,
      mobileNumber: newDoc.mobileNumber,
      role: newDoc.role,
      department: newDoc.department,
      status: newDoc.status || 'Active',
      permissions: newDoc.permissions,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    await seedUsersIfNeeded();
    const users = await User.find({}).select('+password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let user = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id).select('+password');
    }
    if (!user) {
      user = await User.findOne({ $or: [{ userId: id }, { email: id }] }).select('+password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found in MongoDB Atlas' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.userId) user.userId = req.body.userId;
    if (req.body.mobileNumber !== undefined) user.mobileNumber = req.body.mobileNumber;
    if (req.body.role) user.role = req.body.role;
    if (req.body.department) user.department = req.body.department;
    if (req.body.status) user.status = req.body.status;
    if (req.body.permissions) user.permissions = req.body.permissions;

    if (req.body.password && req.body.password !== user.password) {
      user.password = req.body.password;
    }

    await user.save();

    const updatedUser = user.toObject();
    return res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const mongoose = require('mongoose');
    let deletedDoc = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      deletedDoc = await User.findByIdAndDelete(id);
    }
    if (!deletedDoc) {
      deletedDoc = await User.findOneAndDelete({ $or: [{ userId: id }, { email: id }] });
    }

    res.json({ message: 'User deleted successfully from MongoDB Atlas', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerUser, getUsers, updateUser, deleteUser };
