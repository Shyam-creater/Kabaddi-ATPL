import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Shield, X, Upload, Check, Users, MapPin, Search } from 'lucide-react';

export default function Teams() {
    const [teams, setTeams] = useState<any[]>([]);
    const [players, setPlayers] = useState<any[]>([]);
    const [teamPlayers, setTeamPlayers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSport, setSelectedSport] = useState('cricket');
    const [playerSearchTerm, setPlayerSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        _id: '',
        name: '',
        code: '',
        logo: '',
        city: '',
        captain: '',
        coach: '',
        owner: '',
        sport: 'cricket'
    });

    const sportConfig: Record<string, { color: string; bg: string; border: string; glow: string; ring: string }> = {
        cricket: { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', glow: 'shadow-indigo-500/20', ring: 'ring-indigo-500/20' },
        kabaddi: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', glow: 'shadow-orange-500/20', ring: 'ring-orange-500/20' },
        football: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', glow: 'shadow-emerald-500/20', ring: 'ring-emerald-500/20' },
    };

    const sport = sportConfig[selectedSport] || sportConfig.cricket;

    useEffect(() => {
        loadTeams();
        loadPlayers();
    }, [selectedSport]);

    const loadTeams = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teams?sport=${selectedSport}`);
            setTeams(res.data);
        } catch (error) {
            console.error('Failed to load teams', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPlayers = async () => {
        try {
            // 1. Fetch auction/cricket players
            const playersRes = await api.get(`/players?sport=${selectedSport}`);
            const allAuctionPlayers = Array.isArray(playersRes.data) ? playersRes.data : [];
            // Filter out auction players
            const nonAuctionPlayers = allAuctionPlayers.filter((p: any) => !p.isAuctionPlayer);
            
            // 2. Fetch registered users
            const usersRes = await api.get('/admin/users?includeAdmins=false');
            const allUsers = Array.isArray(usersRes.data?.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
            
            // Filter users who are players for the selected sport
            const registeredPlayers = allUsers.filter((u: any) => 
                u.role === 'player' && 
                u.sports?.some((s: string) => s.toLowerCase() === selectedSport.toLowerCase())
            );

            // Filter out any registered user that matches an auction player's name or email to prevent auction duplicates
            const auctionPlayerNames = new Set(allAuctionPlayers.map((p: any) => p.name.toLowerCase()));
            
            const filteredRegisteredPlayers = registeredPlayers.filter((u: any) => 
                !auctionPlayerNames.has(u.name.toLowerCase()) &&
                !(u.email && allAuctionPlayers.some((p: any) => p.email?.toLowerCase() === u.email.toLowerCase()))
            );

            // Map users to player structure
            const mappedUsers = filteredRegisteredPlayers.map((u: any) => ({
                _id: u._id,
                name: u.name,
                role: u.playerProfile?.[selectedSport]?.role || u.role || 'Player',
                image: u.profilePicture || '',
                isUser: true,
                email: u.email,
                phone: u.phone || ''
            }));

            const mappedPlayers = nonAuctionPlayers.map((p: any) => ({
                _id: p._id,
                name: p.name,
                role: p.role || p.category || 'Player',
                image: p.image || '',
                isUser: false,
                email: '',
                phone: ''
            }));

            // Merge avoiding duplicate IDs or names
            const combined = [...mappedUsers];
            mappedPlayers.forEach((p: any) => {
                if (!combined.some((c: any) => c.name.toLowerCase() === p.name.toLowerCase() || c._id === p._id)) {
                    combined.push(p);
                }
            });

            setPlayers(combined);
        } catch (error) {
            console.error('Failed to load players', error);
            setPlayers([]);
        }
    };

    const togglePlayerSelection = (player: any) => {
        setTeamPlayers((prev) => {
            const exists = prev.some((item) => item.user === player._id);
            if (exists) return prev.filter((item) => item.user !== player._id);
            return [
                ...prev,
                {
                    user: player._id,
                    name: player.name,
                    role: player.role || player.category || 'Player',
                    image: player.image || player.profilePicture || '',
                },
            ];
        });
    };

    const removeTeamPlayer = (userId: string) => {
        setTeamPlayers((prev) => prev.filter((item) => item.user !== userId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                players: teamPlayers,
            };

            if (isEditing) {
                await api.put(`/teams/${formData._id}`, payload);
            } else {
                const { _id, ...createData } = payload;
                await api.post('/teams', createData);
            }
            setShowModal(false);
            loadTeams();
            resetForm();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save team');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this team?')) return;
        try {
            await api.delete(`/teams/${id}?sport=${selectedSport}`);
            loadTeams();
        } catch (error) {
            alert('Failed to delete team');
        }
    };

    const resetForm = () => {
        setFormData({ _id: '', name: '', code: '', logo: '', city: '', captain: '', coach: '', owner: '', sport: selectedSport });
        setTeamPlayers([]);
        setIsEditing(false);
        setPlayerSearchTerm('');
    };

    const filteredAvailablePlayers = players.filter((player) => {
        const query = playerSearchTerm.toLowerCase();
        return (
            player.name?.toLowerCase().includes(query) ||
            player.email?.toLowerCase().includes(query) ||
            player.phone?.toLowerCase().includes(query)
        );
    });

    /* ────────────────── label helper ────────────────── */
    const InputLabel = ({ children }: { children: React.ReactNode }) => (
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">{children}</label>
    );

    const inputCls =
        'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all placeholder:text-gray-400';

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            {/* ═══════ Header ═══════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
                        Teams <Shield className="text-indigo-500 fill-indigo-100" size={22} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">Manage league franchises and squads</p>
                </div>

                <div className="flex items-center gap-2 bg-white/70 backdrop-blur-lg p-1 rounded-xl border border-white/60 shadow-sm">
                    {['cricket', 'kabaddi', 'football'].map(s => (
                        <button
                            key={s}
                            onClick={() => setSelectedSport(s)}
                            className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${selectedSport === s
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-white/60'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                    <div className="w-px h-5 bg-gray-200 mx-0.5" />
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <Plus size={13} /> New
                    </button>
                </div>
            </div>

            {/* ═══════ Team Grid ═══════ */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 animate-pulse">
                        <Shield size={24} className="text-gray-300" />
                    </div>
                    <div className="text-xs font-bold text-gray-400">Loading teams…</div>
                </div>
            ) : teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <Shield size={28} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">No teams yet</p>
                    <p className="text-xs text-gray-400">Create your first {selectedSport} team to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {teams.map((team, idx) => (
                        <div
                            key={team._id}
                            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-gray-200 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 hover:-translate-y-0.5"
                            style={{ animation: `fadeSlideUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 0.04}s both` }}
                        >
                            {/* Top row: Logo + Actions */}
                            <div className="flex items-start justify-between mb-3.5">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-xl font-black text-gray-300 border border-gray-100 overflow-hidden flex-shrink-0">
                                    {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : team.code?.[0] || '?'}
                                </div>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={() => { setFormData(team); setTeamPlayers(Array.isArray(team.players) ? team.players : []); setIsEditing(true); setShowModal(true); }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(team._id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Name + Code badge */}
                            <h3 className="font-bold text-[15px] text-gray-900 truncate leading-tight">{team.name}</h3>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${sport.color} ${sport.bg} px-2 py-0.5 rounded-md mt-1.5`}>
                                <Shield size={9} /> {team.code}
                            </span>

                            {/* Meta row */}
                            <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-gray-100">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <MapPin size={11} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-[11px] font-semibold text-gray-600 truncate">{team.city || '—'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                                    <Users size={11} className="text-gray-400" />
                                    <span className="text-[11px] font-semibold text-gray-600">{team.players?.length || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ═══════ Modal ═══════ */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center md:pl-72 z-[999] p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h2 className="text-base font-black text-gray-900">{isEditing ? 'Edit Team' : 'New Team'}</h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">Fill in the details below</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>

                        {/* ── Body (scrollable) ── */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                            <div className="p-6">
                                {/* Horizontal two-column layout */}
                                <div className="grid grid-cols-2 gap-6">

                                    {/* ─── LEFT: Team Details ─── */}
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel>Team Name</InputLabel>
                                            <input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className={inputCls}
                                                placeholder="Mumbai Indians"
                                                required
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <InputLabel>Code</InputLabel>
                                                <input
                                                    value={formData.code}
                                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                                    className={inputCls}
                                                    placeholder="MI"
                                                    maxLength={3}
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <InputLabel>City</InputLabel>
                                                <input
                                                    value={formData.city}
                                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="Mumbai"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <InputLabel>Captain</InputLabel>
                                                <input
                                                    value={formData.captain}
                                                    onChange={e => setFormData({ ...formData, captain: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="Captain name"
                                                />
                                            </div>
                                            <div>
                                                <InputLabel>Coach</InputLabel>
                                                <input
                                                    value={formData.coach}
                                                    onChange={e => setFormData({ ...formData, coach: e.target.value })}
                                                    className={inputCls}
                                                    placeholder="Coach name"
                                                />
                                            </div>
                                        </div>

                                        {/* Logo — inline compact */}
                                        <div>
                                            <InputLabel>Team Logo</InputLabel>
                                            <div className="flex items-center gap-3 p-3 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                                <div className="relative w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {formData.logo ? (
                                                        <img src={formData.logo} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Upload size={14} className="text-gray-300" />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-700">Upload image</p>
                                                    <p className="text-[10px] text-gray-400">PNG, JPG or SVG</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ─── RIGHT: Players ─── */}
                                    <div className="flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <InputLabel>Players</InputLabel>
                                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                {teamPlayers.length} selected
                                            </span>
                                        </div>

                                        {/* Selected chips */}
                                        {teamPlayers.length > 0 && (
                                            <div className="flex flex-col gap-1.5 mb-2.5">
                                                {teamPlayers.map((p) => (
                                                    <div key={p.user || p.name} className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 px-2.5 py-1.5 rounded-lg">
                                                        <span className="text-[11px] font-semibold text-indigo-700 flex-1 truncate mr-2">{p.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {formData.sport === 'kabaddi' && (
                                                                <select
                                                                    value={p.role}
                                                                    onChange={(e) => {
                                                                        setTeamPlayers(prev => prev.map(item => item.user === p.user ? { ...item, role: e.target.value } : item));
                                                                    }}
                                                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-indigo-200 outline-none bg-white text-indigo-700 focus:ring-1 focus:ring-indigo-300"
                                                                >
                                                                    <option value="Raider">Raider</option>
                                                                    <option value="Defender">Defender (Tackler)</option>
                                                                    <option value="All-Rounder">All-Rounder</option>
                                                                </select>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTeamPlayer(p.user)}
                                                                className="text-indigo-400 hover:text-red-500 transition-colors p-1 bg-white rounded-md border border-indigo-100 shadow-sm"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Available players list */}
                                        <div className="border border-gray-100 rounded-xl overflow-hidden flex-1 flex flex-col min-h-0">
                                            <div className="px-3 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Available</span>
                                                <span className="text-[10px] font-bold text-gray-400">
                                                    {filteredAvailablePlayers.length} / {players.length}
                                                </span>
                                            </div>
                                            {/* Search Bar */}
                                            <div className="px-3 py-2 border-b border-gray-100 bg-white">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Search players by name, email or phone..."
                                                        value={playerSearchTerm}
                                                        onChange={(e) => setPlayerSearchTerm(e.target.value)}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 placeholder:text-gray-400 transition-all"
                                                    />
                                                    <Search className="absolute left-2.5 top-2 text-gray-400" size={13} />
                                                </div>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto">
                                                {filteredAvailablePlayers.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-xs text-gray-400">No players found</div>
                                                ) : (
                                                    filteredAvailablePlayers.map((player) => {
                                                        const selected = teamPlayers.some((item) => item.user === player._id);
                                                        return (
                                                            <button
                                                                key={player._id}
                                                                type="button"
                                                                onClick={() => togglePlayerSelection(player)}
                                                                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors border-b border-gray-50 last:border-b-0 ${selected ? 'bg-indigo-50/50' : 'hover:bg-gray-50/80'}`}
                                                            >
                                                                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden text-[10px] font-bold text-gray-400 flex-shrink-0">
                                                                    {player.image
                                                                        ? <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                                                        : player.name?.[0] || 'P'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-[11px] font-semibold text-gray-900 truncate leading-tight flex items-center gap-1.5">
                                                                        {player.name || 'Unnamed'}
                                                                        {player.isUser && (
                                                                            <span className="text-[8px] font-bold bg-green-50 text-green-600 px-1 py-0.2 rounded border border-green-100">User</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[9px] text-gray-400 leading-tight">
                                                                        {player.role || 'Player'}{player.email ? ` • ${player.email}` : ''}
                                                                    </div>
                                                                </div>
                                                                <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                                                    {selected && <Check size={10} className="text-white" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Footer ── */}
                            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                                <button
                                    type="submit"
                                    className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg shadow-gray-900/15 active:scale-[0.98]"
                                >
                                    {isEditing ? 'Save Changes' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Keyframe for card entrance */}
            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
