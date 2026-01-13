import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StatisticsPage = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState('');
    const [metric, setMetric] = useState('events');
    const [stats, setStats] = useState({ byPoint: [], byCategory: [] });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/categories');
                setCategories(res.data);
            } catch (err) {
                console.error(err);
                setError('Nu am putut încărca categoriile.');
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError('');
            try {
                const [statsRes, eventsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/recycling-stats', {
                        params: selectedCat ? { category_id: selectedCat } : {}
                    }),
                    axios.get('http://localhost:5000/api/recycling-events', {
                        params: selectedCat ? { category_id: selectedCat } : {}
                    })
                ]);
                setStats(statsRes.data || { byPoint: [], byCategory: [] });
                setEvents(eventsRes.data || []);
            } catch (err) {
                console.error(err);
                setError('Nu am putut încărca statisticile.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedCat]);

    const chartData = useMemo(() => {
        const useQuantity = metric === 'quantity';
        const labels = stats.byPoint.map((p) => p.name);
        const data = stats.byPoint.map((p) => useQuantity ? p.total_quantity : p.events_count);
        return {
            labels,
            datasets: [
                {
                    label: useQuantity ? 'Cantitate totală raportată' : 'Reciclări înregistrate',
                    data,
                    backgroundColor: 'rgba(34,197,94,0.65)',
                    borderColor: 'rgba(22,163,74,1)',
                    borderWidth: 1.5,
                }
            ]
        };
    }, [stats.byPoint, metric]);

    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false },
        },
        scales: {
            x: { ticks: { color: '#14532d' } },
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
    }), []);

    return (
        <div className="h-full w-full overflow-hidden flex flex-col bg-gray-50">
            <div className="p-6 pb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-green-800">📊 Statistici Reciclare</h1>
                    <p className="text-gray-600 text-sm">Vizualizează activitatea pe puncte și filtrează după tipul de deșeu.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex gap-2 items-center">
                        <label className="text-sm text-gray-700">Tip deșeu:</label>
                        <select
                            className="border rounded-lg px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
                            value={selectedCat}
                            onChange={(e) => setSelectedCat(e.target.value)}
                        >
                            <option value="">Toate</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Metodă:</span>
                        <div className="flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <button
                                onClick={() => setMetric('events')}
                                className={`px-3 py-2 text-sm font-semibold ${metric === 'events' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Număr reciclări
                            </button>
                            <button
                                onClick={() => setMetric('quantity')}
                                className={`px-3 py-2 text-sm font-semibold border-l border-gray-200 ${metric === 'quantity' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                Cantitate totală
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="mx-6 mb-2 p-3 bg-red-100 text-red-700 rounded-lg border border-red-200">{error}</div>}

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 px-6 pb-6 overflow-y-auto">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-1 lg:col-span-2 flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold text-green-800">Repartizare pe locații</h2>
                            <span className="text-xs text-gray-500">Metrică: {metric === 'quantity' ? 'cantitate totală' : 'număr reciclări'}</span>
                        </div>
                        <span className="text-sm text-gray-500">{stats.byPoint.length} locații</span>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-green-700">Se încarcă graficul...</div>
                    ) : stats.byPoint.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Nu există date pentru filtrul selectat.</div>
                    ) : (
                        <div className="flex-1">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col min-h-[360px]">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-green-800">Top tipuri de deșeu</h2>
                        <span className="text-sm text-gray-500">{stats.byCategory.length} tipuri</span>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-green-700">Se încarcă...</div>
                    ) : stats.byCategory.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Nu există date.</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                            {stats.byCategory.map((cat) => (
                                <div key={cat.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-gray-800">{cat.name}</div>
                                        <div className="text-xs text-gray-500">Evenimente: {cat.events_count}</div>
                                    </div>
                                    <span className="px-3 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        Total: {cat.total_quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 col-span-1 lg:col-span-3 flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-green-800">Evenimente recente</h2>
                        <span className="text-sm text-gray-500">{events.length} înregistrări</span>
                    </div>
                    {loading ? (
                        <div className="flex-1 flex items-center justify-center text-green-700">Se încarcă evenimentele...</div>
                    ) : events.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Nu există evenimente încă.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3">Locație</th>
                                        <th className="px-4 py-3">Tip deșeu</th>
                                        <th className="px-4 py-3">Cantitate</th>
                                        <th className="px-4 py-3">Utilizator</th>
                                        <th className="px-4 py-3">Dată</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {events.map((ev) => (
                                        <tr key={ev.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-semibold text-gray-800">{ev.point_name}</td>
                                            <td className="px-4 py-3 text-gray-700">{ev.category_name}</td>
                                            <td className="px-4 py-3 text-gray-700">{ev.quantity}</td>
                                            <td className="px-4 py-3 text-gray-500">{ev.username || 'Anonim'}</td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {new Date(ev.created_at).toLocaleString('ro-RO')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsPage;
