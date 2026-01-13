import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
        window.location.reload();
    };

    const isActive = (path) => location.pathname === path ? "text-yellow-300 font-bold" : "hover:text-yellow-100 transition";

    return (
        <nav className="bg-green-700 text-white shadow-md p-4 sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold flex items-center gap-2 hover:scale-105 transition">
                    ♻️ RecycleHero
                </Link>

                <div className="flex items-center space-x-6 text-lg">
                    <Link to="/" className={isActive('/')}>Acasă</Link>
                    <Link to="/map" className={isActive('/map')}>Hartă</Link>
                    <Link to="/statistics" className={isActive('/statistics')}>Statistici</Link>

                    {user ? (
                        <>

                            {user.role === 'admin' && (
                                <Link to="/admin" className={isActive('/admin')}>
                                    Admin
                                </Link>
                            )}

                            <Link to="/add" className={`px-4 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-green-900 font-semibold transition shadow-sm ${location.pathname === '/add' ? 'ring-2 ring-white' : ''}`}>
                                + Adaugă Punct
                            </Link>

                            <div className="flex items-center gap-3 border-l border-green-600 pl-4 ml-2">
                                <span className="text-sm opacity-90 hidden md:inline">Salut, {user.username}!</span>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm bg-green-800 hover:bg-green-900 px-3 py-1 rounded transition"
                                >
                                    Ieși din cont
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-4 border-l border-green-600 pl-4">
                                <Link to="/login" className={isActive('/login')}>Autentificare</Link>
                                <Link to="/register" className="bg-white text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-100 transition shadow-sm text-sm">
                                    Înregistrare
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;