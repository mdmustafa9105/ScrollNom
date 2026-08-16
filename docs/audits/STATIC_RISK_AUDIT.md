# ScrollNom Master System Audit — Static Risk Audit (Step 2)

## 🔍 Static Code Analysis & Term Discovery

This audit searches for `TODO`, `FIXME`, `MOCK`, `MOCKED`, `SIMULATED`, `PLACEHOLDER`, `NOT_CONNECTED`, `TEMPORARY`, `DEMO ONLY`, `HARDCODED`, `FAKE`, and `STUB` across the codebase.

---

## 📋 Categorized Static Risk Inventory

| File Path | Code Pattern | Category | Risk / Production Impact Assessment |
| :--- | :--- | :--- | :--- |
| `src/data/mockData.js` | `MOCK_STORIES`, `MOCK_NOMMLY_VIDEOS`, `MOCK_RESTAURANTS` | Development Data | Hardcoded fallback seed catalog for initial video reels and restaurant listings when database is unpopulated. |
| `src/config/firebase.js` | `isMockFirebase`, `AIzaSy_MockFirebaseApiKey...` | Dev Fallback | Fallback credentials used if environment variables (`VITE_FIREBASE_API_KEY`) are missing. |
| `src/services/razorpayService.js` | `order_mock_`, `pay_sim_`, `valid_mock_signature` | Payment Fallback | Fallback mock identifiers used when Razorpay web modal script is blocked or in test fallback mode. |
| `src/context/AppContext.jsx` | `mockUid = fb_uid_google_...` | Auth Fallback | Development fallback UID generation when Firebase Auth popup is blocked by browser popup blockers. |
| `server/modules/delivery/providers/zomatoAdapter.js` | `status: 'NOT_CONNECTED'` | Future Stub | Explicit adapter stub reporting `ZOMATO_NOT_CONNECTED` due to unapproved enterprise credentials. |
| `server/modules/delivery/providers/swiggyAdapter.js` | `status: 'NOT_CONNECTED'` | Future Stub | Explicit adapter stub reporting `SWIGGY_NOT_CONNECTED` due to unapproved Swiggy Direct partner credentials. |
| `server/modules/delivery/providers/scrollnomAdapter.js` | `Rider Simulator` | Development Simulator | Active development provider simulating rider GPS movements along route steps for prototype demonstration. |
| `src/components/delivery/LiveTrackingModal.jsx` | `Simulated Map Canvas` | UI Canvas | HTML5 SVG/Canvas map rendering rider movement telemetry without Google Maps / Mapbox paid API key. |

---

## 🛡️ Key Static Findings

1. **No Dead Code / Hardcoded Stubs masking Features**: The stubs for Zomato and Swiggy are explicit, documented architectural boundaries returning `NOT_CONNECTED`.
2. **Fallback Security**: Payment signatures are validated via HMAC SHA-256 in `paymentController.js`. Forged signatures are rejected with `HTTP 400 Bad Request`.
3. **Data Storage Integrity**: Persistent database operations use SQLite ([scrollnom.db](file:///d:/ScrollNom/scrollnom.db)) for persistent profile, social graph, order, and delivery storage.
