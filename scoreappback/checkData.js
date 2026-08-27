const mongoose = require('mongoose');
require('dotenv').config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const KabaddiTeam = require('./src/models/kabaddi/Team.model');
        const KabaddiMatch = require('./src/models/kabaddi/Match.model');
        
        const teams = await KabaddiTeam.find().lean();
        console.log('--- Kabaddi Teams ---');
        teams.forEach(t => {
            console.log(`Team: ${t.name} (Code: ${t.code}), Players Count: ${t.players ? t.players.length : 0}`);
            if(t.players && t.players.length > 0) {
                console.log(`Sample Player:`, t.players[0]);
            }
        });

        const matches = await KabaddiMatch.find().lean();
        console.log('\n--- Kabaddi Matches ---');
        matches.forEach(m => {
            console.log(`Match: ${m.title}`);
            console.log(`Team A (${m.teamA?.code}): ${m.teamAPlayers ? m.teamAPlayers.length : 0} players`);
            console.log(`Team B (${m.teamB?.code}): ${m.teamBPlayers ? m.teamBPlayers.length : 0} players`);
            if(m.teamAPlayers && m.teamAPlayers.length > 0) {
                console.log(`Sample Match Player A:`, m.teamAPlayers[0]);
            }
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        mongoose.disconnect();
    }
}

checkData();
