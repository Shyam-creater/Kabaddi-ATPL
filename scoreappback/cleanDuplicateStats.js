const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const KabaddiMatch = require('./src/models/kabaddi/Match.model');
    const match = await KabaddiMatch.findOne({ title: 'final' });
    
    if (match) {
        match.playerStats = [];
        match.scoreA = 0;
        match.scoreB = 0;
        match.raidPointsA = 0;
        match.raidPointsB = 0;
        match.tacklePointsA = 0;
        match.tacklePointsB = 0;
        
        await match.save();
        console.log("Successfully cleaned duplicate player stats and reset scores to 0!");
    } else {
        console.log("Match not found");
    }
    mongoose.disconnect();
});
