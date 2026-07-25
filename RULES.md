
# MarketBeacon Pro — Investment Research Methodology Handbook

> **SEBI Registration**: Not Applicable (Research Analyst services not provided)
> **Disclaimer**: Investment in securities market are subject to market risks. Read all the related documents carefully before investing.
> **No Guarantee**: The methodologies, screening parameters, and strategy rules described herein are for educational and informational purposes only. Past performance of any strategy or signal does not guarantee future results. Users should consult their registered financial advisor before making any investment decision.
> **Not Advice**: Nothing in this document constitutes investment advice, a recommendation, or an offer to buy or sell any securities. The system merely identifies stocks meeting certain predefined criteria.

---

## How to Use This Handbook

When you visit MarketBeacon Pro, the system evaluates stocks across multiple dimensions — from fundamental health to technical patterns — to identify potential opportunities. This handbook explains every rule and parameter used, so you understand **what** the system checks and **why**.

---

## Step 1: Choose Your Investment Universe (Baskets)

The system organizes stocks into **four baskets** based on their size, quality, and growth characteristics:

### Elite Basket (40 Stocks)
The largest, most liquid, and most established companies in India. These are NIFTY 50 and top blue-chip stocks with proven track records and high institutional interest.

**Examples**: TCS, RELIANCE, HDFCBANK, INFY, ICICIBANK, ITC, HINDUNILVR, BHARTIARTL, MARUTI, SUNPHARMA, and 30 more.

**Best for**: Conservative investors seeking stability and institutional-grade quality.

### Quality Basket (39 Stocks)
Well-managed mid-to-large cap companies with strong fundamentals, consistent profitability, and dominant market positions in their respective sectors.

**Examples**: RELAXO, DIXON, POLYCAB, KEI, BOSCHLTD, MOTILALOFS, HEROMOTOCO, TVSMOTOR, and 31 more.

**Best for**: Growth-oriented investors comfortable with moderate risk.

### Growth Basket (Dynamic — Updated Quarterly)
A dynamic universe screened from the NIFTY 500 using six rigorous fundamental parameters (see Step 2). Stocks must pass **all six** to enter. Updated every quarter to reflect the latest financial data.

**Timeframe Variations**: The growth parameters (Sales Growth, Profit Growth) are typically evaluated over a **3-year CAGR** period. However, some screening variations use 5-year or 10-year CAGR for additional confirmation. The system defaults to 3-year CAGR as the primary filter. **Full market scan: Growth basket scans ~2000 stocks (Nifty 500 + mid/small-cap universe) weekly via Sunday cron.**

**Best for**: Investors seeking companies with strong growth momentum and financial discipline.

### Growth Basket = Dynamic Scanner Universe (Filter-Based)
The Growth Basket is built from a dynamic scanner that applies fundamental filters (D/E, ROCE, ROE, profit thresholds) to identify growth stocks. It scans the NIFTY 500 universe. Swing trading strategies (20% Rally Retest, S&R) are applied to this universe.

**Best for**: Swing traders seeking medium-term opportunities (2 weeks to 3 months holding period).

### Fallen Value Basket (Contrarian Opportunities)
Stocks that have declined significantly (67% or more from their all-time high) but show signs of fundamental recovery. Identified via the "67 Funda" strategy.

**Best for**: Contrarian value investors with a higher risk tolerance and longer time horizon.

---

## Step 2: Fundamental Health Check (6-Parameter Screening)

For a stock to qualify for the **Growth Basket**, it must pass **all six** of the following fundamental checks. These parameters are applied to the latest annual/quarterly financial data available from public sources (Screener.in).

## PE Ratio & Valuation Methodology

The system calculates and displays **three types of PE ratios** for every stock:

### Current PE (peRatio)
- **Primary Source**: Screener.in (Indian exchange data) — `Price ÷ TTM EPS` from BSE/NSE filings
- **Fallback**: Yahoo Finance trailingPE
- **Why Screener.in first**: For Indian (Nifty 500) stocks, Screener.in data is more reliable — it's sourced directly from Indian exchange filings and reflects accurate post-bonus/post-split share counts. Yahoo Finance trailingPE can be stale or use wrong share counts (e.g., HDFCBANK post-bonus adjustment).

### Median PE (peMedians)
- **3-Year Median (pe3Y)**: Median of daily `close ÷ TTM EPS` over the trailing 3 years (~756 trading days)
- **5-Year Median (pe5Y)**: Same calculation over trailing 5 years (~1,260 trading days)
- **10-Year Median (pe10Y)**: Same calculation over trailing 10 years (~2,520 trading days)

**Calculation Method**: For each trading day in the trailing window:
```
dailyPE = dailyClosePrice / TTMEPS
MedianPE = median(all dailyPE values)
```

Outliers (PE < 0 or PE > 200) are filtered before computing the median. The TTM EPS used is the current trailing EPS from Screener.in's latest annual data.

**Data Source**: 20 years of historical daily OHLCV prices from Yahoo Finance are stored in the market snapshot. PE medians are computed server-side during each snapshot refresh.

### How PE Is Used in Strategy Rules
| Strategy | PE Rule |
|----------|---------|
| 67 Funda | Current PE must be **≤ both** 3-year median AND 5-year median PE |
| General Screening | Current PE must be ≤ 3Y median AND ≤ 5Y median. Higher than either → REJECT |
| Institutional Audit | PE used in scoring; PE > 60 flagged as high valuation alert |

### Data Consistency
All PE fields (`peRatio`, `shareholding.pe`, `peMedians.pe3Y/5Y/10Y`) use the same data source hierarchy: Screener.in → Yahoo Finance. This ensures consistency — previously `peRatio` used Yahoo while `shareholding.pe` used Screener.in, causing mismatches.

---

### Parameter 1: Net Profit > ₹200 Crore
The company must have generated a net profit (profit after tax) exceeding ₹200 crore in the most recent trailing twelve months (TTM).

**Why**: Ensures the company is sizable enough to withstand economic cycles and has meaningful scale. Small-cap and micro-cap companies with lower profits tend to have higher volatility and lower institutional interest.

### Parameter 2: Debt-to-Equity Ratio (Graduated Scoring — Sector-Adjusted)
The company should have a debt-to-equity ratio within sector-specific limits. **Scoring is graduated**: D/E at ideal level gets full score (15/15). From ideal to max, the score progressively decreases. D/E exceeding sector **hard reject** limit triggers automatic fail.

**Why**: Low debt indicates financial strength and lower bankruptcy risk. Companies with high debt are more vulnerable during economic downturns and rising interest rate cycles. The system uses a sliding scale to reward lower D/E without a sudden binary cutoff.

**Sector-Specific Thresholds**:
| Sector | Ideal D/E (Full Score) | Hard Reject (Auto Fail) |
|--------|----------------------|------------------------|
| **General (Non-Financial)** | 0.2 | 0.5 |
| **Capital-Intensive** (Auto, Infra, Power, Steel, Telecom, Oil & Gas, Pharma, Chemicals, Mining, Textiles, Media, Electricals, Healthcare) | 0.6 | 1.5 |
| **Finance / Banking / NBFC** | 1.6 | 7.0 |

**Capital-Intensive sectors include**: EPC/Infra, Automobile, Infrastructure, Power, Steel, Telecom, Cement, Metal, Engineering, Utilities, Oil & Gas, Energy, Petrochemicals, Pharma, Pharmaceuticals, Chemicals, Mining, Logistics, Textiles, Media, Entertainment, Electricals, Electronics, Healthcare, Hospitality, Food Processing, and specific symbols (LT, BHARTIARTL, M&M, ADANIPORTS, ADANIENT, JSWSTEEL, TATASTEEL, NTPC, POWERGRID, RELIANCE, ONGC, BPCL, IOC, GAIL, SUNPHARMA, DRREDDY, CIPLA, DIVISLAB, APOLLOHOSP, etc.).

### Parameter 3: ROCE (Sector-Adjusted)
Return on Capital Employed (ROCE) must exceed sector-specific thresholds. ROCE measures how efficiently a company uses its capital to generate profits.

**Sector Thresholds**:
| Sector | Minimum ROCE |
|--------|-------------|
| **General (Non-Financial)** | 15% |
| **Capital-Intensive** | 8% |
| **Finance / Banking / NBFC** | 8% |

**Why**: A strong ROCE indicates that the company has a competitive advantage (economic moat) and can generate superior returns on invested capital. Capital-intensive and financial sectors naturally have lower ROCE due to higher asset bases, so thresholds are relaxed.

### Parameter 4: Sales Growth (3-Year CAGR) > 10%
The company's revenue must have grown at a compound annual growth rate (CAGR) of more than 10% over the last three years.

**CAGR Formula**: (Latest Year Sales / Sales 3 Years Ago) ^ (1/3) — 1 > 10%

**Why**: Consistent revenue growth indicates that the company's products/services are in demand and the business is expanding its market share.

### Parameter 5: Profit Growth (3-Year CAGR) > 15%
The company's net profit must have grown at a compound annual growth rate (CAGR) of more than 15% over the last three years.

**CAGR Formula**: (Latest Year Profit / Profit 3 Years Ago) ^ (1/3) — 1 > 15%

**Why**: Profit growth exceeding sales growth indicates improving operational efficiency, pricing power, and economies of scale.

### Parameter 6: Public Shareholding < 30%
The public (non-promoter, non-institutional) shareholding must be less than 30%. This means the combined holding of promoters, FIIs, and DIIs is above 70%.

**Calculation**: Public Holding % = 100 — (Promoter % + FII % + DII %)

**Why**: High institutional and promoter holding indicates confidence in the company's management and future prospects. Low public float also reduces speculative trading.

---

## Step 3: Smart Money Trend Analysis (Governance Check)

Beyond the six hard parameters, the system analyzes the **trend** of key shareholder categories over recent quarters. This is displayed as a watch/alert, not a hard filter.

### What Is Checked

| Category | What We Track | How We Interpret |
|----------|--------------|------------------|
| **Promoters** | % holding trend over last 4 quarters | Increasing → Positive, Decreasing → Caution, Stable → Neutral |
| **FIIs (Foreign Institutional Investors)** | % holding trend over last 4 quarters | Increasing → Bullish signal, Decreasing → Caution, Stable → Neutral |
| **DIIs (Domestic Institutional Investors)** | % holding trend over last 4 quarters | Increasing → Bullish signal, Decreasing → Caution, Stable → Neutral |

### How It's Presented to You

```
Promoter: 65.2% (Stable) ✓
FII: 18.5% (Increasing) ↑
DII: 12.3% (Decreasing) ↓ ⚠️ Caution
Smart Money Total: 96.0% ✅ Strong
```

If any category shows a **decreasing** trend, a caution icon (⚠️) is displayed. You should investigate further:
- Why are they decreasing? (Profit booking? Loss of confidence? Sector rotation?)
- Is the decrease significant (>2% in one quarter)?

---

## Step 4: Institutional Scoring Model (validateBatch9)

Every stock in every basket receives a **composite score out of 100** based on four pillars. A score of 60+ is considered passing.

### Pillar 1: Profitability (Max 25 Points)

| Check | Points | Criteria |
|-------|--------|----------|
| ROE Quality | 10 | ROE ≥ 15% (10% for finance/capital-intensive) |
| ROCE Efficiency | 10 | ROCE ≥ 15% (8% for finance/capital-intensive) |
| TTM vs ATH Net Income | 5 | Current net profit ≥ 95% of all-time high |

### Pillar 2: Balance Sheet Safety (Max 25 Points)

| Check | Points | Criteria |
|-------|--------|----------|
| Debt/Equity | 15 | D/E scoring: graduated sliding scale. Ideal D/E (general: 0.2, cap-int: 0.6, finance: 1.6) = full 15 pts. Progressively decreases to 0 at sector hard-reject limit (general: 0.5, cap-int: 1.5, finance: 7.0). |
| Promoter Pledge | 10 | Pledged shares < 2% |

### Pillar 3: Growth Quality (Max 25 Points)

| Check | Points | Criteria |
|-------|--------|----------|
| Sales vs ATH | 15 | Current sales ≥ 95% of all-time high |
| EPS Health | 10 | Current EPS ≥ 95% of all-time high |

### Pillar 4: Efficiency & Governance (Max 25 Points)

| Check | Points | Criteria |
|-------|--------|----------|
| Smart Money Strength | 10 | ≥ 70% combined promoter + FII + DII holding |
| Institutional Trend | 10 | FII or DII trend is Up |
| Promoter Trend Penalty | -5 | If promoter holding is decreasing |

### Hard Reject Conditions (Automatic Fail)

A stock is **automatically rejected** (score irrelevant) if ANY of these applies:
- Debt-to-Equity exceeds sector hard-reject threshold (General: **0.5** / Capital-Intensive: **1.5** / Finance: **7.0**)
- Promoter pledge ≥ 5%
- Smart Money total < 30% (extremely low institutional confidence)

### Score Interpretation

| Score Range | Rating | Meaning |
|-------------|--------|---------|
| 80 — 100 | ✅ Strong Institutional | High-quality stock, suitable for core holding |
| 60 — 79 | ✅ Acceptable | Meets minimum institutional standards |
| 40 — 59 | ⚠️ Below Average | Higher risk, needs deeper research |
| 0 — 39 | ❌ Weak | Failed institutional criteria |

---

## Step 5: Technical Strategy Rules (The 9 Strategies)

These are the 9 technical strategies the system uses to identify entry opportunities. Each strategy has precise rules and applies to specific baskets.

### Strategy 1 — Envelope Long (Institutional Floor)

**Applies to**: Elite Basket, Quality Basket

**ABCD Tranche Ladder**:
| Tranche | Entry Price | Target |
|---------|-------------|--------|
| A | Lower Band (SMA200 × 0.86) | Upper Band (SMA200 × 1.14) |
| B | A — 10% | A |
| C | B — 10% | B |
| D | C — 10% | C |

**Entry Condition**: Current price within 2.2% of the active tranche price.

**How to read**: If the system shows "Envelope Long — Tranche A Active" with entry price ₹2,500 and target ₹3,100, it means: the stock touched the lower band, and if current price is within 2.2% of ₹2,500, it's in the entry zone. The target is the upper band.

---

### Strategy 2 — Envelope Short (Momentum Ceiling)

**Applies to**: Elite Basket, Quality Basket

**Logic**: When the stock was trading above the 200-day SMA (bullish momentum) and then pulls back to touch the SMA, the system identifies a re-entry opportunity.

**Tranche Structure**:
| Tranche | Entry Price | Target |
|---------|-------------|--------|
| A | SMA200 (middle line) | Upper Band (SMA200 × 1.14) |
| B | Lower Band (SMA200 × 0.86) | SMA200 |
| C | B — 10% | B |
| D | C — 10% | C |

**Entry Condition**: Current price within 2.2% of active tranche.

---

### Strategy 3 — Bollinger Band (Institutional Reversion)

**Applies to**: Elite Basket, Quality Basket

**Settings**: 200-period SMA, 2.5 Standard Deviation

**Logic**: When the stock touches the lower Bollinger Band (SMA200 minus 2.5 standard deviations), it is statistically oversold. The system targets a reversion to the upper band.

**ABCD Ladder**: Same 10% step-down pattern as Envelope Long.

---

### Strategy 4 — SMA Stacking (Bulk Buying Model — BCD)

**Applies to**: Elite Basket, Quality Basket

**Logic**: The system identifies a "bear stacking" condition where price < SMA20 < SMA50 < SMA200. This indicates a prolonged downtrend. The system then triggers at the prevailing price with a target of SMA200.

**Key Rule — A = Signal, B = First Buy**:
- **A entry** = trigger/signal detection only (NOT a buy point)
- **B** = first actual buy entry (~10% below A)
- **C** = second averaging buy (~10% below B)
- **D** = third averaging buy (~10% below C)
- This is the SMA-BCD model: **Buy starts at B, not A.**
- Buy zone: only B/C/D are buy tranches

**Exit**: When bull stacking returns (price > SMA20 > SMA50 > SMA200).

---

### Strategy 5 — 52-Week High/Low

**Applies to**: Elite Basket, Quality Basket

| Tranche | Entry | Target |
|---------|-------|--------|
| A | 52-week low | 52-week high |
| B | A — 10% | A |
| C | B — 10% | B |
| D | C — 10% | C |

---

### Strategy 6 — Support & Resistance Strategy (SR Strategy)

**Applies to**: Elite Basket, Quality Basket, Growth Basket, H Good 200 (Swing Trading)

**Logic**: The system identifies supply-demand zones by finding swing lows (support) and swing highs (resistance) over the last ~1100 trading days.

**Pattern Required**: B-T-B-T-B (Bottom-Top-Bottom-Top-Bottom)
- Three touches at the same support zone
- Two touches at the same resistance zone between them
- Support and resistance touches must alternate

**Hard Rules**:
1. Support must have been touched at least 3 times
2. Resistance must have been touched at least 2 times (in between the support touches)
3. Gap between support floor and target must be ≥ 30%
4. Entry-to-target gap must be ≥ 30%
5. Entry confirmed after 2 consecutive green candles from support

**Entry Zone**: Current price within 2.2% of any ABCD level (calculated from support ceiling).

---

### Strategy 7 — Cup with Handle (CUP HANDLE ABCD)

**Applies to**: Elite Basket, Quality Basket

**Logic**: The system detects a Cup & Handle pattern — a bullish consolidation pattern resembling a tea cup.

**Three Hard Rules** (All must pass):
1. **30% ATH Drawdown**: Stock must have fallen at least 30% from all-time high
2. **30% Pattern Depth**: Rim to bottom distance must be ≥ 30% of rim price
3. **30% Target Upside**: Target must offer at least 30% upside from entry

**Additional Filters**:
- Left and right rims must be within 8% of each other (symmetry)
- Handle correction: 7% — 20% from right rim
- Entry: At handle low, within 2.2% of that price

---

### Strategy 8 — Institutional Reset (67 Ka Funda)

**Applies to**: Elite Basket, Quality Basket, Growth Basket, Fallen Value Basket

**Logic**: A contrarian value strategy for stocks that have fallen 67% or more from their all-time high. The system uses a 10-point binary checklist.

**Automated Checks (6 of 10)**:
1. ✅ Stock is ≥ 67% down from ATH
2. ✅ Minimum 67% profit potential within 1 year (primary target), 100% as fallback
3. ✅ Net Profit > ₹50 Crore
4. ✅ D/E ≤ 0.5 (finance: ≤ 4.0)
5. ✅ P/E ≤ both 3-year median AND 5-year median PE
6. ✅ Quarterly sales & profit near ATH (≥ 95% of ATH)

**Manual Review Required (4 of 10)**:
1. ❓ Why did the stock fall? (Sentiment / Business / Fundamental)
2. ❓ Does that reason no longer exist?
3. ❓ Future growth prospects (industry outlook, business moat)
4. ❓ Exit rule planning: Sell at **+67% if within 1 year**, else hold to **+100%** or ATH

**Entry Price**: Locked at ATH × 0.33 (maximum qualifying price) — does not float with current market price.

**Target Logic**:
- **Target 1**: +67% within 1 year (primary target)
- **Target 2**: If 67% not reached within 1 year, roll target to +100%

**Risk**: This is the highest-risk strategy. Only suitable for investors who can tolerate significant volatility and have a long-term horizon.

---

### Strategy 9 — Velocity Retest (20% Rally Retest)

**Applies to**: Elite Basket, Quality Basket, Growth Basket

**Logic**: The system identifies a sharp rally of 20% or more from an origin point, then waits for the stock to retest that origin before entering.

**Rally Detection**:
- Start: Close > previous close AND price below EMA200
- Every candle in the rally must be green (close > open)
- All candles must make higher lows (inclusive of wicks)
- Gain from lowest wick to highest wick must be ≥ 20%
- Single candle exception: ≥ 19% qualifies

**Entry**: When price falls back to the rally origin (within 2.2% tolerance).

**Target**: Rally peak (highest wick).

**Time Limit**: The retest must occur within approximately 1 year (252 trading days) of the rally peak.

**Preference**: Entries below the 200-day EMA are considered stronger (stock is not overextended).

---


When you view any stock, the system runs all applicable strategies and shows:

1. **Is a strategy active?** → Shows the active tranche (A/B/C/D), entry price, and target
2. **Is the stock in the entry zone?** → Current price within 2.2% of entry price
3. **What is the potential upside?** → (Target / Current Price — 1) × 100

**Signal Types**:
| Signal | Meaning | Action |
|--------|---------|--------|
| 🟢 BUY Zone | Strategy active + price in entry zone | Opportunity identified |
| 🟡 Watch | Strategy active but price not yet in zone | Monitor for price to enter zone |
| 🔴 No Signal | No strategy currently active | Stock not in a setup |

---

## Step 7: Alpha-40 Selection Process

The system selects the **top 40 stocks** across all baskets using a multi-layered selection process:

### Layer 1: Score Filter
Only stocks with a validateBatch9 score ≥ 60 are considered.

### Layer 2: Strategy Signal
Only stocks with at least one active buy-zone signal from an applicable strategy qualify.

### Layer 3: Selection Rules
1. **Multi-signal priority**: Stocks with signals from multiple strategies get priority
2. **Freshness**: Recently triggered signals get priority over older ones
3. **ROI**: Higher target ROI gets priority within same-tier candidates
4. **Sector diversity**: Maximum 8 stocks per sector to ensure diversification

### Layer 4: Cap Allocation
| Market Cap | Slots | Criteria |
|------------|-------|----------|
| Large Cap (≥ ₹45,000 Cr) | 20 | Highest stability |
| Mid Cap (₹15,000 — ₹45,000 Cr) | 12 | Growth with moderate risk |
| Small Cap (< ₹15,000 Cr) | 8 | High growth potential, higher risk |

---

## Risk Warnings and Disclaimers

### ⚠️ General Risks
- **Market Risk**: Stock prices can go down as well as up. Past performance does not guarantee future results.
- **Concentration Risk**: Even with sector diversification, concentrated positions in any strategy or basket carry higher risk.
- **Data Risk**: The system relies on publicly available data from Screener.in (Indian exchange filings) and Yahoo Finance (historical prices). **Screener.in PE data is used as the primary source for Indian stocks** — Yahoo Finance trailingPE is only a fallback. PE medians are computed server-side from 20 years of daily Yahoo Finance price data combined with Screener.in TTM EPS. Snapshot data refreshes every 24 hours.

### ⚠️ Strategy-Specific Risks
| Strategy | Key Risk | Mitigation |
|----------|----------|------------|
| Bollinger/Envelope | Trend may continue against position | ABCD ladder averages entry |
| 67% Funda | Stock may continue to fall further | Entry locked at ATH×0.33, manual review required |
| 20% Rally Retest | Rally may not retest the origin | Only enters when in 2.2% zone |
| S&R | Support may break | ATR-based stop loss calculated |
| Cup & Handle | Pattern may fail or be invalid | 3 hard rules must ALL pass |

### ⚠️ SEBI Mandatory Disclaimer
> "Investment in securities market are subject to market risks. Read all the related documents carefully before investing."
>
> "The information provided on this website is for general informational purposes only and should not be construed as investment advice. We are not registered with SEBI as a Research Analyst or Investment Advisor."
>
> "Before acting on any information, you should consider whether it is suitable for your particular circumstances and, if necessary, seek professional advice."
>
> "The securities quoted are for illustration only and are not recommendatory."

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| Current | 3.2 | **Final accuracy fixes**: D/E thresholds updated (General 0.5 / Cap-Int 1.5 / Finance 7.0), ROE/ROCE sector-adjusted (Finance/Cap-Int: 10%/8%), SMA-BCD A=trigger B=first-buy confirmed, KNOX/RHS removed, Quality Basket mapped to all strategies, sector classification expanded (Oil/Energy/Pharma/Chemicals/Textiles/Media/Healthcare). Full audit: Elite 17/40 qualified, ZERO anomalies. |
| 3.1 | Full Phase 1 accuracy fixes: PE logic corrected (no tolerance), D/E graduated scoring, SMA-BCD A=trigger, RHS/KNOX removed. RULES.md synced. |
| 3.0 | PE Calculation Overhaul: Added `calculatePEMedian()` using historical daily prices (3Y/5Y/10Y). PE source priority changed to Screener.in > Yahoo Finance for Indian stocks. |
| Previous | 2.0 | Updated with fundamental scoring improvements, PE median rules, basket definitions |
| Older | 1.0 | Initial rule book based on Hemant Jain — Equity Course Batch 4 |

---

*End of Rule Book*
