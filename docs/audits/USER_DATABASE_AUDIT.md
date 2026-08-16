# ScrollNom SQLite User Database Audit & Duplicate Investigation

**Audit ID:** AUDIT-DB-USERS-2026-08  
**Date:** August 15, 2026  
**Target Database:** `scrollnom.db` (SQLite Persistent Database)  
**Evaluator:** Independent Database Quality & Identity Audit Agent  

---

## 1. Executive Database Summary

This audit investigates the contents of the SQLite `users` table in `scrollnom.db` to categorize all user records, analyze search results (e.g. search query `"must"` returning ~7 handles), verify database constraint enforcement, group accounts by `firebase_uid` and `email`, and identify test/demo fixtures vs. real Firebase OAuth users.

### Key Metrics:
- **Total User Rows in Database:** **60**
- **Unique Firebase UIDs:** **60**
- **Duplicate Firebase UIDs:** **0**
- **Duplicate Email Count:** **1 email** (`mustafastudy9105@gmail.com` associated with 5 distinct Firebase UIDs)
- **Database Schema Constraints:** Enforced (`UNIQUE(firebase_uid)`, `UNIQUE(LOWER(username))`)
- **Action Taken:** **Zero user records deleted or modified.** (Read-only audit).

---

## 2. Complete Database Inventory (60 Records)

| # | ScrollNom User ID | Firebase UID | Email | Username | Display Name | Is Creator | Created At | Classification / Source |
|---|---|---|---|---|---|---|---|---|
| 1 | `u1` | `u1` | `mustafa@scrollnom.com` | `@mustafa` | Mustafa | 0 | 2026-08-14 06:27:07 | Initial Seed Fixture (`database.js`) |
| 2 | `fb_uid_userA_1786688836544` | `fb_uid_userA_1786688836544` | `userA_1786688836544@scrollnom.com` | `@usera_178668883` | userA_1786688836544 | 0 | 2026-08-14 06:27:16 | Automated Test Fixture |
| 3 | `fb_uid_userB_1786688836544` | `fb_uid_userB_1786688836544` | `userB_1786688836544@scrollnom.com` | `@userb_178668883` | userB_1786688836544 | 0 | 2026-08-14 06:27:16 | Automated Test Fixture |
| 4 | `fb_uid_userA_871157` | `fb_uid_userA_871157` | `userA_871157@scrollnom.com` | `@alpha_871157` | Alpha Creator | 0 | 2026-08-14 06:27:51 | Automated Test Fixture |
| 5 | `fb_uid_userB_871157` | `fb_uid_userB_871157` | `userB_871157@scrollnom.com` | `@beta_871157` | Beta Foodie | 0 | 2026-08-14 06:27:51 | Automated Test Fixture |
| 6 | `fb_uid_A_457113` | `fb_uid_A_457113` | `userA_457113@scrollnom.com` | `@user_a_457113` | User Alpha | 0 | 2026-08-14 06:54:17 | Automated Test Fixture |
| 7 | `fb_uid_B_457113` | `fb_uid_B_457113` | `userB_457113@scrollnom.com` | `@user_b_457113` | Creator Beta | 0 | 2026-08-14 06:54:17 | Automated Test Fixture |
| 8 | `fb_uid_delA_552104` | `fb_uid_delA_552104` | `userDelA_552104@scrollnom.com` | `@userdela_552104` | userDelA_552104 | 0 | 2026-08-14 15:15:52 | Delivery Engine Test Fixture |
| 9 | `fb_uid_delB_552104` | `fb_uid_delB_552104` | `userDelB_552104@scrollnom.com` | `@userdelb_552104` | userDelB_552104 | 0 | 2026-08-14 15:15:52 | Delivery Engine Test Fixture |
| 10 | `fb_uid_delA_565901` | `fb_uid_delA_565901` | `userDelA_565901@scrollnom.com` | `@userdela_565901` | userDelA_565901 | 0 | 2026-08-14 15:16:05 | Delivery Engine Test Fixture |
| 11 | `fb_uid_delB_565901` | `fb_uid_delB_565901` | `userDelB_565901@scrollnom.com` | `@userdelb_565901` | userDelB_565901 | 0 | 2026-08-14 15:16:05 | Delivery Engine Test Fixture |
| 12 | `fb_uid_delA_579656` | `fb_uid_delA_579656` | `userDelA_579656@scrollnom.com` | `@userdela_579656` | userDelA_579656 | 0 | 2026-08-14 15:16:19 | Delivery Engine Test Fixture |
| 13 | `fb_uid_delB_579656` | `fb_uid_delB_579656` | `userDelB_579656@scrollnom.com` | `@userdelb_579656` | userDelB_579656 | 0 | 2026-08-14 15:16:19 | Delivery Engine Test Fixture |
| 14 | `fb_uid_delA_615706` | `fb_uid_delA_615706` | `userDelA_615706@scrollnom.com` | `@userdela_615706` | userDelA_615706 | 0 | 2026-08-14 15:16:55 | Delivery Engine Test Fixture |
| 15 | `fb_uid_delB_615706` | `fb_uid_delB_615706` | `userDelB_615706@scrollnom.com` | `@userdelb_615706` | userDelB_615706 | 0 | 2026-08-14 15:16:55 | Delivery Engine Test Fixture |
| 16 | `fb_uid_cust_243817` | `fb_uid_cust_243817` | `customer_243817@scrollnom.com` | `@customer_243817` | customer_243817 | 0 | 2026-08-14 15:27:23 | Order / Payment Test Fixture |
| 17 | `fb_uid_cust_254120` | `fb_uid_cust_254120` | `customer_254120@scrollnom.com` | `@customer_254120` | customer_254120 | 0 | 2026-08-14 15:27:34 | Order / Payment Test Fixture |
| 18 | `fb_uid_cust_264015` | `fb_uid_cust_264015` | `customer_264015@scrollnom.com` | `@customer_264015` | customer_264015 | 0 | 2026-08-14 15:27:44 | Order / Payment Test Fixture |
| 19 | `fb_uid_cust_274034` | `fb_uid_cust_274034` | `customer_274034@scrollnom.com` | `@customer_274034` | customer_274034 | 0 | 2026-08-14 15:27:54 | Order / Payment Test Fixture |
| 20 | `fb_uid_cust_305189` | `fb_uid_cust_305189` | `customer_305189@scrollnom.com` | `@customer_305189` | customer_305189 | 0 | 2026-08-14 15:28:25 | Order / Payment Test Fixture |
| 21 | `google_uid_A_529804` | `google_uid_A_529804` | `userA_529804@gmail.com` | `@foodie_a_529804` | userA_529804 | 0 | 2026-08-14 15:32:09 | Mock Google Auth Test |
| 22 | `google_uid_B_529804` | `google_uid_B_529804` | `userB_529804@gmail.com` | `@userb_529804` | userB_529804 | 0 | 2026-08-14 15:32:09 | Mock Google Auth Test |
| 23 | `google_uid_A_919784` | `google_uid_A_919784` | `userA_919784@gmail.com` | `@foodie_a_919784` | userA_919784 | 0 | 2026-08-14 15:38:39 | Mock Google Auth Test |
| 24 | `google_uid_B_919784` | `google_uid_B_919784` | `userB_919784@gmail.com` | `@userb_919784` | userB_919784 | 0 | 2026-08-14 15:38:39 | Mock Google Auth Test |
| 25 | `fb_uid_cust_924595` | `fb_uid_cust_924595` | `customer_924595@scrollnom.com` | `@customer_924595` | customer_924595 | 0 | 2026-08-14 15:38:44 | Order / Payment Test Fixture |
| 26 | `fb_uid_userA_937564` | `fb_uid_userA_937564` | `userA_937564@scrollnom.com` | `@alpha_937564` | Alpha Creator | 0 | 2026-08-14 15:38:57 | Food on Friend Test Fixture |
| 27 | `fb_uid_userB_937564` | `fb_uid_userB_937564` | `userB_937564@scrollnom.com` | `@beta_937564` | Beta Foodie | 0 | 2026-08-14 15:38:57 | Food on Friend Test Fixture |
| 28 | `fb_uid_A_941777` | `fb_uid_A_941777` | `userA_941777@scrollnom.com` | `@user_a_941777` | User Alpha | 0 | 2026-08-14 15:39:01 | Multi-User Test Fixture |
| 29 | `fb_uid_B_941777` | `fb_uid_B_941777` | `userB_941777@scrollnom.com` | `@user_b_941777` | Creator Beta | 0 | 2026-08-14 15:39:01 | Multi-User Test Fixture |
| 30 | `google_uid_A_968858` | `google_uid_A_968858` | `userA_968858@gmail.com` | `@foodie_a_968858` | userA_968858 | 0 | 2026-08-14 15:56:08 | Mock Google Auth Test |
| 31 | `google_uid_B_968858` | `google_uid_B_968858` | `userB_968858@gmail.com` | `@userb_968858` | userB_968858 | 0 | 2026-08-14 15:56:08 | Mock Google Auth Test |
| 32 | `fb_uid_cust_974644` | `fb_uid_cust_974644` | `customer_974644@scrollnom.com` | `@customer_974644` | customer_974644 | 0 | 2026-08-14 15:56:14 | Order / Payment Test Fixture |
| 33 | `google_uid_test_a_1786722980706` | `google_uid_test_a_1786722980706` | `google_uid_test_a_1786722980706@scrollnom.com` | `@google_uid_test` | google_uid_test_a_1786722980706 | 0 | 2026-08-14 15:56:20 | Mock Google Auth Test |
| 34 | `google_uid_test_b_1786722980706` | `google_uid_test_b_1786722980706` | `google_uid_test_b_1786722980706@scrollnom.com` | `@google_uid_test_5728` | google_uid_test_b_1786722980706 | 0 | 2026-08-14 15:56:20 | Mock Google Auth Test |
| 35 | `google_uid_test_a_1786722997076` | `google_uid_test_a_1786722997076` | `google_uid_test_a_1786722997076@scrollnom.com` | `@google_uid_test_4736` | google_uid_test_a_1786722997076 | 0 | 2026-08-14 15:56:37 | Mock Google Auth Test |
| 36 | `google_uid_test_b_1786722997076` | `google_uid_test_b_1786722997076` | `google_uid_test_b_1786722997076@scrollnom.com` | `@google_uid_test_3144` | google_uid_test_b_1786722997076 | 0 | 2026-08-14 15:56:37 | Mock Google Auth Test |
| 37 | `uid_a_6776` | `uid_a_6776` | `uid_a_6776@scrollnom.com` | `@uid_a_6776` | uid_a_6776 | 0 | 2026-08-14 15:56:48 | Automated Multi-User Test |
| 38 | `uid_b_6589` | `uid_b_6589` | `uid_b_6589@scrollnom.com` | `@uid_b_6589` | uid_b_6589 | 0 | 2026-08-14 15:56:48 | Automated Multi-User Test |
| 39 | `uid_a_1859` | `uid_a_1859` | `uid_a_1859@scrollnom.com` | `@uid_a_1859` | uid_a_1859 | 0 | 2026-08-14 15:57:13 | Automated Multi-User Test |
| 40 | `uid_b_3410` | `uid_b_3410` | `uid_b_3410@scrollnom.com` | `@uid_b_3410` | uid_b_3410 | 0 | 2026-08-14 15:57:13 | Automated Multi-User Test |
| 41 | `uid_a_9133` | `uid_a_9133` | `uid_a_9133@scrollnom.com` | `@uid_a_9133` | uid_a_9133 | 0 | 2026-08-14 15:57:25 | Automated Multi-User Test |
| 42 | `uid_a_9883` | `uid_a_9883` | `uid_a_9883@scrollnom.com` | `@uid_a_9883` | uid_a_9883 | 0 | 2026-08-14 15:57:40 | Automated Multi-User Test |
| 43 | `uid_b_2058` | `uid_b_2058` | `uid_b_2058@scrollnom.com` | `@uid_b_2058` | uid_b_2058 | 0 | 2026-08-14 15:57:40 | Automated Multi-User Test |
| 44 | `google_uid_A_271299` | `google_uid_A_271299` | `userA_271299@gmail.com` | `@foodie_a_271299` | userA_271299 | 0 | 2026-08-14 16:17:51 | Mock Google Auth Test |
| 45 | `google_uid_B_271299` | `google_uid_B_271299` | `userB_271299@gmail.com` | `@userb_271299` | userB_271299 | 0 | 2026-08-14 16:17:51 | Mock Google Auth Test |
| 46 | `fb_uid_cust_277702` | `fb_uid_cust_277702` | `customer_277702@scrollnom.com` | `@customer_277702` | customer_277702 | 0 | 2026-08-14 16:17:57 | Order / Payment Test Fixture |
| 47 | `google_uid_mustafa_903200` | `google_uid_mustafa_903200` | `mustafastudy9105@gmail.com` | `@mustafa_foodie_795` | mustafastudy9105 | 0 | 2026-08-14 16:32:00 | Synthetic Google Test Run |
| 48 | `google_uid_mustafa_950126` | `google_uid_mustafa_950126` | `mustafastudy9105@gmail.com` | `@mustafastudy910` | mustafastudy9105 | 0 | 2026-08-14 16:32:11 | Synthetic Google Test Run |
| 49 | `google_uid_A_071230` | `google_uid_A_071230` | `userA_071230@gmail.com` | `@foodie_a_071230` | userA_071230 | 0 | 2026-08-14 16:47:51 | Mock Google Auth Test |
| 50 | `google_uid_B_071230` | `google_uid_B_071230` | `userB_071230@gmail.com` | `@userb_071230` | userB_071230 | 0 | 2026-08-14 16:47:51 | Mock Google Auth Test |
| 51 | `fb_uid_cust_076504` | `fb_uid_cust_076504` | `customer_076504@scrollnom.com` | `@customer_076504` | customer_076504 | 0 | 2026-08-14 16:47:56 | Order / Payment Test Fixture |
| 52 | `google_uid_mustafa_371361` | `google_uid_mustafa_371361` | `mustafastudy9105@gmail.com` | `@mustafa_foodie_716` | mustafastudy9105 | 0 | 2026-08-14 16:54:37 | Synthetic Google Test Run |
| 53 | `google_uid_real_135136` | `google_uid_real_135136` | `mustafastudy9105@gmail.com` | `@mustafa_real_238` | mustafastudy9105 | 0 | 2026-08-14 18:06:59 | Synthetic Google Test Run |
| 54 | `p8RKbL25drNWopSimWqe0r7Vq3c2` | `p8RKbL25drNWopSimWqe0r7Vq3c2` | `mustafastudy9105@gmail.com` | `@mohammedmustafa` | Mohammed Mustafa | 0 | 2026-08-14 18:23:05 | **Real Firebase Google OAuth User** |
| 55 | `user_alpha_101` | `user_alpha_101` | `user_a@test.com` | `@user_alpha` | Alpha Creator | 1 | 2026-08-15 05:27:57 | Multi-User Isolation Suite User A |
| 56 | `user_beta_202` | `user_beta_202` | `user_b@test.com` | `@user_beta` | user_b | 0 | 2026-08-15 05:27:57 | Multi-User Isolation Suite User B |
| 57 | `user_gamma_303` | `user_gamma_303` | `user_c@test.com` | `@user_gamma` | user_c | 0 | 2026-08-15 05:27:57 | Multi-User Isolation Suite User C |
| 58 | `FRjIW4QCSYPhpHPkPdNwA51gtem1` | `FRjIW4QCSYPhpHPkPdNwA51gtem1` | `mohammedmustafa9105@gmail.com` | `@mohammedmustafa9105` | Mohammed Mustafa | 0 | 2026-08-15 05:40:48 | **Real Firebase Google OAuth User** |
| 59 | `fb_uid_repro_test_1786772713001` | `fb_uid_repro_test_1786772713001` | `repro_test_1786772713001@example.com` | `@testuser_5821` | repro_test_1786772713001 | 0 | 2026-08-15 05:45:13 | Onboarding Loop Audit Trace User |
| 60 | `0FhAWBFmKmR2eeayDnPrBYcH3UF2` | `0FhAWBFmKmR2eeayDnPrBYcH3UF2` | `iamcaptainhermes@gmail.com` | `@iamcaptainhermes` | Captain Hermes | 0 | 2026-08-15 05:52:00 | **Real Firebase Google OAuth User** |

---

## 3. Detailed Identity & Grouping Analysis

### 3.1 Grouping by `firebase_uid`
- **Total Unique `firebase_uid` Count:** **60**
- **Duplicate `firebase_uid` Count:** **0**
- **Database Constraint Verification:** **PASS.** The SQLite schema enforces `UNIQUE(firebase_uid)`. No single Firebase UID possesses multiple user rows.

### 3.2 Grouping by `email`
56 emails are assigned to exactly 1 record each. Only 1 email address is shared across multiple synthetic test records:

- **Email:** `mustafastudy9105@gmail.com` (**5 Total Rows**)
  1. Row 47: `google_uid_mustafa_903200` (`@mustafa_foodie_795`) - Created via mock Google test script on 2026-08-14 16:32:00.
  2. Row 48: `google_uid_mustafa_950126` (`@mustafastudy910`) - Created via mock Google test script on 2026-08-14 16:32:11.
  3. Row 52: `google_uid_mustafa_371361` (`@mustafa_foodie_716`) - Created via mock Google test script on 2026-08-14 16:54:37.
  4. Row 53: `google_uid_real_135136` (`@mustafa_real_238`) - Created via synthetic auth test script on 2026-08-14 18:06:59.
  5. Row 54: `p8RKbL25drNWopSimWqe0r7Vq3c2` (`@mohammedmustafa`) - **Real Firebase Google OAuth User** authenticated via browser popup on 2026-08-14 18:23:05.

### 3.3 Search Query `"must"` Investigation (~7 Results)
Searching `"must"` in the Explore Search input queries `WHERE LOWER(username) LIKE '%must%' OR LOWER(display_name) LIKE '%must%'`.

The database returned **exactly 7 matching accounts**:
1. `@mustafa` (Row 1, Initial Seed User)
2. `@mustafa_foodie_795` (Row 47, Synthetic Test Fixture)
3. `@mustafastudy910` (Row 48, Synthetic Test Fixture)
4. `@mustafa_foodie_716` (Row 52, Synthetic Test Fixture)
5. `@mustafa_real_238` (Row 53, Synthetic Test Fixture)
6. `@mohammedmustafa` (Row 54, Real Google OAuth User)
7. `@mohammedmustafa9105` (Row 58, Real Google OAuth User B)

**Findings:** 4 of the 7 matching search results are old automated test fixtures with synthetic Firebase UIDs (`google_uid_mustafa_...`). 1 is the initial seed user (`u1`), and 2 are real Firebase OAuth users.

---

## 4. User Breakdown by Category

| Category | Description | Count | Example Rows |
|---|---|---|---|
| **Real Firebase OAuth Users** | Real accounts created via browser Firebase Auth | **3** | Rows 54, 58, 60 (`p8RKbL25...`, `FRjIW4QC...`, `0FhAWBFm...`) |
| **Initial Seed Fixtures** | Default database seed user inserted by `database.js` | **1** | Row 1 (`u1` / `@mustafa`) |
| **Automated Test Fixtures** | Mock users generated during API & integration test runs | **52** | Rows 2–46, 49–51, 55–57, 59 |
| **Synthetic Developer Email Test Runs** | Simulated test runs using developer email before real OAuth | **4** | Rows 47, 48, 52, 53 (`google_uid_mustafa_...`) |
| **TOTAL** | | **60** | |

---

## 5. Cleanup Recommendations (Future Operations)

*Note: Per strict user instructions, NO user records have been modified or deleted during this audit.*

When database cleanup is authorized in a future operational turn, the following cleanup plan is recommended:

1. **Retain Real Firebase OAuth Users (3 rows):**
   - Row 54: `p8RKbL25drNWopSimWqe0r7Vq3c2` (`@mohammedmustafa`)
   - Row 58: `FRjIW4QCSYPhpHPkPdNwA51gtem1` (`@mohammedmustafa9105`)
   - Row 60: `0FhAWBFmKmR2eeayDnPrBYcH3UF2` (`@iamcaptainhermes`)

2. **Remove Synthetic Developer Email Test Fixtures (4 rows):**
   - Rows 47, 48, 52, 53 (`google_uid_mustafa_903200`, `google_uid_mustafa_950126`, `google_uid_mustafa_371361`, `google_uid_real_135136`). Removing these will clean up the duplicate handles in Explore search for query `"must"`.

3. **Remove Development & Automated Test Fixtures (52 rows):**
   - Rows 2–46, 49–51, 55–57, 59 created during test suite runs.

---

## 6. Audit Conclusion

- **Database Integrity:** 100% Verified. Unique Firebase UID constraints are strictly enforced at the database level.
- **Root Cause of Similar Search Handles:** Multiple automated test suite executions generated synthetic UIDs (`google_uid_mustafa_...`) during earlier developer testing iterations.
- **Action Taken:** Zero records deleted or modified. Audit complete.
