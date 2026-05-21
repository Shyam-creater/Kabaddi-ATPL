const express = require('express');
const router = express.Router();
const { register, login, changePassword, thSignup, thLogin } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

// @route POST /api/auth/register
router.post('/register', register);

// @route POST /api/auth/login
router.post('/login', login);

// @route POST /api/auth/change-password
router.post('/change-password', protect, changePassword);

// @route POST /api/auth/th-signup
router.post('/th-signup', thSignup);

// @route POST /api/auth/th-login
router.post('/th-login', thLogin);

module.exports = router;
