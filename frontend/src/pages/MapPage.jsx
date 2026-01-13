import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapController = ({ triggerLocate, setTriggerLocate, onLocationFound, onLocationError }) => {
    const map = useMap();

    useEffect(() => {
        if (triggerLocate) {
            map.locate({ setView: true, maxZoom: 16 });
            setTriggerLocate(false);
        }

        const handleLocationFound = (e) => {
            if (onLocationFound) {
                onLocationFound(e.latlng);
            }

            L.popup()
                .setLatLng(e.latlng)
                .setContent('<div class="text-center font-bold text-green-700">📍 Tu ești aici!</div>')
                .openOn(map);
        };

        const handleLocationError = (e) => {
            if (onLocationError) {
                onLocationError(e);
            } else {
                alert("Nu am putut accesa locația: " + e.message);
            }
        };

        map.on('locationfound', handleLocationFound);
        map.on('locationerror', handleLocationError);

        return () => {
            map.off('locationfound', handleLocationFound);
            map.off('locationerror', handleLocationError);
        };
    }, [triggerLocate, map, setTriggerLocate, onLocationFound, onLocationError]);

    return null;
};

const RecenterOnMarker = ({ selectedMarkerId, points, triggerUpdate }) => {
    const map = useMap();

    useEffect(() => {
        if (!selectedMarkerId) return;

        const point = points.find(p => p.id === selectedMarkerId);
        if (point) {
            map.flyTo([point.lat, point.lng], 16, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedMarkerId, points, map, triggerUpdate]);

    return null;
};

const MapPage = () => {
    const [points, setPoints] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState('');
    const [loading, setLoading] = useState(true);
    const [triggerLocate, setTriggerLocate] = useState(false);

    const [userLocation, setUserLocation] = useState(null);
    const [pendingNearest, setPendingNearest] = useState(false);
    const [routeCoords, setRouteCoords] = useState([]);
    const [routeError, setRouteError] = useState('');
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeForPointId, setRouteForPointId] = useState(null);
    const [pendingRouteTarget, setPendingRouteTarget] = useState(null);
    const routeCacheRef = useRef({});
    const activeRouteRequestRef = useRef(0);

    const [selectedMarker, setSelectedMarker] = useState(null);
    const [clickTimestamp, setClickTimestamp] = useState(0);

    const [user, setUser] = useState(null);
    const [recycleModalOpen, setRecycleModalOpen] = useState(false);
    const [recyclePoint, setRecyclePoint] = useState(null);
    const [recycleCats, setRecycleCats] = useState([]);
    const [recycleQty, setRecycleQty] = useState(1);
    const [recycleStatus, setRecycleStatus] = useState('');
    const [savingRecycle, setSavingRecycle] = useState(false);

    const markerRefs = useRef({});
    const center = [44.4355, 26.1025];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, pointsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/categories'),
                    axios.get('http://localhost:5000/api/points')
                ]);
                setCategories(catRes.data);
                setPoints(pointsRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setCategories([{ id: 1, name: "Test Cat" }]);
                setPoints([{ id: 1, name: "Test Point", lat: 44.4355, lng: 26.1025, category_ids: [1], description: "Desc" }]);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('user');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch {
                setUser(null);
            }
        }
    }, []);

    const filteredPoints = selectedCat
        ? points.filter(p => p.category_ids.includes(parseInt(selectedCat)))
        : points;

    const haversineDistance = (from, to) => {
        const R = 6371e3;
        const phi1 = from.lat * Math.PI / 180;
        const phi2 = to.lat * Math.PI / 180;
        const dPhi = (to.lat - from.lat) * Math.PI / 180;
        const dLambda = (to.lng - from.lng) * Math.PI / 180;

        const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const clearRouteState = () => {
        setRouteCoords([]);
        setRouteForPointId(null);
        setRouteError('');
        setRouteLoading(false);
        activeRouteRequestRef.current = 0;
    };

    const focusOnPoint = (point) => {
        if (routeForPointId && routeForPointId !== point.id) {
            clearRouteState();
        }
        setSelectedMarker(point.id);
        setClickTimestamp(Date.now());

        setTimeout(() => {
            if (markerRefs.current[point.id]) {
                markerRefs.current[point.id].openPopup();
            }
        }, 300);
    };

    const handleLocationClick = (point) => {
        focusOnPoint(point);
    };

    const fetchRoute = async (start, end) => {
        const url = `https://router.project-osrm.org/route/v1/foot/${start.lng},${start.lat};${end.lng},${end.lat}?overview=simplified&geometries=geojson`;
        const res = await axios.get(url, { timeout: 10000 });
        const coordinates = res.data?.routes?.[0]?.geometry?.coordinates || [];

        if (!coordinates.length) {
            throw new Error('Nu am primit coordonate pentru rută');
        }

        return coordinates.map(([lng, lat]) => [lat, lng]);
    };

    const findNearestPoint = async (origin) => {
        if (!filteredPoints.length) {
            alert('Nu există puncte în lista curentă.');
            return;
        }

        const closest = filteredPoints.reduce((best, point) => {
            const dist = haversineDistance(origin, { lat: point.lat, lng: point.lng });
            if (!best || dist < best.distance) {
                return { point, distance: dist };
            }
            return best;
        }, null);

        if (closest?.point) {
            setRouteCoords([]);
            setRouteForPointId(null);
            focusOnPoint(closest.point);
        }
    };

    const handleNearestClick = () => {
        setRouteError('');
        if (!filteredPoints.length) {
            alert('Nu există puncte în lista curentă.');
            return;
        }

        if (!userLocation) {
            setPendingNearest(true);
            setTriggerLocate(true);
            return;
        }

        findNearestPoint(userLocation);
    };

    useEffect(() => {
        if (pendingNearest && userLocation) {
            findNearestPoint(userLocation);
            setPendingNearest(false);
        }
    }, [pendingNearest, userLocation, filteredPoints]);

    const fetchRouteToPoint = async (point) => {
        if (!userLocation) {
            setPendingRouteTarget(point.id);
            setTriggerLocate(true);
            return;
        }

        const requestId = Date.now();
        activeRouteRequestRef.current = requestId;

        const cacheKey = `${point.id}-${userLocation.lat.toFixed(5)}-${userLocation.lng.toFixed(5)}`;
        const cached = routeCacheRef.current[cacheKey];

        setRouteLoading(true);
        setRouteError('');
        setRouteForPointId(point.id);
        setRouteCoords([]);

        try {
            if (cached) {
                if (activeRouteRequestRef.current === requestId) {
                    setRouteCoords(cached);
                }
                return;
            }

            const shaped = await fetchRoute(userLocation, { lat: point.lat, lng: point.lng });
            if (activeRouteRequestRef.current === requestId) {
                setRouteCoords(shaped);
                routeCacheRef.current[cacheKey] = shaped;
            }
        } catch (err) {
            console.error('Eroare la generarea rutei:', err);
            setRouteCoords([]);
            setRouteError('Nu am putut genera ruta până la punct.');
        } finally {
            setRouteLoading(false);
        }
    };

    useEffect(() => {
        if (pendingRouteTarget && userLocation) {
            const targetPoint = filteredPoints.find(p => p.id === pendingRouteTarget) || points.find(p => p.id === pendingRouteTarget);
            if (targetPoint) {
                fetchRouteToPoint(targetPoint);
            }
            setPendingRouteTarget(null);
        }
    }, [pendingRouteTarget, userLocation, filteredPoints, points]);

    const openRecycleModal = (point) => {
        setRecyclePoint(point);
        setRecycleCats(point.category_ids || []);
        setRecycleQty(1);
        setRecycleStatus('');
        setRecycleModalOpen(true);
    };

    const toggleRecycleCat = (catId) => {
        setRecycleCats((prev) => (
            prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
        ));
    };

    const closeRecycleModal = () => {
        setRecycleModalOpen(false);
        setRecyclePoint(null);
        setRecycleCats([]);
    };

    const submitRecycle = async () => {
        if (!recyclePoint) return;
        if (!recycleCats.length) {
            setRecycleStatus('Selectează cel puțin un tip de deșeu.');
            return;
        }

        const numericQty = Number.parseInt(recycleQty, 10);
        const safeQty = Number.isFinite(numericQty) && numericQty > 0 ? Math.min(numericQty, 999) : 1;

        const token = localStorage.getItem('token');
        if (!token) {
            setRecycleStatus('Trebuie să fii autentificat pentru a raporta reciclarea.');
            return;
        }

        setSavingRecycle(true);
        setRecycleStatus('');
        try {
            await axios.post('http://localhost:5000/api/recycling-events', {
                pointId: recyclePoint.id,
                categoryIds: recycleCats,
                quantity: safeQty
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setRecycleStatus('Mulțumim! Am înregistrat reciclarea.');
            closeRecycleModal();
        } catch (err) {
            console.error(err);
            setRecycleStatus('Nu am putut salva înregistrarea. Încearcă din nou.');
        } finally {
            setSavingRecycle(false);
        }
    };

    return (
        <div className="relative h-full w-full flex overflow-hidden">

            <div className="relative z-[1000] flex flex-col gap-3 w-80 bg-white/90 h-full border-r border-green-100 shadow-xl">
                <div className="p-4 border-b border-green-100">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        🔍 Filtrează Deșeuri
                    </h3>
                    <select
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                        value={selectedCat}
                        onChange={(e) => setSelectedCat(e.target.value)}
                    >
                        <option value="">Toate punctele</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-500 flex justify-between">
                        <span>Rezultate:</span>
                        <span className="font-bold text-green-700">{filteredPoints.length} locații</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredPoints.length === 0 ? (
                        <div className="text-gray-400 text-center mt-10">Nu există locații.</div>
                    ) : (
                        <ul className="space-y-3">
                            {filteredPoints.map(point => (
                                <li key={point.id}>
                                    <button
                                        className={`w-full text-left border-l-4 border-green-500 border border-green-200 rounded-lg p-4 shadow-md transition flex flex-col gap-2 relative overflow-hidden 
                                            ${selectedMarker === point.id ? 'bg-gradient-to-r from-green-200 via-green-50 to-white ring-2 ring-green-600' : 'bg-gradient-to-r from-green-50 via-white to-white hover:from-green-100 hover:to-green-50'}`}
                                        onClick={() => handleLocationClick(point)}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-block text-green-600 text-xl">📍</span>
                                            <span className="font-bold text-green-900 text-base truncate">{point.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-600 italic truncate">{point.description}</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {point.categories && point.categories.map((cat, idx) => (
                                                <span key={idx} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="p-2 border-t border-green-100 flex flex-col gap-2">
                    <button
                        onClick={() => setTriggerLocate(true)}
                        className="w-full bg-blue-600 text-white p-3 rounded-xl shadow-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                    >
                        📍 Localizează-mă
                    </button>
                    <button
                        onClick={handleNearestClick}
                        className="w-full bg-green-600 text-white p-3 rounded-xl shadow-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition"
                    >
                        🧭 Cel mai apropiat punct
                    </button>
                    <div className="text-xs text-gray-500 px-1 min-h-[18px]">
                        {routeLoading && 'Se calculează ruta către punctul selectat...'}
                        {!routeLoading && routeError && routeForPointId && routeError}
                    </div>
                    {recycleStatus && (
                        <div className="text-xs text-blue-700 px-1 min-h-[18px]">{recycleStatus}</div>
                    )}
                </div>
            </div>

            <div className="flex-1 h-full w-full">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-green-700 font-semibold animate-pulse">Se încarcă harta...</div>
                ) : (
                    <MapContainer
                        center={center}
                        zoom={13}
                        className="h-full w-full z-0"
                        zoomControl={false}
                    >
                        <RecenterOnMarker
                            selectedMarkerId={selectedMarker}
                            points={points}
                            triggerUpdate={clickTimestamp}
                        />

                        <MapController
                            triggerLocate={triggerLocate}
                            setTriggerLocate={setTriggerLocate}
                            onLocationFound={(loc) => setUserLocation(loc)}
                            onLocationError={() => {
                                setPendingNearest(false);
                                setPendingRouteTarget(null);
                            }}
                        />
                        <ZoomControl position="bottomright" />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {userLocation && (
                            <CircleMarker
                                center={[userLocation.lat, userLocation.lng]}
                                radius={8}
                                pathOptions={{ color: '#2563eb', weight: 3, fillColor: '#60a5fa', fillOpacity: 0.9 }}
                            >
                                <Tooltip direction="top" offset={[0, -6]} permanent>
                                    Tu ești aici
                                </Tooltip>
                            </CircleMarker>
                        )}

                        {filteredPoints.map(point => (
                            <Marker
                                key={point.id}
                                position={[point.lat, point.lng]}
                                ref={el => markerRefs.current[point.id] = el}
                                eventHandlers={{
                                    popupclose: () => setSelectedMarker(null),
                                    click: () => handleLocationClick(point)
                                }}
                            >
                                <Popup className="point-popup">
                                    <div className="min-w-[240px] space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-600 text-lg">📍</span>
                                            <h3 className="font-bold text-green-800 text-base">{point.name}</h3>
                                        </div>
                                        <p className="text-gray-700 text-sm italic">{point.description}</p>
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {point.categories && point.categories.map((cat, idx) => (
                                                <span key={idx} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-100">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => fetchRouteToPoint(point)}
                                            disabled={routeLoading && routeForPointId === point.id}
                                            className={`w-full text-center mt-1 px-3 py-2 rounded-lg font-semibold transition border ${routeLoading && routeForPointId === point.id ? 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-green-600 text-white border-green-600 hover:bg-green-700'}`}
                                        >
                                            {routeLoading && routeForPointId === point.id ? 'Se calculează ruta...' : 'Arată ruta către punct'}
                                        </button>
                                        {user?.role === 'user' && (
                                            <button
                                                onClick={() => openRecycleModal(point)}
                                                className="w-full text-center mt-2 px-3 py-2 rounded-lg font-semibold transition border bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                                            >
                                                ♻️ Am reciclat aici
                                            </button>
                                        )}
                                        {routeError && routeForPointId === point.id && (
                                            <div className="text-xs text-red-600">{routeError}</div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {routeCoords.length > 0 && (
                            <Polyline
                                positions={routeCoords}
                                pathOptions={{ color: '#16a34a', weight: 6, opacity: 0.75 }}
                            />
                        )}
                    </MapContainer>
                )}
            </div>

            {recycleModalOpen && recyclePoint && (
                <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-green-100 w-full max-w-md p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">♻️ Am reciclat aici</h3>
                                <p className="text-sm text-gray-600">Confirmă ce ai reciclat la {recyclePoint.name}.</p>
                            </div>
                            <button onClick={closeRecycleModal} className="text-gray-400 hover:text-gray-700">✕</button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {(recyclePoint.category_ids || []).map((catId, idx) => {
                                const label = recyclePoint.categories?.[idx] || `Tip #${catId}`;
                                const active = recycleCats.includes(catId);
                                return (
                                    <button
                                        key={catId}
                                        onClick={() => toggleRecycleCat(catId)}
                                        className={`px-3 py-2 rounded-full border text-sm font-semibold transition ${active ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm text-gray-700 font-semibold">Cantitate (opțional)</label>
                            <input
                                type="number"
                                min="1"
                                max="999"
                                value={recycleQty}
                                onChange={(e) => setRecycleQty(e.target.value)}
                                className="w-32 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                            />
                            <p className="text-xs text-gray-500">Dacă nu completezi, se folosește 1.</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={submitRecycle}
                                disabled={savingRecycle}
                                className={`flex-1 px-4 py-3 rounded-lg font-bold text-white shadow-md ${savingRecycle ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                            >
                                {savingRecycle ? 'Se salvează...' : 'Confirmă reciclarea'}
                            </button>
                            <button
                                onClick={closeRecycleModal}
                                className="px-4 py-3 rounded-lg font-semibold border border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100"
                            >
                                Renunță
                            </button>
                        </div>

                        {recycleStatus && (
                            <div className="text-sm text-blue-700">{recycleStatus}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapPage;