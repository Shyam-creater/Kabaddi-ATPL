import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    Home, Users, ShoppingCart, Trophy, Calendar, 
    LayoutTemplate, Shield, Gavel, Image as ImageIcon, 
    Settings, Bell, X, LogOut, Search, User
} from 'lucide-react';
import logo from '../assets/images/ATPL-LOGO.jpeg';
import { logout } from '../store/authSlice';
import api from '../services/api';
import { adminService } from '../services/admin';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: any) => state.auth);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ users: any[], leagues: any[] }>({ users: [], leagues: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [allSearchableData, setAllSearchableData] = useState<{ users: any[], leagues: any[] }>({ users: [], leagues: [] });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRecentNotifications();
            fetchGlobalSearchData();
        }
    }, [user]);

    const fetchGlobalSearchData = async () => {
        try {
            const [usersDataResult, cricketRes, footballRes, kabaddiRes] = await Promise.allSettled([
                adminService.getAllUsers(),
                api.get('/tournaments/cricket/all'),
                api.get('/tournaments/football/all'),
                api.get('/tournaments/kabaddi/all')
            ]);

            const usersData = usersDataResult.status === 'fulfilled' ? usersDataResult.value : [];
            const cricketData = cricketRes.status === 'fulfilled' ? (cricketRes.value.data || []) : [];
            const footballData = footballRes.status === 'fulfilled' ? (footballRes.value.data || []) : [];
            const kabaddiData = kabaddiRes.status === 'fulfilled' ? (kabaddiRes.value.data || []) : [];

            setAllSearchableData({
                users: Array.isArray(usersData) ? usersData : [],
                leagues: [
                    ...(Array.isArray(cricketData) ? cricketData : []),
                    ...(Array.isArray(footballData) ? footballData : []),
                    ...(Array.isArray(kabaddiData) ? kabaddiData : [])
                ]
            });
        } catch (error) {
            console.error('Error fetching global search data:', error);
        }
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults({ users: [], leagues: [] });
            setIsSearching(query.trim().length > 0);
            return;
        }

        setIsSearching(true);
        const q = query.toLowerCase().trim();

        const filteredUsers = (allSearchableData.users || []).filter((u: any) => {
            if (!u) return false;
            const name = (u.name || '').toLowerCase();
            const email = (u.email || '').toLowerCase();
            const role = (u.role || '').toLowerCase();
            return name.includes(q) || email.includes(q) || role.includes(q);
        }).slice(0, 5);

        const filteredLeagues = (allSearchableData.leagues || []).filter((l: any) => {
            if (!l) return false;
            const name = (l.name || '').toLowerCase();
            const sport = (l.sport || '').toLowerCase();
            return name.includes(q) || sport.includes(q);
        }).slice(0, 5);

        setSearchResults({ users: filteredUsers, leagues: filteredLeagues });
    };

    const fetchRecentNotifications = async () => {
        try {
            const response = await api.get('/registrations');
            const recent = response.data.data.slice(0, 5);
            setNotifications(recent);
            setUnreadCount(recent.length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleToggleNotifications = () => {
        if (!showNotifications) {
            setUnreadCount(0);
        }
        setShowNotifications(!showNotifications);
    };

    const handleClearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    const getLeagueName = (notif: any) => {
        if (typeof notif.tournamentId === 'object' && notif.tournamentId?.name) {
            return notif.tournamentId.name;
        }
        return 'a League';
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        const userRole = user?.role;
        dispatch(logout());
        if (userRole === 'TH' || userRole === 'scorer') {
            navigate('/th-login');
        } else {
            navigate('/login');
        }
    };

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'super_admin', 'TH', 'scorer'] },
        { name: 'Sub-Admins', href: '/sub-admins', icon: Users, roles: ['super_admin'] },
        { name: 'TH Accounts', href: '/th-accounts', icon: Users, roles: ['admin'] },
        { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'super_admin', 'TH'] },
        { name: 'Teams', href: '/teams', icon: Shield, roles: ['admin', 'super_admin', 'TH', 'scorer'] },
        { name: 'Auction', href: '/auction', icon: Gavel, roles: ['admin', 'TH'] },
        { name: 'Matches', href: '/matches', icon: Trophy, roles: ['admin', 'super_admin', 'TH', 'scorer'] },
        { name: 'Scorers', href: '/scorers', icon: Users, roles: ['admin', 'TH'] },
        { name: 'Leagues', href: '/leagues', icon: Calendar, roles: ['admin', 'super_admin', 'TH'] },
        { name: 'Registration Requests', href: '/registrations', icon: LayoutTemplate, roles: ['admin', 'super_admin', 'TH'] },
        { name: 'Stores', href: '/stores', icon: ShoppingCart, roles: ['admin'] },
        { name: 'App Content', href: '/content', icon: LayoutTemplate, roles: ['admin', 'super_admin'] },
        { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin', 'super_admin'] },
        { name: 'Gallery', href: '/gallery', icon: ImageIcon, roles: ['admin', 'super_admin', 'TH'] },
    ];

    const filteredNavigation = navigation.filter(item => user && item.roles.includes(user.role));

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`flex flex-col w-72 h-screen fixed top-0 left-0 z-50 bg-[#070b14] text-white shadow-[10px_0_40px_rgba(0,0,0,0.3)] overflow-hidden font-['Outfit'] border-r border-white/5 transition-transform duration-300 ease-out md:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                {/* Ambient Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                    <div className="absolute bottom-[20%] -right-[10%] w-[60%] h-[30%] bg-fuchsia-600/10 blur-[100px] rounded-full" />
                </div>

                {/* Brand Section */}
                <div className="relative z-10 px-8 py-8 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-4 group">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-fuchsia-600 rounded-2xl blur-md opacity-40 group-hover:opacity-80 transition-all duration-500" />
                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-white/20 p-0.5 bg-white/5">
                                <img src={logo} alt="ATPL" className="w-full h-full object-cover rounded-[14px]" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter leading-none">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-indigo-300">ATPL</span>
                                <span className="text-indigo-500 font-extrabold ml-1">SCORE</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                    {user?.role === 'super_admin' ? 'Super Admin Portal' : user?.role === 'admin' ? 'Sub-Admin Portal' : user?.role === 'scorer' ? 'Scorer Portal' : 'TH Portal'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all active:scale-95 border border-white/10"
                        aria-label="Close menu"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Global Search Bar (Sidebar Integrated) */}
                <div className="relative z-20 px-4 mb-4 flex-shrink-0">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                        <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => fetchGlobalSearchData()}
                            placeholder="Search users or leagues..."
                            className="bg-transparent border-none outline-none text-xs w-full font-bold text-white placeholder-slate-500"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => handleSearch('')}
                                className="text-slate-400 hover:text-white p-0.5"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Search Results Overlay */}
                    {isSearching && searchQuery.length > 0 && (
                        <div className="absolute top-[110%] left-4 right-4 bg-[#0a0f1d]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden z-[100] max-h-80 overflow-y-auto custom-scrollbar">
                            <div className="p-4 space-y-4">
                                {/* Users Category */}
                                {searchResults.users.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Users</h4>
                                        <div className="space-y-1">
                                            {searchResults.users.map(u => (
                                                <button
                                                    key={u._id}
                                                    onClick={() => { navigate(`/users?id=${u._id}`); setSearchQuery(''); setIsSearching(false); if(onClose) onClose(); }}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden shrink-0">
                                                        {u.profilePicture ? (
                                                            <img src={u.profilePicture} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            u.name?.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{u.name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium truncate">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Leagues Category */}
                                {searchResults.leagues.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">Leagues</h4>
                                        <div className="space-y-1">
                                            {searchResults.leagues.map(l => (
                                                <button
                                                    key={l._id}
                                                    onClick={() => { navigate(`/registrations?tournamentId=${l._id}`); setSearchQuery(''); setIsSearching(false); if(onClose) onClose(); }}
                                                    className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-all text-left group"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-all overflow-hidden shrink-0">
                                                        {l.logo ? (
                                                            <img src={l.logo} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Trophy size={14} />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{l.name}</p>
                                                        <p className="text-[10px] text-rose-400 font-black uppercase tracking-widest truncate">{l.sport}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchResults.users.length === 0 && searchResults.leagues.length === 0 && (
                                    <div className="py-6 text-center">
                                        <Search className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-500 italic">No matches found</p>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#090d16] p-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Global Dashboard Search</span>
                                <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className="text-[9px] font-black text-rose-400 hover:text-rose-300 uppercase tracking-wider">Close</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="relative z-10 flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <div className="px-5 mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">General</span>
                        <Settings size={12} className="text-slate-700" />
                    </div>

                    {filteredNavigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={onClose}
                                className={`group relative flex items-center px-5 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ease-out 
                                    ${isActive
                                        ? 'text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] bg-gradient-to-r from-indigo-600 to-indigo-500 translate-x-1'
                                        : 'text-slate-400 hover:text-white hover:bg-white/[0.03] hover:translate-x-1'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-xl mr-3 transition-all duration-300 ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                                    <Icon className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                                </div>
                                <span className="flex-1 tracking-tight text-xs">{item.name}</span>

                                {isActive && (
                                    <div className="absolute right-4 w-1 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer - User Profile & Action Controls */}
                <div className="relative z-10 p-4 mt-auto border-t border-white/5 bg-white/[0.01] backdrop-blur-md flex-shrink-0">
                    {/* Notifications Popover */}
                    {showNotifications && (
                        <div className="absolute bottom-[80px] left-4 right-4 bg-[#0a0f1d] border border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-2xl p-4 z-[100] animate-scale-in">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Activity</h4>
                                    <p className="text-[8px] font-bold text-slate-500">Recent registrations</p>
                                </div>
                                <button
                                    onClick={handleClearNotifications}
                                    className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 transition-colors rounded-lg"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                {notifications.map((notif: any) => (
                                    <div key={notif._id} className="group p-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/5">
                                        <div className="flex gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Trophy size={12} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold text-slate-300 leading-tight group-hover:text-white">
                                                    <span className="text-indigo-400">{notif.fullName}</span> registered for <span className="text-indigo-400">{getLeagueName(notif)}</span>
                                                </p>
                                                <p className="text-[8px] font-medium text-slate-500 mt-0.5">
                                                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <div className="py-6 text-center">
                                        <Bell className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                                        <p className="text-[10px] font-bold text-slate-500">No new notifications</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                        {/* User profile card */}
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-fuchsia-600 p-0.5 shadow-md shadow-indigo-500/10">
                                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center overflow-hidden border border-white/10">
                                        <User className="w-4 h-4 text-indigo-400" />
                                    </div>
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#070b14] shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-black text-slate-200 truncate leading-none mb-0.5">{user?.name || 'Administrator'}</h4>
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider truncate">
                                    {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : user?.role === 'scorer' ? 'Scorer' : 'TH'}
                                </p>
                            </div>
                        </div>

                        {/* Action buttons (Notification bell & logout) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Notifications Bell */}
                            <button
                                onClick={handleToggleNotifications}
                                className="relative w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-all active:scale-95"
                                title="Recent Registrations"
                            >
                                <Bell size={14} />
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center bg-rose-500 rounded-full shadow-sm shadow-rose-500/40">
                                        <span className="text-[8px] font-black text-white">{unreadCount}</span>
                                    </div>
                                )}
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all active:scale-95"
                                title="Secure Logout"
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden md:pl-72">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowLogoutConfirm(false)}
                    />

                    {/* Modal Card */}
                    <div className="relative bg-white rounded-3xl p-8 w-full max-w-[460px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-scale-in text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-8 ring-rose-50/50">
                            <LogOut className="w-8 h-8 text-rose-500" />
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Confirm Logout</h3>
                        <p className="text-xs text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
                            Are you sure you want to securely exit the admin control panel? Your unsaved changes may be lost.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-95"
                            >
                                Keep Session
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/20 active:scale-95"
                            >
                                Secure Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

