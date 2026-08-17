# SCROLLNOM MASTER ARCHITECTURE REVIEW

**Project**: ScrollNom (Social Food Discovery & Real-Time Ordering)  
**Date**: August 17, 2026  
**Scope**: Full-Stack Architecture, Multi-Laptop LAN Diagnostics, Codebase Duplication & Real-Time Data Pipeline Audit  

---

## Executive Summary

ScrollNom is a hybrid social food discovery and real-time food delivery application built with Vite/React on the frontend and Express/Node.js with SQLite on the backend. 

During this architecture review, we performed an exhaustive audit of all 35 architectural components across the codebase. We identified the exact root cause of the **Real-World LAN Multi-Laptop Integration Failure** where a second laptop (Laptop B - Restaurant/Rider) fails to receive order events placed on Laptop A (Customer), alongside structural technical debt, dual data persistence layers, and mock data fallbacks.

---

## 1. Real-World LAN Multi-Laptop Integration Analysis

### Root Cause of LAN Realtime Failure
1. **Split-Brain Backend Instances**: When Laptop B runs `npm run dev` or serves its own local instance, it launches its own isolated backend process on `http://localhost:5000` with an independent SQLite database (`scrollnom.db`) and in-memory Map store (`memoryStore.js`). Orders created on Laptop A update Laptop A's database, leaving Laptop B completely unaware.
2. **Hardcoded API Endpoints**: `src/services/userApi.js` hardcodes `http://localhost:5000` instead of using `API_BASE` from `src/config/api.js`. When Laptop B attempts user profile searches, requests are routed to Laptop B's local machine rather than Laptop A's backend host.
3. **Polling Architecture vs SSE Mismatch**:
   - Customer tracking (`LiveTrackingModal.jsx`) uses Server-Sent Events (`/api/delivery/:id/stream`).
   - Restaurant Ops (`RestaurantOpsPage.jsx`) uses HTTP Polling (`setInterval` every 4000ms to `/api/restaurant/orders`).
   - Rider Ops (`RiderOpsPage.jsx`) uses HTTP Polling (`setInterval` every 3000ms to `/api/rider/deliveries`).
   If Laptop B cannot reach Laptop A's IP due to firewall port 5000 blocking or invalid host resolution, polling fails silently.

---

## 2. Full System Health & Classification Table

| Subsystem / Component | Classification | Description |
| :--- | :--- | :--- |
| **Backend Binding (0.0.0.0:5000)** | **WORKING** | Listens on all interfaces (`0.0.0.0`), verified accessible via host LAN IP (`10.103.5.239`). |
| **Vite Frontend (0.0.0.0:3000)** | **WORKING** | Host binding `host: true` enabled in `vite.config.js`. Compiles clean without errors. |
| **Firebase Auth Sync** | **PARTIAL** | Authenticates via Firebase; syncs user to SQLite `users` table via `/api/users/sync`. However, fallback `u1` exists when unauthenticated. |
| **Shared Backend & SQLite DB** | **PARTIAL** | Core tables in `scrollnom.db` work correctly. Dual memory store (`memoryStore.js`) creates state drift across process restarts. |
| **Cart & Razorpay Checkout** | **WORKING** | Formats cart items, calculates delivery fees and taxes, computes HMAC SHA256 signatures, verifies mock/real signatures. |
| **Realtime Order Pipeline** | **PARTIAL** | Restaurant & Rider portals rely on 3-4s HTTP polling (`opsController.js`). Customer delivery tracking uses SSE (`trackingService.js`). |
| **Restaurant Ops Portal** | **WORKING** | `RestaurantOpsPage.jsx` fetches active orders (`restaurant_received`, `accepted`, `preparing`), transitions status via `/api/delivery/:id/status`. |
| **Rider Ops Portal** | **WORKING** | `RiderOpsPage.jsx` renders jobs for active rider, simulates GPS movement step coordinates (`0.35` lat/lng interpolation). |
| **Food on Friend (FOF)** | **WORKING** | Organizer pool creation, contribution calculation, and split payment logic implemented in `foodOnFriendController.js`. |
| **Nommly Reel Feed** | **PARTIAL** | Plays real MP4 videos from `Go_cool_Bengaluru/`. Falls back to `MOCK_NOMMLY_VIDEOS` if DB query returns empty. |
| **Bengaluru Discovery & Time Belt**| **WORKING** | Filters food reels and menu items by time slots (Morning, Afternoon, Evening, Overnight) in `timeBeltService.js`. |
| **Messaging System** | **WORKING** | Conversation threads, message sending, and SSE realtime event broadcasts (`MESSAGE_RECEIVED`) implemented in `messageService.js`. |
| **Notification System** | **WORKING** | In-app notification creation, unread count tracking, and SSE event broadcasts (`NOTIFICATION`) implemented in `notificationService.js`. |
| **Creator Collaborations** | **WORKING** | Collaboration request creation between creators and restaurants (`creator_collaborations` table) with status workflow. |
| **Location Geocoding (Leaflet)** | **WORKING** | OpenStreetMap Nominatim reverse & forward geocoding with Leaflet interactive pin map on `DeliveryMapModal.jsx`. |

---

## 3. Realtime Order Event Trace

```
[Customer Browser (Laptop A)]
       │
       │  1. POST /api/payment/verify (orderId, razorpay_signature)
       ▼
[Express Server (Laptop A)]
       │
       │  2. Update SQLite `orders` table (status='confirmed', payment_status='paid')
       │  3. Call `deliveryService.createDeliveryForOrder()`
       │  4. Insert record into `deliveries` table (status='restaurant_received')
       │  5. Trigger `createNotification()` (ORDER_PLACED to restaurant user)
       ▼
[Restaurant Browser (Laptop B)]
       │
       │  6. Polls GET /api/restaurant/orders every 4000ms
       │  7. Detects new delivery item in 'restaurant_received' status
       │  8. Restaurant clicks [ACCEPT / START PREPARING] -> PATCH /api/delivery/:id/status
       ▼
[Rider Browser (Laptop C)]
       │
       │  9. Polls GET /api/rider/deliveries every 3000ms
       │ 10. Detects delivery item in 'ready_for_pickup' status
       │ 11. Rider clicks [STEP GPS MOVEMENT] -> PATCH /api/delivery/:id/status
       ▼
[Customer Tracking SSE (Laptop A)]
       │
       │ 12. `trackingService.broadcast(deliveryId, updatePayload)`
       │ 13. EventSource receives broadcast update and re-renders live map & rider pin
```

---

## 4. Subsystem Priority Matrix

### P0 - Critical Real-World LAN Integration & Data Integrity
1. **Split-Brain LAN Architecture**: Laptop B running its own backend process creates disconnected local state.
2. **Hardcoded `localhost:5000` in `userApi.js`**: Bypasses dynamic `API_BASE` resolution, causing user search to fail on remote laptops.
3. **Dual State Persistence Drift**: Orders created in `memoryStore.js` and `database.js` can become desynchronized if server restarts or fallback paths execute.

### P1 - Major User-Facing & Reliability Issues
1. **Fallback Mock Data Ingestion**: `HomePage.jsx` and `ExplorePage.jsx` fall back to static `MOCK_NOMMLY_VIDEOS` and `MOCK_RESTAURANTS` instead of enforcing live database state.
2. **Hardcoded Rider Name**: Rider name defaults to `'Vikram Singh'` in `RestaurantOpsPage.jsx`, `RiderOpsPage.jsx`, and `LiveTrackingModal.jsx`.
3. **Hardcoded Restaurant ID in Collaborations**: `RestaurantOpsPage.jsx` fetches creator requests with hardcoded `restaurantId=r1`.

### P2 - Non-Critical Improvements
1. **Unify Realtime to SSE**: Replace 3-4s HTTP polling in Restaurant/Rider portals with SSE channels for instant event push.
2. **Duplicate API Utilities**: Consolidate `userApi.js`, `notificationApi.js`, `messageApi.js`, and inline `fetch` calls under `src/config/api.js`.

### P3 - Codebase Cleanup
1. **Legacy Test File Retention**: Clean up historical test scripts (`test_phase*.js`) in backend root.
