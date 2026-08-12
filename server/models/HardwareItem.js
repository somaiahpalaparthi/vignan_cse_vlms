const mongoose = require('mongoose');

const hardwareItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Hardware',
    },
    subCategory: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Online',
    },
    labLocation: {
      type: String,
      default: 'Lab 12',
    },
    assignedStaff: {
      type: String,
      default: 'Unassigned',
    },
    invoiceNo: {
      type: String,
      default: '',
    },
    serialNo: {
      type: String,
      default: '',
    },
    invoiceDate: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HardwareItem', hardwareItemSchema);
