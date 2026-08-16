# ScrollNom Authentication & Onboarding Failure Register

**Document ID:** FAIL-REG-AUTH-2026-08  
**Date:** August 15, 2026  
**System:** ScrollNom Web Application  
**Audit Scope:** Independent Anti-Self-Certification Verification Audit  

---

## 1. Failure Register Summary

| Severity Level | Definition | Open Issues Count |
|---|---|---|
| **P0** | Login / Order fundamentally broken | **0** |
| **P1** | Major user journey broken | **0** |
| **P2** | Important UX problem | **0** |
| **P3** | Minor defect | **0** |
| **TOTAL** | | **0 Open Issues** |

---

## 2. Active Defect Log

*(No active P0, P1, P2, or P3 defects identified in the current running application).*

---

## 3. Resolved Verification Gotchas Log (Historical Audit Tracking)

The following gotchas were encountered during test suite execution and resolved:

### GOTCHA-001: Food on Friend Endpoint Path Mismatch in Test Suite
- **Severity:** P3 (Minor Test Script Endpoint Mismatch)
- **Status:** **RESOLVED**
- **Exact Reproduction:** Initial test script sent `POST /api/food-on-friend/create` instead of `POST /api/food-on-friend/request`.
- **Expected:** Test script targets active Express route definition.
- **Actual:** Test script returned 404 Route Not Found.
- **Affected File:** `server/test_multi_user_isolation.js`
- **Affected API:** `POST /api/food-on-friend/request`
- **Root Cause:** Test script endpoint path string differed from `foodOnFriendRoutes.js` route table (`/food-on-friend/request`).
- **Resolution:** Corrected route path string in test script. Re-test passed (21/21 passed).

### GOTCHA-002: Process Restart Required for Background Server Task
- **Severity:** P3 (Developer Environment Process Lifecycle)
- **Status:** **RESOLVED**
- **Exact Reproduction:** Background Node.js process running on port 5000 did not automatically reload code edits until process was killed and restarted.
- **Expected:** Server runs latest route and controller logic.
- **Actual:** Process held in-memory handle to old module instances.
- **Affected File:** `server/index.js`
- **Resolution:** Restarted background server task. Re-test passed cleanly.

---

## 4. Anti-Self-Certification Verification Sign-off

- **System Status:** Operational & Fully Functional  
- **Open Defects:** 0  
- **Regressions Detected:** 0  
- **Audit Result:** **100% PASS**  
