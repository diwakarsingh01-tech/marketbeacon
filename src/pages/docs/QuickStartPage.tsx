import React from 'react';
import { Link } from 'react-router-dom';
import { DocPage, DocCallout, DocCodeBlock, DocTable, DocStep, DocTabs } from '../../components/docs/DocPage';

export const QuickStartPage: React.FC = () => {
  const toc = [
    { id: 'overview', title: 'Overview', level: 2 },
    { id: 'prerequisites', title: 'Prerequisites', level: 2 },
    { id: 'account-setup', title: 'Account Setup', level: 2 },
    { id: 'first-scan', title: 'Run Your First Scan', level: 2 },
    { id: 'interpret-results', title: 'Interpret Results', level: 2 },
    { id: 'next-steps', title: 'Next Steps', level: 3 },
  ];

  return (
    <DocPage
      title="Quick Start Guide"
      description="Get up and running with MarketBeacon Pro in 5 minutes. From account creation to your first qualified trade idea."
      slug="quickstart"
      toc={toc}
      lastUpdated="Jul 2026"
      prevPage={{ title: 'Introduction', href: '/docs/intro' }}
      nextPage={{ title: 'ABCD Framework', href: '/docs/abc-framework' }}
      editUrl="https://github.com/marketbeacon/docs/edit/main/pages/quickstart.mdx"
    >
      <section id="overview" className="mb-10">
        <h2>Overview</h2>
        <p className="lead">
          MarketBeacon Pro is an institutional-grade investment research platform that combines 
          mathematical frameworks, 9 quantitative strategies, and real-time scanning to help you 
          build portfolios like a hedge fund.
        </p>
        <p>
          This guide walks you through the essential first steps:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Create and configure your account</li>
          <li>Understand the dashboard layout</li>
          <li>Run your first strategy scan</li>
          <li>Interpret and act on results</li>
        </ul>

        <DocCallout type="tip" title="Time Investment">
          <strong>5 minutes</strong> to complete this guide. You'll have a qualified trade idea by the end.
        </DocCallout>
      </section>

      <section id="prerequisites" className="mb-10">
        <h2>Prerequisites</h2>
        <DocTable
          headers={['Requirement', 'Details', 'Status']}
          rows={[
            ['Device', 'Desktop (recommended) or mobile browser', '✅ Ready'],
            ['Internet', 'Stable connection for real-time data', '✅ Ready'],
            ['Capital', '₹10,000+ recommended for meaningful allocation', 'Your choice'],
            ['Knowledge', 'Basic stock market understanding', 'Assumed'],
            ['Account', 'Free MarketBeacon Pro account', 'Create below'],
          ]}
          caption="System requirements at a glance"
        />
      </section>

      <section id="account-setup" className="mb-10">
        <h2>Account Setup</h2>

        <DocStep
          number={1}
          title="Create Your Account"
          description="Visit the signup page and register with Google OAuth."
          details={
            <>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Go to <a href="https://marketbeaconpro.com/login" target="_blank" rel="noopener noreferrer" className="text-[var(--accent-amber)] hover:underline">marketbeaconpro.com/login</a></li>
                <li>Click <strong>Continue with Google</strong></li>
                <li>Select your Google account and authorize</li>
                <li>You'll land on the <strong>Dashboard</strong> (/app)</li>
              </ol>
            </>
          }
        />

        <DocStep
          number={2}
          title="Verify Access Tier"
          description="Check your current subscription level in the top-right user menu."
          details={
            <DocTable
              headers={['Tier', 'Strategies', 'Best For']}
              rows={[
                ['Free', 'Bollinger, Envelope Long/Short', 'Learning & testing'],
                ['Pro', '+ SMA+BCD, 52W, Cup & Handle', 'Active investing'],
                ['Alpha', '+ S&R, 67% Reset, 20% Velocity', 'Institutional-grade'],
              ]}
            />
          }
        />

        <DocStep
          number={3}
          title="Set Your Capital (Optional)"
          description="Enter your investable capital in Alpha Hub to see rupee allocations."
          code={`
// In Alpha Hub, enter your capital:
const capital = 10_00_000; // ₹10 Lakhs

// System allocates:
// Large Cap (50%): ₹5L → ~20 stocks × ₹25K each
// Mid Cap (30%): ₹3L → ~12 stocks × ₹25K each  
// Small Cap (20%): ₹2L → ~8 stocks × ₹25K each`}
          language="typescript"
        />
      </section>

      <section id="first-scan" className="mb-10">
        <h2>Run Your First Scan</h2>

        <DocTabs
          tabs={[
            {
              label: 'Matrix Screener (Recommended)',
              content: (
                <div className="space-y-4">
                  <DocStep
                    number={1}
                    title="Open the Screener"
                    description="Navigate to <strong>/screener</strong> from the sidebar or TopNav."
                  />
                  <DocStep
                    number={2}
                    title="Choose Universe"
                    description="Select <strong>Elite Basket</strong> (Super 45) for highest quality, or <strong>Quality Basket</strong> (Good 45) for growth exposure."
                  />
                  <DocStep
                    number={3}
                    title="Select Strategy"
                    description="From the <strong>Model Matrix</strong> dropdown, choose <strong>Bollinger Band</strong> (Free tier) or <strong>Envelope Long</strong>."
                  />
                  <DocStep
                    number={4}
                    title="Run Scan"
                    description="Click <strong>Scan</strong> or wait for auto-refresh. Results appear in three tabs:"
                    details={
                      <DocTable
                        headers={['Tab', 'Meaning', 'Action']}
                        rows={[
                          ['Passed Audit', 'Meets all fundamental gates + strategy trigger', 'High priority for entry'],
                          ['Observation', 'Nearly qualifies (one parameter off)', 'Watchlist for next week'],
                          ['Audit Fails', 'Failed fundamental checks', 'Avoid / investigate why'],
                        ]}
                      />
                    }
                  />
                  <DocStep
                    number={5}
                    title="Pick a Candidate"
                    description="Click any stock in <strong>Passed Audit</strong> to open its analysis page. Review the chart, ABCD levels, and signal details."
                  />
                </div>
              ),
            },
            {
              label: 'Alpha Hub (Portfolio View)',
              content: (
                <div className="space-y-4">
                  <p className="text-[var(--text-secondary)]">
                    Alpha Hub shows the live <strong>Alpha-40 portfolio</strong> — 40 stocks across all strategies with capital allocation.
                  </p>
                  <DocStep
                    number={1}
                    title="Open Alpha Hub"
                    description="Navigate to <strong>/alpha-hub</strong> from the sidebar."
                  />
                  <DocStep
                    number={2}
                    title="Enter Capital"
                    description="Input your total investable amount. The engine instantly shows allocation per stock, per basket, and per strategy."
                  />
                  <DocStep
                    number={3}
                    title="Review Distribution"
                    description="Check <strong>Strategy Distribution</strong> to see how many stocks each strategy contributes."
                  />
                  <DocCallout type="note" title="Alpha Hub is Read-Only">
                    Alpha Hub shows the <em>model portfolio</em>. To build your personal portfolio with custom sizing, use the <strong>Portfolio Manager</strong> (/manager).
                  </DocCallout>
                </div>
              ),
            },
            {
              label: 'Chart Terminal (Visual)',
              content: (
                <div className="space-y-4">
                  <p className="text-[var(--text-secondary)]">
                    Best for visual learners who want to <em>see</em> the setup before committing.
                  </p>
                  <DocStep
                    number={1}
                    title="Open Charts"
                    description="Go to <strong>/charts</strong> and enter a symbol (e.g., RELIANCE, TCS)."
                  />
                  <DocStep
                    number={2}
                    title="Overlay Strategy"
                    description="Click the <strong>Strategies</strong> panel and enable <strong>Bollinger Band</strong> or <strong>Envelope</strong>."
                  />
                  <DocStep
                    number={3}
                    title="Check ABCD Levels"
                    description="The chart automatically plots <strong>A, B, C, D tranche levels</strong> as horizontal lines with price labels."
                  />
                  <DocStep
                    number={4}
                    title="Validate Visually"
                    description="Confirm: price at lower band/envelope, volume drying up, trend context favorable."
                  />
                </div>
              ),
            },
          ]}
        />
      </section>

      <section id="interpret-results" className="mb-10">
        <h2>Interpret Results</h2>
        <p>
          Every qualified candidate shows a <strong>Strategy Card</strong> with these key elements:
        </p>

        <DocTable
          headers={['Element', 'What It Means', 'Decision Factor']}
          rows={[
            ['Strategy Badge', 'Which strategy triggered (Bollinger, Envelope, etc.)', 'Match to your conviction'],
            ['ABCD Levels', 'A/B/C/D prices with 10% gaps', 'Place limit orders at each'],
            ['Audit Score', '0–100 fundamental health', '≥60 required, ≥75 preferred'],
            ['Smart Money %', 'FII + DII + Promoter holding', `{'>'}50% minimum, {'>'}70% ideal`],
            ['Basket Tag', 'Elite / Quality / Growth', 'Universe alignment'],
            ['Signal Date', 'When trigger occurred', 'Freshness: <7 days best'],
            ['Chart Preview', 'Mini chart with overlays', 'Visual confirmation'],
          ]}
        />

        <DocCallout type="warning" title="Don't Skip Qualification">
          A strategy trigger <strong>without</strong> passing the fundamental audit is a trap. 
          The audit score is your primary filter — it separates institutional-grade setups from noise.
        </DocCallout>
      </section>

      <section id="next-steps" className="mb-10">
        <h3>Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <Link
            to="/docs/abc-framework"
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-amber)]/50 transition-all"
          >
            <h4 className="font-bold text-[var(--accent-amber)] mb-1">Master ABCD Framework</h4>
            <p className="text-sm text-[var(--text-secondary)]">The mathematical backbone of every strategy</p>
          </Link>
          <Link
            to="/docs/screener"
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-amber)]/50 transition-all"
          >
            <h4 className="font-bold text-[var(--accent-amber)] mb-1">Deep Dive: Screener</h4>
            <p className="text-sm text-[var(--text-secondary)]">Advanced filters, custom universes, exports</p>
          </Link>
          <Link
            to="/docs/free-strategies"
            className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl hover:border-[var(--accent-amber)]/50 transition-all"
          >
            <h4 className="font-bold text-[var(--accent-amber)] mb-1">Explore Free Strategies</h4>
            <p className="text-sm text-[var(--text-secondary)]">Bollinger, Envelope Long, Envelope Short</p>
          </Link>
        </div>
      </section>
    </DocPage>
  );
};

export default QuickStartPage;