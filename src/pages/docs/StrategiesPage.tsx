import React from 'react';
import { DocPage, DocCallout, DocTable, DocTabs } from '../../components/docs/DocPage';

export const StrategiesPage: React.FC = () => {
  const toc = [
    { id: 'overview', title: 'Strategy Overview', level: 2 },
    { id: 'tier-comparison', title: 'Tier Comparison', level: 2 },
    { id: 'free-strategies', title: 'Free Strategies', level: 2 },
    { id: 'pro-strategies', title: 'Pro Strategies', level: 2 },
    { id: 'alpha-strategies', title: 'Alpha Strategies', level: 2 },
    { id: 'when-to-use', title: 'When to Use Which', level: 2 },
  ];

  return (
    <DocPage
      title="All Strategies — Complete Library"
      description="9 quantitative strategies across 3 tiers. Compare entry/exit rules, risk profiles, and ideal market conditions."
      slug="strategies"
      toc={toc}
      lastUpdated="Jul 2026"
      prevPage={{ title: 'Understanding Baskets', href: '/docs/baskets' }}
      nextPage={{ title: 'Matrix Screener', href: '/docs/screener' }}
      editUrl="https://github.com/marketbeacon/docs/edit/main/pages/strategies.mdx"
    >
      <section id="overview" className="mb-10">
        <h2>Strategy Overview</h2>
        <p className="lead">
          Every strategy follows the <strong>same 5-block framework</strong>: Market Condition → Research Trigger → 
          Qualification → ABCD Entry → Exit & Risk. The differences are in the trigger and qualification gates.
        </p>
      </section>

      <section id="tier-comparison" className="mb-10">
        <h2>Tier Comparison</h2>
        <DocTable
          headers={['Tier', 'Strategies', 'Cost', 'Best For', 'Key Edge']}
          rows={[
            ['Free', 'Bollinger, Envelope Long/Short', '₹0', 'Learning, testing', 'Statistical mean reversion'],
            ['Pro', 'SMA+BCD, 52W, Cup & Handle', 'Subscription', 'Active investing', 'Structural patterns'],
            ['Alpha', 'S&R, 67% Reset, 20% Velocity', 'Subscription', 'Institutional-grade', 'Deep value & velocity'],
          ]}
        />
      </section>

      <section id="free-strategies" className="mb-10">
        <h2>Free Strategies</h2>
        <DocTabs
          tabs={[
            {
              label: 'Bollinger Band',
              content: (
                <div className="space-y-4">
                  <DocCallout type="info" title="Mean Reversion at Statistical Extreme">
                    Price touches lower band (2 std dev below 20 MA) + squeeze = potential reversal.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Lower band touch', 'Band width narrow (squeeze) confirms energy building'],
                      ['2. Qualification', 'Audit ≥60, Elite/Quality', 'Smart Money >50%, D/E passes'],
                      ['3. Entry', 'ABCD from A=lower band', 'Standard 10% gaps'],
                      ['4. Target', 'Upper band', 'Typical 8–15% move. Book 50% at upper, trail rest.'],
                      ['5. Stop', 'Close >1% below lower band', 'If walks band for 3+ sessions → exit.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Envelope Long',
              content: (
                <div className="space-y-4">
                  <DocCallout type="info" title="Institutional Demand Zone">
                    Weekly lower envelope = where smart money historically steps in. Elite/Quality only.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Weekly lower envelope touch', 'High institutional participation preferred'],
                      ['2. Qualification', 'Elite/Quality, Audit ≥60', 'Smart Money >50%'],
                      ['3. Entry', 'ABCD from A=envelope', 'Standard 10% gaps'],
                      ['4. Target', 'Upper envelope', '20–25% typical. Book 50% at upper.'],
                      ['5. Stop', 'Close 3% below envelope', 'If weak quarterly results → exit immediately.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Envelope Short (Pullback)',
              content: (
                <div className="space-y-4">
                  <DocCallout type="info" title="Momentum Continuation">
                    EMA 200 pullback in confirmed uptrend. Tighter 5% gaps. Not a short strategy!
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Pullback to EMA 200', 'Higher highs & higher lows confirmed'],
                      ['2. Qualification', 'RS outperforms Nifty', 'FII/DII rising 4+ quarters'],
                      ['3. Entry', 'ABCD from A=EMA 200', 'Tighter 5% gaps (shallow pullbacks)'],
                      ['4. Target', '+14% to upper envelope', 'Book full at target. Re-enter on next pullback.'],
                      ['5. Stop', 'Close below EMA 200', 'Lower low breaks uptrend → exit.'],
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </section>

      <section id="pro-strategies" className="mb-10">
        <h2>Pro Strategies</h2>
        <DocTabs
          tabs={[
            {
              label: 'SMA + BCD',
              content: (
                <div className="space-y-4">
                  <DocCallout type="warning" title="Unique: Start at B, Not A">
                    Bearish SMA stack ({'20<50<200'}). A is signal, entry at B (SMA 50). Max pessimism = opportunity.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Price < SMA20 < SMA50 < SMA200', 'Price at 200 DMA + stabilization'],
                      ['2. Qualification', 'Audit ≥60, Elite/Quality', 'Green weekly close above 20 DMA'],
                      ['3. Entry', 'BCD from B=SMA50', 'Equal weight B/C/D. Skip A entirely.'],
                      ['4. Target', 'Reclaim SMA 20 (A level)', '15–30% from D. Book 50% at SMA 20.'],
                      ['5. Stop', 'Close 3% below 200 DMA', '200 DMA sloping down + break = exit.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: '52-Week High/Low',
              content: (
                <div className="space-y-4">
                  <DocCallout type="info" title="Annual Range Statistics">
                    Elite/Mid caps within 3% of 52W low. Target = 52W high. 8% gaps (tighter).
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Within 3% of 52W low', 'Large/Mid cap only. Dividend history preferred.'],
                      ['2. Qualification', 'Audit ≥60, Elite/Quality', 'D/E pass, pledge ≤5%, no governance flags.'],
                      ['3. Entry', 'ABCD from A=52W low', '8% gaps (tighter). 25% each tranche.'],
                      ['4. Target', '52W high', '30–80% avg recovery. Book 50% at high.'],
                      ['5. Stop', 'Close 5% below 52W low', '3+ consecutive monthly new lows = exit.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Cup with Handle',
              content: (
                <div className="space-y-4">
                  <DocCallout type="info" title="Structural Breakout">
                    U-shaped base 3–12 months. Handle ≤15% depth, upper 30% of cup. Low volume in handle.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Handle breakout above lip', 'Cup lips within 5%. 3+ months formation.'],
                      ['2. Qualification', 'Elite/Quality, Audit ≥60', 'U-shaped not V-shaped. Volume dry in handle.'],
                      ['3. Entry', 'ABCD from A=handle entry', 'Standard 10% gaps.'],
                      ['4. Target', 'Cup lip + cup depth', '~28% from lip. Book 50%, trail 25%.'],
                      ['5. Stop', 'Handle below cup midpoint', 'V-shaped cup = invalid.'],
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </section>

      <section id="alpha-strategies" className="mb-10">
        <h2>Alpha Strategies</h2>
        <DocTabs
          tabs={[
            {
              label: 'Support & Resistance',
              content: (
                <div className="space-y-4">
                  <DocCallout type="warning" title="Levels Flip">
                    Broken support becomes resistance. If you ignored stop and price bounces to old support → that's your EXIT, not re-entry.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', '2nd/3rd retest of support', '\u22652 prior clean bounces. No >2% breaks.'],
                      ['2. Qualification', 'Audit \u226560, multi-TF validation', 'Higher lows over time.'],
                      ['3. Entry', 'ABCD from A=support', 'Standard 10% gaps.'],
                      ['4. Target', 'Next resistance zone', 'Min 20% projected. Book 50% at resistance.'],
                      ['5. Stop', 'Close >3% below support', 'Broken support \u2192 resistance. Exit.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Institutional Reset (67%)',
              content: (
                <div className="space-y-4">
<DocCallout type="danger" title="Most Profitable & Most Dangerous">
                    67%+ drawdown from ATH. Sales/profit near ATH. 200%+ recovery potential. One wrong assessment = 67% loss.
                  </DocCallout>
                  <DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Down >=67% from ATH', 'Sales/profit TTM near ATH (±5%).'],
                      ['2. Qualification', 'Audit ≥60, D/E pass, pledge ≤5%', 'No governance issues. Growth/Fallen Value basket.'],
                      ['3. Entry', 'ABCD from A=current', 'Standard 10% gaps. 25% each tranche.'],
                      ['4. Target', '+67% in 1yr → +100% no timeline', 'Book 50% at 67%. Trail rest to ATH recovery.'],
                      ['5. Stop', 'Fundamental deterioration', 'Sales ↓>20%, profit→loss, debt spike = exit.'],
                    ]}
                  />
                </div>
              ),
            },
            {
              label: 'Velocity Retest (20%)',
              content: (
                <div className="space-y-4">
                  <DocCallout type="tip" title="Second Chance">
                    20%+ rally from deep base (\u2264200 DMA), then retest origin. Front-loaded ABCD (40/30/20/10).
                  </DocCallout>
<DocTable
                    headers={['Step', 'Rule', 'Detail']}
                    rows={[
                      ['1. Trigger', 'Retest Rally Start Low', '\u226520% rally from \u2264200 DMA in 12mo. Retest within 5%.'],
                      ['2. Qualification', 'Audit \u226560, original thesis holds', 'Pullback on declining volume.'],
                      ['3. Entry', 'ABCD from A=origin', 'Front-loaded: 40/30/20/10%.'],
                      ['4. Target', 'Previous rally peak', '20\u201350% avg. Book 50% at peak.'],
                      ['5. Stop', 'Close >8% below origin', 'Retest failed \u2192 exit fully.'],
                    ]}
                  />
                </div>
              ),
            },
          ]}
        />
      </section>

      <section id="when-to-use" className="mb-10">
        <h2>When to Use Which Strategy</h2>
        <DocTable
          headers={['Market Condition', 'Best Strategy', 'Why']}
          rows={[
            ['Strong Uptrend', 'Envelope Short (Pullback)', 'Buy dips to EMA 200 in confirmed trend'],
            ['Sideways / Range', 'Bollinger Band', 'Mean reversion at statistical extremes'],
            ['Deep Correction', 'Envelope Long', 'Institutional demand at weekly envelope'],
            ['Bearish Stack (Max Pessimism)', 'SMA + BCD', 'Accumulation at 200 DMA with bearish alignment'],
            ['Annual Low (Bluechips)', '52W High/Low', 'Statistical annual range reversion'],
            ['Rounded Base Forming', 'Cup with Handle', 'Institutional accumulation over months'],
            ['Proven Support Zone', 'S&R', 'Historically validated buyer zones'],
            ['Quality Crash (External)', '67% Reset', 'Fundamentals intact, price detached'],
            ['Momentum Pullback', '20% Velocity', 'Retest of proven demand after rally'],
          ]}
        />
      </section>
    </DocPage>
  );
};

export default StrategiesPage;