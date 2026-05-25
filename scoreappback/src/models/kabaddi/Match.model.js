const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    series: { type: String, default: 'Pro Kabaddi League' },
    venue: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
        default: 'UPCOMING'
    },
    sport: { type: String, enum: ['kabaddi'], default: 'kabaddi' },
    matchType: { type: String, enum: ['League', 'Knockout', 'Friendly'], default: 'League' },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTournament' },
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' },
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
    raidPointsA: { type: Number, default: 0 },
    raidPointsB: { type: Number, default: 0 },
    superTackles: { type: Number, default: 0 },
    allOut: { type: Boolean, default: false },
    scoreByRaid: [{
        raidNumber: Number,
        team: String,
        points: Number,
        player: String,
        reason: String
    }],
    playerStats: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        team: String,
        position: String,
        raidPoints: Number,
        tacklePoints: Number,
        superTackles: Number,
        highFives: Number,
        minutesPlayed: Number
    }],

    period: { type: String, default: 'First Half' },
    statusText: String,
    commentary: [{
        time: String,
        event: String,
        description: String,
        timestamp: { type: Date, default: Date.now }
    }],

    liveStreamUrl: { type: String, default: null },
    youtubeId: { type: String, default: null }, 
    hlsUrl: { type: String, default: null },
    previewVideoUrl: { type: String, default: null },
    recordedVideoUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('KabaddiMatch', matchSchema);
