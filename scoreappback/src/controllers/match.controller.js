const CricketMatch = require('../models/cricket/Match.model');
const KabaddiMatch = require('../models/kabaddi/Match.model');
const FootballMatch = require('../models/football/Match.model');

exports.getAllMatches = async (req, res) => {
    try {
        const [cricket, kabaddi, football] = await Promise.all([
            CricketMatch.find().sort({ createdAt: -1 }).lean(),
            KabaddiMatch.find().sort({ createdAt: -1 }).lean(),
            FootballMatch.find().sort({ createdAt: -1 }).lean()
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

// Helper to select model based on sport
const getModel = (sport) => {
    switch (sport?.toLowerCase()) {
        case 'football': return FootballMatch;
        case 'kabaddi': return KabaddiMatch;
        case 'cricket':
        default: return CricketMatch;
    }
};

exports.createMatch = async (req, res) => {
    try {
        const { sport } = req.body;
        const Model = getModel(sport);
        const match = await Model.create(req.body);
        res.status(201).json(match);
    } catch (error) {
        console.error('Error creating match:', error);
        res.status(500).json({ message: 'Failed to create match', error: error.message });
    }
};

exports.updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { sport } = req.body; // sport needed to identify collection
        const Model = getModel(sport);
        const match = await Model.findByIdAndUpdate(id, req.body, { new: true });
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
        await Model.findByIdAndDelete(id);
        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ message: 'Failed to delete match', error: error.message });
    }
};
