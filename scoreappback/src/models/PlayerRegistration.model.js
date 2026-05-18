const mongoose = require('mongoose');

const playerRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tournamentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'tournamentModel'
    },
    tournamentModel: {
        type: String,
        required: true,
        enum: ['CricketTournament', 'FootballTournament', 'KabaddiTournament']
    },
    sport: {
        type: String,
        enum: ['cricket', 'football', 'kabaddi'],
        required: true
    },
    // Snapshot of user details at registration time
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    // Payment
    paymentScreenshot: { type: String, required: true }, // URL
    paymentAmount: { type: Number, default: 500 },

    // Declaration
    agreedToTerms: { type: Boolean, required: true },

    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING'
    },
    createdAt: { type: Date, default: Date.now }
});

// Prevent duplicate registrations for same tournament
playerRegistrationSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });
playerRegistrationSchema.index({ tournamentId: 1 });
playerRegistrationSchema.index({ sport: 1 });

module.exports = mongoose.model('PlayerRegistration', playerRegistrationSchema);
