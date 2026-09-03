# VKU Field Survey — Offline Data Collection (PWA & Capacitor)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: React 18](https://img.shields.io/badge/React-18-sky.svg)](https://react.dev/)
[![PWA: Cache--First](https://img.shields.io/badge/PWA-Cache--First-emerald.svg)](https://web.dev/progressive-web-apps/)
[![Bridge: Capacitor 6+](https://img.shields.io/badge/Capacitor-Android--Native-blueviolet.svg)](https://capacitorjs.com/)

An offline-first Progressive Web App (PWA) and native Android application developed for **Vietnam-Korea University of Information and Communication Technology (VKU)** facility inspectors and student auditors.

The app enables 100% offline facility audits (classrooms, projectors, AC units, electrical equipment, furniture) in basements, remote auditoriums, and areas lacking Wi-Fi or cellular coverage.

---

## 🎯 Key Features & Technical Capabilities

### 📱 1. PWA Standalone Installation & Boot performance
- **Web App Manifest (`manifest.json`)**: Configured with `display: standalone`, `theme_color: #0284c7`, background `#f8fafc`, and responsive 192x192 & 512x512 app icons.
- **Service Worker (Workbox Cache-First)**: Pre-caches app shell assets (HTML, CSS, JS, fonts) for sub-second offline booting without internet access.

### 📝 2. Multi-Step Offline Survey Form & Local Draft Engine
- **3-Step Audit Flow**:
  1. **Location Setup**: Building (A, B, C, Library, Admin, Lab), Floor level (B1–5), Room number.
  2. **Equipment & Condition**: Category (Hardware, Projector, AC Unit, Electrical, Furniture, Network Router) and 1–5 Star Condition Rating.
  3. **Evidence & Location**: Defect Notes, Camera Photo Evidence, and GPS Coordinates.
- **Real-Time IndexedDB Draft Storage**: Automatically saves form inputs step-by-step to IndexedDB (`drafts` store). If the browser refreshes or crashes, typed content is automatically restored.

### 🔄 3. Offline Sync Queue & Background Dispatcher
- **State Machine Tagging**: Submissions created offline are tagged with a unique UUID, ISO timestamp, and saved into IndexedDB with `syncStatus: 'PENDING_SYNC'`.
- **Automatic Event Dispatcher**: Listens for network restoration (`window.ononline` and `@capacitor/network`) to process queued surveys sequentially and post them to the backend API (`/api/sync`).
- **Interactive Sync Dashboard**: Features live sync logs, pending item counts, real-time connection status badges, and a manual force-sync trigger.
- **Built-in Offline Simulator**: Integrated header toggle button allows inspectors to simulate offline behavior and test sync queues directly inside standard desktop/mobile browsers.

### 🔌 4. Capacitor Native Android Integration
- **`@capacitor/camera`**: Native device camera capture with automatic fallback to standard HTML5 file uploads.
- **`@capacitor/geolocation`**: Precise GPS coordinate acquisition with standard Web Navigator Geolocation fallback.
- **`@capacitor/network`**: Hardware-level connection tracking.
- **Native Android APK Package**: Packaged and ready for compilation into an Android `.apk` package via Android Studio / Capacitor Bridge.

---

## 🏗️ Technical Architecture

```
d:/React/lab-survey/
├── public/
│   ├── manifest.json              # PWA Web App Manifest (standalone display)
│   ├── pwa-192x192.png            # Maskable PWA Icon (192x192)
│   └── pwa-512x512.png            # Maskable PWA Icon (512x512)
├── android/                        # Capacitor Native Android Project
├── src/
│   ├── api/
│   │   └── syncApi.ts             # Mock backend REST API & server dispatch
│   ├── components/
│   │   ├── Header.tsx             # Navbar with network status & simulator toggle
│   │   ├── InspectionForm.tsx     # Multi-step offline audit form with draft auto-save
│   │   ├── CameraCapture.tsx      # Native Camera plugin with Web input fallback
│   │   ├── LocationPicker.tsx     # Native Geolocation plugin with Web GPS fallback
│   │   ├── SyncDashboard.tsx      # Queue status, pending surveys & activity logs
│   │   └── SurveyList.tsx         # Saved audit reports viewer (Synced vs Pending)
│   ├── db/
│   │   └── database.ts            # IndexedDB layer (`idb` library)
│   ├── hooks/
│   │   ├── useNetworkStatus.ts    # Network monitoring hook
│   │   └── useSyncQueue.ts        # Automatic background queue sync dispatcher
│   ├── types/
│   │   └── survey.ts              # Data models & interfaces
│   ├── App.tsx                    # Main app layout & tab navigation
│   ├── main.tsx                   # Service Worker registration entrypoint
│   └── index.css                  # Tailwind CSS styling & VKU theme (#0284c7)
├── capacitor.config.ts            # Capacitor native configuration
├── vite.config.ts                 # Vite + VitePWA Cache-First Workbox setup
├── package.json
└── README.md
```

---

## 🛠️ Quick Start & Local Setup

### Prerequisites
- Node.js 18+ and npm 10+ installed
- (Optional for APK compilation) Android Studio & JDK 17+

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/vku-student/lab-survey.git
cd lab-survey
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build Production PWA Bundle
```bash
npm run build
```
The output files will be built to `dist/`, including `dist/sw.js` and pre-cached assets.

---

## 📱 Capacitor Native Android Compilation

### 1. Sync Web Build into Capacitor Native Android
```bash
npm run build
npx cap sync
```

### 2. Open in Android Studio & Generate APK
```bash
npx cap open android
```
In Android Studio:
1. Go to **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
2. The compiled debug APK will be generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🧪 PWA & Offline Verification Steps

1. **Verify PWA Installation**:
   - Open Chrome DevTools -> **Application** -> **Manifest**.
   - Confirm `Name`, `Short Name`, `Display: standalone`, `Theme Color: #0284c7`, and `Icons` are valid.
2. **Verify Cache-First Service Worker**:
   - In Chrome DevTools -> **Application** -> **Service Workers**, verify `sw.js` is active.
   - Go to **Network** tab -> Set to **Offline** -> Reload page. The application will instantly load sub-second offline.
3. **Verify IndexedDB Draft Persistence**:
   - Fill out Step 1 and Step 2 of the Audit Form.
   - Reload the browser page. Notice the draft is automatically restored from IndexedDB!
4. **Verify Offline Queue & Background Sync**:
   - Click **"Simulate Offline"** in the top navigation bar.
   - Submit a new inspection report. Observe that its status is set to `PENDING_SYNC` in IndexedDB.
   - Click **"Simulate Offline"** again to return online. The queue engine will automatically dispatch the pending survey to the backend server sequentially and update its status to `SYNCED`.

---

## 📄 License & Credits
Developed for **VKU (Vietnam-Korea University of Information and Communication Technology)** Mini-Project 1.
Released under the MIT License.
