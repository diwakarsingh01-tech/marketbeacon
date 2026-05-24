# 🚀 MarketBeacon: Institutional System Review (Live)

This document provides a comprehensive audit of all features, logic, and configurations currently live in the MarketBeacon Terminal (v10.7.4-PRO).

## 1. Core Architecture
- **Dual Deployment:** Hybrid sync between Local Development (Mac) and AWS Production.
- **Database:** SQLite (local) for user management, subscription tracking, and analyst reviews.
- **Caching:** `market_snapshot.json` stores 5-year history and fundamentals for performance.
- **Real-time Engine:** Scanner bypasses cache for price/strategy math to ensure zero-latency signals.

## 2. Institutional Matrix (All 10 Strategies)
All strategies now follow the **Strict 5% Buy Zone Rule**:
1.  **Institutional Floor (Envelope Long):** Mean reversion from dynamic lower bands.
2.  **Momentum Ceiling (Envelope Short):** Strategy 2 definitive logic with 4-tranche Step-Back exits.
3.  **Volatility Channel (Bollinger):** Mean reversion against the SMA midline.
4.  **Structural Pivot (Cup & Handle):** Deep-cup breakout retests (15-50% depth).
5.  **Dynamic Reversal (RHS):** Inverted Head & Shoulders neckline breakouts.
6.  **SMA-ABCD:** Stacking Moving Averages (20/50/200) with price recovery.
7.  **52W High/Low:** Mean reversion from major 52-week support levels.
8.  **Velocity Retest:** 20% rally origins retested within a 1-year window.
9.  **Deep Recovery Audit (67 Ka Funda):** 67% drawdowns with improving fundamentals.
10. **Supply-Demand Core:** Local fractal support/resistance zones.

## 3. Fundamental Audit (Batch 9 Standard)
A 100-point scoring system applied to every scan:
- **Profitability (15 pts):** ROE/ROCE > 15% (Adjusted for Finance).
- **Safety (20 pts):** Debt-to-Equity < 0.20 (General) or < 8.0 (Finance). **Hard reject if Pledging > 5%**.
- **Growth (15 pts):** Sales & Net Profit must be at All-Time Highs (2% tolerance).
- **Ownership (25 pts):** Institutional (Promoter + FII + DII) > 70%. **Hard reject if < 30%**.
- **Valuation (25 pts):** Comparison against 3Y, 5Y, and 10Y Median PE.

## 4. UI/UX Bifurcation
- **Qualified:** Fresh signals where Price ≤ Entry + 5%.
- **Observation:** Running stocks where Price > Entry + 5% (to prevent chasing).
- **Neutral:** Stocks in the universe without an active signal.
- **Rejected:** High-risk stocks that failed the Fundamental Audit.
- **Watchlist:** Complete overview of the selected basket.

## 5. Stock Universe & Tagging
- **Universe:** 500+ stocks (Nifty 500) now integrated.
- **Dynamic Tagging:** Automatic sector and market cap tagging via Screener.in/Yahoo Finance.
- **Cap Mix (50-30-20):** Automatic monitoring of portfolio allocation (Large-Mid-Small).

## 6. Automation & Maintenance
- **Cron Jobs:** 
  - `2:30 AM`: Full Fundamental Audit & Strategy Run.
  - `11:00 AM`: Mid-day Price/Snapshot Update.
- **Self-Cleaning:** Automated log purge and context optimization every 3 tasks.
