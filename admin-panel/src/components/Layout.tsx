import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen font-['Outfit'] selection:bg-indigo-500/30 selection:text-indigo-900 bg-slate-50">
            <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

            {/* Main Content Wrapper - Offset for sidebar (72 = 18rem) */}
            <div className="md:ml-72 transition-all duration-300 h-screen flex flex-col overflow-hidden">
                <Header onMenuClick={() => setIsMobileOpen(true)} />
                <main className="flex-1 p-6 md:p-8 max-w-[1920px] mx-auto w-full animate-fade-in overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
