const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getUsers, updateUser, deleteUser } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
