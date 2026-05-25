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
    scoreA: { type: mongoose.Schema.Types.Mixed, default: { runs: 0, wickets: 0, overs: 0, extras: 0, wides: 0, noballs: 0, byes: 0, legbyes: 0 } },
    scoreB: { type: mongoose.Schema.Types.Mixed, default: { runs: 0, wickets: 0, overs: 0, extras: 0, wides: 0, noballs: 0, byes: 0, legbyes: 0 } },
    target: Number,
    tossWinner: String,
    tossDecision: String,
    oversLimit: { type: Number, default: 20 },
    battingLineup: [{
        name: String,
        position: String,
        runs: { type: Number, default: 0 },
        balls: { type: Number, default: 0 },
        fours: { type: Number, default: 0 },
        sixes: { type: Number, default: 0 },
        status: { type: String, default: 'Yet to Bat' },
        dismissal: String
    }],
    bowlingLineup: [{
        name: String,
        overs: { type: Number, default: 0 },
        maidens: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noballs: { type: Number, default: 0 }
    }],
    currentBatters: [
        { name: String, runs: { type: Number, default: 0 }, balls: { type: Number, default: 0 }, fours: { type: Number, default: 0 }, sixes: { type: Number, default: 0 }, isStriker: Boolean }
    ],
    currentBowler: {
        name: String,
        overs: { type: Number, default: 0 },
        maidens: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        wides: { type: Number, default: 0 },
        noballs: { type: Number, default: 0 }
    },
    commentary: [{
        over: Number,
        ball: Number,
        runs: Number,
        event: String,
        description: String,
        timestamp: { type: Date, default: Date.now }
    }],
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
