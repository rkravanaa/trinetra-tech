# API Flow

## AI PPE Detection Workflow

```text
Worker Entry
↓
RFID Authentication
↓
ESP32-CAM Image Capture
↓
Flask AI Server
↓
OpenCLIP PPE Verification
↓
Firebase Upload
↓
Dashboard Update
↓
Access Decision
```

---

## Current AI Model

Model Used:

```text
OpenCLIP
```

Purpose:

* Helmet detection
* PPE verification
* Worker compliance checking

---

## Backend Components

* Flask API Server
* OpenCLIP Inference Engine
* Firebase Synchronization
* Google Sheets Logging
* Dashboard Communication Layer

---

## Current Flask Endpoint

```text
/detect
```

Method:

```text
POST
```

Purpose:

Receives worker images from ESP32-CAM for PPE verification.
