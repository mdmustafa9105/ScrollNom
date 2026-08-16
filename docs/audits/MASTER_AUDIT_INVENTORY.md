# ScrollNom Master System Audit — Project Inventory (Step 0)

## 📁 Repository Structure Overview

### 1. Environment & Config Files
- `.env`: Environment variables (Razorpay Key ID, Resend Key, Port `5000`, etc.)
- `.env.local`: Local secret overrides
- `package.json`: NPM package configuration & scripts (`dev`, `build`, `preview`, `lint`, `server`)
- `vite.config.js`: Vite bundling configuration (`port: 3000`, `host: true`)
- `tailwind.config.js`: ScrollNom Brandkit colors (`#FDFBF7` Warm Cream, `#FF5A36` Coral Spark, `#00A896` Electric Teal, `#FFB800` Saffron Gold, `#1E2022` Deep Charcoal) and typography scales.
- `scrollnom.db`: Persistent SQLite Database

### 2. Frontend Source (`src/`)
- `src/App.jsx`: Main application container & role router (`home`, `explore`, `nommly`, `cart`, `profile`, `restaurant`, `rider`)
- `src/config/api.js`: Dynamic LAN host resolution (`http://${window.location.hostname}:5000/api`)
- `src/config/firebase.js`: Firebase Client SDK (`auth`, `GoogleAuthProvider`, `signInWithPopup`)
- `src/context/AppContext.jsx`: React global state provider (user authentication, cart management, Food on Friend splits, toasts, username modal trigger)
- `src/pages/Home/HomePage.jsx`: Customer Home Feed with personalized following & suggested creator reels
- `src/pages/Explore/ExplorePage.jsx`: Search, dish discovery & category grid
- `src/pages/Nommly/NommlyPage.jsx`: Vertical video reels experience with Order CTAs, comments & interactions
- `src/pages/Cart/CartPage.jsx`: Cart summary, Food on Friend split pay options, Razorpay TEST MODE trigger, and Live Tracking button
- `src/pages/Profile/ProfilePage.jsx`: Public/Private profile view, followers/following counts, Creator Mode toggle
- `src/pages/RestaurantOps/RestaurantOpsPage.jsx`: Kitchen Display System for Laptop 2 (Paradise Biryani Palace)
- `src/pages/RiderOps/RiderOpsPage.jsx`: Rider Operations Portal for Laptop 3 (Vikram Singh)
- `src/components/auth/AuthModal.jsx`: Google Sign In & Email authentication modal
- `src/components/auth/UsernameOnboardingModal.jsx`: Username selection modal for new Google accounts
- `src/components/delivery/LiveTrackingModal.jsx`: Real-time SSE Customer Live Delivery Tracking Panel
- `src/services/razorpayService.js`: Razorpay TEST MODE checkout wrapper

### 3. Backend Source (`server/`)
- `server/index.js`: Express application entry point (listens on `0.0.0.0:5000`, CORS configured for LAN origins)
- `server/db/database.js`: SQLite connection (`scrollnom.db`) & schema initialization (`users`, `follows`, `content`, `likes`, `saves`, `views`, `order_intents`, `confirmed_orders`, `deliveries`, `delivery_events`, `orders`)
- `server/db/memoryStore.js`: Transient development store helper
- `server/middleware/requireAuth.js`: Firebase Bearer token verification middleware
- `server/middleware/optionalAuth.js`: Optional authentication middleware
- `server/middleware/errorHandler.js`: Global Express error handler
- **Routes (`server/routes/`)**:
  - `healthRoutes.js`: `GET /api/health`
  - `userRoutes.js`: Sync, username check, claim username, user search, profile, follow/unfollow
  - `contentRoutes.js`: Feed, likes, saves, user content
  - `analyticsRoutes.js`: View events, order intents
  - `deliveryRoutes.js`: Delivery adapters, tracking, SSE stream, simulate step
  - `opsRoutes.js`: Restaurant orders, rider deliveries, delivery status updates
  - `orderRoutes.js`: Order creation & lookup
  - `paymentRoutes.js`: Razorpay order creation & signature verification
  - `foodOnFriendRoutes.js`: Split pay state machine
  - `webhookRoutes.js`: Delivery provider webhooks
- **Modules & Services (`server/modules/` & `server/services/`)**:
  - `server/modules/delivery/deliveryService.js`: Delivery orchestrator
  - `server/modules/delivery/providers/scrollnomAdapter.js`: Active development provider adapter & rider simulator
  - `server/modules/delivery/providers/zomatoAdapter.js`: Zomato `NOT_CONNECTED` adapter stub
  - `server/modules/delivery/providers/swiggyAdapter.js`: Swiggy `NOT_CONNECTED` adapter stub
  - `server/modules/delivery/tracking/trackingService.js`: SSE stream broadcast manager
  - `server/modules/delivery/tracking/locationService.js`: Haversine distance calculation & route step interpolation

### 4. Test Suites (`server/`)
- `server/test_backend.js`: Phase 3 backend foundation test
- `server/test_phase3a_verification.js`: Integration verification test
- `server/test_phase4_auth.js`: Firebase auth test
- `server/test_phase5_social.js`: Social graph test
- `server/test_phase6_social_content.js`: Social content graph test
- `server/test_phase7_delivery.js`: Delivery engine test
- `server/test_three_laptop_demo.js`: Three-laptop multi-actor E2E test
- `server/test_phase8a_google_razorpay.js`: Google Auth & Razorpay test suite
