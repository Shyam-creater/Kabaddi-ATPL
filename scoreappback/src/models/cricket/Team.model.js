const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
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
        unique: true, // e.g. CSK
        maxLength: 4
    },
    logo: {
        type: String, // URL
        default: 'https://via.placeholder.com/150'
    },
    city: String,
    captain: {
        type: String,
        default: 'TBA'
    },
    coach: String,

    // Stats
    matchesPlayed: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    draw: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    nrr: { type: Number, default: 0.0 }, // Net Run Rate

    // Players (Simple array of strings or Object IDs if we had Player model)
    // For simplicity now, let's keep array of objects
    players: [{
        name: String,
        role: String, // Batsman, Bowler, All-rounder
        image: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
