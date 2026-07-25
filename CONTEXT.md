# MarketBeacon Pro — COMPLETE CONTEXT DOCUMENT

> **Generated:** 2026-07-23  
> **Purpose:** Permanent reference capturing the entire project architecture, framework rules, code state, gaps, and decisions. This document is the single source of truth for all AI agents working on this project.

---

## PART 1: PROJECT ARCHITECTURE

### 1.1 Tech Stack
| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + Vite 8 + Tailwind CSS 4 + TypeScript 6 | Path alias `@/` → `./src/*` |
| Backend | Express 5 + TypeScript (`tsc` → `dist/`) | Dev via `tsx` hot reload |
| Database | Turso (libsql) ↔ local SQLite | Falls back to `marketbeacon.db` when Turso credentials absent |
| Auth | Supabase + JWT + Google OAuth | JWT secret from `.env`, 7-day expiry |
| Data Sources | Yahoo Finance (prices) + Screener.in (fundamentals) | Screener.in scraped via cheerio |
| Deploy | Docker Compose + nginx on VPS (165.99.223.76) | Deploy webhook on port 3099 |

### 1.2 Directory Structure
```
marketbeacon/
├── src/                      # Frontend (React+Vite)
│   ├── components/           # Reusable UI components
│   │   ├── landing/          # Home page sections
│   │   ├── tables/           # TradeTable, etc.
│   │   ├── gates/            # TierGate for access control
│   │   ├── modals/           # BrokerHub, UpgradeModal, etc.
│   │   └── ui/               # Skeleton, ConfidenceGauge, etc.
│   ├── pages/                # Route pages
│   │   ├── AlphaHub.tsx      # Alpha-40 dashboard
│   │   ├── Dashboard.tsx     # Screener / Portfolio / Market
│   │   ├── ChartsTerminal.tsx# Live charts
│   │   └── ...               # Home, Blog, Education, etc.
│   ├── data/stocks.ts        # Frontend basket & strategy definitions
│   ├── context/              # AuthContext, ThemeContext
│   └── lib/                  # API utils, constants
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server (2824 lines) — ALL routes
│   │   ├── strategies/index.ts # ALL 11 strategy implementations
│   │   ├── services/
│   │   │   ├── fundamentalAudit.ts  # validateBatch9 scoring
│   │   │   ├── growthFilter.ts      # Growth basket scanner
│   │   │   ├── strategyService.ts   # Strategy-to-basket routing
│   │   │   ├── worker.ts            # Alpha-40 pre-calculation
│   │   │   ├── backtestEngine.ts    # Backtesting
│   │   │   ├── aiService.ts         # AI analysis
│   │   │   └── audit/              # Audit engine subsystem
│   │   ├── screener.ts       # Market snapshot + Screener.in scraper
│   │   ├── universe.ts       # NIFTY_500 list (~500 symbols)
│   │   ├── db.ts             # Database init + queries
│   │   └── supabase.ts       # Supabase client
│   ├── dynamic_basket.json   # Growth basket stock list (~230 symbols)
│   ├── h_good_200_list.json  # H Good 200 stocks (~132 symbols)
│   ├── h_good_200_wealth_list.json # Full H Good 200 wealth list (~215 symbols)
│   └── alpha_40_results.json # Pre-computed Alpha-40 results
├── RULES.md                  # Methodology handbook (506 lines)
├── AGENTS.md                 # Project conventions
├── MEMORY.md                 # Session memory (June 19-20, 2026)
└── CONTEXT.md                # THIS FILE — durable context
```

---

## PART 2: FRAMEWORK RULES (FROM USER — GROUND TRUTH)

### 2.1 Basket Definitions
| Basket Name | Website Name | Type | Stock Count | Source | Best For |
|-------------|-------------|------|------------|--------|----------|
| Super 45 | **Elite Basket** | Fixed, curated | ~40 | Coach's selection | Conservative, core holding |
| Good 45 | **Quality Basket** | Fixed, curated | ~39 | Coach's selection | Growth-oriented, moderate risk |
| H Good 200 | **Growth Basket** | Dynamic, filter-based | ~200 (varies) | Scanner from NIFTY 500 | Swing trading, medium-term |
| — | **Fallen Value Basket** | Dynamic | ~9-20 | 67% strategy filter | Contrarian, long-term |

**Key Rule:** Super 45 = Elite, Good 45 = Quality. These are **baskets of stocks**, NOT strategies.

### 2.2 Fundamental Thresholds

#### Non-Financial Sectors (General)
| Parameter | Threshold | Source |
|-----------|-----------|--------|
| Debt-to-Equity | **Sliding scale:** 0.2 = ideal/full score. From 0.2 to 0.5 → weightage progressively decreases. **D/E > 0.5 = HARD REJECT** (general companies). | User confirmed 2026-07-23 |
| ROCE | ≥ 15% (General), ≥ 8% (Finance/Cap-Intensive) | User confirmed |
| ROE | ≥ 15% (General), ≥ 10% (Finance/Cap-Intensive) | User confirmed |
| Promoter Pledge | ≤ 5% (hard reject at ≥ 5%) | User confirmed |
| Smart Money (FII+DII+Promoter) | ≥ 70% | User confirmed |
| Current PE vs Median PE | Current PE ≤ Median PE (3Y **AND** 5Y median). Lower **or equal** to both medians. | User confirmed 2026-07-23 |
| Sales vs ATH | ≥ 95% of ATH | User confirmed |
| Net Profit vs ATH | ≥ 95% of ATH | User confirmed |
| Net Profit Min | > ₹50 Cr (67% strategy), > ₹200 Cr (Growth/Super 45) | User confirmed |
| Market Cap Min | > ₹500 Cr (Growth basket) | User confirmed |

#### Banking / NBFC / Financial Sectors
| Parameter | Relaxed Threshold | Logic |
|-----------|------------------|-------|
| Debt-to-Equity | ≤ 7.0 (hard reject) | Leverage is inherent to business model |
| ROCE | ≥ 8% (vs 15% for non-financial) | Different capital structure |
| ROE | ≥ 10% (vs 15% for non-financial) | Banks have lower equity base |

#### Capital-Intensive Sectors (Auto, Infra, Steel, Telecom, Oil & Gas, Pharma, Chemicals, Mining, Textiles, Media, Electricals, Healthcare, etc.)
| Parameter | Relaxed Threshold |
|-----------|------------------|
| Debt-to-Equity | ≤ 1.5 (hard reject) |
| ROE | ≥ 10% |
| ROCE | ≥ 8% |

### 2.3 PE & Valuation Rule (UNDERVALUATION ONLY)
```
RULES:
1. Compute 3Y Median PE = median of daily(close / TTM_EPS) over trailing 756 trading days
2. Compute 5Y Median PE = same over trailing 1,260 trading days
3. Current PE must be ≤ BOTH medians: current PE ≤ 3Y median AND current PE ≤ 5Y median
4. Condition: Lower or equal to median PE. If current PE > either median → REJECT

PURPOSE: Never show overvalued stocks. Only fairly-valued or undervalued.
No tolerance allowed — hard rule: PE must be ≤ median in both timeframes.
```

### 2.4 ABCD Averaging Framework
```
CONCEPT:
- A entry = technical trigger point (pattern says "entry"), but NOT preferred buying point
- B, C, D = actual staggered buying points as price drops ~10% between each

TRANCHES:
  A → B → C → D
  Entry price drops ~10% per tranche
  Each tranche = ~10% allocation

TARGETS (reverse-laddered):
  D's target = C entry
  C's target = B entry  
  B's target = A entry
  A's target = main strategy target (from pattern)

SMA-BCD RULE (SPECIAL):
  A = TRIGGER ONLY (signal detection). No buy at A.
  B = FIRST ACTUAL BUY point. Buy starts at B.
  C = Second averaging buy.
  D = Third averaging buy.
  This applies ONLY to SMA-BCD strategy, not to other strategies.
```

### 2.5 Risk Management Rules
| Rule | Limit | Applies To |
|------|-------|-----------|
| Max portfolio size | 40-60 stocks | Overall |
| Large cap allocation | ~50% of portfolio | Overall |
| Mid cap allocation | ~30% of portfolio | Overall |
| Small cap allocation | ~20% of portfolio | Overall |
| Max sector exposure | 20% of portfolio | Single sector |
| Max single stock (Large cap) | 5% of portfolio | Individual |
| Max single stock (Mid cap) | 3% of portfolio | Individual |
| Max single stock (Small cap) | 2% of portfolio | Individual |

---

## PART 3: CURRENT CODE STATE

### 3.1 Strategies Implemented (9 Total)
| # | Strategy ID | Name in Code | Name in Frontend | Basket Access | Tier |
|---|------------|-------------|-----------------|--------------|------|
| 1 | `ENVELOPE_LONG` | Institutional Floor (Long Envelope) | Envelope Long | Elite, Quality | free |
| 2 | `ENVELOPE_SHORT` | Momentum Ceiling (Short Envelope) | Envelope Short | Elite, Quality | free |
| 3 | `BOLLINGER` | Institutional Reversion | Bollinger Band | Elite, Quality | free |
| 4 | `SMA_BCD` | MA 20/50/200 Stacking (Bulk Buying Model) | SMA + BCD | Elite, Quality | pro |
| 5 | `52W_HIGH_LOW` | 52-Week High/Low | 52 week High Low | Elite, Quality | pro |
| 6 | `SR_STRATEGY` | Supply-Demand Core (B-T-B-T-B) | S&R Strategy | Elite, Quality, Growth | alpha |
| 7 | `CUP_HANDLE_ABCD` | Structural Pivot (Cup & Handle) | Cup with Handle + ABCD | Elite, Quality | pro |
| 8 | `SIXTY_SEVEN_FUNDA` | 67 Ka Funda (Contrarian Value) | Institutional Reset (67%) | ALL baskets | alpha |
| 9 | `TWENTY_RALLY_RETEST` | 20% Rally Retest | Velocity Retest (20%) | Elite, Quality, Growth | alpha |

**Note:** User confirmed "only 10 active strategies" and KNOX/RHS are removed. 9 strategies remain active. KNOX and RHS_ABCD have been fully removed from both backend and frontend code.

### 3.2 Scoring Model (validateBatch9 — 100 Points)
```
PILLAR 1: Profitability (25 pts)
  - ROE Quality:        10 pts (≥15% general, ≥10% finance/cap-intensive)
  - ROCE Efficiency:    10 pts (≥15% general, ≥8% finance/cap-intensive)
  - TTM vs ATH Net Inc:  5 pts (≥95% of ATH)

PILLAR 2: Balance Sheet Safety (25 pts)
  - Debt/Equity:        15 pts (GRADUATED: 0.2=full → 0.5=zero for gen; proportionally scaled for cap-int/finance)
  - Promoter Pledge:    10 pts (<2% full, ≥5% hard reject)

PILLAR 3: Growth Quality (25 pts)
  - Sales vs ATH:       15 pts (≥95% of ATH)
  - EPS vs ATH:         10 pts (≥95% of ATH)

PILLAR 4: Efficiency & Governance (25 pts)
  - Smart Money ≥70%:   10 pts (partial at 65%)
  - Inst. Trend Up:     10 pts (FII or DII up)
  - Promoter Down:       -5 pts (penalty)

HARD REJECTS (automatic fail regardless of score):
  1. D/E > sector limit (General: 0.5, Cap-Intensive: 1.5, Finance: 7.0)
  2. Promoter pledge ≥ 5%
  3. Smart Money (FII+DII+Promoter) < 30%

PASS THRESHOLD: Score ≥ 60
```

### 3.3 Growth Filter (growthFilter.ts — Scanner-Based)
```
TIERS:
  PASS  — Growth score ≥ 70, YoY rev ≥ 20%, YoY PAT ≥ 20%, quality gates ok, margin stable
  WATCH — Score ≥ 45, some flags
  REJECT— Hard reject or score < 45

SCORE WEIGHTS:
  - YoY Revenue Growth: 25 pts (full at ≥20%)
  - YoY PAT Growth:     25 pts (full at ≥20%)
  - Margin Expansion:    15 pts (NPM delta)
  - ROCE:               15 pts (full at ≥15%)
  - Smart Money:        10 pts (full at ≥60%)
  - PEG Ratio:          10 pts (full at ≤1.5)

HARD REJECTS:
  - <5 quarters of data
  - D/E ≥ 1.5
  - Pledge ≥ 5%
  - Smart Money < 30%
  - Revenue AND PAT both shrinking YoY
```

### 3.4 Alpha-40 Selection (worker.ts)
```
1. SCORE FILTER: Only stocks with validateBatch9 score ≥ 60
2. STRATEGY SIGNAL: At least one active buy-zone signal
3. DEDUPLICATION: One symbol appears once (highest score wins)
4. SORTING: Multi-signal > Latest Trigger > Highest ROI
5. SECTOR DIVERSITY: Max 8 stocks per sector
6. CAP ALLOCATION: 20 Large + 12 Mid + 8 Small = 40 stocks
```

---

## PART 4: IDENTIFIED GAPS (CODE vs USER FRAMEWORK)

### GAP 1: Growth Basket Constrained to NIFTY 500 ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| Growth basket scans only `NIFTY_500` list from `universe.ts` | Growth basket should scan **entire Indian market**, not just NIFTY 500 |
| `dynamic_basket.json` populated only from NIFTY 500 stocks | Should be able to identify growth stocks from full universe |
| **Plan:** Phased approach — Phase 1: Expand with BSE 500 + NSE smallcap. Phase 2: Full market via quarterly scheduled scan. Load handled via queue-based architecture. |

### GAP 2: PE Reject Logic ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| `if (pe > pe3Y * 1.02) failed.push(...)` — rejects when PE is 2% above median | Current PE must be ≤ Median PE (3Y **AND** 5Y). Lower **or equal** to both medians. |
| `checkInstitutionalMandates()` and `calculateSixtySevenFunda()` both use 1.02 multiplier | **Fix:** Change to `if (pe > pe3Y) reject` OR `if (pe > pe5Y) reject` — no tolerance. |
| RULES.md says "PE > 3Y median × 1.02 flags as overvalued" | This is wrong. Must be ≤ median, no tolerance. |

### GAP 3: 67% Strategy Target Timeline ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| Target = 2× entry (100% gain), no timeline split | **Target 1:** +67% within 1 year. **Target 2:** If 67% not reached in 1yr, then +100% |
| No 67%-in-1-year check | **Fix:** Add time-based target logic + user said "you can make it better" — can improve further |

### GAP 4: SMA-BCD Buy Starts at B (Not A) ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| SMA stacking triggers buy at A entry (like other strategies) | **A = trigger only. B = first actual buy.** SMA-BCD starts buying at B, not A. |
| All 4 tranches (A/B/C/D) treated as buy points | **Fix:** For SMA-BCD, A triggers signal detection. B/C/D are the actual buy tranches. |

### GAP 5: Sales/ATH Threshold Mismatch ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| validateBatch9 uses 95% threshold for sales/profit vs ATH ✓ | Matches user's "within ±5%" — ✅ CORRECT |
| 67% strategy uses 80% threshold for sales/profit vs ATH ❌ | Should use 95% (same as validateBatch9) — user said "you can make it better" |

### GAP 6: KNOX + RHS (Reverse H&S) Removed ✅
| Decision | Detail |
|----------|--------|
| KNOX strategy | **REMOVED** ✅ — removed from backend and frontend StrategyGuide.tsx |
| RHS (Reverse H&S) | **REMOVED** ✅ — removed from codebase entirely |
| Current strategies count | **9 active strategies**: Envelope Long, Envelope Short, Bollinger, SMA-BCD, 52W, S&R, Cup&Handle, 67%, 20% Rally Retest |

### GAP 7: Missing "Last Updated" Timestamps ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| No timestamps on basket pages, strategy results, or audit scores | Every page must show "Last updated: [timestamp]" |
| `alpha_40_results.json` has `updatedAt` but not exposed in UI | **Fix:** Add visible timestamps to all data-display components |

### GAP 8: D/E Scoring Should Be Graduated (Not Binary) + Hard Reject at 0.5 ❌
| Current Code | User's Requirement |
|-------------|-------------------|
| validateBatch9 gives 15 pts if D/E ≤ debtLimit (1.0/2.0/8.0), else 0 (binary) | D/E scoring should be **sliding scale**: 0.2 = full score, 0.2→0.5 = weightage progressively decreases. **D/E > 0.5 = HARD REJECT** for general companies |
| growthFilter.ts uses D/E < 1.5 as hard threshold | Growth basket: D/E ≤ 0.5 (confirmed). Scoring graduated from 0.2 ideal. |
| Hard reject checks `debtToEquity > debtLimit` (1.0 gen) | Must also check: for general, `de > 0.5` triggers hard reject. Finance/cap-int proportionally scaled. |

---

## PART 5: TECHNICAL IMPLEMENTATION NOTES

### 5.1 PE Median Calculation (Current Implementation)
In `screener.ts`:
```typescript
function calculatePEMedian(quotes, ttmEps, years) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);
  const peValues = quotes
    .filter(q => q.close && q.date && new Date(q.date) >= cutoff)
    .map(q => q.close / ttmEps)
    .filter(pe => pe > 0);  // Filters out negative PE
  // Sort and take median
}
```
Results stored in `screener.peMedians = { pe3Y, pe5Y, pe10Y }`.

### 5.2 Sector Classification Logic
Scattered across 3 files (needs consolidation):
- `fundamentalAudit.ts`: `isFinance`, `isCapitalIntensive`, `isETF` booleans
- `strategies/index.ts` (`checkInstitutionalMandates`): Similar logic repeated
- `worker.ts`: Additional sector classification with hardcoded symbol list

**Fix:** Extract sector classification into a shared utility function.

### 5.3 Data Refresh Schedule
| Data Type | Current Refresh | User Preference |
|-----------|----------------|----------------|
| Fundamental data (Screener.in) | On market snapshot refresh (~daily) | Monthly / Quarterly |
| Technical signals (strategies) | Every market snapshot refresh | Daily |
| Basket membership | Alpha-40 worker runs on cron + admin trigger | Growth: quarterly scan full market |
| PE medians | Computed during snapshot init | Recompute quarterly |

### 5.4 Full Market Scan Architecture (Proposed — Queue-Based)
To enable Growth basket scanning the entire Indian market (not just NIFTY 500):

**Challenge**: Screening ~2000 stocks via Screener.in + Yahoo Finance is slow. Rate limits and API timeouts make it impractical to do in one shot.

**Solution — Chunked + Queued Processing**:
```
1. BUILD MASTER UNIVERSE (one-time):
   - Merge NIFTY 500 + BSE 500 + NSE Midcap 100 + NSE Smallcap 250
   - Total: ~1350 symbols (manageable)
   - Source: static JSON file, updated quarterly

2. FUNDAMENTAL SCAN (monthly/quarterly — background queue):
   - Split universe into chunks of 50 stocks each
   - Process 1 chunk every 5 minutes (cron: */5 * * * *)
   - Each chunk: fetch Screener.in data → run growthFilter.ts → store in growth_picks table
   - Total time: ~1350/50 × 5min = ~2.25 hours (doable overnight)
   - Resume support: skip already-processed symbols

3. TECHNICAL SCAN (daily — NIFTY 500 only for now):
   - Keep current daily scan on NIFTY 500
   - Can extend to full universe later (queue-based as well)

4. STORAGE:
   - growth_picks table: { symbol, bucket(PASS/WATCH/REJECT), score, timestamp }
   - dynamic_basket.json: only PASS-rated stocks (updated after each scan cycle)
   - Basket membership on UI shows "Last updated: [timestamp]"

5. LOAD MANAGEMENT:
   - Process in background (run_in_background or cron)
   - No blocking of user-facing routes
   - Exponential backoff on Screener.in failures
   - Skip symbols with repeated timeouts
```

**Why this works**: The fundamental data doesn't change daily — quarterly updates are sufficient. Technical signals (which need daily refresh) can stay on NIFTY 500 without overloading the system.

---

## PART 6: AUDIT ENGINE (For Automated Quality Checks)

### 6.1 Audit Pipeline
In `backend/src/services/audit/engine.ts`:
1. Structural checks → 2. Data quality → 3. Strategy logic → 4. Basket membership → 5. Auto-fix → 6. Snapshot + change detection

### 6.2 What It Monitors
- Structural: File existence, config integrity, database connectivity
- Data quality: Snapshot freshness, data completeness per symbol
- Strategy: Logic correctness, parameter validation
- Basket: Membership changes, new entries, exits

---

## PART 7: KNOWN DECISIONS & CONSTRAINTS

| Decision | Detail | Status |
|----------|--------|--------|
| ✅ Sector-adjusted D/E | Finance: 7.0, Capital-intensive: 1.5, General: 0.5 | CORRECTLY IMPLEMENTED |
| ✅ Smart Money ≥ 70% | Implemented in validateBatch9 and checkInstitutionalMandates | CORRECT |
| ✅ Pledge hard reject at 5% | Implemented correctly | CORRECT |
| ✅ KNOX strategy | **REMOVED** from backend and frontend | DONE ✅ |
| ✅ RHS (Reverse H&S) | **REMOVED** from codebase entirely | DONE ✅ |
| ✅ PE logic | `pe > pe3Y || pe > pe5Y` → HARD REJECT (no tolerance) | FIXED ✅ |
| ✅ SMA-BCD buy start | A = trigger only. B = first actual buy. | FIXED ✅ |
| ✅ D/E scoring | Graduated sliding scale (0.2 ideal → 0.5 max gen) | FIXED ✅ |
| ✅ 67% sales/ATH check | 95% threshold (matches validateBatch9) | FIXED ✅ |
| ✅ 67% target | 67%-in-1yr + 100%-after logic | FIXED ✅ |
| ❌ Growth basket scope | Currently NIFTY 500 only — needs full market expansion (phased) | MUST FIX (Phase 2) |
| ⚠️ Timestamps | "Last updated" missing from all UI | ENHANCEMENT |
| ⚠️ Info tooltips | "i button" for fundamental explanation | ENHANCEMENT |
| ⚠️ Full market scan | Queue-based architecture needed | PLANNING |

---

## PART 8: PRIORITIZED FIX CHECKLIST

### Phase 1 (Critical — Accuracy Fixes)
- [ ] Fix PE logic: Change `pe > pe3Y * 1.02` to `pe > pe3Y || pe > pe5Y` — hard reject if PE above either median
- [ ] Fix D/E scoring: Change from binary to graduated sliding scale. Hard reject: general D/E > 0.5 (not 1.0).
- [ ] Fix SMA-BCD: A = trigger only, B = first buy point
- [ ] Remove KNOX strategy: Delete `calculateKnoxvilleDivergence` from codebase
- [ ] Remove RHS strategy: Delete `calculateRHS` from codebase and frontend

### Phase 2 (Completeness)
- [ ] Fix 67% strategy: Add 67%-in-1-year target + 100% fallback
- [ ] Fix 67% sales/ATH threshold: Change from 80% to 95%
- [ ] Update RULES.md with corrected rules
- [ ] Update frontend STRATEGIES array (remove RHS, KNOX)
- [ ] Update strategyService.ts basket authorization (remove RHS_ABCD)

### Phase 3 (Growth Basket Full Market Scan)
- [ ] Design queue-based architecture for full market scanning
- [ ] Expand master universe beyond NIFTY 500
- [ ] Implement quarterly growth basket refresh
- [ ] Handle load via chunked processing + background scheduling

### Phase 4 (UI/UX)
- [ ] Add "Last Updated" timestamps to all data displays
- [ ] Verify all risk disclaimers are visible

---

## PART 9: RULES.md CORRECTIONS NEEDED

| Current RULES.md Statement | Corrected Rule |
|---------------------------|---------------|
| "D/E < 0.2" (Parameter 2) | D/E ≤ 0.5 for Growth, ≤ 1.0 general scoring |
| "ROCE > 20%" (Parameter 3) | ROCE ≥ 15% general, ≥ 10% banks |
| "Profit Growth CAGR > 15%" (Parameter 5) | Confirmed correct |
| "Public < 30%" (Parameter 6) | Correct (Smart Money > 70%) |
| "67 Funda: Target 2×" (Strategy 9) | Target 1: +67% in 1yr, Target 2: +100% if 67% not met |
| Strategy 7 name: "Reverse Head & Shoulders" | Rename to "Dynamic Reversal (RHS ABCD)" |
| Growth Basket = "H Good 200" | Confirmed correct |
| "Growth Basket scans NIFTY 500" | Should note: "Currently NIFTY 500, roadmap to full market" |

---

*End of CONTEXT.md — This document should be updated as gaps are resolved and new decisions are made.*
