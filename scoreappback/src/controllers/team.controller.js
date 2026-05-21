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

const teamSizeLimits = {
    cricket: 11,
    football: 11,
    kabaddi: 7
};

const normalizePlayers = async (players = [], sport) => {
    if (!Array.isArray(players)) return [];
    return Promise.all(players.map(async (player) => {
        if (player?.user) {
            const user = await User.findById(player.user).select('name profilePicture playerProfile');
            if (user) {
                const profileSport = sport?.toLowerCase();
                const legacyRole = user.playerProfile?.[profileSport]?.role || user.role || 'Player';
                return {
                    ...player,
                    name: player.name || user.name,
                    role: player.role || legacyRole,
                    image: player.image || user.profilePicture || '',
                };
            }
        }
        return player;
    }));
};

// Helper to select model based on sport
const getModel = (sport) => {
    switch (sport?.toLowerCase()) {
        case 'football': return FootballTeam;
        case 'kabaddi': return KabaddiTeam;
        case 'cricket':
        default: return CricketTeam;
    }
};

const validateLogo = (logo) => {
    if (!logo) return null;
    if (logo.startsWith('data:image')) {
        if (logo.length > 7000000) {
            throw new Error('Image too large! Max 5MB allowed.');
        }
    }
    return logo;
};

// Get All Teams (Aggregated from all sports for "All" view, or specific sport)
exports.getTeams = async (req, res) => {
    try {
        const { sport } = req.query;
        const thUser = await getTHUserFromToken(req);
        const query = thUser ? { createdBy: thUser._id } : {};

        if (sport && sport !== 'all') {
            const Model = getModel(sport);
            const teams = await Model.find(query).sort({ points: -1, name: 1 });
            return res.json(teams);
        }

        // Return all sports teams keyed or flat list
        const [cricket, kabaddi, football] = await Promise.all([
            CricketTeam.find(query).sort({ points: -1, name: 1 }).lean(),
            KabaddiTeam.find(query).sort({ points: -1, name: 1 }).lean(),
            FootballTeam.find(query).sort({ points: -1, name: 1 }).lean()
        ]);

        const all = [
            ...cricket.map(t => ({ ...t, sport: 'cricket' })),
            ...kabaddi.map(t => ({ ...t, sport: 'kabaddi' })),
            ...football.map(t => ({ ...t, sport: 'football' }))
        ];

        res.json(all);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Single Team
exports.getTeamById = async (req, res) => {
    try {
        const { sport } = req.query; // Need sport to know which DB to query, or try all
        if (sport) {
            const Model = getModel(sport);
            const team = await Model.findById(req.params.id);
            if (!team) return res.status(404).json({ message: 'Team not found' });
            return res.json(team);
        }

        // Try to find in any
        // Note: This is inefficient but IDs should collide rarely if random. ObjectId has timestamp.
        let team = await CricketTeam.findById(req.params.id);
        if (!team) team = await FootballTeam.findById(req.params.id);
        if (!team) team = await KabaddiTeam.findById(req.params.id);

        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Team
exports.createTeam = async (req, res) => {
    try {
        const { sport, logo, players, captainId } = req.body;

        if (logo) validateLogo(logo);

        const Model = getModel(sport);
        const teamData = { ...req.body };

        if (Array.isArray(players)) {
            const normalizedPlayers = await normalizePlayers(players, sport);
            const maxPlayers = teamSizeLimits[sport?.toLowerCase() || 'cricket'] || 11;
            if (normalizedPlayers.length > maxPlayers) {
                throw new Error(`Team size cannot exceed ${maxPlayers} players for ${sport || 'cricket'}`);
            }
            teamData.players = normalizedPlayers;
            teamData.playerCount = normalizedPlayers.length;
        }

        if (captainId) {
            const captainUser = await User.findById(captainId).select('name');
            if (captainUser) {
                teamData.captainId = captainId;
                teamData.captain = teamData.captain || captainUser.name;
            }
        }

        if (req.user) {
            teamData.createdBy = getOwnerId(req.user);
        }

        const team = new Model(teamData);
        await team.save();
        res.status(201).json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Team
exports.updateTeam = async (req, res) => {
    try {
        const { sport, logo, players, captainId } = req.body;

        if (logo) validateLogo(logo);

        const Model = getModel(sport);
        let team = await Model.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (req.user) {
            const ownerId = getOwnerId(req.user);
            if (team.createdBy?.toString() !== ownerId?.toString()) {
                return res.status(403).json({ message: 'Not authorized to update this team' });
            }
        }

        const updateData = { ...req.body };
        if (Array.isArray(players)) {
            const normalizedPlayers = await normalizePlayers(players, sport);
            const maxPlayers = teamSizeLimits[sport?.toLowerCase() || 'cricket'] || 11;
            if (normalizedPlayers.length > maxPlayers) {
                throw new Error(`Team size cannot exceed ${maxPlayers} players for ${sport || 'cricket'}`);
            }
            updateData.players = normalizedPlayers;
            updateData.playerCount = updateData.players.length;
        }

        if (captainId) {
            const captainUser = await User.findById(captainId).select('name');
            if (captainUser) {
                updateData.captainId = captainId;
                updateData.captain = updateData.captain || captainUser.name;
            }
        }

        team = await Model.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Team
exports.deleteTeam = async (req, res) => {
    try {
        const { sport } = req.query;
        const Model = getModel(sport);
        let team = await Model.findById(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        if (req.user) {
            const ownerId = getOwnerId(req.user);
            if (team.createdBy?.toString() !== ownerId?.toString()) {
                return res.status(403).json({ message: 'Not authorized to delete this team' });
            }
        }

        await Model.findByIdAndDelete(req.params.id);
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
