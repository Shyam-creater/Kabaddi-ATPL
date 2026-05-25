const express = require('express');
const router = express.Router();
const { getTHDashboardStats, getMyLeagues, getScorers, createScorer, updateScorerStatus, deleteScorer } = require('../controllers/th.controller');
const { protect, thOnly, adminSuperAdminOrTH } = require('../middlewares/auth.middleware');

// Protect all TH routes
router.use(protect);

router.get('/dashboard', thOnly, getTHDashboardStats);
router.get('/leagues', thOnly, getMyLeagues);
router.get('/scorers', adminSuperAdminOrTH, getScorers);
router.post('/scorers', adminSuperAdminOrTH, createScorer);
router.put('/scorers/:id/status', adminSuperAdminOrTH, updateScorerStatus);
router.delete('/scorers/:id', adminSuperAdminOrTH, deleteScorer);

module.exports = router;
