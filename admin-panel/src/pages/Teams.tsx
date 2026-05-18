import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Shield, X, Upload } from 'lucide-react';

export default function Teams() {
    const [teams, setTeams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedSport, setSelectedSport] = useState('cricket');

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

    useEffect(() => {
        loadTeams();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`/teams/${formData._id}`, formData);
            } else {
                const { _id, ...createData } = formData;
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
        setIsEditing(false);
    };

    return (
        <div className="space-y-6 px-4 md:px-8 xl:px-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Teams <Shield className="text-indigo-500 fill-indigo-100" size={24} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500">Manage league franchises and squads</p>
                </div>

                <div className="flex items-center gap-2 bg-white/50 backdrop-blur p-1 rounded-xl border border-white/60 shadow-sm">
                    {['cricket', 'kabaddi', 'football'].map(s => (
                        <button
                            key={s}
                            onClick={() => setSelectedSport(s)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${selectedSport === s
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-white/50'
                                }`}
                        >
                            {s}
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-1" />
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all">
                        <Plus size={14} /> New Team
                    </button>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Shield size={48} className="text-gray-200 mb-4" />
                    <div className="text-xs font-bold text-gray-400">Loading teams...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 animate-slide-in-right">
                    {teams.map((team, idx) => (
                        <div
                            key={team._id}
                            style={{ animationDelay: `${idx * 0.05}s` }}
                            className="group glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-transparent hover:border-indigo-100"
                        >
                            {/* Decorative Background */}
                            <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:opacity-10 ${selectedSport === 'kabaddi' ? 'bg-orange-600' : selectedSport === 'football' ? 'bg-emerald-600' : 'bg-indigo-600'
                                }`} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-2xl font-black text-gray-300 shadow-inner border border-white">
                                        {team.logo ? <img src={team.logo} className="w-full h-full object-cover rounded-2xl" /> : team.code[0]}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setFormData(team); setIsEditing(true); setShowModal(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDelete(team._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 truncate tracking-tight">{team.name}</h3>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 bg-indigo-50 inline-block px-2 py-0.5 rounded-md mb-4 mt-1">
                                    <Shield size={10} /> {team.code}
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100/50">
                                    <div>
                                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">City</span>
                                        <span className="text-xs font-semibold text-gray-700 block truncate">{team.city || '-'}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Squad</span>
                                        <span className="text-xs font-semibold text-gray-700 block">{team.players?.length || 0} Players</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal - keeping wrapper but improving inner design */}
            {showModal && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col my-10 animate-scale-in overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900">{isEditing ? 'Edit Team' : 'Create New Team'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {/* ... (Existing form fields with enhanced styles) ... */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Team Name</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" placeholder="ex. Mumbai Indians" required />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Team Code</label>
                                    <input value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" placeholder="ex. MI" maxLength={3} required />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">Team Logo</label>
                                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded-2xl bg-gray-50/30 hover:bg-gray-50 transition-colors">
                                    <div className="relative w-16 h-16 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        {formData.logo ? (
                                            <img src={formData.logo} className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload size={20} className="text-gray-300" />
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
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-gray-900">Upload Logo</h4>
                                        <p className="text-xs text-gray-400 mt-0.5">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">City</label>
                                    <input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" placeholder="City" />
                                </div>
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Captain</label>
                                    <input value={formData.captain} onChange={e => setFormData({ ...formData, captain: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" placeholder="Captain Name" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Coach</label>
                                <input value={formData.coach} onChange={e => setFormData({ ...formData, coach: e.target.value })} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all" placeholder="Coach Name" />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-xl shadow-gray-900/20 active:scale-[0.98]">
                                    {isEditing ? 'Save Changes' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
