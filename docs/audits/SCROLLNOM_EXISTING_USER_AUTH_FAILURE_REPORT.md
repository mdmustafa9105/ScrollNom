# ScrollNom Critical Auth Identity Investigation Report

> [!IMPORTANT]
> **CONFIRMED ROOT CAUSE DIAGNOSIS**
> - **Investigation Target**: Existing Google account (`mustafastudy9105@gmail.com`) treated as a new user and prompted with `UsernameOnboardingModal`.
> - **Rule Compliance**: Code and database records were **NOT modified** during this investigation. No accounts were deleted. No Firebase settings were reset.

---

## 📌 Executive Summary

When signing into ScrollNom with the Google account `mustafastudy9105@gmail.com`, the application triggers the "new username" onboarding flow (`UsernameOnboardingModal`).

Our empirical browser trace, database audit, and code investigation identified **TWO CONFIRMED ROOT CAUSES** that combine to produce this failure:

1. **Mock Firebase Popup Catch Block (Primary Trigger in Dev Mode)**: `VITE_FIREBASE_API_KEY` is not defined in `.env`. When the browser attempts `signInWithPopup(auth, googleProvider)`, real OAuth popup fails due to placeholder credentials. `loginWithGoogle` in `AppContext.jsx` catches the error and generates a new random `mockUid` (`fb_uid_google_<timestamp>`) and empty username `""` on EVERY login attempt, explicitly calling `setShowUsernameModal(true)`.
2. **Backend Lookup Missing Email Linking**: In `server/services/userService.js`, `syncFirebaseUser` queries SQLite strictly by `WHERE firebase_uid = ?`. It does not check `WHERE email = ?`. If a user record already exists in `scrollnom.db` under `mustafa@scrollnom.com` (or if a user logs in with a Google UID different from their seed UID `u1`), the backend treats the Google UID as a new user and creates a duplicate profile.

---

## 🔍 Detailed Empirical Step-by-Step Diagnostics

### 1. Database Audit Results (`scrollnom.db`)
- **Database File Path**: `d:\ScrollNom\scrollnom.db` (Verified single database file used by backend).
- **Existing User Records**:
  - `id: "u1"`, `firebase_uid: "u1...[REDACTED]"`, `email: "mustafa@scrollnom.com"`, `username: "mustafa"`, `created_at: "2026-08-14 06:27:07"`.
  - Account `mustafastudy9105@gmail.com` **did NOT exist** in `scrollnom.db` prior to Google sign-in attempts.

---

### 2. Frontend Firebase Configuration Audit (`src/config/firebase.js`)
- [src/config/firebase.js](file:///d:/ScrollNom/src/config/firebase.js#L14-L24):
  ```javascript
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSy_MockFirebaseApiKeyForScrollNomDev',
    ...
  };
  export const isMockFirebase = !import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_FIREBASE_API_KEY.includes('Mock');
  ```
- **Environment Status**: `.env` and `.env.local` do not contain `VITE_FIREBASE_API_KEY`.
- **Result**: `isMockFirebase` evaluates to `true`.

---

### 3. Authentication Lifecycle Trace & Catch Block Execution
- When `loginWithGoogle()` is invoked in [src/context/AppContext.jsx](file:///d:/ScrollNom/src/context/AppContext.jsx#L180-L241):
  1. `signInWithPopup(auth, googleProvider)` is called.
  2. Because the API key is a placeholder, `signInWithPopup` throws a Firebase Auth exception.
  3. Control transfers to the `catch (err)` block (line 218):
     ```javascript
     } catch (err) {
       console.warn('[GOOGLE POPUP FALLBACK]', err);
       const mockUid = `fb_uid_google_${Date.now()}`;
       const mockEmail = `google_dev_${Date.now()}@gmail.com`;
       
       setUser({
         id: mockUid,
         firebaseUid: mockUid,
         username: '',
         handle: '',
         isLoggedIn: true, ...
       });

       setShowUsernameModal(true); // <--- FORCES ONBOARDING MODAL ON EVERY LOGIN
     }
     ```
  4. On every click of "Continue with Google", a new `mockUid` with `username = ""` is created, opening the onboarding modal.

---

### 4. Backend User Sync Flow Trace (`server/services/userService.js`)
- When a real Google token is sent to `POST /api/users/sync`:
  - `syncFirebaseUser` in [server/services/userService.js](file:///d:/ScrollNom/server/services/userService.js#L26-L30):
    ```javascript
    export const syncFirebaseUser = async (uid, email, displayName) => {
      let user = await dbGet('SELECT * FROM users WHERE firebase_uid = ?', [uid]);
      if (user) {
        return user;
      }
      ...
    ```
- **Issue**: `syncFirebaseUser` ONLY checks `firebase_uid = ?`.
- If an existing user was created with seed UID `u1` and email `mustafa@scrollnom.com`, signing in with `mustafastudy9105@gmail.com` produces a new Google UID.
- The lookup returns `undefined`, causing `syncFirebaseUser` to insert a new row instead of linking the account by verified email or recognizing the existing profile.

---

## 📊 Identity Matrix

| Identity Property | Seed Record (`u1`) | Real Google Auth | Dev Fallback Catch Block |
| :--- | :--- | :--- | :--- |
| **Email** | `mustafa@scrollnom.com` | `mustafastudy9105@gmail.com` | `google_dev_<timestamp>@gmail.com` |
| **Firebase UID** | `u1` | `google_uid_<REDACTED>` | `fb_uid_google_<timestamp>` |
| **ScrollNom Username** | `@mustafa` | Auto-generated (`@mustafastudy9105`) | `""` (Empty string) |
| **Onboarding Triggered?** | No | If handle claim incomplete | **Yes (Always triggered)** |

---

## 🎯 CONFIRMED ROOT CAUSE

1. **Primary Cause**: `VITE_FIREBASE_API_KEY` is missing from `.env`, causing Google `signInWithPopup` to fail and fallback to generating a transient `mockUid` with `username: ''`, which explicitly sets `showUsernameModal = true` on every login attempt.
2. **Secondary Cause**: `syncFirebaseUser` in `userService.js` queries exclusively by `firebase_uid = ?` without email linking fallback. If an existing profile exists under a different UID/email, the backend creates a duplicate user record and marks it as a new registration.

---

## 📌 Recommended Fix Strategy (For Next Stage)

1. **Configure Real Firebase API Credentials in `.env.local`**:
   Add valid `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, and `VITE_FIREBASE_PROJECT_ID` to `.env.local` so `signInWithPopup` completes real Google OAuth without falling back to mock UIDs.
2. **Improve Account Linking in `syncFirebaseUser`**:
   Update `syncFirebaseUser` in `server/services/userService.js` to search by `firebase_uid` FIRST, and if not found, search by verified `email`. If an email match exists, link the existing account by updating its `firebase_uid`.
3. **Prevent Fallback Onboarding Loop in `AppContext.jsx`**:
   In `loginWithGoogle` catch block, if in mock dev mode, check if a mock user already exists in `sessionStorage` or database before generating a new `mockUid`.

---

*Investigation complete. No code or database records were modified.*
