const express = require('express');
const router = express.Router();
const matchController = require('../controllers/match.controller');

router.get('/all', matchController.getAllMatches);
router.post('/', matchController.createMatch);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

module.exports = router;
