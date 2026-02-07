import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Header = () => {
    const { pathname } = useLocation();

    return (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
            <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl flex items-center gap-6 shadow-2xl">
                <Link
                    to="/"
                    className={`text-sm font-black tracking-widest uppercase transition-colors ${pathname === '/' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                    Inicio
                </Link>
                <div className="w-px h-4 bg-white/10"></div>
                <Link
                    to="/liga"
                    className={`text-sm font-black tracking-widest uppercase transition-colors ${pathname === '/liga' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                >
                    Liga
                </Link>
            </div>
        </nav>
    );
};

export const ScrollToTop = () => {
    const { pathname } = React.useMemo(() => window.location, [window.location.pathname]);

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
};
