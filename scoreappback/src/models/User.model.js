const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['player', 'admin', 'scorer'], default: 'player' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    profilePicture: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },

    // Basic Info
    phone: { type: String },
    city: { type: String },
    address: { type: String },
    dob: { type: Date },
    sports: [{ type: String }], // Array of strings for selected sports
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Follow System
    followers: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
    }],
    following: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
    }],
    lastSeen: { type: Date, default: Date.now },

    // Detailed Player Profile
    playerProfile: {
        cricket: {
            // BASIC INFO
            name: String, // Added as per user request, though generic name exists in root
            nickname: String,
            role: String, // Batsman, Bowler, All-rounder, WK
            battingStyle: String,
            bowlingStyle: String,
            jerseyNumber: Number,
            country: String,
            state: String,
            currentTeam: String,

            // OVERALL CAREER SUMMARY
            careerSummary: {
                totalMatches: Number,
                totalRuns: Number,
                totalWickets: Number,
                highestScore: Number,
                battingAverage: Number,
                strikeRate: Number,
                economyRate: Number,
                centuries: Number,
                halfCenturies: Number
            },

            // FORMAT WISE STATS (Self entered)
            formatStats: [{
                format: String, // Test / ODI / T20 / T10
                matches: Number,
                innings: Number,
                runs: Number,
                highestScore: Number,
                average: Number,
                strikeRate: Number,
                wickets: Number,
                economy: Number
            }],

            // LEAGUE / TOURNAMENT HISTORY
            leagueHistory: [{
                leagueName: String, // IPL, TNPL, Ranji
                teamName: String,
                season: String, // 2022, 2023
                matches: Number,
                runs: Number,
                highestScore: Number,
                strikeRate: Number,
                wickets: Number,
                economy: Number
            }],

            // ACHIEVEMENTS
            achievements: [{
                title: String, // Orange Cap
                year: String,
                description: String
            }]
        },
        kabaddi: {
            // 1. Basic Player Info
            age: Number,
            height: String,
            weight: String,
            state: String,
            country: String,
            role: String, // Raider, Defender, All-Rounder
            playingPosition: String, // Left Raider, Right Corner, Cover, etc.
            currentTeam: String,
            jerseyNumber: Number,
            experienceYears: Number,

            // 2. Career Overview
            careerSummary: {
                matchesPlayed: Number,
                totalPoints: Number,
                averagePointsPerMatch: Number,
                bestMatchPoints: Number,
                totalWins: Number,
                totalLosses: Number
            },

            // 3. Raiding Career Stats
            raidingStats: {
                totalRaidAttempts: Number,
                totalSuccessfulRaids: Number,
                raidSuccessRate: Number, // %
                totalRaidPoints: Number,
                averageRaidPointsPerMatch: Number,
                emptyRaids: Number,
                bonusPoints: Number,
                superRaids: Number,
                super10s: Number,
                doOrDieRaidPoints: Number
            },

            // 4. Defensive Career Stats
            defenseStats: {
                totalTackleAttempts: Number,
                totalSuccessfulTackles: Number,
                tackleSuccessRate: Number, // %
                totalTacklePoints: Number,
                averageTacklePointsPerMatch: Number,
                superTackles: Number,
                high5s: Number,
                ankleHolds: Number,
                thighHolds: Number,
                blocks: Number,
                dashes: Number
            },

            // 5. Performance Records
            records: {
                mostRaidPointsInMatch: Number,
                mostTacklePointsInMatch: Number,
                longestRaidStreak: Number,
                bestSeasonRaidPoints: Number,
                bestSeasonTacklePoints: Number
            },

            // 6. Discipline History
            discipline: {
                greenCards: Number,
                yellowCards: Number,
                redCards: Number,
                suspensions: Number
            },

            // 7. Achievement History
            achievementStats: {
                mvpAwards: Number,
                bestRaiderAwards: Number,
                bestDefenderAwards: Number,
                allRounderAwards: Number,
                teamTitlesWon: Number
            },

            // 8. Fitness & Status
            fitness: {
                injuries: String,
                fitnessStatus: { type: String, enum: ['Fit', 'Recovering', 'Injured'], default: 'Fit' },
                lastMatchPlayedDate: Date
            }
        }
    },

    // Total matches played (aggregated)
    totalMatches: { type: Number, default: 0 },
    pushToken: { type: String, default: '' }, // Store Expo Push Token

    createdAt: { type: Date, default: Date.now }
});

// Virtual: Calculate profile completion percentage
userSchema.virtual('profileProgress').get(function () {
    let filledFields = 0;
    let totalFields = 10; // Total fields we're checking

    // Check basic fields
    if (this.name) filledFields++;
    if (this.email) filledFields++;
    if (this.phone) filledFields++;
    if (this.city) filledFields++;
    if (this.address) filledFields++;
    if (this.dob) filledFields++;
    if (this.gender) filledFields++;
    if (this.profilePicture) filledFields++;
    if (this.sports && this.sports.length > 0) filledFields++;

    // Check if player profile has basic info
    if (this.playerProfile) {
        if (this.playerProfile.cricket && this.playerProfile.cricket.role) filledFields++;
    }

    return Math.round((filledFields / totalFields) * 100);
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Password hash before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Password compare
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
