let fallAlertActive = false;
let gasAlertActive = false;
let aqiAlertActive = false;
let emergencyAlertActive = false;

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
};

firebase.initializeApp(firebaseConfig);

const database = firebase.database();

console.log("[TRINETRA] Firebase Connected");


// ============================================
// WEARABLE
// ============================================

firebase.database()
.ref("wearable/worker_01")
.on("value", (snapshot) => {

    const data = snapshot.val();

    console.clear();
    console.log("========== TRINETRA LIVE DATA ==========");
    console.log("Wearable:", data);

    if (!data) return;

    document.getElementById("heart-rate").textContent =
      data.hr;

    document.getElementById("spo2").textContent =
      data.spo2;

    document.getElementById("body-temp").textContent =
      data.temp;

    document.getElementById("motion-status").textContent =
      data.motion;

    const fallStatus =
      document.getElementById("fall-status");

    if (data.fall) {

        fallStatus.textContent =
          "FALL DETECTED";

        fallStatus.style.color =
          "#ff4444";

    } else {

        fallStatus.textContent =
          "NO FALL DETECTED";

        fallStatus.style.color =
          "#00ff88";
    }

    // ============================================
    // FALL ALERT
    // ============================================

    if (data.fall === true && !fallAlertActive) {

        fallAlertActive = true;

        alert("⚠️ EMERGENCY ALERT: FALL DETECTED");
    }

    if (data.fall === false) {

        fallAlertActive = false;
    }
    if (data.emergency === true && !emergencyAlertActive) {
            emergencyAlertActive = true;
            alert("🚨 EMERGENCY SOS ACTIVATED");
    }
    if (data.emergency === false) {
        emergencyAlertActive = false;
    }

});


// ============================================
// ENVIRONMENT
// ============================================

firebase.database()
.ref("environment/zone_01")
.on("value", (snapshot) => {

    const data = snapshot.val();

    console.log("Environment:", data);
    console.log("========================================");

    if (!data) return;

    document.getElementById("aqi").innerHTML =
      data.aqi;

    document.getElementById("smoke").innerHTML =
      `${data.smoke}<small>ppm</small>`;

    document.getElementById("gas").innerHTML =
      `${data.gas}<small>ppm</small>`;

    document.getElementById("ambient-temp").innerHTML =
      `${data.temp}<small>°C</small>`;

    document.getElementById("humidity").innerHTML =
      `${data.humidity}<small>%</small>`;

    // ============================================
    // GAS ALERT
    // ============================================

    if (data.gas > 15 && !gasAlertActive) {

        gasAlertActive = true;

        alert("⚠️ WARNING: HIGH GAS LEVEL DETECTED");
    }

    if (data.gas <= 15) {

        gasAlertActive = false;
    }

    // ============================================
    // AQI ALERT
    // ============================================

    if (data.aqi > 150 && !aqiAlertActive) {

        aqiAlertActive = true;

        alert("⚠️ CRITICAL: AQI LEVEL DANGEROUS");
    }

    if (data.aqi <= 150) {

        aqiAlertActive = false;
    }

});

console.log("[TRINETRA] Realtime Sync Active");
// ============================================================
// ATTENDANCE — active_count
// Updates the "Active Workers" KPI card (id="active-workers")
// ============================================================

firebase.database()
.ref("active_count")
.on("value", (snapshot) => {

    const count = snapshot.val();

    if (count === null) return;

    document.getElementById("active-workers").textContent = count;

    console.log("[ATTENDANCE] active_count:", count);
});


// ============================================================
// ATTENDANCE — current status (latest scan)
// Updates the PPE panel's "Latest Worker Scan" section
// Elements already exist in your index.html:
//   #worker-name, #rfid-status, #access-decision, #scan-time
// ============================================================

let attendanceAlertActive = false;

firebase.database()
.ref("attendance")
.on("value", (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    console.log("[ATTENDANCE] Status update:", data);

    // Find most recently updated worker by highest timestamp
    let latestRecord = null;
    let latestTs = 0;

    Object.values(data).forEach((record) => {
        if (record.timestamp > latestTs) {
            latestTs = record.timestamp;
            latestRecord = record;
        }
    });

    if (!latestRecord) return;

    // Update Latest Worker Scan panel (PPE panel)
    document.getElementById("worker-name").textContent =
        latestRecord.name;

    document.getElementById("scan-time").textContent =
        formatAttendanceTime(latestRecord.timestamp);

    const rfidStatus = document.getElementById("rfid-status");
    const accessDecision = document.getElementById("access-decision");

    if (latestRecord.status === "IN") {

        rfidStatus.textContent = "VERIFIED";
        rfidStatus.className = "detail-value active";

        accessDecision.textContent = "GRANTED";
        accessDecision.className = "detail-value granted";

    } else if (latestRecord.status === "OUT") {

        rfidStatus.textContent = "VERIFIED";
        rfidStatus.className = "detail-value active";

        accessDecision.textContent = "CHECKED OUT";
        accessDecision.className = "detail-value warning";

    } else if (latestRecord.status === "DENIED") {

        rfidStatus.textContent = "UNKNOWN";
        rfidStatus.className = "detail-value denied";

        accessDecision.textContent = "DENIED";
        accessDecision.className = "detail-value denied";
    }

    // Inject alert into existing alert feed for DENIED cards
    if (latestRecord.status === "DENIED" && !attendanceAlertActive) {
        attendanceAlertActive = true;
        injectAttendanceAlert(latestRecord, "critical");
        setTimeout(() => { attendanceAlertActive = false; }, 10000);
    }

    // Inject check-in to alert feed
    if (latestRecord.status === "IN") {
        injectAttendanceAlert(latestRecord, "normal");
    }
});


// ============================================================
// ATTENDANCE — logs feed
// Updates the "Recent Scans" history list inside PPE panel
// Element: #ppe-history (already exists in your index.html)
// Shows last 10 log entries, newest first
// ============================================================

firebase.database()
.ref("attendance_logs")
.limitToLast(10)
.on("value", (snapshot) => {

    const data = snapshot.val();

    const historyEl = document.getElementById("ppe-history");
    if (!historyEl) return;

    if (!data) return;

    // Newest first
    const entries = Object.values(data).reverse();

    historyEl.innerHTML = "";

    entries.forEach((entry) => {

        const isGranted = (entry.status === "IN");
        const isDenied  = (entry.status === "DENIED");

        const initials = entry.name
            .split(" ")
            .map(w => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        const item = document.createElement("div");
        item.className = `history-item ${isGranted ? "granted" : isDenied ? "denied" : "warning"}`;

        item.innerHTML = `
            <div class="history-avatar">${initials}</div>
            <div class="history-info">
                <span class="history-name">${entry.name}</span>
                <span class="history-time">${formatAttendanceTime(entry.timestamp)}</span>
            </div>
            <div class="history-status">${isGranted ? "✓ IN" : isDenied ? "✗" : "OUT"}</div>
        `;

        historyEl.appendChild(item);
    });

    console.log("[ATTENDANCE] Log feed updated:", entries.length, "entries");
});


// ============================================================
// HELPERS
// ============================================================

function formatAttendanceTime(ms) {
    if (!ms) return "--:--:--";
    const d = new Date(ms);
    return d.toLocaleTimeString("en-IN", {
        hour:   "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

function injectAttendanceAlert(record, type) {

    const feed = document.getElementById("alert-feed");
    if (!feed) return;

    const alertEl = document.createElement("div");
    alertEl.className = `alert-item ${type} animate-in`;

    const icon = type === "critical"
        ? `<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
           <line x1="12" y1="9" x2="12" y2="13"/>
           <line x1="12" y1="17" x2="12.01" y2="17"/>`
        : `<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
           <polyline points="22 4 12 14.01 9 11.01"/>`;

    const label = record.status === "DENIED"
        ? "UNAUTHORIZED ACCESS"
        : `WORKER ${record.status}`;

    const detail = record.status === "DENIED"
        ? `Unknown RFID | Zone: ${record.zone}`
        : `${record.name} | Zone: ${record.zone}`;

    alertEl.innerHTML = `
        <div class="alert-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${icon}
            </svg>
        </div>
        <div class="alert-content">
            <span class="alert-type">${label}</span>
            <span class="alert-details">${detail}</span>
        </div>
        <span class="alert-time">Just now</span>
    `;

    // Prepend so newest alert appears at top
    feed.insertBefore(alertEl, feed.firstChild);

    // Keep feed from growing unbounded — trim after 10 items
    while (feed.children.length > 10) {
        feed.removeChild(feed.lastChild);
    }
}