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
    coach: String,

    // Stats
    matchesPlayed: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    draw: { type: Number, default: 0 },
    points: { type: Number, default: 0 },

    // Football specific
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },

    players: [{
        name: String,
        position: String, // Forward, Midfielder, Defender, Goalkeeper
        number: Number,
        image: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('FootballTeam', teamSchema);