import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Liga from './pages/Liga';
import { Header, ScrollToTop } from './components/Layout';

function App() {
    return (
        <Router basename="/Paso-Ecuador-INEF/">
            <ScrollToTop />
            <div className="min-h-screen">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/liga" element={<Liga />} />
                </Routes>
                <Header />
            </div>
        </Router>
    );
}

export default App;
