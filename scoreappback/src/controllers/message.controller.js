const Message = require('../models/Message.model');
const User = require('../models/User.model');
const mongoose = require('mongoose');

/**
 * Get all users to chat with (excluding current user)
 * Includes unread message counts for each user
 */
exports.getUsersForChat = async (req, res) => {
    try {
        const currentUserId = req.user._id;

        // Get all users except current user and admins (admins should not appear in chat)
        const users = await User.find(
            {
                _id: { $ne: currentUserId },
                role: { $ne: 'admin' }  // Exclude admin users
            },
            { name: 1, profileImage: 1, lastSeen: 1, email: 1 }
        ).lean();

        // Get unread counts for each user efficiently
        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiverId: new mongoose.Types.ObjectId(currentUserId),
                    read: false,
                },
            },
            {
                $group: {
                    _id: '$senderId',
                    unreadCount: { $sum: 1 },
                },
            },
        ]);

        // Map unread counts to users
        const unreadMap = {};
        unreadCounts.forEach((item) => {
            unreadMap[item._id.toString()] = item.unreadCount;
        });

        // Attach unread counts to users
        const usersWithUnread = users.map((user) => ({
            ...user,
            unreadCount: unreadMap[user._id.toString()] || 0,
        }));

        res.json(usersWithUnread);
    } catch (error) {
        console.error('Error fetching users for chat:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

/**
 * Get messages between current user and another user
 */
exports.getMessages = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        // Fetch messages between the two users
        const messages = await Message.find({
            $or: [
                { senderId: currentUserId, receiverId: userId, deletedForSender: false },
                { senderId: userId, receiverId: currentUserId, deletedForReceiver: false },
            ],
        })
            .sort({ createdAt: 1 })
            .lean();

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
};

/**
 * Send a message to another user
 */
exports.sendMessage = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { userId } = req.params;
        const { message, attachment, attachmentType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }

        if (!message && !attachment) {
            return res.status(400).json({ message: 'Message or attachment required' });
        }

        const newMessage = await Message.create({
            senderId: currentUserId,
            receiverId: userId,
            message: message || '',
            attachment: attachment || null,
            attachmentType: attachmentType || 'none',
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Failed to send message' });
    }
};

/**
 * Delete a message
 */
exports.deleteMessage = async (req, res) => {
    try {
        const currentUserId = req.user._id;
        const { messageId } = req.params;
        const { deleteForEveryone } = req.body;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ message: 'Invalid message ID' });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user is the sender
        const isSender = message.senderId.toString() === currentUserId.toString();
        const isReceiver = message.receiverId.toString() === currentUserId.toString();

        if (!isSender && !isReceiver) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (deleteForEveryone) {
            // Only sender can delete for everyone
            if (!isSender) {
                return res.status(403).json({ message: 'Only sender can delete for everyone' });
            }

            message.isDeletedForEveryone = true;
            message.message = 'This message was deleted';
            message.attachment = null;
            message.attachmentType = 'none';
        } else {
            // Delete for self only
            if (isSender) {
                message.deletedForSender = true;
            } else {
                message.deletedForReceiver = true;
            }
        }

        await message.save();

        res.json({ message: 'Message deleted successfully', data: message });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ message: 'Failed to delete message' });
    }
};
