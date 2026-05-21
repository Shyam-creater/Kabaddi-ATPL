const express = require('express');
const router = express.Router();
const { getTHDashboardStats, getMyLeagues, getScorers, createScorer, updateScorerStatus, deleteScorer } = require('../controllers/th.controller');
const { protect, thOnly } = require('../middlewares/auth.middleware');

// Protect all TH routes
router.use(protect);
router.use(thOnly);

router.get('/dashboard', getTHDashboardStats);
router.get('/leagues', getMyLeagues);
router.get('/scorers', getScorers);
router.post('/scorers', createScorer);
router.put('/scorers/:id/status', updateScorerStatus);
router.delete('/scorers/:id', deleteScorer);

module.exports = router;
