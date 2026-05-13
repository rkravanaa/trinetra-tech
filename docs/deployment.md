# Deployment Guide

## Local Deployment

### Backend

Run:

```bash
python helmet_server.py
```

---

### Dashboard

Use:

* VS Code Live Server
  OR
* Firebase Hosting

---

## Firebase Hosting

Install Firebase CLI:

```bash
npm install -g firebase-tools
```

Login:

```bash
firebase login
```

Initialize hosting:

```bash
firebase init
```

Deploy:

```bash
firebase deploy
```

Firebase generates a live deployment URL.

---

# Troubleshooting

## Firebase Not Updating

Check:

* internet connection
* firebase config
* database rules
* correct database URL

---

## ESP32 Not Connecting

Check:

* WiFi SSID
* WiFi password
* COM port
* board selection

---

## Flask Server Errors

Run:

```bash
pip install -r requirements.txt
```

Ensure Python version compatibility.
