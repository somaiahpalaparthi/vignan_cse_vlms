const express = require('express');
const router = express.Router();
const { getIssues, createIssue, updateIssue, resolveIssue, deleteIssue, clearAllIssues } = require('../controllers/issueController');

router.get('/', getIssues);
router.post('/', createIssue);
router.put('/:id', updateIssue);
router.put('/:id/resolve', resolveIssue);
router.delete('/clear/all', clearAllIssues);
router.delete('/:id', deleteIssue);

module.exports = router;
