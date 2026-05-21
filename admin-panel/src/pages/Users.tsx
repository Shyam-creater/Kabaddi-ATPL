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
    ArrowUpDown, RefreshCcw
} from 'lucide-react';

export default function Users() {
    const { user: currentUser } = useSelector((state: any) => state.auth);
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
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
        <div className="min-h-screen pb-24 px-4 md:px-8 xl:px-12 space-y-10 animate-fade-in bg-[#fcfcfc]">
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
                    ) : (
                        <StatBox label="TH Accounts" value={stats.thAccounts} icon={ShieldCheck} color="bg-orange-500" />
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
                    className="fixed top-[73px] left-0 md:left-72 right-0 bottom-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-[999] p-4 overflow-y-auto"
                    onClick={() => setSelectedUser(null)}
                >
                    <div
                        className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-[0_30px_60px_rgba(0,0,0,0.35)] animate-scale-in overflow-hidden relative border-2 border-white my-8"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Background */}
                        <div className="absolute top-0 inset-x-0 h-56 bg-gray-950 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-black" />
                            <div className="absolute -top-20 -right-20 w-72 h-72 bg-red-600/10 rounded-full blur-[80px]" />
                        </div>

                        {/* Close Button */}
                        <div className="absolute top-6 right-6 z-30">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-xl border border-white/10 transition-all active:scale-90"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="relative z-10 px-6 lg:px-10 pt-16 pb-10">
                            <div className="flex flex-col lg:flex-row gap-10 items-start">

                                {/* LEFT PROFILE */}
                                <div className="w-full lg:w-72 flex flex-col items-center">

                                    <div className="relative mb-6">
                                        <div className="w-52 h-52 rounded-[2.5rem] bg-gray-900 p-2 shadow-2xl">
                                            <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden border-2 border-gray-900/10">
                                                {selectedUser.profilePicture ? (
                                                    <img
                                                        src={selectedUser.profilePicture}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                                        <UserIcon size={60} className="text-gray-200" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                                            <Award className="text-white" size={24} />
                                        </div>
                                    </div>

                                    <div className="text-center space-y-3 w-full">
                                        <h2 className="text-2xl lg:text-3xl font-black text-gray-900">
                                            {selectedUser.name}
                                        </h2>

                                        <div className="flex flex-col items-center gap-2">
                                            <span className="px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10">
                                                {selectedUser.role} Verified
                                            </span>

                                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                                                ATPL ID: {selectedUser.atplId || selectedUser._id?.slice(-8).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-2 pt-3">
                                            {selectedUser.sports?.length > 0 ? (
                                                selectedUser.sports.map((s: string) => (
                                                    <span
                                                        key={s}
                                                        className="px-3 py-1.5 bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest rounded-lg"
                                                    >
                                                        {s}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic">
                                                    No sports registered
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT DETAILS */}
                                <div className="flex-1 space-y-8 w-full">

                                    {/* INFO GRID */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <PremiumCard
                                            icon={Mail}
                                            label="Email"
                                            value={selectedUser.email}
                                            color="text-blue-600"
                                        />

                                        <PremiumCard
                                            icon={Phone}
                                            label="Phone"
                                            value={selectedUser.phone || 'UNAVAILABLE'}
                                            color="text-indigo-600"
                                        />

                                        <PremiumCard
                                            icon={MapPin}
                                            label="Location"
                                            value={selectedUser.city || selectedUser.state || 'UNKNOWN'}
                                            color="text-red-600"
                                        />

                                        <PremiumCard
                                            icon={Calendar}
                                            label="Joined"
                                            value={new Date(selectedUser.createdAt).toLocaleDateString()}
                                            color="text-amber-600"
                                        />
                                    </div>

                                    {/* ACTION SECTION */}
                                    <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 space-y-8">
                                        {/* ROLE SWITCH */}
                                        {currentUser?.role === 'super_admin' && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <Shield size={15} className="text-gray-600" />
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                        Clearance Level
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-2 p-2 bg-white border border-gray-100 rounded-2xl">
                                                    {['player', 'scorer', 'admin'].map(r => (
                                                        <button
                                                            key={r}
                                                            onClick={() => handleUpdateRole(r)}
                                                            disabled={actionLoading}
                                                            className={`flex-1 min-w-[90px] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all
                                                 ${selectedUser.role === r
                                                                    ? 'bg-primary text-white shadow-lg'
                                                                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* ACTION BUTTONS */}
                                        <div className="space-y-3">

                                            <div className="flex items-center gap-2">
                                                <UserCog size={15} className="text-gray-600" />
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    Account Actions
                                                </span>
                                            </div>

                                            <div className={`grid gap-4 ${currentUser?.role === 'super_admin' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>

                                                {selectedUser.status === 'suspended' ? (
                                                    <button
                                                        onClick={() => handleStatusChange('active')}
                                                        disabled={actionLoading}
                                                        className="group py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all animate-fade-in"
                                                    >
                                                        <CheckCircle size={18} />
                                                        Restore
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStatusChange('suspended')}
                                                        disabled={actionLoading}
                                                        className="group py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all animate-fade-in"
                                                    >
                                                        <Ban size={18} />
                                                        Suspend
                                                    </button>
                                                )}

                                                {currentUser?.role === 'super_admin' && (
                                                    <button
                                                        onClick={handleDelete}
                                                        disabled={actionLoading}
                                                        className="group py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-all animate-fade-in"
                                                    >
                                                        <Trash2 size={18} />
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>

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

function PremiumCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-primary/20 transition-all group shadow-sm hover:shadow-xl hover:shadow-gray-200/50 flex flex-col">
            <div className={`w-12 h-12 rounded-2xl bg-gray-50 ${color} mb-5 flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:shadow-md transition-all duration-500`}>
                <Icon size={20} />
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{value}</div>
        </div>
    );
}
