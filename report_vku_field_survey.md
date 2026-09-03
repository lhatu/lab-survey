# TECHNICAL REPORT: VKU FIELD SURVEY (OFFLINE DATA COLLECTION)
**Mini-Project 1: PWA & Capacitor Native Integration**  
**Institution:** Vietnam-Korea University of Information and Communication Technology (VKU)  
**Author / Inspector Team:** Campus Facility Audit Group  
**Date:** September 3, 2026  

---

## 1. Executive Summary & Problem Statement

Campus facility inspectors and student auditors at VKU must conduct on-site inspections of classroom equipment, projectors, AC units, and electrical facilities in campus basements, auditoriums, and remote buildings where Wi-Fi and 4G/5G signals are unavailable.

This project delivers a **100% offline-first Progressive Web App (PWA)** and **Capacitor Native Android Application** designed to guarantee zero data loss during facility audits. Key highlights include:
- **Sub-second offline boot** powered by a Cache-First Service Worker (Workbox).
- **Step-by-step local draft auto-saving** using IndexedDB (`idb` wrapper).
- **Background Sync Queue Engine** with sequential server dispatch upon network restoration.
- **Native Android APK integration** leveraging Capacitor bridge for device Camera, GPS location, and connection monitoring.

---

## 2. Feature Checklist & Implementation Matrix

| Requirement Specification | Implementation Status | Technical Mechanism & Component |
| :--- | :---: | :--- |
| **PWA Standalone Installation** | ✅ COMPLETED | `manifest.json` with `display: standalone`, `theme_color: #0284c7`, maskable 192x192 & 512x512 icons |
| **Cache-First App Shell Caching** | ✅ COMPLETED | `vite-plugin-pwa` + Workbox caching HTML, JS, CSS, fonts for sub-second offline booting |
| **Multi-step Inspection Form** | ✅ COMPLETED | 3-step form (`InspectionForm.tsx`): Location, Equipment & 1–5 Star Rating, Defect Notes & Media |
| **Real-time Draft Persistence** | ✅ COMPLETED | Auto-saves input changes to IndexedDB (`drafts` store). Auto-restores draft on browser refresh/crash |
| **Offline Sync Queue (PENDING_SYNC)**| ✅ COMPLETED | Tagged with UUID, timestamp, stored in IndexedDB `surveys` object store with status `PENDING_SYNC` |
| **Automatic Reconnection Sync** | ✅ COMPLETED | `useSyncQueue` hook listening to `window.ononline` and `@capacitor/network` for sequential dispatch |
| **Offline Network Simulator** | ✅ COMPLETED | Integrated header toggle for testing offline workflow without disconnecting physical Wi-Fi |
| **Capacitor Native Camera Plugin** | ✅ COMPLETED | `@capacitor/camera` with base64 conversion and fallback to standard HTML file upload |
| **Capacitor Native Geolocation Plugin**| ✅ COMPLETED | `@capacitor/geolocation` acquiring GPS lat/lon with Web Geolocation fallback |
| **Android APK Packaging** | ✅ COMPLETED | Configured `capacitor.config.ts`, added Android platform (`npx cap add android`), verified plugin sync |

---

## 3. System Architecture & Data Synchronization Flow

### 3.1 Data Flow Diagram
```
                     [ User Audit Inputs ]
                               │
                               ▼
                    [ InspectionForm.tsx ]
                               │
               (Auto-Save Input Changes on-the-fly)
                               │
                               ▼
                 [ IndexedDB: "drafts" Store ]
                               │
                 (Submit Inspection Form)
                               │
                               ▼
        [ IndexedDB: "surveys" Store (PENDING_SYNC) ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
   [ Device is OFFLINE ]                 [ Device is ONLINE ]
            │                                     │
(Held in IndexedDB Queue)            (Auto-triggered by network event)
            │                                     │
            └──────────────────┬──────────────────┘
                               │
                               ▼
                   [ useSyncQueue Dispatcher ]
                               │
                   (Sequential REST POST Dispatch)
                               │
                               ▼
                 [ VKU Backend Server Database ]
                               │
                               ▼
         [ IndexedDB Status Updated: "SYNCED" ]
```

### 3.2 IndexedDB Schema Design (`VKU_FieldSurvey_DB`)
- **`drafts` store**: Key: `'active_form_draft'`, Value: `{ step, building, floor, roomNumber, category, conditionRating, defectNotes, photoBase64, location }`
- **`surveys` store**: Key: `id` (UUID), Indexes: `by-status` (`syncStatus`), `by-timestamp` (`createdAt`)
- **`syncLogs` store**: Key: `id`, Indexes: `by-timestamp` (`timestamp`)

---

## 4. Verification & Audit Results

### 4.1 PWA Audit Checklist
1. **Service Worker Registration**: Confirmed active `sw.js` precaching 15 bundle entries (303.38 KiB).
2. **Offline Boot Verification**: Tested in Chrome DevTools Network -> Offline mode. Page reloads in < 200ms directly from Service Worker cache.
3. **Draft Recovery**: Filled out Room number `A204` and Star Rating `4`, refreshed browser page. Draft was restored completely from IndexedDB.
4. **Offline Queue Dispatch**: Submitted survey under simulated offline mode. Status marked `PENDING_SYNC`. Upon disabling simulated offline mode, survey dispatches sequentially and transitions to `SYNCED`.

### 4.2 Capacitor Android Verification
- **Android Platform**: Added successfully via `npx cap add android`.
- **Plugin Integration**: Verified `@capacitor/camera`, `@capacitor/geolocation`, `@capacitor/network`.
- **Build Output**: Android project compiled ready for APK generation at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 5. Conclusion & Recommendations

The **VKU Field Survey PWA & Capacitor Native Application** fulfills all requirements for offline-first campus facility audits. The combination of Service Worker asset precaching, IndexedDB local persistence, automatic reconnection synchronization, and native Capacitor plugins provides a robust, zero-data-loss solution for VKU facility inspectors.

**Future Enhancements**:
- Integration with VKU Single Sign-On (SSO) OAuth2 authentication.
- Offline image compression before IndexedDB storage to optimize storage footprint on lower-end mobile hardware.
