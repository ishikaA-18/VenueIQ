'use strict';

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

if (!process.env.GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY environment variable is not defined.");
    process.exit(1);
}

const app = express();
const port = process.env.PORT || 8080;

/**
 * @typedef {Object} VenueInfo
 * @property {string} name - Human-readable venue name
 * @property {string} transport - Primary transport option with wait time
 * @property {string} alt - Alternative transport option with wait time
 */

/**
 * Venue configuration map keyed by dropdown value.
 * Each entry provides transport context injected into the Gemini prompt.
 * @type {Object.<string, VenueInfo>}
 */
const VENUE_DATA = {
    stadium: { name: "Outdoor Stadium", transport: "Metro Line 1 (Clear, 5m wait)", alt: "Yellow Cab Stand (10m wait)" },
    arena: { name: "Indoor Arena", transport: "Bus Stop 42 (20m wait)", alt: "Auto Stand (5m wait)" },
    speedway: { name: "Motorsport Speedway", transport: "Shuttle Bus (15m wait)", alt: "Yellow Cab Stand (10m wait)" },
    cricket: { name: "Cricket Ground", transport: "Cricket Ground Stn (30m wait)", alt: "Auto Stand (5m wait) — recommended" },
    velodrome: { name: "Cycling Velodrome", transport: "Metro Line 2 (Clear, 8m wait)", alt: "Bus Stop 12 (15m wait)" },
    hippodrome: { name: "Hippodrome", transport: "Yellow Cab Stand (10m wait)", alt: "Bus Stop 7 (20m wait)" }
};

/**
 * Builds a venue-aware prompt string for the Gemini AI model.
 * Injects real-time venue context so the AI responds accurately
 * based on which venue the user is currently viewing.
 *
 * @param {string} message - The sanitized user question
 * @param {VenueInfo} venue - The active venue object from VENUE_DATA
 * @returns {string} Fully constructed prompt string ready for Gemini
 */
function buildPrompt(message, venue) {
    return `You are the VenueIQ AI Assistant, a smart venue management system for a large sporting event.
Respond to attendees with helpful, clear, and concise information.

ACTIVE VENUE: ${venue.name}

Current Venue Status:
- Crowd Levels: Moderate overall, high concentration near the Food Court and East Gate.
- Gate Statuses: VIP (North Gate) is open with fast entry. General gates (East, West, South) are open. East gate is busy.
- Wait Times: 5 mins at North Gate, 15 mins at West/South Gates, 25 mins at East Gate. Food stalls have a 10-min wait.
- Primary Transport: ${venue.transport}
- Alternative Transport: ${venue.alt}

Instructions:
- Keep answers to 1-3 short sentences.
- ONLY reference transport options for the ACTIVE VENUE above.
- Be proactive and suggest alternatives when primary options are busy.
- Always maintain a professional, helpful, and welcoming tone.

User Question: ${message}`;
}

/**
 * Configures and returns the Express app with all middleware and routes.
 * Separated from server startup to allow clean Jest test imports.
 *
 * Middleware stack (in order):
 * 1. helmet  — secure HTTP headers with custom CSP
 * 2. cors    — cross-origin resource sharing
 * 3. compression — gzip response compression
 * 4. express.json — JSON body parsing
 * 5. express.static — frontend static file serving with 1-day cache
 */
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'",
                "'unsafe-inline'",
                "https://maps.googleapis.com",
                "https://www.googletagmanager.com",
                "https://cdn.jsdelivr.net",
                "https://www.gstatic.com"
            ],
            frameSrc: [
                "'self'",
                "https://maps.google.com",
                "https://www.google.com"
            ],
            imgSrc: [
                "'self'",
                "data:",
                "https://maps.googleapis.com",
                "https://maps.gstatic.com",
                "https://*.googleapis.com",
                "https://www.gstatic.com"            // Added for Firebase/GA images
            ],
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com"
            ],
            connectSrc: [
                "'self'",
                "https://cdn.jsdelivr.net",
                "https://www.google-analytics.com",
                "https://*.googleapis.com",          // REQUIRED: For Firebase/Maps APIs
                "https://*.firebaseio.com",           // REQUIRED: For Firebase backend
                "https://*.analytics.google.com",    // REQUIRED: For GA4 data flow
                "https://www.gstatic.com"
            ]
        }
    }
}));
app.use(cors());
app.use(compression());
app.use(express.json());

/**
 * Rate limiter middleware for API routes.
 * Prevents abuse by capping requests at 100 per 15-minute window per IP.
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));
app.get('/favicon.ico', (req, res) => res.status(204).end());
/**
 * Health check endpoint for uptime monitoring and Cloud Run readiness probes.
 *
 * @route GET /health
 * @returns {200} JSON object with status 'ok' and server uptime in seconds
 */
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

/**
 * AI chat endpoint — processes user queries through the Gemini 2.5 Flash model.
 * Validates and sanitizes input before constructing a venue-aware prompt.
 * Falls back to stadium context if no venue is specified.
 *
 * @route POST /api/chat
 * @param {string} req.body.message - User question (required, non-empty)
 * @param {string} [req.body.venue] - Active venue key from the frontend dropdown
 * @returns {200} { reply: string } — AI-generated response
 * @returns {400} { error: string } — Validation failure
 * @returns {500} { error: string } — Gemini API failure
 */
app.post('/api/chat', apiLimiter, [
    body('message').trim().escape().notEmpty().withMessage('Message is required')
], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    try {
        const { message, venue } = req.body;
        const activeVenue = VENUE_DATA[venue] || VENUE_DATA['stadium'];
        const prompt = buildPrompt(message, activeVenue);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        res.json({ reply: text });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] AI Error:`, error.message);
        res.status(500).json({ error: 'Failed to communicate with AI Assistant.' });
    }
});

if (require.main === module) {
    app.listen(port, () => {
        console.info(`VenueIQ server running on port ${port}`);
    });
}

module.exports = app;