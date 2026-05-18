const CricketTeam = require('../models/cricket/Team.model');
const FootballTeam = require('../models/football/Team.model');
const KabaddiTeam = require('../models/kabaddi/Team.model');

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
        // Base64 validation (approx size check)
        // 5MB is roughly 6.7M characters in Base64
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

        if (sport && sport !== 'all') {
            const Model = getModel(sport);
            const teams = await Model.find().sort({ points: -1, name: 1 });
            return res.json(teams);
        }

        // Return all sports teams keyed or flat list
        const [cricket, kabaddi, football] = await Promise.all([
            CricketTeam.find().sort({ points: -1, name: 1 }).lean(),
            KabaddiTeam.find().sort({ points: -1, name: 1 }).lean(),
            FootballTeam.find().sort({ points: -1, name: 1 }).lean()
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
        const { sport, logo } = req.body;

        if (logo) validateLogo(logo);

        const Model = getModel(sport);
        const team = new Model(req.body);
        await team.save();
        res.status(201).json(team);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Team
exports.updateTeam = async (req, res) => {
    try {
        const { sport, logo } = req.body;

        if (logo) validateLogo(logo);

        const Model = getModel(sport);
        const team = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!team) return res.status(404).json({ message: 'Team not found' });
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
        const team = await Model.findByIdAndDelete(req.params.id);
        if (!team) return res.status(404).json({ message: 'Team not found' });
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
