const User = require('../models/User.model');
const Player = require('../models/cricket/Player.model');

// Cricket Models
const CricketTournament = require('../models/cricket/Tournament.model');
const CricketTeam = require('../models/cricket/Team.model');
const CricketMatch = require('../models/cricket/Match.model');

// Kabaddi Models
const KabaddiTournament = require('../models/kabaddi/Tournament.model');
const KabaddiTeam = require('../models/kabaddi/Team.model');
const KabaddiMatch = require('../models/kabaddi/Match.model');

// Football Models
const FootballTournament = require('../models/football/Tournament.model');
const FootballTeam = require('../models/football/Team.model');
const FootballMatch = require('../models/football/Match.model');

const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        // User Counts - EXCLUDING ADMINS for pure player metrics
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
        const maleUsers = await User.countDocuments({ gender: 'Male', role: { $ne: 'admin' } });
        const femaleUsers = await User.countDocuments({ gender: 'Female', role: { $ne: 'admin' } });

        // Category Stats: Cricket
        const cricketStats = {
            tournaments: await CricketTournament.countDocuments(),
            teams: await CricketTeam.countDocuments(),
            activeMatches: await CricketMatch.countDocuments({ status: 'LIVE' }),
            players: await Player.countDocuments({ sport: 'Cricket' })
        };

        // Category Stats: Kabaddi
        const kabaddiStats = {
            tournaments: await KabaddiTournament.countDocuments(),
            teams: await KabaddiTeam.countDocuments(),
            activeMatches: await KabaddiMatch.countDocuments({ status: 'LIVE' }),
            players: await Player.countDocuments({ sport: 'Kabaddi' })
        };

        // Category Stats: Football
        const footballStats = {
            tournaments: await FootballTournament.countDocuments(),
            teams: await FootballTeam.countDocuments(),
            activeMatches: await FootballMatch.countDocuments({ status: 'LIVE' }),
            players: await Player.countDocuments({ sport: 'Football' })
        };

        // Aggregates
        const totalTournaments = cricketStats.tournaments + kabaddiStats.tournaments + footballStats.tournaments;
        const totalTeams = cricketStats.teams + kabaddiStats.teams + footballStats.teams;
        const totalActiveMatches = cricketStats.activeMatches + kabaddiStats.activeMatches + footballStats.activeMatches;

        const totalPlayers = await Player.countDocuments();

        // Recent Users - EXCLUDING ADMINS
        const recentUsers = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 }).limit(5);

        res.status(200).json(ApiResponse.success('Dashboard stats fetched', {
            users: {
                total: totalUsers,
                male: maleUsers,
                female: femaleUsers,
                recent: recentUsers
            },
            counts: {
                tournaments: totalTournaments,
                teams: totalTeams,
                activeMatches: totalActiveMatches,
                players: totalPlayers
            },
            categories: {
                cricket: cricketStats,
                kabaddi: kabaddiStats,
                football: footballStats
            }
        }));
    } catch (error) {
        next(error);
    }
};

// @desc    Get All Users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        // Allow optional inclusion of admins if needed via query, but default to EXCLUDE for "player" listing
        const { includeAdmins } = req.query;
        let query = {};
        if (includeAdmins !== 'true') {
            query.role = { $ne: 'admin' };
        }

        const users = await User.find(query).select('-password').sort('-createdAt');
        res.status(200).json(ApiResponse.success('Users fetched', users));
    } catch (error) {
        next(error);
    }
};

// @desc    Update User Role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        res.status(200).json(ApiResponse.success(`User role updated to ${role}`, user));
    } catch (error) {
        next(error);
    }
};

// @desc    Update User Status (Suspend/Activate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended', 'pending'].includes(status)) {
            return next(new ApiError(400, 'Invalid status'));
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        res.status(200).json(ApiResponse.success(`User status updated to ${status}`, user));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return next(new ApiError(404, 'User not found'));
        }

        res.status(200).json(ApiResponse.success('User deleted successfully'));
    } catch (error) {
        next(error);
    }
};
