/* ═══════════════════════════════════════════════════════════════
   TRINETRA TECH - Dashboard Application
   AI-Powered Occupational Health & Safety System
   ═══════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
// Configuration & Constants
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
    updateInterval: 3000,
    alertInterval: 8000,
    heartRateMin: 65,
    heartRateMax: 95,
    spo2Min: 95,
    spo2Max: 100,
    bodyTempMin: 36.2,
    bodyTempMax: 37.5,
    aqiMin: 50,
    aqiMax: 150,
    smokeMin: 5,
    smokeMax: 30,
    gasMin: 2,
    gasMax: 20,
    ambientTempMin: 28,
    ambientTempMax: 38,
    humidityMin: 55,
    humidityMax: 80
};

const ALERT_TYPES = [
    { type: 'FALL DETECTED', level: 'critical', icon: 'fall', details: ['Zone A-1', 'Zone B-2', 'Zone C-3', 'Zone D-4'] },
    { type: 'NO HELMET', level: 'warning', icon: 'helmet', details: ['Entry Gate', 'Exit Gate', 'Zone A-1', 'Zone B-2'] },
    { type: 'HIGH GAS LEVEL', level: 'critical', icon: 'gas', details: ['CO: 45ppm', 'CO: 52ppm', 'CO: 38ppm'] },
    { type: 'HEAT STRESS', level: 'warning', icon: 'temp', details: ['Temp: 38.2°C', 'Temp: 38.5°C', 'Temp: 37.9°C'] },
    { type: 'UNAUTHORIZED ACCESS', level: 'warning', icon: 'access', details: ['Entry Gate 1', 'Entry Gate 2', 'Entry Gate 3'] },
    { type: 'LOW SpO2', level: 'critical', icon: 'spo2', details: ['SpO2: 91%', 'SpO2: 92%', 'SpO2: 90%'] },
    { type: 'HIGH HEART RATE', level: 'warning', icon: 'heart', details: ['HR: 115 BPM', 'HR: 120 BPM', 'HR: 108 BPM'] }
];

const WORKERS = [
    { name: 'Rajesh Kumar', id: 'TT-2024-0847', initials: 'RK' },
    { name: 'Amit Patel', id: 'TT-2024-0156', initials: 'AP' },
    { name: 'Suresh Kumar', id: 'TT-2024-0312', initials: 'SK' },
    { name: 'Vijay Reddy', id: 'TT-2024-0523', initials: 'VR' },
    { name: 'Pradeep Singh', id: 'TT-2024-0678', initials: 'PS' },
    { name: 'Mohammed Ali', id: 'TT-2024-0234', initials: 'MA' },
    { name: 'Rahul Sharma', id: 'TT-2024-0891', initials: 'RS' },
    { name: 'Deepak Verma', id: 'TT-2024-0445', initials: 'DV' }
];

// ═══════════════════════════════════════════════════════════════
// State Management
// ═══════════════════════════════════════════════════════════════

const state = {
    heartRateHistory: [],
    alertCount: { critical: 3, warning: 5 },
    scanHistory: [],
    lastScanTime: Date.now()
};

// ═══════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(randomInRange(min, max + 1));
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour12: false });
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
}

// ═══════════════════════════════════════════════════════════════
// DateTime Updates
// ═══════════════════════════════════════════════════════════════

function updateDateTime() {
    const now = new Date();
    document.getElementById('current-time').textContent = formatTime(now);
    document.getElementById('current-date').textContent = formatDate(now);
}

// ═══════════════════════════════════════════════════════════════
// Telemetry Updates
// ═══════════════════════════════════════════════════════════════

function updateTelemetry() {
    // Heart Rate
    const heartRate = randomInt(CONFIG.heartRateMin, CONFIG.heartRateMax);
    const heartRateEl = document.getElementById('heart-rate');
    heartRateEl.textContent = heartRate;
    state.heartRateHistory.push(heartRate);
    if (state.heartRateHistory.length > 20) state.heartRateHistory.shift();
    drawHeartChart();
    
    // SpO2
    const spo2 = randomInt(CONFIG.spo2Min, CONFIG.spo2Max);
    document.getElementById('spo2').textContent = spo2;
    updateSpo2Ring(spo2);
    
    // Body Temperature
    const bodyTemp = randomInRange(CONFIG.bodyTempMin, CONFIG.bodyTempMax).toFixed(1);
    document.getElementById('body-temp').textContent = bodyTemp;
    updateTempGauge(parseFloat(bodyTemp));
    
    // Steps & Distance
    const currentSteps = parseInt(document.getElementById('steps').textContent.replace(',', ''));
    const newSteps = currentSteps + randomInt(5, 25);
    document.getElementById('steps').textContent = newSteps.toLocaleString();
    document.getElementById('distance').textContent = (newSteps / 1500).toFixed(1) + 'km';
    
    // Update scan time
    document.getElementById('scan-time').textContent = getTimeAgo(state.lastScanTime);
}

function drawHeartChart() {
    const canvas = document.getElementById('heartCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.parentElement.offsetWidth;
    const height = 40;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (state.heartRateHistory.length < 2) return;
    
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
    
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    
    const step = width / (state.heartRateHistory.length - 1);
    const minVal = Math.min(...state.heartRateHistory);
    const maxVal = Math.max(...state.heartRateHistory);
    const range = maxVal - minVal || 1;
    
    state.heartRateHistory.forEach((val, i) => {
        const x = i * step;
        const y = height - ((val - minVal) / range) * (height - 10) - 5;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Glow effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.stroke();
}

function updateSpo2Ring(value) {
    const ring = document.getElementById('spo2-ring');
    if (!ring) return;
    
    const circumference = 283; // 2 * PI * 45
    const offset = circumference - (value / 100) * circumference;
    ring.style.strokeDashoffset = offset;
}

function updateTempGauge(temp) {
    const gauge = document.querySelector('.gauge-fill');
    if (!gauge) return;
    
    // Map temperature (34-40) to percentage (0-100)
    const percentage = ((temp - 34) / 6) * 100;
    gauge.style.height = Math.min(100, Math.max(0, percentage)) + '%';
    
    // Update color based on temperature
    if (temp > 38) {
        gauge.style.background = 'linear-gradient(to top, var(--amber), var(--red))';
    } else if (temp > 37.5) {
        gauge.style.background = 'linear-gradient(to top, var(--green), var(--amber))';
    } else {
        gauge.style.background = 'linear-gradient(to top, var(--cyan), var(--green))';
    }
}

// ═══════════════════════════════════════════════════════════════
// Environment Updates
// ═══════════════════════════════════════════════════════════════

function updateEnvironment() {
    // AQI
    const aqi = randomInt(CONFIG.aqiMin, CONFIG.aqiMax);
    document.getElementById('aqi').textContent = aqi;
    updateEnvStatus('aqi', aqi, [0, 50, 100, 150, 200]);
    
    // Smoke
    const smoke = randomInt(CONFIG.smokeMin, CONFIG.smokeMax);
    document.getElementById('smoke').innerHTML = smoke + '<small>ppm</small>';
    updateEnvBar('.env-card:nth-child(2) .bar-fill', smoke, 100);
    
    // Gas
    const gas = randomInt(CONFIG.gasMin, CONFIG.gasMax);
    document.getElementById('gas').innerHTML = gas + '<small>ppm</small>';
    updateEnvBar('.env-card:nth-child(3) .bar-fill', gas, 100);
    
    // Ambient Temperature
    const ambientTemp = randomInt(CONFIG.ambientTempMin, CONFIG.ambientTempMax);
    document.getElementById('ambient-temp').innerHTML = ambientTemp + '<small>°C</small>';
    updateEnvBar('.env-card:nth-child(4) .bar-fill', (ambientTemp - 20) / 30 * 100, 100);
    
    // Humidity
    const humidity = randomInt(CONFIG.humidityMin, CONFIG.humidityMax);
    document.getElementById('humidity').innerHTML = humidity + '<small>%</small>';
    updateEnvBar('.env-card:nth-child(5) .bar-fill', humidity, 100);
    
    // Update hazard status based on readings
    updateHazardStatus(aqi, smoke, gas, ambientTemp);
}

function updateEnvStatus(type, value, thresholds) {
    const cards = document.querySelectorAll('.env-card');
    // Logic for status updates can be expanded here
}

function updateEnvBar(selector, value, max) {
    const bar = document.querySelector(selector);
    if (bar) {
        bar.style.width = Math.min(100, (value / max) * 100) + '%';
    }
}

function updateHazardStatus(aqi, smoke, gas, temp) {
    const hazardEl = document.getElementById('hazard-status');
    const hazardLevelEl = document.getElementById('hazard-level');
    const meterFill = document.querySelector('.meter-fill');
    
    let hazardLevel = 0;
    
    // Calculate hazard level based on readings
    if (aqi > 100) hazardLevel += 25;
    if (smoke > 20) hazardLevel += 25;
    if (gas > 15) hazardLevel += 30;
    if (temp > 35) hazardLevel += 20;
    
    let status, levelClass;
    
    if (hazardLevel < 25) {
        status = 'LOW RISK';
        levelClass = 'level-normal';
        hazardEl.style.color = 'var(--green)';
    } else if (hazardLevel < 50) {
        status = 'MODERATE';
        levelClass = 'level-moderate';
        hazardEl.style.color = 'var(--amber)';
    } else {
        status = 'HIGH RISK';
        levelClass = 'level-critical';
        hazardEl.style.color = 'var(--red)';
    }
    
    if (hazardEl) hazardEl.textContent = status;
    if (hazardLevelEl) {
        hazardLevelEl.textContent = status;
        hazardLevelEl.className = 'kpi-value ' + levelClass;
    }
    if (meterFill) meterFill.style.width = hazardLevel + '%';
}

// ═══════════════════════════════════════════════════════════════
// Alert System
// ═══════════════════════════════════════════════════════════════

function generateAlert() {
    const alertType = ALERT_TYPES[randomInt(0, ALERT_TYPES.length - 1)];
    const worker = WORKERS[randomInt(0, WORKERS.length - 1)];
    const detail = alertType.details[randomInt(0, alertType.details.length - 1)];
    
    const alert = {
        type: alertType.type,
        level: alertType.level,
        details: `Worker ID: ${worker.id} | ${detail}`,
        time: Date.now()
    };
    
    addAlertToFeed(alert);
    updateAlertCounts(alertType.level);
}

function addAlertToFeed(alert) {
    const feed = document.getElementById('alert-feed');
    if (!feed) return;
    
    const alertEl = document.createElement('div');
    alertEl.className = `alert-item ${alert.level} animate-in`;
    alertEl.innerHTML = `
        <div class="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        </div>
        <div class="alert-content">
            <span class="alert-type">${alert.type}</span>
            <span class="alert-details">${alert.details}</span>
        </div>
        <span class="alert-time">Just now</span>
    `;
    
    feed.insertBefore(alertEl, feed.firstChild);
    
    // Remove old alerts to prevent overflow
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
    
    // Update existing alert times
    updateAlertTimes();
}

function updateAlertTimes() {
    const alerts = document.querySelectorAll('.alert-item');
    alerts.forEach((alert, index) => {
        const timeEl = alert.querySelector('.alert-time');
        if (timeEl && index > 0) {
            const minutes = index * 2 + randomInt(1, 3);
            timeEl.textContent = `${minutes} min ago`;
        }
    });
}

function updateAlertCounts(level) {
    if (level === 'critical') {
        state.alertCount.critical++;
    } else {
        state.alertCount.warning++;
    }
    
    document.getElementById('critical-count').textContent = state.alertCount.critical;
    document.getElementById('warning-count').textContent = state.alertCount.warning;
    document.getElementById('total-alerts').textContent = state.alertCount.critical + state.alertCount.warning;
}

// ═══════════════════════════════════════════════════════════════
// PPE Monitoring
// ═══════════════════════════════════════════════════════════════

function simulatePPEScan() {
    const worker = WORKERS[randomInt(0, WORKERS.length - 1)];
    const isGranted = Math.random() > 0.15; // 85% success rate
    
    // Update latest scan
    document.getElementById('worker-name').textContent = worker.name;
    document.querySelector('.worker-id').textContent = `ID: ${worker.id}`;
    
    const rfidStatus = document.getElementById('rfid-status');
    const helmetDetection = document.getElementById('helmet-detection');
    const accessDecision = document.getElementById('access-decision');
    const detectionBadge = document.querySelector('.detection-badge');
    
    if (isGranted) {
        rfidStatus.textContent = 'VERIFIED';
        rfidStatus.className = 'detail-value active';
        helmetDetection.textContent = 'DETECTED';
        helmetDetection.className = 'detail-value positive';
        accessDecision.textContent = 'GRANTED';
        accessDecision.className = 'detail-value granted';
        detectionBadge.className = 'detection-badge granted';
        detectionBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else {
        rfidStatus.textContent = 'VERIFIED';
        rfidStatus.className = 'detail-value active';
        helmetDetection.textContent = 'NOT DETECTED';
        helmetDetection.className = 'detail-value denied';
        accessDecision.textContent = 'DENIED';
        accessDecision.className = 'detail-value denied';
        detectionBadge.className = 'detection-badge denied';
        detectionBadge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    }
    
    state.lastScanTime = Date.now();
    document.getElementById('scan-time').textContent = 'Just now';
    
    // Add to history
    addToScanHistory(worker, isGranted);
}

function addToScanHistory(worker, isGranted) {
    const historyList = document.getElementById('ppe-history');
    if (!historyList) return;
    
    const historyItem = document.createElement('div');
    historyItem.className = `history-item ${isGranted ? 'granted' : 'denied'}`;
    historyItem.innerHTML = `
        <div class="history-avatar">${worker.initials}</div>
        <div class="history-info">
            <span class="history-name">${worker.name}</span>
            <span class="history-time">${formatTime(new Date())}</span>
        </div>
        <div class="history-status">${isGranted ? '✓' : '✗'}</div>
    `;
    
    historyList.insertBefore(historyItem, historyList.firstChild);
    
    // Keep only last 4 items
    while (historyList.children.length > 4) {
        historyList.removeChild(historyList.lastChild);
    }
}

// ═══════════════════════════════════════════════════════════════
// Node Status
// ═══════════════════════════════════════════════════════════════

function updateNodeStatus() {
    const nodes = document.querySelectorAll('.node-card');
    
    nodes.forEach(node => {
        // Randomly update latency
        const metricsSpan = node.querySelector('.node-metrics span:first-child strong');
        if (metricsSpan && metricsSpan.textContent.includes('ms')) {
            metricsSpan.textContent = randomInt(5, 25) + 'ms';
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// KPI Updates
// ═══════════════════════════════════════════════════════════════

function updateKPIs() {
    // Active workers (fluctuate slightly)
    const currentWorkers = parseInt(document.getElementById('active-workers').textContent);
    const change = randomInt(-2, 2);
    const newWorkers = Math.max(40, Math.min(55, currentWorkers + change));
    document.getElementById('active-workers').textContent = newWorkers;
    
    // Helmet compliance
    const compliance = randomInt(90, 98);
    document.getElementById('helmet-compliance').innerHTML = compliance + '<small>%</small>';
    document.querySelector('.progress-bar').style.width = compliance + '%';
}

// ═══════════════════════════════════════════════════════════════
// Emergency System
// ═══════════════════════════════════════════════════════════════

function initEmergencyButton() {
    const emergencyBtn = document.getElementById('emergency-btn');
    if (!emergencyBtn) return;
    
    let isEmergency = false;
    
    emergencyBtn.addEventListener('click', () => {
        isEmergency = !isEmergency;
        
        const statusEl = document.getElementById('worker-emergency');
        const emergencyStatusEl = document.getElementById('emergency-status');
        const emergencyIndicator = document.querySelector('.emergency-indicator span:last-child');
        const kpiCard = document.querySelector('.kpi-card.emergency');
        
        if (isEmergency) {
            statusEl.textContent = 'ACTIVE';
            statusEl.style.color = 'var(--red)';
            emergencyStatusEl.textContent = 'ALERT';
            emergencyStatusEl.className = 'kpi-value';
            emergencyStatusEl.style.color = 'var(--red)';
            emergencyIndicator.textContent = 'Emergency Response Activated';
            emergencyIndicator.style.color = 'var(--red)';
            kpiCard.style.borderColor = 'var(--red)';
            kpiCard.style.background = 'rgba(255, 68, 68, 0.1)';
            
            // Add critical alert
            addAlertToFeed({
                type: 'EMERGENCY SOS',
                level: 'critical',
                details: 'Manual emergency triggered | All zones',
                time: Date.now()
            });
        } else {
            statusEl.textContent = 'STANDBY';
            statusEl.style.color = 'var(--green)';
            emergencyStatusEl.textContent = 'NORMAL';
            emergencyStatusEl.className = 'kpi-value status-normal';
            emergencyStatusEl.style.color = 'var(--green)';
            emergencyIndicator.textContent = 'All Systems Operational';
            emergencyIndicator.style.color = 'var(--text-muted)';
            kpiCard.style.borderColor = '';
            kpiCard.style.background = '';
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// Firebase Integration Placeholder
// ═══════════════════════════════════════════════════════════════

// Firebase configuration placeholder
// Uncomment and configure when integrating with Firebase
/*
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Real-time listeners
function initFirebaseListeners() {
    // Worker Telemetry
    database.ref('telemetry').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateTelemetryFromFirebase(data);
        }
    });
    
    // Environment Sensors
    database.ref('environment').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateEnvironmentFromFirebase(data);
        }
    });
    
    // Alerts
    database.ref('alerts').orderByChild('timestamp').limitToLast(10).on('child_added', (snapshot) => {
        const alert = snapshot.val();
        if (alert) {
            addAlertToFeed(alert);
        }
    });
    
    // PPE Scans
    database.ref('ppe_scans').orderByChild('timestamp').limitToLast(1).on('child_added', (snapshot) => {
        const scan = snapshot.val();
        if (scan) {
            updatePPEFromFirebase(scan);
        }
    });
}

function updateTelemetryFromFirebase(data) {
    if (data.heartRate) document.getElementById('heart-rate').textContent = data.heartRate;
    if (data.spo2) {
        document.getElementById('spo2').textContent = data.spo2;
        updateSpo2Ring(data.spo2);
    }
    if (data.bodyTemp) {
        document.getElementById('body-temp').textContent = data.bodyTemp.toFixed(1);
        updateTempGauge(data.bodyTemp);
    }
    if (data.motionStatus) {
        document.getElementById('motion-status').textContent = data.motionStatus;
    }
    if (data.fallDetected !== undefined) {
        updateFallStatus(data.fallDetected);
    }
}

function updateEnvironmentFromFirebase(data) {
    if (data.aqi) document.getElementById('aqi').textContent = data.aqi;
    if (data.smoke) document.getElementById('smoke').innerHTML = data.smoke + '<small>ppm</small>';
    if (data.gas) document.getElementById('gas').innerHTML = data.gas + '<small>ppm</small>';
    if (data.temperature) document.getElementById('ambient-temp').innerHTML = data.temperature + '<small>°C</small>';
    if (data.humidity) document.getElementById('humidity').innerHTML = data.humidity + '<small>%</small>';
    
    updateHazardStatus(data.aqi || 50, data.smoke || 10, data.gas || 5, data.temperature || 30);
}

function updatePPEFromFirebase(scan) {
    document.getElementById('worker-name').textContent = scan.workerName;
    document.querySelector('.worker-id').textContent = 'ID: ' + scan.workerId;
    document.getElementById('rfid-status').textContent = scan.rfidVerified ? 'VERIFIED' : 'NOT VERIFIED';
    document.getElementById('helmet-detection').textContent = scan.helmetDetected ? 'DETECTED' : 'NOT DETECTED';
    document.getElementById('access-decision').textContent = scan.accessGranted ? 'GRANTED' : 'DENIED';
}
*/

// ═══════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log('[TRINETRA TECH] Initializing AI Safety Dashboard...');
    
    // Initialize datetime
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Initialize heart rate chart data
    for (let i = 0; i < 15; i++) {
        state.heartRateHistory.push(randomInt(CONFIG.heartRateMin, CONFIG.heartRateMax));
    }
    drawHeartChart();
    
    // Initialize emergency button
    initEmergencyButton();
    
    // Start telemetry updates
    //updateTelemetry();
    //setInterval(updateTelemetry, CONFIG.updateInterval);
    
    // Start environment updates
    //updateEnvironment();
    //setInterval(updateEnvironment, CONFIG.updateInterval + 1000);
    
    // Start alert generation
    setInterval(generateAlert, CONFIG.alertInterval);
    
    // Start PPE scan simulation
    setInterval(simulatePPEScan, 10000);
    
    // Start node status updates
    setInterval(updateNodeStatus, 5000);
    
    // Start KPI updates
    setInterval(updateKPIs, 15000);
    
    // Handle window resize for charts
    window.addEventListener('resize', () => {
        drawHeartChart();
    });
    
    console.log('[TRINETRA TECH] Dashboard initialized successfully!');
    //console.log('[TRINETRA TECH] Simulating real-time data...');
    console.log('[TRINETRA TECH] Ready for Firebase integration.');
}

// Start the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// ═══════════════════════════════════════════════════════════════
// Export for module usage (if needed)
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONFIG,
        state,
        updateTelemetry,
        updateEnvironment,
        generateAlert,
        simulatePPEScan
    };
}
