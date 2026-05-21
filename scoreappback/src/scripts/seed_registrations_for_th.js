const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});

const connectDB = require('../config/db');
const User = require('../models/User.model');
const PlayerRegistration = require('../models/PlayerRegistration.model');
const CricketTournament = require('../models/cricket/Tournament.model');
const FootballTournament = require('../models/football/Tournament.model');
const KabaddiTournament = require('../models/kabaddi/Tournament.model');

(async () => {
  try {
    await connectDB();

    // Find THs
    const ths = await User.find({ role: 'TH' }).select('_id');
    if (!ths.length) {
      console.log('No TH users found. Seed aborted.');
      process.exit(0);
    }

    const makeScreenshot = (suffix) => {
      // keep valid base64 (tiny 1x1 png) to satisfy validation.
      // eslint-disable-next-line max-len
      const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X0y0AAAAASUVORK5CYII=';
      return base64;
    };

    // For each TH, create 2 registrations per tournament (using 2 random players)
    for (const th of ths) {
      const thId = th._id;
      const tournaments = [
        ...(await CricketTournament.find({ createdBy: thId }).select('_id sport name').lean()),
        ...(await FootballTournament.find({ createdBy: thId }).select('_id sport name').lean()),
        ...(await KabaddiTournament.find({ createdBy: thId }).select('_id sport name').lean()),
      ];

      if (!tournaments.length) continue;

      const players = await User.find({ role: 'player', createdBy: thId }).select('_id').lean();
      if (!players.length) {
        console.log(`TH ${thId} has no players. Skipping registrations.`);
        continue;
      }

      for (let i = 0; i < tournaments.length; i++) {
        const t = tournaments[i];
        const sport = (t.sport || '').toLowerCase() || (t.name || '').includes('football') ? 'football' : 'cricket';

        const picks = [players[i % players.length], players[(i + 1) % players.length]].filter(Boolean);
        for (let j = 0; j < picks.length; j++) {
          const userId = picks[j]._id;

          const exists = await PlayerRegistration.findOne({ userId, tournamentId: t._id });
          if (exists) continue;

          const user = await User.findById(userId).select('name email phone');
          if (!user) continue;

          const registration = new PlayerRegistration({
            userId,
            tournamentId: t._id,
            tournamentModel:
              sport === 'cricket' ? 'CricketTournament' : sport === 'football' ? 'FootballTournament' : 'KabaddiTournament',
            sport,
            fullName: user.name || 'Demo Player',
            email: user.email || 'player@example.com',
            phone: user.phone || '',
            paymentScreenshot: makeScreenshot(`reg-${thId}-${t._id}-${j}`),
            paymentAmount: 500,
            agreedToTerms: true,
            status: 'PENDING',
          });

          await registration.save();
        }
      }

      console.log(`✅ Seeded registrations for TH: ${thId}`);
    }

    console.log('Seeding registrations successfully completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding registrations:', err);
    process.exit(1);
  }
})();
