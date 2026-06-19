# MarketBeacon Session Memory

## Last Session (June 19, 2026)

### Completed
1. **Fallen Value Basket** added to SIXTY_SEVEN_FUNDA strategy + basket definition
2. **Basket auto-resolution** — `/api/backtest/audit` auto-merges all strategy baskets
3. **ScreenerVerify** — removed hardcoded `basket=Elite%20Basket`
4. **67 Funda strategy rewritten** (Hemant Jain course rules — 10-point checklist)
5. **Velocity Retest strategy rewritten** (backward scan, green candle chain, 19%/20% threshold)
6. **Security fix** — removed hardcoded `MarketBeacon2026` password, now generates random
7. **Canonical URLs** — `marketbeacon.pro` → `marketbeaconpro.com` across all pages
8. **SEBI disclaimer** — strengthened on PublicAnalysis page ("not SEBI registered IA/RA")
9. **Sitemap** — static sitemap.xml now points to dynamic `/api/sitemap.xml` endpoint (NIFTY 500)
10. **Desktop backup** at `~/Desktop/marketbeacon-backup-2026-06-19/`

### Uncommitted Changes
- None (all committed, not pushed)

### Commits on `main` (not pushed)
- `341449d` feat: Fallen Value Basket + strategy rewrite + ScreenerVerify fix
- `90eebb7` fix: remove hardcoded master password backdoor
- `fe083ed` fix: canonical URLs + SEBI disclaimer + sitemap

### Not Pushed to GitHub
Remote uses HTTPS at `https://github.com/diwakarsingh01-tech/marketbeacon.git`
Need `gh auth login` before push.

### Pending
- Push to GitHub
- Dynamic OG images per stock (currently static `og-preview.svg`)
- Alpha-40 pre-calculation worker for scalability
- Validate strategies against YouTube course link (user will share)
- SEO breadcrumbs automation

### How to Resume
In a new session, run: `cat MEMORY.md` for full context.
