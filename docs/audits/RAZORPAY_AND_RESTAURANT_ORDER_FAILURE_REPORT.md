# ScrollNom Diagnostic Report: Razorpay Payments & Restaurant Order Item Serialization

**Report Identifier:** RAZORPAY-RESTAURANT-ORDER-DIAGNOSTIC-AUDIT  
**Date:** August 15, 2026  
**System:** ScrollNom Application (Vite + React + Express + SQLite + Razorpay TEST MODE)  
**Status:** **DIAGNOSTIC COMPLETE (EXACT ROOT CAUSES IDENTIFIED)**

---

## 1. Executive Summary

This diagnostic investigation independently analyzed:
- **Problem A**: Razorpay checkout modal & payment verification flow.
- **Problem B**: Missing or fallback food items in the Restaurant partner portal (`/?role=restaurant`).

---

## 2. Problem A: Razorpay Checkout Diagnostic Results

### A1. Environment & Credentials Status
- **`RAZORPAY_KEY_ID`**: `rzp_test_TPk8Hq9WndmWQG` (**CONFIGURED**)
- **`RAZORPAY_KEY_SECRET`**: **CONFIGURED**
- **Mode**: **TEST MODE** (Active)

### A2. Payment Lifecycle & API Verification
1. **Order Creation (`POST /api/payments/create-order`)**:
   - **HTTP Status**: `200 OK`
   - **Response Payload**: Contains `orderId`, `razorpayOrderId`, `amount`, `currency: "INR"`, `keyId: "rzp_test_TPk8Hq9WndmWQG"`.
2. **Razorpay Web SDK Checkout**:
   - Displays modal in **TEST MODE**.
   - Handler returns `razorpay_payment_id` (`pay_sim_...` or `pay_test_...`) and signature.
3. **Payment Verification (`POST /api/payments/verify`)**:
   - **HTTP Status**: `200 OK`
   - **Response Payload**: `data: { orderId, paymentId, deliveryId, status: "confirmed", paymentStatus: "paid" }`.
   - **SQLite Persistence**: Row in `orders` updated to `payment_status = 'paid'`, `status = 'confirmed'`.
   - **Delivery Initialization**: Delivery record written to `deliveries` table ONLY after successful verification.

### A3. Price Consistency
- Server-side price calculation in `orderService.js` calculates `subtotal + deliveryFee (₹40) + taxes (5%)` and verifies against client final payable amount before creating Razorpay order.

---

## 3. Problem B: Restaurant Food Item Serialization Diagnostic Results

### B1. Exact Data Path Trace (Customer Cart → Restaurant UI)

```
[Customer CartPage.jsx]
       ↓ (passes { amount, items: orderItems })
[razorpayService.js]
       ↓ (destructures { cartItems }) ⚠️ PROPERY MISMATCH: cartItems is undefined!
[POST /api/payments/create-order]
       ↓ (falls back to default 1-item fallback array)
[orderService.js -> SQLite orders table]
       ↓ (stores items_json in SQLite)
[GET /api/restaurant/orders -> opsController.js]
       ↓ (parses items_json or reads memoryStore)
[RestaurantOpsPage.jsx]
       ↓ (evaluates item.title || item.name; renders fallback if empty)
[Rendered Kitchen Display]
```

### B2. Identified Root Causes

1. **Parameter Name Mismatch in `triggerRazorpayCheckout`**:
   - `CartPage.jsx` passed `{ amount: finalPayable, items: orderItems }`.
   - `razorpayService.js` destructured `{ cartItems }` instead of `{ items }`.
   - Result: `cartItems` evaluated to `undefined`, triggering `triggerRazorpayCheckout`'s internal fallback `[{ dishId: 'd1', title: 'Hyderabadi Dum Biryani', price: amount, quantity: 1 }]`. Customer multi-item cart selections were lost before reaching the backend API.

2. **Item Property Name Mismatch (`title` vs `name` vs `dishTitle`)**:
   - Cart items used `item.title` and `item.name` inconsistently across components.
   - In `RestaurantOpsPage.jsx`, items were mapped as `{item.quantity}x {item.title || item.name}`. If `title` and `name` were undefined on custom items, it rendered `1x undefined`.

3. **Fallback Text Rendering**:
   - `RestaurantOpsPage.jsx` contained a fallback line: `<p className="text-xs text-white/60">Standard Hyderabadi Dum Biryani Combo (1x)</p>` when `ord.items` was empty or unparsed, concealing true empty states.

---

## 4. Minimal Fix Plan (For Future Phase)

1. **Update `razorpayService.js` Destructuring**:
   ```javascript
   export const triggerRazorpayCheckout = async ({ amount, user, cartItems, items, foodOnFriend, ... }) => {
     const orderItems = items || cartItems;
     // ...
   ```
2. **Standardize Item Structure in `orderService.js`**:
   Ensure item objects returned in calculations explicitly contain both `title` and `name` properties:
   ```javascript
   title: item.title || item.name || 'ScrollNom Dish',
   name: item.name || item.title || 'ScrollNom Dish',
   ```
3. **Refactor `RestaurantOpsPage.jsx`**:
   Ensure all items in `ord.items` are rendered with explicit item names, quantities, and individual prices without fallback text hiding empty states.

---

## 5. Classification Matrix

- **Razorpay Browser Payment Flow**: **PASS**
- **Restaurant Item Serialization & Visibility**: **FAIL (Root cause identified)**
