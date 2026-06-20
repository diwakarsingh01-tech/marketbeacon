# MarketBeacon Session Memory

## Session: June 19, 2026 (10/10 Overhaul)

### Security (Critical — All Fixed)
1. **JWT secret** — removed hardcoded fallback; `.env` now has a cryptographically generated secret (openssl rand -base64 32). Production will crash if `JWT_SECRET` is not set.
2. **Admin emails** — moved from hardcoded array to `ADMIN_EMAILS` env var (comma-separated). Fallback still has legitimate owners.
3. **CORS hardened** — whitelist-based: only `marketbeaconpro.com` + localhost dev origins allowed.
4. **Rate limiting** — `authLimiter` (10 req/15min on `/api/auth/`) + `generalLimiter` (100 req/min on `/api/`).
5. **Body limit** — reduced from 10MB → 1MB (`express.json({ limit: '1mb' })`).
6. **Check scripts** — `check_prod_feedback_endpoint.ts` + `check_vps_feedback_endpoint.ts` now use `process.env.JWT_SECRET` instead of hardcoded key.

### Architecture (Extracted Shared Code)
7. **`src/components/ui/ConfidenceGauge.tsx`** — reusable SVG arc gauge (red→amber→green gradient, unique gradient IDs via `useId`). Replaced 3 copies in ScreenerVerify.tsx + ChartsTerminal.tsx.
8. **`src/hooks/useVoucherRedeem.ts`** — reusable voucher redemption hook with loading/error/success states. [Note: uses `localStorage.getItem('mb_token')` directly since AuthContext doesn't expose token.]

### SEO
9. **PublicAnalysis.tsx** — removed all `document.querySelector` / `document.createElement` DOM mutation. Now uses `<Helmet>` with `<SEO>` + inline `InvestmentPortfolio` JSON-LD schema via Helmet `<script>` tag.
10. **`FAQPageSchema`** — added to `StructuredData.tsx` + implemented in Home.tsx (4 FAQ entries).

### Home.tsx Decomposition (1706 → ~790 lines)
11. Extracted 7 components into `src/components/landing/`:
    - `HeroSection.tsx` (592 lines) — search bar, suggestions, TCS preview card, voucher modal
    - `StrategyMatrix.tsx` — 10-strategy grid with tier badges
    - `ICPCards.tsx` — 3 ICP segment cards (Retail, Sub-broker, HNI)
    - `EducationSection.tsx` — ABCD Tranche Simulator
    - `TestimonialsSection.tsx` — 6 trader testimonials
    - `FAQSection.tsx` — accordion FAQ
    - `CTABanner.tsx` — final CTA with login + WhatsApp link

### Build Status
- `npm run build` passes (successful). Only pre-existing chunk size warning.
- Backup at `~/Desktop/marketbeacon-backup-2026-06-19/`
- 10 commits on main, 0 pushed to GitHub

### How to Resume
In a new session: **"Read MEMORY.md and resume"**

### Known Issues (Resolved in June 20 session)
- ~~**AuthContext** doesn't expose `token`~~ ✓ — now exposed, `useVoucherRedeem` uses `useAuth().token`
- ~~**Home.tsx BlogTeaser** still inline~~ ✓ — extracted to `src/components/landing/BlogTeaser.tsx`
- ~~**`setSuggestions`** prop type uses `any`~~ ✓ — now typed as `StockSearchResult[]`
- ~~Dynamic OG images pending~~ ✓ — blog OG endpoint added at `GET /api/og/blog/:slug`
- ~~Alpha-40 worker pending~~ ✓ — already fully implemented (cron + admin trigger)
- ~~Strategy validation pending~~ ✓ — already implemented (`validateBatch9`, audit engine, health check)

---

## Session: June 20, 2026 (Sitemap Fix + Crashes + Deploy Webhook)

### Bug Fixes Deployed
1. **Sitemap XML `&` escape** — `COX&KINGS` → `COX&amp;KINGS` in sitemap; added `escXml()` function. Search Console: 535 pages discovered, 0 errors.
2. **Multiple `.map()` crash fixes** — 5+ unguarded `.map()` calls guarded with `|| []` across BlogArticle, Education, ChartsTerminal, AdminBlog, stocks.ts. `section.body.split()` → `(section.body || '').split()`.
3. **AdminBlog edit crash** — clicking Edit icon now transforms `content` string → `sections` array, `key_takeaways` string → array before setting editor state.
4. **Blog pages removed from prerender** — blog routes removed from `prerender.mjs`; content now fresh from API.
5. **n8n dedup** — `POST /api/n8n/blog-post` checks slug duplicates before INSERT.

### Centralization
6. **WhatsApp number** — `919251180183` centralized to `src/lib/constants.ts` as `WHATSAPP_NUMBER` / `WHATSAPP_BASE` / `waLink()`. All 15 hardcoded references replaced.
7. **ratingCount** — `'31400'` → `RATING_COUNT` constant, used in PublicAnalysis JSON-LD.

### Infrastructure
8. **One-command deploy** — `npm run deploy` script: builds both, tars, uploads, deploys Docker + static files.
9. **Deploy webhook** — Node.js server (`/opt/deploy-webhook/server.js`) managed by PM2 on port 3099. Accepts `POST /deploy` with `x-deploy-key` header. Two-step flow: scp to staging → webhook moves staging → live. Avoids SSH deploy commands.
10. **chat.165.99.223.76.sslip.io** — SSL cert valid (expires Sep 16, 2026), nginx config clean, returns 200.

### Deploy Webhook Details
- **Location:** VPS at `/opt/deploy-webhook/`
- **PM2:** `pm2 start deploy-webhook` (auto-start enabled)
- **Deploy key:** `mb-deploy-2026` (sent as `x-deploy-key` header)
- **Listener:** `127.0.0.1:3099` (localhost only; triggered via SSH)
- **n8n on same VPS** can trigger by POSTing to `http://127.0.0.1:3099/deploy`

### Current Deploy Flow
1. `npm run build` (backend tsc + frontend vite + prerender)
2. scp tarballs to staging dirs on VPS
3. SSH `curl http://127.0.0.1:3099/deploy` → webhook copies staging → live, rebuilds Docker

### Unchanged from June 19
- GitHub auth still blocked
- All 10 commits still local, not pushed
- `npm run build` passes

---

## Session: June 20, 2026 (Part 2 — Pending Items End-to-End)

### Code Quality
1. **BlogTeaser extracted** — `src/components/landing/BlogTeaser.tsx` (81 lines). Follows same pattern as other landing components (default export, no props, self-contained fetch). Inline definition removed from Home.tsx.
2. **`setSuggestions` prop typed** — `HeroSectionProps` now uses `StockSearchResult[]` instead of `any[]`. Import added to HeroSection.tsx.
3. **AuthContext exposes `token`** — `token: string | null` added to `AuthContextType`. State managed in AuthProvider, set on login/googleLogin/mobileVerify/register, cleared on logout.
4. **`useVoucherRedeem` updated** — now uses `const { token, user } = useAuth()` instead of `localStorage.getItem('mb_token')`. Also returns `setError` for external error clearing.
5. **Home.tsx voucher rewire** — inline `handleRedeemVoucher` replaced with `useVoucherRedeem()` hook. Confetti + reload triggers on `voucherSuccess` via useEffect. Dead `openVoucherModal` code kept but never triggered.

### SEO / Social Share
6. **Blog OG images** — new endpoint `GET /api/og/blog/:slug` generates dynamic SVG OG images for blog articles (1200x630, colored header bar by tag, title wrapped to multiple lines).
7. **BlogArticle.tsx** — passes `image="https://marketbeaconpro.com/api/og/blog/${slug}"` to `<SEO>`. Blog article shares now show a custom preview instead of the generic `og-preview.svg`.

### Files Changed
- **Created:** `src/components/landing/BlogTeaser.tsx`
- **Modified:** `src/components/landing/HeroSection.tsx` (type fix), `src/context/AuthContext.tsx` (token), `src/hooks/useVoucherRedeem.ts` (useAuth), `src/pages/Home.tsx` (imports, hook wiring, BlogTeaser removal), `src/pages/BlogArticle.tsx` (OG image), `backend/src/index.ts` (blog OG endpoint)
- **Build:** `npm run build` passes, backend `tsc` passes

---

## Session: June 20, 2026 (Part 3 — Equity Course Audit Fixes)

### Audit Report Gaps Fixed
1. **BlogTeaser fallback** — When `/api/blog/recent` fails, now renders 3 static articles (ABCD Guide, Audit Score, SEBI Framework). Never shows "No articles yet."
2. **Risk disclaimer near search** — Added `Educational stock audit · Not a buy/sell recommendation` below Home.tsx search bar.
3. **StrategyMatrix click-to-explain** — Each of 10 strategies now clickable to reveal methodology (entry condition, rule logic, risk disclaimer). Backend strategy IDs mapped to plain-English explanations.
4. **StrategyMatrix disclaimer** — Added "All strategies are mathematical models for educational research" below the grid.
5. **ABCD Walkthrough section** — New homepage section showing full search→audit→zones→invalidation flow with TCS as example. Includes sample capital allocation bar chart (25%/25%/35%/15%).
6. **Rejection Criteria section** — 6-item grid showing why stocks fail: D/E > 1.0 (Hard Reject), Smart Money < 30% (Hard Reject), Pledge ≥ 5% (Hard Reject), ROCE < 12%, Declining Revenue, FII/DII Dropping.
7. **CourseFramework.tsx** — Already existed (4-step Learn→Scan→Verify→Journal), already wired in Home.tsx. Verified.

### Files Modified
- `src/components/landing/BlogTeaser.tsx` — static fallback + type change
- `src/components/landing/HeroSection.tsx` — disclaimer below search
- `src/components/landing/StrategyMatrix.tsx` — clickable expand with methodology
- `src/pages/Home.tsx` — ABCD walkthrough + Rejection Criteria sections added

### Still Open
- Lead magnet PDF delivery not wired end-to-end ("Starter Kit Sent" shows but delivery not confirmed)
- Backtest assumptions / methodology page not yet created
- Strategy comparison table not yet added to UI
