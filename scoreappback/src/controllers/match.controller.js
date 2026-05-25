const CricketMatch = require('../models/cricket/Match.model');
const KabaddiMatch = require('../models/kabaddi/Match.model');
const FootballMatch = require('../models/football/Match.model');
const CricketTeam = require('../models/cricket/Team.model');
const FootballTeam = require('../models/football/Team.model');
const KabaddiTeam = require('../models/kabaddi/Team.model');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const getTHUserFromToken = async (req) => {
    try {
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('role createdBy');
            if (!user) return null;
            if (user.role === 'TH') return user;
            if (user.role === 'scorer' && user.createdBy) {
                const thUser = await User.findById(user.createdBy).select('role');
                if (thUser && thUser.role === 'TH') return thUser;
            }
        }
    } catch (e) {}
    return null;
};

const getOwnerId = (user) => {
    if (!user) return null;
    if (user.role === 'scorer') return user.createdBy || user._id;
    return user._id;
};

const getModel = (sport) => {
    switch (sport?.toLowerCase()) {
        case 'football': return FootballMatch;
        case 'kabaddi': return KabaddiMatch;
        case 'cricket':
        default: return CricketMatch;
    }
};

const getTeamModel = (sport) => {
    switch (sport?.toLowerCase()) {
        case 'football': return FootballTeam;
        case 'kabaddi': return KabaddiTeam;
        case 'cricket':
        default: return CricketTeam;
    }
};

const enrichTeamReference = async (teamId, TeamModel) => {
    if (!teamId) return null;
    const team = await TeamModel.findById(teamId);
    if (!team) return null;
    return {
        teamA: { name: team.name, code: team.code, logo: team.logo },
        teamAPlayers: team.players,
        teamAId: team._id
    };
};

const enrichTeam = async (teamId, TeamModel, side) => {
    if (!teamId) return {};
    const team = await TeamModel.findById(teamId);
    if (!team) throw new Error(`${side} team not found`);
    return {
        [`team${side}`]: { name: team.name, code: team.code, logo: team.logo },
        [`team${side}Players`]: team.players,
        [`team${side}Id`]: team._id
    };
};

exports.getAllMatches = async (req, res) => {
    try {
        console.log(`[getAllMatches] Caller=${req.headers['x-client-caller']}, User-Agent=${req.headers['user-agent']}, Referer=${req.headers['referer']}`);
        const thUser = await getTHUserFromToken(req);
        const query = thUser ? { createdBy: thUser._id } : {};

        const [cricket, kabaddi, football] = await Promise.all([
            CricketMatch.find(query).sort({ createdAt: -1 }).lean(),
            KabaddiMatch.find(query).sort({ createdAt: -1 }).lean(),
            FootballMatch.find(query).sort({ createdAt: -1 }).lean()
        ]);

        // Tag them with sport type if not already (though schema defaults handle it)
        const all = [
            ...cricket.map(m => ({ ...m, sport: 'cricket' })),
            ...kabaddi.map(m => ({ ...m, sport: 'kabaddi' })),
            ...football.map(m => ({ ...m, sport: 'football' }))
        ];

        // Sort by date (newest first)
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(all);
    } catch (error) {
        console.error('Error fetching all matches:', error);
        res.status(500).json({ message: 'Failed to fetch matches' });
    }
};

exports.createMatch = async (req, res) => {
    try {
        const { sport, teamAId, teamBId } = req.body;
        const Model = getModel(sport);
        const matchData = { ...req.body };

        if (teamAId) {
            const TeamModel = getTeamModel(sport);
            const teamAInfo = await TeamModel.findById(teamAId);
            if (!teamAInfo) return res.status(404).json({ message: 'Team A not found' });
            matchData.teamA = { name: teamAInfo.name, code: teamAInfo.code, logo: teamAInfo.logo };
            matchData.teamAId = teamAInfo._id;
            matchData.teamAPlayers = teamAInfo.players;
        }

        if (teamBId) {
            const TeamModel = getTeamModel(sport);
            const teamBInfo = await TeamModel.findById(teamBId);
            if (!teamBInfo) return res.status(404).json({ message: 'Team B not found' });
            matchData.teamB = { name: teamBInfo.name, code: teamBInfo.code, logo: teamBInfo.logo };
            matchData.teamBId = teamBInfo._id;
            matchData.teamBPlayers = teamBInfo.players;
        }

        if (req.user) {
            matchData.createdBy = getOwnerId(req.user);
        }
        const match = await Model.create(matchData);
        res.status(201).json(match);
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ message: 'Failed to create match', error: error.message });
    }
};

exports.updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { sport, teamAId, teamBId } = req.body; // sport needed to identify collection
        const Model = getModel(sport);
        let match = await Model.findById(id);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (req.user) {
            const ownerId = getOwnerId(req.user);
            if (match.createdBy?.toString() !== ownerId?.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this match' });
            }
        }

        const updateData = { ...req.body };
        if (teamAId) {
            const TeamModel = getTeamModel(sport);
            const teamAInfo = await TeamModel.findById(teamAId);
            if (!teamAInfo) return res.status(404).json({ message: 'Team A not found' });
            updateData.teamA = { name: teamAInfo.name, code: teamAInfo.code, logo: teamAInfo.logo };
            updateData.teamAId = teamAInfo._id;
            updateData.teamAPlayers = teamAInfo.players;
        }

        if (teamBId) {
            const TeamModel = getTeamModel(sport);
            const teamBInfo = await TeamModel.findById(teamBId);
            if (!teamBInfo) return res.status(404).json({ message: 'Team B not found' });
            updateData.teamB = { name: teamBInfo.name, code: teamBInfo.code, logo: teamBInfo.logo };
            updateData.teamBId = teamBInfo._id;
            updateData.teamBPlayers = teamBInfo.players;
        }

        // Auto-update points if Match status transitions to COMPLETED and winner is declared
        if (match.status !== 'COMPLETED' && updateData.status === 'COMPLETED' && updateData.winner) {
            try {
                const TeamModel = getTeamModel(sport);
                const winnerCode = updateData.winner;
                const teamACode = match.teamA.code;
                const teamBCode = match.teamB.code;
                const loserCode = winnerCode === teamACode ? teamBCode : teamACode;

                if (winnerCode !== 'DRAW') {
                    // Update Winner
                    await TeamModel.updateOne(
                        { code: winnerCode },
                        { $inc: { matchesPlayed: 1, won: 1, points: 2 } }
                    );
                    // Update Loser
                    await TeamModel.updateOne(
                        { code: loserCode },
                        { $inc: { matchesPlayed: 1, lost: 1 } }
                    );
                    console.log(`Stats Updated for ${sport}: ${winnerCode} (+2) vs ${loserCode}`);
                } else {
                    // Draw: +1 each
                    await TeamModel.updateMany(
                        { code: { $in: [teamACode, teamBCode] } },
                        { $inc: { matchesPlayed: 1, draw: 1, points: 1 } }
                    );
                    console.log(`Stats Updated for ${sport}: Draw between ${teamACode} and ${teamBCode}`);
                }
            } catch (pointsErr) {
                console.error('Error updating team standings:', pointsErr);
            }
        }

        match = await Model.findByIdAndUpdate(id, updateData, { new: true });

        // Emit Socket Event for Real-time Update
        const io = req.app.get('io');
        if (io) {
            io.emit('match:update', match);
            console.log(`Socket Emitted: match:update for ${match.title}`);
        }

        res.json(match);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ message: 'Failed to update match', error: error.message });
    }
};

exports.deleteMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { sport } = req.query; // pass sport as query param for delete
        const Model = getModel(sport);
        let match = await Model.findById(id);
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (req.user) {
            const ownerId = getOwnerId(req.user);
            if (match.createdBy?.toString() !== ownerId?.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this match' });
            }
        }

        await Model.findByIdAndDelete(id);
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ message: 'Failed to delete match', error: error.message });
    }
};
