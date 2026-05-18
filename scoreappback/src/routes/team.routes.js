const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');

router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.post('/', teamController.createTeam);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
