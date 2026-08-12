const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },
    issueTag: {
      type: String,
      trim: true,
    },
    deviceId: {
      type: String,
      default: '',
    },
    equipmentName: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'Hardware',
    },
    subCategory: {
      type: String,
      default: 'cpu',
    },
    severity: {
      type: String,
      default: 'Medium',
    },
    status: {
      type: String,
      default: 'Pending Repair',
    },
    labLocation: {
      type: String,
      default: 'Lab 12',
    },
    reportedBy: {
      type: String,
      default: 'Staff',
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
    postedDate: {
      type: String,
      default: '',
    },
    date: {
      type: String,
      default: '',
    },
    resolvedDate: {
      type: String,
      default: '',
    },
    daysTaken: {
      type: String,
      default: '',
    },
    assignedTech: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Issue', issueSchema);
