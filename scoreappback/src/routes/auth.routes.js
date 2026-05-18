const express = require('express');
const router = express.Router();
const { register, login, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// @route POST /api/auth/register
router.post('/register', register);

// @route POST /api/auth/login
router.post('/login', login);

// @route POST /api/auth/change-password
router.post('/change-password', protect, changePassword);

module.exports = router;
