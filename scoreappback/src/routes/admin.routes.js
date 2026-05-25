const express = require('express');
const router = express.Router();
const { 
    getDashboardStats, 
    getAllUsers, 
    updateUserRole, 
    updateUserStatus, 
    deleteUser, 
    getAllTHAccounts, 
    getTHDetails,
    updateTHLeagueLimit,
    getAllSubAdmins,
    createSubAdmin,
    updateSubAdminStatus,
    deleteSubAdmin,
    getPlayerDetailedStats
} = require('../controllers/admin.controller');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

// Protect all routes
router.use(protect);

// Dashboard, general user listing and basic actions - Authorized for both Super Admin and Sub-Admin
router.get('/dashboard', authorize('admin', 'super_admin'), getDashboardStats);
router.get('/users', authorize('admin', 'super_admin', 'TH'), getAllUsers);
router.put('/users/:id/status', authorize('admin', 'super_admin'), updateUserStatus);

// Critical modifications
router.put('/users/:id/role', authorize('super_admin'), updateUserRole);
router.delete('/users/:id', authorize('admin', 'super_admin'), deleteUser);

// Player Statistics - Authorized for Super Admin, Sub-Admin, and TH
router.get('/players/:id/stats', authorize('admin', 'super_admin', 'TH'), getPlayerDetailedStats);

// Tournament Head Management - Authorized for both Super Admin and Sub-Admin
router.get('/th-accounts', authorize('admin', 'super_admin'), getAllTHAccounts);
router.get('/th-details/:id', authorize('admin', 'super_admin'), getTHDetails);
router.put('/th-accounts/:id/limit', authorize('admin', 'super_admin'), updateTHLeagueLimit);

// Sub-Admin Management - Authorized for Super Admin only
router.get('/sub-admins', authorize('super_admin'), getAllSubAdmins);
router.post('/sub-admins', authorize('super_admin'), createSubAdmin);
router.put('/sub-admins/:id/status', authorize('super_admin'), updateSubAdminStatus);
router.delete('/sub-admins/:id', authorize('super_admin'), deleteSubAdmin);

module.exports = router;
