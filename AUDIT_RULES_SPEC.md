# MarketBeacon Pro — AUDIT_RULES_SPEC.md

> Implemented logic extracted from code. Not aspirational. Only verified rules included.

---

## Strategy 1: Envelope Long (Institutional Floor)

**File**: `backend/src/strategies/index.ts:47-93`

### Technical Rules
1. **Base**: SMA 200 of close prices
2. **Envelope**: Lower = SMA × 0.86, Upper = SMA × 1.14 (14% envelope)
3. **Entry A**: Price low touches lower band × 1.01 tolerance → entry = Math.round(lowerBand)
4. **Entry B**: A entry × 0.90, **C**: B × 0.90, **D**: C × 0.90
5. **Target A**: Math.round(upperBand), **B**: a_entry, **C**: b_entry, **D**: c_entry
6. **Exit**: Price high reaches target
7. **Buy Zone**: Active tranche AND |currentPrice - entry| / entry ≤ 0.022
8. **Reset**: After target hit, state → NONE; after B target → A; after C → B; after D → C

### Return Fields
- `isBuyZone`, `entryPrice`, `target`, `currentPrice`, `triggerDate`, `tranche`, `abcd`, `isLocked`

---

## Strategy 2: Envelope Short (Momentum Ceiling)

**File**: `backend/src/strategies/index.ts:102-132`

### Technical Rules
1. **Base**: SMA 200 of close prices
2. **Entry A**: Price close ≥ SMA prev day AND current low ≤ SMA → entry = Math.round(SMA)
3. **Target A**: Math.round(SMA × 1.14) — upper band
4. **Entry B**: Math.round(SMA × 0.86) — lower band, Target B: SMA
5. **Entry C/D**: 10% steps below B, Target: previous tranche entry
6. **Buy Zone**: 2.2% tolerance from active entry
7. **Trigger**: Price closes above SMA then drops below SMA in next bar

---

## Strategy 3: Bollinger Band (Institutional Reversion)

**File**: `backend/src/strategies/index.ts:141-219`

### Technical Rules
1. **Base**: SMA 200, StdDev 2.5
2. **Lower Band**: SMA − StdDev × 2.5, **Upper**: SMA + StdDev × 2.5
3. **Entry A**: Price low ≤ lowerBand × 1.01 → entry = Math.round(lowerBand)
4. **Target A**: Math.round(upperBand)
5. **Ladder**: B = A × 0.90, C = B × 0.90, D = C × 0.90
6. **Buy Zone**: 2.2% tolerance

---

## Strategy 4: SMA Stacking (MA 20/50/200)

**File**: `backend/src/strategies/index.ts:224-253`

### Technical Rules
1. **Entry condition**: Price < SMA20 < SMA50 < SMA200 (bear stacking)
2. **Entry A**: Current price at bear condition → entry = Math.round(price)
3. **Target A**: Math.round(SMA200)
4. **Ladder**: B = A × 0.90, C = B × 0.90, D = C × 0.90
5. **Exit**: Price > average of all active entry prices (bull stacking recovery)
6. **Buy Zone**: 2.2% tolerance

---

## Strategy 5: 52-Week High/Low

**File**: `backend/src/strategies/index.ts:258-286`

### Technical Rules
1. **Lookback**: 251 bars
2. **Entry**: Price low ≤ 52-week low × 1.01 → entry = Math.round(52w low)
3. **Target**: Math.round(52w high)
4. **Ladder**: B = A × 0.90, C = B × 0.90, D = C × 0.90
5. **Reset**: Price high ≥ 52w high × 0.99
6. **B → A reset**: Price high ≥ a_entry
7. **Buy Zone**: 2.2% tolerance

---

## Strategy 6: SR Strategy (Supply-Demand Core)

**File**: `backend/src/strategies/index.ts:292-451`

### Technical Rules
1. **Swing Detection**: 3-bar lookback, both sides
2. **Cluster Tolerance**: 5.0% for grouping swing points
3. **Pattern**: B1-T1-B2-T2-B3 (B-T-B-T-B sequence)
4. **Window**: B3 must be within 252 bars of current
5. **Entry Trigger**: 2 consecutive up-close + up-low candles after B3
6. **Entry Price**: Close of entry candle
7. **Target**: Min resistance cluster price within sequence
8. **Gap Mandate**: supportFloor → target ≥ 30%, entry → target ≥ 30%
9. **Stop Loss**: Min(supportFloor, entryLow) − 0.5 × ATR(14)
10. **ABCD Tranche**: Based on supportCeiling with 10% gap per level
11. **Buy Zone**: Current price within 2.2% of any ABCD level
12. **Observation**: Current ≤ supportCeiling × 1.15 AND not in buy zone

---

## Strategy 7: RHS (Reverse Head & Shoulders)

**File**: `backend/src/strategies/index.ts:457-497`

### Technical Rules
1. **Rule 1**: 30% ATH drawdown required
2. **Pattern**: Left shoulder → Head → Right shoulder (swing low detection, 15-bar window)
3. **Rule 2**: Pattern depth (neckline → head) ≥ 30%
4. **Correction**: Right shoulder correction from neckline: 8%–18%
5. **Rule 3**: Target upside gap ≥ 30%
6. **Target**: neckline + (neckline − head price)
7. **Buy Zone**: Current price within 2.2% of right shoulder

---

## Strategy 8: Cup & Handle

**File**: `backend/src/strategies/index.ts:503-543`

### Technical Rules
1. **Rule 1**: 30% ATH drawdown required
2. **Pattern**: Left rim → Cup bottom → Right rim → Handle (swing high/low detection, 15-bar window)
3. **Rim match**: Left/right rim prices within 8% of each other
4. **Rule 2**: Cup depth (rim → bottom) ≥ 30%
5. **Handle correction**: 7%–20% from right rim
6. **Rule 3**: Target upside gap ≥ 30%
7. **Target**: rim + (rim − bottom)
8. **Buy Zone**: Current price within 2.2% of handle low

---

## Strategy 9: 67 Ka Funda (Contrarian Value)

**File**: `backend/src/strategies/index.ts:566-661`

### Technical Rules
1. **Drawdown**: ≥ 67% from ATH
2. **Profit Potential**: ≥ 100% (ATH / current ≥ 2.0)
3. **Net Profit**: > ₹50 Cr (no SME/junk)
4. **Sales**: ≥ 80% of ATH sales
5. **Net Profit**: ≥ 80% of ATH net profit
6. **D/E**: < 1.0 (or < 8.0 for finance)
7. **P/E**: < 60 AND < 3Y median × 1.02
8. **Entry**: currentPrice ≤ ATH × 0.33 (67% down zone)
9. **Target**: entryPrice × 2.0 (100% gain)
10. **Entry Price**: = currentPrice (floating — see Finding C4)

---

## Strategy 10: Velocity Retest (20% Rally)

**File**: `backend/src/strategies/index.ts:676-746`

### Technical Rules
1. **Start**: close > prev close AND price < EMA200
2. **Rally candles**: All green (close > open), each low > previous low
3. **Gain**: (highestWick − lowestWick) / lowestWick ≥ 19% (1 candle) or ≥ 20% (multi-candle)
4. **Fall Window**: Peak must be within 252 bars
5. **Entry**: Current price within 2.2% of rally origin (lowest wick)
6. **Target**: Math.round(rallyPeak) — highest wick of rally
7. **Preference**: Entry below EMA200 (flagged, not required)
8. **Scan**: Backwards from latest, uses FIRST valid rally found

---

## Fundamental Audit (validateBatch9)

**File**: `backend/src/services/fundamentalAudit.ts:4-152`

### Scoring (0-100)
| Category | Max Score | Key Checks |
|----------|-----------|------------|
| Profitability | 25 | ROE ≥ 12/15, ROCE ≥ 10/15, TTM vs ATH profit |
| Safety | 25 | D/E ≤ limit (1.0/2.0/8.0), promoter pledge < 2% |
| Growth | 25 | Sales ≥ 95% ATH, EPS ≥ 95% ATH |
| Efficiency | 25 | Smart Money ≥ 65-70%, FII/DII trending up |

### Pass Threshold: 60

### Hard Rejects (ETF-exempted)
- D/E > sector limit
- Pledged ≥ 5%
- Smart Money < 30%

### Sector-Based D/E Limits
| Sector Type | D/E Limit |
|-------------|-----------|
| Finance/NBFC | 8.0 |
| Capital Intensive (Infra/Power/Steel/Telecom/Auto) | 2.0 |
| Everything else | 1.0 |

### Smart Money Formula
`promoter% + fii% + dii%`

### Trend Detection
- Uses last 2 data points of shareholding history
- UP if last - prev > 0.1
- DOWN if last - prev < -0.1
- FLAT otherwise
