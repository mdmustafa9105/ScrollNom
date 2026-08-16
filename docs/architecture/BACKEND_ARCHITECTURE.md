# ScrollNom Backend API Architecture Specification

**Application Name**: ScrollNom Backend API  
**Runtime Environment**: Node.js (ES Modules)  
**Framework**: Express.js 5.x  
**Database**: SQLite (`scrollnom.db`)  
**Network Listener**: `0.0.0.0:5000`  
**API Base URL**: `http://localhost:5000/api` (Dynamic LAN resolution supported)  

---

## 🚀 Local Development Startup

To ensure both the Vite frontend dev server and Express backend API server start together reliably, local development uses a single unified start command.

### Unified Command (Recommended)
```bash
npm run dev
```
Running `npm run dev` uses `concurrently` to start both processes in parallel with formatted color-coded logging:
- **ScrollNom Frontend**: `http://localhost:3000`
- **ScrollNom API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

### Standalone Commands
If you need to run processes independently (e.g. for specialized debugging):

| Component | Command | Endpoint / URL | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Only** | `npm run dev:frontend` | `http://localhost:3000` | Vite Development Server |
| **Backend Only** | `npm run dev:backend` | `http://localhost:5000` | Express Backend Server |

---

## 🩺 System Health Check

The backend exposes an automated health endpoint:

- **Method**: `GET`
- **Endpoint**: `/api/health`
- **URL**: `http://localhost:5000/api/health`
- **HTTP Status**: `200 OK`
- **Response Format**:
```json
{
  "ok": true,
  "service": "scrollnom-api",
  "version": "1.0.0",
  "mode": "development",
  "timestamp": "2026-08-15T00:30:00.000Z"
}
```

---

## 🗄️ Database & State Management

- **Storage**: Persistent SQLite database located at [scrollnom.db](file:///d:/ScrollNom/scrollnom.db).
- **In-Memory Cache**: `server/db/memoryStore.js` syncs user profiles, orders, and delivery telemetry directly with SQLite.
- **Shared Architecture**: A single running backend instance services all client roles (Customer, Restaurant KDS, and Delivery Rider) across localhost and local Wi-Fi LAN networks (`0.0.0.0:5000`).

---

## 🔑 Authentication & User Synchronization

1. **Client Firebase Auth**: Client authenticates with Firebase Web SDK (Google OAuth popup or email/password).
2. **ID Token Exchange**: Client obtains Firebase ID token and issues a POST request:
   ```http
   POST /api/users/sync HTTP/1.1
   Host: localhost:5000
   Authorization: Bearer <FIREBASE_ID_TOKEN>
   Content-Type: application/json
   ```
3. **Backend Middleware**: `requireAuth` ([server/middleware/requireAuth.js](file:///d:/ScrollNom/server/middleware/requireAuth.js)) verifies token signature/claims and populates `req.user`.
4. **User Profile Persistence**: `syncUserOnAuth` in `userController.js` creates or fetches the user record in SQLite.

---

## 🌐 Three-Laptop & LAN Architecture

- **Host Binding**: `app.listen(PORT, '0.0.0.0', ...)` ensures backend binds to all network interfaces.
- **Dynamic API Host**: [src/config/api.js](file:///d:/ScrollNom/src/config/api.js) automatically resolves `window.location.hostname`, ensuring LAN devices (`http://<LAN_IP>:3000`) connect directly to `http://<LAN_IP>:5000/api`.
- **CORS Configuration**: `cors({ origin: true, credentials: true })` permits all local LAN origins without restrictive wildcards.
