const mongoose = require('mongoose');

const kabaddiTournamentSchema = new mongoose.Schema({
    sport: {
        type: String,
        enum: ['kabaddi'],
        default: 'kabaddi'
    },
    name: { type: String, required: true },
    description: { type: String },
    registrationFee: { type: Number, default: 500 },
    qrCodeImage: { type: String },
    upiId: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    banner: { type: String },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' }],
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiMatch' }],
    maxTeams: { type: Number, default: 16 },
    format: { type: String, enum: ['League', 'Knockout', 'Round Robin', 'Friendly'], default: 'League' },
    logo: { type: String },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('KabaddiTournament', kabaddiTournamentSchema);
