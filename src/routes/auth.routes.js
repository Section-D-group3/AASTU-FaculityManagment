const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUsers } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/roles');

// Public routes
router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/users', authenticate, getUsers);

module.exports = router;
