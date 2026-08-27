import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Search, CheckCircle, XCircle, Clock, Eye, Calendar, Filter, Image as ImageIcon, X, Trash2, Trophy } from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';

// Build correct image URL from stored path
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE = (isLocal ? 'http://localhost:6899/api' : (import.meta.env.VITE_API_URL || 'https://back.aattumtpl.com/api')).replace('/api', '');
const getImageUrl = (url: string) => {
    if (!url) return '';
    // If it's a data: URI, return as-is
    if (url.startsWith('data:')) return url;
    // Extract /public/uploads/... portion and prepend API base
    const match = url.match(/(\/public\/uploads\/.*)/);
    if (match) return `${API_BASE}${match[1]}`;
    return url;
};

interface Registration {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    sport: string;
    paymentScreenshot: string;
    paymentAmount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    tournamentId?: { _id: string; name: string } | string;
    userId: {
        _id: string;
        name: string;
        phone: string;
        email: string;
        profilePicture?: string;
    };
}

export default function Registrations() {
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSport, setSelectedSport] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReg, setSelectedReg] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [imageModal, setImageModal] = useState<string | null>(null);

    // New view states
    const [viewMode, setViewMode] = useState<'leagues' | 'details'>('leagues');
    const [selectedTournament, setSelectedTournament] = useState<any>(null);
    const [allTournaments, setAllTournaments] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const tournamentIdParam = searchParams.get('tournamentId');

    useEffect(() => {
        fetchRegistrations();
        fetchTournaments();
    }, [selectedSport]);

    useEffect(() => {
        if (tournamentIdParam && allTournaments.length > 0 && !loading) {
            const tournament = allTournaments.find(t => t._id === tournamentIdParam);
            if (tournament) {
                // Calculate stats for this tournament from the loaded registrations
                const stats = registrations.filter(r => {
                    const tId = typeof r.tournamentId === 'object' ? r.tournamentId?._id : r.tournamentId;
                    return tId === tournament._id;
                }).reduce((acc, r) => {
                    acc.total++;
                    if (r.status === 'PENDING') acc.pending++;
                    if (r.status === 'APPROVED') acc.approved++;
                    if (r.status === 'REJECTED') acc.rejected++;
                    return acc;
                }, { total: 0, pending: 0, approved: 0, rejected: 0 });

                setSelectedTournament({ ...tournament, ...stats });
                setViewMode('details');
                // Clear the search param after switching view
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('tournamentId');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [tournamentIdParam, allTournaments, loading, registrations]);

    const fetchTournaments = async () => {
        try {
            const sports = ['cricket', 'football', 'kabaddi'];
            let all: any[] = [];

            if (selectedSport === 'all') {
                const results = await Promise.all(
                    sports.map(s => api.get(`/tournaments/${s}/all`))
                );
                results.forEach(res => all.push(...res.data));
            } else {
                const res = await api.get(`/tournaments/${selectedSport}/all`);
                all = res.data;
            }
            setAllTournaments(all);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
        }
    };

    const fetchRegistrations = async () => {
        setLoading(true);
        try {
            const url = selectedSport === 'all' ? '/registrations' : `/registrations?sport=${selectedSport}`;
            const response = await api.get(url);
            setRegistrations(response.data.data);
        } catch (error) {
            console.error('Error fetching registrations:', error);
        } finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            await api.put(`/registrations/${id}/status`, { status });
            fetchRegistrations();
            if (selectedReg?._id === id) setSelectedReg(null);
        } catch { alert('Failed to update status'); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}'s registration? This cannot be undone.`)) return;
        try {
            await api.delete(`/registrations/${id}`);
            fetchRegistrations();
            if (selectedReg?._id === id) setSelectedReg(null);
        } catch { alert('Failed to delete registration'); }
    };

    const getTournamentName = (reg: Registration) => {
        if (reg.tournamentId && typeof reg.tournamentId === 'object') return reg.tournamentId.name;
        return '—';
    };

    // Group registrations by Tournament for the summary view
    const tournamentSummaries = allTournaments.map(tournament => {
        const stats = registrations.filter(r => {
            const tId = typeof r.tournamentId === 'object' ? r.tournamentId?._id : r.tournamentId;
            return tId === tournament._id;
        }).reduce((acc, r) => {
            acc.total++;
            if (r.status === 'PENDING') acc.pending++;
            if (r.status === 'APPROVED') acc.approved++;
            if (r.status === 'REJECTED') acc.rejected++;
            return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0 });

        return {
            ...tournament,
            ...stats
        };
    }).filter(t => {
        if (searchTerm && !t.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    // Also include registrations that don't have a tournamentId (if any)
    const unassignedRegistrations = registrations.filter(r => !r.tournamentId);
    if (unassignedRegistrations.length > 0 && selectedSport === 'all') {
        const stats = unassignedRegistrations.reduce((acc, r) => {
            acc.total++;
            if (r.status === 'PENDING') acc.pending++;
            if (r.status === 'APPROVED') acc.approved++;
            if (r.status === 'REJECTED') acc.rejected++;
            return acc;
        }, { total: 0, pending: 0, approved: 0, rejected: 0 });

        tournamentSummaries.push({
            _id: 'unassigned',
            name: 'Unassigned/Direct',
            sport: 'various',
            ...stats
        });
    }

    // Filters
    const filteredRegistrations = registrations.filter(r => {
        // Tournament drill-down filter
        if (selectedTournament) {
            const tId = typeof r.tournamentId === 'object' ? r.tournamentId?._id : r.tournamentId;
            const targetId = selectedTournament._id;

            if (targetId === 'unassigned') {
                if (tId) return false; // If it has any tournament ID, it's NOT unassigned
            } else if (tId !== targetId) {
                return false;
            }
        }

        const matchesSearch = r.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.phone?.includes(searchTerm) ||
            r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getTournamentName(r).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const regDate = new Date(r.createdAt);
        const matchesDateFrom = !dateFrom || regDate >= new Date(dateFrom);
        const matchesDateTo = !dateTo || regDate <= new Date(dateTo + 'T23:59:59');
        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    // Stats
    const stats = {
        total: registrations.length,
        pending: registrations.filter(r => r.status === 'PENDING').length,
        approved: registrations.filter(r => r.status === 'APPROVED').length,
        rejected: registrations.filter(r => r.status === 'REJECTED').length,
    };

    // Download all as CSV
    const downloadReport = () => {
        const esc = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
        const headers = ['ID', 'Full Name', 'Email', 'Phone', 'Sport', 'Tournament', 'Fee', 'Status', 'Date', 'Payment URL'];
        const csv = [
            headers.join(','),
            ...filteredRegistrations.map(r => [
                esc(r._id), esc(r.fullName), esc(r.email), esc(r.phone), esc(r.sport),
                esc(getTournamentName(r)), esc(r.paymentAmount), esc(r.status),
                esc(new Date(r.createdAt).toLocaleDateString()), esc(r.paymentScreenshot)
            ].join(','))
        ].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Registrations_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Helper to convert image URL to base64 for PDF embedding
    const getBase64Image = async (imgUrl: string): Promise<string | null> => {
        try {
            const res = await fetch(imgUrl);
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error('PDF Image Error:', e);
            return null;
        }
    };

    // Download single player receipt as PDF
    const downloadPlayerReceipt = async (reg: Registration) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(79, 70, 229); // Indigo 600
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('ATPL SCORE', 15, 20);
        doc.setFontSize(10);
        doc.text('OFFICIAL REGISTRATION RECEIPT', 15, 30);

        // Registration Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Receipt ID: ${reg._id}`, pageWidth - 15, 15, { align: 'right' });
        doc.text(`Date: ${new Date(reg.createdAt).toLocaleDateString()}`, pageWidth - 15, 22, { align: 'right' });

        // Content
        let y = 55;
        const drawSection = (title: string, data: { label: string, value: string }[]) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(title, 15, y);
            doc.line(15, y + 2, 70, y + 2);
            y += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            data.forEach(item => {
                doc.setFont('helvetica', 'bold');
                doc.text(`${item.label}:`, 15, y);
                doc.setFont('helvetica', 'normal');
                doc.text(String(item.value || 'N/A'), 50, y);
                y += 7;
            });
            y += 5;
        };

        drawSection('PLAYER DETAILS', [
            { label: 'Name', value: reg.fullName },
            { label: 'Email', value: reg.email },
            { label: 'Phone', value: reg.phone },
            { label: 'Sport', value: reg.sport?.toUpperCase() },
            { label: 'Tournament', value: getTournamentName(reg) }
        ]);

        drawSection('PAYMENT DETAILS', [
            { label: 'Amount Paid', value: `INR ${reg.paymentAmount || 500}` },
            { label: 'Status', value: reg.status }
        ]);

        // Payment Proof Image
        if (reg.paymentScreenshot) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('PAYMENT PROOF', 15, y);
            y += 5;

            const imgUrl = getImageUrl(reg.paymentScreenshot);
            const base64Img = await getBase64Image(imgUrl);

            if (base64Img) {
                try {
                    // Try to maintain aspect ratio
                    const imgProps = doc.getImageProperties(base64Img);
                    const imgWidth = 80;
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    // Check if image fits on page, else add new page
                    if (y + imgHeight > 280) {
                        doc.addPage();
                        y = 20;
                    }

                    doc.addImage(base64Img, 'JPEG', 15, y, imgWidth, imgHeight);
                } catch (err) {
                    doc.setTextColor(255, 0, 0);
                    doc.text('Failed to embed proof image', 15, y + 10);
                }
            } else {
                doc.setTextColor(150, 150, 150);
                doc.text('(Proof image could not be loaded)', 15, y + 10);
            }
        }

        // Footer
        const finalY = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Generated by ATPL Score Admin System', pageWidth / 2, finalY, { align: 'center' });

        doc.save(`Receipt_${reg.fullName?.replace(/\s/g, '_')}_${reg._id.slice(-6)}.pdf`);
    };

    return (
        <div className="min-h-screen pb-24 px-4 md:px-8 xl:px-12 space-y-10 animate-fade-in bg-[#fcfcfc]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-5">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">
                        {viewMode === 'leagues' ? 'Registration Requests' : `${selectedTournament?.name} (${selectedTournament?.total})`}
                    </h1>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {viewMode === 'leagues' ? 'Select a league to manage registrations' : `Managing ${selectedTournament?.total} applications for this league`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {viewMode === 'details' && (
                        <button
                            onClick={() => { setViewMode('leagues'); setSelectedTournament(null); }}
                            className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all"
                        >
                            <Calendar size={16} /> Back to Leagues
                        </button>
                    )}
                    <button onClick={downloadReport}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        <Download size={16} /> Download CSV
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: selectedTournament ? selectedTournament.total : stats.total, color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' },
                    { label: 'Pending', value: selectedTournament ? selectedTournament.pending : stats.pending, color: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
                    { label: 'Approved', value: selectedTournament ? selectedTournament.approved : stats.approved, color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
                    { label: 'Rejected', value: selectedTournament ? selectedTournament.rejected : stats.rejected, color: 'bg-red-50 text-red-700', border: 'border-red-200' },
                ].map(s => (
                    <div key={s.label} className={`${s.color} ${s.border} border rounded-2xl p-4 flex flex-col items-center`}>
                        <span className="text-2xl font-black">{s.value}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                {/* Sport Tabs + Search */}
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-200">
                        {['all', 'cricket', 'football', 'kabaddi'].map(sport => (
                            <button key={sport} onClick={() => setSelectedSport(sport)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${selectedSport === sport ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
                                {sport}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Search name, phone, email, tournament..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm transition-all"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* Status + Date Filters */}
                <div className="flex flex-wrap gap-3 items-center">
                    <Filter size={14} className="text-gray-400" />
                    <div className="flex gap-1 p-1 bg-gray-50 rounded-lg border border-gray-100">
                        {['all', 'PENDING', 'APPROVED', 'REJECTED'].map(st => (
                            <button key={st} onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${statusFilter === st ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-700'}`}>
                                {st === 'all' ? 'All Status' : st}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Calendar size={14} className="text-gray-400" />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium outline-none focus:border-indigo-400" />
                        <span className="text-xs text-gray-400">to</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium outline-none focus:border-indigo-400" />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="text-[10px] font-bold text-red-500 hover:underline">Clear</button>
                        )}
                    </div>
                </div>
            </div>

            {/* Results count & Main Content */}
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-400">
                    {viewMode === 'leagues'
                        ? `Found ${tournamentSummaries.length} active leagues`
                        : `Showing ${filteredRegistrations.length} of ${registrations.filter(r => {
                            const tId = typeof r.tournamentId === 'object' ? r.tournamentId?._id : r.tournamentId;
                            return tId === selectedTournament?._id;
                        }).length} registrations`}
                </p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-sm font-bold text-gray-400">Loading data...</p>
                </div>
            ) : viewMode === 'leagues' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournamentSummaries.map(tournament => (
                        <div key={tournament._id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <Trophy size={24} />
                                </div>
                                <span className="px-3 py-1 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest rounded-full">{tournament.sport}</span>
                            </div>

                            <h3 className="text-lg font-black text-gray-900 mb-2">{tournament.name}</h3>

                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="text-center">
                                    <p className="text-xl font-black text-gray-900">{tournament.total}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-amber-600">{tournament.pending}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Pending</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-emerald-600">{tournament.approved}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Approved</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-red-600">{tournament.rejected}</p>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Rejected</p>
                                </div>
                            </div>

                            <button
                                onClick={() => { setSelectedTournament(tournament); setViewMode('details'); }}
                                className="w-full py-3 bg-gray-900 text-white rounded-2xl text-xs font-bold hover:bg-black transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                            >
                                <Eye size={16} /> View Registrations
                            </button>
                        </div>
                    ))}
                    {tournamentSummaries.length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                            <p className="text-sm font-bold text-gray-400">No leagues found matching your criteria</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto w-full">
                    <table className="w-full min-w-[1400px] text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Player</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tournament</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Proof</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRegistrations.map(reg => (
                                <tr key={reg._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                                {reg.userId?.profilePicture ? (
                                                    <img src={getImageUrl(reg.userId.profilePicture)} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-sm font-black text-indigo-600">{reg.fullName?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{reg.fullName}</p>
                                                <p className="text-[10px] font-medium text-gray-400">{new Date(reg.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs font-bold text-gray-800 truncate max-w-[150px]">{getTournamentName(reg)}</p>
                                        <p className="text-[10px] font-black uppercase text-indigo-500">{reg.sport}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-xs font-semibold text-gray-600">{reg.phone}</p>
                                        <p className="text-[11px] text-gray-400 font-medium truncate max-w-[160px]">{reg.email}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm font-black text-gray-900">₹{reg.paymentAmount || 500}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {reg.paymentScreenshot ? (
                                            <button onClick={() => setImageModal(getImageUrl(reg.paymentScreenshot))}
                                                className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-indigo-400 transition-all cursor-pointer relative group">
                                                <img src={getImageUrl(reg.paymentScreenshot)} alt="proof" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                    <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-400">No proof</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${reg.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            reg.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {reg.status === 'PENDING' && <Clock size={10} />}
                                            {reg.status === 'APPROVED' && <CheckCircle size={10} />}
                                            {reg.status === 'REJECTED' && <XCircle size={10} />}
                                            {reg.status}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setSelectedReg(reg)} title="View Details"
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={() => downloadPlayerReceipt(reg)} title="Download Receipt"
                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                                                <Download size={16} />
                                            </button>
                                            <button onClick={() => handleStatusUpdate(reg._id, 'APPROVED')} title="Approve"
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                <CheckCircle size={16} />
                                            </button>
                                            <button onClick={() => handleStatusUpdate(reg._id, 'REJECTED')} title="Reject"
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <XCircle size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(reg._id, reg.fullName)} title="Delete"
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRegistrations.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-16 text-sm font-bold text-gray-400">No registrations found in this league</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Registration Details Modal */}
            {selectedReg && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/20 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setSelectedReg(null)}
                >
                    <div
                        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl flex flex-col my-10 animate-scale-in"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Registration Details</h2>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest break-all">ID: {selectedReg._id}</p>
                            </div>
                            <button onClick={() => setSelectedReg(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} className="text-gray-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left: Payment Proof */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Payment Proof</h3>
                                        {selectedReg.paymentScreenshot ? (
                                            <div className="relative group cursor-pointer" onClick={() => setImageModal(getImageUrl(selectedReg.paymentScreenshot))}>
                                                <img src={getImageUrl(selectedReg.paymentScreenshot)} alt="Payment proof"
                                                    className="w-full rounded-xl object-contain shadow-sm border border-white max-h-80"
                                                    onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                                <div className="hidden items-center justify-center h-40 bg-gray-100 rounded-xl text-gray-400 text-xs font-bold">
                                                    <ImageIcon size={20} className="mr-2" /> Image failed to load
                                                </div>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                                                    <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-40 bg-gray-100 rounded-xl text-gray-400 text-xs font-bold">
                                                No payment proof uploaded
                                            </div>
                                        )}
                                    </div>

                                    <div className={`p-4 rounded-xl border flex items-center justify-between ${selectedReg.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                        selectedReg.status === 'REJECTED' ? 'bg-red-50 border-red-100 text-red-700' :
                                            'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                        <span className="text-xs font-bold">Current Status</span>
                                        <span className="text-xs font-black uppercase">{selectedReg.status}</span>
                                    </div>
                                </div>

                                {/* Right: Player Info */}
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Player Information</h3>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                            {[
                                                { label: 'Full Name', value: selectedReg.fullName },
                                                { label: 'Sport', value: selectedReg.sport?.toUpperCase(), cls: 'text-indigo-600' },
                                                { label: 'Phone', value: selectedReg.phone },
                                                { label: 'Email', value: selectedReg.email },
                                                { label: 'Fee Paid', value: `₹${selectedReg.paymentAmount || 500}`, cls: 'text-emerald-600 font-black' },
                                                { label: 'Date', value: new Date(selectedReg.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
                                                { label: 'Tournament', value: getTournamentName(selectedReg), span: true },
                                            ].map((item, i) => (
                                                <div key={i} className={item.span ? 'col-span-2' : ''}>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{item.label}</p>
                                                    <p className={`text-sm font-bold text-gray-900 break-words ${item.cls || ''}`}>{item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={() => downloadPlayerReceipt(selectedReg)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-all">
                                        <Download size={14} /> Download Receipt
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-4">
                            <button onClick={() => handleStatusUpdate(selectedReg._id, 'APPROVED')}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> Approve Registration
                            </button>
                            <button onClick={() => handleStatusUpdate(selectedReg._id, 'REJECTED')}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                                <XCircle size={16} /> Reject Application
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Fullscreen Modal - Rendered LAST with highest z-index */}
            {imageModal && (
                <div
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[1100] p-4 overflow-y-auto"
                    onClick={() => setImageModal(null)}
                >
                    {/* Top Right Cancel Button */}
                    <button
                        onClick={() => setImageModal(null)}
                        className="absolute top-5 right-5 p-3 bg-white rounded-full shadow-2xl hover:bg-red-50 transition-all active:scale-90 z-[1200]"
                    >
                        <X size={22} className="text-red-600" />
                    </button>

                    <div
                        className="relative max-w-4xl py-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={imageModal}
                            alt="Payment Proof"
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl border-4 border-white mt-20"
                        />

                        <div className="mt-6 flex justify-center">
                            <a
                                href={imageModal}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-900 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-100 transition-all shadow-xl active:scale-95"
                            >
                                <Download size={18} /> Download Proof
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
