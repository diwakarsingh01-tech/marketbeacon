# MarketBeacon Pro — Audit Report

**Generated**: 2026-07-18T15:38:37.788Z

## Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 0 |
| 🟠 HIGH | 0 |
| 🟡 MEDIUM | 3 |
| ⚪ LOW | 2 |
| **Total** | **5** |

## Issues

### 🟡 [MEDIUM] Buy zone tolerance 2.2% used in 5 strategies

**Category**: strategy

**Detail**: All strategies use uniform 2.2% entry tolerance. No per-volatility adjustment.

**Evidence**: backend/src/strategies/index.ts

---

### ⚪ [LOW] 67 Funda entry locked at ATH × 0.33

**Category**: strategy

**Detail**: Entry price is now locked at the max qualifying price (ATH × 0.33). Target = entry × 2.0 is fixed.

**Evidence**: backend/src/strategies/index.ts:639

---

### ⚪ [LOW] NIFTY comparison uses all 10 strategies on all Elite Basket stocks

**Category**: backtest

**Detail**: Scope expanded to full strategy suite across all Elite Basket stocks.

**Evidence**: backend/src/index.ts:727-733

---

### 🟡 [MEDIUM] Backtest engine has no stop-loss or time-based exit

**Category**: backtest

**Detail**: Positions held indefinitely until target hit. Overstates win rate and CAGR.

**Evidence**: backend/src/services/backtestEngine.ts:122-127

---

### 🟡 [MEDIUM] Alpha-40 cache uses fragile path detection

**Category**: infra

**Detail**: Worker tries 5 paths for alpha_40_results.json. Cache miss returns 503.

**Evidence**: backend/src/services/worker.ts:14-28

---
