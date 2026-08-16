# Restaurant & Rider Portal Stale Order Fix

## Root Cause
In `server/controllers/opsController.js`, both `getRestaurantOrders` and `getRiderDeliveries` endpoints queried SQLite `deliveries` table without any `WHERE` clause status filtering (`SELECT ... FROM deliveries ORDER BY created_at DESC LIMIT 20`). As a result, historical orders with status `delivered`, `cancelled`, or `failed` were indiscriminately fetched and rendered in the active operational queues of the Restaurant and Rider portals upon login and page refresh.

## Files Changed
- **`server/controllers/opsController.js`**: Introduced active status filtering arrays and modified SQL queries to execute parameterized `IN` clause filtering.

## Active Status Mapping
```javascript
// Active status definitions for operational queue filtering
const RESTAURANT_ACTIVE_STATUSES = [
  'restaurant_received',
  'accepted',
  'preparing',
  'ready_for_pickup'
];

const RIDER_ACTIVE_STATUSES = [
  'ready_for_pickup',
  'rider_assigned',
  'picked_up',
  'out_for_delivery'
];
```

## Operational vs Historical State
- **Active Operational State**: Filtered dynamically by active status in backend queries. When an order transitions to `delivered` or `cancelled`, it automatically drops out of the active operational queue without deleting database records.
- **Historical State**: Historical records remain preserved in the `deliveries` and `orders` SQLite tables for audit, reporting, and order history queries.

## Real Browser Verification Results

### 1. Fresh Login Empty States
- **Restaurant Portal (`/?role=restaurant`)**: Confirmed empty state on fresh login. Old completed order `ORD-1786794315348-466` is **NOT** present (`false`).
- **Rider Portal (`/?role=rider`)**: Confirmed empty state on fresh login. Old completed delivery `del_1786794526298_6993` is **NOT** present (`false`).

### 2. New Real Order Lifecycle Execution
- **Order ID Created**: `ORD-1786795618276-889` (Delivery ID: `del_1786795618674_7979`)
- **Restaurant Active Queue**: New order `ORD-1786795618276-889` appeared in the Restaurant Portal while in `restaurant_received` / `preparing` state (`true`).
- **Rider Active Queue**: Delivery appeared in the Rider Portal when advancing to `ready_for_pickup` / `rider_assigned` state (`true`).
- **Post-Delivery Completion**: Upon reaching `delivered` status:
  - Cleared from Restaurant Active Queue (`true`).
  - Cleared from Rider Active Queue (`true`).
  - SQLite database history preserved.

## Evidence Artifacts
- Screenshot 01: `docs/fixes/stale_order_fix_evidence/01_restaurant_fresh_login_empty.png`
- Screenshot 02: `docs/fixes/stale_order_fix_evidence/02_rider_fresh_login_empty.png`
- Screenshot 03: `docs/fixes/stale_order_fix_evidence/03_restaurant_active_order.png`
- Screenshot 04: `docs/fixes/stale_order_fix_evidence/04_rider_active_delivery.png`
- Screenshot 05: `docs/fixes/stale_order_fix_evidence/05_restaurant_post_delivery_empty.png`
- Screenshot 06: `docs/fixes/stale_order_fix_evidence/06_rider_post_delivery_empty.png`

## Final Result
**PASS** — Restaurant and Rider operational queues now strictly display active, actionable operational work only. Historical completed orders do not contaminate fresh logins or active queues.
