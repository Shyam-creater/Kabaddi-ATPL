const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User.model');
const CricketTournament = require('./src/models/cricket/Tournament.model');
const CricketTeam = require('./src/models/cricket/Team.model');
const CricketMatch = require('./src/models/cricket/Match.model');
const PlayerRegistration = require('./src/models/PlayerRegistration.model');

async function seedHarshPatel() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/atpl_score');
        console.log('✅ Connected to MongoDB');

        // Check if player already exists
        let player = await User.findOne({ email: 'player12@atpl.com' });
        
        if (player) {
            console.log('ℹ️ Player already exists, updating...');
            await User.deleteOne({ email: 'player12@atpl.com' });
        }

        // Create Harsh Patel User
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        player = new User({
            atplId: 'ATPL_013',
            name: 'Harsh Patel',
            email: 'player12@atpl.com',
            password: hashedPassword,
            role: 'player',
            gender: 'Male',
            phone: '+91-98765-43210',
            city: 'Mumbai',
            state: 'Maharashtra',
            address: 'Bandra, Mumbai',
            sports: ['cricket'],
            dob: new Date('1995-05-15'),
            status: 'active',
            profilePicture: 'https://via.placeholder.com/150?text=HP',
            
            // Cricket Player Profile
            playerProfile: {
                cricket: {
                    name: 'Harsh Patel',
                    nickname: 'Harsh',
                    role: 'All-rounder',
                    battingStyle: 'Right-handed',
                    bowlingStyle: 'Right-arm Fast-medium',
                    jerseyNumber: 13,
                    country: 'India',
                    state: 'Maharashtra',
                    currentTeam: 'Mumbai Warriors',
                    
                    careerSummary: {
                        totalMatches: 42,
                        totalRuns: 1850,
                        totalWickets: 28,
                        highestScore: 98,
                        battingAverage: 44.04,
                        strikeRate: 142.31,
                        economyRate: 8.25,
                        centuries: 0,
                        halfCenturies: 6
                    },
                    
                    formatStats: [
                        {
                            format: 'T20',
                            matches: 42,
                            innings: 40,
                            runs: 1850,
                            highestScore: 98,
                            average: 46.25,
                            strikeRate: 142.31,
                            wickets: 28,
                            economy: 8.25
                        }
                    ],
                    
                    leagueHistory: [
                        {
                            leagueName: 'ATPL T20 League 2024',
                            teamName: 'Mumbai Warriors',
                            season: '2024',
                            matches: 14,
                            runs: 625,
                            highestScore: 98,
                            strikeRate: 145.35,
                            wickets: 8,
                            economy: 7.85
                        },
                        {
                            leagueName: 'ATPL T20 League 2023',
                            teamName: 'Delhi Titans',
                            season: '2023',
                            matches: 16,
                            runs: 720,
                            highestScore: 87,
                            strikeRate: 140.23,
                            wickets: 12,
                            economy: 8.50
                        },
                        {
                            leagueName: 'ATPL T20 Champions Cup 2024',
                            teamName: 'Mumbai Warriors',
                            season: '2024',
                            matches: 12,
                            runs: 505,
                            highestScore: 78,
                            strikeRate: 140.28,
                            wickets: 8,
                            economy: 8.75
                        }
                    ],
                    
                    achievements: [
                        {
                            title: 'Leading Run Scorer',
                            year: '2024',
                            description: 'Top scorer in ATPL T20 League 2024'
                        },
                        {
                            title: 'Best All-rounder',
                            year: '2024',
                            description: 'Best All-rounder Award in Champions Cup 2024'
                        },
                        {
                            title: 'Most Wickets',
                            year: '2023',
                            description: 'Took highest wickets in Delhi Titans campaign'
                        }
                    ]
                }
            }
        });

        const savedPlayer = await player.save();
        console.log('✅ Player created:', savedPlayer._id);

        // Create Sample Tournaments
        let tournament1 = await CricketTournament.findOne({ name: 'ATPL T20 League 2024' });
        if (!tournament1) {
            tournament1 = new CricketTournament({
                name: 'ATPL T20 League 2024',
                description: 'ATPL Twenty20 League Season 2024',
                year: 2024,
                season: 'Summer',
                format: 'T20',
                status: 'COMPLETED',
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-05-31'),
                createdBy: savedPlayer._id,
                rounds: 4,
                matches: 60,
                completed: 60
            });
            tournament1 = await tournament1.save();
            console.log('✅ Tournament 1 created');
        }

        let tournament2 = await CricketTournament.findOne({ name: 'ATPL T20 League 2023' });
        if (!tournament2) {
            tournament2 = new CricketTournament({
                name: 'ATPL T20 League 2023',
                description: 'ATPL Twenty20 League Season 2023',
                year: 2023,
                season: 'Summer',
                format: 'T20',
                status: 'COMPLETED',
                startDate: new Date('2023-03-01'),
                endDate: new Date('2023-05-31'),
                createdBy: savedPlayer._id,
                rounds: 4,
                matches: 56,
                completed: 56
            });
            tournament2 = await tournament2.save();
            console.log('✅ Tournament 2 created');
        }

        // Create Sample Teams
        let team1 = await CricketTeam.findOne({ name: 'Mumbai Warriors' });
        if (!team1) {
            team1 = new CricketTeam({
                name: 'Mumbai Warriors',
                code: 'MW',
                city: 'Mumbai',
                captain: 'Harsh Patel',
                captainId: savedPlayer._id,
                matchesPlayed: 26,
                won: 16,
                lost: 9,
                draw: 1,
                points: 33,
                nrr: 0.456,
                players: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        position: 'Middle Order',
                        jerseyNumber: 13,
                        isCaptain: true
                    }
                ],
                playerCount: 15,
                createdBy: savedPlayer._id
            });
            team1 = await team1.save();
            console.log('✅ Team 1 created');
        }

        let team2 = await CricketTeam.findOne({ name: 'Delhi Titans' });
        if (!team2) {
            team2 = new CricketTeam({
                name: 'Delhi Titans',
                code: 'DT',
                city: 'Delhi',
                captain: 'Harsh Patel',
                captainId: savedPlayer._id,
                matchesPlayed: 16,
                won: 10,
                lost: 6,
                draw: 0,
                points: 20,
                nrr: 0.234,
                players: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        position: 'Middle Order',
                        jerseyNumber: 7,
                        isCaptain: true
                    }
                ],
                playerCount: 14,
                createdBy: savedPlayer._id
            });
            team2 = await team2.save();
            console.log('✅ Team 2 created');
        }

        // Create Sample Matches
        const matches = [
            {
                title: 'Mumbai Warriors vs Delhi Titans',
                tournament: tournament1._id,
                teamA: { name: 'Mumbai Warriors', code: 'MW' },
                teamB: { name: 'Delhi Titans', code: 'DT' },
                teamAId: team1._id,
                teamBId: team2._id,
                date: new Date('2024-03-15'),
                status: 'COMPLETED',
                matchType: 'League',
                venue: 'Wankhede Stadium, Mumbai',
                scoreA: { runs: 156, wickets: 7, overs: 20 },
                scoreB: { runs: 142, wickets: 8, overs: 20 },
                teamAPlayers: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        jerseyNumber: 13
                    }
                ],
                teamBPlayers: [],
                matchDetails: {
                    playerStats: {
                        runs: 42,
                        ballsFaced: 32,
                        fours: 4,
                        sixes: 2,
                        wickets: 1,
                        overs: 2.5,
                        runsConceded: 22,
                        maidens: 0,
                        dots: 8,
                        strikeRate: 131.25,
                        economyRate: 7.71
                    },
                    ballByBall: ['4', '1', '.', '6', '2', '1', '4', '.', '1', '4', '1', '1', '2', '.', '6', '.', '1', '.', '2', '.', '.', '1', '.', '4', '1', '1', '.', '1', '.', '1', '2', 'W'],
                    instantScore: 78,
                    performanceGrade: 'A',
                    realTimeEnter: {
                        target: 156,
                        side: 'A',
                        current: { runs: 42, wickets: 1, balls: 32, overs: 2.5 },
                        events: {
                            wicketEvents: [
                                { ballNo: 30, type: 'WICKET', wicketKind: 'BEST_EFFORT', runsAtWicket: 42 }
                            ],
                            runEvents: {
                                dots: 8,
                                boundaries: 6
                            }
                        }
                    }
                }
            },
            {
                title: 'Mumbai Warriors vs Chennai Kings',
                tournament: tournament1._id,
                teamA: { name: 'Mumbai Warriors', code: 'MW' },
                teamB: { name: 'Chennai Kings', code: 'CK' },
                teamAId: team1._id,
                date: new Date('2024-03-20'),
                status: 'COMPLETED',
                matchType: 'League',
                venue: 'MA Chidambaram Stadium, Chennai',
                scoreA: { runs: 178, wickets: 6, overs: 20 },
                scoreB: { runs: 165, wickets: 9, overs: 20 },
                teamAPlayers: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        jerseyNumber: 13
                    }
                ],
                matchDetails: {
                    playerStats: {
                        runs: 58,
                        ballsFaced: 38,
                        fours: 5,
                        sixes: 3,
                        wickets: 0,
                        overs: 2.0,
                        runsConceded: 18,
                        maidens: 1,
                        dots: 10,
                        strikeRate: 152.63,
                        economyRate: 9.0
                    },
                    ballByBall: ['6', '1', '4', '.', '.', '6', '1', '2', '4', '.', '1', '4', '.', '2', '1', '.', '6', '.', '1', '4', '.', '.', '1', '2', '.', '.', '1', '4', '.', '1', '.', '2', '.', '.', '1', '.', '1', '.', 'W'],
                    instantScore: 85,
                    performanceGrade: 'A+',
                    realTimeEnter: {
                        target: 178,
                        side: 'A',
                        current: { runs: 58, wickets: 0, balls: 38, overs: 2.0 },
                        events: {
                            wicketEvents: [],
                            runEvents: {
                                dots: 10,
                                boundaries: 8
                            }
                        }
                    }
                }
            },
            {
                title: 'Mumbai Warriors vs Bangalore Blasters',
                tournament: tournament1._id,
                teamA: { name: 'Mumbai Warriors', code: 'MW' },
                teamB: { name: 'Bangalore Blasters', code: 'BB' },
                teamAId: team1._id,
                date: new Date('2024-04-05'),
                status: 'COMPLETED',
                matchType: 'League',
                venue: 'Arun Jaitley Stadium, Delhi',
                scoreA: { runs: 165, wickets: 5, overs: 20 },
                scoreB: { runs: 152, wickets: 8, overs: 20 },
                teamAPlayers: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        jerseyNumber: 13
                    }
                ],
                matchDetails: {
                    playerStats: {
                        runs: 45,
                        ballsFaced: 28,
                        fours: 3,
                        sixes: 2,
                        wickets: 2,
                        overs: 3.0,
                        runsConceded: 26,
                        maidens: 0,
                        dots: 12,
                        strikeRate: 160.71,
                        economyRate: 8.67
                    },
                    ballByBall: ['1', '.', '4', '6', '.', '.', '1', '4', '.', '1', '.', '2', '.', '1', '6', '.', '4', '.', '.', '1', '.', '2', '1', '.', 'W', '.', '1', '.', '.', '2', '.', '.', '.', '1', 'W', '.', '.', '1'],
                    instantScore: 72,
                    performanceGrade: 'B+',
                    realTimeEnter: {
                        target: 165,
                        side: 'A',
                        current: { runs: 45, wickets: 2, balls: 28, overs: 3.0 },
                        events: {
                            wicketEvents: [
                                { ballNo: 23, type: 'WICKET', wicketKind: 'BEST_EFFORT', runsAtWicket: 31 },
                                { ballNo: 32, type: 'WICKET', wicketKind: 'BEST_EFFORT', runsAtWicket: 45 }
                            ],
                            runEvents: {
                                dots: 12,
                                boundaries: 5
                            }
                        }
                    }
                }
            },
            {
                title: 'Delhi Titans vs Punjab Stars',
                tournament: tournament2._id,
                teamA: { name: 'Delhi Titans', code: 'DT' },
                teamB: { name: 'Punjab Stars', code: 'PS' },
                teamAId: team2._id,
                date: new Date('2023-03-25'),
                status: 'COMPLETED',
                matchType: 'League',
                venue: 'Arun Jaitley Stadium, Delhi',
                scoreA: { runs: 168, wickets: 5, overs: 20 },
                scoreB: { runs: 145, wickets: 9, overs: 20 },
                teamAPlayers: [
                    {
                        user: savedPlayer._id,
                        name: 'Harsh Patel',
                        role: 'All-rounder',
                        jerseyNumber: 7
                    }
                ],
                matchDetails: {
                    playerStats: {
                        runs: 52,
                        ballsFaced: 35,
                        fours: 4,
                        sixes: 2,
                        wickets: 1,
                        overs: 3.2,
                        runsConceded: 29,
                        maidens: 0,
                        dots: 14,
                        strikeRate: 148.57,
                        economyRate: 8.7
                    },
                    ballByBall: ['1', '.', '4', '.', '1', '6', '.', '2', '1', '.', '4', '.', '.', '1', '6', '.', '1', '4', '.', '2', '1', '.', '.', '1', '2', '.', '.', '1', '.', 'W', '.', '1', '.', '2', '.', '.', '1'],
                    instantScore: 76,
                    performanceGrade: 'A-',
                    realTimeEnter: {
                        target: 168,
                        side: 'A',
                        current: { runs: 52, wickets: 1, balls: 35, overs: 3.2 },
                        events: {
                            wicketEvents: [
                                { ballNo: 27, type: 'WICKET', wicketKind: 'BEST_EFFORT', runsAtWicket: 52 }
                            ],
                            runEvents: {
                                dots: 14,
                                boundaries: 6
                            }
                        }
                    }
                }
            }
        ];

        for (const match of matches) {
            const existingMatch = await CricketMatch.findOne({ 
                title: match.title, 
                date: match.date 
            });
            if (!existingMatch) {
                await CricketMatch.create(match);
            }
        }
        console.log('✅ Sample matches created');

        // Register player in tournaments
        const reg1 = await PlayerRegistration.findOne({
            userId: savedPlayer._id,
            tournamentId: tournament1._id
        });
        
        if (!reg1) {
            await PlayerRegistration.create({
                userId: savedPlayer._id,
                tournamentId: tournament1._id,
                tournamentModel: 'CricketTournament',
                sport: 'cricket',
                fullName: 'Harsh Patel',
                email: 'player12@atpl.com',
                phone: '+91-98765-43210',
                paymentScreenshot: 'payment.jpg',
                paymentAmount: 500,
                agreedToTerms: true,
                status: 'APPROVED'
            });
        }

        const reg2 = await PlayerRegistration.findOne({
            userId: savedPlayer._id,
            tournamentId: tournament2._id
        });
        
        if (!reg2) {
            await PlayerRegistration.create({
                userId: savedPlayer._id,
                tournamentId: tournament2._id,
                tournamentModel: 'CricketTournament',
                sport: 'cricket',
                fullName: 'Harsh Patel',
                email: 'player12@atpl.com',
                phone: '+91-98765-43210',
                paymentScreenshot: 'payment.jpg',
                paymentAmount: 500,
                agreedToTerms: true,
                status: 'APPROVED'
            });
        }
        console.log('✅ Player registrations created');

        console.log('\n✅ Seed script completed successfully!');
        console.log('Player ATPL ID:', savedPlayer.atplId);
        console.log('Player Email:', savedPlayer.email);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB disconnected');
    }
}

// Run seed 
seedHarshPatel();
