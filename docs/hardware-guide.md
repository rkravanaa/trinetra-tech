# Hardware Guide

## Wearable Health Node

Components:

* ESP32
* MAX30102
* MPU6050
* Temperature Sensor
* Breadboard
* Jumper Wires

---

## Environment Monitoring Node

Components:

* ESP32
* MQ Gas Sensor
* Smoke Sensor
* DHT11/DHT22
* Buzzer
* LED Alert System

---

## RFID + PPE Detection Node

Components:

* ESP32-CAM
* RFID RC522
* RFID Cards
* FTDI Programmer

---

# Wiring Connections

## MAX30102 to ESP32

| MAX30102 | ESP32  |
| -------- | ------ |
| VIN      | 3.3V   |
| GND      | GND    |
| SDA      | GPIO21 |
| SCL      | GPIO22 |

---

## MPU6050 to ESP32

| MPU6050 | ESP32  |
| ------- | ------ |
| VCC     | 3.3V   |
| GND     | GND    |
| SDA     | GPIO21 |
| SCL     | GPIO22 |

---

## RFID RC522 to ESP32

| RC522 | ESP32  |
| ----- | ------ |
| SDA   | GPIO5  |
| SCK   | GPIO18 |
| MOSI  | GPIO23 |
| MISO  | GPIO19 |
| RST   | GPIO22 |
| 3.3V  | 3.3V   |
| GND   | GND    |

---

## DHT11 to ESP32

| DHT11 | ESP32 |
| ----- | ----- |
| VCC   | 3.3V  |
| GND   | GND   |
| DATA  | GPIO4 |
