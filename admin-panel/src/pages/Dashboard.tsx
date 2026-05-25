import { useEffect, useState } from 'react';
import { adminService } from '../services/admin';
import { thService } from '../services/th';
import { useSelector } from 'react-redux';
import {
    Users, Trophy, Calendar, Activity, ArrowUpRight,
    Shirt, Gamepad2, UserPlus, Sparkles, Zap, Target,
    TrendingUp, Download, MoreHorizontal, RefreshCcw
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, 
    Tooltip, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid 
} from 'recharts';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const { user } = useSelector((state: any) => state.auth);

    useEffect(() => {
        loadStats();
    }, [user]);

    const loadStats = async () => {
        try {
            setLoading(true);
            let data;
            if (user?.role === 'TH') {
                data = await thService.getDashboardStats();
            } else {
                data = await adminService.getDashboardStats();
            }
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!stats) return;

        // Compile headers and data
        const headers = ['Report Category', 'Statistic Value', 'Status/Trend'];
        const rows = [
            ['Total Platform Users', stats.users?.total || 0, 'Overview'],
            ['Male Users', stats.users?.male || 0, 'Demographics'],
            ['Female Users', stats.users?.female || 0, 'Demographics'],
            ['Active Live Matches', stats.counts?.activeMatches || 0, 'Real-time'],
            ['Ongoing Tournaments', stats.counts?.tournaments || 0, 'Activity'],
            ['Registered Teams', stats.counts?.teams || 0, 'Structure'],
            ['Cricket Vertical', stats.categories?.cricket?.tournaments || 0, 'Sport'],
            ['Kabaddi Vertical', stats.categories?.kabaddi?.tournaments || 0, 'Sport'],
            ['Football Vertical', stats.categories?.football?.tournaments || 0, 'Sport'],
        ];

        // Convert to CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `ATPL_Performance_Report_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFilter = () => {
        // Since backend is aggregate, we use filter as a "Synchronize/Refresh" action
        loadStats();
    };

    if (loading) return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-indigo-600/10 rounded-full animate-pulse flex items-center justify-center">
                        <Sparkles className="text-indigo-600" size={20} />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <p className="text-gray-900 font-bold text-xl tracking-tight">Syncing Data</p>
                <p className="text-gray-500 font-medium animate-pulse text-sm">Preparing your dashboard experience...</p>
            </div>
        </div>
    );

    const mainStats = [
        {
            title: 'Total Users',
            value: stats?.users?.total || 0,
            icon: Users,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-600',
            trend: '+12.5%',
            isPositive: true
        },
        {
            title: 'Active Matches',
            value: stats?.counts?.activeMatches || 0,
            icon: Zap,
            gradient: 'from-amber-400 to-orange-600',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600',
            trend: 'Live',
            isPositive: true
        },
        {
            title: 'Tournaments',
            value: stats?.counts?.tournaments || 0,
            icon: Trophy,
            gradient: 'from-emerald-400 to-teal-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-600',
            trend: 'Active',
            isPositive: true
        },
        {
            title: 'Total Teams',
            value: stats?.counts?.teams || 0,
            icon: Shirt,
            gradient: 'from-violet-500 to-purple-600',
            bgLight: 'bg-violet-50',
            textColor: 'text-violet-600',
            trend: '+5',
            isPositive: true
        },
    ];

    const categories = [
        { id: 'cricket', label: 'Cricket', color: '#6366f1', bg: 'bg-indigo-50/50', icon: Target, border: 'border-indigo-100' },
        { id: 'kabaddi', label: 'Kabaddi', color: '#f97316', bg: 'bg-orange-50/50', icon: Activity, border: 'border-orange-100' },
        { id: 'football', label: 'Football', color: '#10b981', bg: 'bg-emerald-50/50', icon: Gamepad2, border: 'border-emerald-100' },
    ];

    // const getCircleStrokeDash = (value: number, total: number) => {
    //     const percentage = total > 0 ? (value / total) * 100 : 0;
    //     return `${percentage}, 100`;
    // };

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
                        Overview <Sparkles className="text-yellow-500 fill-yellow-500" size={24} />
                    </h1>
                    <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500" />
                        Platform performance and user activity for today.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200/60 ring-1 ring-slate-900/5">
                        <Calendar size={14} className="text-indigo-500" />
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                     <button 
                        onClick={handleFilter}
                        className={`p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95 ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                        title="Refresh Analytics"
                    >
                        <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2.5 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                    >
                        <Download size={16} />
                        <span className="hidden sm:inline">Export Report</span>
                    </button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 animate-slide-in-right">
                {mainStats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="group relative bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 border border-white/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                            <div className="flex items-start justify-between mb-8">
                                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg shadow-indigo-500/20 transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                                    <Icon size={24} />
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase
                                    ${stat.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}
                                `}>
                                    <ArrowUpRight size={12} strokeWidth={3} />
                                    {stat.trend}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{stat.title}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-[#0f172a] tracking-tight">{stat.value.toLocaleString()}</h3>
                                </div>
                            </div>

                            {/* Subtle Background Pattern */}
                            <div className="absolute bottom-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                                <Icon size={80} strokeWidth={1} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* User Demographics - LG: Span 4 */}
                <div className="lg:col-span-4 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                            <Users className="text-indigo-600" size={20} /> Demographics
                        </h2>
                        <button className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center min-h-[340px]">
                        <div className="relative w-full h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Male', value: stats?.users?.male || 0 },
                                            { name: 'Female', value: stats?.users?.female || 0 }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={8}
                                        dataKey="value"
                                        animationDuration={1500}
                                        animationBegin={0}
                                    >
                                        <Cell fill="#6366f1" stroke="none" />
                                        <Cell fill="#ec4899" stroke="none" />
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '16px', 
                                            border: 'none', 
                                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-4xl font-black text-[#0f172a]">{stats?.users?.total}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Users</span>
                            </div>
                        </div>

                        <div className="w-full space-y-4 mt-6">
                            <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-indigo-50/40 border border-indigo-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                    <span className="text-xs font-bold text-slate-700">Male Identities</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{stats?.users?.male}</p>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{Math.round((stats?.users?.male / stats?.users?.total) * 100) || 0}%</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-pink-50/40 border border-pink-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                                    <span className="text-xs font-bold text-slate-700">Female Identities</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{stats?.users?.female}</p>
                                    <p className="text-[10px] font-bold text-pink-500 uppercase">{Math.round((stats?.users?.female / stats?.users?.total) * 100) || 0}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Breakdown - LG: Span 8 */}
                <div className="lg:col-span-8 bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/60 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                                <Target className="text-indigo-600" size={20} /> Sport Verticals
                            </h2>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity across game types</p>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors flex items-center gap-2 group">
                            Deep Insights <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="flex-1 min-h-[300px] mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={categories.map(cat => ({
                                    name: cat.label,
                                    leagues: stats?.categories?.[cat.id]?.tournaments || 0,
                                    // teams: stats?.categories?.[cat.id]?.teams || 0,
                                    // players: stats?.categories?.[cat.id]?.players || 0,
                                }))}
                                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} 
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Bar dataKey="leagues" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="teams" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="players" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {categories.map((cat) => {
                            const data = stats?.categories?.[cat.id];
                            const SportIcon = cat.icon;

                            return (
                                <div key={cat.id} className={`${cat.bg} rounded-[2rem] p-6 border ${cat.border} transition-all duration-500 hover:shadow-lg hover:shadow-indigo-500/5 group`}>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className={`p-3 rounded-2xl bg-white shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors`}>
                                            <SportIcon size={24} />
                                        </div>
                                        <h3 className="font-black text-[#0f172a] text-lg">{cat.label}</h3>
                                    </div>

                                    <div className="space-y-6">
                                        {[
                                            { label: 'Leagues', val: data?.tournaments || 0, max: 15, color: '#6366f1' },
                                            { label: 'Teams', val: data?.teams || 0, max: 30, color: '#8b5cf6' },
                                            { label: 'Players', val: data?.players || 0, max: 150, color: '#ec4899' }
                                        ].map((item, i) => (
                                            <div key={i} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{item.label}</span>
                                                    <span className="text-sm font-black text-slate-700">{item.val}</span>
                                                </div>
                                                <div className="h-1.5 bg-white/50 rounded-full overflow-hidden border border-white/50">
                                                    <div className="h-full rounded-full transition-all duration-1000 ease-out"
                                                        style={{
                                                            width: `${Math.min((item.val / item.max) * 100, 100)}%`,
                                                            backgroundColor: item.color
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Registrations - Premium Table Section */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-[#0f172a] tracking-tight flex items-center gap-3">
                            <UserPlus className="text-indigo-600" size={24} /> New Acquisitions
                        </h2>
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Real-time registration stream</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="hidden sm:flex items-center gap-2 px-6 py-2.5 text-xs font-black text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100">
                            View All
                        </button>
                        <button className="flex items-center gap-2 px-6 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition-all shadow-xl shadow-indigo-500/20">
                            Download Log
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
                                <th className="px-8 py-6">Member Profile</th>
                                <th className="px-8 py-6">Digital Address</th>
                                <th className="px-8 py-6">Account Status</th>
                                <th className="px-8 py-6">Onboarding Date</th>
                                <th className="px-8 py-6 text-right">Access</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60">
                            {stats?.users?.recent?.map((user: any) => (
                                <tr key={user._id} className="group hover:bg-indigo-50/30 transition-all duration-300">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base text-white shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500
                                                ${user.gender === 'Female' ? 'bg-gradient-to-br from-pink-400 to-rose-500' : 'bg-gradient-to-br from-indigo-400 to-blue-600'}
                                            `}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-black text-[#0f172a] text-sm tracking-tight">{user.name}</p>
                                                <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest mt-0.5">{user.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-600">{user.email}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm
                                            ${user.role === 'admin'
                                                ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
                                            Active
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="text-sm font-bold text-slate-500">
                                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                            <ArrowUpRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {(!stats?.users?.recent || stats.users.recent.length === 0) && (
                        <div className="p-20 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 flex items-center justify-center rounded-[2.5rem] mb-6 border border-white shadow-inner">
                                <Users className="text-slate-200" size={40} />
                            </div>
                            <h3 className="text-[#0f172a] font-black text-xl tracking-tight">No active stream</h3>
                            <p className="text-slate-400 font-bold text-sm mt-2 max-w-xs mx-auto text-balance">We couldn't find any recent user activity. New registrations will be streamed here in real-time.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

