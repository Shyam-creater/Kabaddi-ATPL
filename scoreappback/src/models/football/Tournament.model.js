const mongoose = require('mongoose');

const footballTournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }, // Short league description (1-2 lines)
    registrationFee: { type: Number, default: 500 },
    qrCodeImage: { type: String },  // Payment QR code image URL
    upiId: { type: String },        // UPI ID for payment
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' }], // Assuming FootballTeam model exists
    logo: { type: String },
    banner: { type: String }, // 1200x740 League Banner
    format: { type: String, default: 'League' }, // League, Knockout
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'FootballTeam' }
}, { timestamps: true });

module.exports = mongoose.model('FootballTournament', footballTournamentSchema);
