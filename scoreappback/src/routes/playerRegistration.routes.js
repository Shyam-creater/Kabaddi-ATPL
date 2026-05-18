const express = require('express');
const router = express.Router();
const controller = require('../controllers/playerRegistrationController');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, controller.createRegistration);
router.get('/', protect, controller.getAllRegistrations);
router.get('/check/:tournamentId', protect, controller.checkRegistration);
router.put('/:id/status', protect, controller.updateRegistrationStatus);
router.delete('/:id', protect, controller.deleteRegistration);

module.exports = router;
