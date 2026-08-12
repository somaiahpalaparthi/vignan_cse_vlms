const express = require('express');
const router = express.Router();
const { getInventory, createItem, updateItem, deleteItem, clearAllInventory } = require('../controllers/inventoryController');

router.get('/', getInventory);
router.post('/', createItem);
router.delete('/clear/all', clearAllInventory);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
