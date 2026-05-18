import { useState, useEffect } from 'react';
import { Plus, Trash2, PlayCircle, X, Trophy, MapPin, Video, ExternalLink, Wifi, Radio, Film } from 'lucide-react';
import { getMatches, createMatch, updateMatch, deleteMatch } from '../services/matchService';
import type { Match } from '../services/matchService';

export default function Matches() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
    const [videoMatch, setVideoMatch] = useState<Match | null>(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoType, setVideoType] = useState<'live' | 'preview' | 'recorded'>('recorded');

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        series: '',
        venue: 'TPL Stadium',
        sport: 'cricket',
        teamA: { name: '', code: '' },
        teamB: { name: '', code: '' }
    });

    useEffect(() => {
        loadMatches();
        const interval = setInterval(loadMatches, 5000);
        return () => clearInterval(interval);
    }, []);

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

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (!payload.series) {
                if (payload.sport === 'kabaddi') payload.series = 'Pro Kabaddi League';
                else if (payload.sport === 'football') payload.series = 'City Football Cup';
                else payload.series = 'TPL Premier League';
            }

            await createMatch(payload);
            setShowCreate(false);
            loadMatches();
            setFormData({
                title: '', series: '', venue: 'TPL Stadium', sport: 'cricket',
                teamA: { name: '', code: '' }, teamB: { name: '', code: '' }
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

    // Get video config based on match status
    const getVideoConfig = (match: Match) => {
        if (match.status === 'LIVE') return {
            field: 'liveStreamUrl' as const,
            current: match.liveStreamUrl,
            label: '🔴 Live Stream URL',
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
            label: '📅 Preview / Teaser URL',
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
            label: '🎬 Highlights / Full Match URL',
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

    return (
        <div className="space-y-6 px-4 md:px-8 xl:px-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Matches <Trophy className="text-yellow-500 fill-yellow-100" size={24} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500">Live games & schedule</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-black shadow-lg shadow-gray-900/10 transition-all active:scale-95">
                    <Plus size={16} /> New Match
                </button>
            </div>

            {/* Matches Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Trophy size={48} className="text-gray-200 mb-4" />
                    <div className="text-xs font-bold text-gray-400">Loading matches...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-slide-in-right">
                    {matches.map((match, idx) => (
                        <div
                            key={match._id}
                            onClick={() => openScorer(match)}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            className="group cursor-pointer glass-card rounded-2xl border-transparent hover:border-indigo-200/50 shadow-sm hover:shadow-xl transition-all relative overflow-hidden"
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
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden my-10"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-lg font-black text-gray-900">Create New Match</h2>
                            <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl">
                                {['cricket', 'kabaddi', 'football'].map(s => (
                                    <div
                                        key={s}
                                        onClick={() => setFormData({ ...formData, sport: s })}
                                        className={`cursor-pointer text-center py-2 rounded-lg text-xs font-bold capitalize transition-all ${formData.sport === s
                                            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Match Details</label>
                                <div className="space-y-3">
                                    <input placeholder="Match Title (e.g. Final)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" required />
                                    <input placeholder="Venue" value={formData.venue} onChange={e => setFormData({ ...formData, venue: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Team A</label>
                                    <div className="space-y-2">
                                        <input placeholder="Full Name" value={formData.teamA.name} onChange={e => setFormData({ ...formData, teamA: { ...formData.teamA, name: e.target.value, code: e.target.value.substring(0, 3).toUpperCase() } })} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold" required />
                                        <input placeholder="Code (AAA)" value={formData.teamA.code} onChange={e => setFormData({ ...formData, teamA: { ...formData.teamA, code: e.target.value } })} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Team B</label>
                                    <div className="space-y-2">
                                        <input placeholder="Full Name" value={formData.teamB.name} onChange={e => setFormData({ ...formData, teamB: { ...formData.teamB, name: e.target.value, code: e.target.value.substring(0, 3).toUpperCase() } })} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold" required />
                                        <input placeholder="Code (BBB)" value={formData.teamB.code} onChange={e => setFormData({ ...formData, teamB: { ...formData.teamB, code: e.target.value } })} className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold" required />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-bold hover:bg-black mt-2 transition-transform active:scale-[0.98]">Create Match</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SCORER UI - Compact */}
            {selectedMatch && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setSelectedMatch(null)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-scale-in my-10 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Scorer Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 uppercase shadow-sm">{selectedMatch.sport || 'Cricket'}</span>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedMatch.venue}</span>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    {selectedMatch.teamA.code} <span className="text-lg text-gray-300 font-medium">vs</span> {selectedMatch.teamB.code}
                                </h2>
                            </div>
                            <div className="flex gap-2 items-center">
                                {/* ── Status Dropdown ── */}
                                <div className="relative">
                                    <select
                                        value={selectedMatch.status}
                                        onChange={async (e) => {
                                            await updateMatch(selectedMatch._id, { status: e.target.value }, selectedMatch.sport || 'cricket');
                                            loadMatches();
                                        }}
                                        className={`appearance-none cursor-pointer pl-3 pr-8 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-0 outline-none shadow-lg transition-all ${selectedMatch.status === 'LIVE' ? 'bg-red-500 text-white shadow-red-500/30' :
                                            selectedMatch.status === 'UPCOMING' ? 'bg-amber-500 text-white shadow-amber-500/30' :
                                                selectedMatch.status === 'COMPLETED' ? 'bg-emerald-500 text-white shadow-emerald-500/30' :
                                                    'bg-gray-400 text-white shadow-gray-400/30'
                                            }`}
                                    >
                                        <option value="UPCOMING">⏳ Upcoming</option>
                                        <option value="LIVE">🔴 Live</option>
                                        <option value="COMPLETED">✅ Completed</option>
                                        <option value="ABANDONED">🚫 Abandoned</option>
                                    </select>
                                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white text-[10px]">▾</span>
                                </div>
                                <button onClick={() => setSelectedMatch(null)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-xl transition-colors shadow-sm"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* TEAM A */}
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-inner">
                                        <h3 className="font-bold text-xs text-blue-900 uppercase tracking-wider mb-2">{selectedMatch.teamA.name}</h3>
                                        <div className="text-5xl font-black text-blue-600 tracking-tighter">
                                            {selectedMatch.sport === 'cricket' ? `${selectedMatch.scoreA?.runs}/${selectedMatch.scoreA?.wickets}` : (selectedMatch as any).scoreA}
                                        </div>
                                        {selectedMatch.sport === 'cricket' && <div className="text-sm text-blue-400 font-mono mt-2 font-bold bg-blue-100/50 inline-block px-2 py-1 rounded">Over: {selectedMatch.scoreA?.overs}</div>}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {selectedMatch.sport === 'cricket' ? (
                                            <>
                                                <ScoreBtn onClick={() => updateCricketScore('A', 0, false, true)} label="0" />
                                                <ScoreBtn onClick={() => updateCricketScore('A', 1, false, true)} label="1" />
                                                <ScoreBtn onClick={() => updateCricketScore('A', 4, false, true)} label="4" color="bg-green-100 text-green-700 hover:bg-green-200 border-green-200" />
                                                <ScoreBtn onClick={() => updateCricketScore('A', 6, false, true)} label="6" color="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200" />
                                                <ScoreBtn onClick={() => updateCricketScore('A', 0, true, true)} label="WKT" color="bg-red-100 text-red-700 hover:bg-red-200 border-red-200" />
                                            </>
                                        ) : (
                                            <>
                                                <ScoreBtn onClick={() => updateSimpleScore('A', 1)} label="+1" />
                                                <ScoreBtn onClick={() => updateSimpleScore('A', 2)} label="+2" />
                                                <ScoreBtn onClick={() => updateSimpleScore('A', -1)} label="-1" color="bg-red-50 text-red-500 hover:bg-red-100" />
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* TEAM B */}
                                <div className="space-y-4">
                                    <div className="p-6 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white shadow-inner">
                                        <h3 className="font-bold text-xs text-orange-900 uppercase tracking-wider mb-2">{selectedMatch.teamB.name}</h3>
                                        <div className="text-5xl font-black text-orange-600 tracking-tighter">
                                            {selectedMatch.sport === 'cricket' ? `${selectedMatch.scoreB?.runs}/${selectedMatch.scoreB?.wickets}` : (selectedMatch as any).scoreB}
                                        </div>
                                        {selectedMatch.sport === 'cricket' && <div className="text-sm text-orange-400 font-mono mt-2 font-bold bg-orange-100/50 inline-block px-2 py-1 rounded">Over: {selectedMatch.scoreB?.overs}</div>}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {selectedMatch.sport === 'cricket' ? (
                                            <>
                                                <ScoreBtn onClick={() => updateCricketScore('B', 0, false, true)} label="0" />
                                                <ScoreBtn onClick={() => updateCricketScore('B', 1, false, true)} label="1" />
                                                <ScoreBtn onClick={() => updateCricketScore('B', 4, false, true)} label="4" color="bg-green-100 text-green-700 hover:bg-green-200 border-green-200" />
                                                <ScoreBtn onClick={() => updateCricketScore('B', 6, false, true)} label="6" color="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200" />
                                                <ScoreBtn onClick={() => updateCricketScore('B', 0, true, true)} label="WKT" color="bg-red-100 text-red-700 hover:bg-red-200 border-red-200" />
                                            </>
                                        ) : (
                                            <>
                                                <ScoreBtn onClick={() => updateSimpleScore('B', 1)} label="+1" />
                                                <ScoreBtn onClick={() => updateSimpleScore('B', 2)} label="+2" />
                                                <ScoreBtn onClick={() => updateSimpleScore('B', -1)} label="-1" color="bg-red-50 text-red-500 hover:bg-red-100" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ─── Video Management ─── */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Video size={11} /> Video URL
                                    </label>
                                </div>

                                {/* ── Explicit 3-tab type selector ── */}
                                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-xl mb-3">
                                    {([
                                        { key: 'live', emoji: '🔴', label: 'Live Stream', saved: selectedMatch.liveStreamUrl },
                                        { key: 'preview', emoji: '📅', label: 'Preview', saved: selectedMatch.previewVideoUrl },
                                        { key: 'recorded', emoji: '🎬', label: 'Highlights', saved: selectedMatch.recordedVideoUrl },
                                    ] as const).map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => { setVideoType(tab.key); setVideoUrl(tab.saved || ''); }}
                                            className={`relative py-2 px-1 rounded-lg text-[10px] font-bold transition-all flex flex-col items-center gap-0.5 ${videoType === tab.key
                                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                                                    : 'text-gray-400 hover:text-gray-600'
                                                }`}
                                        >
                                            <span>{tab.emoji}</span>
                                            <span>{tab.label}</span>
                                            {tab.saved && (
                                                <span className={`absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full ${tab.key === 'live' ? 'bg-red-500' : tab.key === 'preview' ? 'bg-amber-500' : 'bg-indigo-500'
                                                    }`} title="URL saved" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* URL Input row */}
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-gray-900/10 transition-all font-mono"
                                        placeholder={
                                            videoType === 'live' ? 'Direct stream URL (e.g. YouTube URL)...' :
                                                videoType === 'preview' ? 'YouTube promo / teaser URL...' :
                                                    'YouTube highlights, full match URL...'
                                        }
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                    />
                                    <button
                                        onClick={() => saveVideoForStatus(videoUrl)}
                                        disabled={!videoUrl.trim()}
                                        className={`px-5 py-3 text-white rounded-xl text-xs font-bold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${videoType === 'live' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
                                                videoType === 'preview' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                                                    'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                                            }`}
                                    >
                                        Save
                                    </button>
                                </div>

                                {videoType === 'live' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                                <Radio size={10} className="text-red-500" /> YouTube Stream ID
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:bg-white"
                                                    placeholder="e.g. jfKfPfyJRdk"
                                                    defaultValue={selectedMatch.youtubeId}
                                                    onBlur={(e) => saveVideoForStatus('', e.target.value, '')}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                                <Radio size={10} className="text-blue-500" /> HLS Stream URL (.m3u8)
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 px-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-mono outline-none focus:bg-white"
                                                    placeholder="e.g. streaming.mpd/index.m3u8"
                                                    defaultValue={selectedMatch.hlsUrl}
                                                    onBlur={(e) => saveVideoForStatus('', '', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-3">
                                    {(videoType === 'live' ? selectedMatch.liveStreamUrl : videoType === 'preview' ? selectedMatch.previewVideoUrl : selectedMatch.recordedVideoUrl) && (
                                        <button
                                            onClick={() => setVideoMatch(selectedMatch)}
                                            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-bold hover:bg-gray-200 transition-all flex items-center gap-1.5"
                                        >
                                            <PlayCircle size={14} /> Test
                                        </button>
                                    )}
                                </div>

                                {/* Saved URL indicator */}
                                {(videoType === 'live' ? selectedMatch.liveStreamUrl : videoType === 'preview' ? selectedMatch.previewVideoUrl : selectedMatch.recordedVideoUrl) && (
                                    <p className={`mt-2 text-[10px] font-semibold flex items-center gap-1.5 ${videoType === 'live' ? 'text-red-600' : videoType === 'preview' ? 'text-amber-600' : 'text-indigo-600'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${videoType === 'live' ? 'bg-red-500' : videoType === 'preview' ? 'bg-amber-500' : 'bg-indigo-500'
                                            }`} />
                                        Saved: <span className="truncate max-w-[260px] text-gray-400 font-normal">
                                            {videoType === 'live' ? selectedMatch.liveStreamUrl : videoType === 'preview' ? selectedMatch.previewVideoUrl : selectedMatch.recordedVideoUrl}
                                        </span>
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4">
                                <input className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-gray-900/10 transition-all" placeholder="Update Status Text (e.g. In Innings Break)" onBlur={(e) => updateStatusText(e.target.value)} defaultValue={selectedMatch.statusText} />
                                <button onClick={() => finishMatch(selectedMatch.teamA.code)} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-all">End Match & Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* VIDEO PLAYER MODAL */}
            {videoMatch && getActiveVideoUrl(videoMatch) && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/90 backdrop-blur-md flex justify-center items-start z-[1000] p-4 overflow-y-auto"
                    onClick={() => setVideoMatch(null)}
                >
                    <div
                        className="w-full max-w-4xl my-10 animate-scale-in"
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
                                        {videoMatch.status === 'LIVE' ? '🔴 Live Stream' : videoMatch.status === 'UPCOMING' ? '📅 Preview' : '🎬 Highlights'}
                                    </span>
                                </div>
                                <h2 className="text-white font-black text-lg">{videoMatch.teamA.code} vs {videoMatch.teamB.code}</h2>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{videoMatch.series} · {videoMatch.venue}</p>
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
        </div>
    );
}

function ScoreBtn({ onClick, label, color = "bg-white text-gray-700 hover:bg-gray-50 border-gray-200" }: any) {
    return <button onClick={onClick} className={`${color} font-black py-3 rounded-xl text-xs transition-all border shadow-sm active:scale-95`}>{label}</button>;
}
