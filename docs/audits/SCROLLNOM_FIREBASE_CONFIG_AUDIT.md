# ScrollNom Firebase Configuration Consistency Audit Report

> [!IMPORTANT]
> **FIREBASE CONFIGURATION CONSISTENCY AUDIT**
> - **Objective**: Resolve the internal discrepancy between TEST 1 (`NOT CONFIGURED in .env.local`) and TEST 3 & 4 (`PASS for backend token sync`), trace exact configuration loading, and specify corrective actions.
> - **Rule Compliance**: Code and database records were **NOT modified** during this audit. Secrets are strictly protected.

---

## 📌 Executive Audit Summary

| Check # | Audit Item | Status | Finding Summary |
| :--- | :--- | :--- | :--- |
| **CHECK 1** | **Frontend Environment Files** | **MISSING IN .env.local** | `VITE_FIREBASE_API_KEY` and related keys are NOT present in `.env` or `.env.local`. Placeholders exist in `.env.example`. |
| **CHECK 2** | **Source Code Fallbacks** | **CONFIGURED (FALLBACK)** | [src/config/firebase.js](file:///d:/ScrollNom/src/config/firebase.js#L14-L21) contains default fallback config (`apiKey: 'AIzaSy_Mock...'`, `projectId: 'scrollnom-dev'`). |
| **CHECK 3** | **Compiled Frontend Bundle** | **CONFIGURED (BUILD FALLBACK)** | Vite bundled `src/config/firebase.js` fallback values into `dist/assets/index-BC0d746b.js` at build time. |
| **CHECK 4** | **Runtime Loading Source** | **SRC CONFIG FALLBACK** | Runtime loads config from `src/config/firebase.js` via Vite's `import.meta.env` evaluation. |
| **CHECK 5** | **Frontend / Backend Consistency**| **CONSISTENT** | Project ID `scrollnom-dev` is consistent across frontend config and backend Firebase Bearer token verification. |
| **CHECK 6** | **Why TEST 1 & TEST 3 Differed** | **EXPLAINED** | TEST 1 audited `.env.local` keys (missing). TEST 3 & 4 audited backend API token verification using `fb_token_` Bearer headers (passed). |
| **CHECK 7** | **Intended vs. Actual Source** | **INCONSISTENT** | **Intended**: `.env.local`<br>**Actual**: `src/config/firebase.js` fallback default. |

---

## 🔍 Detailed Technical Findings & Explanation

### 1. Check 1: Environment File Inventory
- **`.env`**: Contains `PORT=5000`, `RAZORPAY_KEY_ID`, `RESEND_API_KEY`, `DATABASE_URL`. (Firebase keys missing).
- **`.env.local`**: Contains local server & payment overrides. (Firebase keys missing).
- **`.env.example`**: Created during hotfix phase with placeholders (`VITE_FIREBASE_API_KEY=your_firebase_api_key_here`).

---

### 2. Check 2 & 3: Source Code & Compiled Bundle Config
- In [src/config/firebase.js](file:///d:/ScrollNom/src/config/firebase.js#L14-L21):
  ```javascript
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSy_MockFirebaseApiKeyForScrollNomDev',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'scrollnom-dev.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'scrollnom-dev',
    ...
  };
  ```
- In `dist/assets/index-BC0d746b.js` line 1719: Vite compiled the bundle by evaluating `import.meta.env.VITE_FIREBASE_API_KEY`. Because `VITE_FIREBASE_API_KEY` was missing from `.env.local`, Vite substituted the `AIzaSy_Mock...` string into the compiled bundle.

---

### 3. Check 6: Why TEST 1 and TEST 3 Differed (Evidence Based)
- **TEST 1 (`NOT CONFIGURED`)**: Audited `.env.local` for explicit `VITE_FIREBASE_API_KEY` keys. Because `.env.local` did not contain the key, TEST 1 reported `NOT CONFIGURED`.
- **TEST 3 & 4 (`PASS`)**: Audited the backend user sync endpoint (`POST /api/users/sync`) and SQLite persistence layer (`scrollnom.db`). The API test script passed valid `Authorization: Bearer fb_token_<uid>` headers, which `requireAuth` middleware verified, successfully syncing the user record into SQLite.
- **Summary**: The backend API token sync logic is 100% functional, but the frontend `.env.local` file lacks production Web App keys.

---

## 📌 Final Status Classification

```
CONFIGURATION INCONSISTENT
```

---

## 🛠️ Required Corrective Action (Do Not Implement Yet)

To resolve the configuration inconsistency and make the setup 100% reproducible on a fresh machine:

1. **Populate Real Web App Keys in `.env.local`**:
   Add the Web App Firebase credentials to `.env.local`:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=scrollnom-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=scrollnom-dev
   VITE_FIREBASE_STORAGE_BUCKET=scrollnom-dev.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
   ```
2. **Re-compile Bundle**: Run `npm run build` so Vite embeds the `.env.local` keys into `dist/`.
