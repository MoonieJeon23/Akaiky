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

// Middlewares
app.use(cors());
app.use(express.json());

// Services
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Connexion BDD (Pool de connexions pour plus de performance)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'akaiky_db',
    waitForConnections: true,
    connectionLimit: 10
});

/**
 * LOGIQUE MÉTIER / HELPERS
 */
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

// --- IA & CHAT ---
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Le prompt est requis" });

    try {
        const timeAtTana = getMadagascarTime();
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `Tu es Akaiky IA, experte de Madagascar. Localisation: Antananarivo. Heure: ${timeAtTana}.`
                },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        res.json({ text: completion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("[GROQ ERROR]", error.message);
        res.status(500).json({ error: "Erreur de communication avec l'IA" });
    }
});

// --- GEOLOCALISATION & LIEUX ---
app.get('/api/locations', (req, res) => {
    const sql = "SELECT * FROM locations";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Base de données inaccessible" });
        res.json(results);
    });
});

app.get('/api/nearby', (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Coordonnées manquantes" });

    const haversineQuery = `
        SELECT *, (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance 
        FROM locations 
        HAVING distance < 5 
        ORDER BY distance LIMIT 10`;

    db.query(haversineQuery, [lat, lng, lat], (err, results) => {
        if (err) return res.status(500).json({ error: "Erreur lors du calcul de proximité" });
        res.json(results);
    });
});

/**
 * BOOTSTRAP
 */
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════╗
    ║ 🚀 AKAÏKY BACKEND - OPÉRATIONNEL           ║
    ╠════════════════════════════════════════════╣
    ║ Port      : ${PORT}                             ║
    ║ IA        : Llama-3.3 (Groq)               ║
    ║ BDD       : MySQL (Pool actif)             ║
    ╚════════════════════════════════════════════╝
    `);
});