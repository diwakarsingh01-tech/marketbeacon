import React from 'react';
import { Link } from 'react-router-dom';
import { DocPage, DocCallout, DocCodeBlock, DocTable, DocTabs } from '../../components/docs/DocPage';

export const ABCFrameworkPage: React.FC = () => {
  const toc = [
    { id: 'what-is-abcd', title: 'What Is ABCD?', level: 2 },
    { id: 'the-10-percent-rule', title: 'The 10% Gap Rule', level: 2 },
    { id: 'tranche-allocation', title: 'Tranche Allocation', level: 2 },
    { id: 'laddered-targets', title: 'Laddered Profit Targets', level: 2 },
    { id: 'platform-integration', title: 'Platform Integration', level: 2 },
    { id: 'coach-note', title: "Coach's Note", level: 2 },
    { id: 'common-mistakes', title: 'Common Mistakes', level: 2 },
  ];

  return (
    <DocPage
      title="ABCD Averaging Framework"
      description="The mathematical backbone of every MarketBeacon strategy. Tranche-based position building with 10% gaps, laddered targets, and disciplined execution."
      slug="abc-framework"
      toc={toc}
      lastUpdated="Jul 2026"
      prevPage={{ title: 'Quick Start', href: '/docs/quickstart' }}
      nextPage={{ title: 'Core Selection Rules', href: '/docs/core-selection-rules' }}
      editUrl="https://github.com/marketbeacon/docs/edit/main/pages/abc-framework.mdx"
    >
      <section id="what-is-abcd" className="mb-10">
        <h2>What Is ABCD?</h2>
        <p className="lead">
          ABCD is not a technical pattern — it is an <strong>averaging framework</strong>. 
          You divide your intended position into 4 tranches (A, B, C, D) and deploy them 
          systematically as price moves in your favor.
        </p>

        <DocCallout type="info" title="Key Insight">
          <strong>Institutions never buy all at once.</strong> ABCD is how you build a position 
          across market volatility — systematically, without predicting the exact bottom.
        </DocCallout>

        <DocTable
          headers={['Tranche', 'Trigger', 'Capital %', 'Purpose']}
          rows={[
            ['A', 'Strategy entry signal (trigger price)', '25%', 'First commitment — validates the setup'],
            ['B', '~10% below A', '25%', 'First averaging — improves average'],
            ['C', '~10% below B', '25%', 'Second averaging — deepens position'],
            ['D', '~10% below C', '25%', 'Final tranche — completes position'],
          ]}
          caption="The four tranches at a glance"
        />
      </section>

      <section id="the-10-percent-rule" className="mb-10">
        <h2>The 10% Gap Rule</h2>
        <p>
          Each tranche is spaced approximately <strong>10% apart</strong> from the previous one. 
          The exact gap is calculated from the strategy's anchor price — usually the trigger level 
          or a key moving average.
        </p>

        <DocCodeBlock
          filename="abcd-calculation.ts"
          language="typescript"
          code={`// Example: Stock at ₹100, ABCD trigger = ₹100
const trigger = 100; // A level
const gap = 0.10;    // 10%

const A = trigger;              // ₹100.00
const B = A * (1 - gap);        // ₹90.00
const C = B * (1 - gap);        // ₹81.00
const D = C * (1 - gap);        // ₹72.90

// Blended average if all 4 execute:
// (100 + 90 + 81 + 72.9) / 4 = ₹85.98
// That's 14% below the first entry!`}
/>
        
        <DocCallout type="note" title="Strategy Variations">
          Some strategies modify the gap:
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>52W High/Low:</strong> 8% gap (tighter — 52W lows have concentrated support)</li>
            <li><strong>Envelope Short (Pullback):</strong> 5% gap (tighter — uptrend pullbacks are shallow)</li>
            <li><strong>67% Reset / 20% Velocity:</strong> 10% standard gap</li>
          </ul>
        </DocCallout>
      </section>

      <section id="tranche-allocation" className="mb-10">
        <h2>Tranche Allocation</h2>
        <p>
          Each tranche gets <strong>equal capital allocation</strong> by default (25% each). 
          This ensures no single tranche skews your average.
        </p>

        <DocCodeBlock
          filename="position-sizing.ts"
          language="typescript"
          code={`// Total position: ₹1,00,000
// Equal weight per tranche (25% each)

A = ₹25,000 at ₹100  → 250 shares
B = ₹25,000 at ₹90   → 277 shares  
C = ₹25,000 at ₹81   → 308 shares
D = ₹25,000 at ₹72.9 → 343 shares

// Total: 1,178 shares @ blended avg ₹84.88`}
/>

        <DocTabs
          tabs={[
            {
              label: 'Standard (Equal Weight)',
              content: (
                <p className="text-[var(--text-secondary)]">
                  25% per tranche. Used by most strategies (Bollinger, Envelope, S&R, 67% Reset).
                </p>
              ),
            },
            {
              label: 'Front-Loaded (Velocity Retest)',
              content: (
                <DocTable
                  headers={['Tranche', 'Allocation', 'Rationale']}
                  rows={[
                    ['A', '40%', 'Base already proven — highest conviction'],
                    ['B', '30%', 'Strong confirmation'],
                    ['C', '20%', 'Moderate conviction'],
                    ['D', '10%', 'Safety net only'],
                  ]}
                />
              ),
            },
            {
              label: 'SMA+BCD (Skip A)',
              content: (
                <p className="text-[var(--text-secondary)]">
                  Starts at B (SMA 50 level). A is the signal, not the entry. 
                  Equal weight across B, C, D (33% each).
                </p>
              ),
            },
          ]}
        />
      </section>

      <section id="laddered-targets" className="mb-10">
        <h2>Laddered Profit Targets</h2>
        <p>
          Targets follow the <strong>reverse ladder</strong> — the tranche that enters last exits first:
        </p>

        <DocTable
          headers={['Tranche', 'Target', 'Rationale']}
          rows={[
            ["D's target → C's entry price", 'First to exit — locks in quick profit'],
            ["C's target → B's entry price", 'Second exit — captures middle move'],
            ["B's target → A's entry price", 'Third exit — completes the round trip'],
            ["A's target → Strategy main target", 'Final exit — full structural move'],
          ]}
          caption="The reverse ladder: D exits first, A exits last"
        />

        <DocCodeBlock
          filename="targets.ts"
          language="typescript"
          code={`// Example: A=100, B=90, C=81, D=72.9
// Strategy main target = 120 (from pattern)

// Exit sequence:
D target = C entry = 81    // Exit D tranche at 81
C target = B entry = 90    // Exit C tranche at 90  
B target = A entry = 100   // Exit B tranche at 100
A target = 120             // Exit A tranche at pattern target

// This creates a natural pyramid:
// - D (bought lowest) exits first with smallest gain
// - A (bought highest) runs farthest for maximum gain`}
/>
      </section>

      <section id="platform-integration" className="mb-10">
        <h2>Platform Integration</h2>
        <p>
          On MarketBeacon Pro, ABCD levels are <strong>automatically calculated and displayed</strong> 
          across the platform:
        </p>

        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Chart Terminal:</strong> Horizontal lines at A/B/C/D with price labels</li>
          <li><strong>Public Analysis Page:</strong> ABCD table with exact prices and gaps</li>
          <li><strong>Matrix Screener:</strong> Shows ABCD levels for every qualified candidate</li>
          <li><strong>Alpha Hub:</strong> Tranche status (pending/filled) per stock</li>
          <li><strong>Portfolio Manager:</strong> Tracks which tranches you've executed</li>
        </ul>

        <DocCallout type="tip" title="Pro & Alpha Users">
          Real-time ABCD updates as price moves. Free users see static levels at scan time.
        </DocCallout>
      </section>

      <section id="coach-note" className="mb-10">
        <h2>Coach's Note</h2>
        <DocCallout type="note">
          <p className="italic text-[var(--text-secondary)]">
            "ABCD is your insurance against imperfect entry. You will never catch the exact bottom — 
            and you don't need to. ABCD lets you build a position while the market does what markets do: 
            fluctuate. The framework works because it <strong>assumes you are wrong at A</strong>, 
            and prepares you for it."
          </p>
        </DocCallout>
      </section>

      <section id="common-mistakes" className="mb-10">
        <h2>Common Mistakes</h2>
        <DocTable
          headers={['Mistake', 'Why It Fails', 'Correct Approach']}
          rows={[
            ['Going all-in at A', 'No room to average if price drops', 'Deploy 25% at A, wait for B/C/D'],
            ['Skipping B/C/D when price recovers', 'Misses the blended average advantage', 'Place limit orders at all 4 levels in advance'],
            ['Adding a 5th tranche (E)', 'Breaks the framework — you\'re chasing', 'Stop at D. If invalidated, accept the loss.'],
            ['Using different gaps per trade', 'Inconsistent risk/reward', 'Stick to strategy-defined gaps (5%/8%/10%)'],
            ['Averaging into broken thesis', 'Good money after bad', 'Respect invalidation: stop loss at D-level break'],
          ]}
        />
      </section>

      <section className="mb-10">
        <h2>Try It Live</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://marketbeaconpro.com/charts?symbol=NIFTY"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent-amber)] text-[#020617] font-bold rounded-xl hover:opacity-90 transition-all"
          >
            View ABCD on NIFTY Chart
          </a>
          <Link
            to="/docs/quickstart"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border-primary)] text-[var(--text-primary)] font-bold rounded-xl hover:bg-[var(--bg-tertiary)] transition-all"
          >
            Back to Quick Start
          </Link>
        </div>
      </section>
    </DocPage>
  );
};

export default ABCFrameworkPage;