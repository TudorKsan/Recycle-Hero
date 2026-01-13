import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const RecenterMap = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.flyTo([lat, lng], 15);
    }, [lat, lng, map]);
    return null;
};

const LocationSelector = ({ setLocation }) => {
    useMapEvents({
        click(e) {
            setLocation(e.latlng);
        },
    });
    return null;
};

const AddPointPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', description: '', category_ids: [] });
    const [location, setLocation] = useState(null);
    const [categories, setCategories] = useState([]);
    const [statusMsg, setStatusMsg] = useState('');

    const [viewCenter, setViewCenter] = useState([44.4355, 26.1025]);

    useEffect(() => {
        axios.get('http://localhost:5000/api/categories').then(res => setCategories(res.data));
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation nu este suportat de browserul tău.");
            return;
        }
        setStatusMsg('Se caută locația...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLoc = { lat: latitude, lng: longitude };
                setLocation(newLoc);
                setViewCenter([latitude, longitude]);
                setStatusMsg('Locație găsită!');
            },
            () => {
                setStatusMsg('Eroare: Nu am putut prelua locația.');
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) return alert('Te rog selectează o locație pe hartă sau folosește GPS-ul!');

        const token = localStorage.getItem('token');

        if (!token) {
            return alert("Pentru siguranță, trebuie să fii autentificat ca să adaugi puncte. (Mergi la /login)");
        }

        try {
            await axios.post('http://localhost:5000/api/points', {
                ...formData,
                lat: location.lat,
                lng: location.lng,
                category_ids: formData.category_ids.map(Number)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Punct trimis spre aprobare!');
            navigate('/map');
        } catch (err) {
            console.error(err);
            alert('Eroare la salvare.');
        }
    };

    const handleCatChange = (e) => {
        const value = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, category_ids: value });
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
            {/* Form Section */}
            <div className="w-full md:w-1/3 p-6 bg-gray-50 overflow-y-auto border-r shadow-lg z-10">
                <h2 className="text-2xl font-bold mb-6 text-green-800 flex items-center gap-2">
                    📍 Adaugă Punct Nou
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nume Locație</label>
                        <input
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="Ex: Tomberon Kaufland"
                            required
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Adresă / Detalii</label>
                        <textarea
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none h-24"
                            placeholder="Ex: Bulevardul Iuliu Maniu 15, la intrarea în magazin"
                            required
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ce se colectează? (Ctrl+Click)</label>
                        <select multiple className="w-full border rounded p-2 h-32 focus:ring-2 focus:ring-green-500 outline-none" onChange={handleCatChange}>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-bold text-blue-800 mb-2">Locație:</h4>
                        <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm flex-1 transition"
                            >
                                📍 GPS Automat
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 italic">
                            {statusMsg || (location ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : 'Sau dă click pe harta din dreapta')}
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/map')}
                            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
                        >
                            Anulează
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition transform hover:-translate-y-0.5"
                        >
                            Trimite Punctul
                        </button>
                    </div>
                </form>
            </div>

            <div className="w-full md:w-2/3 relative">
                <MapContainer center={viewCenter} zoom={13} className="h-full w-full cursor-crosshair" zoomControl={false}>
                    <ZoomControl position="bottomright" />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <RecenterMap lat={viewCenter[0]} lng={viewCenter[1]} />
                    <LocationSelector setLocation={setLocation} />
                    {location && <Marker position={location} />}
                </MapContainer>

                <div className="absolute top-4 right-4 bg-white/90 p-3 rounded-lg shadow-md border border-gray-200 z-[400] text-sm pointer-events-none text-gray-700">
                    👆 Click pe hartă pentru a poziționa pin-ul
                </div>
            </div>
        </div>
    );
};

export default AddPointPage;