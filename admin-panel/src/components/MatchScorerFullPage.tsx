
import { useState, useMemo } from 'react';
import { ArrowLeft, AlertTriangle, Shield, RotateCcw, Trash2, MapPin, Award, Activity, Save } from 'lucide-react';
import type { Match } from '../services/matchService';
import { updateMatch } from '../services/matchService';

interface MatchScorerFullPageProps {
    match: Match;
    onBack: () => void;
    onRefresh: () => void;
    isScorer: boolean;
    // userRole is not required for scorer functionality right now
    userRole?: string;
}


function getAutoBattingSide(m: Match): 'A' | 'B' {
    if (m.statusText?.toLowerCase().includes(m.teamB.code.toLowerCase())) return 'B';
    if (m.statusText?.toLowerCase().includes(m.teamA.code.toLowerCase())) return 'A';

    if (m.tossWinner && m.tossDecision) {
        const teamABattingFirst = 
            (m.tossWinner === m.teamA.code && m.tossDecision === 'bat') ||
            (m.tossWinner === m.teamB.code && m.tossDecision === 'bowl');
        
        const isFirstInnings = !(m.target && m.target > 0);
        if (isFirstInnings) {
            return teamABattingFirst ? 'A' : 'B';
        } else {
            return teamABattingFirst ? 'B' : 'A';
        }
    }

    if ((m.scoreB?.overs || 0) > 0 && !(m.scoreA?.overs || 0)) return 'B';

    return 'A';
}

function calculateEconomy(runs: number, overs: number): string {
    if (!overs) return '0.00';
    const balls = Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
    if (balls === 0) return '0.00';
    return ((runs / balls) * 6).toFixed(2);
}

const KABADDI_STATS = [
    { label: 'Raid', field: 'raidPoints' },
    { label: 'Tackle', field: 'tacklePoints' },
    { label: 'Bonus', field: 'bonusPoints' },
    { label: 'Super Tackle', field: 'superTackles' }
];

export default function MatchScorerFullPage({ match, onBack, onRefresh, isScorer }: MatchScorerFullPageProps) {
    const [activeTab, setActiveTab] = useState<'scorecard' | 'commentary' | 'settings' | 'manual'>('scorecard');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Scorer States
    const [battingSide, setBattingSide] = useState<'A' | 'B'>(() => getAutoBattingSide(match));
    
    const [strikerName, setStrikerName] = useState<string>(() => {
        const striker = match.currentBatters?.find(b => b.isStriker);
        return striker?.name || '';
    });
    
    const [nonStrikerName, setNonStrikerName] = useState<string>(() => {
        const nonStriker = match.currentBatters?.find(b => !b.isStriker);
        return nonStriker?.name || '';
    });
    
    const [bowlerName, setBowlerName] = useState<string>(() => {
        return match.currentBowler?.name || '';
    });

    // Ball-by-ball Form States
    const [runsInput, setRunsInput] = useState<number>(0);
    const [isWide, setIsWide] = useState(false);
    const [isNoBall, setIsNoBall] = useState(false);
    const [isBye, setIsBye] = useState(false);
    const [isLegBye, setIsLegBye] = useState(false);
    const [extraRuns, setExtraRuns] = useState<number>(0);
    
    // Wicket Sub-form
    const [isWicket, setIsWicket] = useState(false);
    const [wicketType, setWicketType] = useState<string>('Bowled');
    const [dismissedBatter, setDismissedBatter] = useState<string>('Striker'); // 'Striker' | 'Non-Striker'
    const [fielderName, setFielderName] = useState<string>('');

    // Commentary text
    const [ballCommentary, setBallCommentary] = useState<string>('');

    // Non-cricket Event Form (Football / Kabaddi)
    const [genericEventTime, setGenericEventTime] = useState<string>('00:00');
    const [genericEventType, setGenericEventType] = useState<string>('Commentary');
    const [genericEventDesc, setGenericEventDesc] = useState<string>('');

    // Settings States
    const [tossWinner, setTossWinner] = useState(match.tossWinner || '');
    const [tossDecision, setTossDecision] = useState(match.tossDecision || 'bat');
    const [oversLimit, setOversLimit] = useState(match.oversLimit || 20);
    const [targetRuns, setTargetRuns] = useState(match.target || 0);

    // Video / Streaming States
    // Video fields kept for compatibility; not used in this admin scorer page version
    // videoType kept only for compatibility (not used in this scorer page UI)
    const [videoType] = useState<'live' | 'preview' | 'recorded'>('recorded');
    void videoType;










    // Scorer Undo History Stack
    const [history, setHistory] = useState<any[]>([]);

    // Roster Helpers
    const battingSquad = useMemo(() => {
        return battingSide === 'A' ? (match.teamAPlayers || []) : (match.teamBPlayers || []);
    }, [battingSide, match]);

    const bowlingSquad = useMemo(() => {
        return battingSide === 'A' ? (match.teamBPlayers || []) : (match.teamAPlayers || []);
    }, [battingSide, match]);

    // Filtered available batsmen (not out and not already on field)
    const availableBatsmen = useMemo(() => {
        const outBatsmen = (match.battingLineup || [])
            .filter(b => b.status === 'Out')
            .map(b => b.name);
        
        return battingSquad.filter(player => {
            const name = player.name || '';
            if (outBatsmen.includes(name)) return false;
            return true;
        });
    }, [battingSquad, match.battingLineup]);

    // Active Batting / Bowling team details
    const batTeam = battingSide === 'A' ? match.teamA : match.teamB;
    const bowlTeam = battingSide === 'A' ? match.teamB : match.teamA;
    const scoreBat = battingSide === 'A' ? (match.scoreA || { runs: 0, wickets: 0, overs: 0 }) : (match.scoreB || { runs: 0, wickets: 0, overs: 0 });

    const excludedBowlerName = useMemo(() => {
        const currentBalls = oversToBalls(scoreBat?.overs || 0);
        if (currentBalls > 0 && currentBalls % 6 === 0) {
            const lastBallComm = (match.commentary || []).find(c => 
                c.innings === battingSide || 
                (c.innings === undefined && c.over === (currentBalls / 6 - 1))
            );
            return lastBallComm?.bowler || '';
        }
        return '';
    }, [match.commentary, scoreBat?.overs, battingSide]);

    const yetToBatPlayers = useMemo(() => {
        const battedNames = (match.battingLineup || []).map(b => b.name);
        return battingSquad
            .filter(p => p.name && !battedNames.includes(p.name))
            .map(p => p.name);
    }, [battingSquad, match.battingLineup]);


    // CRICKET SCORING HELPER - SUBMIT BALL
    const handleRecordBall = async () => {
        if (!strikerName) {
            alert('Please select the active Striker first.');
            return;
        }
        if (!nonStrikerName) {
            alert('Please select the Non-Striker.');
            return;
        }
        if (!bowlerName) {
            alert('Please select the active Bowler.');
            return;
        }

        // Push current match state into history for undo support
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(match))]);

        // Deep copy match to prepare update
        const nextMatch = JSON.parse(JSON.stringify(match)) as Match;

        // Initialize score structures safely
        const initScore = (s: any) => {
            return {
                runs: Number(s?.runs) || 0,
                wickets: Number(s?.wickets) || 0,
                overs: Number(s?.overs) || 0,
                extras: Number(s?.extras) || 0,
                wides: Number(s?.wides) || 0,
                noballs: Number(s?.noballs) || 0,
                byes: Number(s?.byes) || 0,
                legbyes: Number(s?.legbyes) || 0,
            };
        };

        const currentBatScore = initScore(batSideScore());
        const otherScore = initScore(bowlSideScore());

        // Runs calculation
        const isLegal = !isWide && !isNoBall;
        let runPenalties = 0;
        let batRuns = 0;
        let extraRunsAdded = 0;

        if (isWide) {
            runPenalties = 1;
            extraRunsAdded = 1 + extraRuns;
            currentBatScore.wides += extraRunsAdded;
        } else if (isNoBall) {
            runPenalties = 1;
            extraRunsAdded = 1;
            currentBatScore.noballs += 1;
            if (isBye || isLegBye) {
                extraRunsAdded += extraRuns;
                if (isBye) currentBatScore.byes += extraRuns;
                if (isLegBye) currentBatScore.legbyes += extraRuns;
            } else {
                batRuns = runsInput;
            }
        } else {
            // Legal ball
            if (isBye || isLegBye) {
                extraRunsAdded = runsInput;
                if (isBye) currentBatScore.byes += runsInput;
                if (isLegBye) currentBatScore.legbyes += runsInput;
            } else {
                batRuns = runsInput;
            }
        }

        const totalRunsThisBall = runPenalties + batRuns + extraRunsAdded;
        currentBatScore.runs += totalRunsThisBall;
        currentBatScore.extras += (runPenalties + extraRunsAdded);

        // Calculate Overs and Balls
        let currentBalls = oversToBalls(currentBatScore.overs);
        if (isLegal) {
            currentBalls += 1;
            currentBatScore.overs = ballsToOvers(currentBalls);
        }

        // Initialize lists if undefined
        if (!nextMatch.battingLineup) nextMatch.battingLineup = [];
        if (!nextMatch.bowlingLineup) nextMatch.bowlingLineup = [];
        if (!nextMatch.commentary) nextMatch.commentary = [];

        // Dynamic Batsman Stat Update
        let strikerStat = nextMatch.battingLineup.find(b => b.name === strikerName);
        if (!strikerStat) {
            strikerStat = {
                name: strikerName,
                position: String(nextMatch.battingLineup.length + 1),
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                status: 'Batting'
            };
            nextMatch.battingLineup.push(strikerStat);
        }

        let nonStrikerStat = nextMatch.battingLineup.find(b => b.name === nonStrikerName);
        if (!nonStrikerStat) {
            nonStrikerStat = {
                name: nonStrikerName,
                position: String(nextMatch.battingLineup.length + 1),
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                status: 'Batting'
            };
            nextMatch.battingLineup.push(nonStrikerStat);
        }

        if (!isWide) {
            strikerStat.balls = (strikerStat.balls || 0) + 1;
            if (!isBye && !isLegBye) {
                strikerStat.runs = (strikerStat.runs || 0) + batRuns;
                if (batRuns === 4) strikerStat.fours = (strikerStat.fours || 0) + 1;
                if (batRuns === 6) strikerStat.sixes = (strikerStat.sixes || 0) + 1;
            }
        }

        // Dynamic Bowler Stat Update
        let bowlerStat = nextMatch.bowlingLineup.find(b => b.name === bowlerName);
        if (!bowlerStat) {
            bowlerStat = {
                name: bowlerName,
                overs: 0,
                maidens: 0,
                runs: 0,
                wickets: 0,
                wides: 0,
                noballs: 0
            };
            nextMatch.bowlingLineup.push(bowlerStat);
        }

        if (isLegal) {
            const bBalls = oversToBalls(bowlerStat.overs || 0) + 1;
            bowlerStat.overs = ballsToOvers(bBalls);
        }

        // Bowler runs concession
        if (!isBye && !isLegBye) {
            bowlerStat.runs = (bowlerStat.runs || 0) + totalRunsThisBall;
        } else if (isNoBall) {
            // Charges 1 run for no ball penalty to bowler
            bowlerStat.runs = (bowlerStat.runs || 0) + 1;
        }

        if (isWide) {
            bowlerStat.wides = (bowlerStat.wides || 0) + 1 + extraRuns;
        }
        if (isNoBall) {
            bowlerStat.noballs = (bowlerStat.noballs || 0) + 1;
        }

        // Wicket Processing
        let wicketDesc = '';
        let outBatterName = '';
        
        if (isWicket) {
            currentBatScore.wickets += 1;
            
            // Determine who got dismissed
            outBatterName = dismissedBatter === 'Striker' ? strikerName : nonStrikerName;
            const dismissedStat = outBatterName === strikerName ? strikerStat : nonStrikerStat;
            dismissedStat.status = 'Out';

            if (wicketType !== 'Run Out' && wicketType !== 'Retired Hurt') {
                bowlerStat.wickets = (bowlerStat.wickets || 0) + 1;
            }

            // Create dismissal text
            if (wicketType === 'Bowled') {
                wicketDesc = `b ${bowlerName}`;
            } else if (wicketType === 'Caught') {
                wicketDesc = fielderName ? `c ${fielderName} b ${bowlerName}` : `c b ${bowlerName}`;
            } else if (wicketType === 'LBW') {
                wicketDesc = `lbw b ${bowlerName}`;
            } else if (wicketType === 'Stumped') {
                wicketDesc = fielderName ? `st ${fielderName} b ${bowlerName}` : `st b ${bowlerName}`;
            } else if (wicketType === 'Run Out') {
                wicketDesc = fielderName ? `run out (${fielderName})` : `run out`;
            } else if (wicketType === 'Retired Hurt') {
                wicketDesc = `retired hurt`;
            }
            dismissedStat.dismissal = wicketDesc;

            // Remove/Clear from active batter selectors
            if (outBatterName === strikerName) {
                setStrikerName('');
            } else {
                setNonStrikerName('');
            }
        }

        // Rotate Striker
        let nextStriker = strikerName;
        let nextNonStriker = nonStrikerName;

        if (!isWicket) {
            const rotRuns = (isBye || isLegBye) ? extraRunsAdded : (isWide ? extraRuns : batRuns);
            if (rotRuns % 2 !== 0) {
                nextStriker = nonStrikerName;
                nextNonStriker = strikerName;
                setStrikerName(nextStriker);
                setNonStrikerName(nextNonStriker);
            }
        } else {
            // Striker is dismissed
            if (outBatterName === strikerName) {
                nextStriker = '';
            } else {
                nextNonStriker = '';
            }
        }

        // Bowler runs on this ball (charges bowler for batRuns, wides, and noball penalties, but not byes/legbyes)
        const bowlerRunsThisBall = (!isBye && !isLegBye) ? totalRunsThisBall : (isNoBall ? 1 : 0);

        // Construct Commentary Text
        let commentDesc = ballCommentary.trim();
        if (!commentDesc) {
            commentDesc = `${bowlerName} to ${strikerName}, `;
            if (isWicket) {
                commentDesc += `OUT! ${outBatterName} is out (${wicketType} - ${wicketDesc})`;
            } else if (isWide) {
                commentDesc += `${totalRunsThisBall} Wide(s)`;
            } else if (isNoBall) {
                commentDesc += `No Ball, ${runsInput} run(s)`;
            } else {
                commentDesc += `${runsInput} run(s)`;
            }
        }

        // Unshift the commentary first so it can be scanned for maiden over calculations
        nextMatch.commentary.unshift({
            over: Math.floor((currentBalls - (isLegal ? 1 : 0)) / 6),
            ball: (currentBalls - (isLegal ? 1 : 0)) % 6 + (isLegal ? 1 : 0),
            runs: totalRunsThisBall,
            bowlerRuns: bowlerRunsThisBall,
            bowler: bowlerName,
            innings: battingSide,
            event: isWicket ? 'wicket' : isWide || isNoBall ? 'extra' : runsInput === 4 ? 'four' : runsInput === 6 ? 'six' : runsInput === 0 ? 'dot' : 'run',
            description: commentDesc,
            timestamp: new Date().toISOString()
        });

        // End of Over rotation (6 legal balls)
        const isOverComplete = isLegal && (currentBalls % 6 === 0);
        if (isOverComplete) {
            // Calculate if it was a maiden over (sum of bowlerRuns in current over is 0)
            const currentOverNum = Math.floor((currentBalls - 1) / 6);
            const overBalls = nextMatch.commentary.filter(c => c.over === currentOverNum && c.innings === battingSide);
            const runsConcededInOver = overBalls.reduce((sum, c) => sum + (c.bowlerRuns || 0), 0);
            if (runsConcededInOver === 0) {
                bowlerStat.maidens = (bowlerStat.maidens || 0) + 1;
            }

            // Swap striker and non striker
            const temp = nextStriker;
            nextStriker = nextNonStriker;
            nextNonStriker = temp;
            setStrikerName(nextStriker);
            setNonStrikerName(nextNonStriker);
            
            setBowlerName(''); // Scorer must select a new bowler
            alert('Over Complete! Please select a new Bowler.');
        }

        // Save current batters/bowler into match schema using non-stale local variables
        const nextStrikerStat = nextStriker ? nextMatch.battingLineup.find(b => b.name === nextStriker) : null;
        const nextNonStrikerStat = nextNonStriker ? nextMatch.battingLineup.find(b => b.name === nextNonStriker) : null;

        nextMatch.currentBatters = [
            nextStriker ? {
                name: nextStriker,
                runs: nextStrikerStat?.runs || 0,
                balls: nextStrikerStat?.balls || 0,
                fours: nextStrikerStat?.fours || 0,
                sixes: nextStrikerStat?.sixes || 0,
                isStriker: true
            } : null,
            nextNonStriker ? {
                name: nextNonStriker,
                runs: nextNonStrikerStat?.runs || 0,
                balls: nextNonStrikerStat?.balls || 0,
                fours: nextNonStrikerStat?.fours || 0,
                sixes: nextNonStrikerStat?.sixes || 0,
                isStriker: false
            } : null
        ].filter((b): b is any => b !== null);

        let nextBowler = bowlerName;
        if (isOverComplete) {
            nextBowler = '';
        }

        if (nextBowler) {
            const nextBowlerStat = nextMatch.bowlingLineup.find(b => b.name === nextBowler);
            nextMatch.currentBowler = {
                name: nextBowler,
                overs: nextBowlerStat?.overs || 0,
                maidens: nextBowlerStat?.maidens || 0,
                runs: nextBowlerStat?.runs || 0,
                wickets: nextBowlerStat?.wickets || 0,
                wides: nextBowlerStat?.wides || 0,
                noballs: nextBowlerStat?.noballs || 0
            };
        } else {
            nextMatch.currentBowler = undefined;
        }

        // Save back score object
        if (battingSide === 'A') {
            nextMatch.scoreA = currentBatScore;
            nextMatch.scoreB = otherScore;
        } else {
            nextMatch.scoreB = currentBatScore;
            nextMatch.scoreA = otherScore;
        }

        // Set status text details
        if (targetRuns > 0 && battingSide === 'B') {
            const runsNeeded = targetRuns - currentBatScore.runs;
            if (runsNeeded <= 0) {
                nextMatch.statusText = `${batTeam.name} won by ${10 - currentBatScore.wickets} wickets`;
                nextMatch.winner = batTeam.code;
                nextMatch.status = 'COMPLETED';
            } else {
                const maxBalls = (oversLimit * 6);
                const ballsRemaining = maxBalls - currentBalls;
                if (ballsRemaining <= 0 || currentBatScore.wickets >= 10) {
                    if (currentBatScore.runs === otherScore.runs) {
                        nextMatch.statusText = `Match Tied!`;
                        nextMatch.winner = 'TIE';
                        nextMatch.status = 'COMPLETED';
                    } else {
                        nextMatch.statusText = `${bowlTeam.name} won by ${otherScore.runs - currentBatScore.runs} runs`;
                        nextMatch.winner = bowlTeam.code;
                        nextMatch.status = 'COMPLETED';
                    }
                } else {
                    nextMatch.statusText = `Need ${runsNeeded} runs in ${ballsRemaining} balls to win`;
                }
            }
        } else if (battingSide === 'A') {
            const maxBalls = (oversLimit * 6);
            if (currentBalls >= maxBalls || currentBatScore.wickets >= 10) {
                nextMatch.target = currentBatScore.runs + 1;
                nextMatch.statusText = `${batTeam.name} Innings Complete. Target: ${currentBatScore.runs + 1}`;
                alert(`Innings Complete! Target is ${currentBatScore.runs + 1}. Please switch batting team to start the second innings.`);
            } else {
                nextMatch.statusText = `${batTeam.code} are batting at ${currentBatScore.runs}/${currentBatScore.wickets}`;
            }
        } else {
            nextMatch.statusText = `${batTeam.code} are batting at ${currentBatScore.runs}/${currentBatScore.wickets}`;
        }

        // Trigger update API
        await updateMatch(match._id, nextMatch, 'cricket');
        onRefresh();
        
        // Reset local ball inputs
        setRunsInput(0);
        setIsWide(false);
        setIsNoBall(false);
        setIsBye(false);
        setIsLegBye(false);
        setExtraRuns(0);
        setIsWicket(false);
        setFielderName('');
        setBallCommentary('');
    };

    // Generic Event submission for Kabaddi / Football
    const handleRecordGenericEvent = async () => {
        if (!genericEventDesc.trim()) return;

        setHistory(prev => [...prev, JSON.parse(JSON.stringify(match))]);

        const nextMatch = JSON.parse(JSON.stringify(match)) as Match;
        if (!nextMatch.commentary) nextMatch.commentary = [];

        nextMatch.commentary.unshift({
            time: genericEventTime,
            event: genericEventType,
            description: genericEventDesc.trim(),
            timestamp: new Date().toISOString()
        });

        await updateMatch(match._id, nextMatch, match.sport || 'cricket');
        onRefresh();

        setGenericEventDesc('');
    };

    // Score adjustments for football/kabaddi
    const adjustScore = async (side: 'A' | 'B', delta: number) => {
        setHistory(prev => [...prev, JSON.parse(JSON.stringify(match))]);
        const nextMatch = JSON.parse(JSON.stringify(match)) as any;
        
        if (side === 'A') {
            nextMatch.scoreA = Math.max(0, (nextMatch.scoreA || 0) + delta);
        } else {
            nextMatch.scoreB = Math.max(0, (nextMatch.scoreB || 0) + delta);
        }

        await updateMatch(match._id, nextMatch, match.sport || 'cricket');
        onRefresh();
    };

    // Kabaddi specific automatic team score calculation
    const handleKabaddiPlayerStatUpdate = async (teamSide: 'A' | 'B', player: any, statField: string, delta: number) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            if (!match) return;

            setHistory(prev => [...prev, JSON.parse(JSON.stringify(match))]);
            const nextMatch = JSON.parse(JSON.stringify(match)) as any;
            const existingStats = nextMatch.playerStats || [];
            
            const expectedTeam = teamSide === 'A' ? match.teamA.code : match.teamB.code;
            const cleanPlayerName = (player.name || '').trim(); const statIndex = existingStats.findIndex((s: any) => (s.name || '').trim().toLowerCase() === cleanPlayerName.toLowerCase() && s.team === expectedTeam);
            
            let playerStat: any = { name: cleanPlayerName,
                team: expectedTeam,
                position: player.role || 'Player',
                raidPoints: 0,
                tacklePoints: 0,
                bonusPoints: 0,
                superTackles: 0,
                otherPoints: 0,
                totalPoints: 0
            };

            // Only add user if it's a valid string ID
            if (player.user && typeof player.user === 'string' && player.user.length > 5) {
                playerStat.user = player.user;
            }

            if (statIndex !== -1) {
                playerStat = { ...existingStats[statIndex] };
            }

            playerStat[statField] = Math.max(0, (playerStat[statField] || 0) + delta);
            playerStat.totalPoints = (playerStat.raidPoints || 0) + (playerStat.tacklePoints || 0) + (playerStat.bonusPoints || 0) + (playerStat.otherPoints || 0) + ((playerStat.superTackles || 0) * 2);

            if (statIndex !== -1) {
                existingStats[statIndex] = playerStat;
            } else {
                existingStats.push(playerStat);
            }

            nextMatch.playerStats = existingStats;

            let newScoreA = 0; let newScoreB = 0;
            let newRaidA = 0; let newRaidB = 0;
            let newSuperTackles = 0;

            existingStats.forEach((s: any) => {
                if (s.team === match.teamA.code) {
                    newScoreA += (s.totalPoints || 0);
                    newRaidA += (s.raidPoints || 0) + (s.bonusPoints || 0);
                }
                if (s.team === match.teamB.code) {
                    newScoreB += (s.totalPoints || 0);
                    newRaidB += (s.raidPoints || 0) + (s.bonusPoints || 0);
                }
                newSuperTackles += (s.superTackles || 0);
            });

            nextMatch.scoreA = newScoreA + (nextMatch.extraPointsA || 0) + (nextMatch.allOutPointsA || 0);
            nextMatch.scoreB = newScoreB + (nextMatch.extraPointsB || 0) + (nextMatch.allOutPointsB || 0);
            nextMatch.raidPointsA = newRaidA;
            nextMatch.raidPointsB = newRaidB;
            nextMatch.superTackles = newSuperTackles;
            
            try {
                await updateMatch(match._id, nextMatch, match.sport || 'kabaddi');
                onRefresh();
            } catch (error: any) {
                console.error("Failed to update player stats:", error);
                alert("Error saving stats: " + (error.response?.data?.message || error.message || "Unknown error"));
            }
        } catch (globalError: any) {
            console.error("Crash in handleKabaddiPlayerStatUpdate:", globalError);
            alert("Crash before saving: " + globalError.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Kabaddi: Add extra points or all-out points to a team directly
    const handleKabaddiTeamExtraPoint = async (teamSide: 'A' | 'B', pointType: 'extra' | 'allOut', delta: number) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            if (!match) return;

            setHistory(prev => [...prev, JSON.parse(JSON.stringify(match))]);
            const nextMatch = JSON.parse(JSON.stringify(match)) as any;
            
            if (teamSide === 'A') {
                if (pointType === 'allOut') {
                    nextMatch.allOutPointsA = Math.max(0, (nextMatch.allOutPointsA || 0) + delta);
                } else {
                    nextMatch.extraPointsA = Math.max(0, (nextMatch.extraPointsA || 0) + delta);
                }
            } else {
                if (pointType === 'allOut') {
                    nextMatch.allOutPointsB = Math.max(0, (nextMatch.allOutPointsB || 0) + delta);
                } else {
                    nextMatch.extraPointsB = Math.max(0, (nextMatch.extraPointsB || 0) + delta);
                }
            }

            // Recalculate full score
            let newScoreA = 0; let newScoreB = 0;
            const existingStats = nextMatch.playerStats || [];
            existingStats.forEach((s: any) => {
                if (s.team === match.teamA.code) newScoreA += (s.totalPoints || 0);
                if (s.team === match.teamB.code) newScoreB += (s.totalPoints || 0);
            });

            nextMatch.scoreA = newScoreA + (nextMatch.extraPointsA || 0) + (nextMatch.allOutPointsA || 0);
            nextMatch.scoreB = newScoreB + (nextMatch.extraPointsB || 0) + (nextMatch.allOutPointsB || 0);

            try {
                await updateMatch(match._id, nextMatch, match.sport || 'kabaddi');
                onRefresh();
            } catch (error: any) {
                console.error("Failed to update team points:", error);
                alert("Error saving stats: " + (error.response?.data?.message || error.message || "Unknown error"));
            }
        } catch (globalError: any) {
            console.error("Crash in handleKabaddiTeamExtraPoint:", globalError);
            alert("Crash before saving: " + globalError.message);
        } finally {
            setIsUpdating(false);
        }
    };

    // Kabaddi Phase Management
    const handleFinishFirstHalf = async () => {
        if (!confirm('Finish 1st Half? This will lock 1st half stats.')) return;
        setIsUpdating(true);
        try {
            const nextMatch = JSON.parse(JSON.stringify(match)) as any;
            nextMatch.period = 'Half Time';
            nextMatch.firstHalfStats = {
                scoreA: match.scoreA || 0,
                scoreB: match.scoreB || 0,
                extraPointsA: match.extraPointsA || 0,
                extraPointsB: match.extraPointsB || 0,
                allOutPointsA: match.allOutPointsA || 0,
                allOutPointsB: match.allOutPointsB || 0,
                raidPointsA: match.raidPointsA || 0,
                raidPointsB: match.raidPointsB || 0,
                superTackles: match.superTackles || 0,
                playerStats: JSON.parse(JSON.stringify(match.playerStats || []))
            };
            await updateMatch(match._id, nextMatch, 'kabaddi');
            onRefresh();
        } catch (error: any) {
            alert('Failed to finish 1st half: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStartSecondHalf = async () => {
        setIsUpdating(true);
        try {
            const nextMatch = JSON.parse(JSON.stringify(match)) as any;
            nextMatch.period = 'Second Half';
            await updateMatch(match._id, nextMatch, 'kabaddi');
            onRefresh();
        } catch (error: any) {
            alert('Failed to start 2nd half: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFinishMatch = async () => {
        if (!confirm('Finish Match? This will generate 2nd half stats and lock the match.')) return;
        setIsUpdating(true);
        try {
            const nextMatch = JSON.parse(JSON.stringify(match)) as any;
            nextMatch.period = 'Completed';
            nextMatch.status = 'COMPLETED';
            
            const fh = match.firstHalfStats || {};
            nextMatch.secondHalfStats = {
                scoreA: (match.scoreA || 0) - (fh.scoreA || 0),
                scoreB: (match.scoreB || 0) - (fh.scoreB || 0),
                extraPointsA: (match.extraPointsA || 0) - (fh.extraPointsA || 0),
                extraPointsB: (match.extraPointsB || 0) - (fh.extraPointsB || 0),
                allOutPointsA: (match.allOutPointsA || 0) - (fh.allOutPointsA || 0),
                allOutPointsB: (match.allOutPointsB || 0) - (fh.allOutPointsB || 0),
                raidPointsA: (match.raidPointsA || 0) - (fh.raidPointsA || 0),
                raidPointsB: (match.raidPointsB || 0) - (fh.raidPointsB || 0),
                superTackles: (match.superTackles || 0) - (fh.superTackles || 0),
                playerStats: (match.playerStats || []).map((p: any) => {
                    const fhp = (fh.playerStats || []).find((s: any) => s.user === p.user || s.name === p.name) || {};
                    return {
                        ...p,
                        raidPoints: (p.raidPoints || 0) - (fhp.raidPoints || 0),
                        tacklePoints: (p.tacklePoints || 0) - (fhp.tacklePoints || 0),
                        superTackles: (p.superTackles || 0) - (fhp.superTackles || 0),
                        bonusPoints: (p.bonusPoints || 0) - (fhp.bonusPoints || 0),
                        otherPoints: (p.otherPoints || 0) - (fhp.otherPoints || 0),
                        totalPoints: (p.totalPoints || 0) - (fhp.totalPoints || 0),
                    };
                })
            };
            await updateMatch(match._id, nextMatch, 'kabaddi');
            onRefresh();
        } catch (error: any) {
            alert('Failed to finish match: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };
    const handleUndo = async () => {
        if (history.length === 0) return;
        const prevState = history[history.length - 1];
        setHistory(prev => prev.slice(0, -1));

        await updateMatch(match._id, prevState, match.sport || 'cricket');
        onRefresh();
    };

    // Settings details saver
    const saveMatchSettings = async () => {
        const nextMatch = JSON.parse(JSON.stringify(match)) as Match;
        nextMatch.tossWinner = tossWinner;
        nextMatch.tossDecision = tossDecision;
        nextMatch.oversLimit = Number(oversLimit) || 20;
        nextMatch.target = Number(targetRuns) || 0;

        await updateMatch(match._id, nextMatch, match.sport || 'cricket');
        onRefresh();
        alert('Match settings updated successfully.');
    };

    // Manual stats adjustment saver
    const saveManualStats = async (updatedBatting: any[], updatedBowling: any[]) => {
        const nextMatch = JSON.parse(JSON.stringify(match)) as Match;
        nextMatch.battingLineup = updatedBatting;
        nextMatch.bowlingLineup = updatedBowling;

        await updateMatch(match._id, nextMatch, match.sport || 'cricket');
        onRefresh();
        alert('Stats adjusted successfully.');
    };

    // Helper functions
    function batSideScore() {
        return battingSide === 'A' ? match.scoreA : match.scoreB;
    }

    function bowlSideScore() {
        return battingSide === 'A' ? match.scoreB : match.scoreA;
    }

    function oversToBalls(overs: number): number {
        return Math.floor(overs) * 6 + Math.round((overs % 1) * 10);
    }

    function ballsToOvers(balls: number): number {
        return Math.floor(balls / 6) + (balls % 6) / 10;
    }



    return (
        <div className="w-full min-h-screen bg-gray-50 pb-20 animate-fade-in">
            {/* Elegant Premium Top Header Bar */}
            <div className="bg-white border-b border-gray-250 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all border border-gray-200 text-gray-600 shadow-xs active:scale-[0.98]">
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <div className="flex items-center gap-1.5 leading-none">
                                <span className="text-[8px] font-black uppercase bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-600 tracking-wider shadow-xs">
                                    {match.sport || 'Cricket'}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-0.5">
                                    <MapPin size={10} className="text-gray-300" /> {match.venue || 'Unknown Venue'}
                                </span>
                            </div>
                            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight flex items-center gap-1.5 mt-0.5 leading-tight">
                                {match.teamA.name} <span className="text-[10px] text-gray-300 font-bold">VS</span> {match.teamB.name}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Status Label */}
                        <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                            {match.status === 'LIVE' ? (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                            ) : null}
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">{match.status}</span>
                        </div>

                        {/* Scorer control indicators */}
                        {isScorer ? (
                            <div className="flex items-center gap-1.5">
                                {history.length > 0 && (
                                    <button onClick={handleUndo} className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold transition shadow-xs active:scale-95">
                                        <RotateCcw size={12} /> Undo
                                    </button>
                                )}
                                <select 
                                    value={match.status} 
                                    onChange={async (e) => {
                                        await updateMatch(match._id, { status: e.target.value }, match.sport || 'cricket');
                                        onRefresh();
                                    }}
                                    className="pl-2 pr-7 py-1 bg-gray-950 text-white rounded-lg text-[10px] font-black uppercase tracking-wider border-0 outline-none shadow-xs"
                                >
                                    <option value="UPCOMING">⏳ Upcoming</option>
                                    <option value="LIVE">🔴 Live</option>
                                    <option value="COMPLETED">✅ Completed</option>
                                    <option value="ABANDONED">🚫 Abandoned</option>
                                </select>
                            </div>
                        ) : (
                            <span className="text-[10px] font-black uppercase bg-amber-100 border border-amber-200 px-2.5 py-1 text-amber-800 rounded-lg flex items-center gap-1">
                                <Shield size={11} /> View-Only
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Scoreboard Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                
                {/* 1. Scoreboard summary panel */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl p-6 sm:p-8 relative overflow-hidden mb-6 border border-slate-800">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                        {/* Team A runs */}
                        <div className="text-center sm:text-left flex-1">
                            <h3 className="text-xl font-bold tracking-wide uppercase opacity-75">{match.teamA.name}</h3>
                            <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                                {match.sport === 'cricket' ? (
                                    <>
                                        {match.scoreA?.runs || 0}
                                        <span className="text-2xl text-indigo-300 font-medium">/{match.scoreA?.wickets || 0}</span>
                                    </>
                                ) : (
                                    match.scoreA || 0
                                )}
                            </div>
                            {match.sport === 'cricket' && (
                                <p className="text-xs text-indigo-200 font-mono mt-1 font-bold">Overs: {match.scoreA?.overs || 0}</p>
                            )}
                        </div>

                        {/* Middle VS and Info */}
                        <div className="text-center px-4">
                            <span className="text-xs font-black tracking-widest text-indigo-400 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full block uppercase mb-2">VS</span>
                            {match.sport === 'cricket' && targetRuns > 0 && (
                                <p className="text-xs text-amber-400 font-mono font-black uppercase">Target: {targetRuns}</p>
                            )}
                            <p className="text-sm font-semibold italic text-slate-300 mt-2">{match.statusText || 'No live update yet'}</p>
                        </div>

                        {/* Team B runs */}
                        <div className="text-center sm:text-right flex-1">
                            <h3 className="text-xl font-bold tracking-wide uppercase opacity-75">{match.teamB.name}</h3>
                            <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
                                {match.sport === 'cricket' ? (
                                    <>
                                        {match.scoreB?.runs || 0}
                                        <span className="text-2xl text-indigo-300 font-medium">/{match.scoreB?.wickets || 0}</span>
                                    </>
                                ) : (
                                    match.scoreB || 0
                                )}
                            </div>
                            {match.sport === 'cricket' && (
                                <p className="text-xs text-indigo-200 font-mono mt-1 font-bold">Overs: {match.scoreB?.overs || 0}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Main Action Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* SCORING INPUTS (LEFT 2/3 COLUMN) */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Cricket Scoring Controls */}
                        {match.sport === 'cricket' ? (
                            <>
                                {/* Active Batter & Bowler Selection Card */}
                                <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                            <Activity size={16} className="text-indigo-600" /> Active Players on Field
                                        </h3>
                                        {isScorer && (
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setBattingSide(battingSide === 'A' ? 'B' : 'A');
                                                        setStrikerName('');
                                                        setNonStrikerName('');
                                                        setBowlerName('');
                                                    }}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition"
                                                >
                                                    Switch Batting Team: {battingSide === 'A' ? match.teamB.code : match.teamA.code}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Striker Selector */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Striker Batsman</label>
                                            {isScorer ? (
                                                <select 
                                                    value={strikerName}
                                                    onChange={e => setStrikerName(e.target.value)}
                                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                >
                                                    <option value="">Select Striker...</option>
                                                    {availableBatsmen.map(p => (
                                                         <option key={p.user || (p as any)._id} value={p.name}>{p.name}</option>
                                                     ))}
                                                 </select>
                                             ) : (
                                                 <div className="p-3 bg-indigo-50/50 rounded-2xl text-xs font-bold text-indigo-900">{strikerName || 'Not Selected'}</div>
                                             )}
                                             {strikerName && (
                                                 <div className="bg-indigo-50/40 p-3 rounded-2xl flex justify-between items-center text-xs">
                                                     <span className="font-bold text-indigo-900">{strikerName} *</span>
                                                     <span className="font-mono text-gray-500 font-bold">
                                                         {match.battingLineup?.find(b => b.name === strikerName)?.runs || 0}
                                                         ({match.battingLineup?.find(b => b.name === strikerName)?.balls || 0})
                                                     </span>
                                                 </div>
                                             )}
                                         </div>
 
                                         {/* Non-Striker Selector */}
                                         <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Non-Striker</label>
                                             {isScorer ? (
                                                 <select 
                                                     value={nonStrikerName}
                                                     onChange={e => setNonStrikerName(e.target.value)}
                                                     className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                 >
                                                     <option value="">Select Non-Striker...</option>
                                                     {availableBatsmen.map(p => (
                                                         <option key={p.user || (p as any)._id} value={p.name}>{p.name}</option>
                                                     ))}
                                                 </select>
                                             ) : (
                                                 <div className="p-3 bg-indigo-50/50 rounded-2xl text-xs font-bold text-indigo-900">{nonStrikerName || 'Not Selected'}</div>
                                             )}
                                             {nonStrikerName && (
                                                 <div className="bg-indigo-50/40 p-3 rounded-2xl flex justify-between items-center text-xs">
                                                     <span className="font-bold text-indigo-900">{nonStrikerName}</span>
                                                     <span className="font-mono text-gray-500 font-bold">
                                                         {match.battingLineup?.find(b => b.name === nonStrikerName)?.runs || 0}
                                                         ({match.battingLineup?.find(b => b.name === nonStrikerName)?.balls || 0})
                                                     </span>
                                                 </div>
                                             )}
                                         </div>
 
                                         {/* Bowler Selector */}
                                         <div className="space-y-2">
                                             <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Active Bowler</label>
                                             {isScorer ? (
                                                 <select 
                                                     value={bowlerName}
                                                     onChange={e => setBowlerName(e.target.value)}
                                                     className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                                                 >
                                                     <option value="">Select Bowler...</option>
                                                     {bowlingSquad.map(p => {
                                                         const isExcluded = p.name === excludedBowlerName;
                                                         return (
                                                             <option 
                                                                 key={p.user || (p as any)._id} 
                                                                 value={p.name}
                                                                 disabled={isExcluded}
                                                             >
                                                                 {p.name} {isExcluded ? '(Consecutive Over Restriction)' : ''}
                                                             </option>
                                                         );
                                                     })}
                                                </select>
                                            ) : (
                                                <div className="p-3 bg-emerald-50/50 rounded-2xl text-xs font-bold text-emerald-900">{bowlerName || 'Not Selected'}</div>
                                            )}
                                            {bowlerName && (
                                                <div className="bg-emerald-50/40 p-3 rounded-2xl flex justify-between items-center text-xs">
                                                    <span className="font-bold text-emerald-900">{bowlerName}</span>
                                                    <span className="font-mono text-gray-500 font-bold">
                                                        {match.bowlingLineup?.find(b => b.name === bowlerName)?.wickets || 0}
                                                        -{match.bowlingLineup?.find(b => b.name === bowlerName)?.runs || 0}
                                                        ({match.bowlingLineup?.find(b => b.name === bowlerName)?.overs || 0} ov)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Scorer Ball-by-ball Input Panel */}
                                {isScorer && (
                                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                                            Ball-By-Ball Scoring Control
                                        </h3>

                                        {/* Runs selector pills */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Runs off Bat</label>
                                            <div className="grid grid-cols-6 gap-2">
                                                {[0, 1, 2, 3, 4, 6].map(runs => {
                                                    const isSelected = runsInput === runs;
                                                    let customStyle = "";
                                                    if (isSelected) {
                                                        customStyle = "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-[1.02]";
                                                    } else {
                                                        if (runs === 0) {
                                                            customStyle = "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100";
                                                        } else if (runs === 4) {
                                                            customStyle = "bg-purple-50/50 border-purple-200 text-purple-700 hover:bg-purple-100/50";
                                                        } else if (runs === 6) {
                                                            customStyle = "bg-violet-50/50 border-violet-200 text-violet-700 hover:bg-violet-100/50";
                                                        } else {
                                                            customStyle = "bg-white border-gray-200 text-gray-800 hover:bg-gray-50";
                                                        }
                                                    }
                                                    return (
                                                        <button
                                                            key={runs}
                                                            type="button"
                                                            onClick={() => setRunsInput(runs)}
                                                            className={`py-4 rounded-2xl text-base font-black transition-all border active:scale-95 flex flex-col items-center justify-center gap-0.5 ${customStyle}`}
                                                        >
                                                            <span className="leading-none">{runs}</span>
                                                            {runs === 4 && <span className="text-[8px] font-extrabold uppercase opacity-80 leading-none">4s</span>}
                                                            {runs === 6 && <span className="text-[8px] font-extrabold uppercase opacity-80 leading-none">6s</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Extras selection row */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Extras (Tap to toggle)</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                                {[
                                                    { key: 'wide', label: 'Wide', state: isWide, handler: (checked: boolean) => { setIsWide(checked); if (checked) { setIsNoBall(false); setIsBye(false); setIsLegBye(false); } } },
                                                    { key: 'noball', label: 'No Ball', state: isNoBall, handler: (checked: boolean) => { setIsNoBall(checked); if (checked) { setIsWide(false); } } },
                                                    { key: 'bye', label: 'Bye', state: isBye, handler: (checked: boolean) => { setIsBye(checked); if (checked) { setIsWide(false); setIsLegBye(false); } } },
                                                    { key: 'legbye', label: 'Leg Bye', state: isLegBye, handler: (checked: boolean) => { setIsLegBye(checked); if (checked) { setIsWide(false); setIsBye(false); } } }
                                                ].map(extra => {
                                                    let chipStyle = "";
                                                    if (extra.state) {
                                                        if (extra.key === 'wide') chipStyle = "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.01]";
                                                        else if (extra.key === 'noball') chipStyle = "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20 scale-[1.01]";
                                                        else chipStyle = "bg-slate-700 text-white border-slate-700 shadow-md shadow-slate-500/20 scale-[1.01]";
                                                    } else {
                                                        chipStyle = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50";
                                                    }
                                                    return (
                                                        <button
                                                            key={extra.key}
                                                            type="button"
                                                            onClick={() => extra.handler(!extra.state)}
                                                            className={`py-3 rounded-2xl text-xs font-black transition-all border active:scale-95 flex items-center justify-center gap-1.5 ${chipStyle}`}
                                                        >
                                                            {extra.state && <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
                                                            {extra.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Extra runs input (if wide/no-ball boundary, etc.) */}
                                        {(isWide || isNoBall || isBye || isLegBye) && (
                                            <div className="flex items-center gap-4 bg-amber-50/50 p-4 border border-amber-100 rounded-2xl animate-fade-in">
                                                <AlertTriangle size={16} className="text-amber-500" />
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">Additional runs on this extra</label>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={extraRuns} 
                                                        onChange={e => setExtraRuns(Number(e.target.value) || 0)}
                                                        className="w-24 px-3.5 py-2 border border-amber-200 rounded-xl text-xs font-bold text-amber-950 outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white" 
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit ball Button - PLACED DIRECTLY UNDER BATS / EXTRAS FOR VERY QUICK ACCESS */}
                                        <button 
                                            onClick={handleRecordBall}
                                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            🚀 Save Ball & Update Score
                                        </button>

                                        <div className="border-t border-gray-100 my-4" />

                                        {/* Wicket Section */}
                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsWicket(!isWicket);
                                                    if (!isWicket) {
                                                        setWicketType('Bowled');
                                                        setDismissedBatter('Striker');
                                                        setFielderName('');
                                                    }
                                                }}
                                                className={`w-full py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border active:scale-95 ${
                                                    isWicket
                                                        ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20 scale-[1.01]'
                                                        : 'bg-white border-red-200 text-red-600 hover:bg-red-50/40'
                                                }`}
                                            >
                                                {isWicket ? '🚨 Wicket Recorded (Click to Cancel)' : '🔴 Record Wicket / Dismissal'}
                                            </button>

                                            {isWicket && (
                                                <div className="bg-red-50/20 border border-red-100 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 animate-fade-in shadow-inner">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Dismissal Type</label>
                                                        <select 
                                                            value={wicketType} 
                                                            onChange={e => setWicketType(e.target.value)}
                                                            className="w-full px-3 py-2.5 border border-red-200 bg-white rounded-xl text-xs font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                                                        >
                                                            <option>Bowled</option>
                                                            <option>Caught</option>
                                                            <option>LBW</option>
                                                            <option>Stumped</option>
                                                            <option>Run Out</option>
                                                            <option>Retired Hurt</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Who is Out?</label>
                                                        <select 
                                                            value={dismissedBatter} 
                                                            onChange={e => setDismissedBatter(e.target.value)}
                                                            className="w-full px-3 py-2.5 border border-red-200 bg-white rounded-xl text-xs font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                                                        >
                                                            <option value="Striker">Striker ({strikerName})</option>
                                                            <option value="Non-Striker">Non-Striker ({nonStrikerName})</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Fielder Name (If any)</label>
                                                        <input 
                                                            placeholder="e.g. Dhoni"
                                                            value={fielderName}
                                                            onChange={e => setFielderName(e.target.value)}
                                                            className="w-full px-3.5 py-2.5 border border-red-200 bg-white rounded-xl text-xs font-bold text-red-900 outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 placeholder-red-300" 
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Commentary Box */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Ball Commentary description (Optional override)</label>
                                            <input 
                                                placeholder="e.g. Stretched drive past mid-off for four."
                                                value={ballCommentary}
                                                onChange={e => setBallCommentary(e.target.value)}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-xs outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : match.sport === 'kabaddi' ? (
                            /* Kabaddi Live Scoring Controls */
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex justify-between items-center">
                                    <span>Live Kabaddi Scoring</span>
                                    {isScorer && (
                                        <button 
                                            onClick={async () => {
                                                if (confirm('Sync players from Teams? This will update the players for this match.')) {
                                                    await updateMatch(match._id, { syncSquads: true }, match.sport || 'kabaddi');
                                                    onRefresh();
                                                }
                                            }}
                                            className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                        >
                                            Sync Squads
                                        </button>
                                    )}
                                </h3>

                                {/* Match Phase Management */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span className="text-sm font-bold text-blue-900 uppercase tracking-widest">
                                            Phase: {match.period || 'First Half'}
                                        </span>
                                    </div>
                                    {isScorer && (
                                        <div className="mt-3 sm:mt-0 flex gap-2">
                                            {(!match.period || match.period === 'First Half') && (
                                                <button disabled={isUpdating} onClick={handleFinishFirstHalf} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 active:scale-95 disabled:opacity-50">
                                                    🏁 Finish 1st Half
                                                </button>
                                            )}
                                            {match.period === 'Half Time' && (
                                                <button disabled={isUpdating} onClick={handleStartSecondHalf} className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg shadow hover:bg-green-700 active:scale-95 disabled:opacity-50">
                                                    ▶️ Start 2nd Half
                                                </button>
                                            )}
                                            {match.period === 'Second Half' && (
                                                <button disabled={isUpdating} onClick={handleFinishMatch} className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg shadow hover:bg-red-700 active:scale-95 disabled:opacity-50">
                                                    🏁 Finish Match
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Team A Kabaddi Scoring Table */}
                                    <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/20">
                                        <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3">{match.teamA.name} Players</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-indigo-100/50 text-[10px] uppercase tracking-wider text-indigo-800 border-b border-indigo-100">
                                                        <th className="p-2.5 font-bold rounded-tl-lg">Player</th>
                                                        {KABADDI_STATS.map(s => <th key={s.field} className="p-2.5 font-bold text-center">{s.label}</th>)}
                                                        <th className="p-2.5 font-bold text-center rounded-tr-lg">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-indigo-50/50">
                                                    {(match.teamAPlayers || []).map((p: any) => {
                                                        const pStat = (match.playerStats || []).find((s: any) => (s.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase() && s.team === match.teamA.code) || {};
                                                        return (
                                                            <tr key={p.user || p.name} className="bg-white hover:bg-indigo-50/30 transition-colors">
                                                                <td className="p-2.5 align-middle">
                                                                    <div className="text-xs font-bold text-gray-900 whitespace-nowrap">{p.name}</div>
                                                                    <div className="text-[9px] text-indigo-500 uppercase font-semibold">{p.role || 'Player'}</div>
                                                                </td>
                                                                {KABADDI_STATS.map(stat => (
                                                                    <td key={stat.field} className="p-2.5 text-center align-middle">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            {isScorer && <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiPlayerStatUpdate('A', p, stat.field, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50">-</button>}
                                                                            <span className="text-xs font-bold w-4 text-center inline-block">{pStat[stat.field] || 0}</span>
                                                                            {isScorer && <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiPlayerStatUpdate('A', p, stat.field, 1)} className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 active:scale-95 transition-transform disabled:opacity-50">+</button>}
                                                                        </div>
                                                                    </td>
                                                                ))}
                                                                <td className="p-2.5 text-center align-middle border-l border-indigo-50">
                                                                    <span className="text-sm font-black text-indigo-600">{pStat.totalPoints || 0}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Team A Extra Points Panel */}
                                        <div className="mt-4 p-3 bg-indigo-100/30 rounded-xl border border-indigo-100 flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <div className="text-xs font-bold text-indigo-900">
                                                    Team Points : Extra : <span className="text-indigo-700 text-sm">{match.extraPointsA || 0}</span> , All Out : <span className="text-indigo-700 text-sm">{match.allOutPointsA || 0}</span>
                                                </div>
                                            </div>
                                            {isScorer && (
                                                <div className="flex gap-2 flex-wrap justify-end">
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('A', 'extra', -1)} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded shadow-sm hover:bg-indigo-50 active:scale-95 text-[10px] font-bold disabled:opacity-50">-1 Extra</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('A', 'extra', 1)} className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 active:scale-95 text-[10px] font-bold disabled:opacity-50">+1 Extra</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('A', 'allOut', -2)} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded shadow-sm hover:bg-indigo-50 active:scale-95 text-[10px] font-bold disabled:opacity-50">-2 AO</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('A', 'allOut', 2)} className="px-3 py-1.5 bg-indigo-600 text-white shadow-md shadow-indigo-500/20 rounded-lg hover:bg-indigo-700 active:scale-95 text-[10px] font-bold disabled:opacity-50">+2 All Out</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Team B Kabaddi Scoring Table */}
                                    <div className="border border-amber-100 rounded-2xl p-4 bg-amber-50/20 mt-4">
                                        <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-3">{match.teamB.name} Players</h4>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead>
                                                    <tr className="bg-amber-100/50 text-[10px] uppercase tracking-wider text-amber-800 border-b border-amber-100">
                                                        <th className="p-2.5 font-bold rounded-tl-lg">Player</th>
                                                        {KABADDI_STATS.map(s => <th key={s.field} className="p-2.5 font-bold text-center">{s.label}</th>)}
                                                        <th className="p-2.5 font-bold text-center rounded-tr-lg">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-amber-50/50">
                                                    {(match.teamBPlayers || []).map((p: any) => {
                                                        const pStat = (match.playerStats || []).find((s: any) => (s.name || '').trim().toLowerCase() === (p.name || '').trim().toLowerCase() && s.team === match.teamB.code) || {};
                                                        return (
                                                            <tr key={p.user || p.name} className="bg-white hover:bg-amber-50/30 transition-colors">
                                                                <td className="p-2.5 align-middle">
                                                                    <div className="text-xs font-bold text-gray-900 whitespace-nowrap">{p.name}</div>
                                                                    <div className="text-[9px] text-amber-500 uppercase font-semibold">{p.role || 'Player'}</div>
                                                                </td>
                                                                {KABADDI_STATS.map(stat => (
                                                                    <td key={stat.field} className="p-2.5 text-center align-middle">
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            {isScorer && <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiPlayerStatUpdate('B', p, stat.field, -1)} className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-gray-600 hover:bg-gray-200 active:scale-95 transition-transform disabled:opacity-50">-</button>}
                                                                            <span className="text-xs font-bold w-4 text-center inline-block">{pStat[stat.field] || 0}</span>
                                                                            {isScorer && <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiPlayerStatUpdate('B', p, stat.field, 1)} className="w-5 h-5 flex items-center justify-center bg-amber-100 text-amber-700 rounded hover:bg-amber-200 active:scale-95 transition-transform disabled:opacity-50">+</button>}
                                                                        </div>
                                                                    </td>
                                                                ))}
                                                                <td className="p-2.5 text-center align-middle border-l border-amber-50">
                                                                    <span className="text-sm font-black text-amber-600">{pStat.totalPoints || 0}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* Team B Extra Points Panel */}
                                        <div className="mt-4 p-3 bg-amber-100/30 rounded-xl border border-amber-100 flex items-center justify-between">
                                            <div className="flex gap-4">
                                                <div className="text-xs font-bold text-amber-900">
                                                    Team Points : Extra : <span className="text-amber-700 text-sm">{match.extraPointsB || 0}</span> , All Out : <span className="text-amber-700 text-sm">{match.allOutPointsB || 0}</span>
                                                </div>
                                            </div>
                                            {isScorer && (
                                                <div className="flex gap-2 flex-wrap justify-end">
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('B', 'extra', -1)} className="px-2.5 py-1 bg-white border border-amber-200 text-amber-700 rounded shadow-sm hover:bg-amber-50 active:scale-95 text-[10px] font-bold disabled:opacity-50">-1 Extra</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('B', 'extra', 1)} className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 active:scale-95 text-[10px] font-bold disabled:opacity-50">+1 Extra</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('B', 'allOut', -2)} className="px-2.5 py-1 bg-white border border-amber-200 text-amber-700 rounded shadow-sm hover:bg-amber-50 active:scale-95 text-[10px] font-bold disabled:opacity-50">-2 AO</button>
                                                    <button disabled={isUpdating || match.period === 'Half Time' || match.period === 'Completed'} onClick={() => handleKabaddiTeamExtraPoint('B', 'allOut', 2)} className="px-3 py-1.5 bg-amber-600 text-white shadow-md shadow-amber-500/20 rounded-lg hover:bg-amber-700 active:scale-95 text-[10px] font-bold disabled:opacity-50">+2 All Out</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Football Controls */
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3 flex justify-between items-center">
                                    <span>Score Adjustments ({match.sport})</span>
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Team A */}
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center space-y-3">
                                        <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider">{match.teamA.name}</div>
                                        <div className="text-3xl font-black text-indigo-600">{match.scoreA || 0}</div>
                                        {isScorer && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => adjustScore('A', 1)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95 transition">+</button>
                                                <button onClick={() => adjustScore('A', -1)} className="px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-50 active:scale-95 transition">-</button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Team B */}
                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-center space-y-3">
                                        <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">{match.teamB.name}</div>
                                        <div className="text-3xl font-black text-amber-600">{match.scoreB || 0}</div>
                                        {isScorer && (
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => adjustScore('B', 1)} className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 active:scale-95 transition">+</button>
                                                <button onClick={() => adjustScore('B', -1)} className="px-3 py-1.5 bg-white text-amber-600 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-50 active:scale-95 transition">-</button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Generic Timeline Event form */}
                                {isScorer && (
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Log Live Timeline / Commentary Event</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Time (Min / Half)</label>
                                                <input 
                                                    value={genericEventTime} 
                                                    onChange={e => setGenericEventTime(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-xl text-xs outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Event Type</label>
                                                <select 
                                                    value={genericEventType} 
                                                    onChange={e => setGenericEventType(e.target.value)}
                                                    className="w-full px-2.5 py-1.5 border border-gray-200 bg-white rounded-xl text-xs outline-none"
                                                >
                                                    <option>Commentary</option>
                                                    <option>Goal</option>
                                                    <option>Yellow Card</option>
                                                    <option>Red Card</option>
                                                    <option>Substitution</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Event Description</label>
                                            <input 
                                                placeholder="e.g. Leo Messi scores a brilliant free kick!"
                                                value={genericEventDesc}
                                                onChange={e => setGenericEventDesc(e.target.value)}
                                                className="w-full px-3 py-1.5 border border-gray-200 bg-white rounded-xl text-xs outline-none focus:border-indigo-400" 
                                            />
                                        </div>
                                        <button 
                                            onClick={handleRecordGenericEvent}
                                            className="w-full py-2 bg-gray-900 text-white font-bold text-xs rounded-xl shadow-md hover:bg-black transition active:scale-95"
                                        >
                                            Add Timeline Event
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TABS VIEW at bottom */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
                            <div className="flex border-b border-gray-100 pb-2 overflow-x-auto gap-4">
                                <button onClick={() => setActiveTab('scorecard')} className={`pb-2 text-xs font-black uppercase border-b-2 tracking-wider ${activeTab === 'scorecard' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Scorecard</button>
                                <button onClick={() => setActiveTab('commentary')} className={`pb-2 text-xs font-black uppercase border-b-2 tracking-wider ${activeTab === 'commentary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Commentary Timeline</button>
                                <button onClick={() => setActiveTab('settings')} className={`pb-2 text-xs font-black uppercase border-b-2 tracking-wider ${activeTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Match Settings</button>
                                {isScorer && <button onClick={() => setActiveTab('manual')} className={`pb-2 text-xs font-black uppercase border-b-2 tracking-wider ${activeTab === 'manual' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>Manual Adjust</button>}
                            </div>

                            {/* Tab Contents: Scorecard */}
                            {activeTab === 'scorecard' && (
                                <div className="space-y-6">
                                    {match.sport === 'cricket' ? (
                                        <>
                                            {/* Batting Card Table */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Batting Scorecard</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase">Batsman</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase">Dismissal</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">R</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">B</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">4s</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">6s</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">SR</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(match.battingLineup || []).map((b, i) => (
                                                                <tr key={i} className="border-b border-gray-50 text-xs">
                                                                    <td className="py-2 px-3 font-bold text-gray-900">{b.name}</td>
                                                                    <td className="py-2 px-3 text-gray-400 italic">{b.dismissal || b.status}</td>
                                                                    <td className="py-2 px-3 font-black text-center text-gray-900">{b.runs || 0}</td>
                                                                     <td className="py-2 px-3 text-center text-gray-500 font-mono">{b.balls || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">{b.fours || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">{b.sixes || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">
                                                                        {b.balls ? ((b.runs || 0) / b.balls * 100).toFixed(1) : '0.0'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {yetToBatPlayers.length > 0 && (
                                                    <div className="bg-gray-50/50 p-3.5 rounded-2xl border border-gray-150 text-xs text-gray-600 flex flex-wrap gap-2 items-center mt-3">
                                                        <span className="font-bold text-gray-700">Yet to Bat:</span>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {yetToBatPlayers.map((name, index) => (
                                                                <span key={index} className="bg-white border border-gray-200 px-2.5 py-1 rounded-xl text-gray-700 font-bold shadow-sm">
                                                                    {name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bowling Card Table */}
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest text-left">Bowling Scorecard</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse">
                                                        <thead>
                                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase">Bowler</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">O</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">M</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">R</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">W</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Wd</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Nb</th>
                                                                <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Econ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(match.bowlingLineup || []).map((b, i) => (
                                                                <tr key={i} className="border-b border-gray-50 text-xs">
                                                                    <td className="py-2 px-3 font-bold text-gray-900">{b.name}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">{b.overs || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">{b.maidens || 0}</td>
                                                                    <td className="py-2 px-3 font-bold text-center text-gray-900">{b.runs || 0}</td>
                                                                    <td className="py-2 px-3 font-black text-center text-emerald-600">{b.wickets || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-400 font-mono">{b.wides || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-400 font-mono">{b.noballs || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-500 font-mono">
                                                                        {calculateEconomy(b.runs || 0, b.overs || 0)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Extras Summary */}
                                            <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 flex justify-between items-center">
                                                <span className="font-bold">Total Extras Breakdown:</span>
                                                <span className="font-mono font-bold">
                                                    Wides: {scoreBat?.wides || 0} | No Balls: {scoreBat?.noballs || 0} | Byes: {scoreBat?.byes || 0} | Leg Byes: {scoreBat?.legbyes || 0}
                                                </span>
                                            </div>
                                        </>
                                    ) : match.sport === 'kabaddi' ? (
                                        <div className="space-y-6">
                                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Player Statistics</h4>
                                            
                                            {/* Team A Kabaddi Player Stats */}
                                            <div className="border border-indigo-100 rounded-2xl p-4 bg-indigo-50/20">
                                                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3">{match.teamA.name} Stats</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                                        <thead>
                                                            <tr className="bg-indigo-100/50 text-[10px] uppercase tracking-wider text-indigo-800 border-b border-indigo-100">
                                                                <th className="p-2.5 font-bold rounded-tl-lg">Player</th>
                                                                <th className="p-2.5 font-bold text-center">Raid Pts</th>
                                                                <th className="p-2.5 font-bold text-center">Tackle Pts</th>
                                                                <th className="p-2.5 font-bold text-center">Bonus</th>
                                                                <th className="p-2.5 font-bold text-center">Super Tackle</th>
                                                                <th className="p-2.5 font-bold text-center rounded-tr-lg">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-indigo-50/50">
                                                            {((match.playerStats || []).filter((s: any) => s.team === match.teamA.code).length > 0) ? (
                                                                (match.playerStats || []).filter((s: any) => s.team === match.teamA.code).map((p: any, i: number) => (
                                                                    <tr key={i} className="bg-white hover:bg-indigo-50/30 transition-colors">
                                                                        <td className="p-2.5 align-middle">
                                                                            <div className="text-xs font-bold text-gray-900 whitespace-nowrap">{p.name}</div>
                                                                            <div className="text-[9px] text-indigo-500 uppercase font-semibold">{p.position || 'Player'}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.raidPoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.tacklePoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.bonusPoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.superTackles || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle border-l border-indigo-50">
                                                                            <span className="text-sm font-black text-indigo-600">{p.totalPoints || 0}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} className="p-6 text-center text-xs text-gray-400 font-medium">No player stats recorded yet for {match.teamA.name}.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Team B Kabaddi Player Stats */}
                                            <div className="border border-amber-100 rounded-2xl p-4 bg-amber-50/20">
                                                <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-3">{match.teamB.name} Stats</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left border-collapse min-w-[500px]">
                                                        <thead>
                                                            <tr className="bg-amber-100/50 text-[10px] uppercase tracking-wider text-amber-800 border-b border-amber-100">
                                                                <th className="p-2.5 font-bold rounded-tl-lg">Player</th>
                                                                <th className="p-2.5 font-bold text-center">Raid Pts</th>
                                                                <th className="p-2.5 font-bold text-center">Tackle Pts</th>
                                                                <th className="p-2.5 font-bold text-center">Bonus</th>
                                                                <th className="p-2.5 font-bold text-center">Super Tackle</th>
                                                                <th className="p-2.5 font-bold text-center rounded-tr-lg">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-amber-50/50">
                                                            {((match.playerStats || []).filter((s: any) => s.team === match.teamB.code).length > 0) ? (
                                                                (match.playerStats || []).filter((s: any) => s.team === match.teamB.code).map((p: any, i: number) => (
                                                                    <tr key={i} className="bg-white hover:bg-amber-50/30 transition-colors">
                                                                        <td className="p-2.5 align-middle">
                                                                            <div className="text-xs font-bold text-gray-900 whitespace-nowrap">{p.name}</div>
                                                                            <div className="text-[9px] text-amber-500 uppercase font-semibold">{p.position || 'Player'}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.raidPoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.tacklePoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.bonusPoints || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle text-xs font-bold text-gray-700">{p.superTackles || 0}</td>
                                                                        <td className="p-2.5 text-center align-middle border-l border-amber-50">
                                                                            <span className="text-sm font-black text-amber-600">{p.totalPoints || 0}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr>
                                                                    <td colSpan={6} className="p-6 text-center text-xs text-gray-400 font-medium">No player stats recorded yet for {match.teamB.name}.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* General Sport Squad Statistics table */
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Player Statistics</h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-gray-50 border-b border-gray-100">
                                                            <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase">Player</th>
                                                            <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase">Team</th>
                                                            <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Goals / Raid Pts</th>
                                                            <th className="py-2 px-3 text-[10px] font-bold text-gray-500 uppercase text-center">Assists / Tackle Pts</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(match.playerStats || []).length > 0 ? (
                                                            (match.playerStats || []).map((p, i) => (
                                                                <tr key={i} className="border-b border-gray-50 text-xs">
                                                                    <td className="py-2 px-3 font-bold text-gray-900">{p.name}</td>
                                                                    <td className="py-2 px-3 text-gray-500">{p.team}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-900 font-bold">{p.goals || 0}</td>
                                                                    <td className="py-2 px-3 text-center text-gray-900 font-bold">{p.assists || 0}</td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={4} className="py-6 px-3 text-center text-xs text-gray-400 font-medium">No player stats recorded yet.</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Squad Lists */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest">{match.teamA.name} Squad</h4>
                                                    <div className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-wrap gap-2 shadow-sm">
                                                        {(match.teamAPlayers || []).length > 0 ? (
                                                            (match.teamAPlayers || []).map((p: any, i: number) => (
                                                                <div key={i} className="px-3 py-1.5 bg-indigo-50/70 border border-indigo-100 text-indigo-800 rounded-xl text-xs font-bold flex flex-col items-center">
                                                                    <span>{p.name || p.fullName || p.displayName}</span>
                                                                    {p.role && <span className="text-[9px] text-indigo-500 uppercase tracking-wider">{p.role}</span>}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No players found in this squad.</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">{match.teamB.name} Squad</h4>
                                                    <div className="bg-white border border-amber-100 rounded-2xl p-4 flex flex-wrap gap-2 shadow-sm">
                                                        {(match.teamBPlayers || []).length > 0 ? (
                                                            (match.teamBPlayers || []).map((p: any, i: number) => (
                                                                <div key={i} className="px-3 py-1.5 bg-amber-50/70 border border-amber-100 text-amber-800 rounded-xl text-xs font-bold flex flex-col items-center">
                                                                    <span>{p.name || p.fullName || p.displayName}</span>
                                                                    {p.role && <span className="text-[9px] text-amber-500 uppercase tracking-wider">{p.role}</span>}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">No players found in this squad.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab Contents: Commentary list */}
                            {activeTab === 'commentary' && (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                                    {(match.commentary && match.commentary.length > 0) ? (
                                        match.commentary.map((c, idx) => (
                                            <div key={idx} className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 transition duration-150">
                                                <div className="text-center font-mono font-black text-indigo-600 text-xs w-12 bg-indigo-50/50 py-1 rounded-xl flex-shrink-0 flex items-center justify-center">
                                                    {match.sport === 'cricket' ? `${c.over}.${c.ball}` : c.time || ''}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                            c.event === 'wicket' ? 'bg-red-100 text-red-700' :
                                                            c.event === 'four' || c.event === 'six' ? 'bg-purple-100 text-purple-700' :
                                                            c.event === 'extra' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                                                        }`}>
                                                            {c.event || 'ball'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400">{c.timestamp ? new Date(c.timestamp).toLocaleTimeString() : ''}</span>
                                                    </div>
                                                    <p className="text-xs font-semibold text-gray-800">{c.description}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-xs text-gray-400">No commentary logged yet for this match.</div>
                                    )}
                                </div>
                            )}

                            {/* Tab Contents: Settings */}
                            {activeTab === 'settings' && (
                                <div className="space-y-4 max-w-md">
                                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">Match Settings</h4>
                                    
                                    <div className="space-y-3">
                                        {/* Toss details */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Toss Winner</label>
                                                {isScorer ? (
                                                    <select value={tossWinner} onChange={e => setTossWinner(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none">
                                                        <option value="">Select winner...</option>
                                                        <option value={match.teamA.code}>{match.teamA.name}</option>
                                                        <option value={match.teamB.code}>{match.teamB.name}</option>
                                                    </select>
                                                ) : (
                                                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold">{tossWinner || 'Not Entered'}</div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Toss Decision</label>
                                                {isScorer ? (
                                                    <select value={tossDecision} onChange={e => setTossDecision(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none">
                                                        <option value="bat">Bat</option>
                                                        <option value="bowl">Bowl</option>
                                                    </select>
                                                ) : (
                                                    <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold capitalize">{tossDecision}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Limits */}
                                        {match.sport === 'cricket' && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Match Overs Limit</label>
                                                    {isScorer ? (
                                                        <input type="number" value={oversLimit} onChange={e => setOversLimit(Number(e.target.value) || 20)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                                    ) : (
                                                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold font-mono">{oversLimit} Overs</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Target Runs</label>
                                                    {isScorer ? (
                                                        <input type="number" value={targetRuns} onChange={e => setTargetRuns(Number(e.target.value) || 0)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none" />
                                                    ) : (
                                                        <div className="p-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold font-mono">{targetRuns || 'Not Set'}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {isScorer && (
                                            <button 
                                                onClick={saveMatchSettings}
                                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition active:scale-95"
                                            >
                                                <Save size={14} /> Save Match Settings
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab Contents: Manual adjustments */}
                            {activeTab === 'manual' && isScorer && (
                                <CricketManualAdjustment 
                                    match={match} 
                                    onSave={saveManualStats} 
                                />
                            )}
                        </div>
                    </div>
                    
                    {/* INFO / STREAM PANEL (RIGHT 1/3 COLUMN) */}
                    <div className="space-y-6">
                        
                        {/* Live video player helper */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                <Award size={16} className="text-indigo-600" /> Match Info
                            </h3>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between py-1 border-b border-gray-50">
                                    <span className="text-gray-400">Tournament / League:</span>
                                    <span className="font-bold text-gray-900">{match.series || 'TPL Premier League'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-50">
                                    <span className="text-gray-400">Match Type:</span>
                                    <span className="font-bold text-gray-900">{match.matchType || 'League'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-gray-50">
                                    <span className="text-gray-400">Sport:</span>
                                    <span className="font-bold text-gray-900 capitalize">{match.sport}</span>
                                </div>
                                {match.tossWinner && (
                                    <div className="flex justify-between py-1 border-b border-gray-50">
                                        <span className="text-gray-400">Toss:</span>
                                        <span className="font-bold text-gray-900">{match.tossWinner} decided to {match.tossDecision}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mini Commentary feed */}
                        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                                Live Feed
                            </h3>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {(match.commentary && match.commentary.length > 0) ? (
                                    match.commentary.slice(0, 10).map((c, i) => (
                                        <div key={i} className="text-xs border-b border-gray-50 pb-2 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="font-mono font-bold text-indigo-600">
                                                    {match.sport === 'cricket' ? `Ov ${c.over}.${c.ball}` : c.time || ''}
                                                </span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                    c.event === 'wicket' ? 'bg-red-50 text-red-600' :
                                                    c.event === 'four' || c.event === 'six' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'
                                                }`}>
                                                    {c.event}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 leading-relaxed">{c.description}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-6">No events logged yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Action buttons (Complete match, declaration) */}
                        {isScorer && (
                            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Scoring Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        onClick={async () => {
                                            if (confirm(`Confirm ${match.teamA.name} as Winner?`)) {
                                                await updateMatch(match._id, { status: 'COMPLETED', winner: match.teamA.code, statusText: `${match.teamA.name} won the match` }, match.sport || 'cricket');
                                                onRefresh();
                                            }
                                        }}
                                        className="py-2.5 px-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition active:scale-95"
                                    >
                                        👑 Win {match.teamA.code}
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (confirm(`Confirm ${match.teamB.name} as Winner?`)) {
                                                await updateMatch(match._id, { status: 'COMPLETED', winner: match.teamB.code, statusText: `${match.teamB.name} won the match` }, match.sport || 'cricket');
                                                onRefresh();
                                            }
                                        }}
                                        className="py-2.5 px-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition active:scale-95"
                                    >
                                        👑 Win {match.teamB.code}
                                    </button>
                                </div>
                                <button 
                                    onClick={async () => {
                                        if (confirm('Confirm this match ended in a Draw?')) {
                                            await updateMatch(match._id, { status: 'COMPLETED', winner: 'DRAW', statusText: 'Match ended in a draw' }, match.sport || 'cricket');
                                            onRefresh();
                                        }
                                    }}
                                    className="w-full py-2.5 bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95"
                                >
                                    🤝 Declare Draw / Tie
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Cricket Scorecard manual statistics adjustments component */
interface CricketManualAdjustmentProps {
    match: Match;
    onSave: (batting: any[], bowling: any[]) => void;
}

function CricketManualAdjustment({ match, onSave }: CricketManualAdjustmentProps) {
    const [battingList, setBattingList] = useState<any[]>(() => {
        return JSON.parse(JSON.stringify(match.battingLineup || []));
    });
    
    const [bowlingList, setBowlingList] = useState<any[]>(() => {
        return JSON.parse(JSON.stringify(match.bowlingLineup || []));
    });

    const [newBatterName, setNewBatterName] = useState('');
    const [newBowlerName, setNewBowlerName] = useState('');

    const handleBatterChange = (index: number, field: string, val: any) => {
        const nextList = [...battingList];
        nextList[index][field] = val;
        setBattingList(nextList);
    };

    const handleBowlerChange = (index: number, field: string, val: any) => {
        const nextList = [...bowlingList];
        nextList[index][field] = val;
        setBowlingList(nextList);
    };

    const deleteBatter = (index: number) => {
        setBattingList(prev => prev.filter((_, i) => i !== index));
    };

    const deleteBowler = (index: number) => {
        setBowlingList(prev => prev.filter((_, i) => i !== index));
    };

    const addBatterManual = () => {
        if (!newBatterName.trim()) return;
        setBattingList(prev => [...prev, {
            name: newBatterName.trim(),
            position: String(prev.length + 1),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            status: 'Yet to Bat',
            dismissal: ''
        }]);
        setNewBatterName('');
    };

    const addBowlerManual = () => {
        if (!newBowlerName.trim()) return;
        setBowlingList(prev => [...prev, {
            name: newBowlerName.trim(),
            overs: 0,
            maidens: 0,
            runs: 0,
            wickets: 0,
            wides: 0,
            noballs: 0
        }]);
        setNewBowlerName('');
    };

    return (
        <div className="space-y-6 pt-2 animate-fade-in">
            {/* Batter adjustments list */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider">Edit Batting Lineup Stats</h4>
                <div className="space-y-3">
                    {battingList.map((bat, idx) => (
                        <div key={idx} className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-150 text-xs items-center">
                            <div className="font-bold sm:col-span-2">{bat.name}</div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Runs</label>
                                <input type="number" min="0" value={bat.runs || 0} onChange={e => handleBatterChange(idx, 'runs', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Balls</label>
                                <input type="number" min="0" value={bat.balls || 0} onChange={e => handleBatterChange(idx, 'balls', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Fours</label>
                                <input type="number" min="0" value={bat.fours || 0} onChange={e => handleBatterChange(idx, 'fours', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Sixes</label>
                                <input type="number" min="0" value={bat.sixes || 0} onChange={e => handleBatterChange(idx, 'sixes', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div className="flex gap-2">
                                <select value={bat.status || 'Yet to Bat'} onChange={e => handleBatterChange(idx, 'status', e.target.value)} className="px-1.5 py-1 bg-white border border-gray-200 rounded">
                                    <option>Batting</option>
                                    <option>Out</option>
                                    <option>Yet to Bat</option>
                                </select>
                                <button onClick={() => deleteBatter(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2 max-w-sm">
                        <input placeholder="Add Batter Manually..." value={newBatterName} onChange={e => setNewBatterName(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs" />
                        <button onClick={addBatterManual} className="px-3 bg-gray-900 text-white rounded-xl text-xs font-bold">+</button>
                    </div>
                </div>
            </div>

            {/* Bowler adjustments list */}
            <div className="space-y-3">
                <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Edit Bowling Lineup Stats</h4>
                <div className="space-y-3">
                    {bowlingList.map((bowl, idx) => (
                        <div key={idx} className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-150 text-xs items-center">
                            <div className="font-bold sm:col-span-2">{bowl.name}</div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Overs</label>
                                <input type="number" min="0" step="0.1" value={bowl.overs || 0} onChange={e => handleBowlerChange(idx, 'overs', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Maidens</label>
                                <input type="number" min="0" value={bowl.maidens || 0} onChange={e => handleBowlerChange(idx, 'maidens', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Runs Conceded</label>
                                <input type="number" min="0" value={bowl.runs || 0} onChange={e => handleBowlerChange(idx, 'runs', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-gray-400 block">Wickets</label>
                                <input type="number" min="0" value={bowl.wickets || 0} onChange={e => handleBowlerChange(idx, 'wickets', Number(e.target.value) || 0)} className="w-full px-2 py-1 bg-white border border-gray-200 rounded" />
                            </div>
                            <div className="flex justify-end pr-2">
                                <button onClick={() => deleteBowler(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-2 max-w-sm">
                        <input placeholder="Add Bowler Manually..." value={newBowlerName} onChange={e => setNewBowlerName(e.target.value)} className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs" />
                        <button onClick={addBowlerManual} className="px-3 bg-gray-900 text-white rounded-xl text-xs font-bold">+</button>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => onSave(battingList, bowlingList)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-md transition active:scale-95"
            >
                Save Lineup Adjustments
            </button>
        </div>
    );
}

