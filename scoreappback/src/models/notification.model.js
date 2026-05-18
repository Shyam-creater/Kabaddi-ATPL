const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: false // If null, it's a broadcast to all
    },
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    image: { type: String, default: null }, // Logo icon (left)
    contentImage: { type: String, default: null }, // Medium image (right)
    type: { 
        type: String, 
        enum: ['broadcast', 'targeted', 'follow_request', 'follow_accepted', 'system'], 
        default: 'system' 
    },
    data: { type: Object, default: {} },
    broadcastId: { type: String, default: null },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

notificationSchema.index({ recipient: 1 });
notificationSchema.index({ broadcastId: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
