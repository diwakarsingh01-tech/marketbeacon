export interface FundaInfoEntry {
  label: string;
  what: string;
  why: string;
  how: string;
}

export const FUNDA_INFO_MAP: Record<string, FundaInfoEntry> = {
  marketCap: {
    label: 'Market Capitalization',
    what: 'Total market value of a company\'s outstanding shares. Calculated as: Share Price × Total Outstanding Shares.',
    why: 'Determines company size classification (Large/Mid/Small cap) and portfolio allocation limits. Large caps get up to 5% of portfolio, mid caps 3%, small caps 2%.',
    how: 'Market Cap = Current Share Price × Total Number of Outstanding Shares. Updated daily based on closing price.'
  },
  roe: {
    label: 'Return on Equity (ROE)',
    what: 'Measures how efficiently a company generates profit from shareholders\' equity. A key profitability metric.',
    why: 'High ROE (≥15%) indicates strong management efficiency and competitive advantage. Consistent high ROE over years signals quality business.',
    how: 'ROE = (Net Income / Shareholders\' Equity) × 100. Calculated from annual financial statements. Trailing 12-month values are preferred.'
  },
  roce: {
    label: 'Return on Capital Employed (ROCE)',
    what: 'Measures how efficiently a company generates profits from its total capital (equity + debt).',
    why: 'ROCE evaluates overall capital efficiency including debt. Minimum threshold: 15% for non-financial stocks. Banking/NBFC have different benchmarks.',
    how: 'ROCE = (EBIT / Capital Employed) × 100. Capital Employed = Total Assets - Current Liabilities. Uses annual financial data.'
  },
  debtToEquity: {
    label: 'Debt-to-Equity (D/E)',
    what: 'Ratio comparing a company\'s total liabilities to shareholders\' equity. Measures financial leverage.',
    why: 'Lower D/E means less debt risk. D/E > 0.5 triggers hard rejection. Score degrades above 0.2 (ideal). Banking/NBFC have relaxed thresholds (ideal 1.6, reject >4.0).',
    how: 'D/E = Total Liabilities / Shareholders\' Equity. Uses latest annual balance sheet data. Net D/E (after subtracting cash) is preferred.'
  },
  promoterPledge: {
    label: 'Promoter Pledge',
    what: 'Percentage of promoter-held shares that are pledged as collateral against loans.',
    why: 'High promoter pledge (>5%) is a red flag — it signals financial distress at the promoter level. Low or zero pledge shows promoter confidence.',
    how: 'Promoter Pledge % = (Pledged Promoter Shares / Total Promoter Holding) × 100. Data from stock exchange filings (BSE/NSE).'
  },
  smartMoney: {
    label: 'Smart Money Total',
    what: 'Combined holding of FII (Foreign Institutional Investors) + DII (Domestic Institutional Investors) + Promoters.',
    why: 'Combined institutional + promoter holding should exceed 70%. High aggregate indicates strong conviction from informed market participants. Low public float is preferred.',
    how: 'Smart Money % = FII % + DII % + Promoter %. Fetched from quarterly shareholding pattern filings submitted to stock exchanges.'
  },
  fiiDii: {
    label: 'FII / DII Holdings',
    what: 'Percentage of company shares held by Foreign and Domestic Institutional Investors.',
    why: 'Rising institutional holding signals professional investor confidence. Combined FII+DII+Promoter > 70% is our baseline filter.',
    how: 'FII/DII % = (Shares held by institutions / Total Shares) × 100. Reported quarterly via shareholding pattern data from exchanges.'
  },
  promoterHolding: {
    label: 'Promoter Holding',
    what: 'Percentage of total shares held by the company\'s founders/promoter group.',
    why: 'High promoter holding (ideally > 50%) shows promoters have skin in the game. Sudden reduction in promoter holding is a warning sign.',
    how: 'Promoter Holding % = (Promoter Shares / Total Shares) × 100. Updated quarterly from exchange filings.'
  },
  peRatio: {
    label: 'P/E Ratio (Price-to-Earnings)',
    what: 'Current share price divided by trailing 12-month earnings per share (EPS). Shows how much investors pay per rupee of profit.',
    why: 'Compared against historical median PE (3Y/5Y) to assess valuation. We prefer current PE ≤ median PE for undervaluation. Overvalued stocks (PE > median) are rejected.',
    how: 'PE = Current Price / TTM EPS. TTM EPS = Sum of last 4 quarters\' diluted EPS. Median PE computed from daily PE values over 3-year and 5-year lookback windows.'
  },
  peMedian: {
    label: 'Median PE (3Y / 5Y)',
    what: 'Mid-point of the P/E ratio range over the past 3 and 5 years. A valuation benchmark.',
    why: 'If current PE is below this median, the stock may be undervalued. If above, it may be overvalued. Our rule: current PE must be ≤ both 3Y and 5Y median PE.',
    how: 'Median PE = Sort all daily PE values in the period, pick the middle value. PE = Price / TTM EPS for each day. Requires 3+ years of price and EPS data.'
  },
  salesAth: {
    label: 'Sales vs All-Time High',
    what: 'Compares current trailing 12-month (TTM) sales revenue to the highest ever annual sales.',
    why: 'For the 67% multibagger strategy, current sales must be at or near ATH (within ±5%). This ensures the company\'s core business is healthy despite the stock price fall.',
    how: 'Sales ATH % = (TTM Sales / Historical Highest Annual Sales) × 100. Uses quarterly revenue data summed over trailing 12 months.'
  },
  profitAth: {
    label: 'Net Profit vs All-Time High',
    what: 'Compares current trailing 12-month (TTM) net profit to the highest ever annual net profit.',
    why: 'Alongside sales ATH, net profit near ATH confirms business fundamentals are intact. Both must hold for the 67% strategy to qualify.',
    how: 'Profit ATH % = (TTM Net Profit / Historical Highest Annual Net Profit) × 100. Uses quarterly profit data summed over trailing 12 months.'
  },
  auditScore: {
    label: 'Fundamental Audit Score',
    what: 'Composite score (0–100) evaluating overall business quality across profitability, safety, growth, and valuation.',
    why: 'Higher score = lower fundamental risk. Uses sector-adjusted weightage. Stocks below certain thresholds are excluded from institutional-grade strategies.',
    how: 'Audit Score = Weighted sum of segment scores (Profitability, Safety, Growth, Valuation). Each segment has multiple checks (D/E, ROCE, ROE, PE, promoter pledge, etc.) scored pass/fail with graduated penalties.'
  },
  profitabilityQuality: {
    label: 'Profitability',
    what: 'Assesses the company\'s earnings strength through ROE, ROCE, and profit margin consistency.',
    why: 'Strong profitability is the foundation of long-term wealth creation. Companies with consistent high ROE/ROCE compound capital effectively.',
    how: 'Score based on ROE (≥15%), ROCE (≥15%), and trend consistency over 3-5 years. Each check contributes to the segment score out of its maximum.'
  },
  balanceSheetSafety: {
    label: 'Safety (Balance Sheet)',
    what: 'Evaluates financial health through debt levels, promoter pledge, and liquidity ratios.',
    why: 'A weak balance sheet can bankrupt a good business. Low debt and clean promoter pledge are non-negotiable for our framework.',
    how: 'Score based on D/E ratio (graduated 0.2 ideal to 0.5 hard reject), promoter pledge (≤5%), current ratio, and interest coverage ratio.'
  },
  growthQuality: {
    label: 'Growth',
    what: 'Measures revenue and profit growth trends over 3-5 years, including TTM comparison to ATH.',
    why: 'Growing revenue and profit confirm the business is expanding. Stagnant or declining trends, even with strong ratios, suggest structural issues.',
    how: 'Score based on revenue CAGR, profit CAGR, TTM vs ATH proximity, and trend consistency. Penalizes declining trends.'
  },
  valuationScore: {
    label: 'Valuation',
    what: 'Assesses whether the stock is fairly valued, undervalued, or overvalued relative to its own history.',
    why: 'Buying at fair or undervalued levels improves margin of safety. Overpaying, even for a good business, leads to subpar returns.',
    how: 'Score based on current PE vs 3Y median PE, current PE vs 5Y median PE, and PE percentile vs historical range.'
  },
  fiiDiiCombined: {
    label: 'FII + DII Combined',
    what: 'Total shares held by both foreign and domestic institutional investors as a percentage.',
    why: 'High institutional holding signals professional validation. Institutions perform deep research before investing — their presence reduces information asymmetry risk.',
    how: 'FII+DII % = FII % + DII %. Sourced from quarterly shareholding pattern. Track trend over 4-8 quarters to see accumulation or distribution.'
  },
  fiftyTwoWeekHigh: {
    label: '52-Week High',
    what: 'The highest price at which the stock has traded in the last 52 weeks.',
    why: 'Used as a technical reference for proximity analysis and breakout/breakdown identification. Also used in 52W high/low strategy.',
    how: '52W High = Maximum closing price over the last 252 trading days. Updated daily.'
  },
  beta: {
    label: 'Beta',
    what: 'A measure of a stock\'s volatility relative to the overall market (Nifty 50).',
    why: 'Beta > 1 means the stock is more volatile than the market. Beta < 1 means lower volatility. Used for portfolio risk assessment.',
    how: 'Beta = Covariance(Stock Returns, Market Returns) / Variance(Market Returns). Calculated from daily returns over the last 1-3 years.'
  },
  athPrice: {
    label: 'All-Time High Price',
    what: 'The highest price the stock has ever reached since listing.',
    why: 'Critical for the 67% strategy — we need stocks that have fallen ≥67% from ATH. Also indicates potential resistance level.',
    how: 'ATH = Maximum closing price over the entire available trading history of the stock.'
  },
  pegRatio: {
    label: 'PEG Ratio (PE / Growth)',
    what: 'Price-to-Earnings ratio divided by the earnings growth rate. Combines valuation with growth.',
    why: 'PEG < 1 suggests the stock is undervalued relative to its growth rate. PEG > 2 suggests overvaluation. Used alongside PE median for a fuller valuation picture.',
    how: 'PEG = PE Ratio / (EPS CAGR × 100). CAGR is calculated from 3-year or 5-year profit growth. Both PE and CAGR must be positive for a meaningful PEG.'
  },
  evEbitda: {
    label: 'EV / EBITDA',
    what: 'Enterprise Value divided by Earnings Before Interest, Tax, Depreciation & Amortization.',
    why: 'A preferred valuation metric for comparing companies with different debt levels. Lower EV/EBITDA often indicates better value. Particularly useful for capital-intensive sectors.',
    how: 'EV = Market Cap + Total Debt - Cash & Equivalents. EBITDA = Operating Profit + Depreciation + Amortization. Sourced from latest annual financial data.'
  }
};
