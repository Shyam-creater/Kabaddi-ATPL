import { useEffect, useState } from 'react';
import { adminService } from '../services/admin';
import {
    TrendingUp, Trophy, Users, Zap, Target, Award,
    Calendar, MapPin,
    Activity, Shield
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

export default function PlayerDetailsTab({ userId }: PlayerDetailsTabProps) {
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'leagues' | 'teams'>('overview');

    useEffect(() => {
        loadPlayerStats();
    }, [userId]);

    const loadPlayerStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPlayerDetailedStats(userId);
            setStats(data);
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
                    <p className="text-gray-400 font-bold">Loading player statistics...</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400 font-bold">No player data available</p>
            </div>
        );
    }

    const { stats: playerStats, leagues, teams, matches, registrations } = stats;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* --- TAB NAVIGATION --- */}
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                {(['overview', 'matches', 'leagues', 'teams'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab
                                ? 'bg-white text-gray-900 shadow-md'
                                : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'overview' && '📊 Overview'}
                        {tab === 'matches' && '🏏 Matches'}
                        {tab === 'leagues' && '🏆 Leagues'}
                        {tab === 'teams' && '👥 Teams'}
                    </button>
                ))}
            </div>

            {/* --- OVERVIEW TAB --- */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatsCard
                            icon={Activity}
                            label="Total Matches"
                            value={playerStats.totalMatches}
                            color="bg-blue-50 text-blue-600"
                            iconBg="bg-blue-100"
                        />
                        <StatsCard
                            icon={Trophy}
                            label="Matches Won"
                            value={playerStats.matchesWon}
                            color="bg-emerald-50 text-emerald-600"
                            iconBg="bg-emerald-100"
                        />
                        <StatsCard
                            icon={Users}
                            label="Total Teams"
                            value={playerStats.totalTeams}
                            color="bg-purple-50 text-purple-600"
                            iconBg="bg-purple-100"
                        />
                        <StatsCard
                            icon={Zap}
                            label="Leagues"
                            value={playerStats.totalTournaments}
                            color="bg-amber-50 text-amber-600"
                            iconBg="bg-amber-100"
                        />
                    </div>

                    {/* Cricket Stats */}
                    {playerStats.totalRunsScored > 0 && (
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                                🏏 Cricket Performance
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <CricketStatBox label="Total Runs" value={playerStats.totalRunsScored} icon={Target} />
                                <CricketStatBox label="Total Wickets" value={playerStats.totalWickets} icon={Award} />
                                <CricketStatBox label="Batting Avg" value={playerStats.battingAverage.toFixed(2)} icon={TrendingUp} />
                                <CricketStatBox label="Strike Rate" value={playerStats.strikeRate.toFixed(2)} icon={Zap} />
                            </div>
                        </div>
                    )}

                    {/* Registration Summary */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-100 space-y-4">
                        <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                            📋 Registration Summary
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Total Registered</p>
                                <p className="text-3xl font-black text-gray-900">{registrations.total}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 space-y-2 border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase">Approved</p>
                                <p className="text-3xl font-black text-emerald-600">
                                    {registrations.details?.filter((r: any) => r.status === 'APPROVED').length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown by Sport */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4">
                        <h3 className="text-base font-black text-gray-900">Sport-wise Breakdown</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <SportBreakdown 
                                sport="Cricket" 
                                leagues={leagues.cricket} 
                                teams={teams.cricket}
                                color="bg-blue-50 text-blue-600" 
                            />
                            <SportBreakdown 
                                sport="Football" 
                                leagues={leagues.football} 
                                teams={teams.football}
                                color="bg-emerald-50 text-emerald-600" 
                            />
                            <SportBreakdown 
                                sport="Kabaddi" 
                                leagues={leagues.kabaddi} 
                                teams={teams.kabaddi}
                                color="bg-amber-50 text-amber-600" 
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* --- MATCHES TAB --- */}
            {activeTab === 'matches' && (
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                        {matches.details && matches.details.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {matches.details.map((match: any, idx: number) => (
                                    <MatchRow key={idx} match={match} index={idx} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 font-bold">No matches played yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- LEAGUES TAB --- */}
            {activeTab === 'leagues' && (
                <div className="space-y-4">
                    {Object.entries(leagues.byType).map(([sport, leagueList]: [string, any]) => (
                        leagueList && leagueList.length > 0 && (
                            <div key={sport} className="space-y-3">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                    {sport.toUpperCase()} Leagues ({leagueList.length})
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
            )}

            {/* --- TEAMS TAB --- */}
            {activeTab === 'teams' && (
                <div className="space-y-4">
                    {Object.entries(teams.byType).map(([sport, teamList]: [string, any]) => (
                        teamList && teamList.length > 0 && (
                            <div key={sport} className="space-y-3">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                    {sport.toUpperCase()} Teams ({teamList.length})
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
            )}
        </div>
    );
}

function StatsCard({ icon: Icon, label, value, color, iconBg }: any) {
    return (
        <div className={`${color} rounded-2xl p-4 border border-current/10`}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</p>
                    <p className="text-2xl font-black mt-1">{value}</p>
                </div>
                <div className={`${iconBg} p-2 rounded-lg`}>
                    <Icon size={16} />
                </div>
            </div>
        </div>
    );
}

function CricketStatBox({ label, value, icon: Icon }: any) {
    return (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
            <div className="flex justify-center mb-2">
                <Icon size={18} className="text-gray-600" />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        </div>
    );
}

function SportBreakdown({ sport, leagues, teams, color }: any) {
    return (
        <div className={`${color} rounded-xl p-4 border border-current/10`}>
            <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{sport}</p>
            <div className="mt-3 space-y-1">
                <p className="text-sm font-black">{leagues || 0} League(s)</p>
                <p className="text-sm font-black">{teams || 0} Team(s)</p>
            </div>
        </div>
    );
}

function MatchRow({ match, index: _index }: any) {
    return (
        <div className="p-6 hover:bg-gray-50 transition-colors group">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {match.matchType}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded ${
                            match.result === 'Won' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                        }`}>
                            {match.result}
                        </span>
                    </div>
                    <p className="font-black text-gray-900 text-sm group-hover:text-primary transition-colors">
                        {match.title}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(match.date).toLocaleDateString()}
                        </span>
                        {match.venue && (
                            <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {match.venue}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2">
                        <div className="text-right">
                            <p className="font-black text-gray-900">{match.playerTeamScore?.runs || 0}/{match.playerTeamScore?.wickets || 0}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{match.playerTeam?.name}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-gray-500">{match.opponentScore?.runs || 0}/{match.opponentScore?.wickets || 0}</p>
                            <p className="text-[9px] text-gray-400 font-bold">{match.opponent?.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function LeagueCard({ league }: any) {
    return (
        <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-primary hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h4 className="font-black text-gray-900">{league.name}</h4>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded uppercase">
                            {league.format || 'N/A'}
                        </span>
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
            </div>
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
                    <div className="grid grid-cols-3 gap-2 mt-3 text-[10px]">
                        <div className="bg-blue-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-blue-600">{team.matchesPlayed}</p>
                            <p className="text-[8px] text-gray-600">Matches</p>
                        </div>
                        <div className="bg-emerald-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-emerald-600">{team.won}</p>
                            <p className="text-[8px] text-gray-600">Wins</p>
                        </div>
                        <div className="bg-amber-50 rounded px-2 py-1 text-center">
                            <p className="font-black text-amber-600">{team.points}</p>
                            <p className="text-[8px] text-gray-600">Points</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
