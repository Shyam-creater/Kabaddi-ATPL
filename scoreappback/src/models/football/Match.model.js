const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    series: { type: String, default: 'City Football Cup' },
    venue: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
        default: 'UPCOMING'
    },
    sport: { type: String, enum: ['football'], default: 'football' },
    matchType: { type: String, enum: ['League', 'Knockout', 'Friendly'], default: 'League' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTournament' },
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' },

    teamA: {
        name: { type: String, required: true },
        code: { type: String, required: true },
        logo: String,
    },
    teamB: {
        name: { type: String, required: true },
        code: { type: String, required: true },
        logo: String,
    },
    teamAPlayers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        position: String,
        role: String,
        jerseyNumber: Number,
        image: String
    }],
    teamBPlayers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        position: String,
        role: String,
        jerseyNumber: Number,
        image: String
    }],
    assignedScorer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },

    goalScorers: [{
        player: String,
        minute: Number,
        type: String,
        team: String
    }],
    possession: {
        teamA: { type: Number, default: 0 },
        teamB: { type: Number, default: 0 }
    },
    yellowCards: { type: Number, default: 0 },
    redCards: { type: Number, default: 0 },
    injuries: String,

    half: { type: String, default: '1st Half' },
    time: { type: String, default: '00:00' },
    playerStats: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        team: String,
        position: String,
        goals: Number,
        assists: Number,
        yellowCards: Number,
        redCards: Number,
        minutesPlayed: Number
    }],
    statusText: String,

    liveStreamUrl: { type: String, default: null },
    youtubeId: { type: String, default: null }, 
    hlsUrl: { type: String, default: null },
    previewVideoUrl: { type: String, default: null },
    recordedVideoUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FootballMatch', matchSchema);
