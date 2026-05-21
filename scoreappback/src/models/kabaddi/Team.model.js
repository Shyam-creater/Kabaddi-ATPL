const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    sport: {
        type: String,
        enum: ['kabaddi'],
        default: 'kabaddi'
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

    // Stats
    matchesPlayed: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    draw: { type: Number, default: 0 },
    points: { type: Number, default: 0 },

    // Kabaddi specific
    scoreDiff: { type: Number, default: 0 },

    players: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        position: String, // Raider, Defender, All-Rounder
        role: String,
        number: Number,
        isCaptain: { type: Boolean, default: false },
        image: String
    }],
    playerCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('KabaddiTeam', teamSchema);