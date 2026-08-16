# Google Authentication Browser Failure Diagnostic Report

**Status**: CONFIRMED ROOT CAUSE  
**Date**: August 14, 2026  
**Application**: ScrollNom Web Application  

---

## 1. Exact Browser Reproduction
- **URL**: `http://localhost:3000`
- **Actions Taken**:
  1. Navigated to `http://localhost:3000`.
  2. Clicked "Sign In" / "My Account" to open the Authentication Modal (`AuthModal.jsx`).
  3. Clicked the "Continue with Google" button.
- **Observed UI Behavior**:
  - The UI displayed the error message: `"Google Authentication failed. Please try again."`
  - The authentication modal remained open.
  - Clicking the close button ("X") on the modal also failed to close the modal.

---

## 2. Firebase Error Code
- **Firebase Error Code**: `N/A` (No Firebase SDK error code such as `auth/popup-blocked` or `auth/unauthorized-domain` was thrown).

---

## 3. Firebase Error Message
- **Firebase Error Message**: `N/A` (The exception caught was a frontend JavaScript UI runtime error, not a Firebase Auth SDK exception).

---

## 4. Console Evidence
From browser DevTools console logs during reproduction:

```
[error] [GOOGLE AUTH ERROR] TypeError: setAuthModal is not a function
    at handleGoogleSignIn (http://localhost:3000/src/components/auth/AuthModal.jsx:21:7)
```

Also observed when clicking the Close ("X") button:
```
[error] TypeError: setAuthModal is not a function
    at onClick (http://localhost:3000/src/components/auth/AuthModal.jsx:52:24)
```

---

## 5. Network Evidence
- Frontend assets loaded over `http://localhost:3000/`.
- Backend API server running on `http://localhost:5000/`.
- No HTTP 4xx or 5xx network request failures occurred on Google OAuth or Firebase endpoints.

---

## 6. Firebase Provider Status
- **Google Provider Initialized**: **YES**
- Configured via `new GoogleAuthProvider()` in `src/config/firebase.js`.

---

## 7. Authorized Domain Status
- **Target Hostname**: `localhost` (Port 3000)
- **Status**: `localhost` is a standard default authorized domain in Firebase Console for project `scrollnom-c9ae6`.

---

## 8. Frontend Project ID
- **Firebase Project ID**: `scrollnom-c9ae6` (Loaded via `VITE_FIREBASE_PROJECT_ID` in `.env.local`).

---

## 9. Backend Project ID
- **Firebase Project ID**: `scrollnom-c9ae6` (Backend token verification decodes Firebase JWTs issued by project `scrollnom-c9ae6`).

---

## 10. Popup Behavior
- **Classification**: **Popup / OAuth flow executes, but UI state handler crashes**
- The popup / OAuth process is initiated via `signInWithPopup(auth, googleProvider)`. However, immediately following completion, `handleGoogleSignIn` in `AuthModal.jsx` calls `setAuthModal({ isOpen: false, ... })`. Because `setAuthModal` is undefined, JavaScript throws a `TypeError`, which triggers the `catch` block and sets the UI error message `"Google Authentication failed. Please try again."`.

---

## 11. Whether Firebase Authentication Itself Succeeds
- **YES**. Firebase `signInWithPopup` executes without throwing a Firebase SDK error. The failure occurs in the UI layer immediately after when attempting to close the auth modal.

---

## 12. Whether Backend Sync Is Ever Reached
- **YES**. `loginWithGoogle` in `AppContext.jsx` executes `fetch('${API_BASE}/users/sync')` with the Firebase ID token.

---

## 13. Confirmed Root Cause & Technical Details

### Classification: CONFIRMED ROOT CAUSE

### Diagnostic Analysis:
1. **Context Export Mismatch**:
   In `src/context/AppContext.jsx` (lines 407–437), `AppContext.Provider` exposes the following auth modal utilities in its `value` object:
   ```javascript
   authModal,
   promptAuth,
   closeAuthModal,
   ```
   Notice that `setAuthModal` is **NOT** exported in the provider context value.

2. **Component Usage Defect**:
   In `src/components/auth/AuthModal.jsx` (line 7):
   ```javascript
   const { authModal, setAuthModal, loginWithGoogle, loginWithEmail } = useApp();
   ```
   `AuthModal.jsx` attempts to destructure `setAuthModal` from `useApp()`, resulting in `setAuthModal` being `undefined`.

3. **Error Trigger Mechanism**:
   In `src/components/auth/AuthModal.jsx` (lines 16–28):
   ```javascript
   const handleGoogleSignIn = async () => {
     setLoading(true);
     setError('');
     try {
       await loginWithGoogle();
       setAuthModal({ isOpen: false, title: '', pendingDish: null }); // <-- Throws TypeError: setAuthModal is not a function
     } catch (err) {
       console.error('[GOOGLE AUTH ERROR]', err);
       setError('Google Authentication failed. Please try again.');
     } finally {
       setLoading(false);
     }
   };
   ```
   When `setAuthModal(...)` is called, JavaScript throws `TypeError: setAuthModal is not a function`. The `catch` block catches this `TypeError` and updates the modal state with `setError('Google Authentication failed. Please try again.')`, making it appear as if Google authentication failed when in fact it was a React context function binding error.

---

## Non-Invasive Recommended Fix (For Reference Only — No Code Modified)
To resolve this issue when approved:
In `src/components/auth/AuthModal.jsx`:
1. Destructure `closeAuthModal` instead of `setAuthModal` from `useApp()`:
   ```javascript
   const { authModal, closeAuthModal, loginWithGoogle, loginWithEmail } = useApp();
   ```
2. Replace calls to `setAuthModal({ isOpen: false, ... })` with `closeAuthModal()`.
