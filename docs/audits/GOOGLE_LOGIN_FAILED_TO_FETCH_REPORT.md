# ScrollNom Google Sign In "Failed to Fetch" Diagnostic Report

**Status**: CONFIRMED ROOT CAUSE IDENTIFIED  
**Date**: August 15, 2026  
**Target Environment**: ScrollNom Web Application (`http://localhost:3000`)  
**Backend Host**: `http://localhost:5000/api`  

---

## 1. Browser Reproduction
- **URL**: `http://localhost:3000`
- **Actions Taken**:
  1. Navigated to `http://localhost:3000`.
  2. Clicked **Sign In** / **My Account** button to open the authentication modal (`AuthModal.jsx`).
  3. Clicked **Continue with Google** button.
  4. Google OAuth popup opened via Firebase Web SDK (`signInWithPopup(auth, googleProvider)`).
  5. Authentication succeeded on Google/Firebase side and popup closed.
- **Observed Behavior**:
  - UI Toast error notification displayed: `"Google Sign In failed: Failed to fetch"`
  - Auth Modal error message displayed: `"Google Authentication failed. Please try again."`
  - Auth modal remained open.

---

## 2. Exact Failing Request
- **Endpoint**: `POST /api/users/sync`
- **Full URL**: `http://localhost:5000/api/users/sync`
- **HTTP Method**: `POST`
- **Headers**:
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer <MASKED_FIREBASE_ID_TOKEN>`

---

## 3. Network Request Details & Network Error
- **Browser Network Error**: `net::ERR_CONNECTION_REFUSED`
- **HTTP Status Code**: `N/A` (No HTTP response was returned because TCP connection could not be established).
- **Request Body Shape**: Empty JSON body `{}` (Authentication details sent in `Authorization` header).
- **Response Body**: None.
- **Initiator**: `fetch` in `src/context/AppContext.jsx:194`.

---

## 4. Browser Console Error
- **Underlying JavaScript Error**: `TypeError: Failed to fetch`
- **Stack Trace**:
  ```text
  TypeError: Failed to fetch
      at loginWithGoogle (http://localhost:3000/src/context/AppContext.jsx:194:25)
      at handleGoogleSignIn (http://localhost:3000/src/components/auth/AuthModal.jsx:20:7)
  ```
- **Originating File**: `src/context/AppContext.jsx`
- **Originating Line**: Line 194 (`const res = await fetch('${API_BASE}/users/sync', ...);`)

---

## 5. Runtime API_BASE Value
- **Config File**: [src/config/api.js](file:///d:/ScrollNom/src/config/api.js#L12-L13)
- **Runtime Resolution Logic**:
  ```javascript
  const getHostname = () => {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      return window.location.hostname;
    }
    return 'localhost';
  };
  export const API_BASE = `http://${getHostname()}:5000/api`;
  ```
- **Runtime Value Used by Browser**: `http://localhost:5000/api`
- **Validation**: Port `5000` and host `localhost` match the backend specification, but no backend process is listening on port `5000`.

---

## 6. Backend Availability Check (`/api/health`)
- **Target Health URL**: `http://localhost:5000/api/health`
- **Result**: **FAILED** (`net::ERR_CONNECTION_REFUSED` / `TypeError: Failed to fetch`)
- **Port Inspection**:
  - Executed `netstat -ano | findstr :5000`.
  - Output: Empty (No process listening on port `5000`).
  - Executed `netstat -ano | findstr :3000`.
  - Output: `TCP 0.0.0.0:3000 LISTENING` (Vite dev server active).
- **Conclusion**: The backend server application (`server/index.js`) is offline.

---

## 7. Backend Terminal Log Result
- **Classification**: **CASE A (Browser sends request → Backend receives nothing)**
- **Detail**: Because the Express backend process on port `5000` was not running, the request never reached any backend server or route handler. The browser TCP connection attempt failed immediately with `net::ERR_CONNECTION_REFUSED`.

---

## 8. Firebase Auth Result
- **Firebase User Obtained**: **YES**
- **Firebase UID Available**: **YES** (e.g. `result.user.uid` resolved successfully)
- **ID Token Generated**: **YES** (`await fbUser.getIdToken()` resolved to valid JWT string)

---

## 9. Authorization Header Presence
- **Header Attached**: **YES**
- **Format**: `Authorization: Bearer <MASKED_FIREBASE_ID_TOKEN>`
- **Verification**: Verified in `AppContext.jsx` line 198:
  ```javascript
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  ```

---

## 10. CORS Assessment
- **Backend CORS Spec**: Verified in [server/index.js](file:///d:/ScrollNom/server/index.js#L22-L25):
  ```javascript
  app.use(cors({
    origin: true, // Allows reflective origin match for localhost:3000 & LAN IPs
    credentials: true
  }));
  ```
- **Console Log Result**: **NO CORS policy error reported**.
- **Conclusion**: CORS policy is correctly configured to allow `http://localhost:3000`. The error is purely network socket level connection refusal because port 5000 is not bound to a running server.

---

## 11. Backend Auth Middleware Compatibility
- **Target Endpoint**: `POST /api/users/sync`
- **Route Specification**: Verified in [server/routes/userRoutes.js](file:///d:/ScrollNom/server/routes/userRoutes.js#L26):
  ```javascript
  router.post('/users/sync', requireAuth, syncUserOnAuth);
  ```
- **Requirement**: Requires `requireAuth` middleware.
- **Request Alignment**: The frontend sends `Authorization: Bearer <token>`, which directly satisfies `requireAuth` requirements in [server/middleware/requireAuth.js](file:///d:/ScrollNom/server/middleware/requireAuth.js#L6-L15).

---

## 12. Three-Laptop & Role Assessment
- **Environment Behavior**:
  - `http://localhost:3000` (Customer): Fails with `Failed to fetch` when backend server is offline.
  - `http://<LAN_IP>:3000` (LAN Customer): Fails with `Failed to fetch` when backend server is offline.
  - Restaurant & Rider interfaces: Also rely on `http://<host>:5000/api`.
- **Conclusion**: Issue is global across all roles and client machines whenever the server process (`node server/index.js`) on port 5000 is inactive.

---

## 13. Exact Root Cause Classification

**A. Backend unavailable**

### Diagnostic Explanation:
1. `package.json` script `"dev"` is currently defined as `"vite"`.
2. Running `npm run dev` starts only the Vite frontend development server on `http://localhost:3000`.
3. The Express backend API server ([server/index.js](file:///d:/ScrollNom/server/index.js)) listening on `0.0.0.0:5000` is **NOT** started automatically by `npm run dev`.
4. When Google authentication completes, `AppContext.jsx` executes `fetch('http://localhost:5000/api/users/sync')`.
5. Because no process is listening on port `5000`, the browser receives `net::ERR_CONNECTION_REFUSED`, throwing `TypeError: Failed to fetch`.
6. The catch block in `AppContext.jsx` formats the error message as `"Google Sign In failed: " + err.message`, yielding `"Google Sign In failed: Failed to fetch"`.

---

## 14. Affected Files
- [package.json](file:///d:/ScrollNom/package.json) (Defines `npm run dev` script)
- [server/index.js](file:///d:/ScrollNom/server/index.js) (Express backend entry point on port 5000)
- [src/context/AppContext.jsx](file:///d:/ScrollNom/src/context/AppContext.jsx#L194) (Executes `fetch` to backend sync endpoint)

---

## 15. Recommended Minimal Fix (For Reference Only — NO CODE MODIFIED)

To resolve this issue upon approval without modifying any core application logic:

1. **Option A (Concurrent Dev Script in package.json)**:
   Update `package.json` scripts to run both Vite frontend and Express server concurrently (e.g. using `concurrently` or a combined node script):
   ```json
   "dev:server": "node server/index.js",
   "dev": "concurrently \"vite\" \"node server/index.js\""
   ```

2. **Option B (Separate Terminal Process)**:
   Run the backend process explicitly in a separate terminal window:
   ```bash
   node server/index.js
   ```

No code, Firebase settings, database, or UI components were changed during this audit.
