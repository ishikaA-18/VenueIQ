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
            { name: "Burger Stand (North)", waitTime: Math.floor(5 * capacityMultiplier), baseWait: 5 },
            { name: "Pizza Corner (East)", waitTime: Math.floor(15 * capacityMultiplier), baseWait: 15 },
            { name: "Drinks Bar (West)", waitTime: Math.floor(2 * capacityMultiplier), baseWait: 2 }
        ],
        restrooms: [
            { name: "North Restrooms", waitTime: Math.floor(1 * capacityMultiplier), baseWait: 1 },
            { name: "East Restrooms", waitTime: Math.floor(10 * capacityMultiplier), baseWait: 10 },
            { name: "West Restrooms", waitTime: Math.floor(3 * capacityMultiplier), baseWait: 3 }
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
        const config = eventConfigs[e.target.value];

        // Update the Graphical Center
        const iconEl = document.getElementById('center-icon');
        const textEl = document.getElementById('center-text');

        // Change the icon class (e.g., fa-futbol -> fa-microphone-lines)
        iconEl.className = `fas ${config.icon}`;
        textEl.innerText = config.label;

        // Update Transport Panel
        const transportContainer = document.getElementById('transport-status');
        transportContainer.innerHTML = config.transport
            .map(item => `<div class="transport-item">${item}</div>`)
            .join('');
    });
    // --- Simulation Logic ---

    // Update heatmap visuals
    function renderHeatmap() {
        for (const [zone, el] of Object.entries(zones)) {
            const status = currentData.zones[zone].congestion;
            el.style.fill = statusColors[status];
            if (status === 'high') {
                el.classList.add('zone-high-alert');
            } else {
                el.classList.remove('zone-high-alert');
            }
        }

        // Trigger emergency alert if any zone is high
        const overCrowded = Object.values(currentData.zones).some(z => z.congestion === 'high');
        if (overCrowded) {
            emergencyBanner.classList.remove('hidden');
        } else {
            emergencyBanner.classList.add('hidden');
        }
    }

    // Render lists
    function renderLists() {
        // Gates
        const gateList = document.getElementById('gate-waits');
        gateList.innerHTML = '';
        for (const [zone, data] of Object.entries(currentData.zones)) {
            gateList.innerHTML += `<li><span>${capitalize(zone)} Gate</span> <span>${data.waitTime} mins</span></li>`;
        }

        // Food
        const foodList = document.getElementById('food-waits');
        foodList.innerHTML = '';
        currentData.food.forEach(f => {
            foodList.innerHTML += `<li><span>${f.name}</span> <span>${f.waitTime} mins</span></li>`;
        });

        // Restrooms
        const restList = document.getElementById('restroom-waits');
        restList.innerHTML = '';
        currentData.restrooms.forEach(r => {
            restList.innerHTML += `<li><span>${r.name}</span> <span>${r.waitTime} mins</span></li>`;
        });
    }

    // Recommendation logic
    function updateRecommendation() {
        const ticketType = ticketSelect.value; // 'vip' or 'general'
        let best, alt;

        if (ticketType === 'vip') {
            // VIP defaults to North Gate
            best = 'north';
            // Find second best across others just for alternative info sake
            alt = 'east';
            if (currentData.zones.south.waitTime < currentData.zones.east.waitTime) alt = 'south';
            if (currentData.zones.west.waitTime < currentData.zones[alt].waitTime) alt = 'west';

            bestGateEl.innerText = "North Gate (VIP)";
            bestGateWaitEl.innerText = currentData.zones.north.waitTime + " mins";
            setStatusBadge(currentData.zones.north.congestion);
        } else {
            // General looks for the lowest wait out of South, East, West
            const candidates = ['south', 'east', 'west'];
            
            // sort to find best and alternative
            candidates.sort((a,b) => currentData.zones[a].waitTime - currentData.zones[b].waitTime);
            best = candidates[0];
            alt = candidates[1];

            bestGateEl.innerText = capitalize(best) + " Gate";
            bestGateWaitEl.innerText = currentData.zones[best].waitTime + " mins";
            setStatusBadge(currentData.zones[best].congestion);
        }

        // Update Alternative Gate
        const altNameEl = document.getElementById('alt-gate-name');
        const altWaitEl = document.getElementById('alt-gate-wait');
        if (altNameEl && altWaitEl) {
            altNameEl.innerText = capitalize(alt) + " Gate";
            altWaitEl.innerText = currentData.zones[alt].waitTime + " mins wait";
        }

        // Update Crowd Level Indicator Bar
        const allWaits = Object.values(currentData.zones).map(z => z.waitTime);
        const avgWait = allWaits.reduce((a,b) => a+b, 0) / allWaits.length;
        // let's say max average wait is ~130 mins for massive venues
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
    }

    function setStatusBadge(status) {
        gateStatusEl.className = 'status-badge ' + (status === 'low' ? 'optimal' : status === 'medium' ? 'moderate' : 'crowded');
        gateStatusEl.innerText = status === 'low' ? 'Optimal' : status === 'medium' ? 'Moderate' : 'Crowded';
    }

    // Helper
    const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

    // Initial render
    renderHeatmap();
    renderLists();
    updateRecommendation();
    document.getElementById('event-type').dispatchEvent(new Event('change'));

    // Event Listeners for UI
    ticketSelect.addEventListener('change', updateRecommendation);

    closeAlertBtn.addEventListener('click', () => {
        emergencyBanner.style.display = 'none'; // Temporarily hide it manually
    });

    // Simulate real-time updates every 10 seconds
    setInterval(() => {
        // Randomly fluctuate wait times slightly
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
            baseWait = baseWait + Math.floor(Math.random()*3) - 1;
            if (baseWait < 0) baseWait = 0;
            if (baseWait > 60) baseWait = 60;
            f.baseWait = baseWait;
            f.waitTime = Math.floor(baseWait * capacityMultiplier);
        });

        currentData.restrooms.forEach(r => {
            let baseWait = r.baseWait || (r.waitTime / capacityMultiplier) || 2;
            baseWait = baseWait + Math.floor(Math.random()*3) - 1;
            if (baseWait < 0) baseWait = 0;
            if (baseWait > 60) baseWait = 60;
            r.baseWait = baseWait;
            r.waitTime = Math.floor(baseWait * capacityMultiplier);
        });

        // Ensure East is often crowded to trigger the alert realistically for demo
        if (Math.random() > 0.7) {
            currentData.zones.east.baseWait = (currentData.zones.east.baseWait || 10) + 10;
            if (currentData.zones.east.baseWait > 60) currentData.zones.east.baseWait = 60;
            currentData.zones.east.waitTime = Math.floor(currentData.zones.east.baseWait * capacityMultiplier);
            currentData.zones.east.congestion = 'high';
        }

        renderHeatmap();
        renderLists();
        updateRecommendation();
    }, 10000);

    // --- Chat Logic ---

    async function handleChatSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Append User Message
        appendMessage(text, 'user');
        chatInput.value = '';

        // Bot loading
        const loadingId = appendMessage("...", 'bot');
        const loadingEl = document.getElementById(loadingId);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await res.json();

            if (data.error) {
                loadingEl.innerHTML = `<p style="color:red;">Error: ${data.error}</p>`;
            } else {
                loadingEl.innerHTML = `<p>${data.reply}</p>`;
            }
        } catch (err) {
            loadingEl.innerHTML = `<p style="color:red;">Failed to connect to assistant.</p>`;
        }

        scrollToBottom();
    }

    sendMsgBtn.addEventListener('click', handleChatSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSend();
    });

    function appendMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        const id = 'msg-' + Date.now();
        div.id = id;
        div.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(div);
        scrollToBottom();
        return id;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});
