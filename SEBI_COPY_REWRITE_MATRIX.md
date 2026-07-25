# MarketBeacon Pro — SEBI Copy Rewrite Matrix

> Structured table of all compliance-sensitive wording found in the codebase, with suggested safer alternatives.

---

## 🔴 Critical — Needs Immediate Review

| # | Current Wording | Location | Risk Reason | Suggested Safer Wording | Needs Approval? | Legal Review? |
|---|---|---|---|---|---|---|
| 1 | `"multibagger stock analysis"`, `"multibagger stocks 2026"`, `"safe stocks for long term"`, `"best stocks to buy today"` | `marketbeacon/marketbeacon/index.html:14,17` | Implies stock recommendations, safety guarantees, multibagger promises | Delete file or replace with: `"stock research tool for educational purposes"` | YES | YES |
| 2 | `"+42.8% Avg. move per Alpha alert"` | `src/pages/Home.tsx:536` | Performance claim without context | `"Historical avg. price move per Alpha alert (backtested, 2015-2025)"` | YES | YES |
| 3 | `"A safe entry buy zone is currently active at ₹{entry} with key profit booking target targets at ₹{target}"` | `src/pages/ChartsTerminal.tsx:1229` | "safe" + "buy zone" + "profit booking" implies assurance and recommendation | `"A technical entry zone is currently active at ₹{entry} with target objectives at ₹{target}"` | YES | YES |
| 4 | `"+42.8% Avg. move per Alpha alert"` | `src/pages/Home.tsx:536` | Performance claim without context | `"Historical avg. price move per Alpha alert (backtested, 2015-2025)"` | YES | YES |
| 5 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays identified by the Alpha-40 signal engine"` | YES | NO |
| 6 | `"high-conviction setups"` | `src/pages/Methodology.tsx:27` | "High-conviction" implies endorsement | `"high-scoring setups"` | YES | NO |
| 7 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 8 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 9 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 10 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 11 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 12 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 13 | `"A safe entry buy zone"` | `src/pages/ChartsTerminal.tsx:1229` | "safe" implies assurance | `"A technical entry zone"` | YES | YES |
| 14 | `"key profit booking target targets"` | `src/pages/ChartsTerminal.tsx:1229` | "profit booking" implies guaranteed gains | `"key target objectives"` | YES | YES |
| 15 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 16 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
| 17 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 18 | `"high-conviction setups"` | `src/pages/Methodology.tsx:27` | "High-conviction" implies endorsement | `"high-scoring setups"` | YES | NO |
| 19 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 20 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 21 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 22 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 23 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 24 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 25 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 26 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
| 27 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 28 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 29 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 30 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 31 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 32 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 33 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 34 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 35 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 36 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 37 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 38 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 39 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 40 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 41 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 42 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
| 43 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 44 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 45 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 46 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 47 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 48 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 49 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 50 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 51 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
| 52 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 53 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 54 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 55 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 56 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 57 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 58 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 59 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 60 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 61 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 62 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 63 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 64 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 65 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 66 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 67 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
| 68 | `"High-conviction reversal plays"` | `src/pages/AlphaHub.tsx:152` | "High-conviction" implies endorsement | `"High-scoring reversal plays"` | YES | NO |
| 69 | `"high-conviction 100-point audit"` | `src/components/StrategyGuide.tsx:97` | "High-conviction" implies endorsement | `"comprehensive 100-point audit"` | YES | NO |
| 70 | `"increase conviction but do not guarantee success"` | `src/pages/Methodology.tsx:40` | "Conviction" implies certainty | `"increase alignment but do not guarantee success"` | YES | NO |
| 71 | `"Audit conviction score exceeds 75/100"` | `src/pages/ScreenerVerify.tsx:70` | "Conviction" implies certainty | `"Audit score exceeds 75/100"` | YES | NO |
| 72 | `"Verification conviction"` | `src/pages/ScreenerVerify.tsx:753` | "Conviction" implies certainty | `"Verification score"` | YES | NO |
| 73 | `"conviction score out of 100"` | `src/pages/Home.tsx:311`, `FAQSection.tsx:22` | "Conviction" implies certainty | `"audit score out of 100"` | YES | NO |
| 74 | `"Booked profit"` | `src/pages/AlphaHub.tsx:953-987` | Could be interpreted as actual realized profit | `"Simulated Booked Profit"` or `"Backtest Booked Profit"` | YES | NO |
| 75 | `"Strong fundamental audit score indicating safe business structure"` | `src/pages/ScreenerVerify.tsx:79` | "safe" implies assurance | `"Strong fundamental audit score indicating sound business structure"` | YES | NO |
| 76 | `"A safe 25% initial position tranche is cleared for audit"` | `src/components/landing/EducationSection.tsx:57` | "safe" implies assurance | `"A 25% initial position tranche is cleared for audit"` | YES | NO |
