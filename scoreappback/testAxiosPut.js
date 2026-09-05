const axios = require('axios');
require('dotenv').config();

async function testPut() {
    try {
        const KabaddiMatch = require('./src/models/kabaddi/Match.model');
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGO_URI);
        const match = await KabaddiMatch.findOne({ title: 'final' });
        
        // Let's create a token for super_admin
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: match.createdBy || new mongoose.Types.ObjectId(), role: 'super_admin' }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1d' });

        const payload = {
            ...match.toObject(),
            scoreA: match.scoreA + 1,
            playerStats: [
                {
                    name: 'Sam Test',
                    team: 'CHN',
                    position: 'Player',
                    raidPoints: 0,
                    tacklePoints: 1,
                    bonusPoints: 0,
                    otherPoints: 0,
                    totalPoints: 1
                }
            ],
            sport: 'kabaddi'
        };

        console.log("Sending payload with playerStats length:", payload.playerStats.length);
        
        const response = await axios.put(`https://back.aattumtpl.com/api/matches/${match._id}`, payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
         
        console.log("Response scoreA:", response.data.scoreA);
        console.log("Response playerStats length:", response.data.playerStats ? response.data.playerStats.length : 0);
        
        await mongoose.disconnect();
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

testPut();
