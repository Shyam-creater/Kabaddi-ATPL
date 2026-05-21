const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');

const { protect, adminOrTH } = require('../middlewares/auth.middleware');

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', protect, adminOrTH, teamController.createTeam);
router.put('/:id', protect, adminOrTH, teamController.updateTeam);
router.delete('/:id', protect, adminOrTH, teamController.deleteTeam);

module.exports = router;
