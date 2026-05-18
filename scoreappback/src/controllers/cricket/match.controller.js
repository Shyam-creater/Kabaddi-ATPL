const Match = require('../../models/cricket/Match.model');

// Get all matches (with optional filter)
exports.getMatches = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const matches = await Match.find(query).sort({ date: -1 });
        res.json(matches);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single match
exports.getMatchById = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        if (!match) return res.status(404).json({ message: 'Match not found' });
        res.json(match);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new match
exports.createMatch = async (req, res) => {
    try {
        const match = new Match(req.body);
        await match.save();
        res.status(201).json(match);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Match Score (LIVE)
exports.updateMatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Find match first to compare status change
        const match = await Match.findByIdAndUpdate(id, updates, { new: true });

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // AUTO-UPDATE POINTS if Match is Completed and Winner is declared
        // Ensure this only runs once. For now, we assume admin is careful. 
        // A better way is to checking previous status, but here we just check if 'status' is being updated to 'COMPLETED' in this request
        if (updates.status === 'COMPLETED' && updates.winner) {
            const Team = require('../../models/cricket/Team.model');

            const winnerCode = updates.winner;
            const teamACode = match.teamA.code;
            const teamBCode = match.teamB.code;
            const loserCode = winnerCode === teamACode ? teamBCode : teamACode;

            if (winnerCode !== 'DRAW') {
                // Update Winner
                const winRes = await Team.updateOne(
                    { code: winnerCode },
                    { $inc: { matchesPlayed: 1, won: 1, points: 2 } }
                );
                // Update Loser
                const loseRes = await Team.updateOne(
                    { code: loserCode },
                    { $inc: { matchesPlayed: 1, lost: 1 } }
                );
                console.log(`Stats Updated: ${winnerCode} (+2) vs ${loserCode}`);
            } else {
                // Draw: +1 each
                await Team.updateMany(
                    { code: { $in: [teamACode, teamBCode] } },
                    { $inc: { matchesPlayed: 1, draw: 1, points: 1 } }
                );
                console.log(`Stats Updated: Draw between ${teamACode} and ${teamBCode}`);
            }
        }

        // Emit Socket Event for Real-time Update
        const io = req.app.get('io');
        if (io) {
            io.emit('match:update', match);
            console.log(`Socket Emitted: match:update for ${match.title}`);
        }

        res.json(match);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete Match
exports.deleteMatch = async (req, res) => {
    try {
        await Match.findByIdAndDelete(req.params.id);
        res.json({ message: 'Match deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
