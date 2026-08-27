const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const KabaddiMatch = require('./src/models/kabaddi/Match.model');
    const match = await KabaddiMatch.findOne({ title: 'final' });
    
    if (match) {
        // Filter out TestPlayer, API_TEST, API_TEST_PLAYER, TestPlayerWithEmptyUser, and duplicate Sam (keep the first one)
        const newStats = [];
        let samCount = 0;
        match.playerStats.forEach(p => {
            if (p.name.includes('Test') || p.name.includes('TEST')) {
                return; // drop
            }
            if (p.name === 'Sam') {
                samCount++;
                if (samCount > 1) return; // drop duplicates of Sam
            }
            newStats.push(p);
        });
        
        match.playerStats = newStats;
        
        // Reset scoreA just in case it got too high from our tests
        let newScoreA = 0;
        let newScoreB = 0;
        newStats.forEach(s => {
            if (s.team === match.teamA.code) newScoreA += (s.totalPoints || 0);
            if (s.team === match.teamB.code) newScoreB += (s.totalPoints || 0);
        });
        match.scoreA = newScoreA;
        match.scoreB = newScoreB;

        await match.save();
        console.log("Database cleaned.");
    }
    
    mongoose.disconnect();
});
