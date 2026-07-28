const mktData = $input.first().json;
const results = mktData.results || [];

const nifty = results.find(r => r.name === 'NIFTY 50') || {};
const bankNifty = results.find(r => r.name === 'BANK NIFTY') || {};
const sensex = results.find(r => r.name === 'SENSEX') || {};

const fmt = (p) => p ? Number(p).toLocaleString('en-IN', {maximumFractionDigits: 2}) : 'N/A';
const fmtChg = (c) => c !== undefined ? (c >= 0 ? '+' : '') + Number(c).toFixed(2) + '%' : 'N/A';

const niftyPrice = fmt(nifty.price);
const niftyChange = fmtChg(nifty.change);
const bankNiftyPrice = fmt(bankNifty.price);
const bankNiftyChange = fmtChg(bankNifty.change);
const sensexPrice = fmt(sensex.price);
const marketStatus = mktData.status || 'CLOSED';

// Unique daily seed — prevents duplicate topics week over week
const now = new Date();
const startOfYear = new Date(now.getFullYear(), 0, 1);
const weekNum = Math.floor((now - startOfYear) / (7 * 24 * 60 * 60 * 1000));
const day = now.getDay();
const uniqueSeed = weekNum * 10 + day;

const sectors = ['Banking & Finance', 'IT Services', 'Auto & EV', 'Energy & Oil', 'FMCG & Consumer', 'Pharma & Healthcare', 'Realty & Infrastructure', 'Metals & Mining', 'Telecom', 'Defence & Aerospace'];
const featuredStocks = ['HDFCBANK', 'ICICIBANK', 'TCS', 'INFY', 'RELIANCE', 'NTPC', 'HEROMOTOCO', 'TATAMOTORS', 'SUNPHARMA', 'MARUTI', 'WIPRO', 'ADANIPORTS', 'LT', 'BAJFINANCE', 'ZOMATO'];

const sector = sectors[uniqueSeed % sectors.length];
const stock = featuredStocks[uniqueSeed % featuredStocks.length];

const marketSummary = `Market Snapshot (${marketStatus}):\nNIFTY 50: ${niftyPrice} (${niftyChange})\nBANK NIFTY: ${bankNiftyPrice} (${bankNiftyChange})\nSENSEX: ${sensexPrice}`;

const cta = `Want data-backed market insights? Visit marketbeaconpro.com and use code ALPHA7 for 7 days free access. Track 40+ stocks across multiple sectors with 10+ strategies in one dashboard.`;
const hashtags = '#MarketBeacon #StockMarketIndia #NSE #BSE #Nifty50 #Trading #InvestmentResearch #SwingTrading #IndianStocks #MarketAnalysis';
const disclaimer = 'Disclaimer: This is for educational and informational purposes only. Not investment advice. Not a recommendation to buy, sell, or hold any security. Please consult a SEBI-registered investment advisor before making any investment decisions.';

const style = `STYLE: 200-250 words. Short paragraphs. Use emojis naturally. Start with a strong hook. Mention smart money and operators. Sound human, not corporate. Plain text only. No asterisks. No markdown formatting.`;

let prompt;

if (day === 1) {
  // MONDAY: Engagement Poll post — lettered choices drive comments = 3-5x reach boost
  const pollSets = [
    { a: 'Banking & Finance', b: 'IT Services', c: 'Auto & EV', d: 'Energy & Oil' },
    { a: 'Pharma & Healthcare', b: 'FMCG & Consumer', c: 'Metals & Mining', d: 'Realty' },
    { a: 'Defence & Aerospace', b: 'Telecom', c: 'PSU Banks', d: 'Chemicals' },
  ];
  const poll = pollSets[weekNum % pollSets.length];
  prompt = `${style}

Write a LinkedIn post titled: "Weekly Market Outlook + Quick Poll for Traders!"

USE THESE EXACT PRICES (do not change them):
${marketSummary}

Structure:
1. Strong hook about NIFTY at ${niftyPrice} opening the week
2. Brief BANK NIFTY momentum check at ${bankNiftyPrice}
3. Then write: "Quick question for the traders here — which sector do you think has the most smart money accumulation happening RIGHT NOW?"
4. List these options EXACTLY as shown (do not change letters or names):
A) ${poll.a}
B) ${poll.b}
C) ${poll.c}
D) ${poll.d}
5. Write: "Drop your vote in the comments. I will share what MarketBeacon's data shows by Friday."
6. 2-3 line insight about why sector rotation matters this week

End with:
${cta}
${disclaimer}

Hashtags: #WeeklyOutlook #NiftyAnalysis #BankNifty #SectorRotation #Poll ${hashtags}`;

} else if (day === 2) {
  prompt = `${style}\n\nWrite a LinkedIn post titled: "Sector Spotlight: ${sector}"\n\nMarket context:\n${marketSummary}\n\nCover:\n1. Why ${sector} is catching smart money attention this week\n2. Top stocks showing institutional accumulation patterns\n3. Key metrics making this sector interesting\n4. Price action levels to watch\n\nEnd with:\n${cta}\n${disclaimer}\n\nHashtags: #SectorSpotlight #${sector.replace(/[^a-zA-Z0-9]/g, '')} #SectorRotation ${hashtags}`;

} else if (day === 3) {
  prompt = `${style}\n\nWrite a LinkedIn post titled: "Stock in Focus: ${stock}"\n\nMarket context:\n${marketSummary}\n\nCover:\n1. Why ${stock} is on radar with NIFTY at ${niftyPrice}\n2. Fundamental check - ROCE, Debt-to-Equity, promoter holding\n3. FII and DII smart money signals\n4. Technical setup - breakout, retest, or consolidation\n\nEnd with:\n${cta}\n${disclaimer}\n\nHashtags: #${stock} #StockInFocus #StockAnalysis ${hashtags}`;

} else if (day === 4) {
  // THURSDAY: Hot Take / Contrarian post — highest engagement format
  const hotTakes = [
    `"Stop watching Nifty every 5 minutes. Here's what actually moves your returns."`,
    `"Most retail traders check the wrong indicator. Here's what smart money actually watches."`,
    `"NIFTY at ${niftyPrice}. Operators WANT you to panic right now. Here's the proof."`,
    `"The biggest mistake traders make when a stock falls 10%. Data shows what to do instead."`,
    `"I checked 40 stocks this morning. Only 3 passed the institutional quality filter. Here's why that matters."`,
  ];
  const hotTake = hotTakes[uniqueSeed % hotTakes.length];
  prompt = `${style}

Write a LinkedIn post that starts with this EXACT hook as the very first line:
${hotTake}

Market context:
${marketSummary}

Structure:
1. Use the hook as the opener - do not change it
2. Challenge conventional retail trader thinking with data
3. Show what MarketBeacon's Institutional Audit Score reveals vs what emotions say
4. Give one counterintuitive lesson traders can apply immediately this week
5. Use rhetorical questions to keep the reader engaged

Make this feel like a senior trader challenging the reader's assumptions. Confident, direct, mentor tone.

End with:
${cta}
${disclaimer}

Hashtags: #TradingPsychology #SmartMoney #OperatorMindset #NiftyTrader ${hashtags}`;

} else if (day === 5) {
  prompt = `${style}\n\nWrite a LinkedIn post titled: "Weekly Market Wrap: Key Takeaways for Traders"\n\nThis week closing data:\n${marketSummary}\n\nCover:\n1. NIFTY closed at ${niftyPrice} - was it a bullish or bearish week\n2. BANK NIFTY at ${bankNiftyPrice} - what the price action signals\n3. Best and worst sectors - where did smart money flow\n4. ${stock} weekly operator signals\n5. What to watch for next week\n\nEnd with:\n${cta}\n${disclaimer}\n\nHashtags: #WeeklyWrap #MarketRecap #NiftyWrap ${hashtags}`;

} else if (day === 6) {
  prompt = `${style}\n\nWrite a LinkedIn post titled: "Behind MarketBeacon: Building a Better Stock Dashboard"\n\nMarkets are closed today. ${marketSummary}\n\nCover:\n1. The problem: checking 20+ stocks manually every morning\n2. The solution: one dashboard for 40+ stocks, 10+ strategies, live indices\n3. Features: institutional audit scoring, sector rotation signals, real-time NIFTY tracking\n4. Built by traders for traders - 15 minutes a day, data-backed decisions\n\nEnd with:\n${cta}\n${disclaimer}\n\nHashtags: #MarketBeacon #BuiltByTraders #TradingTools #Fintech ${hashtags}`;

} else {
  // SUNDAY: Weekend Quiz format — shareable, drives engagement
  const quizzes = [
    {
      q: 'Which metric do FIIs check FIRST before entering a stock?',
      opts: 'A) P/E Ratio\nB) ROCE\nC) Promoter Holding\nD) Volume spike',
      reveal: 'ROCE — institutions prioritize return on capital efficiency above all else.',
    },
    {
      q: 'If NIFTY drops 3% in one day, what do smart money operators typically do?',
      opts: 'A) Panic sell everything\nB) Wait and watch\nC) Quietly accumulate quality stocks\nD) Short the market',
      reveal: 'C — Corrections are institutional buying opportunities. Retail panics, operators accumulate.',
    },
    {
      q: 'What is the most reliable signal that institutions are quietly entering a stock?',
      opts: 'A) Stock near 52-week high\nB) Positive analyst ratings\nC) Rising volume + price consolidation\nD) Strong recent earnings',
      reveal: 'C — Volume rising while price holds flat = quiet institutional accumulation. Watch for this.',
    },
  ];
  const quiz = quizzes[uniqueSeed % quizzes.length];
  prompt = `${style}

Write a LinkedIn post structured as a Sunday market quiz.

Start with: "Sunday Market Quiz — Test your institutional thinking! Let's see who gets this right."

Market context this week:
${marketSummary}

Include this quiz EXACTLY as formatted below - do not change the question or options:

Question: ${quiz.q}

${quiz.opts}

Comment your answer — I will reveal the answer + the reasoning in the first comment.

Then write 3-4 lines about why understanding this concept helps traders outperform.

Add: "With NIFTY at ${niftyPrice} this week, traders who understand this have a serious edge going into Monday."

End with:
${cta}
${disclaimer}

Hashtags: #WeekendReflection #TradingQuiz #LearnToTrade #StockMarket ${hashtags}`;
}

return [{ json: { dayPrompt: prompt, sector, stock, niftyPrice, bankNiftyPrice, marketStatus, day, uniqueSeed } }];
