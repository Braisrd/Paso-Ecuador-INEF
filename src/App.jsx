import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Liga from './pages/Liga';
import TransferMarket from './pages/TransferMarket';
import { Header, ScrollToTop } from './components/Layout';
import { isInstagramBrowser } from './utils/browserDetection';
import BrowserWarning from './components/BrowserWarning';

function App() {
    if (isInstagramBrowser()) {
        return <BrowserWarning />;
    }

    // Dynamic basename for GitHub Pages vs Firebase
    // Dynamic basename for GitHub Pages vs Firebase
    // 2025-02-19: Added URL param resilience.
    const getBasename = () => {
        const host = window.location.host;
        const pathname = window.location.pathname;

        // Clean params if they exist in strict checking contexts (optional but safe)
        // Check for GitHub Pages
        if (host.includes('github.io')) {
            return '/Paso-Ecuador-INEF/';
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
                    <Route path="/fichajes" element={<TransferMarket />} />
                </Routes>
                <Header />
            </div>
        </Router>
    );
}

export default App;
