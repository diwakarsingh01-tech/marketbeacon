# MarketBeacon Pro — AUDIT_MAP.md

## System Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────────────┐
│   Frontend (React)  │────▶│   Backend (Express + TS)      │
│   src/              │     │   backend/src/                 │
│   port 5173         │     │   port 3001                    │
└─────────────────────┘     └──────────┬───────────────────┘
       │                                │
       │ fetch via getApiUrl()          │ Yahoo Finance (yahoo-finance2)
       │                                ▼
       │                     ┌──────────────────────┐
       │                     │   Market Snapshot     │
       │                     │   market_snapshot.json│
       │                     │   (JSON file cache)   │
       │                     └──────────────────────┘
       │                                │
       │                         ┌──────┴──────────┐
       │                         │                 │
       │                         ▼                 ▼
       │                  ┌────────────┐   ┌──────────────┐
       │                  │  Turso DB  │   │  Supabase     │
       │                  │ (libsql)   │   │  (optional)   │
       │                  │ users,     │   │  system_cache │
       │                  │ trades,    │   │               │
       │                  │ vouchers   │   │               │
       │                  └────────────┘   └──────────────┘
       │
       │  Screener.in (scraped for fundamentals)
       ▼
┌──────────────────────┐
│   Worker (cron)       │
│   precalculateAlpha40 │
│   Alpha-40 cache      │
│   alpha_40_results.json│
└──────────────────────┘
```

## Value Lineage

### entryPrice
| Source | Transform | Storage | API | UI |
|--------|-----------|---------|-----|-----|
| Strategy function calc (OHLC close/low) | `Math.round()`, optional `* 0.90` for ladder | In-memory strategy return | `/api/backtest/audit` → `strategyData.entryPrice` or 0 | `AlphaHub.tsx` → `stock.entryPrice?.toLocaleString()` |
| `worker.ts` best signal selection | `validSignals.sort((a,b) => b.roi - a.roi)[0]` | `alpha_40_results.json` | `/api/backtest/alpha-40` → `stock.entryPrice` | `AlphaHub.tsx` table |
| 67 Funda: `currentPrice` used as entry | `const entryPrice = currentPrice` | Strategy return | Same path | Same path |

### target
| Source | Transform | Storage | API | UI |
|--------|-----------|---------|-----|-----|
| Strategy function calc | `Math.round()`, per-strategy formula | In-memory strategy return | Same as entryPrice path | `AlphaHub.tsx` → `stock.target?.toLocaleString()` |
| Envelope/Bollinger: `upperBand` | `Math.round(sma * (1 + %/100))` or `Math.round(sma + stdDev * sd)` | Same | Same | Same |
| RHS/CupHandle: `neckline + (neckline - head)` | `Math.round(neckline + (neckline - head))` | Same | Same | Same |
| SR Strategy: resistance cluster mean | `Math.min(...R.points.map(p => p.price))` | Same | Same | Same |
| 67 Funda: `entryPrice * 2.0` | `Math.round(entryPrice * 2.0)` | Same | Same | Same |
| Velocity Retest: rally peak | `Math.round(rallyPeak)` | Same | Same | Same |

### currentPrice / CMP
| Source | Transform | Storage | API | UI |
|--------|-----------|---------|-----|-----|
| Last OHLC close | Strategy returns `Math.round(currentPrice)` | In-memory | `/api/backtest/audit` line 580: `snap.quotes[last].close` (UNROUNDED) | `{stock.currentPrice?.toLocaleString()}` |
| Last OHLC close | `worker.ts` line 150: `last.close` (UNROUNDED) | `alpha_40_results.json` | `/api/backtest/alpha-40` → `stock.currentPrice` | Same |

### basePrice
| Source | Transform | Storage | API | UI |
|--------|-----------|---------|-----|-----|
| `strategyData?.entryPrice \|\| last.close` | `Math.round(basePrice)` | `/api/backtest/audit` abcd fallback | API response | Not directly shown in AlphaHub |

### score / auditScore
| Source | Transform | Storage | API | UI |
|--------|-----------|---------|-----|-----|
| `validateBatch9()` → 4 category scoring | 0-100 composite | Per-request computed | `/api/backtest/audit` → `audit.score` | `AlphaHub.tsx` grade color via `stock.tranche` |
| `worker.ts` line 70: `audit.score` | Copied directly | `alpha_40_results.json` | `/api/backtest/alpha-40` | Not displayed in AlphaHub table |

## Strategy Modules

File: `backend/src/strategies/index.ts`

| Strategy ID | Function | Lines | Key Parameters |
|-------------|----------|-------|----------------|
| ENVELOPE_LONG | `calculateEnvelope()` | 47-93 | SMA 200, 14% envelope |
| ENVELOPE_SHORT | `processShortEnvelope()` | 102-132 | SMA 200, 14% envelope |
| BOLLINGER | `calculateBollingerBand()` | 141-219 | SMA 200, StdDev 2.5 |
| SMA_BCD | `calculateSMAStacking()` | 224-253 | SMA 20/50/200 stacking |
| 52W_HIGH_LOW | `calculate52WeekStrategy()` | 258-286 | 252-bar lookback |
| SR_STRATEGY | `calculateSRStrategy()` | 292-451 | Swing B-T-B-T-B, 3-bar lookback, 5% cluster tolerance, 30% gap |
| RHS_ABCD | `calculateRHS()` | 457-497 | 30% ATH drawdown, 30% pattern depth, 30% target |
| CUP_HANDLE_ABCD | `calculateCupHandle()` | 503-543 | 30% ATH drawdown, 30% pattern depth, 30% target |
| SIXTY_SEVEN_FUNDA | `calculateSixtySevenFunda()` | 566-661 | 67% ATH drawdown, 10-point checklist |
| TWENTY_RALLY_RETEST | `calculateTwentyRallyRetest()` | 676-746 | All-green candles, 19-20% gain, EMA200 below |

## Basket Modules

File: `backend/src/index.ts` line 131, `src/data/stocks.ts` line 14

| Basket | Stock Count | Strategy Coverage | Notes |
|--------|-------------|-------------------|-------|
| Elite Basket | 40 | All 10 strategies | Core basket |
| Quality Basket | 38 | SMA_BCD, RHS_ABCD, CUP_HANDLE, SR, 67F, VELOCITY | Mid-cap quality |
| Growth Basket | ~290 | SR, 67F, VELOCITY (via strategyService.ts) + RHS/CUP in worker | Largest, most overlap |
| Fallen Value Basket | 9 | 67F only | Newest basket |

## Key API Endpoints

| Endpoint | Purpose | Data Source | Auth Required |
|----------|---------|-------------|---------------|
| `/api/backtest/audit` | Strategy audit per basket/strategy | Market snapshot + validateBatch9 | Yes |
| `/api/backtest/alpha-40` | Alpha Hub portfolio | Pre-calculated worker cache | Yes (alpha tier) |
| `/api/backtest/history` | Single stock backtest | Market snapshot | No |
| `/api/stock-fundamentals` | Fundamental data | Market snapshot + validateBatch9 | No |
| `/api/public/analysis/:symbol` | Public stock analysis | Market snapshot + validateBatch9 | No |

## Cron / Worker Jobs

| Job | File | Frequency | Purpose |
|-----|------|-----------|---------|
| Screener data fetch | `screener.ts` | Cron (configurable) | Updates market_snapshot.json |
| Alpha-40 precalculate | `worker.ts` | On boot + cron | Pre-computes Alpha Hub cache |
| Audit scheduler | `cron/auditScheduler.ts` | Cron | Runs system audit |
| Health check | `services/healthCheck.ts` | Cron | Validates system health |
