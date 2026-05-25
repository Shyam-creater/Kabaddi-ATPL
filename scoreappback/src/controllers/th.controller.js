const User = require('../models/User.model');
const CricketTournament = require('../models/cricket/Tournament.model');
const KabaddiTournament = require('../models/kabaddi/Tournament.model');
const FootballTournament = require('../models/football/Tournament.model');
const PlayerRegistration = require('../models/PlayerRegistration.model');

// Cricket Models
const CricketTeam = require('../models/cricket/Team.model');
const CricketMatch = require('../models/cricket/Match.model');

// Kabaddi Models
const KabaddiTeam = require('../models/kabaddi/Team.model');
const KabaddiMatch = require('../models/kabaddi/Match.model');

// Football Models
const FootballTeam = require('../models/football/Team.model');
const FootballMatch = require('../models/football/Match.model');

const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get TH Dashboard Stats
// @route   GET /api/th/dashboard
// @access  Private/TH
exports.getTHDashboardStats = async (req, res, next) => {
    try {
        const createdBy = req.user._id;

        // 1. Tournaments created by this TH
        const [cricketTournaments, footballTournaments, kabaddiTournaments] = await Promise.all([
            CricketTournament.find({ createdBy }).select('_id').lean(),
            FootballTournament.find({ createdBy }).select('_id').lean(),
            KabaddiTournament.find({ createdBy }).select('_id').lean()
        ]);

        const cricketLeagues = cricketTournaments.length;
        const footballLeagues = footballTournaments.length;
        const kabaddiLeagues = kabaddiTournaments.length;

        const cricketTournamentIds = cricketTournaments.map(t => t._id);
        const footballTournamentIds = footballTournaments.map(t => t._id);
        const kabaddiTournamentIds = kabaddiTournaments.map(t => t._id);
        const allTournamentIds = [...cricketTournamentIds, ...footballTournamentIds, ...kabaddiTournamentIds];

        // 2. Teams created by this TH
        const [cricketTeamsCount, footballTeamsCount, kabaddiTeamsCount] = await Promise.all([
            CricketTeam.countDocuments({ createdBy }),
            FootballTeam.countDocuments({ createdBy }),
            KabaddiTeam.countDocuments({ createdBy })
        ]);

        // 3. Active matches created by this TH (status: 'LIVE')
        const [cricketActiveMatches, footballActiveMatches, kabaddiActiveMatches] = await Promise.all([
            CricketMatch.countDocuments({ createdBy, status: 'LIVE' }),
            FootballMatch.countDocuments({ createdBy, status: 'LIVE' }),
            KabaddiMatch.countDocuments({ createdBy, status: 'LIVE' })
        ]);

        // 4. Player count via PlayerRegistration under this TH's tournaments
        const [cricketPlayersCount, footballPlayersCount, kabaddiPlayersCount] = await Promise.all([
            PlayerRegistration.countDocuments({ sport: 'cricket', tournamentId: { $in: cricketTournamentIds } }),
            PlayerRegistration.countDocuments({ sport: 'football', tournamentId: { $in: footballTournamentIds } }),
            PlayerRegistration.countDocuments({ sport: 'kabaddi', tournamentId: { $in: kabaddiTournamentIds } })
        ]);

        // 5. Users (Scorers created by TH and players registered to this TH's tournaments)
        // Retrieve scorer user profiles created by this TH
        const scorers = await User.find({ role: 'scorer', createdBy })
            .select('name email role gender createdAt')
            .lean();

        // Retrieve player registrations to get the userIds
        const registrations = await PlayerRegistration.find({ tournamentId: { $in: allTournamentIds } })
            .select('userId')
            .lean();
        const playerUserIds = [...new Set(registrations.filter(r => r.userId).map(r => r.userId.toString()))];

        // Retrieve players profiles who registered
        const players = await User.find({ _id: { $in: playerUserIds } })
            .select('name email role gender createdAt')
            .lean();

        const allTHUsers = [...scorers, ...players];

        // Unique user counts and demographics
        const totalUsers = allTHUsers.length;
        const maleUsers = allTHUsers.filter(u => u.gender === 'Male').length;
        const femaleUsers = allTHUsers.filter(u => u.gender === 'Female').length;

        // Sort by createdAt desc to get recent acquisitions
        const recentUsers = allTHUsers
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        // Standardized payload format matching exports.getDashboardStats in admin.controller.js
        res.status(200).json(ApiResponse.success('TH Dashboard stats fetched', {
            users: {
                total: totalUsers,
                male: maleUsers,
                female: femaleUsers,
                recent: recentUsers
            },
            counts: {
                tournaments: cricketLeagues + footballLeagues + kabaddiLeagues,
                teams: cricketTeamsCount + footballTeamsCount + kabaddiTeamsCount,
                activeMatches: cricketActiveMatches + footballActiveMatches + kabaddiActiveMatches,
                players: cricketPlayersCount + footballPlayersCount + kabaddiPlayersCount
            },
            categories: {
                cricket: {
                    tournaments: cricketLeagues,
                    teams: cricketTeamsCount,
                    activeMatches: cricketActiveMatches,
                    players: cricketPlayersCount
                },
                kabaddi: {
                    tournaments: kabaddiLeagues,
                    teams: kabaddiTeamsCount,
                    activeMatches: kabaddiActiveMatches,
                    players: kabaddiPlayersCount
                },
                football: {
                    tournaments: footballLeagues,
                    teams: footballTeamsCount,
                    activeMatches: footballActiveMatches,
                    players: footballPlayersCount
                }
            }
        }));
    } catch (error) {
        next(error);
    }
};

// @desc    Get all leagues created by this TH
// @route   GET /api/th/leagues
// @access  Private/TH
exports.getMyLeagues = async (req, res, next) => {
    try {
        const createdBy = req.user._id;

        const cricket = await CricketTournament.find({ createdBy }).sort('-createdAt');
        const football = await FootballTournament.find({ createdBy }).sort('-createdAt');
        const kabaddi = await KabaddiTournament.find({ createdBy }).sort('-createdAt');

        res.status(200).json(ApiResponse.success('Leagues fetched successfully', {
            cricket,
            football,
            kabaddi
        }));
    } catch (error) {
        next(error);
    }
};

// @desc    Get all Scorer accounts
// @route   GET /api/th/scorers
// @access  Private/TH/Admin
exports.getScorers = async (req, res, next) => {
    try {
        let query = { role: 'scorer' };
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.createdBy = req.user._id;
        }
        const scorers = await User.find(query).select('-password').sort('-createdAt');
        res.status(200).json(ApiResponse.success('Scorers fetched successfully', scorers));
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new Scorer account under this TH
// @route   POST /api/th/scorers
// @access  Private/TH/Admin
exports.createScorer = async (req, res, next) => {
    try {
        const { name, email, phone, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return next(new ApiError(400, 'Email already registered'));

        const user = await User.create({
            name,
            email,
            phone,
            password,
            role: 'scorer',
            status: 'pending',
            createdBy: req.user._id
        });

        res.status(201).json(ApiResponse.success('Scorer account created successfully', user));
    } catch (error) {
        next(error);
    }
};

// @desc    Update scorer status (approve/reject/suspend)
// @route   PUT /api/th/scorers/:id/status
// @access  Private/TH/Admin
exports.updateScorerStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'pending', 'suspended'].includes(status)) {
            return next(new ApiError(400, 'Invalid status'));
        }

        const query = { _id: req.params.id, role: 'scorer' };
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.createdBy = req.user._id;
        }

        const scorer = await User.findOneAndUpdate(
            query,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!scorer) {
            return next(new ApiError(404, 'Scorer not found or not owned by your TH account'));
        }

        res.status(200).json(ApiResponse.success('Scorer status updated successfully', scorer));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete scorer account
// @route   DELETE /api/th/scorers/:id
// @access  Private/TH/Admin
exports.deleteScorer = async (req, res, next) => {
    try {
        const query = { _id: req.params.id, role: 'scorer' };
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.createdBy = req.user._id;
        }

        const scorer = await User.findOneAndDelete(query);
        if (!scorer) {
            return next(new ApiError(404, 'Scorer not found or not owned by your TH account'));
        }
        res.status(200).json(ApiResponse.success('Scorer deleted successfully'));
    } catch (error) {
        next(error);
    }
};
