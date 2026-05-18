const mongoose = require('mongoose');

const lookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lookingFor: {
        type: String, // 'Team' or 'Player'
        required: true,
        enum: ['Team', 'Player']
    },
    location: {
        type: String,
        required: true
    },
    ground: {
        type: String,
        required: true
    },

    type: {
        type: String,
        required: true
    },
    matchDate: {
        type: Date,
        required: true
    },

    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Looking', lookingSchema);
