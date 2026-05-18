const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    title: { type: String, required: true },
    series: { type: String, default: 'Pro Kabaddi League' },
    venue: { type: String, required: true }, // For location filtering
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['UPCOMING', 'LIVE', 'COMPLETED', 'ABANDONED'],
        default: 'UPCOMING'
    },
    sport: { type: String, default: 'kabaddi' },

    // Teams
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

    // Scores
    scoreA: { type: Number, default: 0 },
    scoreB: { type: Number, default: 0 },

    // Context
    period: { type: String, default: 'First Half' }, // First Half, Second Half
    statusText: String,

    // Video URLs (context-aware per status)
    liveStreamUrl: { type: String, default: null },
    youtubeId: { type: String, default: null }, 
    hlsUrl: { type: String, default: null },
    previewVideoUrl: { type: String, default: null },
    recordedVideoUrl: { type: String, default: null },

}, { timestamps: true });

module.exports = mongoose.model('KabaddiMatch', matchSchema);
