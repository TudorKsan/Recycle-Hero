import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [sort, setSort] = useState({ field: "created_at", direction: "desc" });
    const navigate = useNavigate();

    useEffect(() => {
        fetchPoints();
    }, []);

    const fetchPoints = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Acces interzis. Te rog autentifică-te ca admin.");
                return navigate('/login');
            }

            const res = await axios.get('http://localhost:5000/api/admin/points', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPoints(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert("Eroare la încărcarea datelor sau sesiunea a expirat.");
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        const token = localStorage.getItem('token');
        try {
            await axios.patch(`http://localhost:5000/api/admin/points/${id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setPoints(points.map(p => p.id === id ? { ...p, status: newStatus } : p));
        } catch (err) {
            alert("Eroare la actualizarea statusului.");
        }
    };

    const statusTranslations = {
        pending: 'În așteptare',
        approved: 'Aprobat',
        rejected: 'Respins'
    };


    const filteredPoints = points.filter((point) => {
        const search = filter.toLowerCase();
        return (
            point.name.toLowerCase().includes(search) ||
            (point.username || "").toLowerCase().includes(search) ||
            (point.description || "").toLowerCase().includes(search)
        );
    });

    const sortedPoints = [...filteredPoints].sort((a, b) => {
        const { field, direction } = sort;
        let valA = a[field];
        let valB = b[field];
        if (field === "created_at") {
            valA = new Date(valA);
            valB = new Date(valB);
        } else {
            valA = valA ? valA.toString().toLowerCase() : "";
            valB = valB ? valB.toString().toLowerCase() : "";
        }
        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
    });

    if (loading) return <div className="p-10 text-center">Se încarcă panoul de administrare...</div>;

    return (
        <div className="h-full w-full flex flex-col p-0 m-0 overflow-hidden">
            <div className="flex justify-between items-center mb-8 px-6 pt-6 shrink-0">
                <h1 className="text-3xl font-bold text-gray-800">🛡️ Panou Administrator</h1>
                <button
                    onClick={fetchPoints}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 font-semibold"
                >
                    Reîmprospătează
                </button>
            </div>

            <div className="flex items-center gap-4 px-6 mb-4">
                <input
                    type="text"
                    placeholder="Filtrează după nume, utilizator, descriere..."
                    className="border border-gray-300 rounded-lg px-3 py-2 w-80 focus:ring-2 focus:ring-green-500 outline-none"
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col flex-1 mx-6 mb-6 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
                        <table className="w-full text-left border-collapse table-fixed" style={{ tableLayout: 'fixed' }}>
                            <colgroup>
                                <col style={{ width: '28%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '16%' }} />
                                <col style={{ width: '20%' }} />
                            </colgroup>
                            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-4 font-bold text-gray-600 cursor-pointer select-none" onClick={() => setSort(s => ({ field: 'name', direction: s.field === 'name' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                                        Nume Punct {sort.field === 'name' ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="p-4 font-bold text-gray-600 cursor-pointer select-none" onClick={() => setSort(s => ({ field: 'username', direction: s.field === 'username' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                                        Utilizator {sort.field === 'username' ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="p-4 font-bold text-gray-600 cursor-pointer select-none" onClick={() => setSort(s => ({ field: 'created_at', direction: s.field === 'created_at' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                                        Dată {sort.field === 'created_at' ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="p-4 font-bold text-gray-600 cursor-pointer select-none" onClick={() => setSort(s => ({ field: 'status', direction: s.field === 'status' && s.direction === 'asc' ? 'desc' : 'asc' }))}>
                                        Status {sort.field === 'status' ? (sort.direction === 'asc' ? '▲' : '▼') : ''}
                                    </th>
                                    <th className="p-4 font-bold text-gray-600 text-center">Acțiuni</th>
                                </tr>
                            </thead>
                        </table>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table className="w-full text-left border-collapse table-fixed" style={{ tableLayout: 'fixed' }}>
                                <colgroup>
                                    <col style={{ width: '28%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '16%' }} />
                                    <col style={{ width: '20%' }} />
                                </colgroup>
                                <tbody className="divide-y divide-gray-100">
                                    {sortedPoints.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-gray-500">Nu există puncte de moderat.</td>
                                        </tr>
                                    )}
                                    {sortedPoints.map((point) => (
                                        <tr key={point.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-800">{point.name}</div>
                                                <div className="text-xs text-gray-400">ID: {point.id}</div>
                                            </td>
                                            <td className="p-4 text-gray-600">{point.username || 'Necunoscut'}</td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(point.created_at).toLocaleDateString('ro-RO')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${point.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                    point.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {statusTranslations[point.status] || point.status}
                                                </span>
                                            </td>
                                            <td className="p-4 flex justify-center gap-2">
                                                {point.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(point.id, 'approved')}
                                                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded shadow text-sm font-semibold transition"
                                                        >
                                                            ✓ Aprobă
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(point.id, 'rejected')}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow text-sm font-semibold transition"
                                                        >
                                                            ✗ Respinge
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-gray-400 text-sm italic">Moderat</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;