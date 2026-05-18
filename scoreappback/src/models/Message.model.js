const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
        },
        read: {
            type: Boolean,
            default: false,
        },
        attachment: {
            type: String,
            default: null,
        },
        attachmentType: {
            type: String,
            enum: ['image', 'video', 'file', 'none'],
            default: 'none',
        },
        deletedForSender: {
            type: Boolean,
            default: false,
        },
        deletedForReceiver: {
            type: Boolean,
            default: false,
        },
        isDeletedForEveryone: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes for performance optimization
// Compound index for fetching messages between two users sorted by time
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });

// Index for unread message counts
messageSchema.index({ receiverId: 1, read: 1 });

module.exports = mongoose.model('Message', messageSchema);
