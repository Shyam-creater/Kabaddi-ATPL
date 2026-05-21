import { Link, useLocation } from 'react-router-dom';
import { 
    Home, Users, ShoppingCart, Trophy, Calendar, 
    LayoutTemplate, Shield, Gavel, Image as ImageIcon, 
    Settings, Bell, X
} from 'lucide-react';
import logo from '../assets/images/ATPL-LOGO.jpeg';

import { useSelector } from 'react-redux';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
    const location = useLocation();
    const { user } = useSelector((state: any) => state.auth);

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['admin', 'super_admin', 'TH', 'scorer'] },
        { name: 'Sub-Admins', href: '/sub-admins', icon: Users, roles: ['super_admin'] },
        { name: 'TH Accounts', href: '/th-accounts', icon: Users, roles: ['admin'] },
        { name: 'Users', href: '/users', icon: Users, roles: ['admin', 'super_admin', 'TH'] },
        { name: 'Teams', href: '/teams', icon: Shield, roles: ['admin', 'TH', 'scorer'] },
        { name: 'Auction', href: '/auction', icon: Gavel, roles: ['admin', 'TH'] },
        { name: 'Matches', href: '/matches', icon: Trophy, roles: ['admin', 'TH', 'scorer'] },
        { name: 'Scorers', href: '/scorers', icon: Users, roles: ['admin', 'TH'] },
        { name: 'Leagues', href: '/leagues', icon: Calendar, roles: ['admin', 'TH'] },
        { name: 'Registration Requests', href: '/registrations', icon: LayoutTemplate, roles: ['admin', 'TH'] },
        { name: 'Stores', href: '/stores', icon: ShoppingCart, roles: ['admin'] },
        { name: 'App Content', href: '/content', icon: LayoutTemplate, roles: ['admin'] },
        { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin'] },
        { name: 'Gallery', href: '/gallery', icon: ImageIcon, roles: ['admin', 'TH'] },
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
                <div className="relative z-10 px-8 py-10 flex items-center justify-between">
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

            {/* Navigation */}
            <nav className="relative z-10 flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-5 mb-4 flex items-center justify-between">
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
                            className={`group relative flex items-center px-5 py-3.5 text-sm font-bold rounded-2xl transition-all duration-500 ease-out 
                                ${isActive
                                    ? 'text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.3)] bg-gradient-to-r from-indigo-600 to-indigo-500 translate-x-1'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.03] hover:translate-x-1'
                                }`}
                        >
                            <div className={`p-2 rounded-xl mr-3.5 transition-all duration-500 ${isActive ? 'bg-white/10' : 'bg-transparent group-hover:bg-white/5'}`}>
                                <Icon className={`w-4.5 h-4.5 transition-all duration-500 ${isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:text-indigo-400'}`} />
                            </div>
                            <span className="flex-1 tracking-tight">{item.name}</span>

                            {isActive && (
                                <div className="absolute right-4 w-1 h-5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,1)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer System Status */}
            {/* <div className="relative z-10 p-6 mt-auto">
                <div className="p-5 rounded-[2rem] bg-indigo-600/5 border border-indigo-500/10 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="relative shrink-0">
                            <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
                            <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Engine</p>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-4 px-0.5">Global systems are performing at 100% capacity.</p>
                    
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all group">
                        <Sparkles size={12} className="text-indigo-400 group-hover:animate-spin-slow" />
                        <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Optimized</span>
                    </button>
                </div>
            </div> */}
        </aside>
        </>
    );
}

