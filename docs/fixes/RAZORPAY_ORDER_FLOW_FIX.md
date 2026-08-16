# ScrollNom Razorpay Checkout Visibility Fix

## Root Cause

The Razorpay Checkout SDK script (`https://checkout.razorpay.com/v1/checkout.js`) was **never included** in `index.html`. This meant `window.Razorpay` was always `undefined` at runtime. The frontend code in `razorpayService.js` had a silent fallback (lines 85-110) that, when `window.Razorpay` was undefined, would **bypass the real checkout entirely** — it fabricated a fake payment ID (`pay_sim_...`), sent a mock signature (`valid_mock_signature`) to the backend, and called `onSuccess` as if payment had completed. The user never saw the Razorpay UI.

Additional bugs found and fixed:
- **Callback name mismatch**: `CartPage.jsx` passed `onError` but `razorpayService.js` destructured `onFailure` — payment failures were silently swallowed.
- **Parameter name mismatch**: `CartPage.jsx` passed `token` but service expected `authToken`; `user` was not passed at all.
- **Mock signature fallbacks in handler**: The real payment handler fabricated `pay_sim_...` IDs and `valid_mock_signature` when Razorpay returned actual credentials, and called `onSuccess` even when server verification failed.

## Files Changed

1. **`index.html`** — Added `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
2. **`src/services/razorpayService.js`** — Removed silent mock bypass; added `payment.failed` event listener; removed mock signature/ID fallbacks from handler; call `onFailure` (not `onSuccess`) on verification failure
3. **`src/pages/Cart/CartPage.jsx`** — Fixed `onError` → `onFailure`; fixed `token` → `authToken`; added `user` parameter

## Real Browser Verification

Cart before payment:
![Cart with items and PROCEED TO RAZORPAY TEST CHECKOUT button](file:///d:/ScrollNom/docs/fixes/razorpay_fix_evidence/01_cart_before_payment.png)

After clicking checkout — **Razorpay TEST MODE checkout is VISIBLY OPEN**:
![Razorpay Checkout modal with Test Mode ribbon, Razorpay shield logo, and Secured by Razorpay branding](file:///d:/ScrollNom/docs/fixes/razorpay_fix_evidence/02_razorpay_checkout_visible.png)

Key evidence from the screenshot:
- Razorpay checkout overlay covers the cart page
- "Test Mode" red ribbon visible in top-right corner
- Razorpay shield logo loading in center
- "Secured by Razorpay" branding at bottom
- ORDER CONFIRMED is NOT visible — checkout must complete first
- Cross-origin iframe from `https://api.razorpay.com/v1/checkout/public` confirmed in DOM

## Remaining Limitations

- Razorpay is in **TEST MODE** (`rzp_test_TPk8Hq9WndmWQG`). Production keys not configured.
- Completing the test payment requires Razorpay test card credentials (e.g., card 4111 1111 1111 1111).
