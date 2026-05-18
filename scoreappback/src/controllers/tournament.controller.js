const CricketTournament = require('../models/cricket/Tournament.model');
const FootballTournament = require('../models/football/Tournament.model');
const KabaddiTournament = require('../models/kabaddi/Tournament.model');
const PlayerRegistration = require('../models/PlayerRegistration.model');
const fs = require('fs');
const path = require('path');

const getModel = (sport) => {
    switch (sport) {
        case 'cricket': return CricketTournament;
        case 'football': return FootballTournament;
        case 'kabaddi': return KabaddiTournament;
        default: return null;
    }
};

// Helper: save base64 image to disk
const saveBase64Image = (base64String, folder = 'tournaments') => {
    if (!base64String || !base64String.startsWith('data:image')) return base64String;
    try {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
        const extension = base64String.split(';')[0].split('/')[1];
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const relativePath = path.join('public', 'uploads', folder, fileName);
        const absolutePath = path.join(__dirname, '..', '..', relativePath);

        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(absolutePath, base64Data, 'base64');
        return `http://${process.env.HOST || '192.168.31.253'}:6899/public/uploads/${folder}/${fileName}`;
    } catch (error) {
        console.error('Save Image Error:', error);
        return base64String;
    }
};

exports.createTournament = async (req, res) => {
    try {
        const { sport } = req.params;
        const Model = getModel(sport);
        if (!Model) return res.status(400).json({ message: 'Invalid sport' });

        // Explicitly extract allowed fields
        const { name, description, registrationFee, qrCodeImage, upiId, startDate, endDate, venue, status, logo, banner, rules, format } = req.body;
        const tournamentData = {
            name,
            description: description ? description.trim().substring(0, 200) : undefined,
            registrationFee: registrationFee || 500,
            qrCodeImage: qrCodeImage ? saveBase64Image(qrCodeImage, 'qrcodes') : undefined,
            upiId: upiId ? upiId.trim() : undefined,
            startDate,
            endDate,
            venue,
            status,
            logo,
            banner,
            ...(rules && { rules }),
            ...(format && { format }),
        };

        const tournament = new Model(tournamentData);
        await tournament.save();

        // Socket Emit
        const io = req.app.get('io');
        if (io) {
            io.emit('tournament:create', tournament);
        }

        res.status(201).json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTournaments = async (req, res) => {
    try {
        const { sport } = req.params;
        const { status } = req.query;
        const Model = getModel(sport);
        if (!Model) return res.status(400).json({ message: 'Invalid sport' });

        const query = status ? { status } : {};
        const tournaments = await Model.find(query).sort({ startDate: 1 }).lean();

        if (tournaments.length === 0) return res.json([]);

        // Single aggregation query instead of N countDocuments hits
        const registrationCounts = await PlayerRegistration.aggregate([
            { $match: { tournamentId: { $in: tournaments.map(t => t._id) } } },
            { $group: { _id: "$tournamentId", count: { $sum: 1 } } }
        ]);

        const countsMap = registrationCounts.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.count;
            return acc;
        }, {});

        const tournamentsWithCount = tournaments.map(t => ({
            ...t,
            registrationCount: countsMap[t._id.toString()] || 0,
            sport
        }));

        res.json(tournamentsWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTournamentById = async (req, res) => {
    try {
        const { sport, id } = req.params;
        const Model = getModel(sport);
        if (!Model) return res.status(400).json({ message: 'Invalid sport' });

        const tournament = await Model.findById(id).populate('teams').lean();
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        const count = await PlayerRegistration.countDocuments({ tournamentId: tournament._id });
        res.json({ ...tournament, registrationCount: count, sport });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTournament = async (req, res) => {
    try {
        const { sport, id } = req.params;
        const Model = getModel(sport);
        if (!Model) return res.status(400).json({ message: 'Invalid sport' });

        // Sanitize fields before updating
        const updateData = { ...req.body };
        if (updateData.description !== undefined) {
            updateData.description = updateData.description ? updateData.description.trim().substring(0, 200) : '';
        }
        if (updateData.qrCodeImage) {
            updateData.qrCodeImage = saveBase64Image(updateData.qrCodeImage, 'qrcodes');
        }
        if (updateData.upiId !== undefined) {
            updateData.upiId = updateData.upiId ? updateData.upiId.trim() : '';
        }

        const tournament = await Model.findByIdAndUpdate(id, updateData, { new: true });
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Socket Emit
        const io = req.app.get('io');
        if (io) {
            io.emit('tournament:update', tournament);
        }

        res.json(tournament);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTournament = async (req, res) => {
    try {
        const { sport, id } = req.params;
        const Model = getModel(sport);
        if (!Model) return res.status(400).json({ message: 'Invalid sport' });

        const tournament = await Model.findByIdAndDelete(id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Socket Emit
        const io = req.app.get('io');
        if (io) {
            io.emit('tournament:delete', { id, sport });
        }

        res.json({ message: 'Tournament deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
