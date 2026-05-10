import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Mic, ShieldAlert, Navigation, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'leaflet/dist/leaflet.css';

// Fix icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_URL = "http://localhost:5000/api";

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Salama ! Cliquez sur "Me localiser" pour commencer.' }]);
  const [locations, setLocations] = useState([]);
  const [mapCenter, setMapCenter] = useState([-18.8792, 47.5079]); // Centre par défaut (Tana)
  const [isListening, setIsListening] = useState(false);

  // RECHERCHE GOOGLE MAPS DYNAMIQUE
  const openGoogleSearch = (keyword) => {
    const query = encodeURIComponent(`${keyword} proche de moi`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const getMyLocation = () => {
    if (!navigator.geolocation) return alert("Géolocalisation non supportée.");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        
        try {
          const res = await axios.post(`${API_URL}/locations/nearby`, { lat: latitude, lng: longitude });
          setLocations(res.data);
          setMessages(prev => [...prev, { role: 'ai', text: "Position mise à jour. Choisissez une catégorie ou parlez-moi de votre problème." }]);
        } catch (err) { console.error(err); }
      },
      (error) => alert(`Erreur : ${error.message}`),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // maximumAge: 0 force la position réelle
    );
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');

    try {
      // ON ENVOIE LES COORDONNEES A L'IA ICI
      const res = await axios.post(`${API_URL}/chat`, { 
        prompt: userText, 
        lat: mapCenter[0], 
        lng: mapCenter[1] 
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.text }]);
    } catch (err) { console.error(err); }
  };

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Micro non supporté.");
    const rec = new SpeechRecognition();
    rec.lang = 'fr-FR';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => setInput(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div style={{ backgroundColor: '#1a1d21', minHeight: '100vh', color: '#fff' }}>
      <nav style={{ backgroundColor: '#24272d', padding: '15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #343a40' }}>
        <h2 style={{ color: '#0d6efd', margin: 0 }}>Akaiky</h2>
        <div>
          <button onClick={toggleListening} style={{ backgroundColor: isListening ? '#fff' : '#dc3545', border: 'none', padding: '10px 20px', borderRadius: '50px', marginRight: '10px' }}>
             <ShieldAlert size={18} /> {isListening ? 'ÉCOUTE...' : 'URGENCE'}
          </button>
          <button onClick={getMyLocation} style={{ backgroundColor: '#0d6efd', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '50px' }}>
            <Navigation size={18} /> Me localiser
          </button>
        </div>
      </nav>

      <main style={{ display: 'flex', gap: '20px', padding: '20px', height: '85vh' }}>
        {/* CHAT */}
        <div style={{ flex: '0 0 350px', backgroundColor: '#24272d', borderRadius: '15px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '10px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                <div style={{ display: 'inline-block', backgroundColor: msg.role === 'user' ? '#0d6efd' : '#1a1d21', padding: '10px', borderRadius: '10px', maxWidth: '90%' }}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} style={{ padding: '15px', display: 'flex', gap: '5px' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Besoin d'aide ?" style={{ flex: 1, borderRadius: '20px', border: '1px solid #343a40', backgroundColor: '#1a1d21', color: '#fff', padding: '5px 15px' }} />
            <button type="submit" style={{ background: 'none', border: 'none', color: '#0d6efd' }}><Mic /></button>
          </form>
        </div>

        {/* MAP */}
        <div style={{ flex: 2, borderRadius: '15px', overflow: 'hidden', border: '1px solid #343a40' }}>
          <MapContainer center={mapCenter} zoom={15} style={{ height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={mapCenter} />
            <Marker position={mapCenter}><Popup>Vous êtes ici</Popup></Marker>
          </MapContainer>
        </div>

        {/* CATEGORIES */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {locations.map((loc, i) => (
            <div key={i} style={{ backgroundColor: '#24272d', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{loc.name}</div>
              <button onClick={() => openGoogleSearch(loc.name)} style={{ width: '100%', backgroundColor: '#0d6efd', border: 'none', color: '#fff', padding: '8px', borderRadius: '8px' }}>
                <MapPin size={14} /> Voir les plus proches
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;