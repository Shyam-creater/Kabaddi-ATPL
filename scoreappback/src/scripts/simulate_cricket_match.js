const axios = require('axios');

const API_URL = 'http://localhost:6899/api/cricket/matches';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function simulateMatch() {
    try {
        console.log('🏏 Initializing Match Simulation...');

        // 1. Create a Match
        const newMatch = {
            title: 'TPL Final 2026',
            series: 'TPL Premier League',
            status: 'LIVE',
            teamA: { name: 'Chennai Kings', code: 'CSK' },
            teamB: { name: 'Mumbai Indians', code: 'MI' },
            scoreA: { runs: 185, wickets: 6, overs: 20 },
            scoreB: { runs: 0, wickets: 0, overs: 0 },
            target: 186,
            statusText: 'Mumbai Indians need 186 runs to win'
        };

        const createRes = await axios.post(API_URL, newMatch);
        const matchId = createRes.data._id;
        console.log(`✅ Match Created: ${matchId}`);

        let runs = 0;
        let wickets = 0;
        let balls = 0;

        // 2. Simulate 2 Overs (12 balls)
        for (let i = 0; i < 12; i++) {
            await sleep(3000); // Update every 3 seconds

            // Random event
            const event = Math.random();
            let run = 0;

            if (event < 0.1) {
                wickets++;
                console.log(`❌ WICKET! (${wickets}/10)`);
            } else if (event > 0.8) {
                run = [4, 6][Math.floor(Math.random() * 2)];
                console.log(`💥 BOUNDARY! ${run} runs`);
            } else {
                run = Math.floor(Math.random() * 4);
                console.log(`👉 ${run} runs`);
            }

            runs += run;
            balls++;

            const overs = Math.floor(balls / 6) + (balls % 6) / 10;
            const required = 186 - runs;
            const ballsLeft = 120 - balls;

            const updateData = {
                scoreB: { runs, wickets, overs },
                statusText: `MI need ${required} runs in ${ballsLeft} balls`
            };

            await axios.put(`${API_URL}/${matchId}`, updateData);
            console.log(`Update Sent: ${runs}/${wickets} (${overs})`);
        }

        console.log('🛑 Simulation Ended.');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

simulateMatch();
