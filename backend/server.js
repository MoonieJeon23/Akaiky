require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const Groq = require('groq-sdk');

/**
 * CONFIGURATION & INITIALISATION
 */
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares pour la sécurité et la lecture du JSON
app.use(cors());
app.use(express.json());

// Initialisation de l'IA Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Connexion à la base de données akaiky_db
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akaiky_db',
    waitForConnections: true,
    connectionLimit: 10
});

// Fonction utilitaire pour l'heure de Madagascar
const getMadagascarTime = () => {
    return new Date().toLocaleTimeString('fr-FR', { 
        timeZone: 'Indian/Antananarivo', 
        hour: '2-digit', 
        minute: '2-digit',
        weekday: 'long' 
    });
};

/**
 * ROUTES API
 */

// --- ROUTE 1 : IA & CHAT (Avec injection de ta position GPS) ---
app.post('/api/chat', async (req, res) => {
    const { prompt, lat, lng } = req.body; 
    if (!prompt) return res.status(400).json({ error: "Le prompt est requis" });

    try {
        const timeAtTana = getMadagascarTime();
        
        // On crée un contexte de localisation dynamique pour l'IA
        let locationContext = "L'utilisateur est à Antananarivo.";
        if (lat && lng) {
            locationContext = `L'utilisateur est situé à Lat: ${lat}, Lng: ${lng} (secteur Soarano/Ankorondrano). Ne lui demande pas sa position.`;
        }

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es Akaiky IA, experte médicale. ${locationContext} Heure locale: ${timeAtTana}. Donne des conseils honnêtes et fermes.`
                },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        res.json({ text: completion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Erreur Groq:", error);
        res.status(500).json({ error: "Erreur de communication avec l'IA" });
    }
});

// --- ROUTE 2 : RÉCUPÉRATION DES CATÉGORIES DE SANTÉ (BDD) ---
app.post('/api/locations/nearby', (req, res) => {
    const { lat, lng } = req.body; 
    if (!lat || !lng) return res.status(400).json({ error: "GPS non détecté" });

    // On récupère les mots-clés (Hôpital, CSB, etc.) définis dans ta BDD
    const sql = "SELECT name, type FROM locations ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL:", err);
            return res.status(500).json({ error: "Base de données inaccessible" });
        }
        res.json(results);
    });
});

/**
 * LANCEMENT DU SERVEUR
 */
app.listen(PORT, () => {
    console.log(`🚀 AKAÏKY BACKEND prêt sur le port ${PORT}`);
});