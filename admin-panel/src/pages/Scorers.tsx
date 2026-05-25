import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { thService } from '../services/th';

type ScorerStatus = 'active' | 'pending' | 'suspended';

type Scorer = {
    _id: string;
    name?: string;
    email?: string;
    phone?: string;
    status?: ScorerStatus;
    createdAt?: string;
};

export default function Scorers() {
    const [scorers, setScorers] = useState<Scorer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | ScorerStatus>('all');

    const fetchScorers = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await thService.getScorers();
            setScorers(Array.isArray(data) ? data : []);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Failed to load scorers');
            setScorers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScorers();
    }, []);

    const filteredScorers = useMemo(() => {
        if (selectedStatusFilter === 'all') return scorers;
        return scorers.filter((s) => s.status === selectedStatusFilter);
    }, [scorers, selectedStatusFilter]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        // Minimal validation
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            alert('Name, email, and password are required');
            return;
        }

        setIsSubmitting(true);
        try {
            await thService.createScorer({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                password: form.password,
            });
            setForm({ name: '', email: '', phone: '', password: '' });
            await fetchScorers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to create scorer');
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (id: string, status: ScorerStatus) => {
        try {
            await thService.updateScorerStatus(id, status);
            await fetchScorers();
        } catch (e: any) {
            alert(e?.response?.data?.message || `Failed to update status to ${status}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this scorer?')) return;
        try {
            await thService.deleteScorer(id);
            await fetchScorers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete scorer');
        }
    };

    const statusBadge = (status?: ScorerStatus) => {
        const s = status || 'pending';
        if (s === 'active') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} /> Active
                </span>
            );
        }
        if (s === 'suspended') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle size={12} /> Suspended
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Pending
            </span>
        );
    };

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Scorers <UserPlus className="text-indigo-500 fill-indigo-100" size={22} />
                    </h1>
                    <p className="text-xs font-medium text-gray-500">Approve, suspend, or remove scorer accounts</p>
                </div>

                <div className="flex items-center gap-2 bg-white/50 backdrop-blur p-1 rounded-xl border border-white/60 shadow-sm">
                    {(
                        [
                            { key: 'all', label: 'All' },
                            { key: 'pending', label: 'Pending' },
                            { key: 'active', label: 'Active' },
                            { key: 'suspended', label: 'Suspended' },
                        ] as const
                    ).map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setSelectedStatusFilter(opt.key)}
                            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                                selectedStatusFilter === opt.key
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-white/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create form */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">
                    <span className="text-indigo-600">Add New Scorer</span>
                </h2>

                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                            placeholder="Scorer Name"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Email</label>
                        <input
                            value={form.email}
                            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                            type="email"
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                            placeholder="email@example.com"
                            required
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone (optional)</label>
                        <input
                            value={form.phone}
                            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                            placeholder="Phone"
                        />
                    </div>

                    <div className="md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Password</label>
                        <input
                            value={form.password}
                            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                            type="password"
                            className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="md:col-span-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold shadow-lg shadow-gray-900/20 hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Plus size={16} /> {isSubmitting ? 'Creating...' : 'Create Scorer'}
                        </button>
                    </div>
                </form>

                {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">Scorer Requests</h2>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        {filteredScorers.length} shown
                    </span>
                </div>

                {loading ? (
                    <div className="py-10 text-center">
                        <div className="text-xs font-bold text-gray-400">Loading scorers...</div>
                    </div>
                ) : filteredScorers.length === 0 ? (
                    <div className="py-10 text-center">
                        <div className="text-xs font-bold text-gray-400">No scorers found</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredScorers.map((s) => (
                            <div
                                key={s._id}
                                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50/30"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 font-black">
                                            {(s.name?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900">{s.name || 'Unnamed'}</div>
                                            <div className="text-xs font-semibold text-gray-500 truncate max-w-[420px]">
                                                {s.email || '—'} {s.phone ? `• ${s.phone}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {statusBadge(s.status)}

                                    {/* Only show approve/reject for pending */}
                                    {s.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => updateStatus(s._id, 'active')}
                                                className="px-3 py-2 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                                            >
                                                <CheckCircle2 size={12} className="inline mr-1" /> Approve
                                            </button>
                                            <button
                                                onClick={() => updateStatus(s._id, 'suspended')}
                                                className="px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                                            >
                                                <XCircle size={12} className="inline mr-1" /> Reject
                                            </button>
                                        </>
                                    )}

                                    {/* If active/suspended, allow quick toggle back to pending/active as needed */}
                                    {s.status === 'active' && (
                                        <button
                                            onClick={() => updateStatus(s._id, 'suspended')}
                                            className="px-3 py-2 rounded-xl text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all"
                                        >
                                            Suspend
                                        </button>
                                    )}

                                    {s.status === 'suspended' && (
                                        <button
                                            onClick={() => updateStatus(s._id, 'active')}
                                            className="px-3 py-2 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all"
                                        >
                                            Activate
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(s._id)}
                                        className="px-3 py-2 rounded-xl text-[10px] font-black bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1"
                                    >
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

