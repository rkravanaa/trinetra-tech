# Setup Guide

## Overview

TRINETRA TECH is an AI-powered industrial worker safety platform combining:

* ESP32 wearable telemetry
* Environmental hazard sensing
* RFID attendance
* AI PPE verification
* Firebase realtime synchronization
* Flask AI backend
* Industrial monitoring dashboard

---

## Software Requirements

Install:

* Arduino IDE
* Python 3.10+
* VS Code
* Git
* GitHub Desktop

---

## Arduino IDE Setup

### Step 1 — Install Arduino IDE

Download:

https://www.arduino.cc/en/software

---

### Step 2 — Add ESP32 Board Manager

Open Arduino IDE.

Go to:

File → Preferences

Inside:

Additional Board Manager URLs

Paste:

https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

---

### Step 3 — Install ESP32 Boards

Go to:

Tools → Board → Boards Manager

Search:

ESP32

Install:

ESP32 by Espressif Systems

---

## Python AI Server Setup

Open terminal:

```bash
cd ai-server
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run Flask server:

```bash
python helmet_server.py
```

Expected output:

```text
Running on http://127.0.0.1:5000
```

---

## Dashboard Setup

Open:

```text
dashboard/
```

Files:

```text
index.html
style.css
app.js
firebase-live.js
```

Recommended:
Use VS Code Live Server extension.
