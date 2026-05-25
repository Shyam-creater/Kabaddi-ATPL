const User = require('../models/User.model');
const Player = require('../models/cricket/Player.model');
const PlayerRegistration = require('../models/PlayerRegistration.model');

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
        let userRoles = ['player', 'scorer'];
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            userRoles.push('TH');
        }

        const totalUsers = await User.countDocuments({ role: { $in: userRoles } });
        const maleUsers = await User.countDocuments({ gender: 'Male', role: { $in: userRoles } });
        const femaleUsers = await User.countDocuments({ gender: 'Female', role: { $in: userRoles } });

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

        // Recent Users - FILTERED BY ROLE VISIBILITY
        const recentUsers = await User.find({ role: { $in: userRoles } }).select('-password').sort({ createdAt: -1 }).limit(5);

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
        const { includeAdmins } = req.query;
        let query = {};
        
        if (req.user.role === 'TH') {
            const createdBy = req.user._id;

            // 1. Tournaments created by this TH
            const [cricketTournaments, footballTournaments, kabaddiTournaments] = await Promise.all([
                CricketTournament.find({ createdBy }).select('_id').lean(),
                FootballTournament.find({ createdBy }).select('_id').lean(),
                KabaddiTournament.find({ createdBy }).select('_id').lean()
            ]);

            const allTournamentIds = [
                ...cricketTournaments.map(t => t._id),
                ...footballTournaments.map(t => t._id),
                ...kabaddiTournaments.map(t => t._id)
            ];

            // 2. Retrieve player registrations to get the userIds
            const registrations = await PlayerRegistration.find({ tournamentId: { $in: allTournamentIds } })
                .select('userId')
                .lean();
            const playerUserIds = registrations.filter(r => r.userId).map(r => r.userId);

            // 3. Combined query for scorers created by TH and players registered
            query = {
                $or: [
                    { _id: { $in: playerUserIds } },
                    { role: 'scorer', createdBy: createdBy }
                ]
            };
        } else if (req.user.role === 'super_admin') {
            // Super Admin: gets players/scorers. If includeAdmins is true, also gets sub-admins (role: 'admin') and THs
            if (includeAdmins === 'true') {
                query.role = { $in: ['admin', 'player', 'scorer', 'TH'] };
            } else {
                query.role = { $in: ['player', 'scorer'] };
            }
        } else {
            // Sub-Admin (role === 'admin')
            if (includeAdmins === 'true') {
                query.role = { $in: ['player', 'scorer', 'TH'] }; // Sub admin handles players, scorers, and THs
            } else {
                query.role = { $in: ['player', 'scorer'] };
            }
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
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return next(new ApiError(404, 'User not found'));
        }

        // Sub-admin role limits
        if (req.user.role === 'admin') {
            if (userToDelete.role !== 'player' && userToDelete.role !== 'scorer' && userToDelete.role !== 'TH') {
                return next(new ApiError(403, 'Sub-admins can only delete players, scorers, or TH accounts'));
            }
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json(ApiResponse.success('User deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// @desc    Update TH League Limit
// @route   PUT /api/admin/th-accounts/:id/limit
// @access  Private/Admin
exports.updateTHLeagueLimit = async (req, res, next) => {
    try {
        const { leagueLimit } = req.body;
        if (typeof leagueLimit !== 'number' || leagueLimit < 1) {
            return next(new ApiError(400, 'League limit must be a positive number'));
        }

        const user = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'TH' },
            { leagueLimit },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return next(new ApiError(404, 'Tournament Head not found'));
        }

        res.status(200).json(ApiResponse.success('League limit updated successfully', user));
    } catch (error) {
        next(error);
    }
};

// @desc    Get All TH Accounts
// @route   GET /api/admin/th-accounts
// @access  Private/Admin
exports.getAllTHAccounts = async (req, res, next) => {
    try {
        const thAccounts = await User.find({ role: 'TH' }).select('-password').sort('-createdAt');
        res.status(200).json(ApiResponse.success('TH accounts fetched successfully', thAccounts));
    } catch (error) {
        next(error);
    }
};

// @desc    Get Detailed stats for a specific TH
// @route   GET /api/admin/th-details/:id
// @access  Private/Admin
exports.getTHDetails = async (req, res, next) => {
    try {
        const thUser = await User.findOne({ _id: req.params.id, role: 'TH' }).select('-password');
        if (!thUser) {
            return next(new ApiError(404, 'Tournament Head not found'));
        }

        // Aggregate their specific leagues
        const [cricketL, footballL, kabaddiL] = await Promise.all([
            CricketTournament.find({ createdBy: thUser._id }).select('name sport status startDate endDate').lean(),
            FootballTournament.find({ createdBy: thUser._id }).select('name sport status startDate endDate').lean(),
            KabaddiTournament.find({ createdBy: thUser._id }).select('name sport status startDate endDate').lean()
        ]);
        const leagues = [
            ...cricketL.map(l => ({ ...l, sport: 'cricket' })),
            ...footballL.map(l => ({ ...l, sport: 'football' })),
            ...kabaddiL.map(l => ({ ...l, sport: 'kabaddi' }))
        ];

        // Teams
        const [cricketT, footballT, kabaddiT] = await Promise.all([
            CricketTeam.find({ createdBy: thUser._id }).select('name code logo').lean(),
            FootballTeam.find({ createdBy: thUser._id }).select('name code logo').lean(),
            KabaddiTeam.find({ createdBy: thUser._id }).select('name code logo').lean()
        ]);
        const teams = [
            ...cricketT.map(t => ({ ...t, sport: 'cricket' })),
            ...footballT.map(t => ({ ...t, sport: 'football' })),
            ...kabaddiT.map(t => ({ ...t, sport: 'kabaddi' }))
        ];

        // Player registrations for the leagues created by this TH
        const tournamentIds = leagues.map(l => l._id);
        const registrations = await PlayerRegistration.find({ tournamentId: { $in: tournamentIds } }).lean();

        const tournamentMap = {};
        leagues.forEach(l => {
            tournamentMap[l._id.toString()] = { name: l.name, sport: l.sport };
        });

        const registrationsWithLeague = registrations.map(reg => ({
            ...reg,
            leagueName: tournamentMap[reg.tournamentId.toString()]?.name || 'Unknown League',
            sport: tournamentMap[reg.tournamentId.toString()]?.sport || reg.sport
        }));

        res.status(200).json(ApiResponse.success('TH details fetched', {
            user: thUser,
            stats: {
                totalLeagues: leagues.length,
                totalTeams: teams.length,
                cricketLeagues: cricketL.length,
                footballLeagues: footballL.length,
                kabaddiLeagues: kabaddiL.length,
                totalRegistrations: registrations.length
            },
            leagues,
            teams,
            registrations: registrationsWithLeague
        }));
    } catch (error) {
        next(error);
    }
};

// @desc    Get All Sub-Admins
// @route   GET /api/admin/sub-admins
// @access  Private/SuperAdmin
exports.getAllSubAdmins = async (req, res, next) => {
    try {
        const subAdmins = await User.find({ role: 'admin' }).select('-password').sort('-createdAt');
        res.status(200).json(ApiResponse.success('Sub-admins fetched successfully', subAdmins));
    } catch (error) {
        next(error);
    }
};

// @desc    Create a New Sub-Admin
// @route   POST /api/admin/sub-admins
// @access  Private/SuperAdmin
exports.createSubAdmin = async (req, res, next) => {
    try {
        const { name, email, phone, password, city, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new ApiError(400, 'Email already registered'));
        }

        const subAdmin = await User.create({
            name,
            email,
            phone,
            password,
            role: 'admin',
            city,
            address,
            status: 'active'
        });

        const subAdminResponse = await User.findById(subAdmin._id).select('-password');
        res.status(201).json(ApiResponse.success('Sub-admin created successfully', subAdminResponse));
    } catch (error) {
        next(error);
    }
};

// @desc    Update Sub-Admin Status (Suspend/Activate/Pending)
// @route   PUT /api/admin/sub-admins/:id/status
// @access  Private/SuperAdmin
exports.updateSubAdminStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['active', 'suspended', 'pending'].includes(status)) {
            return next(new ApiError(400, 'Invalid status'));
        }

        const subAdmin = await User.findOneAndUpdate(
            { _id: req.params.id, role: 'admin' },
            { status },
            { new: true, runValidators: true }
        ).select('-password');

        if (!subAdmin) {
            return next(new ApiError(404, 'Sub-admin not found'));
        }

        res.status(200).json(ApiResponse.success(`Sub-admin status updated to ${status}`, subAdmin));
    } catch (error) {
        next(error);
    }
};

// @desc    Delete Sub-Admin
// @route   DELETE /api/admin/sub-admins/:id
// @access  Private/SuperAdmin
exports.deleteSubAdmin = async (req, res, next) => {
    try {
        const subAdmin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });

        if (!subAdmin) {
            return next(new ApiError(404, 'Sub-admin not found'));
        }

        res.status(200).json(ApiResponse.success('Sub-admin deleted successfully'));
    } catch (error) {
        next(error);
    }
};

// @desc    Get Detailed Player Statistics
// @route   GET /api/admin/players/:id/stats
// @access  Private/Admin
exports.getPlayerDetailedStats = async (req, res, next) => {
    try {
        const userId = req.params.id;
        
        // Get player user data
        const player = await User.findById(userId).select('-password').lean();
        if (!player) {
            return next(new ApiError(404, 'Player not found'));
        }

        // Get all tournaments the player is registered for (all sports)
        const registrations = await PlayerRegistration.find({ userId }).lean();
        const tournamentIds = [...new Set(registrations.map(r => r.tournamentId))];
        
        // Get all tournaments (fetch from all types)
        const [cricketTournaments, footballTournaments, kabaddiTournaments] = await Promise.all([
            CricketTournament.find({ _id: { $in: tournamentIds } }).lean(),
            FootballTournament.find({ _id: { $in: tournamentIds } }).lean(),
            KabaddiTournament.find({ _id: { $in: tournamentIds } }).lean()
        ]);
        
        const allTournaments = [
            ...cricketTournaments.map(t => ({ ...t, sport: 'cricket' })),
            ...footballTournaments.map(t => ({ ...t, sport: 'football' })),
            ...kabaddiTournaments.map(t => ({ ...t, sport: 'kabaddi' }))
        ];

        // Get all teams the player belongs to (all sports)
        const [cricketTeams, footballTeams, kabaddiTeams] = await Promise.all([
            CricketTeam.find({ 'players.user': userId }).lean(),
            FootballTeam.find({ 'players.user': userId }).lean(),
            KabaddiTeam.find({ 'players.user': userId }).lean()
        ]);
        
        const allTeams = [
            ...cricketTeams.map(t => ({ ...t, sport: 'cricket' })),
            ...footballTeams.map(t => ({ ...t, sport: 'football' })),
            ...kabaddiTeams.map(t => ({ ...t, sport: 'kabaddi' }))
        ];

        // Get all matches where the player participated (cricket only for now)
        const matches = await CricketMatch.find({
            $or: [
                { 'teamAPlayers.user': userId },
                { 'teamBPlayers.user': userId }
            ]
        }).lean();

        // Calculate match-by-match scores
        const matchStats = matches.map(match => {
            const isTeamA = match.teamAPlayers?.some(p => p.user?.toString() === userId);
            const playerInMatch = isTeamA 
                ? match.teamAPlayers?.find(p => p.user?.toString() === userId)
                : match.teamBPlayers?.find(p => p.user?.toString() === userId);

            return {
                matchId: match._id,
                title: match.title,
                date: match.date,
                venue: match.venue,
                status: match.status,
                matchType: match.matchType,
                opponent: isTeamA ? match.teamB : match.teamA,
                playerTeam: isTeamA ? match.teamA : match.teamB,
                playerTeamScore: isTeamA ? match.scoreA : match.scoreB,
                opponentScore: isTeamA ? match.scoreB : match.scoreA,
                result: isTeamA 
                    ? (match.scoreA.runs > match.scoreB.runs ? 'Won' : 'Lost')
                    : (match.scoreB.runs > match.scoreA.runs ? 'Won' : 'Lost'),
                playerInfo: playerInMatch || null
            };
        });

        // Calculate overall statistics
        const overallStats = {
            totalMatches: matches.length,
            totalTournaments: allTournaments.length,
            totalTeams: allTeams.length,
            totalLeaguesRegistered: registrations.length,
            matchesWon: matchStats.filter(m => m.result === 'Won').length,
            matchesLost: matchStats.filter(m => m.result === 'Lost').length,
            totalRunsScored: player.playerProfile?.cricket?.careerSummary?.totalRuns || 0,
            totalWickets: player.playerProfile?.cricket?.careerSummary?.totalWickets || 0,
            battingAverage: player.playerProfile?.cricket?.careerSummary?.battingAverage || 0,
            strikeRate: player.playerProfile?.cricket?.careerSummary?.strikeRate || 0,
            economyRate: player.playerProfile?.cricket?.careerSummary?.economyRate || 0
        };

        // Group tournaments by sport
        const tournamentsByLeague = {};
        allTournaments.forEach(t => {
            if (!tournamentsByLeague[t.sport]) {
                tournamentsByLeague[t.sport] = [];
            }
            tournamentsByLeague[t.sport].push({
                id: t._id,
                name: t.name,
                year: t.year,
                season: t.season,
                format: t.format,
                status: t.status,
                startDate: t.startDate,
                endDate: t.endDate
            });
        });

        // Group teams by sport
        const teamsByLeague = {};
        allTeams.forEach(t => {
            if (!teamsByLeague[t.sport]) {
                teamsByLeague[t.sport] = [];
            }
            teamsByLeague[t.sport].push({
                id: t._id,
                name: t.name,
                code: t.code,
                logo: t.logo,
                city: t.city,
                captain: t.captain,
                matchesPlayed: t.matchesPlayed,
                won: t.won,
                lost: t.lost,
                points: t.points
            });
        });

        res.status(200).json(ApiResponse.success('Player detailed stats fetched', {
            player: {
                _id: player._id,
                atplId: player.atplId,
                name: player.name,
                email: player.email,
                phone: player.phone,
                city: player.city,
                state: player.state,
                gender: player.gender,
                profilePicture: player.profilePicture,
                status: player.status,
                createdAt: player.createdAt,
                sports: player.sports,
                playerProfile: player.playerProfile
            },
            stats: overallStats,
            leagues: {
                byType: tournamentsByLeague,
                total: allTournaments.length,
                cricket: tournamentsByLeague.cricket?.length || 0,
                football: tournamentsByLeague.football?.length || 0,
                kabaddi: tournamentsByLeague.kabaddi?.length || 0
            },
            teams: {
                byType: teamsByLeague,
                total: allTeams.length,
                cricket: teamsByLeague.cricket?.length || 0,
                football: teamsByLeague.football?.length || 0,
                kabaddi: teamsByLeague.kabaddi?.length || 0
            },
            matches: {
                total: matches.length,
                details: matchStats,
                byStatus: {
                    completed: matches.filter(m => m.status === 'COMPLETED').length,
                    live: matches.filter(m => m.status === 'LIVE').length,
                    upcoming: matches.filter(m => m.status === 'UPCOMING').length
                }
            },
            registrations: {
                total: registrations.length,
                details: registrations
            }
        }));
    } catch (error) {
        next(error);
    }
};
