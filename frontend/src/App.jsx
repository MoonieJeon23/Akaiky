import React, { useState } from 'react';
import axios from 'axios'; // //ne pas toucher sauf fullstack

// //ne pas toucher sauf fullstack : Configuration de l'URL de base
const API_URL = "http://localhost:5000/api";

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Salama ! Je suis Akaiky. Comment puis-je t\'aider à Madagascar aujourd\'hui ?' }
  ]);
  const [loading, setLoading] = useState(false);

  // //ne pas toucher sauf fullstack : Logique d'appel API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const currentInput = input.trim(); // On capture la valeur actuelle pour éviter les bugs d'asynchronisme
    if (!currentInput || loading) return;

    // Ajouter le message utilisateur à l'écran
    const userMsg = { role: 'user', text: currentInput };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // //ne pas toucher sauf fullstack : Appel vers le serveur Node.js
      const response = await axios.post(`${API_URL}/chat`, {
        prompt: currentInput
      });

      // //ne pas toucher sauf fullstack : Extraction de la réponse Groq
      const aiMsg = { role: 'ai', text: response.data.text };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Erreur de liaison API:", error);
      setMessages((prev) => [...prev, { 
        role: 'ai', 
        text: "Désolé, la connexion avec Tana est interrompue. Vérifie que le backend est lancé !" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4">
      {/* --- DESIGN : Tes coéquipiers peuvent modifier tout ce qui est en dessous --- */}
      
      <header className="w-full max-w-2xl py-6 text-center">
        <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Akaiky IA</h1>
        <p className="text-slate-500 font-medium">L'expertise locale à portée de main</p>
      </header>

      <div className="flex-1 w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
        
        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 animate-pulse text-slate-400">
                Akaiky réfléchit...
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question sur Tana..."
            className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <button 
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-blue-200"
          >
            Envoyer
          </button>
        </form>
      </div>
      
      <footer className="mt-4 text-slate-400 text-sm">
        Projet Hackathon - Développé avec ❤️ à Antananarivo
      </footer>
    </div>
  );
}

export default App;