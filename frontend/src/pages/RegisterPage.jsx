import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('http://localhost:5000/api/auth/register', formData);
            alert("Cont creat cu succes! Te rog autentifică-te.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-green-50 overflow-hidden">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-green-100">
                <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Cont Nou</h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Nume Utilizator</label>
                        <input
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Ion Popescu"
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="nume@exemplu.com"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-1">Parolă</label>
                        <input
                            type="password"
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="••••••••"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                        Creează Cont
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-600 text-sm">
                    Ai deja cont? <Link to="/login" className="text-green-600 font-bold hover:underline">Autentifică-te</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;