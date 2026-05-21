const mongoose = require('mongoose');

const footballTournamentSchema = new mongoose.Schema({
    sport: {
        type: String,
        enum: ['football'],
        default: 'football'
    },
    name: { type: String, required: true },
    description: { type: String },
    registrationFee: { type: Number, default: 500 },
    qrCodeImage: { type: String },
    upiId: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FootballMatch' }],
    maxTeams: { type: Number, default: 16 },
    format: { type: String, enum: ['League', 'Knockout', 'Round Robin', 'Friendly'], default: 'League' },
    logo: { type: String },
    banner: { type: String },
    rules: { type: String },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('FootballTournament', footballTournamentSchema);
