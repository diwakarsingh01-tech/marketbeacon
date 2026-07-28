import React from 'react';
import { DocPage, DocCallout, DocCodeBlock, DocTable } from '../../components/docs/DocPage';

export const RiskManagementPage: React.FC = () => {
  const toc = [
    { id: 'overview', title: 'Overview', level: 2 },
    { id: '50-30-20', title: 'The 50:30:20 Allocation Rule', level: 2 },
    { id: 'portfolio-size', title: 'Portfolio Size: 40–60 Stocks', level: 2 },
    { id: 'sector-cap', title: 'Sector Cap: No Sector > 20%', level: 2 },
    { id: 'tranche-sizing', title: 'Tranche Position Sizing', level: 2 },
    { id: 'invalidation', title: 'Invalidation & Stop Loss', level: 2 },
  ];

  return (
    <DocPage
      title="Risk Management & Portfolio Allocation"
      description="Protect capital first. The 50:30:20 rule, position sizing, sector caps, tranche sizing, and invalidation points — the complete risk framework."
      slug="risk-management"
      toc={toc}
      lastUpdated="Jul 2026"
      prevPage={{ title: 'Core Selection Rules', href: '/docs/core-selection-rules' }}
      nextPage={{ title: 'Understanding Baskets', href: '/docs/baskets' }}
      editUrl="https://github.com/marketbeacon/docs/edit/main/pages/risk-management.mdx"
    >
      <section id="overview" className="mb-10">
        <h2>Overview</h2>
        <p className="lead">
          The goal is not to maximize returns — it is to <strong>maximize risk-adjusted returns</strong>. 
          Capital preservation always comes first.
        </p>
        <DocCallout type="note">
          "If you can survive a 30% portfolio drawdown without panic, your risk management is correct. 
          If not, reduce position sizes."
        </DocCallout>
      </section>

      <section id="50-30-20" className="mb-10">
        <h2>The 50:30:20 Allocation Rule</h2>
        <DocTable
          headers={['Tier', 'Allocation', 'Max Per Stock', 'Stock Count']}
          rows={[
            ['Large Cap', '50%', '5%', '~20 stocks'],
            ['Mid Cap', '30%', '3%', '~12 stocks'],
            ['Small Cap', '20%', '2%', '~8 stocks'],
          ]}
          caption="Alpha-40 targets: 20 Large + 12 Mid + 8 Small = 40 stocks"
        />
        <DocCodeBlock
          filename="allocation.ts"
          language="typescript"
          code={`// Example: ₹1 Crore capital
const capital = 1_00_00_000;

const largeCap = capital * 0.50;  // ₹50L → 20 stocks × ₹2.5L each
const midCap = capital * 0.30;    // ₹30L → 12 stocks × ₹2.5L each
const smallCap = capital * 0.20;  // ₹20L → 8 stocks × ₹2.5L each

// Each position = 2.5% of capital (within limits for all tiers)`}
        />
      </section>

      <section id="portfolio-size" className="mb-10">
        <h2>Portfolio Size: 40–60 Stocks</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Below 40:</strong> Under-diversified — a single failure hurts too much</li>
          <li><strong>Above 60:</strong> Over-diversified — winners don't move the needle</li>
          <li><strong>Alpha-40 target:</strong> Exactly 40 stocks — optimal balance</li>
        </ul>
      </section>

      <section id="sector-cap" className="mb-10">
        <h2>Sector Cap: No Sector {'>'} 20%</h2>
        <p>Maximum <strong>8 stocks per sector</strong> (in a 40-stock portfolio, 8 stocks = 20%). 
        This prevents sector concentration risk.</p>
        <DocCallout type="note">
          If a sector has too many qualifying stocks, only the strongest 8 are selected 
          based on signal strength and entry timing.
        </DocCallout>
      </section>

      <section id="tranche-sizing" className="mb-10">
        <h2>Tranche Position Sizing</h2>
        <p>You don't go all-in at once. Each ABCD tranche gets 25% of the intended position size.</p>
        <DocCodeBlock
          filename="tranche-sizing.ts"
          language="typescript"
          code={`// Stock: ₹100 | Allocation: 5% of ₹1 Cr = ₹5L total position
// ABCD tranches: 25% each = ₹1.25L per tranche

A = ₹1.25L at ₹100  → 1,250 shares
B = ₹1.25L at ₹90   → 1,388 shares  
C = ₹1.25L at ₹81   → 1,543 shares
D = ₹1.25L at ₹72.9 → 1,714 shares

// Total: 5,895 shares @ blended avg ₹84.80`}
/>
      </section>

      <section id="invalidation" className="mb-10">
        <h2>Invalidation & Stop Loss</h2>
        <p>Every strategy has an invalidation point — a price level where the thesis breaks.</p>
        <DocTable
          headers={['Strategy', 'Invalidation Point', 'Action']}
          rows={[
            ['ABCD (General)', 'Price drops below D and keeps falling', 'Do not add E tranche. Close position.'],
            ['Bollinger', 'Close >1% below lower band for 3+ sessions', 'Exit — trend stronger than statistical pull.'],
            ['Envelope Long', 'Close 3% below lower envelope', 'Exit — institutional buyers gone.'],
            ['SMA+BCD', 'Close 3% below 200 DMA (D-level)', 'Bearish trend accelerating — exit.'],
            ['52W High/Low', 'New 52W low every month for 3+ months', 'Structural downtrend — exit.'],
            ['S&R', 'Close >3% below support zone', 'Support broken → becomes resistance. Exit.'],
            ['67% Reset', 'Fundamental deterioration (sales ↓>20%, loss)', 'Exit regardless of price.'],
            ['20% Velocity', 'Close >8% below Rally Start Low', 'Retest failed — exit fully.'],
          ]}
        />
        <DocCallout type="danger" title="Never Add a 5th Tranche">
          If price drops below D and keeps falling, the strategy is invalidated. 
          Do not add a 5th tranche. Close the position and accept the loss. 
          Small losses are the cost of doing business.
        </DocCallout>
      </section>
    </DocPage>
  );
};

export default RiskManagementPage;