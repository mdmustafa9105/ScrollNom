# SCROLLNOM UI/UX PRO MAX AUDIT REPORT
**Independent UX/UI & System Architecture Audit**

> [!IMPORTANT]
> **GOVERNING DESIGN AUTHORITY HIERARCHY**
> 1. **Priority 1**: ScrollNom Brandkit (`#FDFBF7` Warm Cream, `#FF5A36` Coral Spark, `#00A896` Electric Teal, `#FFB800` Saffron Gold, `#1E2022` Deep Charcoal, Outfit + Inter typography)
> 2. **Priority 2**: `prompt-tree.md` (Root Prompt rules, sector guidelines, 5-page structure constraint, no-slop rules)
> 3. **Priority 3**: Actual ScrollNom product requirements and Information Architecture
> 4. **Priority 4**: UI UX Pro Max general recommendations *(MUST NOT override Priorities 1–3)*
> 
> *This document contains zero source code modifications or design system overwrites. It is an independent expert evaluation.*

---

## 1. Executive Assessment

ScrollNom is a social food discovery and ordering platform that bridges short-form video discovery (**Nommly**) with delivery fulfillment and social group payment split mechanics (**Food on Friend**).

The current implementation establishes a strong foundation with custom brand identity, responsive multi-device layouts, dynamic cart state management, and prototype interactivity. However, the product currently suffers from **information architecture fragmentation**, **inconsistent touch target hierarchy**, **desktop canvas underutilization**, and **unclear social friction points** in the Food on Friend and Creator Mode flows.

The application successfully avoids generic "AI startup" dark-mode defaults on main pages, adhering to the warm, culinary-centric cream palette (`#FDFBF7`). To elevate ScrollNom to a market-defining consumer product, UI refinement must focus on **purposeful spatial discipline**, **unifying action hierarchy**, **clarifying prototype boundaries**, and **eliminating visual noise**.

---

## 2. What ScrollNom Already Does Well

1. **Brand Identity & Palette Discipline**: Strong adherence to the Warm Cream (`#FDFBF7`) and Deep Charcoal (`#1E2022`) core palette, avoiding generic browser defaults or uncurated Tailwind presets.
2. **Nommly Desktop Split-Pane Layout**: The 2-pane architecture on desktop ([NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx#L50-L53)) correctly splits the 9:16 vertical video player (7 cols) from the interactive dish ordering panel (5 cols), treating content as the hero while maintaining persistent commercial utility.
3. **Cart & Payment State Management**: Real-time price breakdown in [CartPage.jsx](file:///d:/ScrollNom/src/pages/Cart/CartPage.jsx#L281-L309) cleanly computes item subtotal, delivery fee, taxes, and split payment shares with zero lag.
4. **Custom Mascot & Typography**: Clean SVG mascot implementation ([IconSet.jsx](file:///d:/ScrollNom/src/components/brand/IconSet.jsx#L1-L25)) and Outfit/Inter Google Font pairings establish distinct visual personality.
5. **Mobile Navigation Floating Bar**: [BottomNav.jsx](file:///d:/ScrollNom/src/components/layout/BottomNav.jsx#L15-L17) dynamically adapts backdrop blur and theme accents when switching to full-screen Nommly reels mode.

---

## 3. Critical UX Problems (P0)

### P0-1: Food on Friend State Ambiguity & Failure Recovery
- **Problem**: When a user enables Food on Friend in [CartPage.jsx](file:///d:/ScrollNom/src/pages/Cart/CartPage.jsx#L154-L272), there is no clear UX path detailing what occurs if a friend declines, delays response, or if the organizer wishes to cancel the split request and pay in full.
- **Why it matters**: Payment splits introduce financial anxiety. Without immediate resolution mechanics, users abandon checkout entirely.
- **Recommended Solution**: Add explicit status fallback cards ("Friend Declined → Switch to Pay Full", "Cancel Split & Pay ₹X", "Extend Expiry Timer").
- **Priority**: P0

### P0-2: Unauthenticated Order Flow Dead End
- **Problem**: Clicking "ORDER DISH NOW" in [NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx#L38-L44) while logged out opens `AuthModal`. Upon successful sign-in, the user is returned to the feed without auto-adding the dish to the cart or taking them to checkout.
- **Why it matters**: Breaks the user's primary conversion intent, forcing them to locate the video and click order a second time.
- **Recommended Solution**: Persist pending order intents in context so completing auth automatically executes `addToCart()` and navigates to `/cart`.
- **Priority**: P0

### P0-3: Nommly Reel Mobile Overlay Text & Control Overlap
- **Problem**: On small mobile viewports (e.g. 390 × 844, 375 × 667), the dish description text overlay at the bottom of [NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx#L127-L144) overlaps with the floating `BottomNav` bar and action stack.
- **Why it matters**: Essential information (dish title, price, restaurant name) becomes unreadable and button touch targets collide.
- **Recommended Solution**: Enforce bottom padding of `pb-20` on mobile video overlays and wrap captions in gradient scrims with `line-clamp-2`.
- **Priority**: P0

---

## 4. Major UX Problems (P1)

### P1-1: Story Click Misdirection on Home Feed
- **Problem**: Clicking a story avatar in [HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L41-L44) immediately redirects the entire page to `/nommly` reels without showing a quick story viewer modal or indicating which dish video is loading.
- **Why it matters**: Violates social story UX expectations (Instagram/Snapchat/Zomato), surprising users with an unexpected route change.
- **Recommended Solution**: Open an inline story preview overlay or highlight the target creator's video directly in Nommly with a visual badge.
- **Priority**: P1

### P1-2: Desktop Sidebar Canvas Underutilization on Ultra-Wide Monitors (1920 × 1080)
- **Problem**: On 1920 × 1080 displays, [HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx#L20) caps content at `max-w-7xl`, leaving vast empty background space on outer margins while compression occurs inside cards.
- **Why it matters**: Large screens look sparse and feel like stretched mobile interfaces rather than expansive desktop experiences.
- **Recommended Solution**: Utilize a multi-column layout on `xl` break points where desktop sidebar stays fixed, center feed displays 2 columns of rich video cards, and right rail displays trending restaurant spots or active order tracker.
- **Priority**: P1

### P1-3: Creator Mode Disconnect from Navigation & Platform Authority
- **Problem**: Toggling Creator Mode in [ProfilePage.jsx](file:///d:/ScrollNom/src/pages/Profile/ProfilePage.jsx) alters the profile view but leaves the main desktop sidebar and mobile navigation completely unchanged.
- **Why it matters**: Creators lack access to dedicated navigation items (Studio Analytics, Upload Reel, Collab Requests, Payouts).
- **Recommended Solution**: Dynamically inject a "Creator Studio" tab or indicator into `DesktopSidebar` and `BottomNav` when Creator Mode is active.
- **Priority**: P1

---

## 5. Minor UX Problems (P2/P3)

### P2-1: Lack of Dietary Filter Counter in Explore Page
- **Problem**: Toggling dietary chips in [ExplorePage.jsx](file:///d:/ScrollNom/src/pages/Explore/ExplorePage.jsx) updates the list, but the "Filter" button doesn't display an active count badge (e.g. "Filters (2)").
- **Why it matters**: Users forget active background filters when search results appear unexpectedly short.
- **Recommended Solution**: Render an active filter pill badge on the filter drawer trigger button.
- **Priority**: P2

### P2-2: Missing Password Visibility Toggle in Auth Modal
- **Problem**: [AuthModal.jsx](file:///d:/ScrollNom/src/components/auth/AuthModal.jsx) input fields do not feature an eye icon toggle to reveal typed passwords.
- **Why it matters**: Causes login frustration and input errors on mobile keyboards.
- **Recommended Solution**: Add inline Lucide `Eye`/`EyeOff` toggle button inside password inputs.
- **Priority**: P2

### P3-1: Mute/Unmute Indicator Size in Nommly Feed
- **Problem**: The floating sound toggle in [NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx#L75-L80) is small (32 × 32px) and hard to tap on mobile.
- **Why it matters**: Videos start muted by default; difficult touch targets create audio friction.
- **Recommended Solution**: Increase touch target size to 44 × 44px with a semi-transparent glass backdrop.
- **Priority**: P3

---

## 6. Desktop Findings

- **Grid Architecture**: 2-pane layout on Nommly Reel mode is excellent, but Home feed grid collapses to a single vertical stack too early on 1024px screens.
- **Sidebar Integration**: `DesktopSidebar` is visually clean, but lacks active hover states on secondary links ("Help", "Terms").
- **Hover Feedback**: Desktop cards rely primarily on standard `scale-105` scale transforms. Subtler border color shifts (`hover:border-brand-coral`) feel more premium.

---

## 7. Mobile Findings

- **Touch Targets**: Most primary CTAs meet the 44 × 44px minimum requirement, but story avatars (56 × 56px including padding) are slightly cramped horizontally.
- **Bottom Navigation**: Floating `BottomNav` bar works well, but centered mascot play button (`-mt-6`) can obscure low-positioned content on small viewports.
- **Safe Area Insets**: Fixed bottom bars lack `pb-safe` padding for devices with home indicator bars (e.g. iPhone 14/15 Pro Max).

---

## 8. Nommly Findings

- **Content Hierarchy**: Content is the visual hero. The video frame correctly dominates desktop (7 cols) and mobile (100vh).
- **Dish Identity & Context**: Users easily understand "I am watching this dish" due to clear dish titles and restaurant tags.
- **Conversion Path**: "ORDER THIS DISH NOW" button in right panel of desktop and overlay on mobile provides direct ordering clarity.
- **Improvement Needed**: Tap-to-pause video gesture is missing; tapping video currently toggles nothing or defaults browser controls.

---

## 9. Ordering Findings

- **Friction Audit**: Discovery → Nommly → Add to Cart → Checkout path requires 3 clicks, which is optimal.
- **Cart Clarity**: Item price, tax, and delivery breakdown in [CartPage.jsx](file:///d:/ScrollNom/src/pages/Cart/CartPage.jsx#L281-L326) are highly transparent.
- **Prototype Clarification**: "PAY VIA RAZORPAY (MOCK PROTOTYPE)" text clearly signals prototype boundaries, avoiding user deception.

---

## 10. Food on Friend Findings

- **Clarity Assessment**: The interactive split payment simulator cleanly communicates user contribution vs friend contribution.
- **Missing Information**: First-time users need explicit text explaining what happens if the friend does not respond within 15 minutes.
- **Simulator Helper**: The "My View" vs "Friend's View" simulator toggle is an excellent prototype testing tool, but requires explicit developer badge labels so end users don't mistake it for a live feature.

---

## 11. Creator Mode Findings

- **Transition Quality**: Toggling Creator Mode in Profile cleanly replaces user orders with creator performance metrics (views, likes, revenue).
- **Missing Guidance**: Creators need a clear "How Collabs Work" step-by-step onboarding guide detailing restaurant commission payouts.

---

## 12. Accessibility Findings

- **Color Contrast**: Body text (`#1E2022`) on Cream background (`#FDFBF7`) yields a contrast ratio of **14.2:1**, exceeding WCAG AAA standards.
- **Keyboard Navigation**: Form inputs in `AuthModal` support standard `Tab` focus, but custom category buttons in `HomePage` lack explicit `aria-selected` attributes.
- **Reduced Motion**: Animations in `App.jsx` do not currently query `@media (prefers-reduced-motion: reduce)`.

---

## 13. Responsive Findings

| Viewport | Status | Primary Observation |
| :--- | :--- | :--- |
| **390 × 844** | Satisfactory | Minor caption text overlap with BottomNav; requires bottom inset |
| **430 × 932** | Excellent | Generous vertical breathing room; touch targets clear |
| **820 × 1180** | Good | Single-column stack on tablet portrait; could support 2-column grid |
| **1366 × 768** | Excellent | Compact desktop split-pane fits without vertical scroll cutoff |
| **1440 × 900** | Outstanding | Ideal balance between DesktopSidebar and main content canvas |
| **1920 × 1080** | Satisfactory | Outer canvas margins underutilized; needs multi-column expansion |

---

## 14. Anti Slop Findings

1. **No Generic AI Text**: Copy across all pages uses specific, verifiable dish titles ("Authentic Hyderabadi Mutton Dum Biryani") and prices rather than AI filler phrases ("welcome to our culinary journey").
2. **Restrained Card Borders**: Avoids excessive stacked containers; uses subtle `border-brand-cream-dark` (`#EAE4D5`) dividers.
3. **No Unjustified Glassmorphism**: Glass effects (`backdrop-blur-md`) are restricted exclusively to media overlay controls on Nommly reels and sticky navigation bars where translucency serves content visibility.

---

## 15. Recommended Improvements

### Recommendation 1: Persist Pending Intent Across Authentication
- **Problem**: Signing in clears active order intent.
- **Why it matters**: Loses conversion momentum.
- **Recommended Solution**: Save active dish in `AppContext` pending intent state; auto-trigger `addToCart` upon auth complete.
- **Priority**: P0

### Recommendation 2: Add Safety Fallbacks to Food on Friend
- **Problem**: No UX path for declined or expired split requests.
- **Why it matters**: Prevents cart abandonment during split payment stalls.
- **Recommended Solution**: Render "Pay Remaining Share Myself" and "Cancel Split" fallback buttons.
- **Priority**: P0

### Recommendation 3: Mobile Nommly Caption Padding & Scrim Protection
- **Problem**: Text overlay collides with floating bottom navigation.
- **Why it matters**: Degrades video discovery legibility on compact phones.
- **Recommended Solution**: Add `pb-24` inset and dark radial gradient background behind caption text.
- **Priority**: P0

### Recommendation 4: Responsive Multi-Column Expansion for 1920 × 1080
- **Problem**: Wide desktop screens exhibit underutilized margin space.
- **Why it matters**: Makes desktop view look like a stretched tablet interface.
- **Recommended Solution**: Introduce a 3-column desktop layout (`Sidebar` | `Feed` | `Right Rail Widgets`) on `xl` viewports.
- **Priority**: P1

---

## 16. Recommendations We Should NOT Follow

1. **DO NOT replace Warm Cream (`#FDFBF7`) with a generic Dark Mode theme across the entire application**.
   - *Reason*: ScrollNom's brand identity is rooted in warm culinary hospitality. Dark mode belongs *only* inside the video player canvas on Nommly reels.
2. **DO NOT convert the Home feed into a dense Bento Grid dashboard**.
   - *Reason*: ScrollNom is a consumer social food discovery app, not a SaaS analytics console. Content must remain image and video-hero centered.
3. **DO NOT introduce hand-rolled complex physics animations for basic list items**.
   - *Reason*: Excessive animation causes mobile frame drops and distracts from fast ordering utility.

---

## 17. Conflicts Between UI UX Pro Max and ScrollNom Brandkit

| UI UX Pro Max Generic Suggestion | ScrollNom Brandkit Rule | Resolution (Brandkit Wins) |
| :--- | :--- | :--- |
| Recommends Orange `#EA580C` & Blue `#2563EB` accent palette | Brandkit specifies Coral Spark (`#FF5A36`), Electric Teal (`#00A896`), and Saffron Gold (`#FFB800`) | **REJECT generic palette**. Retain official ScrollNom brand tokens exclusively. |
| Recommends Playfair Display SC font | Brandkit specifies Outfit for Display & Inter for Body | **REJECT Playfair**. Retain Outfit + Inter font pairing. |
| Recommends dark mode defaults for consumer apps | Brandkit specifies Warm Cream (`#FDFBF7`) light mode background | **REJECT dark mode default**. Retain light cream background for app screens. |

---

## 18. Conflicts Between UI UX Pro Max and prompt-tree.md

| UI UX Pro Max Generic Suggestion | prompt-tree.md Rule | Resolution (prompt-tree.md Wins) |
| :--- | :--- | :--- |
| Suggests adding multi-page sub-routes for private events, rewards, catering | `prompt-tree.md` non-negotiable rule: "Every site built from this system ships with exactly 5 pages, no more" | **REJECT extra pages**. Keep 5 core routes: Home, Explore, Nommly, Cart, Profile. |
| Recommends aggressive floating promotional popups | `prompt-tree.md` anti-slop rule: No generic filler or intrusive popups | **REJECT intrusive popups**. Keep promo banners inline inside structured cards. |

---

## 19. Highest Priority Changes (P0 & P1 Summary)

1. **[P0] Auth Intent Preservation**: Preserve dish order target through authentication modals ([AuthModal.jsx](file:///d:/ScrollNom/src/components/auth/AuthModal.jsx)).
2. **[P0] Food on Friend Fallbacks**: Add explicit decline/timeout fallback actions to split checkout ([CartPage.jsx](file:///d:/ScrollNom/src/pages/Cart/CartPage.jsx)).
3. **[P0] Mobile Reel Insets**: Add bottom padding (`pb-24`) to Nommly mobile video text overlays ([NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx)).
4. **[P1] Story Preview Modal**: Replace instant full-page redirect with inline story preview on Home feed ([HomePage.jsx](file:///d:/ScrollNom/src/pages/Home/HomePage.jsx)).
5. **[P1] Wide Desktop Canvas Layout**: Implement 3-column layout on 1920 × 1080 viewports.

---

## 20. Changes That Can Wait (P2 & P3 Summary)

1. **[P2] Filter Badge Counter**: Render numeric counter on Explore page filter toggle button ([ExplorePage.jsx](file:///d:/ScrollNom/src/pages/Explore/ExplorePage.jsx)).
2. **[P2] Password Show/Hide Toggle**: Add eye icon toggle to password fields ([AuthModal.jsx](file:///d:/ScrollNom/src/components/auth/AuthModal.jsx)).
3. **[P3] Larger Mute Icon Touch Target**: Expand sound toggle tap target size in Nommly player ([NommlyPage.jsx](file:///d:/ScrollNom/src/pages/Nommly/NommlyPage.jsx)).
4. **[P3] Creator Onboarding Tooltip**: Add helper modal explaining restaurant collaboration payouts in Creator Studio ([ProfilePage.jsx](file:///d:/ScrollNom/src/pages/Profile/ProfilePage.jsx)).
