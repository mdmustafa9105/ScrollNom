# Website Prompt Tree
### Master prompt + sector branches for content, chatbot & SEO

How this works: every sector prompt below **inherits the Root Prompt rules**. Copy the Root Prompt + the relevant Sector Prompt together, fill in the `{{ }}` placeholders with the real business info, and feed the combined text to your AI tool of choice. This keeps every site premium and on-brand instead of generic.

---

## 🌳 ROOT PROMPT (applies to every sector — always include this)

```
You are building the content, chatbot, and SEO foundation for a premium business website. Follow these non-negotiable rules:

STEP 0 — RESEARCH BEFORE BUILDING (do this before writing any copy or design direction):
- Identify 3–5 real, currently live websites in the SAME niche and, where possible, the SAME sub-niche (not just the broad sector). A "clothing brand" prompt is useless without knowing if it's luxury ethnic wear, activewear, or everyday casual — those need opposite design languages.
- From those references, extract: common layout conventions, color psychology actually used in that niche, typography mood (serif/editorial vs geometric sans/futuristic vs handwritten/organic), and what visitors expect to find immediately (price? booking? portfolio? trust signals?).
- Never generate design direction from a generic "premium website" template. Ground every color, font, and layout choice in what this specific niche/sub-niche actually signals to its actual audience. This is the difference between a website that tastes like something and one that's cooked with no salt.
- Effort split: spend roughly 30% of total effort on this research/grounding step, and 70% on actually building (copy, chatbot, SEO, design). Research is meant to inform fast, specific decisions — not to become the deliverable itself. Once the pattern from the references is clear, move to building.

STEP 0.5 — UI DESIGN STYLE + MOOD BOARD (pick this right after Step 0 research, before building):
- Choose ONE primary UI design style from this list, based on what Step 0 research showed the niche/sub-niche actually expects — never pick a style because it's trendy in isolation:
  1. Skeuomorphism — realistic textures/depth mimicking physical objects. Fits: heritage/craft brands, tactile products.
  2. Neomorphism — soft extruded/pressed surfaces, monochrome. Fits: dashboards, subtle app-like tools; rarely main-site-appropriate (low contrast hurts accessibility) — use sparingly.
  3. Glassmorphism — frosted-glass translucency, blur, layered depth. Fits: modern/premium services, beauty, media/tech.
  4. Claymorphism — soft, rounded, inflated 3D shapes. Fits: friendly/approachable brands, wellness, everyday-wear, kids/lifestyle.
  5. Minimalism — restrained, high whitespace, few elements. Fits: healthcare, legal, luxury, portfolios — anywhere trust or focus matters most.
  6. Maximalism — dense, expressive, layered pattern/color. Fits: culturally rich fashion, restaurants, art/entertainment brands.
  7. Brutalism — raw, high-contrast, unpolished-on-purpose, bold type. Fits: fitness, streetwear, creative agencies wanting an edgy signal.
  8. Liquid Glass — fluid, animated, refractive glass-morph motion (Apple-style dynamic glass). Fits: futuristic/tech-forward sectors — media/video agencies, cutting-edge product launches.
  9. Bento Grid — modular grid of varied-size cards, Apple/tech-keynote style. Fits: e-commerce catalogs, portfolios, course/program overviews, anything with many distinct items to summarize at a glance.
  10. Spatial UI — depth, layering, parallax, 3D-feeling navigation. Fits: real estate (virtual walkthrough feel), media agencies, premium portfolios.
- Each sector prompt below names its recommended style(s) as a default — treat it as a starting point, not a rule, and adjust based on what Step 0 actually found.
- Build a lightweight mood board before implementation: the chosen color palette, the chosen Google Fonts pairing, 2-3 reference screenshots/patterns pulled from Step 0, and the chosen UI style name, all in one place. Every design decision after this point should trace back to something on the mood board — if a component doesn't fit the mood board, it doesn't belong on the site.

ANIMATION, TRANSITIONS & EFFECTS LAYER:
- Once the UI style is chosen, implement motion using established component libraries rather than hand-rolled animation — this is what separates a site that merely looks styled from one that feels premium, fast, and alive:
  - Motion Primitives (motion-primitives.com) — Framer Motion + Tailwind React components: text effects, morphing dialogs, spotlight/cursor effects, animated backgrounds, scroll-triggered reveals, progressive blur. Strong fit for Glassmorphism, Liquid Glass, Minimalism, and Spatial UI styles.
  - React Bits (reactbits.dev) — large open-source library of animated React components: text animations, animated backgrounds, GSAP/Three.js-powered effects, interactive UI pieces. Strong fit for Brutalism, Maximalism, Bento Grid, and Spatial UI styles where bolder or more playful motion fits.
  - Pick components from whichever of these two best matches the chosen UI style and mood board, restyle them with the sector's color/font system, and use motion purposefully: page-load reveals, scroll-triggered storytelling, hover/cursor feedback, and state transitions (loading, success, cart update) — never motion for its own sake, and always respect prefers-reduced-motion.


- Every site built from this system ships with exactly 5 pages, no more. Sector prompts below list which 5. If a sector's natural page list runs longer, consolidate: fold secondary content into a section of a related page (e.g. "Private Events" becomes a section on the About page; "Membership Packages" becomes a section on the Services page) rather than adding a 6th page.
- Fewer, denser pages beat many thin ones — each of the 5 pages should be substantial enough to stand on its own for both users and SEO.

FONTS & COMPONENTS:
- Fonts: source from Google Fonts only. Pick one display/heading font + one body font, pair them deliberately (contrast in weight or style, not two similar fonts), and justify the pairing against the niche mood identified in Step 0.
- Don't invent UI patterns from scratch. Reference established, proven component systems/libraries (e.g. shadcn/ui, Radix, Tailwind UI, Material Design, Headless UI) for things like nav, cards, forms, modals — then restyle them with the sector's color/font system so they still feel custom, not generic.

ANTI-SLOPPY-AI RULES:
- Never use generic AI filler phrases: "welcome to," "in today's fast-paced world," "we are passionate about," "look no further," "unlock your potential," "elevate your experience," "at [Business], we believe."
- Every sentence must contain a specific, verifiable detail about THIS business (its actual services, location, price range, differentiators). If a sentence could apply to any competitor, rewrite it.
- Headlines lead with a concrete benefit or outcome, not an adjective ("Book same-day root canal in {{CITY}}" not "Exceptional Dental Care").
- No stock-photo-style visual descriptions ("smiling diverse team," "handshake"). Describe real, specific imagery tied to the business.
- Vary sentence length and rhythm. Avoid repeating the same sentence structure three times in a row.
- Do not pad copy to hit a word count. Cut anything that doesn't inform or persuade.

CONTENT REQUIREMENTS:
- Business name: {{BUSINESS_NAME}}
- Location/service area: {{LOCATION}}
- Core offer(s): {{SERVICES_OR_PRODUCTS}}
- Target customer: {{TARGET_AUDIENCE}}
- Primary conversion goal (book, buy, call, quote): {{PRIMARY_GOAL}}
- Brand tone (3 adjectives, not "professional and friendly"): {{TONE}}
- What makes this business different from competitors: {{DIFFERENTIATOR}}

DESIGN DIRECTION (premium feel, niche-grounded — not generic):
- Palette and mood MUST match sector reality, not a default "premium" look: futuristic/bold for tech-forward and creative sectors (media, video, digital agencies), clean/trustworthy for service and healthcare sectors, restrained/editorial for luxury and portfolio sectors. Sector prompt below specifies the exact direction — never override it with a generic dark-mode-gradient "AI startup" look unless the sector actually calls for it.
- Generous whitespace, restrained color palette (1 primary + 1 accent, justified by brand and by Step 0 research: {{COLOR_RATIONALE}})
- Typography: one distinctive Google Fonts display font for headings, one highly readable Google Fonts body font — never default system fonts, never an ill-fitting pairing
- No clip-art icons; use custom or line-icon style consistent throughout
- Micro-interactions/hover states should feel intentional, not decorative for its own sake

CHATBOT SPEC (base rules — sector prompt adds specifics):
- Persona name and voice matching brand tone: {{TONE}}
- Answers only questions within defined scope (see sector prompt); escalates to human/contact form outside scope
- Opens with a specific, non-generic first message referencing the actual business, not "Hi! How can I help you today?"
- Always nudges toward the Primary Goal above without being pushy — one soft CTA per exchange, not every message

SEO SPEC (base rules — sector prompt adds specifics):
- Target long-tail, intent-specific keywords tied to {{LOCATION}} + {{SERVICES_OR_PRODUCTS}}, not generic head terms
- Unique meta title (≤60 chars) and meta description (≤155 chars) per page, each containing a real value proposition, not a keyword stuffed restatement of the H1
- Use schema markup appropriate to the business type (see sector prompt)
- Internal linking structure reflects actual user intent paths, not just a flat sitemap
```

---

## 🍽️ Restaurant / Food & Beverage

```
SECTOR ADDITIONS — RESTAURANT:

Pages (5): Home, Menu, Reservations, About (incl. story + private events), Contact
Content focus:
- Lead with signature dish or dining experience, not "delicious food since {{YEAR}}"
- Menu descriptions use specific sourcing/technique details (e.g. "dry-aged 28 days," "wood-fired at 900°F") — never "mouth-watering" or "to die for"
- Include real operational specifics: dress code, reservation lead time, dietary accommodation process

Chatbot scope: reservations, hours, menu/dietary questions (allergens, vegan/gluten-free options), private event inquiries, parking/location. Escalates: complaints, large group catering quotes.

SEO focus: "{{CUISINE}} restaurant {{NEIGHBORHOOD}}," "best {{DISH}} in {{CITY}}," reservation-intent keywords. Schema: Restaurant, Menu, LocalBusiness, AggregateRating.

Design cues: food photography-first layout, warm/appetite-triggering but not oversaturated color grading, menu as scannable typographic hierarchy not a PDF dump.
Color/font direction: warm earth tones or deep jewel tones depending on cuisine formality (fine dining = deep burgundy/charcoal/gold accent; casual = terracotta/cream). Google Fonts: serif or slab-serif display (e.g. Fraunces, Playfair Display) + clean sans body (e.g. Inter, Work Sans).
UI style: Minimalism for fine dining, Maximalism for culturally rich/casual cuisine — pick per Step 0 findings. Animation: Motion Primitives for subtle menu-reveal and image transitions (fine dining); React Bits for richer animated backgrounds/textures (maximalist casual).
```

---

## 🏥 Healthcare / Clinic

```
SECTOR ADDITIONS — HEALTHCARE:

Pages (5): Home, Services/Conditions Treated, Providers/Team, Book Appointment (incl. patient resources/insurance), Contact
Content focus:
- Lead with the specific condition/outcome patients search for, not "compassionate care"
- Provider bios include real credentials, specialties, years in practice — no generic "dedicated to your health"
- Clear, plain-language explanation of what to expect at first visit

Chatbot scope: appointment booking/rescheduling, insurance accepted, new patient intake questions, office hours/location. Escalates: symptom-specific medical questions (must redirect to call/book, never diagnose), billing disputes.

SEO focus: "{{CONDITION/SPECIALTY}} doctor {{CITY}}," "{{SERVICE}} near me," insurance-provider-name searches. Schema: MedicalBusiness/Physician, LocalBusiness, FAQPage for common patient questions.

Design cues: calm, clinical-but-warm palette (avoid clichéd teal/blue-only), clear visual hierarchy for urgent actions (book now, call now), accessibility-first (contrast, font size) since this is legally and ethically important for healthcare.

Compliance note: avoid any medical claims that require regulatory review; keep chatbot strictly non-diagnostic.
Color/font direction: must read as professional and trustworthy above all — clean blue, teal, or sage green paired with white/off-white; avoid anything trendy or futuristic that undermines clinical credibility. Google Fonts: highly legible geometric sans throughout (e.g. Inter, Source Sans 3, Public Sans) — no decorative display font.
UI style: Minimalism — near-exclusively; avoid Neomorphism (low contrast hurts accessibility here) and anything trend-heavy. Animation: Motion Primitives, used sparingly — gentle scroll reveals and form-state transitions only, nothing playful.
```

---

## 🛒 E-commerce / Retail

```
SECTOR ADDITIONS — E-COMMERCE:

Pages (5): Home, Shop/Collections, Product (template page), Cart/Checkout, About & Contact (incl. shipping/returns)
Content focus:
- Product copy leads with the specific problem it solves or use-case, not adjective stacking ("premium," "high-quality," "amazing")
- Include real specs, materials, sizing detail — reduces returns and builds trust
- Trust signals with actual numbers where available: real review counts, real shipping timelines

Chatbot scope: order status, sizing/fit help, return policy, product comparison/recommendation. Escalates: payment/billing disputes, damaged item claims.

SEO focus: product-specific long-tail ("{{PRODUCT}} for {{USE_CASE}}"), category-level commercial intent keywords, comparison keywords ("{{PRODUCT}} vs {{ALTERNATIVE}}"). Schema: Product, Offer, Review/AggregateRating, BreadcrumbList.

Design cues: fast-loading product imagery (multiple angles, no generic lifestyle stock unless it's the brand's own shoot), clear price/CTA hierarchy, minimal checkout friction in layout.
Color/font direction: driven entirely by product category — see the Clothing/Fashion sector below for an example of how one "sector" splits into opposite design languages by sub-niche. Always research the specific product category before locking a palette.
UI style: Bento Grid as the default for category/collection browsing — scales well to many products at varying visual weight. Animation: React Bits for product-card hover/reveal interactions; Motion Primitives for cart/checkout state transitions.
```

---

## 🏠 Real Estate

```
SECTOR ADDITIONS — REAL ESTATE:

Pages (5): Home, Listings/Search, Agent(s)/About, Neighborhood Guides, Contact (incl. sell-with-us CTA)
Content focus:
- Listings lead with specific standout feature (school district, renovation year, lot size) not "stunning home"
- Neighborhood content uses real local detail (walkability, specific amenities) not generic "vibrant community"
- Agent bio built on track record specifics (transactions, area specialty), not "trusted expert"

Chatbot scope: listing availability/showing requests, mortgage pre-qualification referral, neighborhood questions, seller valuation lead capture. Escalates: contract/legal questions.

SEO focus: "{{PROPERTY_TYPE}} for sale {{NEIGHBORHOOD}}," "homes near {{LANDMARK/SCHOOL}}," agent name + city. Schema: RealEstateListing, LocalBusiness, FAQPage.

Design cues: large-format property photography, map-integrated listing browsing, restrained luxury palette if positioning premium — avoid busy layouts that compete with listing photos.
Color/font direction: neutral, architectural palette (charcoal, warm white, one muted accent — sage, terracotta, or navy) so photography stays the hero. Google Fonts: refined serif or high-contrast sans for display (e.g. Fraunces, Libre Caslon Text) + clean sans body (e.g. Inter).
UI style: Spatial UI — depth/parallax for property galleries and neighborhood maps gives a walkthrough feel. Animation: Motion Primitives for image transitions and map-linked scroll effects.
```

---

## 🎓 Education / Coaching / Courses

```
SECTOR ADDITIONS — EDUCATION/COACHING:

Pages (5): Home, Programs/Courses (incl. outcomes/testimonials), Instructor(s)/About, Enroll, Contact
Content focus:
- Lead with the specific transformation/outcome, not "unlock your potential"
- Curriculum described in concrete deliverables (modules, hours, format), not vague promises
- Testimonials include specific results, not "life-changing!"

Chatbot scope: program details, pricing/payment plans, enrollment deadlines, prerequisite questions. Escalates: refund disputes, custom/corporate inquiries.

SEO focus: "{{SKILL/TOPIC}} course {{FORMAT}}," "learn {{SKILL}} online," comparison and "best {{TOPIC}} course" intent. Schema: Course, EducationalOrganization, FAQPage.

Design cues: outcome-forward hero (show the result, not a stock classroom photo), clear curriculum visualization, credibility markers placed near CTA not buried in footer.
Color/font direction: energetic but credible — one confident primary (indigo, teal, or coral) against clean white/near-black. Google Fonts: modern geometric sans display (e.g. Sora, Space Grotesk) + readable body (e.g. Inter).
UI style: Bento Grid for curriculum/program overviews, Minimalism elsewhere. Animation: Motion Primitives for scroll-triggered outcome stats and testimonial reveals.
```

---

## 💪 Fitness / Gym / Studio

```
SECTOR ADDITIONS — FITNESS:

Pages (5): Home, Classes/Programs (incl. schedule), Trainers, Membership/Pricing, Free Trial/Contact
Content focus:
- Lead with specific class format/intensity/results, not "get fit with us"
- Real schedule and pricing transparency builds trust and reduces chatbot load
- Trainer bios with actual certifications and specialties

Chatbot scope: class schedule, membership pricing/tiers, free trial booking, what to bring for first visit. Escalates: injury/medical clearance questions, membership cancellations.

SEO focus: "{{CLASS_TYPE}} classes {{NEIGHBORHOOD}}," "gym near me {{AMENITY}}," "{{CLASS_TYPE}} for beginners." Schema: SportsActivityLocation, LocalBusiness, Course (for class programs).

Design cues: high-energy but not chaotic — strong action photography/video, bold typography for schedule/pricing tables so they're scannable at a glance.
Color/font direction: bold, kinetic — black/near-black base with one high-energy accent (electric lime, orange, or red). Google Fonts: heavy condensed or grotesk display (e.g. Archivo Black, Bebas Neue) + clean body sans (e.g. Inter).
UI style: Brutalism — raw, high-contrast, bold type fits the sector's energy. Animation: React Bits for kinetic text/background effects and schedule-table interactions.
```

---

## ⚖️ Legal / Professional Services

```
SECTOR ADDITIONS — LEGAL/PROFESSIONAL SERVICES:

Pages (5): Home, Practice Areas, Attorneys/Team, Case Results, Contact (incl. free consultation CTA)
Content focus:
- Lead with the specific problem/case type the visitor is searching for, not "aggressive representation"
- Practice area pages explain process in plain language (what happens after you call), not just a list of legal terms
- Case results/credentials stated with real specifics where ethically permitted

Chatbot scope: practice area fit-check, consultation scheduling, general process/fee-structure questions. Escalates: any specific case advice (must redirect to consultation, never give legal advice).

SEO focus: "{{PRACTICE_AREA}} lawyer {{CITY}}," "do I need a lawyer for {{SITUATION}}," urgent-intent keywords ("{{SITUATION}} what to do"). Schema: Attorney/LegalService, LocalBusiness, FAQPage.

Design cues: authoritative, restrained palette (avoid cliché navy+gold), clear urgency-matched CTA hierarchy (free consultation front and center), no stock gavel/scale imagery.

Compliance note: chatbot must include a disclaimer that it does not provide legal advice.
Color/font direction: authoritative and calm — deep navy, forest green, or charcoal with a single restrained metallic or muted accent; avoid cliché navy+gold combo and avoid anything futuristic/trendy. Google Fonts: classic serif display (e.g. Libre Caslon Text, Source Serif 4) + neutral sans body (e.g. Inter, Source Sans 3).
UI style: Minimalism, no exceptions — this sector converts on restraint and credibility. Animation: Motion Primitives, minimal — subtle fade/scroll reveals only.
```

---

## 💇 Beauty / Salon / Spa

```
SECTOR ADDITIONS — BEAUTY/SALON/SPA:

Pages (5): Home, Services & Pricing (incl. membership/packages), Stylists/Therapists, Gallery, Book Now
Content focus:
- Lead with the specific service/result (balayage, deep-tissue, HydraFacial), not "pamper yourself"
- Real pricing and duration builds trust and reduces booking friction
- Stylist/therapist bios highlight specific specialties, not "talented team"

Chatbot scope: service booking, pricing/duration questions, stylist availability/specialty matching, cancellation policy. Escalates: allergy/reaction concerns pre-service.

SEO focus: "{{SERVICE}} salon {{NEIGHBORHOOD}}," "best {{SERVICE}} near me," stylist-name searches. Schema: BeautySalon/DaySpa, LocalBusiness, Service.

Design cues: real portfolio photography (before/after where relevant), elegant restrained palette, easy visual booking flow front and center.
Color/font direction: soft, elegant — blush, sand, sage, or muted rose with warm white; avoid harsh contrast. Google Fonts: soft serif or refined script accent for display (e.g. Cormorant Garamond, Fraunces) + clean sans body (e.g. Inter, Work Sans).
UI style: Claymorphism or Glassmorphism — soft, rounded, elegant surfaces fit this sector's mood. Animation: Motion Primitives for gallery/before-after reveals and booking-flow transitions.
```

---

## 🎬 Media / Video Production / Creative Agency

```
SECTOR ADDITIONS — MEDIA/VIDEO AGENCY:

Pages (5): Home, Work/Showreel, Services (incl. process), Studio/Team, Contact
Content focus:
- Lead with the showreel/hero visual itself, not a paragraph — this sector is proof-by-demonstration
- Describe capability in concrete production terms (formats delivered, turnaround time, equipment/style specialty), not "we bring your vision to life"
- Case studies show the brief → the work → the measurable outcome, not just a gallery

Chatbot scope: project inquiry qualification (budget range, timeline, deliverable type), portfolio/case-study navigation, booking a discovery call. Escalates: detailed quoting, contract terms.

SEO focus: "{{VIDEO/CREATIVE_SERVICE}} agency {{CITY}}," "{{INDUSTRY}} video production," portfolio/case-study keywords. Schema: CreativeWork, LocalBusiness, VideoObject for reel content.

Design cues: this is the one sector where a bold, futuristic direction is correct — full-bleed video/motion hero, dark or high-contrast base, kinetic typography, subtle motion/scroll interactions that demonstrate craft rather than decorate. This should NOT be softened toward "safe/professional" — futuristic and confident IS the brand signal here.
Color/font direction: near-black or deep base with one electric accent (cyan, magenta, or lime) used sparingly for impact; motion and contrast do the work rather than a busy palette. Google Fonts: sharp geometric or variable display font (e.g. Space Grotesk, Syne) + neutral body sans (e.g. Inter).
UI style: Liquid Glass or Spatial UI — this is the sector where these two styles belong by default. Animation: lead with Motion Primitives' morphing-dialog, spotlight-cursor, and progressive-blur components for the showreel/hero; layer in React Bits for GSAP/Three.js-driven background and text effects where extra intensity is warranted.
```

---

## 🔧 Plumbers / Home Services / Trades

```
SECTOR ADDITIONS — PLUMBERS/HOME SERVICES:

Pages (5): Home (incl. emergency CTA), Services, Service Area, Reviews, Contact
Content focus:
- Lead with the urgent problem and immediate action ("Burst pipe? Call now — {{RESPONSE_TIME}} response in {{SERVICE_AREA}}"), not "your trusted plumbing experts"
- State licensing/insurance/certifications explicitly — this sector converts on trust, not creativity
- Pricing transparency (flat-rate vs hourly, free estimate policy) reduces friction and chatbot load

Chatbot scope: emergency triage (is this urgent?), service area check, quote/estimate request, appointment scheduling. Escalates: any diagnosis requiring an in-person look, disputes/complaints.

SEO focus: "emergency plumber {{CITY}}," "{{SERVICE}} near me," "plumber open now {{CITY}}." Schema: Plumber/HomeAndConstructionBusiness, LocalBusiness, FAQPage.

Design cues: this sector needs to look professional and dependable, not futuristic or trendy — clear, high-contrast, mobile-first (most searches are urgent and on-the-go), phone number/CTA always visible above the fold.
Color/font direction: trust-coded colors — blue, navy, or red-accent-on-white (red reads as urgency for emergency CTAs); avoid gradients, dark mode, or anything that feels experimental. Google Fonts: sturdy, no-nonsense sans (e.g. Inter, Roboto, Barlow) for both display and body — legibility over personality.
UI style: Minimalism — clarity and speed beat any decorative style here; skip Liquid Glass, Neomorphism, and Maximalism entirely. Animation: Motion Primitives, minimal — CTA hover states and form-submit feedback only.
```

---

## 🖼️ Portfolio / Personal Brand

```
SECTOR ADDITIONS — PORTFOLIO:

Pages (5): Home, Work/Projects, About, Services (or Resume/CV if not freelance), Contact
Content focus:
- Let the work lead — minimal copy, maximum curation; every project shown must earn its place
- About section is specific and human (real trajectory, real focus areas), not a generic bio template
- Contact/CTA is effortless — this audience (recruiters, clients) has low patience for friction

Chatbot scope: optional for this sector — if used, scope to project inquiries and availability only; often better omitted entirely in favor of a direct contact form.

SEO focus: name + role keywords ("{{NAME}} {{DISCIPLINE}} portfolio"), discipline + specialty keywords. Schema: Person, CreativeWork, ProfilePage.

Design cues: this must feel top-tier/premium — treat it like a gallery, not a website: oversized imagery, confident whitespace, restrained navigation, no unnecessary UI chrome. Every pixel should feel intentional.
Color/font direction: often near-monochrome (black/white/one accent) so the work is the color; direction should still be grounded in Step 0 research of the specific discipline (a designer's portfolio ≠ a photographer's ≠ a developer's). Google Fonts: one confident, editorial display font (e.g. Fraunces, General Sans, Söhne-alternative like Manrope) + clean body sans (e.g. Inter).
UI style: Bento Grid for project showcases, or Spatial UI for a more immersive case-study feel. Animation: Motion Primitives for project-hover reveals and page transitions — restraint matters more here than volume of effects.
```

---

## 👗 Clothing / Fashion Brand (sub-niche branches — one "sector" splits by purpose)

```
This sector proves why Step 0 research matters: "clothing brand" is not one design language — it's several, depending on what's actually being sold and to whom. Never apply one template to all clothing brands. Pages (5) for all sub-niches below: Home, Shop/Collections, Product (template page), Cart/Checkout, About & Contact — as in the E-commerce sector; only content tone, chatbot scope, SEO, and design direction change per sub-niche.

── SUB-NICHE: Luxury / Ethnic Wear (e.g. premium sarees, bridal, occasion wear)
Content focus: lead with craftsmanship detail (fabric, embroidery technique, region/heritage), not "beautiful sarees for every occasion." Story-driven, heritage-forward copy.
Chatbot scope: sizing/draping guidance, customization requests, appointment booking for fittings. Escalates: bespoke order negotiation.
SEO focus: "{{FABRIC/STYLE}} saree {{OCCASION}}," "bridal {{GARMENT}} {{CITY}}."
Design cues: opulent but restrained — rich jewel tones (deep maroon, emerald, gold accent) or all-neutral luxury (ivory/black/gold), generous imagery, editorial pacing, slow scroll reveals.
Google Fonts: elegant serif or high-contrast display (e.g. Cormorant Garamond, Playfair Display) + refined sans body (e.g. Marcellus, Inter).
UI style: Minimalism with Glassmorphism accents (e.g. frosted overlay panels on product imagery). Animation: Motion Primitives for slow, editorial-paced scroll reveals and progressive-blur image transitions.

── SUB-NICHE: Activewear / Sportswear
Content focus: lead with performance/function claims backed by specifics (fabric tech, compression level, use-case: run/train/yoga), not "look good, feel good."
Chatbot scope: sizing/fit guidance, product recommendation by activity, order tracking. Escalates: returns for performance-defect claims.
SEO focus: "{{ACTIVITY}} leggings/gear," "best activewear for {{USE_CASE}}."
Design cues: bold, kinetic, futuristic-leaning — this sub-niche CAN use high-contrast, motion-forward, near-monochrome-plus-neon direction; imagery is action-first, not static flat-lay.
Google Fonts: bold geometric sans or condensed display (e.g. Archivo, Space Grotesk) + matching sans body (e.g. Inter, Manrope).
UI style: Brutalism or Liquid Glass depending on brand positioning (raw/athletic vs. futuristic/tech-performance). Animation: React Bits for kinetic, high-energy background and text effects; Motion Primitives for product-card interactions.

── SUB-NICHE: Everyday / Casual Wear
Content focus: lead with versatility and real fit/comfort detail, approachable tone — this audience wants ease, not spectacle.
Chatbot scope: sizing help, styling suggestions, order/return status.
SEO focus: "{{ITEM}} for everyday wear," "comfortable {{ITEM}} {{DEMOGRAPHIC}}."
Design cues: clean, warm, approachable — soft neutrals with one friendly accent color, casual lifestyle photography (real settings, not studio-only).
Google Fonts: friendly rounded or humanist sans throughout (e.g. Manrope, Nunito Sans, Inter).
UI style: Claymorphism or plain Minimalism — soft, approachable surfaces suit this tone best. Animation: Motion Primitives, light touch — gentle hover states and cart-update feedback.
```

---

## ➕ Adding a new sector (template)

```
SECTOR ADDITIONS — {{SECTOR_NAME}}:

Pages (5 — no more): {{LIST_KEY_PAGES}}
Content focus:
- {{WHAT_TO_LEAD_WITH_INSTEAD_OF_GENERIC_CLAIM}}
- {{SPECIFIC_DETAIL_TYPE_THAT_BUILDS_TRUST_IN_THIS_SECTOR}}
- {{COMMON_AI_CLICHE_TO_AVOID_FOR_THIS_SECTOR}}

Chatbot scope: {{WHAT_IT_CAN_ANSWER}}. Escalates: {{WHAT_IT_MUST_HAND_OFF}}.

SEO focus: {{KEY_INTENT_PATTERNS}}. Schema: {{RELEVANT_SCHEMA_TYPES}}.

Design cues: {{VISUAL_DIRECTION_SPECIFIC_TO_SECTOR}}.
UI style: {{PICK_FROM_THE_10_STYLES_BASED_ON_STEP_0_RESEARCH}}. Animation: {{MOTION_PRIMITIVES_OR_REACT_BITS_OR_BOTH_AND_WHERE}}.
```

---

**How to use:** paste Root Prompt + one Sector Prompt into your AI website/content tool, fill every `{{ }}`, and generate. Keep this file as your master library — duplicate the "Adding a new sector" block whenever you take on a new industry.
