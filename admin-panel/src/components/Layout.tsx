import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar_HEAD';
import { Menu, User } from 'lucide-react';
import logo from '../assets/images/ATPL-LOGO.jpeg';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    // Reset collapsed state on mobile resize: ensure expanded on small screens
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        // Initial check
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const { user } = useSelector((state: any) => state.auth);

    return (
        <div className="min-h-screen font-['Outfit'] selection:bg-indigo-500/30 selection:text-indigo-900 bg-slate-50">
            <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} collapsed={collapsed} onToggleCollapse={() => setCollapsed(prev => !prev)} />

            {/* Mobile Top Header Bar */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 text-slate-600 hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                        aria-label="Open Sidebar"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <img src={logo} alt="ATPL" className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200" />
                        <span className="font-black text-slate-800 tracking-tighter text-base">
                            ATPL<span className="text-indigo-600">SCORE</span>
                        </span>
                    </div>
                </div>

                {/* Right side user badge */}
                {user && (
                    <div className="flex items-center gap-2">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-800 leading-none">{user.name}</p>
                            <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-wider mt-0.5">
                                {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : user.role === 'scorer' ? 'Scorer' : 'TH'}
                            </p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-indigo-600" />
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Wrapper - Offset for sidebar (72 = 18rem) */}
            <div className={`${collapsed ? 'md:ml-20' : 'md:ml-72'} transition-all duration-300 h-screen flex flex-col overflow-hidden`}>
                <main className="flex-1 px-6 pb-6 pt-20 md:p-8 max-w-[1920px] mx-auto w-full animate-fade-in overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
