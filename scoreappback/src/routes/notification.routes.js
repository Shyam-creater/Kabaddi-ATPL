const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, adminOnly } = require('../middlewares/auth.middleware');

// Public to logged users (e.g. followers)
router.get('/', protect, notificationController.getNotifications);
router.put('/:notificationId/read', protect, notificationController.markAsRead);
router.post('/register-push', protect, notificationController.registerPushToken);

// Admin only (Broadcast & Targeted Send)
router.get('/admin', protect, adminOnly, notificationController.getAdminNotifications);
router.post('/send', protect, adminOnly, notificationController.createNotification);
router.put('/admin/:broadcastId', protect, adminOnly, notificationController.updateAdminNotification);
router.delete('/admin/:broadcastId', protect, adminOnly, notificationController.deleteAdminNotification);

router.delete('/:notificationId', protect, notificationController.deleteNotification);

module.exports = router;
