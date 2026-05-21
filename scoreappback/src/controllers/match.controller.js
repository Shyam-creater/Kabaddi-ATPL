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

const getResolvedSport = (sport, match) => {
    if (sport) return sport.toLowerCase();
    if (match && match.sport) return match.sport.toLowerCase();
    return 'cricket';
};

const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
};

const computeStatDelta = (next, previous = {}) => {
    return {
        matches: previous.user ? 0 : 1,
        runs: toNumber(next.runs) - toNumber(previous.runs),
        wickets: toNumber(next.wickets) - toNumber(previous.wickets),
        catches: toNumber(next.catches) - toNumber(previous.catches),
        runOuts: toNumber(next.runOuts) - toNumber(previous.runOuts),
        overs: toNumber(next.overs) - toNumber(previous.overs),
        balls: toNumber(next.balls) - toNumber(previous.balls),
        goals: toNumber(next.goals) - toNumber(previous.goals),
        assists: toNumber(next.assists) - toNumber(previous.assists),
        minutes: toNumber(next.minutes) - toNumber(previous.minutes),
        raidPoints: toNumber(next.raidPoints) - toNumber(previous.raidPoints),
        tacklePoints: toNumber(next.tacklePoints) - toNumber(previous.tacklePoints),
        totalPoints: toNumber(next.totalPoints) - toNumber(previous.totalPoints)
    };
};

const updateUserProfileStats = async (userId, sport, delta, stat, match) => {
    if (!userId) return;
    const user = await User.findById(userId);
    if (!user) return;

    user.playerProfile = user.playerProfile || {};
    user.playerProfile[sport] = user.playerProfile[sport] || {};
    const profile = user.playerProfile[sport];
    profile.careerSummary = profile.careerSummary || {};
    profile.leagueHistory = profile.leagueHistory || [];

    const season = match?.date ? new Date(match.date).getFullYear().toString() : new Date().getFullYear().toString();
    const leagueName = match?.series || `${sport.toUpperCase()} League`;
    let leagueEntry = profile.leagueHistory.find(entry => entry.leagueName === leagueName && entry.season === season && entry.teamName === stat.team);
    if (!leagueEntry) {
        leagueEntry = {
            leagueName,
            season,
            teamName: stat.team || '',
            matches: 0,
            runs: 0,
            wickets: 0,
            catches: 0,
            goals: 0,
            assists: 0,
            minutes: 0,
            raidPoints: 0,
            tacklePoints: 0,
            totalPoints: 0,
            highestScore: 0,
            strikeRate: 0,
            economy: 0
        };
        profile.leagueHistory.push(leagueEntry);
    }

    if (sport === 'cricket') {
        profile.careerSummary.totalMatches = (profile.careerSummary.totalMatches || 0) + (delta.matches || 0);
        profile.careerSummary.totalRuns = (profile.careerSummary.totalRuns || 0) + (delta.runs || 0);
        profile.careerSummary.totalWickets = (profile.careerSummary.totalWickets || 0) + (delta.wickets || 0);
        profile.careerSummary.totalCatches = (profile.careerSummary.totalCatches || 0) + (delta.catches || 0);
        profile.careerSummary.totalOvers = (profile.careerSummary.totalOvers || 0) + (delta.overs || 0);
        profile.careerSummary.highestScore = Math.max(profile.careerSummary.highestScore || 0, toNumber(stat.runs));
        leagueEntry.matches += delta.matches || 0;
        leagueEntry.runs += delta.runs || 0;
        leagueEntry.wickets += delta.wickets || 0;
        leagueEntry.catches += delta.catches || 0;
        leagueEntry.highestScore = Math.max(leagueEntry.highestScore || 0, toNumber(stat.runs));
    } else if (sport === 'football') {
        profile.careerSummary.totalGoals = (profile.careerSummary.totalGoals || 0) + (delta.goals || 0);
        profile.careerSummary.totalAssists = (profile.careerSummary.totalAssists || 0) + (delta.assists || 0);
        profile.careerSummary.totalMinutes = (profile.careerSummary.totalMinutes || 0) + (delta.minutes || 0);
        profile.careerSummary.totalPoints = (profile.careerSummary.totalPoints || 0) + (delta.totalPoints || 0);
        leagueEntry.matches += delta.matches || 0;
        leagueEntry.goals += delta.goals || 0;
        leagueEntry.assists += delta.assists || 0;
        leagueEntry.minutes += delta.minutes || 0;
        leagueEntry.totalPoints += delta.totalPoints || 0;
    } else if (sport === 'kabaddi') {
        profile.careerSummary.raidPoints = (profile.careerSummary.raidPoints || 0) + (delta.raidPoints || 0);
        profile.careerSummary.tacklePoints = (profile.careerSummary.tacklePoints || 0) + (delta.tacklePoints || 0);
        profile.careerSummary.totalPoints = (profile.careerSummary.totalPoints || 0) + (delta.totalPoints || 0);
        leagueEntry.matches += delta.matches || 0;
        leagueEntry.raidPoints += delta.raidPoints || 0;
        leagueEntry.tacklePoints += delta.tacklePoints || 0;
        leagueEntry.totalPoints += delta.totalPoints || 0;
    }

    await user.save();
};

const syncPlayerStatsWithUsers = async (match, updatedStats) => {
    if (!Array.isArray(updatedStats)) return;
    const sport = getResolvedSport(match.sport, match);
    const previous = Array.isArray(match.playerStats) ? match.playerStats : [];
    const previousMap = new Map(previous.map(entry => [entry.user?.toString(), entry]));

    await Promise.all(updatedStats.map(async (stat) => {
        const userId = stat.user?.toString();
        if (!userId) return;
        const before = previousMap.get(userId) || {};
        const delta = computeStatDelta(stat, before);
        if (Object.values(delta).every(value => value === 0)) return;
        await updateUserProfileStats(userId, sport, delta, stat, match);
    }));
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

        if (updateData.playerStats) {
            await syncPlayerStatsWithUsers(match, updateData.playerStats);
        }

        match = await Model.findByIdAndUpdate(id, updateData, { new: true });
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
