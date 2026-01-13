import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
    return (
        <div className="h-full w-full bg-gradient-to-b from-green-50 to-green-100 flex flex-col items-center justify-center text-center p-6 overflow-hidden">
            <div className="max-w-3xl">
                <h1 className="text-5xl font-extrabold text-green-800 mb-6">
                    Reciclează Inteligent în <span className="text-green-600">București</span>
                </h1>
                <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                    Găsește rapid locurile unde poți recicla baterii, electronice, plastic și multe altele.
                    Ajută comunitatea adăugând puncte noi pe hartă!
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/map" className="bg-green-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-700 shadow-lg transition transform hover:-translate-y-1">
                        🗺️ Vezi Harta
                    </Link>
                    <Link to="/add" className="bg-white text-green-700 border-2 border-green-600 px-8 py-4 rounded-lg text-xl font-bold hover:bg-green-50 shadow-md transition">
                        📍 Adaugă Punct
                    </Link>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard icon="🔋" title="Baterii & DEEE" desc="Găsește puncte pentru deșeuri periculoase." />
                    <FeatureCard icon="👕" title="Textile" desc="Donează hainele vechi la containere specializate." />
                    <FeatureCard icon="🌍" title="Comunitate" desc="Date actualizate de studenți și voluntari." />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
        <div className="text-4xl mb-3">{icon}</div>
        <h3 className="font-bold text-lg text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{desc}</p>
    </div>
);

export default LandingPage;