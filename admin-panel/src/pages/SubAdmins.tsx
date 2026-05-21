import { useEffect, useState } from 'react';
import { ShieldAlert, X, UserPlus, Trash2, Plus, Shield, Check, Clock, Ban } from 'lucide-react';
import api from '../services/api';

export default function SubAdmins() {
    const [subAdmins, setSubAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [address, setAddress] = useState('');
    const [modalError, setModalError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchSubAdmins();
    }, []);

    const fetchSubAdmins = async () => {
        try {
            const response = await api.get('/admin/sub-admins');
            setSubAdmins(response.data.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch sub-admins');
            setLoading(false);
        }
    };

    const handleCreateSubAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setModalError(null);

        try {
            const response = await api.post('/admin/sub-admins', {
                name,
                email,
                password,
                phone,
                city,
                address
            });
            
            // Add to list and close
            setSubAdmins([response.data.data, ...subAdmins]);
            setShowModal(false);
            
            // Reset fields
            setName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setCity('');
            setAddress('');
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Failed to create sub-admin');
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        if (!confirm(`Are you sure you want to update status to ${newStatus}?`)) return;

        try {
            const response = await api.put(`/admin/sub-admins/${id}/status`, { status: newStatus });
            setSubAdmins(subAdmins.map((item) => item._id === id ? response.data.data : item));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sub-admin account? This cannot be undone.')) return;

        try {
            await api.delete(`/admin/sub-admins/${id}`);
            setSubAdmins(subAdmins.filter((item) => item._id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete sub-admin');
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sub-Admin Accounts</h1>
                    <p className="text-sm text-gray-500 mt-1">Super Admin Dashboard Command for managing Regional Admins</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
                >
                    <Plus size={16} />
                    Add Sub-Admin
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Admin ID</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Name</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Location</th>
                                <th className="text-left px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Status</th>
                                <th className="text-center px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {subAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                        No Sub-Admin accounts registered. Click "Add Sub-Admin" to create one.
                                    </td>
                                </tr>
                            ) : (
                                subAdmins.map((sub: any) => (
                                    <tr key={sub._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                                                {sub.atplId || 'Pending'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                                                    <Shield className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <span className="font-semibold text-gray-900">{sub.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col">
                                                <span className="text-gray-900 font-medium">{sub.email}</span>
                                                <span className="text-gray-500 text-xs">{sub.phone || 'No phone'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {sub.city || 'Not set'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                                ${sub.status === 'active' 
                                                    ? 'bg-emerald-50 text-emerald-700' 
                                                    : sub.status === 'pending'
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    sub.status === 'active' 
                                                        ? 'bg-emerald-500' 
                                                        : sub.status === 'pending'
                                                        ? 'bg-amber-500'
                                                        : 'bg-rose-500'
                                                }`} />
                                                {sub.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1.5">
                                                {sub.status !== 'active' && (
                                                    <button
                                                        onClick={() => handleStatusChange(sub._id, 'active')}
                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg transition-all"
                                                        title="Approve Sub-Admin"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                {sub.status !== 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusChange(sub._id, 'pending')}
                                                        className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-lg transition-all"
                                                        title="Set Pending"
                                                    >
                                                        <Clock size={14} />
                                                    </button>
                                                )}
                                                {sub.status !== 'suspended' && (
                                                    <button
                                                        onClick={() => handleStatusChange(sub._id, 'suspended')}
                                                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                                        title="Suspend/Reject Sub-Admin"
                                                    >
                                                        <Ban size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(sub._id)}
                                                    className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-lg transition-all"
                                                    title="Delete Sub-Admin"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialog */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center md:pl-72 p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="w-full max-w-xl bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden relative animate-slide-up">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserPlus className="text-gray-900" size={20} />
                                <h3 className="text-lg font-black text-gray-900">Add Sub-Admin Account</h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubAdmin} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {modalError}
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                    placeholder="Name"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                        placeholder="email@example.com"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                        placeholder="Mobile"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Location (City)</label>
                                    <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                        placeholder="City"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Address Detail</label>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:bg-white focus:ring-4 focus:ring-gray-900/5 focus:border-gray-900 transition-all shadow-inner"
                                    placeholder="Street detail"
                                />
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-75 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Create Sub-Admin'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
