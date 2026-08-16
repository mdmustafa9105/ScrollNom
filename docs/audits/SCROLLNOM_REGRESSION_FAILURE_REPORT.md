# ScrollNom Critical Regression Audit — Failure Investigation Report

> [!IMPORTANT]
> **EMPIRICAL BROWSER & SOURCE CODE REGRESSION DIAGNOSIS**
> - **Audit Goal**: Diagnose real user-facing product failures reported during live browser usage.
> - **Rule Compliance**: Code was NOT modified or fixed during this investigation. Every finding documents exact reproduction steps, root causes, file locations, line numbers, network traces, and severities.

---

## 🚨 Summary of Confirmed Product Regressions

| Issue ID | Feature Area | Severity | Root Cause Summary |
| :--- | :--- | :--- | :--- |
| **REG-01** | **Username Onboarding** | **P0** | `syncFirebaseUser` auto-inserts default username into SQLite during login. `checkUsername` controller in `userController.js` does NOT pass `currentUserId` to `checkUsernameAvailable`, causing the API to flag the user's OWN newly inserted username as "already taken". |
| **REG-02** | **Deals & Offers Carousel** | **P1** | `MOCK_OFFERS` data is imported in `HomePage.jsx` but the UI carousel section rendering deals and special offers was dropped during Phase 6 feed refactoring. |
| **REG-03** | **Recommended Food & Fallback Feed** | **P1** | Home feed renders `null` when `followingFeed` is `[]`. Logged-out guests and new users with 0 follows see a blank empty space instead of trending/recommended dishes. |
| **REG-04** | **Hardcoded API URLs** | **P1** | `HomePage.jsx` and `ExplorePage.jsx` hardcode `http://localhost:5000/api` across 7 fetch calls instead of importing `API_BASE` from `src/config/api.js`, breaking LAN access on non-host laptops. |
| **REG-05** | **Google Auth Popup Fallback** | **P2** | In browser environments where popup windows are blocked, `signInWithPopup` falls back to dev mode UIDs without displaying a clear user message. |

---

## 🔍 Detailed Regression Diagnostics & Evidence

### 1. REGRESSION 01: Username Onboarding Failure ("Username not available")
- **Severity**: **P0 (Core Onboarding Flow Broken)**
- **Reproduction Steps**:
  1. Sign in with a new Google Account or Firebase user.
  2. The `UsernameOnboardingModal` opens with auto-suggested handle (e.g. `mustafa`).
  3. Observe error: `"This username is already taken. Try another!"` and submission button disabled.
- **Root Cause & Code Evidence**:
  - In [server/services/userService.js](file:///d:/ScrollNom/server/services/userService.js#L26-L48), `syncFirebaseUser` creates a user row in SQLite immediately upon login with `username = baseName` (e.g. `mustafa`).
  - In [server/controllers/userController.js](file:///d:/ScrollNom/server/controllers/userController.js#L15-L29):
    ```javascript
    export const checkUsername = async (req, res, next) => {
      const { username } = req.query;
      const result = await checkUsernameAvailable(username); // Line 24: Missing currentUserId parameter!
      res.json({ success: true, data: result });
    };
    ```
  - Because `currentUserId` is not passed to `checkUsernameAvailable(username, currentUserId)`, the query `SELECT id FROM users WHERE LOWER(username) = ?` finds the user's *own* row created during sync and flags `available: false, reason: 'Username is already taken'`.
- **Recommended Fix**:
  1. Update `checkUsername` in `userController.js` to extract `currentUserId = req.user?.uid` (from optional/requireAuth middleware) and pass it to `checkUsernameAvailable(username, currentUserId)`.
  2. Alternatively, in `syncFirebaseUser`, leave `username` null or temporary until user completes onboarding.

---

### 2. REGRESSION 02: Deals & Offers Carousel Disappearance
- **Severity**: **P1 (Major Product Section Missing)**
- **Reproduction Steps**:
  1. Open ScrollNom Home Page (`/`).
  2. Scroll through top section under Stories.
  3. Observe: Deals, promo banners, and discount offers (`MOCK_OFFERS`) are completely absent.
- **Root Cause & Code Evidence**:
  - In [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L3): `MOCK_OFFERS` is imported:
    ```javascript
    import { MOCK_STORIES, MOCK_OFFERS, MOCK_NOMMLY_VIDEOS, MOCK_RESTAURANTS } from '../../data/mockData';
    ```
  - In `HomePage.jsx` JSX render (lines 280-490), `{MOCK_STORIES.map(...)}` and `{categories.map(...)}` are rendered, but `{MOCK_OFFERS.map(...)}` is NEVER called anywhere in `HomePage.jsx`.
  - Data exists in [src/data/mockData.js](file:///d:/ScrollNom/src/data/mockData.js#L54-L80) but was unmounted during Phase 6 personalized feed integration.
- **Recommended Fix**: Restore the Deals & Offers banner section in `HomePage.jsx` below the Stories bar.

---

### 3. REGRESSION 03: Logged Out Guest & New User Blank Home Feed
- **Severity**: **P1 (Major UX Failure for New / Unauthenticated Users)**
- **Reproduction Steps**:
  1. Open ScrollNom in Incognito / Logged Out state.
  2. Observe Home Page under Category pills.
- **Expected Outcome**: Public food feed, recommended dishes, or trending food reels display.
- **Actual Outcome**: Blank empty space (`null`) renders under Category pills.
- **Root Cause & Code Evidence**:
  - In [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L29-L35):
    ```javascript
    if (user.isLoggedIn) {
      const feedRes = await fetch('http://localhost:5000/api/feed/following', { headers });
      ...
    }
    ```
  - Unauthenticated users skip feed fetching, leaving `followingFeed = []`.
  - In [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L340-L438):
    ```javascript
    {feedLoading ? (...) : followingFeed.length > 0 ? (...) : null}
    ```
  - When `followingFeed` is empty, `null` is rendered instead of displaying trending food or fallback content.
- **Recommended Fix**:
  1. Remove `if (user.isLoggedIn)` guard and allow unauthenticated guests to fetch public/suggested feed items (`GET /api/feed/following`).
  2. Update feed rendering condition so when `followingFeed` is empty, it renders fallback recommended dishes or trending Nommly content cards.

---

### 4. REGRESSION 04: Hardcoded `localhost:5000` Breaking Three-Laptop LAN Access
- **Severity**: **P1 (Multi-Laptop LAN Access Failure)**
- **Reproduction Steps**:
  1. Open `http://<LAN_IP>:3000/` on Laptop 1, 2, or 3 connected over local Wi-Fi.
  2. Click Home feed or search in Explore tab.
  3. Inspect Browser DevTools Console & Network tab.
- **Actual Outcome**: Network requests fail with `ERR_CONNECTION_REFUSED` because the client attempts to connect to `http://localhost:5000` instead of the host machine's IP.
- **Root Cause & Code Evidence**:
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L30): `fetch('http://localhost:5000/api/feed/following')`
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L38): `fetch('http://localhost:5000/api/feed/suggested')`
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L97): `fetch('http://localhost:5000/api/content/.../like')`
  - [src/pages/Home/HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L134): `fetch('http://localhost:5000/api/content/.../save')`
  - [src/pages/Explore/ExplorePage.jsx](file:///d:/ScrollNom/src/pages/Explore/ExplorePage.jsx#L33): `fetch('http://localhost:5000/api/users/search')`
- **Recommended Fix**: Replace all hardcoded `http://localhost:5000/api` strings in `HomePage.jsx` and `ExplorePage.jsx` with `API_BASE` imported from `src/config/api.js`.

---

## 📊 Database Content & API Status Audit

- **SQLite Database Path**: [scrollnom.db](file:///d:/ScrollNom/scrollnom.db)
- **Database Status**: Intact and persistent across server restarts.
- **Table Inventory & Row Counts**:
  - `users`: 29 rows
  - `content`: 5 rows (Nommly food video reels)
  - `follows`: 5 rows
  - `content_likes`: 2 rows
  - `content_saves`: 1 row
  - `order_intents`: 2 rows
  - `orders`: 6 rows
  - `deliveries`: 11 rows
  - `delivery_events`: 163 rows

---

## 📌 Summary Recommendation Matrix

| Issue ID | Severity | Affected Files | Fix Strategy Summary |
| :--- | :--- | :--- | :--- |
| **REG-01** | **P0** | `server/controllers/userController.js` | Extract `currentUserId` in `checkUsername` and pass to `checkUsernameAvailable`. |
| **REG-02** | **P1** | `src/pages/Home/HomePage.jsx` | Re-mount `MOCK_OFFERS` deals & promos carousel below Stories bar. |
| **REG-03** | **P1** | `src/pages/Home/HomePage.jsx` | Allow guests to fetch public feed and render fallback recommended food when `followingFeed` is empty. |
| **REG-04** | **P1** | `src/pages/Home/HomePage.jsx`, `ExplorePage.jsx` | Replace hardcoded `http://localhost:5000/api` with `API_BASE` from `src/config/api.js`. |

---

*Regression Investigation complete. No code changes were made during this audit.*
