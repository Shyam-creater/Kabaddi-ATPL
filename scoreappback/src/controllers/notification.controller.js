const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const User = require('../models/User.model');
const { sendPushNotifications } = require('../utils/pushNotifications');

/**
 * Send a notification (Broadcast to all or Targeted to specific users)
 */
exports.createNotification = async (req, res) => {
    try {
        const { title, body, userIds, type, image, contentImage } = req.body;
        const sender = req.user._id;

        // Generate a Group ID for management (Add/Edit/Delete)
        const broadcastId = new mongoose.Types.ObjectId().toString();

        let recipients = [];
        if (type === 'broadcast') {
            const allUsers = await User.find({ status: 'active' }).select('_id pushToken');
            recipients = allUsers;
        } else {
            const targetedUsers = await User.find({ _id: { $in: userIds } }).select('_id pushToken');
            recipients = targetedUsers;
        }

        // 1. Save to Database with broadcastId
        const notificationPromises = recipients.map(u => 
            Notification.create({
                recipient: u._id,
                sender,
                title,
                body,
                image,
                contentImage,
                broadcastId,
                type: type === 'broadcast' ? 'broadcast' : 'targeted'
            })
        );
        await Promise.all(notificationPromises);

        // 2. Extract tokens for Push Notifications
        const tokens = recipients
            .map(u => u.pushToken)
            .filter(token => token && token.trim().length > 0);

        // 3. Send Push Notifications (if tokens exist)
        if (tokens.length > 0) {
            await sendPushNotifications(tokens, title, body, { image, contentImage, type });
        }

        res.status(201).json({ 
            message: `Notification sent successfully.`,
            broadcastId,
            recipientCount: recipients.length
        });

    } catch (error) {
        console.error('Error in createNotification:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get all notifications for ADMIN history
 */
exports.getAdminNotifications = async (req, res) => {
    try {
        // Aggregate to get UNIQUE broadcasts based on broadcastId
        const notifications = await Notification.aggregate([
            { $match: { broadcastId: { $ne: null } } },
            { $sort: { createdAt: -1 } },
            { 
                $group: {
                    _id: "$broadcastId",
                    title: { $first: "$title" },
                    body: { $first: "$body" },
                    image: { $first: "$image" },
                    contentImage: { $first: "$contentImage" },
                    type: { $first: "$type" },
                    createdAt: { $first: "$createdAt" },
                    recipientCount: { $sum: 1 }
                }
            },
            { $sort: { createdAt: -1 } }
        ]);
        res.json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Edit a blast/broadcast notification
 */
exports.updateAdminNotification = async (req, res) => {
    try {
        const { broadcastId } = req.params;
        const { title, body, image, contentImage } = req.body;

        await Notification.updateMany(
            { broadcastId },
            { title, body, image, contentImage }
        );

        res.json({ success: true, message: 'Notification blast updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a blast/broadcast notification
 */
exports.deleteAdminNotification = async (req, res) => {
    try {
        const { broadcastId } = req.params;
        await Notification.deleteMany({ broadcastId });
        res.json({ success: true, message: 'Notification blast purged successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get notifications for the current logged-in user
 */
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Mark notifications as read
 */
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, { read: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a single notification (user personal action)
 */
exports.deleteNotification = async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.notificationId);
        res.json({ success: true, message: 'Notification cleared' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Register Push Token for the current user
 */
exports.registerPushToken = async (req, res) => {
    try {
        const { token } = req.body;
        await User.findByIdAndUpdate(req.user._id, { pushToken: token });
        res.json({ message: 'Push token registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
