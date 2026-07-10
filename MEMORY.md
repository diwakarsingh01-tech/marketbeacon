# MarketBeacon Session Memory

## Last Session (June 19, 2026)

### Completed (5 commits on main, not pushed)
1. **Fallen Value Basket** — added to SIXTY_SEVEN_FUNDA + basket definition with BANDHANBNK, VENKEYS, ZEEL, etc.
2. **Basket auto-resolution** — `/api/backtest/audit` auto-merges all strategy baskets instead of single basket
3. **ScreenerVerify** — removed hardcoded `basket=Elite%20Basket`
4. **67 Funda strategy rewritten** — Hemant Jain course 10-point checklist (profit potential, net profit, D/E, sales near ATH)
5. **Velocity Retest rewritten** — backward scan, green candle chain, 19%/20% threshold, below EMA200 preference
6. **Security fix** — removed hardcoded `MarketBeacon2026` password → random 12-char per onboard
7. **Canonical URLs** — `marketbeacon.pro` → `marketbeaconpro.com` across all pages
8. **SEBI disclaimer** — strengthened on PublicAnalysis ("not SEBI registered IA/RA")
9. **Sitemap** — static `public/sitemap.xml` now points to dynamic `/api/sitemap.xml` (NIFTY 500 stocks)
10. **"Claim Now" voucher modal** — fixed (state existed but no modal was rendered)
11. **Mobile search z-index** — ChartsTerminal: `z-50` → `z-[100]`, `max-h-80` → `max-h-[50vh]`
12. **Front page copy updated** — "12 Proprietary" → "10 Institutional", added Velocity Retest card, Fallen Value Basket mention
13. **Blog Teaser moved higher** — appears right after strategy section (was buried near footer)
14. **Nav "Blog" link** — added "NEW" badge for visibility
15. **Scroll animations** — 4 major sections (Strategy Matrix, ICP Cards, Social Proof, Education) + staggered strategy grid cards use framer-motion `whileInView` fade+slide-up
16. **Desktop backup** at `~/Desktop/marketbeacon-backup-2026-06-19/`

### Not Pushed
Remote: `https://github.com/diwakarsingh01-tech/marketbeacon.git` (HTTPS)
Need `gh auth login` before push.

### Pending
- Push to GitHub (run `gh auth login` first)
- Dynamic OG images per stock (static `og-preview.svg`)
- Alpha-40 pre-calculation worker for scalability
- Validate strategies against YouTube course link (user will share)

### How to Resume
In a new session: **"Read MEMORY.md and resume"**
