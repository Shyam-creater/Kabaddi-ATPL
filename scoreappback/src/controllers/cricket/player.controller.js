const Player = require('../../models/cricket/Player.model');
const Team = require('../../models/cricket/Team.model');

// Get All Players (with optional Auction filter)
exports.getPlayers = async (req, res) => {
    try {
        const { status, teamId, top, sport, category } = req.query;
        let query = {};
        let sort = { name: 1 };

        if (status) query.auctionStatus = status;
        if (teamId) query.team = teamId;
        if (category) query.category = category;
        if (sport) query.sport = sport;

        if (top === 'batsman') sort = { runs: -1 };
        if (top === 'bowler') sort = { wickets: -1 };

        // First attempt with filters
        let players = await Player.find(query).populate('team').sort(sort).limit(top ? 10 : 0);

        // If sport filter yields no players, retry without sport filter
        if (sport && players.length === 0) {
            delete query.sport;
            players = await Player.find(query).populate('team').sort(sort).limit(top ? 10 : 0);
        }
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create Player
exports.createPlayer = async (req, res) => {
    try {
        const player = new Player(req.body);
        await player.save();
        res.status(201).json(player);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Player (Used for Auction Bidding too)
exports.updatePlayer = async (req, res) => {
    try {
        const updates = req.body;

        // If player is sold, we might want to update the Team's player list too (Optional but good for sync)
        if (updates.auctionStatus === 'SOLD' && updates.team) {
            await Team.findByIdAndUpdate(updates.team, {
                $push: { players: { name: req.body.name || 'Unknown', role: req.body.role || 'Player', image: req.body.image } }
            });
        }

        const player = await Player.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('team');

        // Socket emit for Live Auction
        const io = req.app.get('io');
        if (io) {
            io.emit('auction:update', player);
        }

        res.json(player);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deletePlayer = async (req, res) => {
    try {
        await Player.findByIdAndDelete(req.params.id);
        res.json({ message: 'Player deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
