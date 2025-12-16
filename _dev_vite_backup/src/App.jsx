import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Lazy load pages to split bundles
const Home = lazy(() => import('./pages/Home'));
const Liga = lazy(() => import('./pages/Liga'));

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="min-h-screen bg-dark text-white flex items-center justify-center">Cargando...</div>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/liga" element={<Liga />} />
                    {/* Redirect legacy hashes or handle 404 if needed */}
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
