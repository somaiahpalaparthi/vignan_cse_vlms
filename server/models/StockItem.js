const mongoose = require('mongoose');

const stockItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'Hardware',
    },
    subCategory: {
      type: String,
      default: 'cpu',
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unitCost: {
      type: Number,
      default: 0,
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
    labLocation: {
      type: String,
      default: 'Lab 12',
    },
    supplier: {
      type: String,
      default: 'Authorized Supplier',
    },
    specs: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'In Stock',
    },
    dateAdded: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StockItem', stockItemSchema);
