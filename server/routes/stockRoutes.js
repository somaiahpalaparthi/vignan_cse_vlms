const express = require('express');
const router = express.Router();
const { getStock, createStockEntry, updateStockEntry, deleteStockEntry, adjustStock, clearAllStock } = require('../controllers/stockController');

router.get('/', getStock);
router.post('/', createStockEntry);
router.delete('/clear/all', clearAllStock);
router.put('/:id', updateStockEntry);
router.delete('/:id', deleteStockEntry);
router.put('/:id/adjust', adjustStock);

module.exports = router;
