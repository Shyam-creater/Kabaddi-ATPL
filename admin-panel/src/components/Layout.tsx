import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen font-['Outfit'] selection:bg-indigo-500/30 selection:text-indigo-900 bg-slate-50">
            <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

            {/* Mobile Menu Toggle Button */}
            <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2.5 rounded-xl bg-white/90 border border-slate-200/60 backdrop-blur-md text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-md shadow-slate-200/50"
                aria-label="Open Sidebar"
            >
                <Menu size={18} />
            </button>

            {/* Main Content Wrapper - Offset for sidebar (72 = 18rem) */}
            <div className="md:ml-72 transition-all duration-300 h-screen flex flex-col overflow-hidden">
                <main className="flex-1 px-6 pb-6 pt-16 md:p-8 max-w-[1920px] mx-auto w-full animate-fade-in overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
