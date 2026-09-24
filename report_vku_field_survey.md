# MINI-PROJECT SHORT TECHNICAL REPORT
**Course:** Cross-Platform Mobile App Development (VKU)  
**Mini-Project Title:** Mini-Project 1: VKU Field Survey — Offline Data Collection & Realtime Lab Booking (PWA & Capacitor)  
**Team / Student Name:** VKU Mobile Audit Team  
**Submission Date:** 24/09/2026  

---

## 1. GENERAL INFORMATION & DELIVERABLE LINKS

* **Team Members:**
  1. Nguyen Van A — Student ID: 22IT001 — Role: Team Lead / PWA Architecture & IndexedDB — Contribution: 50%
  2. Tran Thi B — Student ID: 22IT002 — Role: Member / Capacitor Native & Realtime Lab Booking — Contribution: 50%
* **🔗 Live Demo URL:** [https://vku-field-survey.pages.dev](https://vku-field-survey.pages.dev)
* **💻 GitHub Repository:** [https://github.com/vku-student/lab-survey](https://github.com/vku-student/lab-survey)
* **🎥 Video Demo (Optional):** [https://youtu.be/vku-field-survey-demo](https://youtu.be/vku-field-survey-demo)

---

## 2. FEATURE IMPLEMENTATION CHECKLIST

| # | Required Feature | Status | Implementation Details & Acceptance Level |
|:---:|---|:---:|---|
| 1 | **PWA Standalone Installation** | ✅ Complete | Manifest configured with `display: standalone`, `theme_color: #0284c7`, and maskable 192x192 / 512x512 icons. |
| 2 | **Cache-First Boot (< 1s)** | ✅ Complete | Service Worker precaches 15 bundle assets (336.76 KiB) using Workbox strategy for instant offline boot. |
| 3 | **Multi-Step Audit Form** | ✅ Complete | 3-step inspection wizard: Facility Location, Equipment Category & 1–5 Star Rating, Notes & Media Evidence. |
| 4 | **IndexedDB Local Draft Persistence** | ✅ Complete | Step-by-step auto-save into IndexedDB (`drafts` store). Restores 100% typed data automatically on browser refresh. |
| 5 | **Offline Sync Queue (PENDING_SYNC)** | ✅ Complete | Submissions tagged with UUID & timestamp. Automatically dispatched sequentially upon network restoration. |
| 6 | **Offline Network Simulator** | ✅ Complete | Built-in Navbar toggle for simulating offline behavior without disconnecting physical Wi-Fi/cellular connection. |
| 7 | **Capacitor Native Camera & GPS** | ✅ Complete | Native Android camera capture & geolocation with automatic fallback to Web HTML5 APIs on desktop browsers. |
| 8 | **Robin/LibCal Realtime Lab Booking** | ✅ Complete | Hourly time slot grid (07:00–18:00) with visual availability status (Free, Reserved, Pending Sync). |
| 9 | **Realtime Conflict Prevention** | ✅ Complete | Instant overlap detection preventing two users from reserving the same room and time slot simultaneously. |
| 10 | **Native Android APK Package** | ✅ Complete | Packaged into Android Studio native project (`android/`) and verified with Gradle compilation (`app-debug.apk`). |

---

## 3. TECHNICAL ARCHITECTURE & PROJECT STRUCTURE

### 3.1 Directory Structure
```
d:/React/lab-survey/
├── android/                        # Capacitor Native Android Platform Project
│   ├── app/build/outputs/apk/debug/app-debug.apk
│   └── build.gradle                # AGP 8.9.2 compatible configuration
├── public/
│   ├── manifest.json              # PWA Web App Manifest (standalone display)
│   ├── pwa-192x192.png            # Maskable PWA Icon (192x192)
│   └── pwa-512x512.png            # Maskable PWA Icon (512x512)
├── src/
│   ├── api/
│   │   ├── syncApi.ts             # Survey REST API server dispatch
│   │   └── roomBookingApi.ts      # Conflict prevention & room booking API
│   ├── components/
│   │   ├── Header.tsx             # Navbar with network status & simulator toggle
│   │   ├── InspectionForm.tsx     # Multi-step audit form with draft auto-save
│   │   ├── CameraCapture.tsx      # Native Camera plugin with canvas base64 compression
│   │   ├── LocationPicker.tsx     # Native Geolocation plugin with GPS fallback
│   │   ├── RoomBookingGrid.tsx    # Robin/LibCal slot grid & room selector
│   │   ├── TimeSlotPicker.tsx     # Hourly time slot selection component (07:00-18:00)
│   │   ├── BookingModal.tsx        # Room reservation form modal
│   │   ├── MyBookings.tsx         # Reservation manager & digital QR check-in badge
│   │   ├── SyncDashboard.tsx      # Queue status, pending surveys & activity logs
│   │   └── SurveyList.tsx         # Saved audit reports viewer
│   ├── db/
│   │   └── database.ts            # IndexedDB Schema v2 (`drafts`, `surveys`, `syncLogs`, `rooms`, `roomBookings`)
│   ├── hooks/
│   │   ├── useNetworkStatus.ts    # Real-time connection monitoring hook
│   │   └── useSyncQueue.ts        # Optimized background sync engine
│   ├── types/
│   │   ├── survey.ts              # Inspection survey data models
│   │   └── roomBooking.ts         # Room & Booking data models
│   ├── App.tsx                    # Main navigation tab layout
│   ├── main.tsx                   # Service Worker registration entrypoint
│   └── index.css                  # Tailwind CSS styling & VKU theme (#0284c7)
├── capacitor.config.ts            # Capacitor configuration
├── vite.config.ts                 # Vite + VitePWA Workbox setup
└── package.json
```

### 3.2 State Management & Synchronization Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                              REACT APP UI                              │
 └───────┬────────────────────────────────────────────────────────┬───────┘
         │                                                        │
  (Input Changes)                                          (Form Submission)
         │                                                        │
         ▼                                                        ▼
┌───────────────────┐                                  ┌──────────────────────┐
│  IndexedDB Store  │                                  │   IndexedDB Store    │
│    "drafts"       │                                  │ "surveys" / "bookings"│
│ (Auto-Save State) │                                  │ (status:PENDING_SYNC)│
└───────────────────┘                                  └──────────┬───────────┘
                                                                  │
                                                        (Network Event: Online)
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │    useSyncQueue &     │
                                                      │   roomBookingApi      │
                                                      └───────────┬───────────┘
                                                                  │
                                                     (Sequential REST Dispatch)
                                                                  │
                                                                  ▼
                                                      ┌───────────────────────┐
                                                      │  VKU Server Backend   │
                                                      │  (status: SYNCED)     │
                                                      └───────────────────────┘
```

---

## 4. EMPIRICAL EVIDENCE & SCREENSHOTS

### 4.1 PWA Standalone & Cache-First Boot Verification
- **DevTools Audit**: Manifest validated with `display: standalone`, `theme_color: #0284c7`, icons `pwa-192x192.png` and `pwa-512x512.png`.
- **Sub-Second Offline Boot**: When Network is set to **Offline** in Chrome DevTools, page reloads in < 180ms directly from Service Worker precache.

### 4.2 Local Draft Auto-Save & Restoration
- **Auto-Save Feedback**: Entering room number `A204` displays real-time `Draft Saved (HH:MM:SS)` badge.
- **Restoration**: Pressing `F5` reload restores 100% of typed fields with green `Draft Restored` badge.

### 4.3 LibCal Realtime Slot Grid & Conflict Prevention
- **Time Slot Grid**: Visual color-coded slots (Green = Free, Red = Reserved, Yellow = Pending Sync).
- **Overlap Prevention**: Attempting to reserve an occupied slot displays instant error: *"Conflict detected: Reserved by Nguyen Van A (08:45 - 10:15)"*.

### 4.4 Capacitor Android Native Compilation
- **APK Verification**: Generated debug APK at `android/app/build/outputs/apk/debug/app-debug.apk`.
- **Hardware Access**: Camera photo capture and GPS coordinates verified on Android emulator and physical phone.

---

## 5. TECHNICAL CHALLENGES & RESOLUTIONS

### Bottleneck 1: Android ANR (53% Kernel CPU Load) Caused by Base64 Camera Images & Polling
* **Problem:** During Android testing, the system threw an ANR error (`vn.edu.vku.fieldsurvey` using 56% CPU with 53% in kernel space). Analysis revealed uncompressed camera photos (10–30MB Base64 strings) and a 2-second `setInterval` loop in `SyncDashboard` caused heavy V8 garbage collection and kernel page faults.
* **Resolution:** 
  1. Configured Capacitor Camera options `width: 800, height: 800, quality: 60` and implemented HTML Canvas downscaling for uploaded images, reducing Base64 payload from 30MB to < 50KB.
  2. Removed `setInterval` polling in `SyncDashboard` and replaced it with event-driven updates.

### Bottleneck 2: Race Condition in Form Draft Auto-Save
* **Problem:** On initial page load, the default empty form state auto-saved into IndexedDB before the asynchronous `getDraft()` completed reading, wiping saved drafts.
* **Resolution:** Added an `isInitialized` flag state. The auto-save effect is blocked until `loadDraftFromDB()` finishes populating initial state.

### Bottleneck 3: AGP 8.13.0 Version Incompatibility in Android Studio
* **Problem:** Android Studio failed to sync Gradle with error: *"The project is using an incompatible version (AGP 8.13.0) of the Android Gradle plugin. Latest supported version is AGP 8.9.2"*.
* **Resolution:** Downgraded `com.android.tools.build:gradle` to `8.9.2` in `android/build.gradle` and set `org.gradle.warning.mode=none` in `android/gradle.properties`.
