import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { adminService } from '../services/admin';
import {
    Shield, X, MapPin, Search, Calendar, Phone, Mail,
    Award, Trash2, Ban, CheckCircle, User as UserIcon,
    Users as UsersIcon, UserCheck, UserPlus,
    ChevronRight,
    ShieldCheck, UserCog, Download, Filter,
    ArrowUpDown, RefreshCcw, Activity, Target, Zap, Trophy
} from 'lucide-react';

export default function Users() {
    const { user: currentUser } = useSelector((state: any) => state.auth);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [selectedUserStats, setSelectedUserStats] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activeStatTab, setActiveStatTab] = useState('overview');
    const [actionLoading, setActionLoading] = useState(false);
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const userId = searchParams.get('id');

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (userId && users.length > 0) {
            const user = users.find(u => u._id === userId);
            if (user) {
                setSelectedUser(user);
                // Clear the search param after opening the modal
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('id');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [userId, users]);

    useEffect(() => {
        if (selectedUser) {
            setActiveStatTab('overview');
            loadPlayerStats(selectedUser._id);
            setImgError(false);
        } else {
            setSelectedUserStats(null);
        }
    }, [selectedUser]);

    const loadPlayerStats = async (id: string) => {
        try {
            setStatsLoading(true);
            const data = await adminService.getPlayerDetailedStats(id);
            setSelectedUserStats(data);
        } catch (error) {
            console.error('Failed to fetch player stats', error);
            setSelectedUserStats(null);
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        const filtered = users.filter(
            (user) => {
                const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.phone && user.phone.includes(searchTerm));
                const matchesRole = filterRole === 'all' || user.role === filterRole;
                const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
                return matchesSearch && matchesRole && matchesStatus;
            }
        );
        setFilteredUsers(filtered);
    }, [searchTerm, filterRole, filterStatus, users]);

    const handleDownload = () => {
        const headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'City', 'State', 'Joined Date'];
        const csvData = filteredUsers.map(user => [
            `"${user.name}"`,
            `"${user.email}"`,
            `"${user.role}"`,
            `"${user.status || 'Active'}"`,
            `"${user.phone || 'N/A'}"`,
            `"${user.city || 'N/A'}"`,
            `"${user.state || 'N/A'}"`,
            `"${new Date(user.createdAt).toLocaleDateString()}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ATPL_Users_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
            setHasInitialLoaded(true);
        }
    };

    const handleUpdateRole = async (newRole: string) => {
        if (!selectedUser) return;
        try {
            setActionLoading(true);
            await adminService.updateUserRole(selectedUser._id, newRole);
            await loadUsers();
            setSelectedUser({ ...selectedUser, role: newRole });
        } catch (error) {
            alert('Failed to update role');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!selectedUser) return;
        try {
            setActionLoading(true);
            await adminService.updateUserStatus(selectedUser._id, status);
            await loadUsers();
            setSelectedUser({ ...selectedUser, status });
        } catch (error) {
            alert('Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser || !confirm('Are you sure you want to permanently delete this user?')) return;
        try {
            setActionLoading(true);
            await adminService.deleteUser(selectedUser._id);
            await loadUsers();
            setSelectedUser(null);
        } catch (error) {
            alert('Failed to delete user');
        } finally {
            setActionLoading(false);
        }
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.status !== 'suspended' && u.status !== 'pending').length,
        admins: users.filter(u => u.role === 'admin').length,
        thAccounts: users.filter(u => u.role === 'TH').length,
        scorers: users.filter(u => u.role === 'scorer').length,
        newToday: users.filter(u => {
            const today = new Date();
            const joinDate = new Date(u.createdAt);
            return joinDate.getDate() === today.getDate() &&
                joinDate.getMonth() === today.getMonth() &&
                joinDate.getFullYear() === today.getFullYear();
        }).length
    };

    if (loading && !hasInitialLoaded) return (
        <div className="flex justify-center items-center h-[calc(100vh-100px)] bg-gray-50/30">
            <div className="flex flex-col items-center gap-6">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-red-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Initializing Interface</div>
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-6 md:space-y-8 pb-12 animate-fade-in">
            {/* --- TOP HUD --- */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pt-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/10">
                        <UsersIcon className="text-white" size={26} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">
                            User Registry
                        </h1>

                        <div className="flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />

                            <p className="text-[8px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                Global Identity Access
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
                    <StatBox label="Total" value={stats.total} icon={UsersIcon} color="bg-gray-900" />
                    <StatBox label="Active" value={stats.active} icon={UserCheck} color="bg-emerald-500" />
                    {currentUser?.role === 'super_admin' ? (
                        <StatBox label="Admins" value={stats.admins} icon={ShieldCheck} color="bg-orange-500" />
                    ) : currentUser?.role === 'admin' ? (
                        <StatBox label="TH Accounts" value={stats.thAccounts} icon={ShieldCheck} color="bg-orange-500" />
                    ) : (
                        <StatBox label="Scorers" value={stats.scorers} icon={UserCheck} color="bg-orange-500" />
                    )}
                    <StatBox label="New" value={stats.newToday} icon={UserPlus} color="bg-blue-600" />
                </div>
            </div>

            {/* --- SEARCH & CONTROL BAR --- */}
            <div className="flex flex-col xl:flex-row gap-4 items-center">
                <div className="relative group flex-1 w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] text-sm font-bold text-gray-900 outline-none focus:border-primary/20 focus:ring-8 focus:ring-primary/5 transition-all shadow-sm hover:border-gray-200"
                    />
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-md border border-gray-200 rounded-[1.5rem] w-full xl:w-auto overflow-x-auto no-scrollbar">
                        {(currentUser?.role === 'super_admin' 
                            ? ['all', 'player', 'scorer', 'admin'] 
                            : ['all', 'player', 'scorer', 'TH']
                        ).map(r => (
                            <button
                                key={r}
                                onClick={() => setFilterRole(r)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterRole === r ? 'bg-white text-gray-900 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-5 rounded-[1.5rem] border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${showFilters ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900 hover:border-gray-200 shadow-sm'}`}
                        >
                            <Filter size={20} />
                        </button>

                        <button
                            onClick={handleDownload}
                            className="p-5 bg-white border-2 border-gray-100 rounded-[1.5rem] text-gray-400 hover:text-primary hover:border-primary/30 transition-all active:scale-95 flex items-center justify-center shadow-sm group"
                            title="Export Data"
                        >
                            <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>

                        <button
                            onClick={loadUsers}
                            className="p-5 bg-white border-2 border-gray-100 rounded-[1.5rem] text-gray-400 hover:text-blue-600 hover:border-blue-600/30 transition-all active:scale-95 flex items-center justify-center shadow-sm group"
                            title="Refresh Data"
                        >
                            <RefreshCcw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- ADVANCED FILTER PANEL --- */}
            {showFilters && (
                <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-8 shadow-xl animate-scale-in grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['all', 'active', 'suspended', 'pending'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterStatus === s ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort Protocol</label>
                        <div className="flex gap-2">
                            <button className="flex-1 py-4 px-6 bg-gray-50 rounded-2xl text-[10px] font-bold text-gray-600 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between">
                                Newest First <ArrowUpDown size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFilterRole('all');
                                setFilterStatus('all');
                                setSearchTerm('');
                            }}
                            className="w-full py-4 bg-red-50 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                        >
                            Reset System Filters
                        </button>
                    </div>
                </div>
            )}

            {/* --- MAIN REGISTRY TABLE --- */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] overflow-hidden">
                <div className="overflow-x-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b-2 border-gray-100 uppercase tracking-[0.2em] text-[10px] font-black text-gray-500 bg-gray-50/30">
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identity Profile</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Badge</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clearance Level</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Node</th>
                                <th className="px-5 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Interface</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => (
                                <tr
                                    key={user._id}
                                    style={{ animationDelay: `${idx * 0.03}s` }}
                                    className="group hover:bg-[#F9FAFB] transition-all animate-fade-in"
                                >
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden border-2 border-gray-100 group-hover:border-red-200 transition-all shadow-sm">
                                                    {user.profilePicture ? (
                                                        <img src={user.profilePicture} className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-500" />
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span className="text-gray-900 font-black text-lg">{user.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white ${user.status === 'suspended' ? 'bg-red-500' :
                                                    user.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-base text-gray-900 flex items-center gap-2 group-hover:text-red-600 transition-colors">
                                                    {user.name}
                                                    {user.gender === 'female' && <span className="text-pink-400 text-lg">♀</span>}
                                                    {user.atplId && (
                                                        <span className="inline-flex px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-black uppercase font-mono rounded-full tracking-wider border border-red-100/50">
                                                            {user.atplId}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] font-bold text-gray-500 mt-0.5 tracking-tight">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-2 border ${user.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' :
                                            user.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'suspended' ? 'bg-red-500' :
                                                user.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} />
                                            {user.status || 'Active'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-black">
                                        <div className={`inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-black ${user.role === 'admin' ? 'text-orange-600' :
                                            user.role === 'TH' ? 'text-indigo-600' :
                                            user.role === 'scorer' ? 'text-blue-600' : 'text-gray-600'
                                            }`}>
                                            {user.role === 'admin' ? <Shield size={14} /> : user.role === 'TH' ? <ShieldCheck size={14} /> : user.role === 'scorer' ? <UserIcon size={14} /> : <UserIcon size={14} />}
                                            {user.role}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="space-y-1">
                                            <div className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                                                <Calendar size={12} className="text-gray-400" />
                                                {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </div>
                                            {/* <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">System Entry Verified</div> */}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-right pr-10">
                                        <button
                                            onClick={() => setSelectedUser(user)}
                                            className="px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary hover:border-primary hover:shadow-lg hover:shadow-primary/10 transition-all active:scale-95 inline-flex items-center gap-2"
                                        >
                                            View Vault <ChevronRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                                <Search size={40} className="text-gray-200" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-300 uppercase tracking-widest">No Signals Found</h3>
                                            <p className="text-gray-400 text-xs font-bold mt-2">Adjust your frequency filters and try again</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* --- PREMIUM USER PASSPORT MODAL --- */}
            {selectedUser && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center md:pl-72 z-[999] p-4 sm:p-6"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="bg-gradient-to-b from-white to-gray-50/50 rounded-[1.5rem] w-full max-w-5xl shadow-2xl animate-scale-in relative border border-gray-100 max-h-[90vh] overflow-y-auto custom-scrollbar p-5 sm:p-6 flex flex-col gap-5"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <div className="absolute top-4 right-4 z-30">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-900 text-gray-400 hover:text-white rounded-lg shadow-sm border border-gray-200/60 transition-all active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Top Identity Header */}
                        <div className="flex items-center gap-4 w-full pb-3 border-b border-gray-100 z-10">
                            {/* Profile Picture */}
                            <div className="relative group shrink-0">
                                <div className="w-16 h-16 rounded-xl bg-white shadow-sm border border-gray-100 p-0.5 transition-all duration-300">
                                    <div className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                                        {!imgError && selectedUser.profilePicture ? (
                                            <img
                                                src={selectedUser.profilePicture}
                                                onError={() => setImgError(true)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
                                                <span className="text-primary font-black text-lg">
                                                    {selectedUser.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-md flex items-center justify-center shadow-md border border-white text-white z-10 ${
                                    selectedUser.role === 'admin' ? 'bg-orange-500' :
                                    selectedUser.role === 'TH' ? 'bg-indigo-500' :
                                    selectedUser.role === 'scorer' ? 'bg-blue-500' :
                                    'bg-gray-900'
                                }`}>
                                    {selectedUser.role === 'admin' ? <Shield size={10} /> :
                                     selectedUser.role === 'TH' ? <ShieldCheck size={10} /> :
                                     selectedUser.role === 'scorer' ? <UserIcon size={10} /> :
                                     <Award size={10} />}
                                </div>
                            </div>

                            {/* Name and Badges */}
                            <div className="flex-1 space-y-1.5 z-10">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight">
                                        {selectedUser.name}
                                    </h2>
                                    {selectedUser.gender === 'female' && <span className="text-pink-500 text-base" title="Female">♀</span>}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-200/40 font-mono">
                                        ID: {selectedUser.atplId || selectedUser._id?.slice(-8).toUpperCase()}
                                    </span>
                                    
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-1 bg-white ${
                                        selectedUser.status === 'suspended' ? 'text-red-600 border-red-100' :
                                        selectedUser.status === 'pending' ? 'text-amber-600 border-amber-100' :
                                        'text-emerald-600 border-emerald-100'
                                    }`}>
                                        <span className={`w-1 h-1 rounded-full ${
                                            selectedUser.status === 'suspended' ? 'bg-red-500' :
                                            selectedUser.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} />
                                        {selectedUser.status || 'Active'}
                                    </div>
                                    
                                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-1 bg-white ${
                                        selectedUser.role === 'admin' ? 'text-orange-600 border-orange-100' :
                                        selectedUser.role === 'TH' ? 'text-indigo-600 border-indigo-100' :
                                        selectedUser.role === 'scorer' ? 'text-blue-600 border-blue-100' :
                                        'text-gray-600 border-gray-200'
                                    }`}>
                                        {selectedUser.role} Account
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2-Column Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full z-10">
                            
                            {/* LEFT SIDEBAR - Info & Admin Controls */}
                            <div className="lg:col-span-4 space-y-4">
                                
                                {/* Contact Details */}
                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
                                    <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200/60">
                                        <UserIcon size={10} className="text-gray-400" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                            Contact Profile
                                        </span>
                                    </div>
                                    <ContactRow icon={Mail} label="Email" value={selectedUser.email} color="text-blue-500" />
                                    <ContactRow icon={Phone} label="Phone" value={selectedUser.phone || 'N/A'} color="text-indigo-500" />
                                    <ContactRow icon={MapPin} label="Location" value={selectedUser.city || selectedUser.state || 'N/A'} color="text-red-500" />
                                    <ContactRow icon={Calendar} label="Joined" value={new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} color="text-amber-500" />
                                </div>

                                {/* ADMIN CONTROLS */}
                                {(currentUser?.role === 'super_admin' || currentUser?.role === 'admin') && (
                                    <div className="space-y-4">
                                        {/* Clearance Switch */}
                                        {currentUser?.role === 'super_admin' && (
                                            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Shield size={10} className="text-orange-500" />
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                        Clearance Level
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-1 p-0.5 bg-gray-50 border border-gray-100 rounded-lg">
                                                    {['player', 'scorer', 'admin'].map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => handleUpdateRole(r)}
                                                            disabled={actionLoading}
                                                            className={`py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all duration-200
                                                                ${selectedUser.role === r
                                                                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/40'
                                                                    : 'text-gray-400 hover:text-gray-900 border border-transparent'
                                                                }`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Account Actions */}
                                        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                                <UserCog size={10} className="text-red-500" />
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                    Authorization
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-2">
                                                {selectedUser.status === 'suspended' ? (
                                                    <button
                                                        onClick={() => handleStatusChange('active')}
                                                        disabled={actionLoading}
                                                        className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 border border-emerald-100 hover:border-emerald-500 shadow-sm active:scale-95"
                                                    >
                                                        <CheckCircle size={10} />
                                                        Restore Account
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusChange('suspended')}
                                                        disabled={actionLoading}
                                                        className="w-full py-2.5 bg-gray-50 hover:bg-gray-900 text-gray-600 hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 border border-gray-200/50 hover:border-gray-900 shadow-sm active:scale-95"
                                                    >
                                                        <Ban size={10} />
                                                        Suspend Account
                                                    </button>
                                                )}

                                                {currentUser?.role === 'super_admin' && (
                                                    <button
                                                        onClick={handleDelete}
                                                        disabled={actionLoading}
                                                        className="w-full py-2.5 bg-red-50 hover:bg-primary text-primary hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all duration-200 border border-red-100 hover:border-primary shadow-sm active:scale-95"
                                                    >
                                                        <Trash2 size={10} />
                                                        Delete Account
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT COLUMN - Statistics */}
                            <div className="lg:col-span-8 w-full">
                                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
                                                <Activity size={10} className="text-white" />
                                            </div>
                                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                                Player Data Vault
                                            </span>
                                        </div>
                                        
                                        {selectedUserStats?.stats && (
                                            <div className="flex p-0.5 bg-gray-50 border border-gray-100 rounded-xl overflow-x-auto no-scrollbar">
                                                {['overview', ...(selectedUserStats?.player?.playerProfile?.cricket ? ['formats', 'leagues', 'achievements'] : [])].map(tab => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setActiveStatTab(tab)}
                                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap ${
                                                            activeStatTab === tab 
                                                                ? 'bg-white text-gray-900 shadow-sm border border-gray-200/40' 
                                                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100/50 border border-transparent'
                                                        }`}
                                                    >
                                                        {tab}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {statsLoading ? (
                                        <div className="flex justify-center p-12">
                                            <div className="w-10 h-10 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
                                        </div>
                                    ) : selectedUserStats?.stats ? (
                                        <div className="space-y-3 pt-1">
                                            {/* OVERVIEW TAB */}
                                            {activeStatTab === 'overview' && (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                                                    <ModalStatCard label="Matches Played" value={selectedUserStats.stats.totalMatches} icon={Activity} color="bg-blue-500" accentColor="from-blue-400 to-blue-600" />
                                                    <ModalStatCard label="Total Runs" value={selectedUserStats.stats.totalRunsScored} icon={Target} color="bg-emerald-500" accentColor="from-emerald-400 to-emerald-600" />
                                                    <ModalStatCard label="Total Wickets" value={selectedUserStats.stats.totalWickets} icon={Shield} color="bg-purple-500" accentColor="from-purple-400 to-purple-600" />
                                                    <ModalStatCard label="Batting Average" value={selectedUserStats.stats.battingAverage?.toFixed(2) || '0.00'} icon={ArrowUpDown} color="bg-amber-500" accentColor="from-amber-400 to-amber-600" />
                                                    <ModalStatCard label="Strike Rate" value={selectedUserStats.stats.strikeRate?.toFixed(2) || '0.00'} icon={Zap} color="bg-rose-500" accentColor="from-rose-400 to-rose-600" />
                                                    <ModalStatCard label="Matches Won" value={selectedUserStats.stats.matchesWon} icon={Trophy} color="bg-indigo-500" accentColor="from-indigo-400 to-indigo-600" />
                                                </div>
                                            )}

                                            {/* FORMATS TAB */}
                                            {activeStatTab === 'formats' && (
                                                <div className="space-y-3 animate-fade-in">
                                                    {selectedUserStats.player?.playerProfile?.cricket?.formatStats?.length > 0 ? (
                                                        selectedUserStats.player.playerProfile.cricket.formatStats.map((f: any, idx: number) => (
                                                            <div key={idx} className="bg-gradient-to-br from-white to-gray-50/50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-gray-200 transition-all duration-200">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5 mb-2">
                                                                        <span className="w-1 h-1 bg-primary rounded-full" />
                                                                        <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{f.format}</div>
                                                                    </div>
                                                                    <div className="flex gap-6 text-xs font-bold text-gray-900">
                                                                        <span className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Matches</span><span className="text-sm font-black tracking-tight">{f.matches}</span></span>
                                                                        <span className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Runs</span><span className="text-sm font-black tracking-tight">{f.runs}</span></span>
                                                                        <span className="flex flex-col"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Wickets</span><span className="text-sm font-black tracking-tight">{f.wickets}</span></span>
                                                                    </div>
                                                                </div>
                                                                <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end bg-gray-50 group-hover:bg-white p-3 sm:p-0 rounded-xl sm:rounded-none border border-gray-100 sm:border-transparent transition-all duration-200">
                                                                    <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg / SR</div>
                                                                    <div className="text-sm font-black text-gray-900 tracking-tight">{f.average || '0.0'} <span className="text-gray-300 font-bold mx-0.5">/</span> {f.strikeRate || '0.0'}</div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 rounded-xl border border-gray-100">No format stats available</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* LEAGUES TAB */}
                                            {activeStatTab === 'leagues' && (
                                                <div className="space-y-3 animate-fade-in">
                                                    {selectedUserStats.player?.playerProfile?.cricket?.leagueHistory?.length > 0 ? (
                                                        selectedUserStats.player.playerProfile.cricket.leagueHistory.map((l: any, idx: number) => (
                                                            <div key={idx} className="bg-gradient-to-br from-white to-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4 group hover:border-gray-200 transition-all duration-200">
                                                                <div className="flex justify-between items-start">
                                                                    <div>
                                                                        <div className="text-sm font-black text-gray-950 tracking-tight">{l.leagueName}</div>
                                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest bg-white shadow-sm px-2 py-0.5 rounded border border-gray-200/60">{l.teamName}</span>
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">•</span>
                                                                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{l.season}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-100">
                                                                    <div className="text-center bg-white/80 p-2 rounded-lg border border-gray-100"><div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Matches</div><div className="text-xs font-black text-gray-900 tracking-tight">{l.matches}</div></div>
                                                                    <div className="text-center bg-white/80 p-2 rounded-lg border border-gray-100"><div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Runs</div><div className="text-xs font-black text-gray-900 tracking-tight">{l.runs}</div></div>
                                                                    <div className="text-center bg-white/80 p-2 rounded-lg border border-gray-100"><div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Wickets</div><div className="text-xs font-black text-gray-900 tracking-tight">{l.wickets}</div></div>
                                                                    <div className="text-center bg-white/80 p-2 rounded-lg border border-gray-100"><div className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Strike Rate</div><div className="text-xs font-black text-gray-900 tracking-tight">{l.strikeRate}</div></div>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 rounded-xl border border-gray-100">No league history available</div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ACHIEVEMENTS TAB */}
                                            {activeStatTab === 'achievements' && (
                                                <div className="space-y-3 animate-fade-in">
                                                    {selectedUserStats.player?.playerProfile?.cricket?.achievements?.length > 0 ? (
                                                        selectedUserStats.player.playerProfile.cricket.achievements.map((a: any, idx: number) => (
                                                            <div key={idx} className="bg-gradient-to-br from-white to-gray-50/50 p-4 rounded-xl border border-gray-100 flex gap-4 items-start group hover:border-gray-200 transition-all duration-200">
                                                                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
                                                                    <Trophy size={16} className="text-amber-500" />
                                                                </div>
                                                                <div className="flex-1 pt-0.5">
                                                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                                                        <div className="text-sm font-black text-gray-950 tracking-tight">{a.title}</div>
                                                                        <span className="px-2 py-0.5 bg-white shadow-sm rounded-lg text-[8px] font-black text-gray-500 border border-gray-200/60 tracking-wider font-mono">{a.year}</span>
                                                                    </div>
                                                                    <p className="text-[11px] text-gray-500 font-bold leading-relaxed">{a.description}</p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-center py-12 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 rounded-xl border border-gray-100">No achievements available</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 rounded-xl border border-gray-100">
                                            No statistics available
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ModalStatCard({ label, value, icon: Icon, color, accentColor }: any) {
    return (
        <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 group flex flex-col justify-between h-24 relative overflow-hidden">
            {/* Accent top glow */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accentColor} opacity-70`} />
            <div className="flex items-center justify-between">
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{label}</div>
                <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shadow-sm`}>
                    <Icon size={12} className="text-white" />
                </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none mt-2 tabular-nums">
                {value}
            </div>
        </div>
    );
}

function StatBox({ label, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-primary/20 transition-all group flex items-center gap-4 flex-1 min-w-[140px]">
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shadow-lg shadow-black/5 group-hover:scale-110 transition-transform duration-500`}>
                <Icon size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
                <div className="text-xl lg:text-2xl font-black text-gray-900 leading-none tabular-nums tracking-tight">{value}</div>
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1.5">{label}</div>
            </div>
        </div>
    );
}

function ContactRow({ icon: Icon, label, value, color }: any) {
    return (
        <div className="flex items-center gap-4 group cursor-default p-2 rounded-2xl hover:bg-gray-100/50 transition-colors">
            <div className={`w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</div>
                <div className="text-sm font-bold text-gray-900 truncate" title={value}>{value}</div>
            </div>
        </div>
    );
}
