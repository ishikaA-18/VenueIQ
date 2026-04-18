# VenueIQ 🏟️
### AI-Powered Smart Venue Management System

> Built for PromptWars Virtual — Hack2skill × Google for Developers

---

## 🎯 The Problem

Large-scale sporting venues hosting 50,000–100,000+ 
spectators face critical challenges:

- **Crowd Movement** — Uncontrolled flow causes 
  dangerous bottlenecks at entry and exit points
- **Waiting Times** — Long unpredictable queues at 
  gates, food courts and restrooms frustrate attendees  
- **Real-Time Coordination** — Staff and attendees 
  lack live information to make smart decisions

### 💥 Real World Example
On June 11, 2023, Kolkata witnessed one of India's 
worst crowd management failures when fans gathered 
for a Lionel Messi match. Gates were crushed, 
thousands were stranded, and real-time coordination 
completely broke down.

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
| 🤖 AI Assistant | Gemini-powered chat for real-time venue queries |
| 🚨 Emergency Alerts | Live broadcast banner for critical crowd situations |
| 🚌 Post-Event Transport | Real-time transport availability after events |

---

## 🛠️ Tech Stack

- **Frontend** — HTML5, CSS3, Vanilla JavaScript
- **Backend** — Node.js + Express
- **AI** — Google Gemini 1.5 Flash (via Google AI Studio)
- **Deployment** — Google Cloud Run
- **Containerization** — Docker
- **IDE** — Google Antigravity

---

## 🏗️ Project Structure
VenueIQ/
├── public/
│   ├── css/style.css      # Command Center dark theme
│   ├── js/app.js          # Frontend logic
│   └── index.html         # Main dashboard
├── server.js              # Express + Gemini API routes
├── .env                   # Environment variables (not pushed)
├── .gitignore             # Git exclusions
├── Dockerfile             # Container configuration
└── package.json           # Dependencies
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

# Open browser
http://localhost:8080
```

---

## 🌍 Deployment

Deployed on **Google Cloud Run** for serverless, 
scalable hosting. The app auto-scales based on 
traffic — perfect for sudden spikes during major 
sporting events.

---

## 💡 Inspiration

This project was inspired by the **Messi-Kolkata 
fiasco** — a real crowd management disaster in 
Kolkata, India. As a student from Kolkata, this 
problem felt personal and urgent to solve.

---

## 👩‍💻 Built By

**Ishika Agarwal**
Third Year Engineering Student
Academy of Technology, Adisaptagram

Built using **Google Antigravity** through 
prompt-driven development for 
**PromptWars Virtual 2026**

---

## 📄 License

MIT License — feel free to use and build upon this!
