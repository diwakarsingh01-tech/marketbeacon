import React from 'react';
import { DocPage, DocCallout, DocCodeBlock, DocTable } from '../../components/docs/DocPage';

export const CoreSelectionRulesPage: React.FC = () => {
  const toc = [
    { id: 'overview', title: 'Overview', level: 2 },
    { id: 'market-cap', title: 'Market Cap Classification', level: 2 },
    { id: 'fundamental-audit', title: 'Fundamental Audit (60/100)', level: 2 },
    { id: 'smart-money', title: 'Smart Money Rule (>50%)', level: 2 },
    { id: 'de-thresholds', title: 'D/E Hard Rejection Thresholds', level: 2 },
    { id: 'sector-limits', title: 'Sector & Concentration Limits', level: 2 },
  ];

  return (
    <DocPage
      title="Core Selection Rules"
      description="Universal institutional filters that every stock must pass before any strategy applies. The minimum standard for capital preservation."
      slug="core-selection-rules"
      toc={toc}
      lastUpdated="Jul 2026"
      prevPage={{ title: 'ABCD Framework', href: '/docs/abc-framework' }}
      nextPage={{ title: 'Risk Management', href: '/docs/risk-management' }}
      editUrl="https://github.com/marketbeacon/docs/edit/main/pages/core-selection-rules.mdx"
    >
      <section id="overview" className="mb-10">
        <h2>Overview</h2>
        <p className="lead">
          The Core Selection Rules are <strong>hard gates</strong> — not suggestions. 
          Every stock must clear these filters before any strategy (Bollinger, Envelope, SMA+BCD, etc.) 
          is even considered. This is the institutional "minimum standard."
        </p>
        <DocCallout type="warning" title="Non-Negotiable">
          A stock that fails these filters might still go up — but if it does, 
          it's speculation, not investing. Know the difference.
        </DocCallout>
      </section>

      <section id="market-cap" className="mb-10">
        <h2>Market Cap Classification</h2>
        <p>Size determines behavior. The platform automatically classifies every stock:</p>
        <DocTable
          headers={['Tier', 'Market Cap', 'Characteristics', 'Portfolio Weight']}
          rows={[
            ['Large Cap', '≥ ₹45,000 Cr', 'Stable, institutional-heavy, lower volatility', '50% (max 5%/stock)'],
            ['Mid Cap', '≥ ₹15,000 Cr', 'Growth-phase, moderate volatility', '30% (max 3%/stock)'],
            ['Small Cap', '< ₹15,000 Cr', 'High-risk, high-reward', '20% (max 2%/stock)'],
          ]}
          caption="50:30:20 allocation rule by market cap"
        />
      </section>

      <section id="fundamental-audit" className="mb-10">
        <h2>Fundamental Audit — Minimum 60/100</h2>
        <p>The audit score is a composite of 15+ fundamental checks. Key components:</p>
        <DocTable
          headers={['Metric', 'Threshold', 'Sector Exceptions']}
          rows={[
            ['D/E Ratio', '≤ 0.5', 'Capital-intensive: ≤ 1.5 | Banks/NBFC: ≤ 7.0'],
            ['Promoter Pledge', '≤ 5%', 'None'],
            ['ROE', '≥ 15%', 'None'],
            ['ROCE', '≥ 15%', 'None'],
            ['PE vs History', '≤ Median (3Y & 5Y)', 'None'],
            ['Sales Trend', 'Near All-Time High', 'None'],
            ['Profit Trend', 'Near All-Time High', 'None'],
          ]}
          caption="Fundamental audit checklist"
        />
        <DocCallout type="tip" title="Audit Score Breakdown">
          The Matrix Screener shows the complete audit score breakdown for every stock. 
          Click any score to see which checks passed/failed.
        </DocCallout>
      </section>

      <section id="smart-money" className="mb-10">
        <h2>Smart Money Rule — Institutional + Promoter {'>'} 50%</h2>
        <p>
          Combined <strong>FII + DII + Promoter holding must exceed 50%</strong> (hard rejection threshold). 
          Ideally this should be <strong>{'>'}70%</strong> for strong institutional conviction. 
          Low public float is preferred.
        </p>
        <DocCodeBlock
          filename="smart-money-check.ts"
          language="typescript"
          code={`// Hard rejection logic
function checkSmartMoney(fii: number, dii: number, promoter: number): boolean {
  const smartMoney = fii + dii + promoter;
  
  if (smartMoney < 50) return false; // HARD REJECT
  if (smartMoney >= 70) return true; // IDEAL
  return true; // PASS (50-70% range)
}`}
/>
      </section>

      <section id="de-thresholds" className="mb-10">
        <h2>D/E Hard Rejection Thresholds</h2>
        <p>Debt is a deal-breaker. The system automatically detects sector and applies correct threshold:</p>
        <DocTable
          headers={['Sector Category', 'D/E Reject Threshold', 'Ideal Range', 'Degradation']}
          rows={[
            ['General Companies', '> 0.5', '0.0 – 0.2', 'Gradual from 0.2 to 0.5'],
            ['Capital-Intensive', '> 1.5', '0.0 – 0.5', 'Auto, Power, Infra, Steel, Realty, Telecom, Aviation'],
            ['Banking / NBFC / Financials', '> 7.0', '0.0 – 3.0', 'Regulated leverage allowed'],
          ]}
        />
      </section>

      <section id="sector-limits" className="mb-10">
        <h2>Sector & Concentration Limits</h2>
        <DocTable
          headers={['Limit', 'Value', 'Enforcement']}
          rows={[
            ['Single Sector Max', '20% of portfolio', 'Alpha Hub max 8 stocks/sector (40-stock portfolio)'],
            ['Single Stock Max (Large)', '5% of capital', 'Position sizing engine'],
            ['Single Stock Max (Mid)', '3% of capital', 'Position sizing engine'],
            ['Single Stock Max (Small)', '2% of capital', 'Position sizing engine'],
            ['Portfolio Size', '40–60 stocks', 'Alpha-40 targets exactly 40'],
          ]}
        />
      </section>
    </DocPage>
  );
};

export default CoreSelectionRulesPage;