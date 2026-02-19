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
    const getBasename = () => {
        if (window.location.host.includes('github.io')) {
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
