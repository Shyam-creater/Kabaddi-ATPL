const PlayerRegistration = require('../models/PlayerRegistration.model');
const User = require('../models/User.model');
const CricketTournament = require('../models/cricket/Tournament.model');
const FootballTournament = require('../models/football/Tournament.model');
const KabaddiTournament = require('../models/kabaddi/Tournament.model');
const fs = require('fs');
const path = require('path');

const saveBase64Image = (base64String, folder = 'registrations') => {
    if (!base64String || !base64String.startsWith('data:image')) return base64String;

    try {
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
        const extension = base64String.split(';')[0].split('/')[1];
        const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${extension}`;
        const relativePath = path.join('public', 'uploads', folder, fileName);
        const absolutePath = path.join(__dirname, '..', '..', relativePath);

        // Ensure directory exists
        const dir = path.dirname(absolutePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(absolutePath, base64Data, 'base64');
        return `http://${process.env.HOST || '192.168.31.253'}:6899/public/uploads/${folder}/${fileName}`;
    } catch (error) {
        console.error('Save Image Error:', error);
        return base64String;
    }
};

exports.createRegistration = async (req, res) => {
    try {
        const { tournamentId, sport, paymentScreenshot, agreedToTerms, paymentAmount } = req.body;

        if (!tournamentId || !sport || !paymentScreenshot || !agreedToTerms) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: tournamentId, sport, paymentScreenshot, agreedToTerms'
            });
        }

        // Check for duplicate registration
        const existing = await PlayerRegistration.findOne({
            userId: req.user._id,
            tournamentId
        });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'You have already registered for this tournament.'
            });
        }

        // Auto-fill user details from logged-in user
        const user = req.user;
        const screenshotUrl = saveBase64Image(paymentScreenshot);

        // Determine which model to use for refPath
        let modelName = '';
        const s = sport.toLowerCase();
        if (s === 'cricket') modelName = 'CricketTournament';
        else if (s === 'football') modelName = 'FootballTournament';
        else if (s === 'kabaddi') modelName = 'KabaddiTournament';

        const registration = new PlayerRegistration({
            userId: user._id,
            tournamentId,
            tournamentModel: modelName,
            sport: s,
            fullName: user.name,
            email: user.email,
            phone: user.phone || '',
            paymentScreenshot: screenshotUrl,
            paymentAmount: paymentAmount || 500,
            agreedToTerms: true,
        });

        await registration.save();

        // Socket emit for real-time admin updates
        const io = req.app.get('io');
        if (io) {
            io.emit('registration:new', registration);
        }

        res.status(201).json({
            success: true,
            data: registration,
            message: 'Registration submitted successfully!'
        });
    } catch (error) {
        console.error('Registration Error:', error);

        // Handle duplicate key error from unique index
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already registered for this tournament.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit registration',
            error: error.message
        });
    }
};

exports.getAllRegistrations = async (req, res) => {
    try {
        const { sport, tournamentId } = req.query;
        const query = {};
        if (sport) query.sport = sport;
        
        if (req.user && req.user.role === 'TH') {
            const [cricket, kabaddi, football] = await Promise.all([
                CricketTournament.find({ createdBy: req.user._id }).select('_id'),
                KabaddiTournament.find({ createdBy: req.user._id }).select('_id'),
                FootballTournament.find({ createdBy: req.user._id }).select('_id')
            ]);
            const tournamentIds = [
                ...cricket.map(t => t._id),
                ...kabaddi.map(t => t._id),
                ...football.map(t => t._id)
            ];
            
            if (tournamentId) {
                // If specific tournament requested, ensure TH owns it
                if (tournamentIds.map(id => id.toString()).includes(tournamentId.toString())) {
                    query.tournamentId = tournamentId;
                } else {
                    // TH doesn't own this tournament, return empty
                    return res.status(200).json({ success: true, data: [] });
                }
            } else {
                query.tournamentId = { $in: tournamentIds };
            }
        } else if (tournamentId) {
            query.tournamentId = tournamentId;
        }

        const registrations = await PlayerRegistration.find(query)
            .populate('userId', 'name phone email profilePicture')
            .populate('tournamentId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch registrations',
            error: error.message
        });
    }
};

exports.updateRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const registration = await PlayerRegistration.findById(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        if (req.user && req.user.role === 'TH') {
            let Model;
            const s = registration.sport.toLowerCase();
            if (s === 'cricket') Model = CricketTournament;
            else if (s === 'football') Model = FootballTournament;
            else if (s === 'kabaddi') Model = KabaddiTournament;

            if (Model) {
                const tournament = await Model.findById(registration.tournamentId);
                if (!tournament || tournament.createdBy?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ success: false, message: 'Not authorized to manage this registration' });
                }
            }
        }

        registration.status = status;
        await registration.save();

        res.status(200).json({
            success: true,
            data: registration
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update registration status',
            error: error.message
        });
    }
};

// Check if current user already registered for a tournament
exports.checkRegistration = async (req, res) => {
    try {
        const { tournamentId } = req.params;
        const existing = await PlayerRegistration.findOne({
            userId: req.user._id,
            tournamentId
        });
        res.json({ registered: !!existing, registration: existing });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const registration = await PlayerRegistration.findByIdAndDelete(id);
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Try to delete the uploaded screenshot file
        if (registration.paymentScreenshot && registration.paymentScreenshot.includes('/public/uploads/')) {
            try {
                const urlPath = registration.paymentScreenshot.split('/public/uploads/')[1];
                const filePath = path.join(__dirname, '..', '..', 'public', 'uploads', urlPath);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            } catch (e) { /* ignore file cleanup errors */ }
        }

        res.status(200).json({ success: true, message: 'Registration deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete registration', error: error.message });
    }
};
