const mongoose = require('mongoose');

const kabaddiTournamentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }, // Short league description (1-2 lines)
    registrationFee: { type: Number, default: 500 },
    qrCodeImage: { type: String },  // Payment QR code image URL
    upiId: { type: String },        // UPI ID for payment
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String },
    banner: { type: String },
    status: { type: String, enum: ['UPCOMING', 'ONGOING', 'COMPLETED'], default: 'UPCOMING' },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' }], // Assuming KabaddiTeam model exists
    logo: { type: String },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'KabaddiTeam' }
}, { timestamps: true });

module.exports = mongoose.model('KabaddiTournament', kabaddiTournamentSchema);
