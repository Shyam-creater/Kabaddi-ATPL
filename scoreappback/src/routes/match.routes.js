const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

const { protect, adminOrTH } = require('../middlewares/auth.middleware');

router.get('/all', matchController.getAllMatches);
router.post('/', protect, adminOrTH, matchController.createMatch);
router.put('/:id', protect, adminOrTH, matchController.updateMatch);
router.delete('/:id', protect, adminOrTH, matchController.deleteMatch);

module.exports = router;
