# MarketBeacon Pro — AUDIT_GAPS.md

> All items resolved. See below for resolution status.

---

## ✅ G1: 67 Funda — Floating Entry Price Intent

**Fixed**: `entryPrice` changed from `currentPrice` (floating) to `ath * 0.33` (locked at max qualifying price). Target = entry × 2 is now fixed.

---

## ✅ G2: RHS and Cup & Handle — Growth Basket Intent

**Fixed**: RHS/CUP restricted to `['Elite Basket', 'Quality Basket']` — Growth Basket excluded.

---

## ✅ G3: NIFTY Comparison CAGR — Which Strategies Should It Use?

**Fixed**: Expanded from 3 free strategies on 5 stocks to all 10 strategies on all 40 Elite Basket stocks.

---

## ✅ G4: Fallen Value Basket — Active or Stale?

**Fixed**: Added `'Fallen Value Basket'` to worker's STRATEGY_BASKET_MAP and processBasket call.

---

## ✅ G5: Backtest No Stop-Loss Policy — Intentional?

**Confirmed**: Intentional per Hemant Jain's methodology. Uses structural position sizing instead of stop-losses.

---

## ✅ G6: Market Indices Hardcoded Fallback Prices

**Fixed**: Updated fallback prices to current values (NIFTY 24078, BANK NIFTY 58200, SENSEX 77185) and ATH values (26373, 58200, 81500).

---

## ✅ G7: Frontend stocks.ts Fallback Data

**Fixed**: Removed unused `stocks` export from `src/data/stocks.ts`. Only `BASKETS` and `STRATEGIES` are imported by consumers.

---

## ✅ G8: Intraday Index Chart Data — Synthetic

**Fixed**: Replaced random walk OHLC generation with real Yahoo Finance chart API data for all intervals (5m, 15m, 1d).
