import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { LogOut, User, Bell, Search, Trophy, Mail, Menu } from 'lucide-react';
import api from '../services/api';
import { adminService } from '../services/admin';

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state: any) => state.auth);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isProfileHovered, setIsProfileHovered] = useState(false);

    // Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ users: any[], leagues: any[] }>({ users: [], leagues: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [allSearchableData, setAllSearchableData] = useState<{ users: any[], leagues: any[] }>({ users: [], leagues: [] });
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        fetchRecentNotifications();
        fetchGlobalSearchData();
    }, []);

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
        }).slice(0, 10); // Increased slice to show more results

        const filteredLeagues = (allSearchableData.leagues || []).filter((l: any) => {
            if (!l) return false;
            const name = (l.name || '').toLowerCase();
            const sport = (l.sport || '').toLowerCase();
            return name.includes(q) || sport.includes(q);
        }).slice(0, 10);

        setSearchResults({ users: filteredUsers, leagues: filteredLeagues });
    };

    const fetchRecentNotifications = async () => {
        try {
            const response = await api.get('/registrations');
            // Just take the 5 most recent registrations as "notifications"
            const recent = response.data.data.slice(0, 5);
            setNotifications(recent);
            setUnreadCount(recent.length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleToggleNotifications = () => {
        if (!showNotifications) {
            setUnreadCount(0); // Mark as seen
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
        dispatch(logout());
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-40 px-6 md:px-8 py-5">
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2rem] px-8 py-4 transition-all">
                {/* Welcome Message */}
                <div className="flex items-center gap-4 md:gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 transition-all active:scale-95 shadow-sm"
                        aria-label="Toggle Sidebar"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Control Panel</p>
                        <h2 className="text-lg font-black text-[#0f172a] leading-tight flex items-center gap-2">
                            Hi, <span className="text-indigo-600 drop-shadow-sm">{user?.name?.split(' ')[0] || 'Administrator'}</span> 👋
                        </h2>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-4 flex-1 justify-end relative">
                    {/* Search Field */}
                    <div className="hidden lg:flex items-center bg-white rounded-2xl px-5 py-2.5 border border-indigo-200 ring-4 ring-indigo-50/50 transition-all w-80 group relative">

                        <Search className="w-4 h-4 text-indigo-500 mr-3 transition-colors" />

                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => fetchGlobalSearchData()}
                            placeholder="Search users or leagues..."
                            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-600 placeholder-slate-400"
                        />

                        {/* Search Results Dropdown */}
                        {isSearching && searchQuery.length > 0 && (
                            <div className="absolute top-[110%] left-0 right-0 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl overflow-hidden z-[100] animate-scale-in">
                                <div className="p-4 space-y-6">
                                    {/* Users Category */}
                                    {searchResults.users.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Users</h4>
                                            <div className="space-y-1">
                                                {searchResults.users.map(u => (
                                                    <button
                                                        key={u._id}
                                                        onClick={() => { navigate(`/users?id=${u._id}`); setSearchQuery(''); setIsSearching(false); }}
                                                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden">
                                                            {u.profilePicture ? (
                                                                <img src={u.profilePicture} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                u.name?.charAt(0)
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{u.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Leagues Category */}
                                    {searchResults.leagues.length > 0 && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Leagues</h4>
                                            <div className="space-y-1">
                                                {searchResults.leagues.map(l => (
                                                    <button
                                                        key={l._id}
                                                        onClick={() => { navigate(`/registrations?tournamentId=${l._id}`); setSearchQuery(''); setIsSearching(false); }}
                                                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-all overflow-hidden">
                                                            {l.logo ? (
                                                                <img src={l.logo} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Trophy size={14} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-800">{l.name}</p>
                                                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">{l.sport}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {searchResults.users.length === 0 && searchResults.leagues.length === 0 && (
                                        <div className="py-8 text-center">
                                            <Search className="w-10 h-10 text-slate-100 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-400 italic">No matches found for "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Global Dashboard Search</span>
                                    <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className="text-[10px] font-black text-rose-500 uppercase">Close</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="hidden md:block h-6 w-px bg-slate-200 mx-2" />

                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={handleToggleNotifications}
                                className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all group shadow-sm shadow-slate-200/20"
                            >
                                <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-rose-500 rounded-full ring-2 ring-white shadow-sm shadow-rose-500/40">
                                        <span className="text-[9px] font-black text-white">{unreadCount}</span>
                                    </div>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {showNotifications && (
                                <div className="absolute top-14 right-0 w-80 bg-white/90 backdrop-blur-xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] p-6 z-[100] animate-scale-in">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="space-y-0.5">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                                            <p className="text-[10px] font-bold text-slate-400">Updates from the platform</p>
                                        </div>
                                        <button
                                            onClick={handleClearNotifications}
                                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {notifications.map((notif: any) => (
                                            <div key={notif._id} className="group cursor-pointer p-3 hover:bg-slate-50/80 rounded-2xl transition-all border border-transparent hover:border-slate-100">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                        <Trophy size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 leading-tight">
                                                            <span className="text-indigo-600">{notif.fullName}</span> registered for <span className="text-indigo-600">{getLeagueName(notif)}</span>
                                                        </p>
                                                        <p className="text-[10px] font-medium text-slate-400 mt-1">
                                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.length === 0 && (
                                            <div className="py-10 text-center">
                                                <Bell className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                                                <p className="text-xs font-bold text-slate-400">No new notifications</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile & Logout */}
                        <div className="flex items-center gap-2 pl-2 relative">
                            <div
                                onMouseEnter={() => setIsProfileHovered(true)}
                                onMouseLeave={() => setIsProfileHovered(false)}
                                className="relative group"
                            >
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 p-0.5 shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-all cursor-pointer">
                                    <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden border border-white/50">
                                        <User className="w-5 h-5 text-indigo-600" />
                                    </div>
                                </div>

                                {/* Hover Details Card */}
                                {isProfileHovered && (
                                    <div className="absolute top-14 right-0 w-64 bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl animate-scale-in z-[100] border border-white/10">
                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-xl">
                                                <User className="w-8 h-8 text-white" />
                                            </div>
                                            <h4 className="text-sm font-black tracking-tight">{user?.name || 'Administrator'}</h4>
                                            <div className="flex items-center gap-2 mt-2 text-indigo-400">
                                                <Mail size={12} />
                                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{user?.email || 'admin@atpl.com'}</p>
                                            </div>
                                            <div className="w-full h-px bg-white/10 my-4" />
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xs font-black">Admin</p>
                                                    <p className="text-[8px] font-bold text-white/40 uppercase">Role</p>
                                                </div>
                                                <div className="w-px h-6 bg-white/10" />
                                                <div className="text-center">
                                                    <p className="text-xs font-black">Active</p>
                                                    <p className="text-[8px] font-bold text-white/40 uppercase">Status</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-11 h-11 flex items-center justify-center text-slate-400 hover:text-rose-600 bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 rounded-2xl transition-all shadow-sm"
                                title="Secure Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                        onClick={() => setShowLogoutConfirm(false)}
                    />

                    {/* Modal Card */}
                    <div className="relative bg-white rounded-[3rem] p-10 w-full max-w-[400px] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-scale-in text-center">
                        <div className="w-24 h-24 bg-rose-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 ring-8 ring-rose-50/50">
                            <LogOut className="w-12 h-12 text-rose-500" />
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Terminate Session?</h3>
                        <p className="text-sm font-bold text-slate-400 mb-10 leading-relaxed px-2">
                            Are you sure you want to securely exit the admin control panel? Your unsaved changes may be lost.
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={confirmLogout}
                                className="w-full py-5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-500/30 active:scale-95"
                            >
                                Secure Logout
                            </button>
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                                Continue Working
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
