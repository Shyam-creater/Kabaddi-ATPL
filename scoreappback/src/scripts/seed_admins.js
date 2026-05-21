const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});
const mongoose = require('mongoose');
const User = require('../models/User.model');
const CricketTournament = require('../models/cricket/Tournament.model');
const CricketTeam = require('../models/cricket/Team.model');
const CricketMatch = require('../models/cricket/Match.model');
const connectDB = require('../config/db');

(async () => {
  try {
    await connectDB();

    console.log('Seeding demo accounts...');

    // 1. Super Admin
    const superAdminEmail = 'superadmin@atpl.com';
    let superAdmin = await User.findOne({ email: superAdminEmail });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'ATPL Super Admin',
        email: superAdminEmail,
        password: 'password123',
        role: 'super_admin',
        status: 'active',
        phone: '9999999991',
        city: 'Chennai',
        address: 'ATPL Headquarters'
      });
      console.log(`✅ Super Admin created: ${superAdmin.email} (ID: ${superAdmin.atplId})`);
    } else {
      superAdmin.role = 'super_admin';
      superAdmin.status = 'active';
      await superAdmin.save();
      console.log(`ℹ️ Super Admin updated: ${superAdmin.email} (ID: ${superAdmin.atplId})`);
    }

    // 2. Sub Admin
    const subAdminEmail = 'subadmin@atpl.com';
    let subAdmin = await User.findOne({ email: subAdminEmail });
    if (!subAdmin) {
      subAdmin = await User.create({
        name: 'ATPL Sub Admin',
        email: subAdminEmail,
        password: 'password123',
        role: 'admin',
        status: 'active',
        phone: '9999999992',
        city: 'Bangalore',
        address: 'ATPL Office 2'
      });
      console.log(`✅ Sub Admin created: ${subAdmin.email} (ID: ${subAdmin.atplId})`);
    } else {
      subAdmin.role = 'admin';
      subAdmin.status = 'active';
      await subAdmin.save();
      console.log(`ℹ️ Sub Admin updated: ${subAdmin.email} (ID: ${subAdmin.atplId})`);
    }

    // 3. Active Tournament Head
    const thEmail = 'thaccount@atpl.com';
    let thUser = await User.findOne({ email: thEmail });
    if (!thUser) {
      thUser = await User.create({
        name: 'ATPL Tournament Head',
        email: thEmail,
        password: 'password123',
        role: 'TH',
        status: 'active',
        phone: '9999999993',
        city: 'Mumbai',
        address: 'Tournament Ground 1'
      });
      console.log(`✅ Tournament Head (Active) created: ${thUser.email} (ID: ${thUser.atplId})`);
    } else {
      thUser.role = 'TH';
      thUser.status = 'active';
      await thUser.save();
      console.log(`ℹ️ Tournament Head (Active) updated: ${thUser.email} (ID: ${thUser.atplId})`);
    }

    // 4. Pending Tournament Head
    const pendingThEmail = 'pendingth@atpl.com';
    let pendingThUser = await User.findOne({ email: pendingThEmail });
    if (!pendingThUser) {
      pendingThUser = await User.create({
        name: 'Pending Tournament Head',
        email: pendingThEmail,
        password: 'password123',
        role: 'TH',
        status: 'pending',
        phone: '9999999994',
        city: 'Delhi',
        address: 'Tournament Ground 2'
      });
      console.log(`✅ Tournament Head (Pending) created: ${pendingThUser.email} (ID: ${pendingThUser.atplId})`);
    } else {
      pendingThUser.role = 'TH';
      pendingThUser.status = 'pending';
      await pendingThUser.save();
      console.log(`ℹ️ Tournament Head (Pending) updated: ${pendingThUser.email} (ID: ${pendingThUser.atplId})`);
    }

    // 5. Demo tournament / teams / players / match for TH account
    const leagueName = 'ATPL Demo League';
    let tournament = await CricketTournament.findOne({ name: leagueName, createdBy: thUser._id });
    if (!tournament) {
      tournament = await CricketTournament.create({
        name: leagueName,
        description: 'Demo league seeded for admin testing with two teams and one match.',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 86400000 * 10),
        venue: 'ATPL Demo Stadium',
        status: 'UPCOMING',
        format: 'League',
        createdBy: thUser._id,
      });
      console.log(`✅ Demo League created: ${leagueName} (ID: ${tournament._id})`);
    } else {
      tournament.description = 'Demo league seeded for admin testing with two teams and one match.';
      tournament.startDate = new Date(Date.now() + 86400000);
      tournament.endDate = new Date(Date.now() + 86400000 * 10);
      tournament.venue = 'ATPL Demo Stadium';
      tournament.status = 'UPCOMING';
      tournament.format = 'League';
      tournament.createdBy = thUser._id;
      await tournament.save();
      console.log(`ℹ️ Demo League updated: ${leagueName} (ID: ${tournament._id})`);
    }

    const demoPlayers = [
      { email: 'player1@atpl.com', name: 'Arjun Patel', role: 'Batsman', position: 'Top-order', jerseyNumber: 11, team: 'ATPL Angels' },
      { email: 'player2@atpl.com', name: 'Rahul Kumar', role: 'Bowler', position: 'Seamer', jerseyNumber: 18, team: 'ATPL Angels' },
      { email: 'player3@atpl.com', name: 'Samar Joshi', role: 'All-rounder', position: 'Middle-order', jerseyNumber: 7, team: 'ATPL Angels' },
      { email: 'player4@atpl.com', name: 'Nikhil Sharma', role: 'WK', position: 'Wicketkeeper', jerseyNumber: 1, team: 'ATPL Angels' },
      { email: 'player5@atpl.com', name: 'Vikram Singh', role: 'Bowler', position: 'Spinner', jerseyNumber: 22, team: 'ATPL Angels' },
      { email: 'player6@atpl.com', name: 'Karan Mehta', role: 'Batsman', position: 'Opener', jerseyNumber: 3, team: 'ATPL Angels' },
      { email: 'player7@atpl.com', name: 'Aditya Rao', role: 'Batsman', position: 'Opener', jerseyNumber: 9, team: 'ATPL Titans' },
      { email: 'player8@atpl.com', name: 'Rohit Desai', role: 'Bowler', position: 'Seamer', jerseyNumber: 24, team: 'ATPL Titans' },
      { email: 'player9@atpl.com', name: 'Sameer Nair', role: 'All-rounder', position: 'Middle-order', jerseyNumber: 14, team: 'ATPL Titans' },
      { email: 'player10@atpl.com', name: 'Manav Gupta', role: 'WK', position: 'Wicketkeeper', jerseyNumber: 5, team: 'ATPL Titans' },
      { email: 'player11@atpl.com', name: 'Rajat Verma', role: 'Bowler', position: 'Spinner', jerseyNumber: 19, team: 'ATPL Titans' },
      { email: 'player12@atpl.com', name: 'Harsh Patel', role: 'Batsman', position: 'Middle-order', jerseyNumber: 13, team: 'ATPL Titans' },
    ];

    const createdPlayers = [];
    for (const playerData of demoPlayers) {
      let player = await User.findOne({ email: playerData.email });
      if (!player) {
        player = await User.create({
          name: playerData.name,
          email: playerData.email,
          password: 'password123',
          role: 'player',
          status: 'active',
          phone: '900000' + Math.floor(1000 + Math.random() * 9000),
          city: 'Demo City',
          address: 'Demo Street',
          createdBy: thUser._id,
          playerProfile: {
            cricket: {
              name: playerData.name,
              role: playerData.role,
              battingStyle: 'Right-hand bat',
              bowlingStyle: playerData.role === 'Bowler' ? 'Right-arm medium' : 'Right-arm offbreak',
              jerseyNumber: playerData.jerseyNumber,
              currentTeam: playerData.team,
            }
          }
        });
        console.log(`✅ Demo player created: ${player.email}`);
      } else {
        player.name = playerData.name;
        player.role = 'player';
        player.status = 'active';
        player.createdBy = thUser._id;
        player.playerProfile = player.playerProfile || {};
        player.playerProfile.cricket = player.playerProfile.cricket || {};
        player.playerProfile.cricket.name = playerData.name;
        player.playerProfile.cricket.role = playerData.role;
        player.playerProfile.cricket.jerseyNumber = playerData.jerseyNumber;
        player.playerProfile.cricket.currentTeam = playerData.team;
        await player.save();
        console.log(`ℹ️ Demo player updated: ${player.email}`);
      }
      createdPlayers.push({ user: player, ...playerData });
    }

    const teamDefinitions = [
      {
        name: 'ATPL Angels',
        code: 'ANG',
        city: 'Mumbai',
        captainEmail: 'player1@atpl.com',
      },
      {
        name: 'ATPL Titans',
        code: 'TIT',
        city: 'Pune',
        captainEmail: 'player7@atpl.com',
      }
    ];

    const teams = [];
    for (const teamDef of teamDefinitions) {
      const teamPlayers = createdPlayers
        .filter((player) => player.team === teamDef.name)
        .map((player, index) => ({
          user: player.user._id,
          name: player.name,
          role: player.role,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          isCaptain: player.email === teamDef.captainEmail,
          image: '',
        }));

      let team = await CricketTeam.findOne({ code: teamDef.code });
      if (!team) {
        team = await CricketTeam.create({
          name: teamDef.name,
          code: teamDef.code,
          city: teamDef.city,
          captain: teamPlayers.find((player) => player.isCaptain)?.name || 'TBA',
          captainId: teamPlayers.find((player) => player.isCaptain)?.user,
          coach: 'Demo Coach',
          players: teamPlayers,
          playerCount: teamPlayers.length,
          createdBy: thUser._id,
        });
        console.log(`✅ Demo team created: ${team.name} (${team.code})`);
      } else {
        team.name = teamDef.name;
        team.city = teamDef.city;
        team.captain = teamPlayers.find((player) => player.isCaptain)?.name || 'TBA';
        team.captainId = teamPlayers.find((player) => player.isCaptain)?.user;
        team.players = teamPlayers;
        team.playerCount = teamPlayers.length;
        team.createdBy = thUser._id;
        await team.save();
        console.log(`ℹ️ Demo team updated: ${team.name} (${team.code})`);
      }
      teams.push(team);

      if (!tournament.teams.includes(team._id)) {
        tournament.teams.push(team._id);
      }
    }

    await tournament.save();

    const matchTitle = 'ATPL Demo Match 1';
    let match = await CricketMatch.findOne({ title: matchTitle });
    if (!match) {
      match = await CricketMatch.create({
        title: matchTitle,
        series: leagueName,
        venue: 'ATPL Demo Stadium',
        date: new Date(Date.now() + 86400000 * 2),
        status: 'UPCOMING',
        sport: 'cricket',
        matchType: 'League',
        tournamentId: tournament._id,
        teamAId: teams[0]._id,
        teamBId: teams[1]._id,
        teamA: { name: teams[0].name, code: teams[0].code, logo: teams[0].logo },
        teamB: { name: teams[1].name, code: teams[1].code, logo: teams[1].logo },
        teamAPlayers: teams[0].players,
        teamBPlayers: teams[1].players,
        assignedScorer: thUser._id,
        scoreA: { runs: 0, wickets: 0, overs: 0 },
        scoreB: { runs: 0, wickets: 0, overs: 0 },
        target: 0,
        statusText: 'Demo match ready for scoring',
        createdBy: thUser._id,
      });
      console.log(`✅ Demo match created: ${match.title}`);
    } else {
      match.series = leagueName;
      match.venue = 'ATPL Demo Stadium';
      match.date = new Date(Date.now() + 86400000 * 2);
      match.status = 'UPCOMING';
      match.tournamentId = tournament._id;
      match.teamAId = teams[0]._id;
      match.teamBId = teams[1]._id;
      match.teamA = { name: teams[0].name, code: teams[0].code, logo: teams[0].logo };
      match.teamB = { name: teams[1].name, code: teams[1].code, logo: teams[1].logo };
      match.teamAPlayers = teams[0].players;
      match.teamBPlayers = teams[1].players;
      match.assignedScorer = thUser._id;
      match.scoreA = { runs: 0, wickets: 0, overs: 0 };
      match.scoreB = { runs: 0, wickets: 0, overs: 0 };
      match.target = 0;
      match.statusText = 'Demo match ready for scoring';
      match.createdBy = thUser._id;
      await match.save();
      console.log(`ℹ️ Demo match updated: ${match.title}`);
    }

    if (!tournament.matches.includes(match._id)) {
      tournament.matches.push(match._id);
      await tournament.save();
    }

    // 6. Dummy register league for TH account (admin testing)
    const dummyLeagueName = 'ATPL Dummy League';
    let dummyTournament = await CricketTournament.findOne({ name: dummyLeagueName, createdBy: thUser._id });
    if (!dummyTournament) {
      dummyTournament = await CricketTournament.create({
        name: dummyLeagueName,
        description: 'Dummy league seeded for admin testing (register + matches).',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 86400000 * 12),
        venue: 'ATPL Dummy Stadium',
        status: 'UPCOMING',
        format: 'League',
        createdBy: thUser._id,
      });
      console.log(`✅ Dummy League created: ${dummyLeagueName} (ID: ${dummyTournament._id})`);
    } else {
      dummyTournament.description = 'Dummy league seeded for admin testing (register + matches).';
      dummyTournament.startDate = new Date(Date.now() + 86400000);
      dummyTournament.endDate = new Date(Date.now() + 86400000 * 12);
      dummyTournament.venue = 'ATPL Dummy Stadium';
      dummyTournament.status = 'UPCOMING';
      dummyTournament.format = 'League';
      dummyTournament.createdBy = thUser._id;
      await dummyTournament.save();
      console.log(`ℹ️ Dummy League updated: ${dummyLeagueName} (ID: ${dummyTournament._id})`);
    }

    const dummyTeamDefinitions = [
      {
        name: 'ATPL Dummy Team A',
        code: 'DUMA',
        city: 'Chennai',
        captainEmail: 'player1@atpl.com',
      },
      {
        name: 'ATPL Dummy Team B',
        code: 'DUMB',
        city: 'Hyderabad',
        captainEmail: 'player7@atpl.com',
      },
    ];

    const dummyTeams = [];
    for (const teamDef of dummyTeamDefinitions) {
      const teamPlayers = createdPlayers
        .filter((player) => player.team === 'ATPL Angels' || player.team === 'ATPL Titans')
        .map((player) => {
          // Ensure `position` exists from playerData.position
          const position = player.position || 'Top-order';
          return {
            user: player.user._id,
            name: player.name,
            role: player.role,
            position,
            jerseyNumber: player.jerseyNumber,
            isCaptain: player.email === teamDef.captainEmail,
            image: '',
          };
        })
        .slice(0, 6);

      // Guarantee at least 6 players per team for admin screens
      const teamPlayersFinal = teamPlayers.length >= 6 ? teamPlayers : teamPlayers;

      let team = await CricketTeam.findOne({ code: teamDef.code });
      if (!team) {
        team = await CricketTeam.create({
          name: teamDef.name,
          code: teamDef.code,
          city: teamDef.city,
          captain: teamPlayersFinal.find((p) => p.isCaptain)?.name || 'TBA',
          captainId: teamPlayersFinal.find((p) => p.isCaptain)?.user,
          coach: 'Dummy Coach',
          players: teamPlayersFinal,
          playerCount: teamPlayersFinal.length,
          createdBy: thUser._id,
        });
        console.log(`✅ Dummy team created: ${team.name} (${team.code})`);
      } else {
        team.name = teamDef.name;
        team.city = teamDef.city;
        team.captain = teamPlayersFinal.find((p) => p.isCaptain)?.name || 'TBA';
        team.captainId = teamPlayersFinal.find((p) => p.isCaptain)?.user;
        team.players = teamPlayersFinal;
        team.playerCount = teamPlayersFinal.length;
        team.createdBy = thUser._id;
        await team.save();
        console.log(`ℹ️ Dummy team updated: ${team.name} (${team.code})`);
      }

      dummyTeams.push(team);
      if (!dummyTournament.teams.includes(team._id)) {
        dummyTournament.teams.push(team._id);
      }
    }
    await dummyTournament.save();

    const dummyMatchTitle = 'ATPL Dummy Match 1';
    let dummyMatch = await CricketMatch.findOne({ title: dummyMatchTitle });
    if (!dummyMatch) {
      dummyMatch = await CricketMatch.create({
        title: dummyMatchTitle,
        series: dummyLeagueName,
        venue: 'ATPL Dummy Stadium',
        date: new Date(Date.now() + 86400000 * 3),
        status: 'UPCOMING',
        sport: 'cricket',
        matchType: 'League',
        tournamentId: dummyTournament._id,
        teamAId: dummyTeams[0]._id,
        teamBId: dummyTeams[1]._id,
        teamA: { name: dummyTeams[0].name, code: dummyTeams[0].code, logo: dummyTeams[0].logo },
        teamB: { name: dummyTeams[1].name, code: dummyTeams[1].code, logo: dummyTeams[1].logo },
        teamAPlayers: dummyTeams[0].players,
        teamBPlayers: dummyTeams[1].players,
        assignedScorer: thUser._id,
        scoreA: { runs: 0, wickets: 0, overs: 0 },
        scoreB: { runs: 0, wickets: 0, overs: 0 },
        target: 0,
        statusText: 'Dummy match ready for scoring',
        createdBy: thUser._id,
      });
      console.log(`✅ Dummy match created: ${dummyMatch.title}`);
    } else {
      dummyMatch.series = dummyLeagueName;
      dummyMatch.venue = 'ATPL Dummy Stadium';
      dummyMatch.date = new Date(Date.now() + 86400000 * 3);
      dummyMatch.status = 'UPCOMING';
      dummyMatch.tournamentId = dummyTournament._id;
      dummyMatch.teamAId = dummyTeams[0]._id;
      dummyMatch.teamBId = dummyTeams[1]._id;
      dummyMatch.teamA = { name: dummyTeams[0].name, code: dummyTeams[0].code, logo: dummyTeams[0].logo };
      dummyMatch.teamB = { name: dummyTeams[1].name, code: dummyTeams[1].code, logo: dummyTeams[1].logo };
      dummyMatch.teamAPlayers = dummyTeams[0].players;
      dummyMatch.teamBPlayers = dummyTeams[1].players;
      dummyMatch.assignedScorer = thUser._id;
      dummyMatch.scoreA = { runs: 0, wickets: 0, overs: 0 };
      dummyMatch.scoreB = { runs: 0, wickets: 0, overs: 0 };
      dummyMatch.target = 0;
      dummyMatch.statusText = 'Dummy match ready for scoring';
      dummyMatch.createdBy = thUser._id;
      await dummyMatch.save();
      console.log(`ℹ️ Dummy match updated: ${dummyMatch.title}`);
    }

    if (!dummyTournament.matches.includes(dummyMatch._id)) {
      dummyTournament.matches.push(dummyMatch._id);
      await dummyTournament.save();
    }

    console.log('Seeding successfully completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding accounts:', error);
    process.exit(1);
  }
})();
