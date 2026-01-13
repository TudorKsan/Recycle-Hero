import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import MapPage from './pages/MapPage';
import AddPointPage from './pages/AddPointPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StatisticsPage from './pages/StatisticsPage';

export default function App() {
    return (
        <Router>
            <div className="h-screen w-screen flex flex-col font-sans bg-gray-50 overflow-hidden">
                <Navbar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/map" element={<MapPage />} />
                        <Route path="/add" element={<AddPointPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/statistics" element={<StatisticsPage />} />
                    </Routes>
                </div>
            </div>
        </Router>
    );
}