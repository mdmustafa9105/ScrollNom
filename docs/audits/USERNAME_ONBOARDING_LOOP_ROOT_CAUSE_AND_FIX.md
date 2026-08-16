# ScrollNom Username Onboarding Loop Audit & Root Cause Analysis

**Audit Identifier:** AUDIT-ONBOARDING-LOOP-2026-08  
**Date:** August 15, 2026  
**Target Flow:** New User Authentication → Username Onboarding → Step Transition → Profile Completion  
**System:** ScrollNom Web Application (Vite + React + Express + SQLite + Firebase Auth)  
**Audit Status:** **ROOT CAUSE CONFIRMED & FIXED**  

---

## 1. Exact Reproduction Summary

- **Failure Scenario:** Upon completing authentication as a new Google or Email user, the `UsernameOnboardingModal` displays Step 1 ("Choose your @username"). The user types or accepts a handle, live availability reports `Available ✓`, and the user clicks **Continue**. Instead of advancing to Step 2 ("Complete Your Profile"), Step 1 reappears immediately with the handle input and Continue button. The user is trapped in an infinite loop on Step 1.
- **Affected User Types:** New Google OAuth users, New Email/Password signup users, and test users across independent devices/accounts.

---

## 2. Technical Investigation & Database Trace

### 2.1 Database & Persistence Layer Check
Before applying any fix, an automated trace script (`test_reproduction_and_trace.js`) executed the backend API and SQLite database sequence:

1. **Before Claim:** SQLite record created via `POST /api/users/sync` with `firebase_uid`.
   `{"id": "fb_uid_repro_test_1786772713001", "username": "repro_test_1786"}`
2. **Claim Request:** `POST /api/users/claim-username` with payload `{"username": "testuser_5821"}`.
   HTTP Status: `200 OK`
   Response: `{"success": true, "data": {"user": {"username": "testuser_5821"}}}`
3. **After Claim:** Re-queried SQLite database row.
   `{"id": "fb_uid_repro_test_1786772713001", "username": "testuser_5821"}`
4. **Re-Sync:** `POST /api/users/sync` returned `needsUsername: false` and `username: "testuser_5821"`.

**Database Verdict:** **PERSISTENCE LAYER SUCCESSFUL.** The backend and SQLite database correctly update, persist, and return the claimed username.

---

## 3. Proven Root Cause Analysis

The loop was caused by **two interacting React state/effect defects**:

### Root Cause 1: React Effect Dependency Loop in `UsernameOnboardingModal.jsx`
- **File:** `src/components/auth/UsernameOnboardingModal.jsx`
- **Defective Code:**
  ```javascript
  useEffect(() => {
    if (isOpen) {
      setStep(1); // <-- RESETS STEP TO 1
      ...
    }
  }, [isOpen, user]); // <-- DEPENDS ON `user` CONTEXT OBJECT
  ```
- **Execution Mechanism:**
  1. User clicks **Continue** in Step 1.
  2. `handleClaimUsername` successfully sends `POST /api/users/claim-username` to the server.
  3. On success, `handleClaimUsername` calls `setUser(prev => ({ ...prev, username: newUsername }))` and `setStep(2)`.
  4. Updating `setUser` mutates the `user` reference in `AppContext`.
  5. Because `user` was included in `useEffect` dependency array `[isOpen, user]`, React re-ran the effect after `user` state updated.
  6. The effect executed `if (isOpen) setStep(1)`, immediately overwriting `step = 2` back to `step = 1`!
  7. Result: The modal was forced back to Step 1 on every Continue attempt.

### Root Cause 2: Missing Component Mount in `AppLayout.jsx`
- **File:** `src/components/layout/AppLayout.jsx`
- **Defective Code:** `<UsernameOnboardingModal />` was omitted from the global layout modal stack in `AppLayout.jsx`, preventing global onboarding triggers from rendering at top-level.

---

## 4. Implemented Fix

### 4.1 `UsernameOnboardingModal.jsx` Fix
Modified the modal open effect to trigger **only when `isOpen` transitions from `false` to `true`**, removing `user` from the effect dependency array:

```javascript
// Reset & Auto-suggest on modal open
useEffect(() => {
  if (isOpen) {
    setStep(1);
    if (user?.email && !usernameInput) {
      const suggested = user.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
      setUsernameInput(suggested);
    }
    if (user?.name && !displayName) {
      setDisplayName(user.name);
    }
    if (user?.avatarUrl && !selectedAvatar) {
      setSelectedAvatar(user.avatarUrl);
    }
  }
}, [isOpen]);
```

### 4.2 `AppLayout.jsx` Mounting
Mounted `<UsernameOnboardingModal isOpen={showUsernameModal} onClose={() => setShowUsernameModal(false)} />` within the global modals stack in `AppLayout.jsx`.

---

## 5. Verification Matrix

| Verification Vector | Test Procedure | Result | Verdict |
|---|---|---|---|
| **Step 1 → Step 2 Transition** | Click Continue on Step 1 handle screen in browser | Step 2 ("Complete Your Profile") displays with Avatar picker, Display Name, and Bio | **FIXED** |
| **Step 2 Completion** | Click "Save & Explore" or "Skip for now" | Modal closes, toast welcome notification displays, user lands on Home | **FIXED** |
| **Multi-User Identity** | Tested User A (`@user_a_test`), User B (`@user_b_test`), User C (`@user_c_test`) | Each user claims unique handle, database maps 1-to-1 with Firebase UID | **FIXED** |
| **Email/Password Signup** | Complete new email registration flow | Modal opens, handle claimed, advances to Step 2, closes on completion | **FIXED** |
| **Returning User Bypass** | Logout and re-login with existing handle | Backend returns `needsUsername: false`, onboarding modal bypassed completely | **FIXED** |
| **Page Refresh** | Refresh browser tab while logged in | Session restored from IndexedDB, user handle `@username` intact, no modal loop | **FIXED** |
| **Production Build** | `npm run build` | 1612 modules transformed, 0 build errors in 4.55s | **FIXED** |

---

## 6. Final Status

- **Root Cause Confirmed:** YES  
- **Fix Implemented:** YES  
- **Real Browser Verified:** YES  
- **Multi-User Verified:** YES  
- **Overall Status:** **ROOT CAUSE CONFIRMED & FIXED**
