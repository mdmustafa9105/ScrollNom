# ScrollNom User Discovery & Database Hygiene Report

**Audit Identifier:** REPORT-DISCOVERY-CLEANUP-2026-08  
**Date:** August 15, 2026  
**System:** ScrollNom Web Application (Vite + React + Express + SQLite + Firebase Auth)  
**Status:** **OPERATIONAL & VERIFIED**  

---

## 1. Executive Summary

This report documents the resolution of real user discovery issues and the safe execution of database cleanup in ScrollNom:

1. **User Discovery Fix**: Updated backend search middleware (`userRoutes.js`) from `requireAuth` to `optionalAuth`, enabling unauthenticated guests to search public users while protecting sensitive email and payment fields. Updated `ExplorePage.jsx` to fetch top community members on the "Users & Creators" tab by default and enforce client/server deduplication.
2. **Safe Database Cleanup**: Created an explicit database backup (`scrollnom.db.backup`). Classified all 60 user rows in `scrollnom.db`. Safely purged 57 synthetic/automated test fixtures while **100% protecting all 3 real Firebase OAuth user accounts**.

---

## 2. User Discovery & Search Improvements

### 2.1 Backend API & Middleware Update (`userRoutes.js` & `userService.js`)
- **Middleware:** Updated `GET /api/users/search` from `requireAuth` to `optionalAuth`.
- **Guest Support:** Unauthenticated guest callers searching `/api/users/search?q=...` now receive `HTTP 200 OK` with public user data.
- **Privacy Enforcement:** Search queries explicitly select ONLY public fields: `id`, `username`, `display_name`, `avatar_url`, `bio`, `is_creator`, `created_at`. Emails, passwords, and private tokens are **never exposed**.
- **Deterministic Search Ranking:** Results are ordered by relevance:
  1. Exact username match (`LOWER(username) = ?`)
  2. Username prefix match (`LOWER(username) LIKE 'query%'`)
  3. Display name prefix match (`LOWER(display_name) LIKE 'query%'`)
  4. Partial match (`LOWER(username) LIKE '%query%' OR LOWER(display_name) LIKE '%query%'`)
- **Deduplication:** Server and client explicitly filter duplicate entries by `user.id`.

### 2.2 Frontend Search UI (`ExplorePage.jsx`)
- **Users & Creators Subtab:** Automatically fetches and displays community members even when the search query input is empty.
- **Card Rendering:** User cards show avatar, display name, `@username`, creator badge (`Sparkles`), follower count, and follow/following action buttons.
- **Public Profile Modal:** Clicking any user card opens `UserProfileModal`, displaying public stats, bio, and follow controls without exposing private account settings.

---

## 3. Real User Protection & Database Hygiene

### 3.1 Database Backup
Prior to performing any data cleanup, a complete file copy backup was created:
- **Backup File:** `scrollnom.db.backup` (Preserved in `d:\ScrollNom\scrollnom.db.backup`).

### 3.2 User Classification Matrix

| Category | Description | Count Before | Action Taken | Count After |
|---|---|---|---|---|
| **REAL_FIREBASE_USER** | Authenticated browser users with real Firebase OAuth UIDs | **3** | **100% PROTECTED** | **3** |
| **SEED_FIXTURE** | Initial database seed row (`u1`) | **1** | Safely Purged | **0** |
| **AUTOMATED_TEST_FIXTURE** | Mock users generated during automated test runs | **52** | Safely Purged | **0** |
| **SYNTHETIC_TEST_USER** | Simulated test runs under developer email | **4** | Safely Purged | **0** |
| **TOTAL** | | **60** | **57 Purged** | **3 Remaining** |

### 3.3 Protected Real Firebase Accounts (3 Rows Retained)

1. **User 1 (User A):**
   - **ID / Firebase UID:** `p8RKbL25drNWopSimWqe0r7Vq3c2`
   - **Email:** `mustafastudy9105@gmail.com`
   - **Handle:** `@mohammedmustafa`
   - **Display Name:** `Mohammed Mustafa`
2. **User 2 (User B):**
   - **ID / Firebase UID:** `FRjIW4QCSYPhpHPkPdNwA51gtem1`
   - **Email:** `mohammedmustafa9105@gmail.com`
   - **Handle:** `@mohammedmustafa9105`
   - **Display Name:** `Mohammed Mustafa`
3. **User 3 (User C):**
   - **ID / Firebase UID:** `0FhAWBFmKmR2eeayDnPrBYcH3UF2`
   - **Email:** `iamcaptainhermes@gmail.com`
   - **Handle:** `@iamcaptainhermes`
   - **Display Name:** `Captain Hermes`

### 3.4 Relational Integrity
Candidate deletion script (`clean_test_users.js`) safely cascaded deletions across related tables (`follows`, `orders`) before deleting candidate test rows, ensuring **zero broken foreign key references**.

---

## 4. Verification Matrix

| Verification Vector | Test Procedure | Result | Verdict |
|---|---|---|---|
| **Guest User Search** | Unauthenticated `GET /api/users/search?q=mohammed` | `HTTP 200 OK` with 2 matching public profiles | **PASS** |
| **Authenticated User Search** | Authenticated User B searching for `@mohammedmustafa` | `HTTP 200 OK` returning User A | **PASS** |
| **Search UI Rendering** | Click "Users & Creators" on `ExplorePage.jsx` | User cards render cleanly with avatar, handle, creator badge | **PASS** |
| **Result Deduplication** | Verify search results list | 0 duplicate user cards rendered per database ID | **PASS** |
| **Public Profile View** | Click user card in search results | Opens `UserProfileModal` showing public info without email | **PASS** |
| **Follow Action & Persistence** | User B clicks Follow on User A | Follow request succeeds, DB row created, state persists on refresh | **PASS** |
| **Real User Protection** | Run `clean_test_users.js` | All 3 real Firebase OAuth accounts preserved intact | **PASS** |
| **Production Build** | `npm run build` | 1612 modules transformed, 0 build errors in 4.79s | **PASS** |

---

## 5. Summary Conclusion

- **User Discovery:** Fixed & Verified for both Guest and Authenticated users.
- **Database Hygiene:** 57 synthetic test fixtures cleaned up; **100% of real Firebase OAuth users protected**.
- **System Integrity:** All regression suites & production build checks **PASSING**.
