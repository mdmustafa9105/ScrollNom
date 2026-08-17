# SCROLLNOM REAL LAN MULTI-LAPTOP FAILURE REPORT

**Date**: August 17, 2026  
**Auditor**: Antigravity AI Engineering  
**Scope**: Diagnostic audit of real-world multi-laptop integration failure between Customer (Laptop A) and Restaurant/Rider (Laptop B)  

---

## 1. Problem Statement

When a user places an order on Laptop A (Customer), the order is successfully processed and recorded in the database. However, Laptop B (Friend's laptop running the Restaurant / Delivery application) does **NOT** detect or display the incoming order in real time.

---

## 2. Root Cause Analysis

### Cause 1: Split-Brain Local Server Processes (Primary Blocker)
- **Mechanism**: If Laptop B runs `npm run dev` locally, it launches a second, completely separate Node.js server process on Laptop B (`localhost:5000`) and opens its own independent SQLite database (`scrollnom.db`).
- **Impact**: When Laptop A creates an order, it writes to Laptop A's SQLite database. Laptop B polls its *own* local database (`localhost:5000`), which has zero records of Laptop A's order.
- **Architectural Requirement**: There must be **only ONE host backend server** running on Laptop A. Laptop B must point its browser to Laptop A's LAN IP (`http://<HOST_LAN_IP>:3000`).

### Cause 2: Hardcoded API Base in `userApi.js`
- **Mechanism**: In `src/services/userApi.js`:
  ```javascript
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  ```
- **Impact**: When Laptop B executes user profile search queries, it attempts to fetch `http://localhost:5000/api/users/search`. On Laptop B, `localhost:5000` is either down or points to the wrong server instance.

### Cause 3: Polling Architecture vs Network Latency/Firewall
- **Mechanism**: `RestaurantOpsPage.jsx` fetches active orders via `setInterval` polling every 4 seconds to `${API_BASE}/restaurant/orders`.
- **Impact**: If Laptop A's Windows Firewall blocks inbound TCP port `5000` on the local network (e.g. if the Wi-Fi connection is classified as a "Public Network" profile in Windows), Laptop B's HTTP requests to `http://10.103.5.239:5000/api/restaurant/orders` fail with `net::ERR_CONNECTION_TIMED_OUT`.

---

## 3. Real LAN Multi-Laptop Diagnostic Results

1. **Host LAN IP Binding**:
   - Host Backend (`0.0.0.0:5000`) -> Listening on IPv4 `10.103.5.239`
   - Verified Endpoint: `http://10.103.5.239:5000/api/health` returns `HTTP 200 OK` (`ok: true`).
2. **Frontend Host Binding**:
   - Vite Config (`vite.config.js`) has `host: true` enabled.
   - Frontend accessible at `http://10.103.5.239:3000`.
3. **CORS Policy**:
   - `server/index.js` enables CORS with `origin: true` and `credentials: true`.
   - Allows requests from any origin reflecting the requesting LAN host header.

---

## 4. Step-by-Step Fix & Deployment Plan

### Step 1: Ensure Correct Host Launch
- On **Laptop A (Host)** only, run:
  ```bash
  npm run dev
  ```
- Ensure backend (`:5000`) and frontend (`:3000`) are active on Laptop A.

### Step 2: Friend Access Guidelines (Laptop B / Laptop C)
- Do **NOT** run `npm run dev` on Laptop B.
- On Laptop B browser, open:
  - Customer App: `http://<HOST_LAN_IP>:3000/`
  - Restaurant App: `http://<HOST_LAN_IP>:3000/?role=restaurant`
  - Rider App: `http://<HOST_LAN_IP>:3000/?role=rider`

### Step 3: Unify API Base URL
- Refactor `src/services/userApi.js` to import `API_BASE` from `src/config/api.js` instead of using `http://localhost:5000`.

### Step 4: Firewall Rules (If Blocked)
- Run PowerShell as Administrator on Laptop A to allow inbound LAN traffic:
  ```powershell
  New-NetFirewallRule -DisplayName "ScrollNom Dev Server" -Direction Inbound -LocalPort 3000,5000 -Protocol TCP -Action Allow
  ```
