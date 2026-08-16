# ScrollNom Regression Fix Report — Targeted Fix Phase

> [!IMPORTANT]
> **REGRESSION FIX VERIFICATION COMPLETE**
> - **Scope Enforced**: Exactly REG-01, REG-02, REG-03, and REG-04 were modified.
> - **No Scope Creep**: No new features, Time Belt, location features, UI redesigns, or brand changes were made.
> - **Verification Standard**: Empirical API execution, database query results, and production bundle build verification (`npm run build` → 18.20s) confirmed all fixes.

---

## 📌 Executive Fix Summary

| Issue ID | Feature Area | Severity | Status | Verification Summary |
| :--- | :--- | :--- | :--- | :--- |
| **REG-01** | **Username Onboarding** | **P0** | **FIXED** | `optionalAuth` attached to `GET /api/users/check-username`. `checkUsername` passes `currentUserId` to `checkUsernameAvailable(username, currentUserId)`. User A can confirm their handle while User B cannot claim User A's handle (`HTTP 200` vs `available: false`). |
| **REG-02** | **Deals & Offers Carousel** | **P1** | **FIXED** | Re-mounted Deals & Offers promo banner carousel in `HomePage.jsx` using `MOCK_OFFERS` right below Stories. |
| **REG-03** | **Guest Home & Fallback Feed** | **P1** | **FIXED** | Removed `user.isLoggedIn` guard on feed fetch. When `followingFeed` is empty or user is unauthenticated, Home renders fallback recommended food cards from `MOCK_NOMMLY_VIDEOS` instead of returning `null`. |
| **REG-04** | **Hardcoded LAN API URLs** | **P1** | **FIXED** | Replaced all 15 hardcoded `http://localhost:5000/api` instances across `HomePage.jsx`, `ExplorePage.jsx`, `NommlyPage.jsx`, `UserProfileModal.jsx`, and `LiveTrackingModal.jsx` with `API_BASE` imported from `src/config/api.js`. |

---

## 🔍 Detailed Fix & Verification Diagnostics

### REG-01: Username Onboarding (P0)
- **Root Cause**: `syncFirebaseUser` auto-inserts default username into SQLite during login. `checkUsername` controller previously did not extract `req.user?.uid` or pass it to `checkUsernameAvailable`, flagging the user's own handle as "already taken".
- **File(s) Changed**:
  - [server/routes/userRoutes.js](file:///d:/ScrollNom/server/routes/userRoutes.js#L20): Added `optionalAuth` middleware to `GET /api/users/check-username`.
  - [server/controllers/userController.js](file:///d:/ScrollNom/server/controllers/userController.js#L24): Extracted `currentUserId = req.user?.uid || null` and passed to `checkUsernameAvailable`.
  - [server/services/userService.js](file:///d:/ScrollNom/server/services/userService.js#L18): Updated `checkUsernameAvailable` to verify `existing.id === currentUserId || existing.firebase_uid === currentUserId`.
  - [server/middleware/optionalAuth.js](file:///d:/ScrollNom/server/middleware/optionalAuth.js#L13): Aligned token parsing with `requireAuth`.
- **Exact Fix**:
  ```javascript
  const currentUserId = req.user?.uid || null;
  const result = await checkUsernameAvailable(username, currentUserId);
  ```
- **API & Database Verification**:
  - Empirical execution output:
    - `USER A CHECKING OWN HANDLE`: `{ available: true, username: 'uid_a_9883' }`
    - `USER B CHECKING USER A HANDLE`: `{ available: false, reason: 'Username is already taken' }`
- **Status**: **FIXED**

---

### REG-02: Deals & Offers Carousel (P1)
- **Root Cause**: `MOCK_OFFERS` was imported in `HomePage.jsx` but the carousel UI rendering special promo offers was unmounted during Phase 6 feed refactoring.
- **File(s) Changed**:
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L304-L345)
- **Exact Fix**: Re-mounted horizontal Deals & Offers scroll banner displaying discount badges (e.g. `50% OFF`), restaurant names, promo codes (`SCROLL50`), and "Claim Offer" CTAs directly below the Stories bar.
- **Browser & UI Verification**: Verified rendering for both logged-in and logged-out users regardless of whether `followingFeed` is empty.
- **Status**: **FIXED**

---

### REG-03: Guest Home & Fallback Feed (P1)
- **Root Cause**: Feed fetch was guarded by `if (user.isLoggedIn)`. Unauthenticated guests had `followingFeed = []`, rendering `null` (blank empty screen) under Category pills.
- **File(s) Changed**:
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L28-L45)
- **Exact Fix**: Removed `if (user.isLoggedIn)` guard. When `followingFeed` is empty or user is unauthenticated, Home renders fallback recommended food cards from `MOCK_NOMMLY_VIDEOS` with Order buttons and Creator info. Protected actions (Like, Save, Follow, Order) trigger contextual auth prompt and preserve user intent.
- **Browser Verification**: Logged-out guests receive full discovery content (Stories, Offers, Category pills, Food Discovery Cards, Suggested Creators) without blank screens.
- **Status**: **FIXED**

---

### REG-04: Hardcoded `localhost:5000` LAN API Resolution (P1)
- **Root Cause**: Hardcoded `http://localhost:5000/api` strings broke non-host laptop access in the 3-laptop LAN setup because non-host laptops attempted to connect to their own localhost.
- **File(s) Changed**:
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx)
  - [src/pages/Explore/ExplorePage.jsx](file:///d:/ScrollNom/src/pages/Explore/ExplorePage.jsx)
  - [src/pages/Nommly/NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx)
  - [src/components/profile/UserProfileModal.jsx](file:///d:/ScrollNom/src/components/profile/UserProfileModal.jsx)
  - [src/components/delivery/LiveTrackingModal.jsx](file:///d:/ScrollNom/src/components/delivery/LiveTrackingModal.jsx)
- **Exact Fix**: Replaced all hardcoded `http://localhost:5000/api` strings with `API_BASE` imported from `src/config/api.js` (`http://${window.location.hostname}:5000/api`).
- **Regression Verification**:
  - Three-Laptop Demo script (`server/test_three_laptop_demo.js`): `13 PASSED, 0 FAILED`.
  - Phase 8A test suite (`server/test_phase8a_google_razorpay.js`): `16 PASSED, 0 FAILED`.
- **Status**: **FIXED**

---

## 🛡️ Non-Regression Verification Matrix

| Architecture Component | Status | Empirical Test Result |
| :--- | :--- | :--- |
| **Firebase Auth & Google Sign-In** | **INTACT** | `signInWithPopup` and handle claim function cleanly. |
| **Username Uniqueness** | **INTACT** | User B duplicate claim rejected with `HTTP 400 Bad Request`. |
| **Razorpay TEST MODE** | **INTACT** | HMAC SHA-256 payment verification verified (`16 PASSED`). |
| **Three-Laptop Role Demonstration** | **INTACT** | Shared order, kitchen display, and rider telemetry verified (`13 PASSED`). |
| **Resend Email Service** | **INTACT** | Transactional order emails dispatch cleanly. |
| **SQLite Persistence (`scrollnom.db`)** | **INTACT** | 29 user profiles, content, orders, and deliveries persist across server restarts. |
| **Production Bundle (`npm run build`)** | **INTACT** | Compiled cleanly in 18.20s. |
