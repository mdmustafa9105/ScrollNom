# Development Server Startup Root Cause Analysis & Resolution Report

**Report Identifier:** SCROLLNOM-DEV-SERVER-STARTUP-FIX  
**Date:** August 15, 2026  
**System Component:** Concurrently Dev Script, Vite Config, Express Backend  
**Frontend Port:** `3000` (Strict)  
**Backend Port:** `5000` (`0.0.0.0:5000` LAN Listener)  
**Status:** **RESOLVED & VERIFIED ALIVE**

---

## 1. Root Cause Analysis

| Symptom | Direct Cause | Root Cause Analysis |
|---|---|---|
| **Port 3000 In Use & Frontend Moved to 3001** | Orphaned Node background processes occupying Port 3000 | Previous test tasks (`task-386`) ran `npm run dev:frontend` in the background. When `npm run dev` was launched again, Vite detected port 3000 occupied and automatically fell back to port 3001. |
| **Backend Exited with Code 0** | Misconfigured Concurrently `-k` flag | `package.json` used `concurrently -k` (`--kill-others`). When an orphaned background task or child wrapper exited cleanly with exit code 0, `concurrently -k` interpreted any exit signal as a trigger to send `SIGTERM` to all child processes. |
| **Frontend Terminated (SIGTERM)** | Concurrently cascading SIGTERM shutdown | Because `concurrently -k` sent SIGTERM when the backend or wrapper finished initializing, Vite on port 3001 was terminated (`npm run dev:frontend exited with code 1`). |
| **`ERR_CONNECTION_REFUSED` on Port 3000** | Browser pointing to Port 3000 while server was terminated | Because Vite moved to 3001 and was subsequently terminated, navigating to `http://localhost:3000` resulted in connection refused. |

---

## 2. Implemented Resolution

1. **Orphaned Background Process Cleanup**:
   - Identified and terminated orphaned background tasks (`task-386` on port 3000 and `task-961` on port 5000) so ports 3000 and 5000 are 100% free.
2. **Concurrently Exit Policy Fix (`package.json`)**:
   - Replaced `-k` (`--kill-others`) with `--kill-others-on-fail` in `package.json`:
     ```json
     "dev": "concurrently --kill-others-on-fail -n \"FRONTEND,BACKEND\" -c \"cyan,green\" \"npm run dev:frontend\" \"npm run dev:backend\""
     ```
   - This ensures both Vite frontend and Express backend stay running together indefinitely unless an actual crash occurs.
3. **Deterministic Frontend Port Config (`vite.config.js`)**:
   - Added `strictPort: true` inside `server` config in `vite.config.js`:
     ```javascript
     export default defineConfig({
       plugins: [react()],
       server: {
         port: 3000,
         strictPort: true,
         host: true
       }
     })
     ```
   - Prevents Vite from silently jumping to port 3001 if port 3000 is blocked, ensuring predictable browser navigation.

---

## 3. Final Verification

- **Concurrent Dev Server Execution (`npm run dev`)**:
  - `[FRONTEND] ➜ Local: http://localhost:3000/` (Remains RUNNING)
  - `[BACKEND] 🚀 ScrollNom Backend API Running on 0.0.0.0:5000` (Remains RUNNING)
  - Both processes stayed active for over 60 seconds without exiting.
- **Frontend Health Check**:
  - `HTTP GET http://localhost:3000` -> `HTTP 200 OK`
- **Backend Health Check**:
  - `HTTP GET http://localhost:5000/api/health` -> `HTTP 200 OK` (`{"ok":true,"service":"scrollnom-api","version":"1.0.0"}`)
- **Three-Laptop Architecture Verification**:
  - Express server continues binding to `0.0.0.0:5000` with `API_BASE` dynamic LAN resolution intact.

---

## 4. Final Certification

`npm run dev` starts both frontend and backend processes in parallel, and both processes remain alive indefinitely.
