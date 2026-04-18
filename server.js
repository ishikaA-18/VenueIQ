const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

dotenv.config();

// Ensure the API key is provided on startup
if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not defined.");
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

/**
 * Configure Security and Efficiency Middlewares
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://www.googletagmanager.com", "https://cdn.jsdelivr.net"],
            frameSrc: ["'self'", "https://maps.google.com", "https://www.google.com"],
            imgSrc: ["'self'", "data:", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.googleapis.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net", "https://www.google-analytics.com"],
            frameworkSrc: ["'self'"]
        }
    }
}));
app.use(cors()); // Enable CORS
app.use(compression()); // Gzip compression
app.use(express.json());

// Set up rate limiting to prevent API abuse (max 100 requests per 15 minutes)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

// Serve frontend with detailed caching policies
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

/**
 * Health check endpoint for monitoring systems.
 * @route GET /health
 * @returns {object} Status object signaling server health
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/**
 * Chat endpoint handling interactions with the Gemini AI model.
 * 
 * @route POST /api/chat
 * @param {string} req.body.message - The incoming message queried by the user.
 * @returns {object} Response object containing the 'reply' text.
 */
app.post('/api/chat', apiLimiter, [
    // Validate and sanitize the input to prevent basic injection / malformed text
    body('message').trim().escape().notEmpty().withMessage('Message is required')
], async (req, res) => {

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const genAI = new GoogleGenerativeAI(apiKey);

        const { message } = req.body;
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
        // Proper error logging with timestamp
        console.error(`[${new Date().toISOString()}] AI Error:`, error.message);
        res.status(500).json({ error: 'Failed to communicate with AI Assistant.' });
    }
});

// Start the server if it's not being imported for Jest Testing
if (require.main === module) {
    app.listen(port, () => {
        console.info(`VenueIQ server running on port ${port}`);
    });
}

module.exports = app;
