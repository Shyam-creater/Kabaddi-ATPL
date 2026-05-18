const express = require('express');
const router = express.Router(); // Fixed lowercase 'r'
const tournamentController = require('../controllers/tournament.controller');

// Controller methods expect req.params.sport
// Routes mapped to /api/tournaments in app.js

// Create: POST /api/tournaments/:sport
router.post('/:sport', tournamentController.createTournament);

// List: GET /api/tournaments/:sport
router.get('/:sport', tournamentController.getTournaments);

// Explicit /all route to avoid collision with :id
router.get('/:sport/all', tournamentController.getTournaments);

// Get One: GET /api/tournaments/:sport/:id
router.get('/:sport/:id', tournamentController.getTournamentById);

// Update: PUT /api/tournaments/:sport/:id
router.put('/:sport/:id', tournamentController.updateTournament);

// Delete: DELETE /api/tournaments/:sport/:id
router.delete('/:sport/:id', tournamentController.deleteTournament);

module.exports = router;
