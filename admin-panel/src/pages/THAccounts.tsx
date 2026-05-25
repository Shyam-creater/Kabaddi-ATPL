import { useEffect, useState } from 'react';
import { Users, ShieldAlert, CheckCircle2, UserX, X, Trophy, Shield, MapPin, Mail, Phone, Check, Clock, Ban, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function THAccounts() {
    const [thAccounts, setThAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedTH, setSelectedTH] = useState<any>(null);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [leagueLimitInput, setLeagueLimitInput] = useState<string>('');
    const [updatingLimit, setUpdatingLimit] = useState(false);

    useEffect(() => {
        fetchTHAccounts();
    }, []);

    const fetchTHAccounts = async () => {
        try {
            const response = await api.get('/admin/th-accounts');
            setThAccounts(response.data.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch TH accounts');
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return;

        try {
            await api.put(`/admin/users/${id}/status`, { status: newStatus });
            fetchTHAccounts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this Tournament Head account? This cannot be undone.')) return;

        try {
            await api.delete(`/admin/users/${id}`);
            fetchTHAccounts();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete TH account');
        }
    };

    const handleViewDetails = async (id: string) => {
        setFetchingDetails(true);
        try {
            const response = await api.get(`/admin/th-details/${id}`);
            const data = response.data.data;
            setSelectedTH(data);
            setLeagueLimitInput((data.user?.leagueLimit || data.leagueLimit || 5).toString());
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to load details');
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleUpdateLeagueLimit = async () => {
        const parsedLimit = parseInt(leagueLimitInput, 10);
        if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
            return alert('Please enter a valid positive league limit');
        }

        setUpdatingLimit(true);
        try {
            const response = await api.put(`/admin/th-accounts/${selectedTH.user._id}/limit`, { leagueLimit: parsedLimit });
            const updatedUser = response.data.data;
            setSelectedTH((prev: any) => ({
                ...prev,
                user: { ...prev.user, leagueLimit: updatedUser.leagueLimit }
            }));
            setThAccounts((prev: any[]) => prev.map((th: any) => th._id === updatedUser._id ? { ...th, leagueLimit: updatedUser.leagueLimit } : th));
            alert('League creation limit updated successfully');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update league limit');
        } finally {
            setUpdatingLimit(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3">
                <ShieldAlert className="w-5 h-5" />
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tournament Heads</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all registered ATPL_TH accounts</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">TH ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Name</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Contact</th>
                                 <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Joined</th>
                                <th className="text-center px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {thAccounts.map((th: any) => (
                                <tr key={th._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold font-mono">
                                            {th.atplId || 'Pending'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                {th.profilePicture ? (
                                                    <img src={th.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <Users className="w-4 h-4 text-gray-400" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-gray-900">{th.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <p className="text-gray-900 font-medium">{th.email}</p>
                                            <p className="text-gray-500">{th.phone}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {th.status === 'active' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                                <CheckCircle2 size={12} /> Active
                                            </span>
                                        ) : th.status === 'pending' ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                                <UserX size={12} /> Pending
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                                <UserX size={12} /> Suspended
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                                        {th.leagueLimit || 5}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-medium text-gray-500">
                                            {new Date(th.createdAt).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                onClick={() => handleViewDetails(th._id)}
                                                disabled={fetchingDetails}
                                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-55 text-indigo-600 rounded-lg text-xs font-bold transition-all"
                                                title="View Details"
                                            >
                                                View Details
                                            </button>
                                            {th.status !== 'active' && (
                                                <button
                                                    onClick={() => handleStatusChange(th._id, 'active')}
                                                    className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all"
                                                    title="Approve TH"
                                                >
                                                    <Check size={13} />
                                                </button>
                                            )}
                                            {th.status !== 'pending' && (
                                                <button
                                                    onClick={() => handleStatusChange(th._id, 'pending')}
                                                    className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg transition-all"
                                                    title="Set Pending"
                                                >
                                                    <Clock size={13} />
                                                </button>
                                            )}
                                            {th.status !== 'suspended' && (
                                                <button
                                                    onClick={() => handleStatusChange(th._id, 'suspended')}
                                                    className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                                    title="Suspend/Reject TH"
                                                >
                                                    <Ban size={13} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(th._id)}
                                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                                title="Delete TH"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {thAccounts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No Tournament Heads found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for TH Details */}
            {selectedTH && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center md:pl-72 z-[9999] p-4" onClick={() => setSelectedTH(null)}>
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                                    {selectedTH.user.profilePicture ? (
                                        <img src={selectedTH.user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <Users className="w-6 h-6 text-indigo-600" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{selectedTH.user.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold font-mono rounded-full">
                                            {selectedTH.user.atplId}
                                        </span>
                                        <span className="text-xs text-gray-400">• Joined {new Date(selectedTH.user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTH(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-8 overflow-y-auto space-y-8">
                            {/* Contact Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedTH.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedTH.user.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-gray-400 animate-bounce" />
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                        <p className="text-sm font-semibold text-gray-900">{selectedTH.user.location || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary stats */}
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {[
                                    { label: 'Total Leagues', value: selectedTH.stats.totalLeagues, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                                    { label: 'Total Teams', value: selectedTH.stats.totalTeams, color: 'text-purple-600 bg-purple-50 border-purple-100' },
                                    { label: 'Cricket Leagues', value: selectedTH.stats.cricketLeagues, color: 'text-rose-600 bg-rose-50 border-rose-100' },
                                    { label: 'Football Leagues', value: selectedTH.stats.footballLeagues, color: 'text-blue-600 bg-blue-50 border-blue-100' },
                                    { label: 'Kabaddi Leagues', value: selectedTH.stats.kabaddiLeagues, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                                    { label: 'Registrations', value: selectedTH.stats.totalRegistrations || 0, color: 'text-amber-600 bg-amber-50 border-amber-100' },
                                    { label: 'League Limit', value: selectedTH.user?.leagueLimit || 5, color: 'text-slate-600 bg-slate-50 border-slate-100' }
                                ].map((stat, idx) => (
                                    <div key={idx} className={`p-4 rounded-2xl border ${stat.color} text-center`}>
                                        <p className="text-2xl font-black">{stat.value}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-500">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Two Column details for Leagues and Teams */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Leagues */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-indigo-600" /> Created Leagues ({selectedTH.leagues?.length || 0})
                                    </h3>
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-80 overflow-y-auto">
                                        {selectedTH.leagues?.map((league: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{league.name}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 capitalize font-medium">{league.sport} league</p>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                                    league.status === 'UPCOMING' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                    league.status === 'LIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {league.status}
                                                </span>
                                            </div>
                                        ))}
                                        {(!selectedTH.leagues || selectedTH.leagues.length === 0) && (
                                            <div className="p-6 text-center text-xs font-bold text-gray-400">No leagues created yet.</div>
                                        )}
                                    </div>
                                </div>

                                {/* Teams */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-indigo-600" /> Created Teams ({selectedTH.teams?.length || 0})
                                    </h3>
                                    <div className="border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50 max-h-80 overflow-y-auto">
                                        {selectedTH.teams?.map((team: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-white flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                                        {team.logo ? (
                                                            <img src={team.logo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-[10px] font-black text-indigo-600">{team.code}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{team.name}</p>
                                                        <p className="text-[10px] text-gray-400 capitalize font-medium">{team.sport || 'General'}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-400 font-mono">{team.code}</span>
                                            </div>
                                        ))}
                                        {(!selectedTH.teams || selectedTH.teams.length === 0) && (
                                            <div className="p-6 text-center text-xs font-bold text-gray-400">No teams created yet.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-start">
                                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">League Creation Limit</h3>
                                    <p className="text-sm font-bold text-gray-900">Current limit: {selectedTH.user?.leagueLimit || 5} leagues</p>
                                    <p className="text-xs text-gray-500 mt-1">Created: {selectedTH.leagues?.length || 0} / {selectedTH.user?.leagueLimit || 5}</p>
                                    <p className="text-xs text-gray-500 mt-2">Extend this limit to allow more league creation for this TH account.</p>
                                    <div className="mt-4 flex flex-wrap gap-2 items-center">
                                        <input
                                            type="number"
                                            min={1}
                                            value={leagueLimitInput}
                                            onChange={(e) => setLeagueLimitInput(e.target.value)}
                                            className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="Limit"
                                        />
                                        <button
                                            onClick={handleUpdateLeagueLimit}
                                            disabled={updatingLimit}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-60"
                                        >
                                            {updatingLimit ? 'Updating...' : 'Update Limit'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* League Registrations */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-600" /> League Registrations ({selectedTH.registrations?.length || 0})
                                </h3>
                                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 border-b border-gray-100">
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Player Name</th>
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email & Phone</th>
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registered League</th>
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sport</th>
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                                                    <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selectedTH.registrations?.map((reg: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-gray-900">{reg.fullName}</p>
                                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">Reg: {new Date(reg.createdAt).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs text-gray-600 font-medium">{reg.email}</p>
                                                            <p className="text-xs text-gray-400 mt-0.5">{reg.phone}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-xs font-semibold text-gray-900">{reg.leagueName}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider capitalize">{reg.sport}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-xs font-bold text-gray-900">₹{reg.paymentAmount}</span>
                                                                {reg.paymentScreenshot && (
                                                                    <a 
                                                                        href={reg.paymentScreenshot} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer" 
                                                                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-black hover:underline"
                                                                    >
                                                                        View Receipt ↗
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                                reg.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                reg.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-rose-50 text-rose-600 border-rose-100'
                                                            }`}>
                                                                {reg.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {(!selectedTH.registrations || selectedTH.registrations.length === 0) && (
                                                    <tr>
                                                        <td colSpan={6} className="px-6 py-8 text-center text-xs font-bold text-gray-400">
                                                            No player registrations found for this Tournament Head's leagues.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
