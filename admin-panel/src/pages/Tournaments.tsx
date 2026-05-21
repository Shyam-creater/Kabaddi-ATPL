import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Plus, Calendar, Trophy, Edit2, Trash2, Users, IndianRupee, QrCode } from 'lucide-react';
import api from '../services/api';

interface Tournament {
    _id: string;
    name: string;
    description?: string;
    registrationFee?: number;
    qrCodeImage?: string;
    upiId?: string;
    sport: 'cricket' | 'football' | 'kabaddi';
    startDate: string;
    endDate: string;
    status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
    teams: any[];
    logo?: string;
    banner?: string;
    registrationCount?: number;
}

const defaultForm = {
    name: '',
    description: '',
    registrationFee: 500,
    qrCodeImage: '',
    upiId: '',
    sport: 'cricket',
    startDate: '',
    endDate: '',
    venue: '',
    status: 'UPCOMING',
    logo: '',
    banner: ''
};

export default function Tournaments() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSport, setSelectedSport] = useState<'cricket' | 'football' | 'kabaddi'>('cricket');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);

    // Form State
    const [formData, setFormData] = useState({ ...defaultForm });

    const { user } = useSelector((state: any) => state.auth);

    useEffect(() => {
        fetchTournaments();
    }, [selectedSport, user]);

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            if (user?.role === 'TH') {
                const response = await api.get('/th/leagues');
                // The backend returns { cricket, football, kabaddi } lists
                setTournaments(response.data.data[selectedSport] || []);
            } else {
                const response = await api.get(`/tournaments/${selectedSport}/all`);
                setTournaments(response.data);
            }
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            alert('Failed to load tournaments');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTournament) {
                await api.put(`/tournaments/${formData.sport}/${editingTournament._id}`, formData);
                alert('Tournament updated');
            } else {
                await api.post(`/tournaments/${formData.sport}`, formData);
                alert('League created');
            }
            setIsModalOpen(false);
            setEditingTournament(null);
            setFormData({ ...defaultForm });
            fetchTournaments();
        } catch (error) {
            alert('Operation failed');
        }
    };

    const handleDelete = async (id: string, sport: string) => {
        if (!window.confirm('Are you sure?')) return;
        try {
            await api.delete(`/tournaments/${sport}/${id}`);
            alert('League deleted');
            fetchTournaments();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, [field]: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const openModal = (tournament?: Tournament) => {
        if (tournament) {
            setEditingTournament(tournament);
            setFormData({
                name: tournament.name,
                description: tournament.description || '',
                registrationFee: tournament.registrationFee || 500,
                qrCodeImage: tournament.qrCodeImage || '',
                upiId: tournament.upiId || '',
                sport: selectedSport as any,
                startDate: tournament.startDate.split('T')[0],
                endDate: tournament.endDate.split('T')[0],
                venue: (tournament as any).venue || '',
                status: tournament.status,
                logo: tournament.logo || '',
                banner: tournament.banner || ''
            });
        } else {
            setEditingTournament(null);
            setFormData({ ...defaultForm, sport: selectedSport as any });
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8 px-4 md:px-8 xl:px-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Leagues <Trophy className="text-yellow-500 fill-yellow-100" size={24} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500">Manage your seasonal leagues</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Create League
                </button>
            </div>

            {/* Sport Filter Tabs - Floating Style */}
            <div className="flex gap-2 p-1 bg-white/50 backdrop-blur rounded-xl border border-gray-200 w-fit">
                {['cricket', 'football', 'kabaddi'].map((sport) => (
                    <button
                        key={sport}
                        onClick={() => setSelectedSport(sport as any)}
                        className={`px-5 py-2 rounded-lg text-xs font-bold capitalize transition-all ${selectedSport === sport
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'text-gray-500 hover:bg-white/50 hover:text-gray-900'
                            }`}
                    >
                        {sport}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Trophy size={48} className="text-gray-200 mb-4" />
                    <div className="text-xs font-bold text-gray-400">Loading leagues...</div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-in-right">
                    {tournaments.map((tournament, idx) => (
                        <div
                            key={tournament._id}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                            className="bg-white rounded-2xl p-0 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                        >
                            {/* High Fidelity Banner Section */}
                            <div className="h-32 w-full relative overflow-hidden bg-gray-900">
                                {tournament.banner ? (
                                    <img src={tournament.banner} className="w-full h-full object-cover" />
                                ) : (
                                    <div className={`w-full h-full bg-gradient-to-r ${tournament.sport === 'football' ? 'from-blue-500 to-blue-400' :
                                        tournament.sport === 'kabaddi' ? 'from-orange-500 to-orange-400' :
                                            'from-indigo-600 to-purple-600'
                                        }`} />
                                )}
                                {/* Fee Badge */}
                                <div className="absolute top-3 left-3">
                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white/90 text-gray-900 shadow-sm flex items-center gap-1">
                                        <IndianRupee size={10} />
                                        {tournament.registrationFee || 500}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={() => openModal(tournament)} className="p-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all active:scale-90">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(tournament._id, selectedSport)} className="p-3 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all active:scale-90">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 relative">
                                {/* Status Chip */}
                                <div className="absolute -top-3 right-6">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm border ${tournament.status === 'ONGOING' ? 'bg-red-50 text-red-500 border-red-100 animate-pulse' :
                                        tournament.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            'bg-blue-50 text-blue-600 border-blue-100'
                                        }`}>
                                        {tournament.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-black text-gray-900 mb-1">{tournament.name}</h3>
                                {tournament.description && (
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4 line-clamp-2">{tournament.description}</p>
                                )}
                                {!tournament.description && <div className="mb-4" />}

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="bg-white p-2 rounded-lg shadow-sm">
                                            <Calendar size={14} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Duration</p>
                                            <p className="font-semibold text-gray-900 text-xs mt-0.5">
                                                {(() => {
                                                    const start = new Date(tournament.startDate);
                                                    const end = new Date(tournament.endDate);

                                                    return (
                                                        <>
                                                            {start.toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}{" "}
                                                            to
                                                            <br />
                                                            {end.toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </>
                                                    );
                                                })()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer: Registrations + Venue + Payment indicators */}
                                    <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase">
                                            <Users size={12} />
                                            {tournament.registrationCount || 0} Registered
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {tournament.upiId && (
                                                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">UPI ✓</span>
                                            )}
                                            {tournament.qrCodeImage && (
                                                <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">QR ✓</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-scale-in overflow-hidden my-10 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-lg font-black text-gray-900">{editingTournament ? 'Edit League' : 'Create New League'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-200 rounded-full">
                                <Plus size={20} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">League Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm font-semibold text-gray-900 placeholder-gray-400"
                                    placeholder="Ex: TPL Season 5"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm font-semibold text-gray-900 placeholder-gray-400 resize-none"
                                    placeholder="Ex: The premier league for senior players above 30 years..."
                                    rows={2}
                                    maxLength={200}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                                <p className="text-[9px] text-gray-400 mt-1 text-right">{formData.description.length}/200</p>
                            </div>

                            {/* Payment Configuration Section */}
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 space-y-4">
                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2">
                                    <IndianRupee size={12} /> Payment Configuration
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Registration Fee (₹)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-bold text-gray-900"
                                            value={formData.registrationFee}
                                            onChange={e => setFormData({ ...formData, registrationFee: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">UPI ID</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none text-sm font-semibold text-gray-900 placeholder-gray-400"
                                            placeholder="Ex: atpl@upi"
                                            value={formData.upiId}
                                            onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Payment QR Code</label>
                                    <div className="relative group cursor-pointer h-32 overflow-hidden rounded-xl border border-dashed border-emerald-300 bg-white">
                                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'qrCodeImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {formData.qrCodeImage ? (
                                            <img src={formData.qrCodeImage} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full">
                                                <QrCode size={24} className="text-emerald-400 mb-1" />
                                                <span className="text-[10px] font-bold text-emerald-500">Upload QR Code</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-sm font-semibold text-gray-900"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none text-sm font-semibold text-gray-900"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Venue</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm font-semibold text-gray-900 placeholder-gray-400"
                                    placeholder="Ex: Dubai International Stadium"
                                    value={formData.venue}
                                    onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">League Status</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all text-sm font-semibold text-gray-900"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                >
                                    <option value="UPCOMING">UPCOMING</option>
                                    <option value="ONGOING">ONGOING</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">League Logo</label>
                                    <div className="relative group cursor-pointer h-24 overflow-hidden rounded-xl border border-dashed border-gray-300">
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'logo')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {formData.logo ? (
                                            <img src={formData.logo} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-4">
                                                <Plus size={16} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 mt-1">Logo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">League Banner (1200x740)</label>
                                    <div className="relative group cursor-pointer h-24 overflow-hidden rounded-xl border border-dashed border-gray-300">
                                        <input type="file" onChange={(e) => handleFileUpload(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        {formData.banner ? (
                                            <img src={formData.banner} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-4">
                                                <Plus size={16} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400 mt-1">Banner</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-black shadow-lg shadow-gray-900/20 transition-all hover:scale-[1.02]"
                                >
                                    {editingTournament ? 'Update League' : 'Create League'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
