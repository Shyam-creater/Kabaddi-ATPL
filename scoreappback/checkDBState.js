const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const KabaddiMatch = require('./src/models/kabaddi/Match.model');
    const match = await KabaddiMatch.findOne({ title: 'final' });
    
    if (match) {
        console.log("Team A Code:", match.teamA.code);
        console.log("Team B Code:", match.teamB.code);
        console.log("Score A:", match.scoreA);
        console.log("Score B:", match.scoreB);
        console.log("Player Stats:", JSON.stringify(match.playerStats, null, 2));
    } else {
        console.log("Match not found");
    }
    mongoose.disconnect();
});
