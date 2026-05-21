const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    series: {
        type: String,
        default: 'TPL Premier League'
    },
    venue: String,
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
        default: 'UPCOMING'
    },
    sport: {
        type: String,
        enum: ['cricket'],
        default: 'cricket'
    },
    matchType: {
        type: String,
        enum: ['League', 'Knockout', 'Friendly'],
        default: 'League'
    },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CricketTournament' },
    teamAId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    teamBId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
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
        role: String,
        position: String,
        jerseyNumber: Number,
        image: String
    }],
    teamBPlayers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        role: String,
        position: String,
        jerseyNumber: Number,
        image: String
    }],
    assignedScorer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scoreA: { type: mongoose.Schema.Types.Mixed, default: { runs: 0, wickets: 0, overs: 0 } },
    scoreB: { type: mongoose.Schema.Types.Mixed, default: { runs: 0, wickets: 0, overs: 0 } },
    target: Number,
    battingLineup: [{
        name: String,
        position: String,
        runs: Number,
        balls: Number,
        status: String
    }],
    bowlingLineup: [{
        name: String,
        overs: Number,
        maidens: Number,
        runs: Number,
        wickets: Number
    }],
    currentBatters: [
        { name: String, runs: Number, balls: Number, isStriker: Boolean }
    ],
    currentBowler: {
        name: String,
        overs: Number,
        maidens: Number,
        runs: Number,
        wickets: Number
    },
    playerStats: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        team: String,
        role: String,
        runs: Number,
        wickets: Number,
        catches: Number,
        runOuts: Number,
        overs: Number
    }],
    statusText: String,
    winner: { type: String, default: null },
    liveStreamUrl: { type: String, default: null },
    youtubeId: { type: String, default: null },
    hlsUrl: { type: String, default: null },
    previewVideoUrl: { type: String, default: null },
    recordedVideoUrl: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('CricketMatch', matchSchema);
