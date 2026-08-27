import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Gavel, User, Plus, XCircle, Trash2, Edit2, Upload, ChevronDown, MonitorPlay } from 'lucide-react';

export default function AuctionManager() {
    const [players, setPlayers] = useState<any[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sportFilter, setSportFilter] = useState('Kabaddi');
    const [showAddModal, setShowAddModal] = useState(false);
    const [liveAuctionPlayer, setLiveAuctionPlayer] = useState<any>(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const getRolesForSport = (sport: string) => {
        if (sport === 'Kabaddi') return ['Raider', 'Defender', 'All-Rounder'];
        if (sport === 'Football') return ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
        return ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
    };

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        role: 'Raider',
        basePrice: 500,
        category: 'A',
        image: '',
        sport: 'Kabaddi'
    });

    useEffect(() => {
        fetchPlayers();
    }, [sportFilter]);

    const handleSportChange = (sport: string) => {
        setSportFilter(sport);
        const roles = getRolesForSport(sport);
        setFormData(curr => ({
            ...curr,
            sport: sport,
            role: roles[0]
        }));
    };

    const fetchPlayers = async () => {
        try {
            const [playersRes, teamsRes] = await Promise.all([
                api.get(`/players?sport=${sportFilter}`),
                api.get(`/teams?sport=${sportFilter}`)
            ]);
            setPlayers(Array.isArray(playersRes.data) ? playersRes.data : []);
            setTeams(Array.isArray(teamsRes.data) ? teamsRes.data.map((t: any) => t.code || t.name) : []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    useEffect(() => {
        let result = players;
        if (searchTerm) {
            result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (categoryFilter !== 'All') {
            result = result.filter(p => p.category === categoryFilter);
        }
        setFilteredPlayers(result);
    }, [searchTerm, categoryFilter, players]);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = { ...formData, sport: sportFilter };
            if (editingId) {
                await api.put(`/players/${editingId}`, payload);
            } else {
                await api.post('/players', payload);
            }
            fetchPlayers();
            setShowAddModal(false);
            setEditingId(null);
            const defaultRole = getRolesForSport(sportFilter)[0];
            setFormData({ name: '', role: defaultRole, basePrice: 500, category: 'A', image: '', sport: sportFilter });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to save player');
        }
    };

    const handleEdit = (player: any) => {
        setFormData({
            name: player.name,
            role: player.role,
            basePrice: player.basePrice,
            category: player.category,
            image: player.image,
            sport: player.sport || sportFilter
        });
        setEditingId(player._id);
        setShowAddModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this player?")) return;
        try {
            await api.delete(`/players/${id}`);
            fetchPlayers();
        } catch (error) {
            console.error(error);
        }
    };

    // Live Auction Logic
    const startAuction = async (player: any) => {
        setLiveAuctionPlayer(player);
        setCurrentBid(player.basePrice);
        setSelectedTeam('');
        try {
            await api.put(`/players/${player._id}`, { auctionStatus: 'LIVE', sport: sportFilter });
            fetchPlayers();
        } catch (e) {
            console.error(e);
        }
    };

    const placeBid = (increment: number) => {
        setCurrentBid(prev => prev + increment);
    };

    const sellPlayer = async () => {
        if (!selectedTeam) return alert("Please select a winning team!");
        try {
            await api.put(`/players/${liveAuctionPlayer._id}`, {
                auctionStatus: 'SOLD',
                soldPrice: currentBid,
                teamName: selectedTeam,
                sport: sportFilter
            });
            setLiveAuctionPlayer(null);
            fetchPlayers();
        } catch (e) {
            alert("Failed to sell player");
        }
    };

    const cancelAuction = async () => {
        if (liveAuctionPlayer) {
            await api.put(`/players/${liveAuctionPlayer._id}`, { auctionStatus: 'UPCOMING', sport: sportFilter });
            setLiveAuctionPlayer(null);
            fetchPlayers();
        }
    };

    const currentRoles = getRolesForSport(sportFilter);

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Auction <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Pro</span>
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wide">Live bidding & player management ({sportFilter} Category)</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        {['Kabaddi', 'Cricket', 'Football'].map(s => (
                            <button
                                key={s}
                                onClick={() => handleSportChange(s)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${sportFilter === s ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            const defaultRole = getRolesForSport(sportFilter)[0];
                            setFormData({ name: '', role: defaultRole, basePrice: 500, category: 'A', image: '', sport: sportFilter });
                            setShowAddModal(true);
                        }}
                        className="bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-black shadow-xl shadow-gray-900/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Add {sportFilter} Player
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-gray-200/50 shadow-sm sticky top-0 z-30">
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder={`Search ${sportFilter} players...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Category:</span>
                    {['All', 'A', 'B', 'C', 'Icon'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${categoryFilter === cat ? 'bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm' : 'text-gray-500 hover:bg-white hover:text-gray-900'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player) => (
                    <div key={player._id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group relative flex flex-col justify-between overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-bl-full -z-0" />

                        <div>
                            {/* Top Badges */}
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider uppercase ${player.auctionStatus === 'SOLD' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    player.auctionStatus === 'LIVE' ? 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse' :
                                        'bg-gray-50 text-gray-500 border border-gray-100'
                                    }`}>
                                    {player.auctionStatus}
                                </span>
                                <span className="px-2.5 py-1 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-wider">
                                    Cat {player.category}
                                </span>
                            </div>

                            {/* Player Media */}
                            <div className="w-24 h-24 mx-auto mb-4 relative group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shadow-inner">
                                    {player.image ? (
                                        <img src={player.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="text-gray-300" size={32} />
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-center space-y-1 mb-6">
                                <h3 className="font-black text-gray-900 text-base leading-tight group-hover:text-indigo-600 transition-colors">{player.name}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{player.role}</p>
                            </div>
                        </div>

                        {/* Price & Action */}
                        <div className="pt-4 border-t border-gray-50 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400">Base Price</span>
                                <span className="font-black text-gray-900">₹{player.basePrice}</span>
                            </div>

                            {player.auctionStatus === 'SOLD' && (
                                <div className="flex justify-between items-center text-xs bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50">
                                    <span className="font-bold text-emerald-700">Sold ({player.team?.code || player.teamName})</span>
                                    <span className="font-black text-emerald-700">₹{player.soldPrice}</span>
                                </div>
                            )}

                            <div className="flex gap-2">
                                {player.auctionStatus !== 'SOLD' && (
                                    <button
                                        onClick={() => startAuction(player)}
                                        className="flex-1 bg-gray-900 hover:bg-black text-white text-[10px] font-black py-2.5 rounded-xl shadow-lg shadow-gray-900/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                                    >
                                        <MonitorPlay size={13} /> Start Bid
                                    </button>
                                )}
                                <button onClick={() => handleEdit(player)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDelete(player._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* LIVE AUCTION STAGE MODAL */}
            {liveAuctionPlayer && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex justify-center items-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-gray-950 border border-gray-800 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative">

                        {/* Left: Player Stage */}
                        <div className="p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-800/80 bg-gradient-to-b from-indigo-950/20 to-transparent relative">
                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">LIVE AUCTION ({sportFilter})</span>
                            </div>

                            <div className="w-48 h-48 rounded-3xl bg-gray-900 border-2 border-indigo-500/30 overflow-hidden shadow-2xl shadow-indigo-500/10 mb-6 p-2 relative group">
                                {liveAuctionPlayer.image ? (
                                    <img src={liveAuctionPlayer.image} className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                    <User className="w-full h-full text-gray-700 p-8" />
                                )}
                                <div className="absolute bottom-3 right-3 bg-gray-950/80 backdrop-blur text-white text-[9px] font-black px-2.5 py-1 rounded-full border border-gray-800">
                                    Cat {liveAuctionPlayer.category}
                                </div>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-2 tracking-tight">{liveAuctionPlayer.name}</h2>
                            <p className="text-indigo-400 font-bold text-lg tracking-wide uppercase">{liveAuctionPlayer.role}</p>
                        </div>

                        {/* Right: Bidding Controls */}
                        <div className="p-10 bg-gray-900/50 flex flex-col justify-between relative">
                            <button onClick={cancelAuction} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"><XCircle size={24} /></button>

                            <div className="space-y-2 mt-8">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Current Highest Bid</p>
                                <div className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 text-center tracking-tighter tabular-nums">
                                    ₹{currentBid.toLocaleString()}
                                </div>
                                <p className="text-center text-gray-500 text-sm font-medium">Base Price: ₹{liveAuctionPlayer.basePrice}</p>
                            </div>

                            <div className="space-y-6 mt-12">
                                <div className="grid grid-cols-4 gap-3">
                                    {[100, 200, 500, 1000].map(amt => (
                                        <button
                                            key={amt}
                                            onClick={() => placeBid(amt)}
                                            className="py-4 rounded-xl bg-white/5 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 text-white font-bold text-xs transition-all active:scale-95 shadow-lg group"
                                        >
                                            <span className="text-indigo-400 group-hover:text-indigo-300 block text-[10px] uppercase">Bid</span>
                                            +{amt}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <select
                                            className="w-full pl-5 pr-10 py-4 bg-gray-800 border border-gray-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
                                            value={selectedTeam}
                                            onChange={(e) => setSelectedTeam(e.target.value)}
                                        >
                                            <option value="">Select Winning Team</option>
                                            {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>

                                    <button
                                        onClick={sellPlayer}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-900/50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Gavel size={20} /> Sold Player
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD/EDIT PLAYER MODAL */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center md:pl-72 z-[999] p-4"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-scale-in overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 bg-gray-50/80 flex justify-between items-center flex-shrink-0">
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{editingId ? 'Edit Player' : `Add ${sportFilter} Player`}</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-200 rounded-full"><XCircle size={20} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            <form onSubmit={handleAddPlayer} className="space-y-6 pb-[5px]">
                                {/* Image Upload */}
                                <div className="flex justify-center">
                                    <div className="relative group cursor-pointer w-28 h-28 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 hover:border-gray-900 hover:bg-white transition-all shadow-inner">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setFormData({ ...formData, image: reader.result as string });
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        {formData.image ? (
                                            <img src={formData.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-gray-400 group-hover:text-gray-600">
                                                <Upload size={20} />
                                                <span className="text-[9px] font-black uppercase tracking-wider">Photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Player Name</label>
                                        <input
                                            placeholder="e.g. Player Name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Role ({sportFilter})</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
                                                >
                                                    {currentRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown size={14} /></div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Category</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.category}
                                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option>A</option><option>B</option><option>C</option><option>Icon</option>
                                                </select>
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ChevronDown size={14} /></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Base Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                                            <input
                                                type="number"
                                                placeholder="500"
                                                value={formData.basePrice}
                                                onChange={e => setFormData({ ...formData, basePrice: parseInt(e.target.value) })}
                                                className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-xs font-black hover:bg-black shadow-lg shadow-gray-900/10 active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-2 mb-[5px]"
                                >
                                    <Plus size={16} />
                                    {editingId ? 'Update Player' : `Add ${sportFilter} Player`}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
