document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const ticketSelect = document.getElementById('ticket-type');
    const entryRecommendation = document.getElementById('entry-recommendation');
    const bestGateEl = document.getElementById('best-gate');
    const gateStatusEl = document.getElementById('gate-status');
    const bestGateWaitEl = document.getElementById('best-gate-wait');
    const emergencyBanner = document.getElementById('emergency-banner');
    const closeAlertBtn = document.getElementById('close-alert');

    // Chat Elements
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMsgBtn = document.getElementById('send-msg');

    // Heatmap Zones
    const zones = {
        north: document.getElementById('zone-north'), // VIP Gate usually here
        south: document.getElementById('zone-south'),
        east: document.getElementById('zone-east'),
        west: document.getElementById('zone-west'),
    };

    // State
    const capacityMultiplier = 2.5;
    let currentData = {
        zones: {
            north: { congestion: 'low', waitTime: Math.floor(5 * capacityMultiplier), baseWait: 5 },
            south: { congestion: 'medium', waitTime: Math.floor(12 * capacityMultiplier), baseWait: 12 },
            east: { congestion: 'high', waitTime: Math.floor(25 * capacityMultiplier), baseWait: 25 },
            west: { congestion: 'low', waitTime: Math.floor(8 * capacityMultiplier), baseWait: 8 }
        },
        food: [
            { id: "food-0", name: "Burger Stand (North)", waitTime: Math.floor(5 * capacityMultiplier), baseWait: 5 },
            { id: "food-1", name: "Pizza Corner (East)", waitTime: Math.floor(15 * capacityMultiplier), baseWait: 15 },
            { id: "food-2", name: "Drinks Bar (West)", waitTime: Math.floor(2 * capacityMultiplier), baseWait: 2 }
        ],
        restrooms: [
            { id: "rest-0", name: "North Restrooms", waitTime: Math.floor(1 * capacityMultiplier), baseWait: 1 },
            { id: "rest-1", name: "East Restrooms", waitTime: Math.floor(10 * capacityMultiplier), baseWait: 10 },
            { id: "rest-2", name: "West Restrooms", waitTime: Math.floor(3 * capacityMultiplier), baseWait: 3 }
        ]
    };

    // Colors mapping
    const statusColors = {
        low: 'var(--color-status-low)',
        medium: 'var(--color-status-medium)',
        high: 'var(--color-status-high)'
    };

    const eventConfigs = {
        stadium: {
            icon: "fa-futbol",
            label: "PITCH",
            transport: ["🚇 Metro Line 1: 🟢 Clear", "🚕 Yellow Cab Stand: 🟡 10m wait", "🛺 Auto Stand: 🟢 5m wait", "🚏 Bus Stop 42: 🔴 20m wait"]
        },
        arena: {
            icon: "fa-basketball-ball",
            label: "COURT",
            transport: ["🚇 Metro Line 3: 🟢 Clear", "🚕 Yellow Cab Stand: 🟡 15m wait", "🛺 Auto Stand: 🟢 2m wait", "🚏 Bus Stop B: 🟢 5m wait"]
        },
        speedway: {
            icon: "fa-flag-checkered",
            label: "TRACK",
            transport: ["🚌 Track Shuttle: 🔴 25m wait", "🚗 Highway Exit 4: 🟡 Heavy Traffic", "🚕 Rideshare Lot: 🟢 5m wait"]
        },
        cricket: {
            icon: "fa-baseball-ball",
            label: "OVAL",
            transport: ["🚇 Cricket Ground Stn: 🔴 30m wait", "🚕 Cab Rank: 🟡 20m wait", "🛺 Auto Stand: 🟢 5m wait"]
        },
        velodrome: {
            icon: "fa-bicycle",
            label: "CYCLING TRACK",
            transport: ["🚲 Bike Valet: 🟢 Clear", "🚇 Metro Line 1: 🟢 5m wait", "🚏 Bus Stop A: 🟡 15m wait"]
        },
        hippodrome: {
            icon: "fa-horse-head",
            label: "RACECOURSE",
            transport: ["🚕 Premium Cabs: 🟡 10m wait", "🚌 Shuttle Bus: 🟢 Boarding", "🚗 Valet Parking: 🟢 2m wait"]
        }
    };

    document.getElementById('event-type').addEventListener('change', (e) => {
        try {
            const config = eventConfigs[e.target.value];
            const iconEl = document.getElementById('center-icon');
            const textEl = document.getElementById('center-text');

            iconEl.className = `fas ${config.icon}`;
            textEl.innerText = config.label;

            const transportContainer = document.getElementById('transport-status');
            transportContainer.innerHTML = config.transport
                .map(item => `<div class="transport-item">${escapeHTML(item)}</div>`)
                .join('');
        } catch (error) {
            console.error("Error changing event type:", error);
        }
    });

    /**
     * Helper utility to safely escape HTML characters
     * @param {string} str Input string
     * @returns {string} Sanitized string
     */
    const escapeHTML = (str) => {
        const div = document.createElement('div');
        div.innerText = str;
        return div.innerHTML;
    };

    /**
     * Maps the status literal to the appropriate CSS class
     * @param {string} status The raw status ('low', 'medium', 'high')
     */
    function setStatusBadge(status) {
        gateStatusEl.className = 'status-badge ' + (status === 'low' ? 'optimal' : status === 'medium' ? 'moderate' : 'crowded');
        gateStatusEl.innerText = status === 'low' ? 'Optimal' : status === 'medium' ? 'Moderate' : 'Crowded';
    }

    /**
     * Capitalizes the first letter of a given string.
     * @param {string} s the input string
     * @returns {string} The capitalized string
     */
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    /**
     * Visually upates the SVG heatmap colors according to the live congestion data.
     */
    function renderHeatmap() {
        try {
            for (const [zone, el] of Object.entries(zones)) {
                if (!el) continue;
                const status = currentData.zones[zone].congestion;
                el.style.fill = statusColors[status];

                if (status === 'high') {
                    el.classList.add('zone-high-alert');
                } else {
                    el.classList.remove('zone-high-alert');
                }
            }

            const overCrowded = Object.values(currentData.zones).some(z => z.congestion === 'high');
            if (overCrowded) {
                emergencyBanner.classList.remove('hidden');
            } else {
                emergencyBanner.classList.add('hidden');
            }
        } catch (err) {
            console.error("Error rendering heatmap:", err);
        }
    }

    /**
     * Efficiently updates the UI Wait Lists dynamically avoiding full innerHTML re-renders.
     */
    function renderLists() {
        try {
            // Gates
            const gateList = document.getElementById('gate-waits');
            const gateNodes = gateList.children;
            const entries = Object.entries(currentData.zones);

            if (gateNodes.length === 0) {
                // Initial creation step
                gateList.innerHTML = entries.map(([zone, data]) =>
                    `<li id="gate-item-${zone}"><span>${capitalize(zone)} Gate</span> <span class="wait-val">${data.waitTime} mins</span></li>`
                ).join('');
            } else {
                // Incremental DOM update avoiding layout reflows
                entries.forEach(([zone, data]) => {
                    const el = document.querySelector(`#gate-item-${zone} .wait-val`);
                    if (el && el.innerText !== `${data.waitTime} mins`) {
                        el.innerText = `${data.waitTime} mins`;
                    }
                });
            }

            // Food
            const foodList = document.getElementById('food-waits');
            if (foodList.children.length === 0) {
                foodList.innerHTML = currentData.food.map(f =>
                    `<li id="${f.id}"><span>${escapeHTML(f.name)}</span> <span class="wait-val">${f.waitTime} mins</span></li>`
                ).join('');
            } else {
                currentData.food.forEach(f => {
                    const el = document.querySelector(`#${f.id} .wait-val`);
                    if (el && el.innerText !== `${f.waitTime} mins`) el.innerText = `${f.waitTime} mins`;
                });
            }

            // Restrooms
            const restList = document.getElementById('restroom-waits');
            if (restList.children.length === 0) {
                restList.innerHTML = currentData.restrooms.map(r =>
                    `<li id="${r.id}"><span>${escapeHTML(r.name)}</span> <span class="wait-val">${r.waitTime} mins</span></li>`
                ).join('');
            } else {
                currentData.restrooms.forEach(r => {
                    const el = document.querySelector(`#${r.id} .wait-val`);
                    if (el && el.innerText !== `${r.waitTime} mins`) el.innerText = `${r.waitTime} mins`;
                });
            }
        } catch (err) {
            console.error("Error rendering lists:", err);
        }
    }

    /**
     * Evaluates logical states to propose the best gate and alternative gates.
     */
    function updateRecommendation() {
        try {
            const ticketType = ticketSelect.value;
            let best, alt;

            if (ticketType === 'vip') {
                best = 'north';
                alt = 'east';
                if (currentData.zones.south.waitTime < currentData.zones.east.waitTime) alt = 'south';
                if (currentData.zones.west.waitTime < currentData.zones[alt].waitTime) alt = 'west';

                bestGateEl.innerText = "North Gate (VIP)";
                bestGateWaitEl.innerText = currentData.zones.north.waitTime + " mins";
                setStatusBadge(currentData.zones.north.congestion);
            } else {
                const candidates = ['south', 'east', 'west'];
                candidates.sort((a, b) => currentData.zones[a].waitTime - currentData.zones[b].waitTime);
                best = candidates[0];
                alt = candidates[1];

                bestGateEl.innerText = capitalize(best) + " Gate";
                bestGateWaitEl.innerText = currentData.zones[best].waitTime + " mins";
                setStatusBadge(currentData.zones[best].congestion);
            }

            const altNameEl = document.getElementById('alt-gate-name');
            const altWaitEl = document.getElementById('alt-gate-wait');
            if (altNameEl && altWaitEl) {
                altNameEl.innerText = capitalize(alt) + " Gate";
                altWaitEl.innerText = currentData.zones[alt].waitTime + " mins wait";
            }

            // Crowd Bar Generation
            const allWaits = Object.values(currentData.zones).map(z => z.waitTime);
            const avgWait = allWaits.reduce((a, b) => a + b, 0) / allWaits.length;

            let percentage = (avgWait / 130) * 100;
            if (percentage > 100) percentage = 100;

            const barEl = document.getElementById('crowd-level-bar');
            const textEl = document.getElementById('crowd-level-text');

            if (barEl && textEl) {
                barEl.style.width = percentage + "%";
                if (avgWait < 35) {
                    barEl.style.backgroundColor = "var(--color-status-low)";
                    textEl.innerText = "Light";
                } else if (avgWait < 75) {
                    barEl.style.backgroundColor = "var(--color-status-medium)";
                    textEl.innerText = "Moderate";
                } else {
                    barEl.style.backgroundColor = "var(--color-status-high)";
                    textEl.innerText = "Heavy";
                }
            }
        } catch (err) {
            console.error("Error updating recommendation", err);
        }
    }

    // Initialize application values
    renderHeatmap();
    renderLists();
    updateRecommendation();
    document.getElementById('event-type').dispatchEvent(new Event('change'));

    // Attach Event Listeners
    ticketSelect.addEventListener('change', updateRecommendation);

    closeAlertBtn.addEventListener('click', () => {
        emergencyBanner.style.display = 'none';
    });

    /**
     * Simulator interval generating real-time data adjustments periodically
     */
    setInterval(() => {
        try {
            Object.keys(currentData.zones).forEach(zone => {
                let baseWait = currentData.zones[zone].baseWait || (currentData.zones[zone].waitTime / capacityMultiplier) || 10;
                baseWait = baseWait + Math.floor(Math.random() * 5) - 2;
                if (baseWait < 0) baseWait = 0;
                if (baseWait > 60) baseWait = 60;
                currentData.zones[zone].baseWait = baseWait;

                let wait = Math.floor(baseWait * capacityMultiplier);
                currentData.zones[zone].waitTime = wait;

                if (wait < 35) currentData.zones[zone].congestion = 'low';
                else if (wait < 75) currentData.zones[zone].congestion = 'medium';
                else currentData.zones[zone].congestion = 'high';
            });

            currentData.food.forEach(f => {
                let baseWait = f.baseWait || (f.waitTime / capacityMultiplier) || 5;
                baseWait = baseWait + Math.floor(Math.random() * 3) - 1;
                if (baseWait < 0) baseWait = 0;
                if (baseWait > 60) baseWait = 60;
                f.baseWait = baseWait;
                f.waitTime = Math.floor(baseWait * capacityMultiplier);
            });

            currentData.restrooms.forEach(r => {
                let baseWait = r.baseWait || (r.waitTime / capacityMultiplier) || 2;
                baseWait = baseWait + Math.floor(Math.random() * 3) - 1;
                if (baseWait < 0) baseWait = 0;
                if (baseWait > 60) baseWait = 60;
                r.baseWait = baseWait;
                r.waitTime = Math.floor(baseWait * capacityMultiplier);
            });

            if (Math.random() > 0.7) {
                currentData.zones.east.baseWait = (currentData.zones.east.baseWait || 10) + 10;
                if (currentData.zones.east.baseWait > 60) currentData.zones.east.baseWait = 60;
                currentData.zones.east.waitTime = Math.floor(currentData.zones.east.baseWait * capacityMultiplier);
                currentData.zones.east.congestion = 'high';
            }

            renderHeatmap();
            renderLists();
            updateRecommendation();
        } catch (err) {
            console.error("Simulation Interval Error:", err);
        }
    }, 10000);

    // --- Chat Logic ---

    /**
     * Executes logic to resolve requests to AI Agent via API
     */
    async function handleChatSend() {
        const rawText = chatInput.value.trim();
        if (!rawText) return;

        const cleanText = escapeHTML(rawText);

        appendMessage(cleanText, 'user');
        chatInput.value = '';

        const loadingId = appendMessage("...", 'bot');
        const loadingEl = document.getElementById(loadingId);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: rawText, venue: document.getElementById('event-type').value })
            });
            const data = await res.json();

            if (data.error) {
                loadingEl.innerHTML = `<p style="color:red;">Error: ${escapeHTML(data.error)}</p>`;
            } else {
                // Ensure output from Assistant is safe to inject directly into DOM
                loadingEl.innerHTML = `<p>${escapeHTML(data.reply)}</p>`;
            }
        } catch (err) {
            console.error("Chat Error:", err);
            loadingEl.innerHTML = `<p style="color:red;">Failed to connect to assistant.</p>`;
        }

        scrollToBottom();
    }

    sendMsgBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    /**
     * Handles creating and appending message bubbles.
     * @param {string} text Message payload
     * @param {string} sender "user" or "bot" 
     * @returns {string} Tracking ID for bubble element
     */
    function appendMessage(text, sender) {
        try {
            const div = document.createElement('div');
            div.className = `message ${sender}`;
            const id = 'msg-' + Date.now();
            div.id = id;
            div.innerHTML = `<p>${text}</p>`; // Assumed caller has escaped via escapeHTML
            chatMessages.appendChild(div);
            scrollToBottom();
            return id;
        } catch (err) {
            console.error("Error appending message:", err);
            return null;
        }
    }

    /**
     * Enforces the chat frame's tracking follows latest text bubbles inserted to the bottom.
     */
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
