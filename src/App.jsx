import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Liga from './pages/Liga';
// import TransferMarket from './pages/TransferMarket';
import { Header, ScrollToTop } from './components/Layout';
import { isInstagramBrowser } from './utils/browserDetection';
import BrowserWarning from './components/BrowserWarning';

function App() {
    // 3. Router Resilience: Strip tracking parameters that break hydration
    useEffect(() => {
        if (window.location.search.includes('fbclid=') || window.location.search.includes('igshid=')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('fbclid');
            url.searchParams.delete('igshid');
            window.history.replaceState({}, document.title, url.toString());
        }
    }, []);

    if (isInstagramBrowser()) {
        return <BrowserWarning />;
    }

    // Senior Debugger: Robust basename calculation (Instruction 2)
    const getBasename = () => {
        try {
            const host = window.location.hostname;
            // Strict check for GitHub Pages, ignoring any path-based confusion
            if (host.includes('github.io')) {
                return '/Paso-Ecuador-INEF';
            }
        } catch (e) {
            console.error("Error detecting basename context:", e);
        }
        return '/';
    };

    return (
        <Router basename={getBasename()}>
            <ScrollToTop />
            <div className="min-h-[100dvh] w-full">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/liga" element={<Liga />} />
                    {/* Unfinished features hidden per user request */}
                </Routes>
                <Header />
            </div>
        </Router>
    );
}

export default App;
