#include <WiFi.h>
#include <Wire.h>
#include <MPU6050_tockn.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <Firebase_ESP_Client.h>

#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// =====================================================
// WIFI
// =====================================================

#define WIFI_SSID "****"
#define WIFI_PASSWORD "****"

// =====================================================
// FIREBASE
// =====================================================

#define API_KEY "xyz"

#define DATABASE_URL "hhkjkjjjl"

// =====================================================
// PINS
// =====================================================

#define SDA_PIN 21
#define SCL_PIN 18
#define ONE_WIRE_BUS 4

// =====================================================
// FIREBASE OBJECTS
// =====================================================

FirebaseData fbdo;

FirebaseAuth auth;

FirebaseConfig config;

// =====================================================
// SENSOR OBJECTS
// =====================================================

MPU6050 mpu6050(Wire);

OneWire oneWire(ONE_WIRE_BUS);

DallasTemperature tempSensor(&oneWire);

// =====================================================
// VARIABLES
// =====================================================

bool signupOK = false;

float ax, ay, az;
float gx, gy, gz;

float accelMagnitude;
float gyroMagnitude;

bool fallDetected = false;

float bodyTemp = 0;

// =====================================================
// SETUP
// =====================================================

void setup()
{
  Serial.begin(115200);

  // =====================================================
  // WIFI
  // =====================================================

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(300);
  }

  Serial.println();
  Serial.println("WiFi Connected");

  // =====================================================
  // FIREBASE
  // =====================================================

  config.api_key = API_KEY;

  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", ""))
  {
    Serial.println("Firebase SignUp OK");

    signupOK = true;
  }
  else
  {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;

  Firebase.begin(&config, &auth);

  Firebase.reconnectWiFi(true);

  // =====================================================
  // I2C
  // =====================================================

  Wire.begin(SDA_PIN, SCL_PIN);

  // =====================================================
  // MPU6050
  // =====================================================

  mpu6050.begin();

  Serial.println("Calibrating MPU6050");

  mpu6050.calcGyroOffsets(true);

  Serial.println("MPU6050 READY");

  // =====================================================
  // DS18B20
  // =====================================================

  tempSensor.begin();

  Serial.println("DS18B20 READY");
}

// =====================================================
// LOOP
// =====================================================

void loop()
{
  Serial.println("\n======================");

  // =====================================================
  // MPU6050 UPDATE
  // =====================================================

  mpu6050.update();

  ax = mpu6050.getAccX();
  ay = mpu6050.getAccY();
  az = mpu6050.getAccZ();

  gx = mpu6050.getGyroX();
  gy = mpu6050.getGyroY();
  gz = mpu6050.getGyroZ();

  accelMagnitude =
    sqrt(ax * ax + ay * ay + az * az);

  gyroMagnitude =
    sqrt(gx * gx + gy * gy + gz * gz);

  // =====================================================
  // FALL DETECTION
  // =====================================================

  if (accelMagnitude > 2.5 || gyroMagnitude > 150)
  {
    fallDetected = true;

    Serial.println("FALL DETECTED");
  }
  else
  {
    fallDetected = false;

    Serial.println("NORMAL");
  }

  // =====================================================
  // TEMPERATURE
  // =====================================================

  tempSensor.requestTemperatures();

  bodyTemp = tempSensor.getTempCByIndex(0);

  float bodyTempF =
    (bodyTemp *1) + 0;

  Serial.print("Temperature: ");

  Serial.println(bodyTempF);

  // =====================================================
  // FIREBASE
  // =====================================================

  if (Firebase.ready() && signupOK)
  {
    Firebase.RTDB.setBool(
      &fbdo,
      "wearable/worker_01/fall",
      fallDetected
    );

    Firebase.RTDB.setFloat(
      &fbdo,
      "wearable/worker_01/temp",
      bodyTempF
    );

    Firebase.RTDB.setString(
      &fbdo,
      "wearable/worker_01/motion",
      fallDetected ? "FALL DETECTED" : "NORMAL"
    );

    Firebase.RTDB.setBool(
      &fbdo,
      "wearable/worker_01/emergency",
      fallDetected
    );

    Serial.println("[FIREBASE] UPDATED");
  }
  else
  {
    Serial.println("[FIREBASE] NOT READY");
  }

  delay(1000);
}