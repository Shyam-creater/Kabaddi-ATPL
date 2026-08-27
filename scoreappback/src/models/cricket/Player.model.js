const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        required: true
    },
    battingStyle: String, // Right Handed Bat
    bowlingStyle: String, // Right Arm Fast
    image: String, // Base64 or URL
    sport: {
        type: String,
        enum: ['Cricket', 'Kabaddi', 'Football'],
        default: 'Cricket'
    },
    category: {
        type: String,
        default: 'A'
    },

    // Auction Info
    isAuctionPlayer: { type: Boolean, default: true },
    auctionStatus: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'SOLD', 'UNSOLD'],
        default: 'UPCOMING'
    },
    basePrice: { type: Number, default: 0 },
    soldPrice: { type: Number, default: 0 },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },

    // Stats (Optional for now)
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    average: { type: Number, default: 0.0 }

}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
