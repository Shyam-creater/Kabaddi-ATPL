const express = require('express');
const router = express.Router();
const {
    getUsersForChat,
    getMessages,
    sendMessage,
    deleteMessage,
} = require('../controllers/message.controller');
const { protect } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(protect);

// Get all users to chat with (with unread counts)
router.get('/users', getUsersForChat);

// Get messages with a specific user
router.get('/:userId', getMessages);

// Send a message to a user
router.post('/send/:userId', sendMessage);

// Delete a message
router.post('/delete/:messageId', deleteMessage);

module.exports = router;
