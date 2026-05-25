const Player = require('../../models/cricket/Player.model');
const Team = require('../../models/cricket/Team.model');
const CricketMatch = require('../../models/cricket/Match.model');

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
        let players = await Player.find(query).populate('team').lean();

        // If sport filter yields no players, retry without sport filter
        if (sport && players.length === 0) {
            delete query.sport;
            players = await Player.find(query).populate('team').lean();
        }

        // If requested top batsman/bowler leaderboard, aggregate stats from CricketMatch dynamically
        if (top) {
            const matches = await CricketMatch.find({}).lean();
            const playerStats = {};

            matches.forEach(match => {
                // Accumulate batting stats
                match.battingLineup?.forEach(bat => {
                    if (bat.name) {
                        const nameKey = bat.name.trim().toLowerCase();
                        if (!playerStats[nameKey]) {
                            playerStats[nameKey] = { runs: 0, wickets: 0, matches: 0 };
                        }
                        playerStats[nameKey].runs += (bat.runs || 0);
                    }
                });

                // Accumulate bowling stats
                match.bowlingLineup?.forEach(bowl => {
                    if (bowl.name) {
                        const nameKey = bowl.name.trim().toLowerCase();
                        if (!playerStats[nameKey]) {
                            playerStats[nameKey] = { runs: 0, wickets: 0, matches: 0 };
                        }
                        playerStats[nameKey].wickets += (bowl.wickets || 0);
                    }
                });

                // Accumulate matches played count
                const participants = new Set();
                match.teamAPlayers?.forEach(p => p.name && participants.add(p.name.trim().toLowerCase()));
                match.teamBPlayers?.forEach(p => p.name && participants.add(p.name.trim().toLowerCase()));
                participants.forEach(nameKey => {
                    if (!playerStats[nameKey]) {
                        playerStats[nameKey] = { runs: 0, wickets: 0, matches: 0 };
                    }
                    playerStats[nameKey].matches += 1;
                });
            });

            // Merge dynamic platform stats into Player list
            players = players.map(p => {
                const nameKey = p.name ? p.name.trim().toLowerCase() : '';
                const dyn = playerStats[nameKey] || { runs: 0, wickets: 0, matches: 0 };
                return {
                    ...p,
                    runs: (p.runs || 0) + dyn.runs,
                    wickets: (p.wickets || 0) + dyn.wickets,
                    matches: (p.matches || 0) + dyn.matches
                };
            });

            // Re-sort based on combined scores
            if (top === 'batsman') {
                players.sort((a, b) => b.runs - a.runs);
            } else if (top === 'bowler') {
                players.sort((a, b) => b.wickets - a.wickets);
            }

            // Apply limit of 10 for leaderboards
            players = players.slice(0, 10);
        } else {
            // Apply standard alphabetical sorting when top is not specified
            players.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
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
