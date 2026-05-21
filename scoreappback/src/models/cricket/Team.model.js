const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    sport: {
        type: String,
        enum: ['cricket'],
        default: 'cricket'
    },
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        unique: true,
        maxLength: 4
    },
    logo: {
        type: String,
        default: 'https://via.placeholder.com/150'
    },
    city: String,
    captain: {
        type: String,
        default: 'TBA'
    },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    coach: String,

    matchesPlayed: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    draw: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    nrr: { type: Number, default: 0.0 },

    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String, // Batsman, Bowler, All-rounder, WK
        position: String,
        jerseyNumber: Number,
        isCaptain: { type: Boolean, default: false },
        image: String
    }],
    playerCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
