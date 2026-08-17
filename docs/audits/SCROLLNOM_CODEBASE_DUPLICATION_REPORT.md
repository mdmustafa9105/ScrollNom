# SCROLLNOM CODEBASE DUPLICATION & DEAD CODE REPORT

**Date**: August 17, 2026  
**Auditor**: Antigravity AI Engineering  

---

## 1. Executive Summary

This report catalogues all duplicate implementations, static mock fallbacks, hardcoded test identities, and legacy test assets discovered during the master architecture review of the ScrollNom repository.

---

## 2. Duplicate Systems & API Utilities

### 1. API Client Utilities (`src/services/` vs `src/config/api.js`)
- `src/services/userApi.js`: Defines local `API_BASE = 'http://localhost:5000'` (Bypasses dynamic LAN hostname resolution in `src/config/api.js`).
- `src/services/notificationApi.js`: Imports `API_BASE` correctly from `src/config/api.js`.
- `src/services/messageApi.js`: Imports `API_BASE` correctly from `src/config/api.js`.
- **Recommendation**: Unify `userApi.js` to use `src/config/api.js`.

### 2. Dual Data Persistence (`server/db/memoryStore.js` vs `server/db/database.js`)
- `server/db/database.js`: Persistent SQLite storage (`scrollnom.db`) storing users, content, orders, deliveries, messages, notifications, and menu items.
- `server/db/memoryStore.js`: In-memory `Map` class store used as a secondary fallback in `paymentController.js`, `orderController.js`, `opsController.js`, and `foodOnFriendController.js`.
- **Classification**: **DUPLICATED / CONFLICTING**. In-memory data creates state inconsistency upon process restart.

---

## 3. Fake Data, Static Fallbacks & Hardcoded Identities

| Asset / Identifier | File Location | Classification | Description |
| :--- | :--- | :--- | :--- |
| `MOCK_NOMMLY_VIDEOS` | `src/data/mockData.js`, `AppContext.jsx`, `HomePage.jsx`, `ExplorePage.jsx` | **DEVELOPMENT MODE FALLBACK** | Used when database returns empty video list. |
| `MOCK_RESTAURANTS` | `src/data/mockData.js`, `ExplorePage.jsx` | **DEVELOPMENT MODE FALLBACK** | Static restaurant list rendered on Explore page. |
| `MOCK_STORIES` / `MOCK_OFFERS` | `src/data/mockData.js`, `HomePage.jsx` | **DEVELOPMENT MODE FALLBACK** | Static top stories and offers carousel. |
| `Vikram Singh` | `RestaurantOpsPage.jsx`, `RiderOpsPage.jsx`, `LiveTrackingModal.jsx`, `scrollnomAdapter.js` | **DEVELOPMENT MODE FALLBACK** | Default fallback name for delivery rider partner. |
| `u1` / `u_demo` | `memoryStore.js`, `orderController.js`, `paymentController.js` | **TEST ONLY FALLBACK** | Fallback user ID when unauthenticated request reaches order API. |
| `restaurantId: 'r1'` | `RestaurantOpsPage.jsx` (line 32) | **HARDCODED DEV PARAMETER** | Hardcoded restaurant ID for creator collaboration fetch. |

---

## 4. Legacy Test Files & Unused Scripts

The following root-level test scripts exist from past build phases:
1. `server/test_backend.js`
2. `server/test_multi_user_isolation.js`
3. `server/test_phase3a_verification.js`
4. `server/test_phase4_auth.js`
5. `server/test_phase5_social.js`
6. `server/test_phase6_social_content.js`
7. `server/test_phase7_delivery.js`
8. `server/test_phase8a_google_razorpay.js`
9. `server/test_three_laptop_demo.js`

**Classification**: **TEST ONLY**. These files serve as validation test suites and should be preserved in `server/tests/` for regression testing.
