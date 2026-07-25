# MarketBeacon Pro — AUDIT_FINDINGS.md

> Generated from code audit. All claims point to executable source.

---

## CRITICAL FINDINGS

### C1. Basket Authorization Mismatch Between STRATEGIES and strategyService.ts

**Severity: CRITICAL**

`backend/src/index.ts` line 118-129 defines `STRATEGIES` with basket assignments, but `backend/src/services/strategyService.ts` line 10-21 has a different `authorizedBaskets` map:

| Strategy | STRATEGIES (index.ts) | strategyService.ts authorizedBaskets | Conflict? |
|----------|----------------------|--------------------------------------|-----------|
| RHS_ABCD | Quality, Elite | Elite, Quality, **Growth** | YES — Growth extra |
| CUP_HANDLE_ABCD | Quality, Elite | Elite, Quality, **Growth** | YES — Growth extra |

**Impact**: These strategies CAN trigger on Growth Basket stocks via worker.ts (which uses STRATEGY_BASKET_MAP) but the `/api/backtest/audit` endpoint uses STRATEGIES definition. Inconsistency means same strategy may behave differently depending on which code path triggers it.

**Evidence**: 
- `backend/src/index.ts:123-124` vs `backend/src/services/strategyService.ts:16-17`
- `backend/src/services/worker.ts:42-49` (STRATEGY_BASKET_MAP — a THIRD basket mapping)

### C2. Three Different Basket Mapping Sources

**Severity: CRITICAL**

There are THREE separate basket → strategy mapping sources that must be kept in sync:

1. `backend/src/index.ts:118-129` — `STRATEGIES` array with `.baskets` field
2. `backend/src/services/strategyService.ts:10-21` — `authorizedBaskets` record
3. `backend/src/services/worker.ts:42-49` — `STRATEGY_BASKET_MAP` record

Each has slightly different membership. E.g., worker.ts includes `SIXTY_SEVEN_FUNDA` in `['Elite Basket', 'Quality Basket', 'Growth Basket']` but `STRATEGIES` also includes `'Fallen Value Basket'`. 

**Impact**: A stock in Fallen Value Basket will be checked for 67 Funda by the main API but NOT by the Alpha-40 worker.

### C3. CurrentPrice ROUNDING Mismatch Between API Endpoints

**Severity: CRITICAL**

- **Strategy functions**: Return `Math.round(currentPrice)` — e.g., 1523.70 → 1524
- **`/api/backtest/audit`** (line 580): Sends `snap.quotes[last].close` — **UNROUNDED** raw float
- **`/api/public/analysis/:symbol`**: Uses raw close for calculations but falls back to `Math.round()` in abcd fallback
- **Worker Alpha-40**: Uses `last.close` unrounded for `currentPrice` (line 150)

**Impact**: UI shows different CMP than what strategy engine calculated. User sees e.g. ₹1523.70 in one place, ₹1524 in another.

**Evidence**:
- `backend/src/strategies/index.ts:92` — `currentPrice: Math.round(currentPrice)`
- `backend/src/index.ts:580` — `currentPrice: snap.quotes[snap.quotes.length - 1].close`

### C4. 67 Funda Uses CMP as Entry Price (Floating Entry)

**Severity: CRITICAL**

`backend/src/strategies/index.ts:639`: `const entryPrice = currentPrice;`

The 67 Funda strategy sets entry price equal to current market price. This means:
- Every time CMP changes, the entry price changes
- Target (`entryPrice * 2.0`) also floats
- Backtest results are non-deterministic
- User sees entry price = CMP, which creates confusion ("did I enter at this price?")

### C5. Frontend BASKETS vs Backend BASKETS Divergence

**Severity: CRITICAL**

Frontend `src/data/stocks.ts` and Backend `backend/src/index.ts` both define `BASKETS`. The Growth Basket has 290+ stocks in backend but frontend has the same. However:

- Frontend has `stocks` export (line 68-79) with hardcoded `strategy: 'Envelope Long'` — this is stale demo data
- Symbol `TATAMOTORS` appears in backend Growth Basket (line 144) but NOT as `TMCV` — `TMCV` is the correct NSE symbol. Both exist in the list, but this is a potential duplicate.

**Evidence**: 
- `src/data/stocks.ts:14-65` vs `backend/src/index.ts:131-168`
- `src/data/stocks.ts:71` — hardcoded `strategy: 'Envelope Long'`

---

## HIGH FINDINGS

### H1. NIFTY Comparison Uses Only 3 Strategies on 5 Stocks

**Severity: HIGH**

`/api/backtest/nifty-comparison` (line 732): Only uses `['BOLLINGER', 'ENVELOPE_LONG', 'ENVELOPE_SHORT']` on `['INFY', 'TCS', 'RELIANCE', 'HDFCBANK', 'ICICIBANK']`.

This means the CAGR comparison shown in AlphaHub is based on only 3 free-tier strategies on 5 large-cap stocks — NOT the full strategy suite. The displayed CAGR may not represent actual strategy performance.

**Evidence**: `backend/src/index.ts:732-733`

### H2. Worker Alpha-40 Runs Strategies Independently of User Context

**Severity: HIGH**

Worker (`worker.ts`) runs ALL strategies for ALL basket stocks regardless of user tier. The result is cached in `alpha_40_results.json`. The tier check only happens at the API layer.

This means cached Alpha-40 data may include signals from alpha-tier strategies that free users cannot access. The API correctly blocks, but the cached data is computed unnecessarily.

### H3. Strategy Buy Zone Tolerance is Uniform 2.2%

**Severity: HIGH**

All strategies use `Math.abs(currentPrice - activeE) / activeE <= 0.022` (2.2% tolerance) for buy zone determination. This is hardcoded in every strategy function.

This means a stock at ₹1000 with entry at ₹978 (2.2% below) is "in zone" — but the same stock at ₹975 (2.5% below) is NOT. This uniform tolerance may be too tight for high-volatility small-caps. No per-strategy or per-market-cap adjustment exists.

### H4. Screener.in Scraping Has No Freshness Guarantee

**Severity: HIGH**

`backend/src/screener.ts` scrapes screener.in for fundamental data. The auto-refresh logic (line 874-882 in index.ts) checks if data is >24h stale, but:

- `market_snapshot.json` is refreshed on a cron schedule
- Between cron runs, data can be up to 24h stale
- Worker pre-calculates Alpha-40 with whatever snapshot is current

---

## MEDIUM FINDINGS

### M1. Universe.ts Uses .NS Suffix, BASKETS Use Plain Symbols

**Severity: MEDIUM**

`backend/src/universe.ts` defines NIFTY_500 with `.NS` suffixes (e.g., "TCS.NS"). `BASKETS` in both frontend and backend use plain symbols (e.g., "TCS"). 

The `getSnapshotFromCloud()` function (line 240-255) handles this via multi-key lookup, but there's a risk of cache misses if the snapshot uses different keys.

### M2. Backtest Engine Exit Condition is Target-Only (No Stop Loss)

**Severity: MEDIUM**

`backend/src/services/backtestEngine.ts:122-127`: Exit only triggers when `high >= targetPrice`. There is NO stop-loss, NO time-based exit, NO max drawdown exit in the backtest engine.

This means backtest results overstate win rates because underwater positions are never closed until they hit target (even if they take years).

### M3. Alpha-40 Cache File Path Detection is Fragile

**Severity: MEDIUM**

`worker.ts:14-28` tries 5 different paths to find `alpha_40_results.json`. If none are found, cache starts empty and the first run populates it. This can cause a window where `/api/backtest/alpha-40` returns 503.

### M4. Market Index History is Synthesized, Not Real

**Severity: MEDIUM**

`/api/index-history` (line 1062+) generates synthetic OHLC data based on random walks from a base price. The data is NOT real market data. This is used for chart displays.

---

## LOW FINDINGS

### L1. Rounding Precision: Backend Rounds Differently Per Endpoint

**Severity: LOW**

- Strategy functions: `Math.round()` (integer rounding)
- Public analysis API: `r0()` = `Math.round()`, `r2()` = 2 decimal places
- Stock fundamentals API: `Math.round(lastPrice * 100) / 100` (2 decimal places)
- Envelope/Bollinger: `Math.round()` consistently
- This inconsistency means a price of 1523.70 could display as "1524" in strategy view, "1523.70" in price view

### L2. Frontend Has Hardcoded Google OAuth Client ID

**Severity: LOW**

`src/main.tsx:20` has hardcoded `clientId="500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com"`. This should be environment-configured.

