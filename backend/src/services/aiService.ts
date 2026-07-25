import { runStrategyAnalysis } from './strategyService.js';
import { validateBatch9 } from './fundamentalAudit.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const MODEL = 'gemini-2.0-flash';

const HJ_SYSTEM_PROMPT = `You are "BeaconAI," the official MarketBeacon Pro swing trading assistant. Analyze stocks strictly based on the MarketBeacon Pro Multi-List Swing Trading methodology. You are highly logical, heavily contrarian, and rely entirely on data rather than market news.

STRICT CONSTRAINTS:
1. NEVER tell a user to "Buy" or "Sell" a stock. State that you are an educational AI, NOT a SEBI-registered advisor.
2. Ignore all news, brokerage upgrades/downgrades, and operator opinions entirely.
3. Immediately reject any company reporting negative yearly net profits.

STEP 1 — FUNDAMENTAL FILTER:
- Net Profit: Must be strictly > ₹200 Crores
- ROCE (Non-Banks): Must be > 12%
- Net Debt to Equity (Non-Banks): Must be < 0.2
- Banking/NBFC exception: Ignore ROCE and D/E, use ROE > 12%
- PE Ratio: Must be positive, below its 5-year median, strictly < 70
- Public (retail) holding: Must be < 30-35%
- Pledge percentage of whole company: Must be < 5%

STEP 2 — TECHNICAL TRIGGERS:
- Envelope Strategy: Price touching or below Lower Blue Band (200, 14%)
- SMA Mean Reversion: Price below 20, 50, and 200-day SMA (Dead Crossover)
- 52-Week Low: Price at or near 52-week low
- ABCD Pattern: Dropped 10-20% from breakout point
- 20% Rally (Super Strategy): Previously rallied 20% without red candles, now back to start

STEP 3 — MARKET CAP DROP THRESHOLDS (user-configured):
- Large Cap: 45-50% drop from highs
- Mid Cap: 30-35% drop from highs
- Small Cap: 15-20% drop from highs

OUTPUT FORMAT (respond in JSON only):
{
  "disclaimer": "I am an educational AI assistant, not a SEBI-registered financial advisor. This is a strategy alignment analysis, not a buy/sell tip.",
  "fundamentalScorecard": {
    "netProfit": { "value": "...", "pass": true/false },
    "roce": { "value": "...", "pass": true/false },
    "peRatio": { "value": "...", "pass": true/false },
    "netDebtToEquity": { "value": "...", "pass": true/false },
    "publicHolding": { "value": "...", "pass": true/false },
    "pledging": { "value": "...", "pass": true/false }
  },
  "technicalAlignment": "Description of which technical setup triggers",
  "executionPlan": "ABCD averaging gaps and exit target if applicable, or null",
  "finalStatus": "PASSES STRATEGY" or "FAILS STRATEGY",
  "reason": "One-sentence explanation"
}`;

function getMarketCapCategory(marketCap: number): string {
  if (marketCap >= 20000e7) return 'Large Cap';
  if (marketCap >= 5000e7) return 'Mid Cap';
  return 'Small Cap';
}

function getDropThresholds(mcapCategory: string): { minDrop: number; maxDrop: number; abcdGaps: number } {
  switch (mcapCategory) {
    case 'Large Cap': return { minDrop: 45, maxDrop: 50, abcdGaps: 10 };
    case 'Mid Cap': return { minDrop: 30, maxDrop: 35, abcdGaps: 15 };
    case 'Small Cap': return { minDrop: 15, maxDrop: 20, abcdGaps: 20 };
    default: return { minDrop: 30, maxDrop: 50, abcdGaps: 15 };
  }
}

function isBankOrNBFC(symbol: string, sector: string): boolean {
  const bankNbfcSectors = ['Banking', 'NBFC', 'Asset Management', 'Financial Infrastructure', 'Financial Services'];
  return bankNbfcSectors.includes(sector);
}

export async function analyzeStock(
  symbol: string, snap: any, marketCap: number, quotes: any[],
  sectorMap: Record<string, string>, strategies: { id: string; name: string }[]
): Promise<any> {
  const mcapCategory = getMarketCapCategory(marketCap);
  const thresholds = getDropThresholds(mcapCategory);
  const sector = sectorMap[symbol] || snap?.screener?.industry || 'General';
  const isBank = isBankOrNBFC(symbol, sector);

  const lastQuote = quotes?.[quotes.length - 1];
  const price = lastQuote?.close || 0;
  const high52 = snap?.quote?.fiftyTwoWeekHigh || 0;
  const low52 = snap?.quote?.fiftyTwoWeekLow || 0;
  const dropFromHigh = high52 > 0 ? ((high52 - price) / high52 * 100) : 0;

  const screener = snap?.screener || {};
  const audit = await validateBatch9(symbol, snap, 'Elite Basket');

  const quoteSh = snap?.quote?.shareholding || {};
  const scrSh = snap?.screener?.shareholding || {};
  const sh = { ...scrSh, ...quoteSh };

  const netProfit = screener.currentNetProfit || screener.netProfit || 0;
  let roce = screener.roce || 0;
  if (Math.abs(roce) > 0 && Math.abs(roce) < 1) roce *= 100;
  let roe = screener.returnOnEquity || snap?.quote?.roe || 0;
  if (Math.abs(roe) > 0 && Math.abs(roe) < 1) roe *= 100;
  const peRatio = screener.peRatio || snap?.quote?.pe || 0;
  const netDte = screener.netDebtToEquity || (snap?.quote?.debtToEquity / 100) || 0;
  const promoterHolding = Number(sh.promoter) || audit?.metrics?.promoter || 0;
  const publicHolding = Number(sh.public) || Math.max(0, 100 - promoterHolding - Number(sh.fii || 0) - Number(sh.dii || 0));
  const pledgePct = Number(sh.pledged) || audit?.metrics?.pledged || 0;

  const strategiesRun: Record<string, any> = {};
  for (const s of strategies) {
    try {
      const result = await runStrategyAnalysis(s.id, snap, marketCap, 'Elite Basket');
      if (result) strategiesRun[s.id] = result;
    } catch {}
  }

  const technicalDesc = buildTechnicalDescription(price, dropFromHigh, low52, high52, strategiesRun, quotes);

  const dataPayload = {
    symbol,
    price,
    sector,
    marketCap,
    mcapCategory,
    dropFromHigh: Math.round(dropFromHigh * 100) / 100,
    thresholds,
    isBank,
    fundamentals: {
      netProfit: Math.round(netProfit * 100) / 100,
      roce: Math.round(roce * 100) / 100,
      roe: Math.round(roe * 100) / 100,
      peRatio: Math.round(peRatio * 100) / 100,
      pe5YMedian: screener.peMedians?.pe5Y || 0,
      netDebtToEquity: Math.round(netDte * 100) / 100,
      promoterHolding: Math.round(promoterHolding * 100) / 100,
      publicHolding: Math.round(publicHolding * 100) / 100,
      pledgePct: Math.round(pledgePct * 100) / 100,
      isProfitPositive: netProfit > 0,
      netProfitCr: netProfit > 0,
    },
    technical: technicalDesc,
  };

  const fallback = buildFallbackResponse(dataPayload);

  // Always start with deterministic fundamental scorecard (accurate, not random)
  // Use Gemini AI only for the textual description enhancement if available
  if (GEMINI_API_KEY) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: HJ_SYSTEM_PROMPT }] },
            contents: [{
              parts: [{
                text: `Analyze the following stock for Hemant Jain Swing Trading strategy alignment:\n\n${JSON.stringify(dataPayload, null, 2)}\n\nRespond with the JSON output format specified in your instructions.`
              }]
            }],
            generationConfig: {
              temperature: 0,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      const result: any = await response.json();
      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiResult = JSON.parse(jsonMatch[0]);
        // Merge: keep deterministic fundamentalScorecard, use AI for text fields only
        return {
          ...fallback,
          technicalAlignment: aiResult.technicalAlignment || fallback.technicalAlignment,
          executionPlan: aiResult.executionPlan || fallback.executionPlan,
          finalStatus: fallback.finalStatus, // Always use deterministic status
          reason: aiResult.reason || fallback.reason,
        };
      }
    } catch (err: any) {
      console.error('Gemini API error (non-blocking):', err.message);
    }
  }

  return fallback;
}

function buildTechnicalDescription(
  price: number, dropFromHigh: number, low52: number, high52: number,
  strategiesRun: Record<string, any>, quotes: any[]
): string {
  const parts: string[] = [];

  if (dropFromHigh >= 15) parts.push(`Price is ${dropFromHigh.toFixed(0)}% below 52-week high`);
  if (price <= low52 * 1.05) parts.push('Trading at/near 52-week low');

  for (const [id, result] of Object.entries(strategiesRun)) {
    if (result.isBuyZone) {
      parts.push(`${id} strategy triggered — buy zone active`);
    }
  }

  if (price > 0) {
    const sma20 = quotes?.slice(-20)?.reduce((a: number, q: any) => a + q.close, 0) / 20 || 0;
    const sma50 = quotes?.slice(-60)?.slice(-50)?.reduce((a: number, q: any) => a + q.close, 0) / 50 || 0;
    const sma200 = quotes?.reduce((a: number, q: any) => a + q.close, 0) / (quotes?.length || 1) || 0;
    if (price < sma20 && price < sma50 && price < sma200) {
      parts.push('Trading below all key SMAs (20, 50, 200) — dead crossover signal');
    }
  }

  return parts.length > 0 ? parts.join('. ') : 'No clear technical trigger identified';
}

function buildFallbackResponse(data: any): any {
  const netProfitPass = data.fundamentals.netProfit > 200;
  const rocePass = data.fundamentals.isBank || data.fundamentals.roce > 12;
  const roePass = data.fundamentals.isBank ? data.fundamentals.roe > 12 : true;
  const pePass = data.fundamentals.peRatio > 0 && data.fundamentals.peRatio < 70;
  const dtePass = data.fundamentals.isBank || data.fundamentals.netDebtToEquity < 0.2;
  const publicPass = data.fundamentals.publicHolding < 35;
  const pledgePass = data.fundamentals.pledgePct < 5;

  const hasTechnicalTrigger = data.technical && data.technical.length > 0;
  const allFundamentalPass = netProfitPass && rocePass && roePass && pePass && dtePass && publicPass && pledgePass;

  return {
    disclaimer: 'I am an educational AI assistant, not a SEBI-registered financial advisor. This is a strategy alignment analysis, not a buy/sell tip.',
    fundamentalScorecard: {
      netProfit: { value: `₹${data.fundamentals.netProfit} Cr.`, pass: netProfitPass },
      roce: { value: data.fundamentals.isBank ? 'N/A (Bank/NBFC)' : `${data.fundamentals.roce}%`, pass: rocePass },
      roe: { value: !data.fundamentals.isBank ? 'N/A' : `${data.fundamentals.roe}%`, pass: roePass },
      peRatio: { value: data.fundamentals.peRatio.toFixed(2), pass: pePass },
      netDebtToEquity: { value: data.fundamentals.netDebtToEquity.toFixed(2), pass: dtePass },
      publicHolding: { value: `${data.fundamentals.publicHolding}%`, pass: publicPass },
      pledging: { value: `${data.fundamentals.pledgePct}%`, pass: pledgePass },
    },
    technicalAlignment: data.technical || 'No clear technical setup identified',
    executionPlan: hasTechnicalTrigger && allFundamentalPass
      ? `${data.mcapCategory} — ABCD gaps at ${data.thresholds.abcdGaps}% each. Exit target: 25-30% from entry. Use LIFO selling.`
      : null,
    finalStatus: hasTechnicalTrigger && allFundamentalPass ? 'PASSES STRATEGY' : 'FAILS STRATEGY',
    reason: !allFundamentalPass
      ? 'Fundamental filters not met'
      : hasTechnicalTrigger
        ? 'Strategy alignment confirmed on fundamentals + technical triggers'
        : 'No active technical entry trigger currently',
  };
}

export async function chatWithAI(userMessage: string, history: { role: string; content: string }[] = []): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'AI Assistant is not configured. Please add GEMINI_API_KEY to the server environment.';
  }

  const contents = history.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: HJ_SYSTEM_PROMPT + '\n\nIMPORTANT: Respond in natural language (not JSON) for free-form chat. Always include the SEBI disclaimer. Never give buy/sell advice.'
            }]
          },
          contents,
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    const result: any = await response.json();
    return result?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
  } catch (err: any) {
    console.error('Gemini chat error:', err.message);
    return 'Sorry, the AI service is currently unavailable. Please try again later.';
  }
}
