const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true, // e.g., "Asia Cup Final"
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
        default: 'cricket',
        enum: ['cricket', 'football', 'kabaddi']
    },
    // Teams
    teamA: {
        name: { type: String, required: true },
        code: { type: String, required: true }, // e.g. "IND"
        logo: String,
    },
    teamB: {
        name: { type: String, required: true },
        code: { type: String, required: true }, // e.g. "PAK"
        logo: String,
    },

    // Scores (Mixed to support {runs, wickets} OR simple Number)
    scoreA: { type: mongoose.Schema.Types.Mixed, default: 0 },
    scoreB: { type: mongoose.Schema.Types.Mixed, default: 0 },

    // Match Context
    target: Number,
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
    statusText: String, // "India need 33 runs in 34 balls"

    // Result
    winner: { type: String, default: null }, // Team Code or 'DRAW'

    // Video URLs (context-aware per status)
    liveStreamUrl: { type: String, default: null }, // Used when status = LIVE
    youtubeId: { type: String, default: null }, // YouTube Video/Stream ID
    hlsUrl: { type: String, default: null }, // HLS Stream URL (.m3u8)
    previewVideoUrl: { type: String, default: null }, // Used when status = UPCOMING
    recordedVideoUrl: { type: String, default: null }, // Used when status = COMPLETED

}, { timestamps: true });

module.exports = mongoose.model('CricketMatch', matchSchema);
