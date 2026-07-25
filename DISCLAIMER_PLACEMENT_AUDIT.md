# MarketBeacon Pro — Disclaimer Placement Audit

> Audit of where disclaimers exist, where they are missing, and where placement is too weak.

---

## Disclaimer Coverage Map

### ✅ Strong Coverage

| Surface | Disclaimer Text | Location | Adequate? |
|---------|----------------|----------|-----------|
| Dedicated Disclaimer Page | 6-section full disclaimer (Not Investment Advice, No Guarantee, Risk Warning, SEBI Compliance, User Responsibility, Third-Party Data) | `/disclaimer` route | ✅ Yes |
| Terms of Service | Full TOS with disclaimer of warranties, liability limitation, SEBI compliance | `/terms` route | ✅ Yes |
| Privacy Policy | SEBI Compliance Disclosure, cookies, third-party data | `/privacy-policy` route | ✅ Yes |
| App Layout Banner | "NOT a SEBI-registered Investment Adviser or Research Analyst. Educational & mathematical tools only." | `AppLayout.tsx:57` (sticky top banner) | ✅ Yes |
| Global Footer | Collapsible "Regulatory Matrix & SEBI Disclaimer" with full text | `Footer.tsx:89` | ✅ Yes |
| Site Footer | "Not Investment Advice" badge + full disclaimer text | `SiteFooter.tsx:45,111` | ✅ Yes |
| Legal Modal | Risk Disclosure + Legal Policy modals | `LegalModal.tsx` | ✅ Yes |
| AlphaHub | 5-point disclaimer section (Education only, No guarantees, Backtest limitations, Not registered advice, Your responsibility) | `AlphaHub.tsx:1016-1052` | ✅ Yes |
| AiAssistant | "educational AI, not a SEBI-registered advisor" | `AiAssistant.tsx:51,324` | ✅ Yes |
| AiSuggestionPanel | "Educational analysis only. Not SEBI-registered advice." | `AiSuggestionPanel.tsx:181` | ✅ Yes |
| AiSuggestionPublicPanel | "Educational tool — no buy/sell advice" | `AiSuggestionPublicPanel.tsx:67,165` | ✅ Yes |
| TradeTable | "Educational research model. We are NOT SEBI registered. No advisory calls." | `TradeTable.tsx:349` | ✅ Yes |
| StrategyMatrix | "Educational rule. Not a signal." + "Past performance does not guarantee future results." | `StrategyMatrix.tsx:76,88` | ✅ Yes |
| CourseFramework | "Educational scan only. Not buy/sell recommendations or personalized investment advice." | `CourseFramework.tsx:54` | ✅ Yes |
| FAQSection | Full SEBI disclaimer in FAQ | `FAQSection.tsx:29-30` | ✅ Yes |
| Home.tsx | Multiple disclaimers throughout | Various lines | ✅ Yes |
| Methodology.tsx | Full educational disclaimer | `Methodology.tsx:100` | ✅ Yes |
| PublicAnalysis.tsx | Footer disclaimer | `PublicAnalysis.tsx:277-279` | ✅ Yes |
| PublicStockCheck.tsx | "NOT SEBI-registered advisers" | `PublicStockCheck.tsx:298` | ✅ Yes |
| Login.tsx | "for educational research — not investment advice" | `Login.tsx:578` | ✅ Yes |
| BlogArticle.tsx | Full SEBI Framework Guide | `BlogArticle.tsx:38-55` | ✅ Yes |
| n8n workflows | Disclaimer appended to all LinkedIn posts | `linkedin_workflow_modified.json:67` | ✅ Yes |
| aiService.ts | System prompt prohibits buy/sell advice | `aiService.ts:7-50` | ✅ Yes |
| STRATEGY_GUIDE.md | Full SEBI compliance notice | `STRATEGY_GUIDE.md:4-5` | ✅ Yes |
| SEO.tsx | Default description includes "For educational purposes only" | `SEO.tsx:13` | ✅ Yes |
| StrategyMatrix | "Educational rule. Not a signal." + past performance disclaimer | `StrategyMatrix.tsx:76,88` | ✅ Yes |
| CourseFramework | "Educational scan only. Not buy/sell recommendations." | `CourseFramework.tsx:54` | ✅ Yes |
| TradeTable | "Educational research model. We are NOT SEBI registered. No advisory calls." | `TradeTable.tsx:349` | ✅ Yes |
| Methodology.tsx | Full educational disclaimer | `Methodology.tsx:100` | ✅ Yes |
| PublicAnalysis.tsx | Footer disclaimer | `PublicAnalysis.tsx:277-279` | ✅ Yes |
| n8n workflows | Disclaimer appended to all LinkedIn posts | `linkedin_workflow_modified.json:67` | ✅ Yes |

---

## ⚠️ Missing or Weak Disclaimer Placement

| # | Location | Issue | Suggested Fix | Severity |
|---|----------|-------|---------------|----------|
| 1 | OG images (social share cards) — `backend/src/index.ts:337` | Upside % rendered on image without disclaimer context | Add disclaimer line to OG image canvas, or ensure OG description meta tag includes "For educational purposes only" | HIGH |
| 2 | ChartsTerminal AI text — `ChartsTerminal.tsx:1229` | "A safe entry buy zone" text has no nearby disclaimer | Add disclaimer note below the AI-generated text area | MEDIUM |
| 3 | ScreenerVerify — "Audit conviction score" | Score displayed without disclaimer near it | Add small text: "Educational score. Not investment advice." | MEDIUM |
| 4 | Education.tsx — Strategy descriptions | Educational content but no explicit "not investment advice" near strategy descriptions | Add disclaimer banner at top of education page | MEDIUM |
| 5 | Profile.tsx — Win rate display | Win rate shown without caveat about backtest limitations | Add tooltip or small text: "Based on backtested results. Past performance not indicative." | MEDIUM |
| 6 | ChartsTerminal — Strategy labels (ENTRY, TARGET) | Price labels shown without disclaimer context | Add small disclaimer text near the strategy info panel | LOW |
| 7 | ScreenerVerify — Strategy signal descriptions | Signal descriptions without disclaimer | Add "Educational reference only" near signal descriptions | LOW |
| 8 | Education.tsx — Strategy descriptions | Educational content but no explicit "not investment advice" near strategy descriptions | Add disclaimer banner at top of education page | MEDIUM |
| 9 | Profile.tsx — Win rate display | Win rate shown without caveat about backtest limitations | Add tooltip: "Based on backtested results. Past performance not indicative." | MEDIUM |

---

## Disclaimer Strength Assessment

| Surface | Disclaimer Present? | Prominence | Contradicted by Adjacent UI? | Score |
|---------|-------------------|------------|------------------------------|-------|
| `/disclaimer` | ✅ Full 6-section | Dedicated page | No | A+ |
| `/terms` | ✅ Full TOS | Dedicated page | No | A+ |
| `/privacy-policy` | ✅ Full with SEBI disclosure | Dedicated page | No | A+ |
| AppLayout banner | ✅ Sticky banner | Top of every page | No | A+ |
| Footer.tsx | ✅ Collapsible | Bottom of page | No | A |
| SiteFooter.tsx | ✅ Badge + text | Bottom of page | No | A |
| LegalModal | ✅ Risk + Policy | Modal on demand | No | A |
| AlphaHub | ✅ 5-point section | Below backtest table | No | A |
| AiAssistant | ✅ In chat header + footer | Top and bottom of chat | No | A |
| AiSuggestionPanel | ✅ Below analysis | Bottom of panel | No | A |
| AiSuggestionPublicPanel | ✅ Below analysis | Bottom of panel | No | A |
| TradeTable | ✅ In table header | Top of table | No | A |
| StrategyMatrix | ✅ Below grid | Bottom of component | No | A |
| CourseFramework | ✅ In description | Top of component | No | A |
| FAQSection | ✅ In FAQ answer | Within FAQ | No | A |
| Home.tsx | ✅ Multiple | Throughout page | No | A |
| Methodology.tsx | ✅ Full disclaimer | Bottom of page | No | A |
| PublicAnalysis.tsx | ✅ Footer | Bottom of page | No | A |
| PublicStockCheck.tsx | ✅ Footer | Bottom of page | No | A |
| Login.tsx | ✅ Below form | Bottom of form | No | A |
| BlogArticle.tsx | ✅ In article content | Within article | No | A |
| n8n workflows | ✅ Appended to posts | End of each post | No | A |
| aiService.ts | ✅ In system prompt + response | Every AI response | No | A |
| STRATEGY_GUIDE.md | ✅ At top | Beginning of document | No | A |
| SEO.tsx | ✅ In default description | SEO meta tags | No | A |
| **OG images** | ❌ Missing | Social share cards | Add disclaimer line to OG image canvas | HIGH |
| **ChartsTerminal AI text** | ❌ Missing | Near AI-generated strategy text | Add disclaimer below AI text area | MEDIUM |
| **ScreenerVerify scores** | ❌ Missing | Near conviction score display | Add small disclaimer text | MEDIUM |
| **Education.tsx** | ❌ Missing near strategy descriptions | Education page | Add disclaimer banner | MEDIUM |
| **Profile.tsx win rate** | ❌ Missing | Near win rate display | Add tooltip with backtest caveat | MEDIUM |

---

## Disclaimer Text Consistency Check

| Surface | Disclaimer Text | Consistent with Legal Pages? |
|---------|----------------|---------------------------|
| AppLayout banner | "NOT a SEBI-registered Investment Adviser or Research Analyst. Educational & mathematical tools only. No content constitutes investment advice or recommendations." | ✅ Consistent with Disclaimer.tsx |
| Footer.tsx | "MarketBeacon is not a SEBI registered investment advisor. All technical signals are for educational and research purposes only." | ✅ Consistent |
| SiteFooter.tsx | "NOT a SEBI-registered Investment Adviser or Research Analyst. All scores, signals & data are mathematical models for educational purposes only." | ✅ Consistent |
| AlphaHub | "for educational and research purposes only. Past performance is not indicative of future results." | ✅ Consistent |
| AiAssistant | "I am an educational AI, not a SEBI-registered advisor." | ✅ Consistent |
| StrategyMatrix | "Educational rule. Not a signal." | ✅ Consistent |
| TradeTable | "Educational research model. We are NOT SEBI registered. No advisory calls." | ✅ Consistent |
| LegalModal | "WE ARE NOT SEBI REGISTERED INVESTMENT ADVISORS." | ✅ Consistent |

**Overall**: Disclaimer text is **consistent** across all surfaces. No contradictions found between legal pages and UI copy.

---

## Recommendation Priority

| Priority | Action | Files Affected |
|----------|--------|----------------|
| P0 | Delete or sanitize `marketbeacon/marketbeacon/` stale copy | `marketbeacon/marketbeacon/index.html` |
| P1 | Add disclaimer to OG image generation | `backend/src/index.ts:337` |
| P2 | Fix "A safe entry buy zone" in ChartsTerminal | `src/pages/ChartsTerminal.tsx:1229` |
| P3 | Add caveat to "+42.8% Avg. move per Alpha alert" | `src/pages/Home.tsx:536` |
| P4 | Add win rate caveat in AlphaHub and Profile | `AlphaHub.tsx:905`, `Profile.tsx:220` |
| P5 | Rename "conviction score" → "audit score" | Multiple files |
| P6 | Rename "Booked profit" → "Simulated Booked Profit" | `AlphaHub.tsx:953-987` |
| P7 | Replace "safe" with "technical" in UI copy | `ScreenerVerify.tsx:79`, `EducationSection.tsx:57` |
| P8 | Add disclaimer to ScreenerVerify score display | `ScreenerVerify.tsx:70,753` |
| P9 | Add disclaimer banner to Education.tsx | `Education.tsx` |
| P10 | Add win rate caveat to Profile.tsx | `Profile.tsx:220` |
