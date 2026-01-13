import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);

            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify({
                username: res.data.username,
                role: res.data.role
            }));

            if (res.data.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }

            window.location.reload();

        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Verifică datele.');
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-green-50 overflow-hidden">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-green-100">
                <h2 className="text-3xl font-bold text-center text-green-800 mb-6">Autentificare</h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
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
                        Intră în Cont
                    </button>
                </form>

                <div className="mt-6 text-center text-gray-600 text-sm">
                    Nu ai cont? <Link to="/register" className="text-green-600 font-bold hover:underline">Înregistrează-te</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;