# Firebase Setup

## Create Firebase Project

Open:

https://console.firebase.google.com/

Create a new project.

Suggested project name:

```text
TRINETRA-TECH
```

---

## Enable Realtime Database

Inside Firebase:

Build → Realtime Database

Create database in test mode.

---

## Get Firebase Config

Go to:

Project Settings → General

Scroll to:

Your Apps

Create Web App.

Copy configuration object.

Example:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Add Config to Dashboard

Open:

```text
dashboard/firebase-live.js
```

Replace placeholder values with your Firebase config.

---

## Firebase Hosting Deployment

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
