# VenueIQ 🏟️
### AI-Powered Smart Venue Management System

> Built for PromptWars Virtual — Hack2skill × Google for Developers

---

## 🎯 The Problem

Large-scale sporting venues hosting 50,000–100,000+ spectators face critical challenges:

- **Crowd Movement** — Uncontrolled flow causes dangerous bottlenecks at entry and exit points
- **Waiting Times** — Long unpredictable queues at gates, food courts and restrooms frustrate attendees
- **Real-Time Coordination** — Staff and attendees lack live information to make smart decisions

### 💥 Real World Example
On June 11, 2023, Kolkata witnessed one of India's worst crowd management failures when fans gathered for a Lionel Messi match. Gates were crushed, thousands were stranded, and real-time coordination completely broke down.

**VenueIQ was built to solve exactly these problems.**

---

## 🚀 Live Demo

🌐 **[Launch VenueIQ](https://venueiq-998328333687.us-central1.run.app)**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🚪 Smart Entry Status | Recommends optimal gate based on ticket type and live crowd data |
| 🗺️ Live Crowd Heatmap | SVG stadium map with real-time color-coded density zones |
| ⏱️ Wait Time Predictions | Estimated wait times for gates, food courts and restrooms |
| 🤖 AI Assistant | Gemini 2.5 Flash-powered chat with venue-aware contextual responses |
| 🚨 Emergency Alerts | Live broadcast banner for critical crowd situations |
| 🚌 Post-Event Transport | Real-time transport availability after events |
| 🔐 Google Sign-In | Firebase Authentication for secure staff/admin access |
| 📍 Geographic Position | Live Google Maps embed centered on active venue |
| 📊 Real-Time Analytics | Firebase Analytics + GA4 tracking user interactions |

---

## ☁️ Advanced Google Cloud Integration

VenueIQ deeply integrates multiple Google Cloud and Firebase services:

| Service | Usage |
|---|---|
| **Google Cloud Run** | Serverless deployment with auto-scaling for event traffic spikes |
| **Google Gemini 2.5 Flash** | Venue-aware AI assistant with dynamic prompt engineering |
| **Google Maps JavaScript API** | Live geographic positioning of active venue |
| **Firebase Authentication** | Google Sign-In for secure venue staff access |
| **Firebase Firestore** | Real-time crowd status and gate data with live `onSnapshot` listeners |
| **Firebase Analytics** | User interaction tracking and engagement metrics |
| **Google Analytics 4 (GA4)** | Event-level analytics for crowd flow patterns |
| **Google Antigravity IDE** | Prompt-driven development environment |

---

## 🛠️ Tech Stack

- **Frontend** — HTML5, CSS3, Vanilla JavaScript (minified for production)
- **Backend** — Node.js + Express
- **AI** — Google Gemini 2.5 Flash (venue-aware dynamic prompting)
- **Database** — Firebase Firestore (real-time crowd telemetry)
- **Authentication** — Firebase Auth (Google Sign-In)
- **Analytics** — Firebase Analytics + Google Analytics 4
- **Maps** — Google Maps JavaScript API
- **Deployment** — Google Cloud Run (serverless, auto-scaling)
- **Security** — Helmet.js (CSP), Express-Rate-Limit, Express-Validator
- **Performance** — Gzip Compression, Asset Minification (JS/CSS)
- **Testing** — Jest (27/27 Test Cases Passed)
- **IDE** — Google Antigravity

---

## 🏗️ Project Structure
```
VenueIQ/
├── public/
│   ├── css/
│   │   ├── style.css
│   │   └── style.min.css   # Minified for production
│   ├── js/
│   │   ├── app.js
│   │   └── app.min.js     # Minified for production
│   │   └── firebase-config.js  # Firebase initialization & Auth
│   └── index.html
├── tests/                 # Automated test suite
│   └── server.test.js
├── server.js              # Secure Express backend
├── Dockerfile
└── package.json
```
---

## ⚙️ Local Setup

```bash
# Clone the repository
git clone https://github.com/ishikaA-18/VenueIQ

# Install dependencies
npm install

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start server
node server.js

# Build minified assets
npm run build

# Run tests
npm test

# Open browser
http://localhost:8080
```

---

## 🌍 Deployment

Deployed on **Google Cloud Run** for serverless, scalable hosting. The app auto-scales based on traffic — perfect for sudden spikes during major sporting events.

```bash
gcloud run deploy venueiq --source . --project active-axle-493508-f2 --region us-central1
```

---

## 🛡️ Engineering & Quality Standards

- **Hardened Security:** Strict Content Security Policy (CSP) via Helmet.js, rate-limiting (100 req/15min), and input validation/sanitization via Express-Validator
- **Production Performance:** Automated build scripts for JS/CSS minification and Gzip compression — significantly faster First Contentful Paint
- **Robust Testing:** 27 Jest tests across 9 describe blocks covering security headers, API validation, Gemini integration, rate limiting, HTTP methods, edge cases, and venue-specific queries
- **Accessibility (A11y):** ARIA-compliant interactive elements, semantic HTML roles, keyboard navigation, skip-to-content link, and screen-reader hints
- **Real-Time Data:** Firebase Firestore `onSnapshot` listeners push live crowd status updates to the UI without page refresh
- **Secure Authentication:** Firebase Google Sign-In allows venue staff to authenticate securely with their Google accounts

---

## 💡 Inspiration

This project was inspired by the **Messi-Kolkata fiasco** — a real crowd management disaster in Kolkata, India. As a student from Kolkata, this problem felt personal and urgent to solve.

---

## 👩‍💻 Built By

**Ishika Agarwal**  
Final Year Engineering Student  
Academy of Technology, Adisaptagram

Built using **Google Antigravity** through prompt-driven development for **PromptWars Virtual 2026**

---

## 📄 License

MIT License — feel free to use and build upon this!
