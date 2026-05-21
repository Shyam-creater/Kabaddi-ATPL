import { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, Gavel, User, Plus, XCircle, Trash2, Edit2, Upload, ChevronDown, MonitorPlay } from 'lucide-react';

export default function AuctionManager() {
    const [players, setPlayers] = useState<any[]>([]);
    const [filteredPlayers, setFilteredPlayers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sportFilter, setSportFilter] = useState('Cricket');
    const [showAddModal, setShowAddModal] = useState(false);
    const [liveAuctionPlayer, setLiveAuctionPlayer] = useState<any>(null);
    const [currentBid, setCurrentBid] = useState(0);
    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeam, setSelectedTeam] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        role: 'Batsman',
        basePrice: 500,
        category: 'A',
        image: '',
        sport: 'Cricket'
    });

    useEffect(() => {
        fetchPlayers();
    }, [sportFilter]);

    const fetchPlayers = async () => {
        try {
            const [playersRes, teamsRes] = await Promise.all([
                api.get(`/players?sport=${sportFilter}`),
                api.get(`/teams?sport=${sportFilter}`)
            ]);
            setPlayers(playersRes.data);
            setTeams(teamsRes.data.map((t: any) => t.code));
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
            if (editingId) {
                await api.put(`/players/${editingId}`, { ...formData, sport: sportFilter });
            } else {
                await api.post('/players', { ...formData, sport: sportFilter });
            }
            fetchPlayers();
            setShowAddModal(false);
            setEditingId(null);
            setFormData({ name: '', role: 'Batsman', basePrice: 500, category: 'A', image: '', sport: sportFilter });
        } catch (error) {
            alert('Failed to save player');
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
            await api.put(`/players/${player._id}`, { auctionStatus: 'LIVE' });
        } catch (error) { }
    };

    const placeBid = async (amount: number) => {
        setCurrentBid(prev => prev + amount);
    };

    const sellPlayer = async () => {
        if (!selectedTeam) return alert('Select a team!');
        try {
            await api.put(`/players/${liveAuctionPlayer._id}`, {
                auctionStatus: 'SOLD',
                soldPrice: currentBid,
                team: selectedTeam
            });
            fetchPlayers();
            setLiveAuctionPlayer(null);
        } catch (error) {
            setLiveAuctionPlayer(null);
            fetchPlayers();
        }
    };

    const cancelAuction = async () => {
        if (liveAuctionPlayer) {
            try {
                await api.put(`/players/${liveAuctionPlayer._id}`, { auctionStatus: 'UPCOMING' });
            } catch (error) { }
            setLiveAuctionPlayer(null);
        }
    };

    return (
        <div className="space-y-8 px-4 md:px-8 xl:px-12 pb-20 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        Auction <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Pro</span>
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wide">Live bidding & player management</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        {['Cricket', 'Kabaddi', 'Football'].map(s => (
                            <button
                                key={s}
                                onClick={() => setSportFilter(s)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${sportFilter === s ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => { setEditingId(null); setFormData(curr => ({ ...curr, sport: sportFilter, name: '', image: '' })); setShowAddModal(true); }}
                        className="bg-gray-900 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-black shadow-xl shadow-gray-900/20 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Player
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-gray-200/50 shadow-sm sticky top-0 z-30">
                <div className="relative w-full md:w-80 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    {['All', 'A', 'B', 'C', 'Icon'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all border ${categoryFilter === cat
                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm'
                                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            {cat === 'All' ? 'All Cats' : `Cat ${cat}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player, idx) => (
                    <div
                        key={player._id}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                        className="group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 hover:-translate-y-1 animate-scale-in overflow-hidden"
                    >
                        {/* Status Strip */}
                        <div className={`absolute top-0 inset-x-0 h-1.5 ${player.auctionStatus === 'SOLD' ? 'bg-emerald-500' :
                            player.auctionStatus === 'LIVE' ? 'bg-red-500 animate-pulse' : 'bg-gray-200'
                            }`} />

                        <div className="absolute top-5 right-5 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                            <button onClick={() => handleEdit(player)} className="w-8 h-8 flex items-center justify-center bg-white text-indigo-600 rounded-full shadow-lg hover:scale-110 transition-transform border border-gray-100"><Edit2 size={12} /></button>
                            <button onClick={() => handleDelete(player._id)} className="w-8 h-8 flex items-center justify-center bg-white text-red-500 rounded-full shadow-lg hover:scale-110 transition-transform border border-gray-100"><Trash2 size={12} /></button>
                        </div>

                        <div className="flex flex-col items-center pt-4 mb-4">
                            <div className="relative mb-4">
                                <div className={`w-24 h-24 rounded-2xl rotate-3 group-hover:rotate-0 transition-all duration-500 overflow-hidden shadow-lg border-4 ${player.auctionStatus === 'SOLD' ? 'border-emerald-100' :
                                    player.auctionStatus === 'LIVE' ? 'border-red-100' : 'border-white'
                                    }`}>
                                    {player.image ? (
                                        <img src={player.image} alt={player.name} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><User size={32} /></div>
                                    )}
                                </div>
                                {player.auctionStatus !== 'UPCOMING' && (
                                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border whitespace-nowrap z-10 ${player.auctionStatus === 'SOLD' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600 animate-pulse'
                                        }`}>
                                        {player.auctionStatus}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-black text-gray-900 text-center leading-tight mb-1">{player.name}</h3>
                            <div className="flex gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                <span>{player.role}</span>
                                <span className="w-px h-3 bg-gray-300 my-auto" />
                                <span>Cat {player.category}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-wider">Base Price</span>
                                <span className="font-black text-gray-900 text-base">₹{player.basePrice}</span>
                            </div>

                            {player.auctionStatus === 'SOLD' ? (
                                <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm text-center">
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Sold To</div>
                                    <div className="font-black text-gray-900 text-sm">{player.team || 'Team'}</div>
                                    <div className="text-xs font-bold text-gray-400 mt-1">₹{player.soldPrice}</div>
                                </div>
                            ) : player.auctionStatus === 'LIVE' ? (
                                <button onClick={() => setLiveAuctionPlayer(player)} className="w-full bg-red-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-red-600 shadow-lg shadow-red-500/30 animate-pulse flex items-center justify-center gap-2">
                                    <MonitorPlay size={14} /> Resume Auction
                                </button>
                            ) : (
                                <button onClick={() => startAuction(player)} className="w-full bg-gray-900 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wide hover:bg-black shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98] group-hover:translate-y-0 translate-y-2 opacity-0 group-hover:opacity-100">
                                    <Gavel size={14} /> Start Bidding
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* LIVE AUCTION MODAL - DARK MODE */}
            {liveAuctionPlayer && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-xl flex justify-center items-center md:pl-72 z-[999] p-4"
                >
                    <div
                        className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Left: Player Visual */}
                        <div className="relative p-10 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-gray-900">
                            <div className="absolute top-6 left-6 flex items-center gap-2">
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                <span className="text-red-500 text-xs font-black uppercase tracking-widest">Live Now</span>
                            </div>

                            <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 z-10">
                                <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
                                <div className="w-full h-full rounded-full border-4 border-white/10 p-2 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                                        {liveAuctionPlayer.image ? (
                                            <img src={liveAuctionPlayer.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-full h-full p-12 text-gray-700" />
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 right-10 bg-white text-gray-900 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg transform rotate-3">
                                        Cat {liveAuctionPlayer.category}
                                    </div>
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
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">{editingId ? 'Edit Player' : 'Add New Player'}</h2>
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
                                            placeholder="e.g. Virat Kohli"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 outline-none focus:border-gray-900 transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Role</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.role}
                                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:bg-white rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-gray-900 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option>Batsman</option><option>Bowler</option><option>All-Rounder</option><option>Wicket Keeper</option>
                                                    <option>Raider</option><option>Defender</option><option>Goal Keeper</option><option>Striker</option>
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
    {editingId ? 'Update Player' : 'Add to Pool'}
</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
