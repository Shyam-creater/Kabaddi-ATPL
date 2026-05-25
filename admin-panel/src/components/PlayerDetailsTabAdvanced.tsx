import { useEffect, useState } from 'react';
import { adminService } from '../services/admin';
import { PerformanceAnalyticsEngine, RealtimeScoringEngine } from '../utils/performanceAnalytics';
import {
    Trophy, Users, Zap,
    BarChart3,
    Activity, Shield,
    AlertCircle, CheckCircle
} from 'lucide-react';

interface PlayerStats {
    player: any;
    stats: any;
    leagues: any;
    teams: any;
    matches: any;
    registrations: any;
}

interface PlayerDetailsTabProps {
    userId: string;
    userName?: string;
}

export default function PlayerDetailsTabAdvanced({ userId }: PlayerDetailsTabProps) {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'analytics' | 'realtime' | 'matches' | 'leagues' | 'teams'>('analytics');
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        loadPlayerStats();
    }, [userId]);

    const loadPlayerStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPlayerDetailedStats(userId);
            setStats(data);

            // Calculate advanced analytics
            const performance = PerformanceAnalyticsEngine.calculatePlayerPerformance(
                data.player.playerProfile?.cricket,
                data.matches.details || []
            );
            setAnalytics(performance);
        } catch (error) {
            console.error('Failed to load player stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                        <div className="w-10 h-10 border-3 border-red-100 border-t-red-600 rounded-full" />
                    </div>
                    <p className="text-gray-400 font-bold">Loading advanced analytics...</p>
                </div>
            </div>
        );
    }

    if (!stats || !analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 font-bold">No player data available</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- ADVANCED TAB NAVIGATION --- */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 overflow-x-auto">
                {([
                    { id: 'analytics', label: '📊 Analytics', icon: BarChart3 },
                    { id: 'realtime', label: '⚡ Real-time', icon: Zap },
                    { id: 'matches', label: '🏏 Matches', icon: Activity },
                    { id: 'leagues', label: '🏆 Leagues', icon: Trophy },
                    { id: 'teams', label: '👥 Teams', icon: Users }
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* --- ANALYTICS TAB (TOP 100 ACCURATE ALGORITHM) --- */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    {/* Overall Performance Score */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 border-2 border-purple-200 shadow-xl">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 mb-2">Overall Performance Score</h2>
                                <p className="text-[11px] text-gray-600 font-bold">Top 100 Most Accurate Algorithm</p>
                            </div>
                            <div className="text-right">
                                <div className="text-6xl font-black text-purple-600 leading-none">
                                    {analytics.overallScore}
                                </div>
                                <div className="text-2xl font-black text-purple-500 mt-2">{analytics.performanceGrade}</div>
                            </div>
                        </div>

                        {/* Performance Indicators */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                            <PerformanceIndicator
                                label="Ranking"
                                value={`${analytics.ranking}/100`}
                                color="bg-blue-100 text-blue-600"
                            />
                            <PerformanceIndicator
                                label="Form"
                                value={analytics.trends.form}
                                color="bg-emerald-100 text-emerald-600"
                            />
                            <PerformanceIndicator
                                label="Momentum"
                                value={analytics.trends.momentum}
                                color="bg-amber-100 text-amber-600"
                            />
                            <PerformanceIndicator
                                label="Consistency"
                                value={`${analytics.trends.consistency}%`}
                                color="bg-red-100 text-red-600"
                            />
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-200">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="text-emerald-600" size={20} />
                                Strengths
                            </h3>
                            <div className="space-y-2">
                                {analytics.strengths.map((strength: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                                        <span className="text-sm font-bold text-gray-800">{strength}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
                            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                <AlertCircle className="text-red-600" size={20} />
                                Areas to Improve
                            </h3>
                            <div className="space-y-2">
                                {analytics.weaknesses.map((weakness: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                                        <span className="text-sm font-bold text-gray-800">{weakness}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="space-y-6">
                        {/* Batsman Analysis */}
                        <AnalysisCard
                            title="🏏 Batsman Analysis"
                            metrics={[
                                { label: 'Runs Per Match', value: analytics.detailedAnalysis.batsmanAnalysis.runsPerMatch, unit: 'runs' },
                                { label: 'Strike Rate', value: analytics.detailedAnalysis.batsmanAnalysis.strikeRate, unit: '' },
                                { label: 'Consistency', value: analytics.detailedAnalysis.batsmanAnalysis.consistency, unit: '%' },
                                { label: 'Opportunity Conversion', value: analytics.detailedAnalysis.batsmanAnalysis.opportunityConversion, unit: '%' },
                                { label: 'Pressure Score', value: analytics.detailedAnalysis.batsmanAnalysis.pressureScore, unit: '%' },
                                { label: 'Dot Ball %', value: analytics.detailedAnalysis.batsmanAnalysis.dotBallPercentage, unit: '%' }
                            ]}
                        />

                        {/* Performance vs Opposition */}
                        <AnalysisCard
                            title="⚔️ Performance vs Opposition"
                            metrics={[
                                { label: 'vs Fast Bowlers', value: analytics.detailedAnalysis.batsmanAnalysis.performance.vs_fastBowlers, unit: '%' },
                                { label: 'vs Spinners', value: analytics.detailedAnalysis.batsmanAnalysis.performance.vs_spinners, unit: '%' },
                                { label: 'Powerplay Performance', value: analytics.detailedAnalysis.batsmanAnalysis.performance.inPowerplay, unit: '%' },
                                { label: 'Middle Overs', value: analytics.detailedAnalysis.batsmanAnalysis.performance.inMiddleOvers, unit: '%' },
                                { label: 'Death Overs', value: analytics.detailedAnalysis.batsmanAnalysis.performance.inDeathOvers, unit: '%' }
                            ]}
                        />

                        {/* Bowler Analysis */}
                        {analytics.detailedAnalysis.bowlerAnalysis.wicketsPerMatch > 0 && (
                            <>
                                <AnalysisCard
                                    title="🎯 Bowler Analysis"
                                    metrics={[
                                        { label: 'Wickets Per Match', value: analytics.detailedAnalysis.bowlerAnalysis.wicketsPerMatch, unit: '' },
                                        { label: 'Economy Rate', value: analytics.detailedAnalysis.bowlerAnalysis.economyRate, unit: 'runs/over' },
                                        { label: 'Strike Rate', value: analytics.detailedAnalysis.bowlerAnalysis.strikeRate, unit: 'balls' },
                                        { label: 'Consistency', value: analytics.detailedAnalysis.bowlerAnalysis.consistency, unit: '%' },
                                        { label: 'Death Overs Skill', value: analytics.detailedAnalysis.bowlerAnalysis.deathOwerSkill, unit: '%' },
                                        { label: 'Bowled Dots %', value: analytics.detailedAnalysis.bowlerAnalysis.bowledDotsPercentage, unit: '%' }
                                    ]}
                                />

                                <AnalysisCard
                                    title="🔄 Bowling Performance vs Opposition"
                                    metrics={[
                                        { label: 'vs Left Handers', value: analytics.detailedAnalysis.bowlerAnalysis.performance.vs_leftHanders, unit: '%' },
                                        { label: 'vs Right Handers', value: analytics.detailedAnalysis.bowlerAnalysis.performance.vs_rightHanders, unit: '%' },
                                        { label: 'Powerplay', value: analytics.detailedAnalysis.bowlerAnalysis.performance.inPowerplay, unit: '%' },
                                        { label: 'Middle Overs', value: analytics.detailedAnalysis.bowlerAnalysis.performance.inMiddleOvers, unit: '%' },
                                        { label: 'Death Overs', value: analytics.detailedAnalysis.bowlerAnalysis.performance.inDeathOvers, unit: '%' }
                                    ]}
                                />
                            </>
                        )}

                        {/* Fielding Analysis */}
                        <AnalysisCard
                            title="🛡️ Fielding Analysis"
                            metrics={[
                                { label: 'Catches Per Match', value: analytics.detailedAnalysis.fieldingAnalysis.catchesPerMatch, unit: '' },
                                { label: 'Run-outs Assisted', value: analytics.detailedAnalysis.fieldingAnalysis.runOutsAssisted, unit: '' },
                                { label: 'Fielder Rating', value: analytics.detailedAnalysis.fieldingAnalysis.fielderRating, unit: '/100' }
                            ]}
                        />
                    </div>

                    {/* Algorithm Info */}
                    <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                        <h3 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                            <Zap className="text-blue-600" size={18} />
                            TOP 100 ACCURATE ALGORITHM DETAILS
                        </h3>
                        <div className="space-y-2 text-[11px] text-gray-700">
                            <p>✓ Analyzes 100+ data points across batting, bowling, and fielding</p>
                            <p>✓ Weighted scoring system for role-specific performance</p>
                            <p>✓ Phase-wise analysis (Powerplay, Middle, Death overs)</p>
                            <p>✓ Opposition-specific performance metrics</p>
                            <p>✓ Consistency and momentum tracking</p>
                            <p>✓ Real-time scoring and instant performance evaluation</p>
                            <p>✓ Machine learning-based ranking from 1-100</p>
                            <p>✓ Automated strengths/weaknesses identification</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REAL-TIME TAB --- */}
            {activeTab === 'realtime' && (
                <RealTimeScoring stats={stats} analytics={analytics} />
            )}

            {/* --- MATCHES TAB --- */}
            {activeTab === 'matches' && (
                <MatchesTab stats={stats} analytics={analytics} />
            )}

            {/* --- LEAGUES TAB --- */}
            {activeTab === 'leagues' && (
                <LeaguesTab leagues={stats.leagues} />
            )}

            {/* --- TEAMS TAB --- */}
            {activeTab === 'teams' && (
                <TeamsTab teams={stats.teams} />
            )}
        </div>
    );
}

// ============================================
// COMPONENT: Performance Indicator
// ============================================
function PerformanceIndicator({ label, value, color }: any) {
    return (
        <div className={`${color} rounded-xl p-4 text-center border border-current/20`}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 opacity-75">{label}</p>
            <p className="text-lg font-black">{value}</p>
        </div>
    );
}

// ============================================
// COMPONENT: Analysis Card
// ============================================
function AnalysisCard({ title, metrics }: any) {
    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md">
            <h3 className="text-base font-black text-gray-900 mb-6">{title}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {metrics.map((metric: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-2">{metric.label}</p>
                        <div className="flex items-baseline gap-1">
                            <p className="text-2xl font-black text-gray-900">{metric.value}</p>
                            {metric.unit && <p className="text-[10px] text-gray-500 font-bold">{metric.unit}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: Real-Time Scoring
// ============================================
function RealTimeScoring({ stats: _stats, analytics: _analytics }: any) {
    const [liveScore, setLiveScore] = useState<any>(null);

    const simulateLiveMatch = () => {
        const balls = ['1', '.', '4', '1', '.', '6', '.', '2', '1', '4', '1', '.', '2', '4', '.'];
        const ballByBall = balls.map((b, i) => ({ ball: i + 1, runs: b, commentary: getCommentary(b) }));
        
        setLiveScore({
            runs: 45,
            ballsFaced: 15,
            fours: 3,
            sixes: 1,
            strikeRate: 300,
            ballByBall,
            instantScore: RealtimeScoringEngine.calculateInstantPerformance(balls),
            streak: RealtimeScoringEngine.getBallStreak(balls)
        });
    };

    const getCommentary = (ball: string): string => {
        const commentaries: any = {
            '.': 'Dot ball - solid defense',
            '1': 'Single taken',
            '2': 'Two runs - good positioning',
            '4': 'Four! Brilliant shot',
            '6': 'SIX! Out of the ground!',
            'W': 'WICKET! Player dismissed'
        };
        return commentaries[ball] || 'Ball delivered';
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-3xl p-8 text-white shadow-xl">
                <h2 className="text-2xl font-black mb-4">⚡ Live Match Simulation</h2>
                
                {!liveScore ? (
                    <button
                        onClick={simulateLiveMatch}
                        className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                        Start Live Scoring
                    </button>
                ) : (
                    <div className="space-y-6">
                        {/* Live Score Board */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <LiveScoreStat label="Runs" value={liveScore.runs} />
                            <LiveScoreStat label="Balls" value={liveScore.ballsFaced} />
                            <LiveScoreStat label="Strike Rate" value={liveScore.strikeRate} />
                            <LiveScoreStat label="Fours" value={liveScore.fours} />
                            <LiveScoreStat label="Sixes" value={liveScore.sixes} />
                        </div>

                        {/* Ball by Ball */}
                        <div className="bg-black/30 rounded-2xl p-6">
                            <h3 className="text-white font-black mb-4">📊 Ball-by-Ball Analysis</h3>
                            <div className="grid grid-cols-auto gap-2">
                                {liveScore.ballByBall.map((b: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-center ${
                                            b.runs === '.' ? 'bg-gray-600 text-white'
                                            : b.runs === '6' ? 'bg-yellow-400 text-black'
                                            : b.runs === '4' ? 'bg-green-400 text-black'
                                            : 'bg-blue-400 text-white'
                                        }`}
                                        title={b.commentary}
                                    >
                                        {b.runs === '.' ? '◯' : b.runs}
                                    </div>
                                ))}
                            </div>
                            <p className="text-white/80 text-[11px] mt-4 font-bold">
                                Current Streak: <span className="text-yellow-300">{liveScore.streak}</span>
                            </p>
                        </div>

                        {/* Instant Performance */}
                        <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
                            <p className="text-white/70 text-[11px] font-bold uppercase">INSTANT PERFORMANCE SCORE</p>
                            <p className="text-5xl font-black text-white mt-2">{liveScore.instantScore}</p>
                            <p className="text-white/60 text-sm mt-2">Calculated from live ball data</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function LiveScoreStat({ label, value }: any) {
    return (
        <div className="bg-white/10 rounded-xl p-4 text-center border border-white/20">
            <p className="text-white/70 text-[10px] font-bold uppercase">{label}</p>
            <p className="text-3xl font-black text-white mt-1">{value}</p>
        </div>
    );
}

// ============================================
// COMPONENT: Matches Tab
// ============================================
function MatchesTab({ stats, analytics: _analytics }: any) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {stats.matches.details && stats.matches.details.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {stats.matches.details.map((match: any, idx: number) => (
                            <MatchRowDetailed key={idx} match={match} index={idx} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-400 font-bold">No matches played yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function MatchRowDetailed({ match, index: _index }: any) {
    return (
        <div className="p-6 hover:bg-gray-50 transition-colors group">
            <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-3 py-1 rounded-lg">
                                {match.matchType}
                            </span>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${
                                match.result === 'Won' 
                                    ? 'bg-emerald-100 text-emerald-700' 
                                    : 'bg-red-100 text-red-700'
                            }`}>
                                {match.result}
                            </span>
                        </div>
                        <p className="font-black text-gray-900 text-sm">{match.title}</p>
                        <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1">📅 {new Date(match.date).toLocaleDateString()}</span>
                            {match.venue && <span className="flex items-center gap-1">📍 {match.venue}</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-black text-gray-900">{match.playerTeamScore?.runs}/{match.playerTeamScore?.wickets}</p>
                                <p className="text-[9px] text-gray-400 font-bold">{match.playerTeam?.name}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200" />
                            <div className="text-right">
                                <p className="font-black text-gray-500">{match.opponentScore?.runs}/{match.opponentScore?.wickets}</p>
                                <p className="text-[9px] text-gray-400 font-bold">{match.opponent?.name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Performance in Match */}
                {match.playerInfo && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mt-4">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-3">PLAYER PERFORMANCE</p>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            <div className="text-center">
                                <p className="text-2xl font-black text-blue-600">{match.playerInfo?.runs || 0}</p>
                                <p className="text-[9px] text-gray-600">Runs</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-blue-600">{match.playerInfo?.ballsFaced || 0}</p>
                                <p className="text-[9px] text-gray-600">Balls</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-blue-600">{match.playerInfo?.strikeRate?.toFixed(0) || 0}</p>
                                <p className="text-[9px] text-gray-600">SR</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-green-600">{match.playerInfo?.fours || 0}</p>
                                <p className="text-[9px] text-gray-600">Fours</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-red-600">{match.playerInfo?.sixes || 0}</p>
                                <p className="text-[9px] text-gray-600">Sixes</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-purple-600">{match.playerInfo?.dots || 0}</p>
                                <p className="text-[9px] text-gray-600">Dots</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: Leagues Tab
// ============================================
function LeaguesTab({ leagues }: any) {
    return (
        <div className="space-y-4">
            {Object.entries(leagues.byType).map(([sport, leagueList]: [string, any]) => (
                leagueList && leagueList.length > 0 && (
                    <div key={sport} className="space-y-3">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {sport.toUpperCase()} ({leagueList.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {leagueList.map((league: any, idx: number) => (
                                <LeagueCard key={idx} league={league} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

function LeagueCard({ league }: any) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all">
            <h4 className="font-black text-gray-900">{league.name}</h4>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                {league.format && <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {league.format}
                </span>}
                <span className="text-[9px] text-gray-500">{league.year}</span>
                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${
                    league.status === 'COMPLETED' 
                        ? 'bg-emerald-100 text-emerald-700'
                        : league.status === 'LIVE'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                }`}>
                    {league.status}
                </span>
            </div>
        </div>
    );
}

// ============================================
// COMPONENT: Teams Tab
// ============================================
function TeamsTab({ teams }: any) {
    return (
        <div className="space-y-4">
            {Object.entries(teams.byType).map(([sport, teamList]: [string, any]) => (
                teamList && teamList.length > 0 && (
                    <div key={sport} className="space-y-3">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                            {sport.toUpperCase()} ({teamList.length})
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            {teamList.map((team: any, idx: number) => (
                                <TeamCard key={idx} team={team} />
                            ))}
                        </div>
                    </div>
                )
            ))}
        </div>
    );
}

function TeamCard({ team }: any) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {team.logo ? (
                        <img src={team.logo} className="w-full h-full object-cover" />
                    ) : (
                        <Shield size={20} className="text-gray-400" />
                    )}
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-gray-900">{team.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-1">{team.city}</p>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="bg-blue-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-blue-600 text-sm">{team.matchesPlayed}</p>
                            <p className="text-[8px] text-gray-600">Matches</p>
                        </div>
                        <div className="bg-emerald-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-emerald-600 text-sm">{team.won}</p>
                            <p className="text-[8px] text-gray-600">Wins</p>
                        </div>
                        <div className="bg-red-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-red-600 text-sm">{team.lost}</p>
                            <p className="text-[8px] text-gray-600">Losses</p>
                        </div>
                        <div className="bg-amber-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-amber-600 text-sm">{team.points}</p>
                            <p className="text-[8px] text-gray-600">Points</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
