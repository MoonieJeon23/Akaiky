const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Groq = require('groq-sdk'); // On change l'import

const app = express();
app.use(cors());
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es Akaiky, une IA malgache. Réponds avec bienveillance et expertise locale."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile", // Modèle très puissant et gratuit
        });

        res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
    } catch (error) {
        console.error("Erreur Groq:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT} avec Groq 🚀`));