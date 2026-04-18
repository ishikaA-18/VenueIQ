const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// The Gemini API will be initialized inside the route so it properly reads the env variable
app.post('/api/chat', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);

        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are the VenueIQ AI Assistant, a smart venue management system for a large sporting event. 
Respond to attendees with helpful, clear, and concise information. 

Current Venue Status:
- Crowd Levels: Moderate overall, high concentration near the Food Court and East Gate.
- Gate Statuses: VIP (North Gate) is open with fast entry. General gates (East, West, South) are open. East gate is busy.
- Wait Times: 5 mins at North Gate, 15 mins at West/South Gates, 25 mins at East Gate. Food stalls have a 10-min wait.

Instructions:
- Keep answers to 1-3 short sentences.
- Be proactive and suggest alternatives (e.g., if East Gate is busy, suggest West or South).
- Always maintain a professional, helpful, and welcoming tone.

User Question: ${message}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: 'Failed to communicate with AI Assistant.' });
    }
});

app.listen(port, () => {
    console.log(`VenueIQ server running on port ${port}`);
});
