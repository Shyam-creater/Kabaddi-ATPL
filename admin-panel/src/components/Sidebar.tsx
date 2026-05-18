import { Link, useLocation } from 'react-router-dom';
import { 
    Home, Users, ShoppingCart, Trophy, Calendar, 
    LayoutTemplate, Shield, Gavel, Image as ImageIcon, 
    Settings, Bell
} from 'lucide-react';
import logo from '../assets/images/ATPL-LOGO.jpeg';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Teams', href: '/teams', icon: Shield },
    { name: 'Auction', href: '/auction', icon: Gavel },
    { name: 'Matches', href: '/matches', icon: Trophy },
    { name: 'Leagues', href: '/leagues', icon: Calendar },
    { name: 'Registration Requests', href: '/registrations', icon: LayoutTemplate },
    { name: 'Stores', href: '/stores', icon: ShoppingCart },
    { name: 'App Content', href: '/content', icon: LayoutTemplate },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Gallery', href: '/gallery', icon: ImageIcon },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="hidden md:flex flex-col w-72 h-screen fixed top-0 left-0 z-50 bg-[#070b14] text-white shadow-[10px_0_40px_rgba(0,0,0,0.3)] overflow-hidden font-['Outfit'] border-r border-white/5">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[80%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] -right-[10%] w-[60%] h-[30%] bg-fuchsia-600/10 blur-[100px] rounded-full" />
            </div>

            {/* Brand Section */}
            <div className="relative z-10 px-8 py-10">
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
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Admin Portal</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
                <div className="px-5 mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">General</span>
                    <Settings size={12} className="text-slate-700" />
                </div>

                {navigation.map((item) => {
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
    );
}

