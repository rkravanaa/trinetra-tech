/*
  ============================================================
  TRINETRA — AIoT Industrial Worker Safety System
  ESP32-S3 Environment Node — Firebase Realtime Upload
  ============================================================

  HARDWARE (UNCHANGED):
    ESP32-S3
      SDA -> GPIO21
      SCL -> GPIO18

    ADS1115
      VCC  -> 3.3V | GND -> GND | ADDR -> GND (0x48)

    DHT22
      VCC -> 3.3V | GND -> GND | DATA -> GPIO4
      4.7k pull-up to 3.3V required

    MQ2  (VCC 5V) -> 10k divider -> ADS AIN0
    MQ135(VCC 5V) -> 10k divider -> ADS AIN1

    GP2Y1014AU0F
      BLACK  -> GND
      BLUE   -> 5V via 150R
      GREEN  -> GPIO17
      YELLOW -> GND
      RED    -> ADS AIN2
      WHITE  -> 5V  (+220uF cap to GND)

  FIREBASE STRUCTURE WRITTEN:
    environment/zone_01/
      temp      (°C)
      humidity  (%)
      gas       (MQ2 index × 10  → dashboard alert >15)
      smoke     (MQ135 index × 10)
      aqi       (dust_index       → dashboard alert >150)
      alert     (boolean)
      ts        (millis, freshness watchdog)

  REQUIRED LIBRARIES (install via PlatformIO / Arduino Library Manager):
    - Firebase ESP Client  by Mobizt       (search: "Firebase ESP Client")
    - Adafruit ADS1X15                     (search: "Adafruit ADS1X15")
    - DHT sensor library   by Adafruit
  ============================================================
*/

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <DHT.h>
#include <WiFi.h>

// Firebase ESP Client by Mobizt — EXACT include order matters
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"   // handles token refresh automatically
#include "addons/RTDBHelper.h"    // printResult helper (optional but useful)

// ============================================================
// WIFI CREDENTIALS  ← Only placeholders in entire file
// ============================================================

#define WIFI_SSID     "****"
#define WIFI_PASSWORD "******"

// ============================================================
// FIREBASE CREDENTIALS
// ============================================================

#define API_KEY      "xxyz"
#define DATABASE_URL "khdhggd"

// RTDB path — must match dashboard listener exactly
#define ZONE_PATH "environment/zone_01"

// ============================================================
// PIN CONFIG  (unchanged from original)
// ============================================================

#define SDA_PIN       21
#define SCL_PIN       18
#define DHTPIN         4
#define DHTTYPE    DHT22
#define GP2Y_LED_PIN  17

// ADS1115 channel assignments (unchanged)
#define MQ2_CH    0
#define MQ135_CH  1
#define GP2Y_CH   2

// ============================================================
// OBJECTS
// ============================================================

Adafruit_ADS1115 ads;
DHT              dht(DHTPIN, DHTTYPE);

FirebaseData     fbdo;      // RTDB stream/call object
FirebaseAuth     auth;      // auth credentials (anonymous)
FirebaseConfig   config;    // API key, DB URL, token callback

// ============================================================
// CONSTANTS  (unchanged from original)
// ============================================================

const float ADS_LSB    = 0.0001875f;   // GAIN_TWOTHIRDS LSB in volts
const float MQ_VDIV    = 2.0f;         // voltage divider restore factor
const float DUST_SCALE = 100.0f;       // dust index scaler

// ============================================================
// BASELINES
// ============================================================

float baseline_mq2   = 0.0f;
float baseline_mq135 = 0.0f;
float baseline_dust  = 0.0f;

// ============================================================
// UPLOAD STATE
// ============================================================

bool           firebaseReady  = false;   // set true after signUp succeeds
unsigned long  lastUploadMs   = 0;
unsigned long  lastSensorMs   = 0;

const unsigned long UPLOAD_INTERVAL_MS = 2000UL;  // upload every 2 seconds
const unsigned long SENSOR_INTERVAL_MS = 2000UL;  // DHT22 min interval = 2s

// Last-good sensor values (shown on dashboard even if a read fails momentarily)
float last_tempC      = 0.0f;
float last_hum        = 0.0f;
float last_mq2_v      = 0.0f;
float last_mq2_index  = 1.0f;
float last_mq135_v    = 0.0f;
float last_mq135_index= 1.0f;
float last_dust_v     = 0.0f;
float last_dust_index = 0.0f;
bool  last_alert      = false;

// ============================================================
// ADS READ  (unchanged from original)
// ============================================================

float readADSVoltage(uint8_t channel) {
  int16_t raw  = ads.readADC_SingleEnded(channel);
  float voltage = raw * ADS_LSB;
  return (voltage < 0.0f) ? 0.0f : voltage;
}

// ============================================================
// GP2Y DUST READ — extracted into function to keep loop clean
// ============================================================


void readDust(int16_t &out_raw, float &out_voltage) {
  digitalWrite(GP2Y_LED_PIN, LOW);
  delayMicroseconds(280);

  out_raw     = ads.readADC_SingleEnded(GP2Y_CH);
  out_voltage = out_raw * ADS_LSB;

  delayMicroseconds(40);
  digitalWrite(GP2Y_LED_PIN, HIGH);
  delayMicroseconds(9680);

  if (out_voltage < 0.0f) out_voltage = 0.0f;
}
// ============================================================
// WIFI — connect with retry and hard reboot on total failure
// ============================================================

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WIFI] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WIFI] Connected. IP: %s  RSSI: %d dBm\n",
                  WiFi.localIP().toString().c_str(),
                  WiFi.RSSI());
  } else {
    Serial.println("\n[WIFI] FAILED after 20s — rebooting in 5s");
    delay(5000);
    ESP.restart();   // hard reboot; sensor node must always be online
  }
}

// ============================================================
// FIREBASE INIT — called once in setup()
//
// WHY Anonymous signUp?
//   Firebase RTDB rules require authenticated UID even for anonymous users.
//   Without signUp(), every write returns HTTP 401 UNAUTHORIZED silently.
//   signUp("","") creates a new anonymous UID + short-lived ID token.
//   TokenHelper.h refreshes that token automatically before expiry.
// ============================================================

void initFirebase() {
  config.api_key      = API_KEY;
  config.database_url = DATABASE_URL;

  // Anonymous sign-up — empty email/password = anonymous user
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("[FIREBASE] Anonymous auth OK");
    firebaseReady = true;
  } else {
    // Most common failure: wrong API key, or Authentication not enabled
    // in Firebase Console → Authentication → Sign-in method → Anonymous
    Serial.printf("[FIREBASE] Auth FAILED: %s\n",
                  config.signer.signupError.message.c_str());
    Serial.println("[FIREBASE] >>> Enable Anonymous auth in Firebase Console <<<");
    // Do NOT reboot here — allow sensor reads to continue; retry will happen
    // next time Firebase.ready() is checked
  }

  // TokenHelper callback: prints token status to Serial, handles auto-refresh
  // THIS IS THE LINE THAT PREVENTS THE "stops after 1 hour" BUG
  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);

  // Tell Firebase library to reconnect WiFi if it drops
  Firebase.reconnectWiFi(true);

  // Increase response buffer — prevents corruption on larger RTDB responses
  fbdo.setResponseSize(4096);

  Serial.println("[FIREBASE] Client initialized");
}

// ============================================================
// FIREBASE UPLOAD — called on interval from loop()
// ============================================================

void uploadToFirebase() {

  /*
    Dashboard alert thresholds (from your JS):
      gas  > 15  → alert
      aqi  > 150 → alert

    Firmware alert thresholds (local):
      mq2_index  > 1.4  → alert
      mq135_index> 1.4  → alert
      dust_index > 100  → alert

    Mapping:
      gas   = mq2_index * 10    → 1.0 baseline=10, 1.5=15 (dashboard alert), 2.0=20
      smoke = mq135_index * 10  → same scale
      aqi   = dust_index        → 0 baseline, 100=firmware alert, 150=dashboard alert
  */

  float gas_val   = last_mq2_index   * 10.0f;
  float smoke_val = last_mq135_index * 10.0f;
  float aqi_val   = last_dust_index;

  FirebaseJson payload;
  payload.set("temp",     isnan(last_tempC) ? 0.0f : last_tempC);
  payload.set("humidity", isnan(last_hum)   ? 0.0f : last_hum);
  payload.set("gas",      gas_val);
  payload.set("smoke",    smoke_val);
  payload.set("aqi",      aqi_val);
  payload.set("alert",    last_alert);
  payload.set("ts",       (unsigned long)millis());   // dashboard can check staleness

  Serial.printf("[UPLOAD] temp=%.1f°C  hum=%.1f%%  gas=%.2f  smoke=%.2f  aqi=%.2f  alert=%s\n",
                isnan(last_tempC) ? 0.0f : last_tempC,
                isnan(last_hum)   ? 0.0f : last_hum,
                gas_val, smoke_val, aqi_val,
                last_alert ? "YES ⚠" : "no");

  // setJSON writes all fields atomically in a single HTTP PATCH
  // This is the correct function — NOT push(), NOT set() on individual keys
  if (Firebase.RTDB.setJSON(&fbdo, ZONE_PATH, &payload)) {
    Serial.println("[FIREBASE] ✓ Upload OK");
  } else {
    // Print exact error — common errors:
    //   "connection lost"    → WiFi dropped between writes
    //   "token expired"      → TokenHelper not included / callback not set
    //   "permission denied"  → RTDB rules not set to allow anonymous writes
    Serial.printf("[FIREBASE] ✗ Upload FAILED: %s\n",
                  fbdo.errorReason().c_str());
  }
}

// ============================================================
// CALIBRATION  (logic unchanged from original)
// ============================================================

void calibrateSensors() {
  Serial.println("[CAL] Calibrating baselines...");

  float sum_mq2 = 0.0f, sum_mq135 = 0.0f, sum_dust = 0.0f;
  const int SAMPLES = 30;

  for (int i = 0; i < SAMPLES; i++) {
    sum_mq2   += readADSVoltage(MQ2_CH)   * MQ_VDIV;
    sum_mq135 += readADSVoltage(MQ135_CH) * MQ_VDIV;

    int16_t d_raw; float d_v;
    readDust(d_raw, d_v);
    sum_dust += d_v;

    Serial.printf("[CAL] sample %2d/%d\r", i + 1, SAMPLES);
    delay(200);
  }

  baseline_mq2   = sum_mq2   / SAMPLES;
  baseline_mq135 = sum_mq135 / SAMPLES;
  baseline_dust  = sum_dust  / SAMPLES;

  Serial.println();
  Serial.println("[CAL] === BASELINES ===");
  Serial.printf ("[CAL] MQ2:   %.4f V\n", baseline_mq2);
  Serial.printf ("[CAL] MQ135: %.4f V\n", baseline_mq135);
  Serial.printf ("[CAL] DUST:  %.4f V\n", baseline_dust);
  Serial.println("[CAL] =================");
}

// ============================================================
// SETUP
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n============================================");
  Serial.println("  TRINETRA — Environment Node BOOT");
  Serial.println("============================================");

  // I2C bus
  Wire.begin(SDA_PIN, SCL_PIN);

  // ADS1115
  if (!ads.begin()) {
    Serial.println("[ADS] NOT DETECTED — check SDA/SCL wiring — HALTED");
    while (1) delay(1000);
  }
  ads.setGain(GAIN_TWOTHIRDS);   // ±6.144V range, LSB = 187.5µV
  Serial.println("[ADS] ADS1115 OK");

  // DHT22
  dht.begin();
  Serial.println("[DHT] DHT22 OK");

  // GP2Y LED pin
  pinMode(GP2Y_LED_PIN, OUTPUT);
  digitalWrite(GP2Y_LED_PIN, HIGH);   // LED off (active LOW)
  Serial.println("[GP2Y] GP2Y1014 OK");

  // WiFi — must be up before Firebase init
  connectWiFi();

  // Firebase — must be called after WiFi
  initFirebase();

  // MQ sensor warmup (original: 10s)
  Serial.println("[MQ] Warming up MQ sensors (10s)...");
  for (int i = 10; i > 0; i--) {
    Serial.printf("[MQ] %ds remaining...\n", i);
    delay(1000);
  }
  Serial.println("[MQ] Warmup complete");

  // Baseline calibration
  calibrateSensors();

  Serial.println("\n[SYS] SYSTEM READY — starting sensor loop\n");
}

// ============================================================
// LOOP
// ============================================================

void loop() {
  unsigned long now = millis();

  // ----------------------------------------------------------
  // 1. WiFi Watchdog — runs every loop iteration, very cheap
  // ----------------------------------------------------------
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Connection lost — attempting reconnect");
    WiFi.disconnect();
    delay(1000);
    connectWiFi();
  }

  // ----------------------------------------------------------
  // 2. Sensor Read Block — gated by SENSOR_INTERVAL_MS
  //    DHT22 requires ≥2s between reads; other sensors read fresh anyway
  // ----------------------------------------------------------
  if (now - lastSensorMs >= SENSOR_INTERVAL_MS) {
    lastSensorMs = now;

    // ---- DHT22 ----
    float tempC = dht.readTemperature();
    float hum   = dht.readHumidity();

    if (!isnan(tempC)) last_tempC = tempC;
    if (!isnan(hum))   last_hum   = hum;

    // ---- MQ2 ----
    int16_t mq2_raw   = ads.readADC_SingleEnded(MQ2_CH);
    float   mq2_ads_v = mq2_raw * ADS_LSB;
    float   mq2_v     = mq2_ads_v * MQ_VDIV;
    last_mq2_v = mq2_v;

    // ---- MQ135 ----
    int16_t mq135_raw   = ads.readADC_SingleEnded(MQ135_CH);
    float   mq135_ads_v = mq135_raw * ADS_LSB;
    float   mq135_v     = mq135_ads_v * MQ_VDIV;
    last_mq135_v = mq135_v;

    // ---- GP2Y Dust ----
    int16_t dust_raw_val; float dust_v_val;
    readDust(dust_raw_val, dust_v_val);
    last_dust_v = dust_v_val;

    // ---- Indices (unchanged logic from original) ----
    last_mq2_index = (baseline_mq2 > 0.01f)
                     ? (mq2_v / baseline_mq2) : 1.0f;

    last_mq135_index = (baseline_mq135 > 0.01f)
                       ? (mq135_v / baseline_mq135) : 1.0f;

    last_dust_index = max(0.0f,
                      (last_dust_v - baseline_dust)) * DUST_SCALE;

    // ---- Alert Logic (unchanged from original) ----
    last_alert = (last_mq2_index   > 1.4f  ||
                  last_mq135_index > 1.4f  ||
                  last_dust_index  > 100.0f);

    // ---- Serial JSON output (format unchanged from original) ----
    Serial.print("{");
    Serial.print("\"tempC\":");
    if (isnan(last_tempC)) Serial.print(-999);
    else                   Serial.print(last_tempC, 2);

    Serial.print(",\"hum\":");
    if (isnan(last_hum)) Serial.print(-999);
    else                 Serial.print(last_hum, 2);

    Serial.print(",\"mq2_raw\":");   Serial.print(mq2_raw);
    Serial.print(",\"mq2_v\":");     Serial.print(mq2_v,           4);
    Serial.print(",\"mq2_idx\":");   Serial.print(last_mq2_index,  2);

    Serial.print(",\"mq135_raw\":"); Serial.print(mq135_raw);
    Serial.print(",\"mq135_v\":");   Serial.print(mq135_v,         4);
    Serial.print(",\"mq135_idx\":"); Serial.print(last_mq135_index,2);

    Serial.print(",\"dust_raw\":");  Serial.print(dust_raw_val);
    Serial.print(",\"dust_v\":");    Serial.print(last_dust_v,      4);
    Serial.print(",\"dust_idx\":");  Serial.print(last_dust_index,  2);

    Serial.print(",\"alert\":");
    Serial.print(last_alert ? "true" : "false");
    Serial.println("}");
  }

  // ----------------------------------------------------------
  // 3. Firebase Upload Block — gated by UPLOAD_INTERVAL_MS
  //
  //    Firebase.ready() returns true ONLY when:
  //      a) WiFi is connected
  //      b) Anonymous auth token is valid (not expired)
  //      c) Firebase.begin() has been called
  //
  //    firebaseReady flag gates this if signUp() failed at boot.
  //    The node will still read sensors and print serial even if
  //    Firebase is unavailable — it degrades gracefully.
  // ----------------------------------------------------------
  if (firebaseReady) {
    if (Firebase.ready()) {
      if (now - lastUploadMs >= UPLOAD_INTERVAL_MS) {
        lastUploadMs = now;
        uploadToFirebase();
      }
    } else {
      // Firebase not ready: token refreshing, or WiFi just reconnected.
      // Do NOT upload — Firebase.ready() will return true once token is live.
      // TokenHelper handles this automatically in the background.
      Serial.println("[FIREBASE] Waiting for ready state (token refresh or reconnect)...");
    }
  }

  // ----------------------------------------------------------
  // 4. Small yield — prevents WDT trigger on tight loops
  //    No large blocking delay here — timing is managed by millis()
  // ----------------------------------------------------------
  delay(10);
}