import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Trash2, PlayCircle, X, Trophy, MapPin, Video, ExternalLink, Wifi, Radio, Film, Search } from 'lucide-react';
import { getMatches, createMatch, updateMatch, deleteMatch } from '../services/matchService';
import { getTeams } from '../services/teamService';
import type { Match } from '../services/matchService';
import type { Team } from '../services/teamService';
import MatchScorerFullPage from '../components/MatchScorerFullPage';

export default function Matches() {
    const { user } = useSelector((state: any) => state.auth);
    const userRole = user?.role || '';
    const isScorer = userRole === 'scorer' || userRole === 'admin' || userRole === 'super_admin';

    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [videoMatch, setVideoMatch] = useState<Match | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoType, setVideoType] = useState<'live' | 'preview' | 'recorded'>('recorded');
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamAId, setSelectedTeamAId] = useState('');
    const [selectedTeamBId, setSelectedTeamBId] = useState('');
    const [playerSearch, setPlayerSearch] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
    const [playerStatForm, setPlayerStatForm] = useState<any>({
        user: '',
        name: '',
        team: '',
        role: '',
        runs: '',
        wickets: '',
        catches: '',
        runOuts: '',
        overs: '',
        balls: '',
        goals: '',
        assists: '',
        minutes: '',
        raidPoints: '',
        tacklePoints: '',
        totalPoints: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        series: '',
        venue: 'TPL Stadium',
        sport: 'cricket',
        teamA: { name: '', code: '', logo: '' },
        teamB: { name: '', code: '', logo: '' }
    });

    

    const loadMatches = async () => {
        try {
            const data = await getMatches();
            if (Array.isArray(data)) {
                setMatches(data);
                if (selectedMatch) {
                    const updated = data.find((m: Match) => m._id === selectedMatch._id);
                    if (updated) {
                        setSelectedMatch(updated);
                        // Keep videoType in sync: auto-select based on status if not manually changed
                    }
                }
            } else {
                setMatches([]);
            }
        } catch (error) {
            console.error('Error loading matches', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTeams = async (sport: string) => {
        try {
            const teamData = await getTeams(sport);
            if (Array.isArray(teamData)) {
                setTeams(teamData);
            } else {
                setTeams([]);
            }
        } catch (error) {
            console.error('Error loading teams', error);
            setTeams([]);
        }
    };

    const selectExistingTeam = (side: 'A' | 'B', teamId: string) => {
        const team = teams.find(t => t._id === teamId);
        if (side === 'A') {
            setSelectedTeamAId(teamId);
            setFormData({
                ...formData,
                teamA: team ? { name: team.name, code: team.code, logo: team.logo } : { name: '', code: '', logo: '' }
            });
        } else {
            setSelectedTeamBId(teamId);
            setFormData({
                ...formData,
                teamB: team ? { name: team.name, code: team.code, logo: team.logo } : { name: '', code: '', logo: '' }
            });
        }
    };

    useEffect(() => {
        loadMatches();
        loadTeams(formData.sport);
        const interval = setInterval(loadMatches, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setSelectedTeamAId('');
        setSelectedTeamBId('');
        loadTeams(formData.sport);
    }, [formData.sport]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = { ...formData };
            if (!payload.series) {
                if (payload.sport === 'kabaddi') payload.series = 'Pro Kabaddi League';
                else if (payload.sport === 'football') payload.series = 'City Football Cup';
                else payload.series = 'TPL Premier League';
            }

            if (selectedTeamAId) payload.teamAId = selectedTeamAId;
            if (selectedTeamBId) payload.teamBId = selectedTeamBId;

            await createMatch(payload);
            setShowCreate(false);
            loadMatches();
            setSelectedTeamAId('');
            setSelectedTeamBId('');
            setFormData({
                title: '', series: '', venue: 'TPL Stadium', sport: 'cricket',
                teamA: { name: '', code: '', logo: '' }, teamB: { name: '', code: '', logo: '' }
            });
        } catch (error) {
            alert('Failed to create match');
        }
    };

    const handleDelete = async (id: string, sport: string = 'cricket', e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure?')) {
            await deleteMatch(id, sport);
            loadMatches();
        }
    };

    // --- SCORING LOGIC ---
    const updateCricketScore = async (team: 'A' | 'B', runs: number, isWicket: boolean, isBall: boolean) => {
        if (!selectedMatch || selectedMatch.sport !== 'cricket') return;

        const currentScore = team === 'A' ? selectedMatch.scoreA! : selectedMatch.scoreB!;
        let { runs: r, wickets: w, overs: o } = currentScore;

        r += runs;
        if (isWicket) w += 1;

        if (isBall) {
            let balls = Math.round((Math.floor(o) * 6) + ((o % 1) * 10));
            balls++;
            o = Math.floor(balls / 6) + (balls % 6) / 10;
        }

        const updates: any = {};
        if (team === 'A') updates.scoreA = { runs: r, wickets: w, overs: o };
        else updates.scoreB = { runs: r, wickets: w, overs: o };

        const target = selectedMatch.target || 0;
        if (target > 0 && team === 'B') {
            updates.statusText = `Need ${target - r} runs to win`;
        } else {
            updates.statusText = `${team === 'A' ? selectedMatch.teamA.code : selectedMatch.teamB.code} are batting`;
        }

        await updateMatch(selectedMatch._id, updates, 'cricket');
        loadMatches();
    };

    const updateSimpleScore = async (team: 'A' | 'B', points: number) => {
        if (!selectedMatch) return;
        let updates: any = {};
        const match: any = selectedMatch;
        const currentScore = team === 'A' ? (match.scoreA || 0) : (match.scoreB || 0);
        const newScore = currentScore + points;

        if (team === 'A') updates.scoreA = newScore;
        else updates.scoreB = newScore;

        await updateMatch(selectedMatch._id, updates, selectedMatch.sport || 'cricket');
        loadMatches();
    };

    const updateStatusText = async (text: string) => {
        if (!selectedMatch) return;
        await updateMatch(selectedMatch._id, { statusText: text }, selectedMatch.sport || 'cricket');
    };

    const finishMatch = async (winnerCode: string) => {
        if (!selectedMatch || !confirm(`Confirm ${winnerCode} as Winner? This will update Points Table.`)) return;
        await updateMatch(selectedMatch._id, {
            status: 'COMPLETED',
            winner: winnerCode
        }, selectedMatch.sport || 'cricket');
        loadMatches();
        setSelectedMatch(null);
    };

    const saveVideoForStatus = async (url: string = '', ytId: string = '', hUrl: string = '') => {
        if (!selectedMatch) return;
        
        const updates: any = {};
        
        // Handle standard status-based URL
        if (url.trim()) {
            const field = videoType === 'live' ? 'liveStreamUrl' :
                          videoType === 'preview' ? 'previewVideoUrl' :
                          'recordedVideoUrl';
            updates[field] = url.trim();
        }

        // Handle specific stream overrides
        if (ytId.trim()) updates.youtubeId = ytId.trim();
        if (hUrl.trim()) updates.hlsUrl = hUrl.trim();

        if (Object.keys(updates).length === 0) return;

        await updateMatch(selectedMatch._id, updates, selectedMatch.sport || 'cricket');
        loadMatches();
        // Clear local URL if we were using the shared input
        if (url.trim()) setVideoUrl('');
    };

    // Initialize videoType when opening a match scorer
    const openScorer = (match: Match) => {
        setSelectedMatch(match);
        setVideoType(
            match.status === 'LIVE' ? 'live' :
                match.status === 'UPCOMING' ? 'preview' :
                    'recorded'
        );
        setVideoUrl('');
    };

    useEffect(() => {
        if (!selectedMatch) return;
        setSelectedPlayer(null);
        setPlayerSearch('');
        setPlayerStatForm({
            user: '',
            name: '',
            team: '',
            role: '',
            runs: '',
            wickets: '',
            catches: '',
            runOuts: '',
            overs: '',
            balls: '',
            goals: '',
            assists: '',
            minutes: '',
            raidPoints: '',
            tacklePoints: '',
            totalPoints: ''
        });
    }, [selectedMatch]);

    const matchPlayers = useMemo(() => {
        if (!selectedMatch) return [];
        const teamA = (selectedMatch.teamAPlayers || []).map((player: any) => ({ ...player, teamCode: selectedMatch.teamA.code, teamName: selectedMatch.teamA.name, side: 'A' }));
        const teamB = (selectedMatch.teamBPlayers || []).map((player: any) => ({ ...player, teamCode: selectedMatch.teamB.code, teamName: selectedMatch.teamB.name, side: 'B' }));
        return [...teamA, ...teamB];
    }, [selectedMatch]);

    const filteredMatchPlayers = useMemo(() => {
        if (!playerSearch.trim()) return matchPlayers;
        const query = playerSearch.toLowerCase();
        return matchPlayers.filter((player: any) =>
            `${player.name || ''}`.toLowerCase().includes(query) ||
            `${player.role || ''}`.toLowerCase().includes(query) ||
            `${player.teamCode || ''}`.toLowerCase().includes(query)
        );
    }, [matchPlayers, playerSearch]);

    const selectPlayerForScoring = (player: any) => {
        setSelectedPlayer(player);
        setPlayerStatForm({
            user: player.user || player._id || '',
            name: player.name || player.fullName || '',
            team: player.teamCode || selectedMatch?.teamA.code || '',
            role: player.role || '',
            runs: '',
            wickets: '',
            catches: '',
            runOuts: '',
            overs: '',
            balls: '',
            goals: '',
            assists: '',
            minutes: '',
            raidPoints: '',
            tacklePoints: '',
            totalPoints: ''
        });
    };

    const handlePlayerStatChange = (field: string, value: string) => {
        setPlayerStatForm({ ...playerStatForm, [field]: value });
    };

    const savePlayerStats = async () => {
        if (!selectedMatch || !selectedPlayer) return;
        const normalized = {
            user: playerStatForm.user,
            name: playerStatForm.name,
            team: playerStatForm.team,
            role: playerStatForm.role,
            runs: Number(playerStatForm.runs) || 0,
            wickets: Number(playerStatForm.wickets) || 0,
            catches: Number(playerStatForm.catches) || 0,
            runOuts: Number(playerStatForm.runOuts) || 0,
            overs: Number(playerStatForm.overs) || 0,
            balls: Number(playerStatForm.balls) || 0,
            goals: Number(playerStatForm.goals) || 0,
            assists: Number(playerStatForm.assists) || 0,
            minutes: Number(playerStatForm.minutes) || 0,
            raidPoints: Number(playerStatForm.raidPoints) || 0,
            tacklePoints: Number(playerStatForm.tacklePoints) || 0,
            totalPoints: Number(playerStatForm.totalPoints) || 0
        };

        const existing = selectedMatch.playerStats || [];
        const nextStats = existing.filter((item: any) => item.user?.toString() !== normalized.user?.toString());
        nextStats.push(normalized);

        await updateMatch(selectedMatch._id, { playerStats: nextStats }, selectedMatch.sport || 'cricket');
        loadMatches();
        const refreshed = (await getMatches()).find((m: Match) => m._id === selectedMatch._id);
        if (refreshed) setSelectedMatch(refreshed);
    };

    // Get video config based on match status
    const getVideoConfig = (match: Match) => {
        if (match.status === 'LIVE') return {
            field: 'liveStreamUrl' as const,
            current: match.liveStreamUrl,
            label: 'ðŸ”´ Live Stream URL',
            placeholder: 'YouTube Live, HLS stream, or any live URL...',
            badge: 'Live',
            icon: <Wifi size={10} />,
            btnColor: 'bg-red-600 hover:bg-red-700 shadow-red-500/20',
            indicator: 'bg-red-500',
            text: 'text-red-600',
        };
        if (match.status === 'UPCOMING') return {
            field: 'previewVideoUrl' as const,
            current: match.previewVideoUrl,
            label: 'ðŸ“… Preview / Teaser URL',
            placeholder: 'YouTube promo, teaser clip URL...',
            badge: 'Preview',
            icon: <Radio size={10} />,
            btnColor: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20',
            indicator: 'bg-orange-500',
            text: 'text-orange-600',
        };
        return {
            field: 'recordedVideoUrl' as const,
            current: match.recordedVideoUrl,
            label: 'ðŸŽ¬ Highlights / Full Match URL',
            placeholder: 'YouTube highlights, full match recording URL...',
            badge: 'Watch',
            icon: <Film size={10} />,
            btnColor: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20',
            indicator: 'bg-emerald-500',
            text: 'text-emerald-600',
        };
    };

    // Convert YouTube watch URLs to embed URLs
    const toEmbedUrl = (url: string) => {
        if (!url) return url;
        const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([\w-]+)/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
        return url;
    };

    const isYoutube = (url: string) => /youtube\.com|youtu\.be/.test(url);
    const isDirectVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

    // Active video URL for a match (based on its status)
    const getActiveVideoUrl = (match: Match): string | undefined => {
        if (match.status === 'LIVE') return match.liveStreamUrl;
        if (match.status === 'UPCOMING') return match.previewVideoUrl;
        return match.recordedVideoUrl;
    };

    // If a match is selected, show full-page scorer dashboard instead of the grid
    if (selectedMatch) {
        return (
            <MatchScorerFullPage
                match={selectedMatch}
                onBack={() => setSelectedMatch(null)}
                onRefresh={loadMatches}
                isScorer={isScorer}
                userRole={userRole}
            />
        );
    }

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                        Matches <Trophy className="text-amber-500 fill-amber-100" size={22} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">Live games & schedule</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                    <Plus size={14} /> New Match
                </button>
            </div>

            {/* Matches Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
                        <Trophy size={24} className="text-gray-300" />
                    </div>
                    <div className="text-xs font-bold text-gray-400">Loading matchesâ€¦</div>
                </div>
            ) : matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <Trophy size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">No matches yet</p>
                    <p className="text-xs text-gray-400">Create your first match to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {matches.map((match, idx) => (
                        <div
                            key={match._id}
                            onClick={() => openScorer(match)}
                            className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
                            style={{ animation: `fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 0.04}s both` }}
                        >
                            {/* Status Badge + Video Badge */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${match.status === 'LIVE' ? 'bg-red-500 text-white border-0 animate-pulse' :
                                    match.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                        'bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}>
                                    {match.status === 'LIVE' && <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />}
                                    {match.status}
                                </span>
                                {getActiveVideoUrl(match) && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setVideoMatch(match); }}
                                        className={`flex items-center gap-1 text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow-lg transition-colors ${match.status === 'LIVE' ? 'bg-red-600 hover:bg-red-700' :
                                            match.status === 'UPCOMING' ? 'bg-orange-500 hover:bg-orange-600' :
                                                'bg-indigo-600 hover:bg-indigo-700'
                                            }`}
                                    >
                                        {getVideoConfig(match).icon} {getVideoConfig(match).badge}
                                    </button>
                                )}
                            </div>

                            {/* Top Gradient Stripe */}
                            <div className={`h-24 w-full opacity-10 absolute top-0 left-0 bg-gradient-to-b ${match.sport === 'kabaddi' ? 'from-orange-500 to-transparent' :
                                match.sport === 'football' ? 'from-emerald-500 to-transparent' :
                                    'from-indigo-500 to-transparent'
                                }`} />

                            <div className="p-6 pt-8 relative z-10">
                                {/* Title & Venue */}
                                <div className="text-center mb-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 opacity-80">{match.series || match.sport}</h4>
                                    <div className="flex items-center justify-center gap-1.5 text-gray-400">
                                        <MapPin size={10} />
                                        <span className="text-[10px] font-semibold truncate uppercase">{match.venue}</span>
                                    </div>
                                </div>

                                {/* Score Display */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-center flex-1">
                                        <div className="text-2xl font-black text-gray-900">{match.teamA.code}</div>
                                        <div className={`text-sm font-bold mt-1 ${match.status === 'LIVE' ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {match.sport === 'cricket' && match.scoreA ? `${match.scoreA.runs}/${match.scoreA.wickets}` : (match as any).scoreA}
                                        </div>
                                        {match.sport === 'cricket' && match.scoreA && <div className="text-[9px] font-mono text-gray-400">{match.scoreA.overs} Ov</div>}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-200 px-2">VS</div>
                                    <div className="text-center flex-1">
                                        <div className="text-2xl font-black text-gray-900">{match.teamB.code}</div>
                                        <div className={`text-sm font-bold mt-1 ${match.status === 'LIVE' ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {match.sport === 'cricket' && match.scoreB ? `${match.scoreB.runs}/${match.scoreB.wickets}` : (match as any).scoreB}
                                        </div>
                                        {match.sport === 'cricket' && match.scoreB && <div className="text-[9px] font-mono text-gray-400">{match.scoreB.overs} Ov</div>}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                                    <span className="text-[10px] font-semibold text-gray-400 italic truncate max-w-[140px]">{match.statusText || 'No status update'}</span>
                                    <div
                                        onClick={(e) => handleDelete(match._id, match.sport, e)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
                                    >
                                        <Trash2 size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreate && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center md:pl-72 z-[999] p-4"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                        style={{ animation: 'modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h2 className="text-base font-black text-gray-900">New Match</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Set up teams and venue</p>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"><X size={16} className="text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="flex-1 overflow-y-auto">
                          <div className="p-6 space-y-5">
                            {/* Sport Tabs */}
                            <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded-xl">
                                {['cricket', 'kabaddi', 'football'].map(s => (
                                    <button
                                        type="button"
                                        key={s}
                                        onClick={() => setFormData({ ...formData, sport: s })}
                                        className={`py-2 rounded-lg text-[11px] font-bold capitalize transition-all duration-200 ${formData.sport === s
                                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Title + Venue side by side */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Match Title</label>
                                    <input placeholder="e.g. Final" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400" required />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Venue</label>
                                    <input placeholder="Stadium name" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400" required />
                                </div>
                            </div>

                            {/* Teams side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Team A */}
                                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-2.5">
                                    <label className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1 block">Team A</label>
                                    <select value={selectedTeamAId} onChange={e => selectExistingTeam('A', e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all">
                                        <option value="">Select or enter manually</option>
                                        {teams.length > 0 ? teams.map(team => (
                                            <option key={team._id} value={team._id}>{team.code} - {team.name}</option>
                                        )) : <option value="">No existing teams found</option>}
                                    </select>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input placeholder="Full Name" value={formData.teamA.name} onChange={e => { setSelectedTeamAId(''); setFormData({ ...formData, teamA: { ...formData.teamA, name: e.target.value, code: e.target.value.substring(0, 3).toUpperCase() } }); }} className="col-span-2 w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400" required />
                                        <input placeholder="Code" value={formData.teamA.code} onChange={e => { setSelectedTeamAId(''); setFormData({ ...formData, teamA: { ...formData.teamA, code: e.target.value } }); }} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400 uppercase" required />
                                    </div>
                                    {selectedTeamAId && (
                                        <div className="pt-1">
                                            <div className="text-[10px] font-bold text-gray-500 mb-1">Squad ({teams.find(t => t._id === selectedTeamAId)?.players?.length || 0})</div>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {teams.find(t => t._id === selectedTeamAId)?.players?.slice(0,6).map((p: any) => (
                                                    <span key={p.user || p._id} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">{p.name || p.fullName || p.displayName || 'Player'}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Team B */}
                                <div className="p-4 rounded-xl border border-orange-100 bg-orange-50/30 space-y-2.5">
                                    <label className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mb-1 block">Team B</label>
                                    <select value={selectedTeamBId} onChange={e => selectExistingTeam('B', e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all">
                                        <option value="">Select or enter manually</option>
                                        {teams.length > 0 ? teams.map(team => (
                                            <option key={team._id} value={team._id}>{team.code} - {team.name}</option>
                                        )) : <option value="">No existing teams found</option>}
                                    </select>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input placeholder="Full Name" value={formData.teamB.name} onChange={e => { setSelectedTeamBId(''); setFormData({ ...formData, teamB: { ...formData.teamB, name: e.target.value, code: e.target.value.substring(0, 3).toUpperCase() } }); }} className="col-span-2 w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-gray-400" required />
                                        <input placeholder="Code" value={formData.teamB.code} onChange={e => { setSelectedTeamBId(''); setFormData({ ...formData, teamB: { ...formData.teamB, code: e.target.value } }); }} className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-gray-400 uppercase" required />
                                    </div>
                                    {selectedTeamBId && (
                                        <div className="pt-1">
                                            <div className="text-[10px] font-bold text-gray-500 mb-1">Squad ({teams.find(t => t._id === selectedTeamBId)?.players?.length || 0})</div>
                                            <div className="flex gap-1.5 flex-wrap">
                                                {teams.find(t => t._id === selectedTeamBId)?.players?.slice(0,6).map((p: any) => (
                                                    <span key={p.user || p._id} className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-medium">{p.name || p.fullName || p.displayName || 'Player'}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                          </div>
                          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex-shrink-0">
                            <button type="submit" className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all duration-200 shadow-lg shadow-gray-900/15 active:scale-[0.98]">Create Match</button>
                          </div>
                        </form>
                    </div>
                </div>
            )}

            {videoMatch && getActiveVideoUrl(videoMatch) && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center md:pl-72 z-[1000] p-4"
                    onClick={() => setVideoMatch(null)}
                >
                    <div
                        className="w-full max-w-4xl animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${videoMatch.status === 'LIVE' ? 'bg-red-600 text-white animate-pulse' :
                                        videoMatch.status === 'UPCOMING' ? 'bg-orange-500 text-white' :
                                            'bg-indigo-600 text-white'
                                        }`}>
                                        {videoMatch.status === 'LIVE' ? 'ðŸ”´ Live Stream' : videoMatch.status === 'UPCOMING' ? 'ðŸ“… Preview' : 'ðŸŽ¬ Highlights'}
                                    </span>
                                </div>
                                <h2 className="text-white font-black text-lg">{videoMatch.teamA.code} vs {videoMatch.teamB.code}</h2>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{videoMatch.series} Â· {videoMatch.venue}</p>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={getActiveVideoUrl(videoMatch)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs font-bold bg-white/10 px-3 py-2 rounded-xl transition-colors"
                                >
                                    <ExternalLink size={12} /> Open
                                </a>
                                <button onClick={() => setVideoMatch(null)} className="p-2 bg-white/10 text-gray-400 hover:text-white rounded-xl transition-colors">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Video Container */}
                        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingTop: isYoutube(getActiveVideoUrl(videoMatch)!) || !isDirectVideo(getActiveVideoUrl(videoMatch)!) ? '56.25%' : '0' }}>
                            {isYoutube(getActiveVideoUrl(videoMatch)!) ? (
                                <iframe
                                    src={toEmbedUrl(getActiveVideoUrl(videoMatch)!)}
                                    className="absolute inset-0 w-full h-full rounded-2xl"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    title="Match Video"
                                />
                            ) : isDirectVideo(getActiveVideoUrl(videoMatch)!) ? (
                                <video
                                    src={getActiveVideoUrl(videoMatch)}
                                    controls
                                    autoPlay
                                    className="w-full rounded-2xl max-h-[70vh]"
                                />
                            ) : (
                                <iframe
                                    src={getActiveVideoUrl(videoMatch)}
                                    className="absolute inset-0 w-full h-full rounded-2xl"
                                    allowFullScreen
                                    title="Match Video"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Keyframes */}
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}

function ScoreBtn({ onClick, label, color = "bg-white text-gray-700 hover:bg-gray-50 border-gray-200" }: any) {
    return <button onClick={onClick} className={`${color} font-black py-3 rounded-xl text-xs transition-all border shadow-sm active:scale-95`}>{label}</button>;
}
