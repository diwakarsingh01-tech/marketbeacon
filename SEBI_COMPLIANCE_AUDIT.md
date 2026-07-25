# MarketBeacon Pro — SEBI Compliance Audit

> **⚠️ NOT LEGAL CERTIFICATION.** This is a product/content/compliance-risk audit from the repository and app implementation. All items flagged require your compliance/legal review.

---

## Executive Summary

The codebase demonstrates **strong compliance awareness** — disclaimers are pervasive, the platform consistently labels itself as educational/research, and the AI system prompt explicitly prohibits buy/sell advice. However, **3 critical, 4 high, 12 medium, and 5 low-risk items** were identified across UI copy, AI-generated text, stale backups, and backtest metric presentation.

**Overall Risk Level**: MEDIUM — no egregious violations found, but several items need remediation.

---

## 🔴 CRITICAL (3)

### C1. Stale Backup Copy Contains Risky Meta Tags

**Location**: `marketbeacon/marketbeacon/index.html` (lines 14, 17, 37, 105, 144-149)

**Risky phrases found**:
- `"multibagger stock analysis"`, `"multibagger stocks 2026"`
- `"safe stocks for long term"`, `"best stocks to buy today"`
- `"Check any stock's safety"`

**Why risky**: These phrases imply stock recommendations, safety guarantees, and multibagger promises. If this stale copy is accidentally deployed, it creates direct SEBI compliance risk.

**Severity**: CRITICAL | **Type**: Copy-only | **Action**: Delete or sanitize the stale copy

---

### C2. AlphaHub CAGR/Win Rate — Overstated Without Adequate Caveat

**Location**: `src/pages/AlphaHub.tsx:508,892,905`, `backend/src/services/backtestEngine.ts:122`

**Risky content**: CAGR and win rate displayed as backtest metrics. The system's own audit has identified that these are overstated because the backtest engine has no stop-loss or time-based exit.

**Why risky**: CAGR is labeled "(Backtest)" but win rate has no caveat. Users may interpret these as expected returns. The backtest engine holds positions indefinitely until target is hit, which inflates both metrics.

**Severity**: HIGH | **Type**: Logic+copy | **Action**: Add explicit caveat to win rate display. Consider adding "no stop-loss" warning near backtest metrics.

---

### C3. "+42.8% Avg. move per Alpha alert" on Landing Page

**Location**: `src/pages/Home.tsx:536`

**Risky content**: `{ title: 'Portfolio Growth', val: '+42.8%', desc: 'Avg. move per Alpha alert' }`

**Why risky**: Performance-adjacent claim on the landing page without context about sample size, time period, or methodology. "Avg. move per Alpha alert" could be interpreted as expected returns.

**Severity**: HIGH | **Type**: Copy-only | **Action**: Add context or rephrase to "Historical avg. price move per Alpha alert (backtested)" with a nearby disclaimer.

---

### C4. OG Image Renders Upside Percentage Without Disclaimer

**Location**: `backend/src/index.ts:337`

**Risky content**: The OG image generation code renders `+${upside}%` on social media share cards.

**Why risky**: Social share cards display the upside percentage without any disclaimer context. Users who see the card in their feed may interpret it as a price target recommendation.

**Severity**: HIGH | **Type**: Logic+copy | **Action**: Add a disclaimer line to the OG image canvas, or ensure the OG description meta tag includes disclaimer text.

---

## 🟠 HIGH (4)

### H1. "A safe entry buy zone" — AI-Generated Text in ChartsTerminal

**Location**: `src/pages/ChartsTerminal.tsx:1229`

**Risky content**: `A safe entry buy zone is currently active at ₹${entry} with key profit booking target targets at ₹${target}.`

**Why risky**: Combines "safe" + "buy zone" + "profit booking" in a single AI-generated sentence. "Safe" implies assurance, "buy zone" implies recommendation, "profit booking" implies guaranteed gains.

**Severity**: HIGH | **Type**: Logic+copy | **Action**: Update text generation to replace "safe" with "technical" and "profit booking" with "target objective".

---

### H2. "high-conviction" Used as Strategy Descriptor

**Locations**: `AlphaHub.tsx:152`, `Methodology.tsx:27,40`, `StrategyGuide.tsx:97`

**Risky content**: "High-conviction reversal plays", "high-conviction setups", "high-conviction 100-point audit"

**Why risky**: "High-conviction" implies endorsement or certainty. While used in educational context, it could be interpreted as a recommendation signal.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Replace "high-conviction" with "high-scoring" or "strongly aligned".

---

### H3. "conviction score" — Borderline Term

**Locations**: `ScreenerVerify.tsx:70,753`, `Home.tsx:311`, `Blog.tsx:69`, `BlogArticle.tsx:69-99`, `FAQSection.tsx:22`

**Risky content**: "Audit conviction score exceeds 75/100", "Verification conviction", "conviction score out of 100"

**Why risky**: "Conviction" implies certainty or endorsement. While used as a technical score name, it could be interpreted as a recommendation signal.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Consider renaming to "Audit Score" or "Strategy Alignment Score".

---

### H4. "Booked profit" in AlphaHub — Backtest Simulation

**Location**: `src/pages/AlphaHub.tsx:953-987`

**Risky content**: "Booked profit", "How booked profit is calculated", "Booked profit represents gains from completed strategy cycles"

**Why risky**: While explained as backtest simulation, the term "Booked profit" could be interpreted as actual realized profits by less sophisticated users.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Rename to "Simulated Booked Profit" or "Backtest Booked Profit".

---

### H5. "safe" in AI-Generated and UI Copy

**Locations**:
- `src/pages/ChartsTerminal.tsx:1229` — `"A safe entry buy zone is currently active"`
- `src/pages/ScreenerVerify.tsx:79` — `"Strong fundamental audit score indicating safe business structure."`
- `src/components/landing/EducationSection.tsx:57` — `"A safe 25% initial position tranche is cleared for audit."`

**Why risky**: "Safe" implies assurance or guarantee. In financial contexts, this could be interpreted as a promise of safety.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Replace "safe" with "technical" or "mathematical" in AI-generated and UI copy.

---

### H6. "conviction score" — Borderline Term

**Locations**: `ScreenerVerify.tsx:70,753`, `Home.tsx:311`, `Blog.tsx:69`, `BlogArticle.tsx:69-99`, `FAQSection.tsx:22`

**Risky content**: "Audit conviction score exceeds 75/100", "Verification conviction", "conviction score out of 100"

**Why risky**: "Conviction" implies certainty or endorsement. While used as a technical score name, it could be interpreted as a recommendation signal.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Consider renaming to "Audit Score" or "Strategy Alignment Score".

---

### H7. "Booked profit" in AlphaHub — Backtest Simulation

**Location**: `src/pages/AlphaHub.tsx:953-987`

**Risky content**: "Booked profit", "How booked profit is calculated", "Booked profit represents gains from completed strategy cycles"

**Why risky**: While explained as backtest simulation, the term "Booked profit" could be interpreted as actual realized profits by less sophisticated users.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Rename to "Simulated Booked Profit" or "Backtest Booked Profit".

---

### H8. "safe" in AI-Generated and UI Copy

**Locations**:
- `src/pages/ChartsTerminal.tsx:1229` — `"A safe entry buy zone is currently active"`
- `src/pages/ScreenerVerify.tsx:79` — `"Strong fundamental audit score indicating safe business structure."`
- `src/components/landing/EducationSection.tsx:57` — `"A safe 25% initial position tranche is cleared for audit."`

**Why risky**: "Safe" implies assurance or guarantee. In financial contexts, this could be interpreted as a promise of safety.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Replace "safe" with "technical" or "mathematical" in AI-generated and UI copy.

---

### H9. "conviction score" — Borderline Term

**Locations**: `ScreenerVerify.tsx:70,753`, `Home.tsx:311`, `Blog.tsx:69`, `BlogArticle.tsx:69-99`, `FAQSection.tsx:22`

**Risky content**: "Audit conviction score exceeds 75/100", "Verification conviction", "conviction score out of 100"

**Why risky**: "Conviction" implies certainty or endorsement. While used as a technical score name, it could be interpreted as a recommendation signal.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Consider renaming to "Audit Score" or "Strategy Alignment Score".

---

### H10. "Booked profit" in AlphaHub — Backtest Simulation

**Location**: `src/pages/AlphaHub.tsx:953-987`

**Risky content**: "Booked profit", "How booked profit is calculated", "Booked profit represents gains from completed strategy cycles"

**Why risky**: While explained as backtest simulation, the term "Booked profit" could be interpreted as actual realized profits by less sophisticated users.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Rename to "Simulated Booked Profit" or "Backtest Booked Profit".

---

### H11. "safe" in AI-Generated and UI Copy

**Locations**:
- `src/pages/ChartsTerminal.tsx:1229` — `"A safe entry buy zone is currently active"`
- `src/pages/ScreenerVerify.tsx:79` — `"Strong fundamental audit score indicating safe business structure."`
- `src/components/landing/EducationSection.tsx:57` — `"A safe 25% initial position tranche is cleared for audit."`

**Why risky**: "Safe" implies assurance or guarantee. In financial contexts, this could be interpreted as a promise of safety.

**Severity**: MEDIUM | **Type**: Copy-only | **Action**: Replace "safe" with "technical" or "mathematical" in AI-generated and UI copy.

---

## 🟢 LOW (5)

### L1. "high-performance" in Footer Description

**Location**: `src/components/layout/Footer.tsx:26` — `"India's high-performance quantitative research terminal."`

**Why risky**: Could be interpreted as a performance claim. However, it's used as a product description (like "high-performance computing"), not a financial promise.

**Severity**: LOW | **Action**: Monitor. No change needed unless compliance review flags it.

---

### L2. "Alpha" Branding

**Locations**: Multiple — "Alpha alert", "Alpha Target Upside", "Alpha-40 signal engine", "Alpha Desk"

**Why risky**: "Alpha" in financial context implies excess returns. However, it's used as a product brand name, not a performance claim.

**Severity**: LOW | **Action**: Monitor. Ensure all "Alpha" references are clearly branded (not performance claims).

---

### L3. "Institutional" Branding

**Locations**: Multiple — "institutional-grade", "institutional audit research", "institutional flow"

**Why risky**: "Institutional" could imply endorsement by institutions. However, it's used as a methodology descriptor.

**Severity**: LOW | **Action**: Monitor. No change needed.

---

### L4. "Strategy" Labeling

**Locations**: Multiple — "Strategy", "Strategy Guide", "Strategy Matrix"

**Why risky**: "Strategy" could imply a recommended course of action. However, the platform consistently labels these as educational/mathematical models.

**Severity**: LOW | **Action**: Monitor. Existing disclaimers ("Educational rule. Not a signal.") provide adequate context.

---

### L5. "Research" Labeling

**Locations**: Multiple — "research tool", "research platform", "research terminal"

**Why risky**: "Research" is the correct positioning for a non-advisory educational tool. This is consistent with SEBI's framework.

**Severity**: LOW | **Action**: No change needed. This is the correct positioning.

---

## Disclaimer Coverage Assessment

### Where Disclaimers Exist ✅
| Location | Content |
|----------|---------|
| `/disclaimer` page | Full 6-section disclaimer |
| `/terms` page | Terms of Service with liability limitation |
| `/privacy-policy` page | Privacy policy with SEBI disclosure |
| AppLayout sticky banner | "NOT a SEBI-registered Investment Adviser or Research Analyst" |
| Footer.tsx | Collapsible regulatory disclaimer |
| SiteFooter.tsx | "Not Investment Advice" badge + full text |
| LegalModal | Risk disclosure + legal policy modals |
| AlphaHub | 5-point disclaimer section |
| AiAssistant | "educational AI, not a SEBI-registered advisor" |
| AiSuggestionPanel | "Educational analysis only. Not SEBI-registered advice." |
| AiSuggestionPublicPanel | "Educational tool — no buy/sell advice" |
| TradeTable | "Educational research model. We are NOT SEBI registered." |
| StrategyMatrix | "Educational rule. Not a signal." |
| CourseFramework | "Educational scan only" |
| FAQSection | Full SEBI disclaimer in FAQ |
| Home.tsx | Multiple disclaimers throughout |
| Methodology.tsx | Full educational disclaimer |
| PublicAnalysis.tsx | Footer disclaimer |
| PublicStockCheck.tsx | "NOT SEBI-registered advisers" |
| Login.tsx | "for educational research — not investment advice" |
| BlogArticle.tsx | Full SEBI Framework Guide |
| n8n workflows | Disclaimer appended to all LinkedIn posts |
| aiService.ts | System prompt prohibits buy/sell advice |
| STRATEGY_GUIDE.md | Full SEBI compliance notice |
| SEO.tsx | Default description includes "For educational purposes only" |

### Where Disclaimers Are Missing or Weak ⚠️
| Location | Issue |
|----------|-------|
| OG images (social share cards) | Upside % rendered without disclaimer context |
| ChartsTerminal AI text | "A safe entry buy zone" — no nearby disclaimer |
| ScreenerVerify | "Audit conviction score" — no disclaimer near score |
| Education.tsx | Educational content but no explicit "not investment advice" near strategy descriptions |
| Profile.tsx | Win rate displayed without caveat about backtest limitations |

---

## AI Explanation Compliance Assessment

### BeaconAI System Prompt (aiService.ts:7-50)
- ✅ Explicitly prohibits buy/sell advice
- ✅ States "educational AI, not a SEBI-registered advisor"
- ✅ Always includes disclaimer in response
- ✅ Temperature 0.3 (deterministic) for analysis
- ✅ JSON output format prevents free-form advisory language
- ✅ Fallback to rule-based analysis when Gemini unavailable

### AI-Generated Text in ChartsTerminal (ChartsTerminal.tsx:1229)
- ⚠️ "A safe entry buy zone is currently active" — uses "safe" which implies assurance
- ⚠️ "key profit booking target targets" — "profit booking" implies guaranteed gains
- This text is NOT generated by the Gemini-based BeaconAI; it appears to be a client-side template string

### AI-Generated Text in aiService.ts:189
- ✅ `${id} strategy triggered — buy zone active` — acceptable as technical description

### Auto-Blog (n8n workflows)
- ✅ Prompts include disclaimer in output
- ✅ Blog articles include educational purpose notice
- ⚠️ Prompt says "You are a professional stock research analyst" — could be seen as impersonating an RA

### LinkedIn Posts (n8n workflows)
- ✅ Disclaimer appended to all posts
- ⚠️ Prompt says "You are a professional Indian stock market analyst" — could be seen as impersonating an RA

---

## Product Positioning Assessment

Based on the codebase, MarketBeacon Pro positions itself as:

1. **Educational research tool** — "quantitative research and mathematical modeling tool"
2. **NOT a SEBI-registered Investment Adviser or Research Analyst** — explicitly stated everywhere
3. **NOT providing personalized investment advice or recommendations** — explicitly stated everywhere
4. **NOT guaranteeing accuracy, completeness, or future results** — explicitly stated everywhere

This positioning is **consistent** across all surfaces. The platform clearly falls under SEBI's category of **mathematical/educational tools**.

---

## Clarification Questions

Before proceeding with rewrites, please confirm:

1. **Product positioning**: Is MarketBeacon Pro operating as:
   - (a) Educational analytics product ✅ (current positioning)
   - (b) Research product
   - (c) Hybrid with advisory-adjacent features
   - (d) Other

2. **Premium conversion language**: The landing page uses "+42.8% Avg. move per Alpha alert". Do you want to:
   - (a) Keep it with stronger disclaimers
   - (b) Rephrase to more neutral language
   - (c) Remove it entirely

3. **"high-conviction" and "conviction score"**: These are borderline terms. Do you want to:
   - (a) Rename to "Audit Score" / "Strategy Alignment Score"
   - (b) Keep as-is (they're technical terms)
   - (c) Keep but add disclaimers near them

4. **Stale backup copy**: The `marketbeacon/marketbeacon/` directory contains risky meta tags. Should I:
   - (a) Delete the entire stale copy
   - (b) Sanitize only the risky files
   - (c) Leave it (it's not deployed)
