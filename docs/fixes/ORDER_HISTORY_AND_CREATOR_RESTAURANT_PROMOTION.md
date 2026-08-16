# Phase 13 Documentation: Order History & Creator-Restaurant Promotion

## 1. What Was Implemented

### Customer Order History & Persistent Live Order Tracking
1. **Persistent Customer Order History (`GET /api/orders/my`)**:
   - Queries SQLite `orders` table LEFT JOINed with `deliveries` table for the authenticated user (`req.user.uid`).
   - Renders order card showing Order ID, Restaurant name, Date/time, Items list with quantities, Total amount, Payment status (`PAID`), and current order status with user-friendly text mapping.
   - Includes filter tabs: `All`, `Active`, `Completed`, `Cancelled`.

2. **Security & User Isolation (`GET /api/orders/:id`)**:
   - Authorization check prevents User B from inspecting User A's order ID (returns `HTTP 403 Forbidden`).

3. **Persistent Live Order Status Timeline**:
   - Interactive modal (`LiveOrderTrackingModal`) displaying real-time step timeline (`ORDER PLACED` → `RESTAURANT RECEIVED` → `RESTAURANT ACCEPTED` → `PREPARING` → `READY FOR PICKUP` → `RIDER ASSIGNED` → `PICKED UP` → `OUT FOR DELIVERY` → `DELIVERED`).
   - Polls delivery telemetry & displays active Rider info, ETA, and pickup location.

4. **Reorder CTA**:
   - Adds previous order items back into active cart without automatically placing an order.

### Creator → Restaurant Promotion & Collaboration
1. **Public Restaurant Profile (`PublicRestaurantProfileModal`)**:
   - Public view displaying restaurant info, Bengaluru location (Indiranagar / Koramangala / HSR Layout), cuisine, hours, price range, popular dishes, and Nommly content.
   - For authenticated Creator users (`user.isCreator`): Displays prominent `[ PROMOTE THIS RESTAURANT ]` button (hidden for normal customers).

2. **Promotion Request Submission (`POST /api/collaborations`)**:
   - Modal (`PromoteRestaurantModal`) allows creators to select target dish, promotion type (`Nommly Reel`, `Food Review`, `Dish Feature`), and a custom collaboration message.
   - Persists collaboration request in SQLite `creator_collaborations` table with state machine: `pending` → `accepted` | `declined`.

3. **Restaurant Dashboard Creator Requests Tab**:
   - Restaurant Portal (`?role=restaurant`) features a "Creator Requests" tab displaying incoming creator requests with `[ ACCEPT ]` and `[ DECLINE ]` actions.

4. **Creator Studio Collaborations Hub**:
   - Creator Profile (`ProfilePage`) features a "Restaurant Collaborations" section showing Pending, Accepted, Declined, and Completed request status cards.

---

## 2. Files Changed & Created

| File | Change Type | Purpose |
|------|-------------|---------|
| `server/db/database.js` | Modified | Created `creator_collaborations` SQLite table & updated default restaurant locations to Bengaluru context |
| `server/controllers/orderController.js` | Modified | Added `getUserOrders` (`/api/orders/my`) and security user isolation check in `getOrderById` |
| `server/routes/orderRoutes.js` | Modified | Exposed `/api/orders/my` endpoint protected by `requireAuth` |
| `server/controllers/collaborationController.js` | NEW | Controller for creator promotion requests & status management |
| `server/routes/collaborationRoutes.js` | NEW | Routes for creator & restaurant collaboration endpoints |
| `server/index.js` | Modified | Mounted `/api` collaborationRoutes |
| `src/data/mockData.js` | Modified | Updated restaurant locations to Bengaluru context |
| `src/components/orders/LiveOrderTrackingModal.jsx` | NEW | Modal for persistent live order status timeline & GPS telemetry |
| `src/components/orders/OrderHistoryView.jsx` | NEW | Component for persistent customer order history cards & filters |
| `src/components/restaurant/PublicRestaurantProfileModal.jsx` | NEW | Public restaurant profile view & Creator promotion CTA |
| `src/components/restaurant/PromoteRestaurantModal.jsx` | NEW | Modal for creator promotion request submission |
| `src/pages/Profile/ProfilePage.jsx` | Modified | Integrated Order History view and Creator Collaborations hub |
| `src/pages/RestaurantOps/RestaurantOpsPage.jsx` | Modified | Added Creator Requests tab & Accept/Decline actions |
| `src/pages/Explore/ExplorePage.jsx` | Modified | Integrated PublicRestaurantProfileModal on restaurant card click |
| `src/pages/Cart/CartPage.jsx` | Modified | Added `[ TRACK LIVE ORDER ]` and `[ VIEW ORDER HISTORY ]` buttons post-confirmation |

---

## 3. API Routes

- `POST /api/orders` — Create order (Auth)
- `GET /api/orders/my` — Get authenticated user's order history (Auth)
- `GET /api/orders/:id` — Get specific order details with user isolation check (Auth)
- `POST /api/collaborations` — Creator submits promotion request (Auth)
- `GET /api/creator/collaborations` — Fetch creator's collaborations (Auth)
- `GET /api/restaurant/collaborations` — Fetch restaurant's incoming creator requests
- `PATCH /api/restaurant/collaborations/:id/status` — Restaurant accepts/declines collaboration

---

## 4. Database Changes

Created `creator_collaborations` table in `scrollnom.db`:
```sql
CREATE TABLE IF NOT EXISTS creator_collaborations (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL,
  creator_username TEXT,
  creator_name TEXT,
  creator_avatar TEXT,
  restaurant_id TEXT NOT NULL,
  restaurant_name TEXT NOT NULL,
  dish_id TEXT,
  dish_title TEXT,
  promotion_type TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Browser Verification

- Tested using real **Microsoft Edge** (`msedge.exe`).
- **Customer Flow**: Order created → Razorpay TEST payment → Order history persistent in SQLite → Live Order Tracker displays step timeline → Reorder CTA populates cart.
- **Security Check**: User B request to User A order returned `HTTP 403 Forbidden`.
- **Creator Flow**: Explore → Restaurants → Public Profile → `[ PROMOTE THIS RESTAURANT ]` → Request submitted in `pending` state.
- **Restaurant Flow**: Restaurant Portal → Creator Requests → `[ ACCEPT ]` → Status updated to `accepted`.
- **Creator Verification**: Creator Studio reflects `accepted` status.

---

## 6. Known Limitations

- Resend email dispatches require valid network API key in environment for outbound SMTP delivery (fails gracefully without interrupting HTTP responses).
- Reorder CTA populates items into current cart but requires standard customer checkout to place order.
