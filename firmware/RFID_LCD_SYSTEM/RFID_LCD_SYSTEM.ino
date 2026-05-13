#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SoftwareSerial.h>

#define SS_PIN 10
#define RST_PIN 9

MFRC522 rfid(SS_PIN, RST_PIN);

LiquidCrystal_I2C lcd(0x27, 16, 2);

// RX, TX
SoftwareSerial espSerial(3, 2);
0
// ======================
// RFID Worker IDs
// ======================
String worker1 = "00 04 9D 42";
String worker2 = "83 95 0E DA";
String worker3 = "D4 91 96 3F";

void setup() {

  Serial.begin(115200);
  espSerial.begin(9600);

  SPI.begin();
  rfid.PCD_Init();

  lcd.init();
  lcd.backlight();

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("TRINETRA TECH");

  lcd.setCursor(0, 1);
  lcd.print("Scan RFID Card");

  delay(2000);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Ready To Scan");
}

void loop() {

  // ======================
  // RFID CHECK
  // ======================
  if (rfid.PICC_IsNewCardPresent() &&
      rfid.PICC_ReadCardSerial()) {

    String tagUID = "";

    for (byte i = 0; i < rfid.uid.size; i++) {

      if (rfid.uid.uidByte[i] < 0x10) {
        tagUID += "0";
      }

      tagUID += String(rfid.uid.uidByte[i], HEX);

      if (i != rfid.uid.size - 1) {
        tagUID += " ";
      }
    }

    tagUID.toUpperCase();

    lcd.clear();

    // ======================
    // WORKER 1
    // ======================
    if (tagUID == worker1) {

      lcd.setCursor(0, 0);
      lcd.print("Worker: Ronak");

      lcd.setCursor(0, 1);
      lcd.print("Checking PPE");

      while (espSerial.available()) {
        espSerial.read();
      }

      espSerial.println("CAPTURE");

      bool responseReceived = false;

      unsigned long startTime = millis();

      while (!responseReceived &&
             millis() - startTime < 10000) {

        if (espSerial.available()) {

          String response =
              espSerial.readStringUntil('\n');

          response.trim();

          Serial.print("ESP32 Response: ");
          Serial.println(response);

          if (response == "GRANTED") {

            Serial.println("LCD SHOWING GRANTED");

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("ACCESS OK");

            lcd.setCursor(0, 1);
            lcd.print("Welcome Ronak");

            responseReceived = true;

          } 
          else if (response == "DENIED") {

            Serial.println("LCD SHOWING DENIED");

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("NO HELMET");

            lcd.setCursor(0, 1);
            lcd.print("DENIED");

            responseReceived = true;
          }
        }
      }

      if (!responseReceived) {

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("AI Timeout");

        lcd.setCursor(0, 1);
        lcd.print("Try Again");

        delay(3000);
      }
    }

    // ======================
    // WORKER 2
    // ======================
    else if (tagUID == worker2) {

      lcd.setCursor(0, 0);
      lcd.print("Worker: Alex");

      lcd.setCursor(0, 1);
      lcd.print("Checking PPE");

      while (espSerial.available()) {
        espSerial.read();
      }

      espSerial.println("CAPTURE");

      bool responseReceived = false;

      unsigned long startTime = millis();

      while (!responseReceived &&
             millis() - startTime < 10000) {

        if (espSerial.available()) {

          String response =
              espSerial.readStringUntil('\n');

          response.trim();

          Serial.print("ESP32 Response: ");
          Serial.println(response);

          if (response == "GRANTED") {

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("ACCESS OK");

            lcd.setCursor(0, 1);
            lcd.print("Welcome Alex");

            responseReceived = true;

          } 
          else if (response == "DENIED") {

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("NO HELMET");

            lcd.setCursor(0, 1);
            lcd.print("DENIED");

            responseReceived = true;
          }
        }
      }

      if (!responseReceived) {

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("AI Timeout");

        lcd.setCursor(0, 1);
        lcd.print("Try Again");

        delay(3000);
      }
    }

    // ======================
    // WORKER 3
    // ======================
    else if (tagUID == worker3) {

      lcd.setCursor(0, 0);
      lcd.print("Worker: Sam");

      lcd.setCursor(0, 1);
      lcd.print("Checking PPE");

      while (espSerial.available()) {
        espSerial.read();
      }

      espSerial.println("CAPTURE");

      bool responseReceived = false;

      unsigned long startTime = millis();

      while (!responseReceived &&
             millis() - startTime < 10000) {

        if (espSerial.available()) {

          String response =
              espSerial.readStringUntil('\n');

          response.trim();

          Serial.print("ESP32 Response: ");
          Serial.println(response);

          if (response == "GRANTED") {

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("ACCESS OK");

            lcd.setCursor(0, 1);
            lcd.print("Welcome Sam");

            responseReceived = true;

          } 
          else if (response == "DENIED") {

            lcd.clear();

            lcd.setCursor(0, 0);
            lcd.print("NO HELMET");

            lcd.setCursor(0, 1);
            lcd.print("DENIED");

            responseReceived = true;
          }
        }
      }

      if (!responseReceived) {

        lcd.clear();

        lcd.setCursor(0, 0);
        lcd.print("AI Timeout");

        lcd.setCursor(0, 1);
        lcd.print("Try Again");

        delay(3000);
      }
    }

    // ======================
    // UNAUTHORIZED CARD
    // ======================
    else {

      lcd.setCursor(0, 0);
      lcd.print("Unauthorized");

      lcd.setCursor(0, 1);
      lcd.print("Access Denied");

      delay(3000);
    }

    // ======================
    // RESET RFID + LCD
    // ======================
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();

    delay(5000);

    lcd.clear();

    lcd.setCursor(0, 0);
    lcd.print("Scan RFID Card");
  }
}