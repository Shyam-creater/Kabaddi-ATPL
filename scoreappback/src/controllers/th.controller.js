const User = require('../models/User.model');
const CricketTournament = require('../models/cricket/Tournament.model');
const KabaddiTournament = require('../models/kabaddi/Tournament.model');
const FootballTournament = require('../models/football/Tournament.model');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get TH Dashboard Stats
// @route   GET /api/th/dashboard
// @access  Private/TH
exports.getTHDashboardStats = async (req, res, next) => {
    try {
        const createdBy = req.user._id;

        // Count tournaments created by this TH
        const cricketLeagues = await CricketTournament.countDocuments({ createdBy });
        const footballLeagues = await FootballTournament.countDocuments({ createdBy });
        const kabaddiLeagues = await KabaddiTournament.countDocuments({ createdBy });

        res.status(200).json(ApiResponse.success('TH Dashboard stats fetched', {
            stats: {
                totalLeagues: cricketLeagues + footballLeagues + kabaddiLeagues,
                cricketLeagues,
                footballLeagues,
                kabaddiLeagues
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

// @desc    Get all Scorer accounts created by this TH
// @route   GET /api/th/scorers
// @access  Private/TH
exports.getScorers = async (req, res, next) => {
    try {
        const scorers = await User.find({ role: 'scorer', createdBy: req.user._id }).select('-password').sort('-createdAt');
        res.status(200).json(ApiResponse.success('Scorers fetched successfully', scorers));
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new Scorer account under this TH
// @route   POST /api/th/scorers
// @access  Private/TH
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
// @access  Private/TH
exports.updateScorerStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'pending', 'suspended'].includes(status)) {
            return next(new ApiError(400, 'Invalid status'));
        }

        const scorer = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'scorer', createdBy: req.user._id },
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

// @desc    Delete scorer account created by this TH
// @route   DELETE /api/th/scorers/:id
// @access  Private/TH
exports.deleteScorer = async (req, res, next) => {
    try {
        const scorer = await User.findOneAndDelete({ _id: req.params.id, role: 'scorer', createdBy: req.user._id });
        if (!scorer) {
            return next(new ApiError(404, 'Scorer not found or not owned by your TH account'));
        }
        res.status(200).json(ApiResponse.success('Scorer deleted successfully'));
    } catch (error) {
        next(error);
    }
};
