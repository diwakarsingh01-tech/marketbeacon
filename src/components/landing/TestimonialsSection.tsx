import React from 'react';

const TestimonialsSection: React.FC = () => {
  return (
    <section aria-label="Trader testimonials and reviews" className="py-24 px-6 md:px-10 border-t border-[var(--border-primary)]/50">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
            <span className="text-amber-400 text-sm">★★★★★</span>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.3em]">4.9 / 5 from 1,280 traders</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] mb-4">
            Traders Who Switched to <span className="text-blue-400">Institutional Logic</span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm max-w-lg mx-auto">From retail traders to advisors — here's what MarketBeacon Pro users say.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Rahul Sharma',
              role: 'Retail Trader, Delhi',
              avatar: 3,
              stars: 5,
              text: '"The ABCD tranche system completely changed how I manage risk. I used to dump everything at one price and panic when it fell. Now I build positions systematically — my average costs are 15-18% better than before."',
              stat: '+18% better avg cost',
              statColor: 'text-emerald-400',
            },
            {
              name: 'Priya Mehta',
              role: 'Sub-broker, Mumbai',
              avatar: 7,
              stars: 5,
              text: '"As a sub-broker, every research note needs to be justified. The 100-point Audit Score gives me a defensible, data-backed reason for every stock I suggest. My clients trust me more now."',
              stat: 'Research Tool Framework',
              statColor: 'text-blue-400',
            },
            {
              name: 'Vikram Nair',
              role: 'HNI Investor, Bangalore',
              avatar: 11,
              stars: 5,
              text: '"I manage a ₹2Cr portfolio. Before MarketBeacon, I relied on tips and news. Now I screen using the Audit Score, enter via ABCD zones, and track smart money. My drawdowns have reduced significantly."',
              stat: 'Portfolio: ₹2Cr+',
              statColor: 'text-amber-400',
            },
            {
              name: 'Ananya Reddy',
              role: 'Retail Trader, Hyderabad',
              avatar: 5,
              stars: 5,
              text: '"I was using a popular screener before — it just gave me charts and raw numbers. MarketBeacon Pro tells me WHY a stock qualifies, what the entry zone is, and what the risk level is. Night and day difference."',
              stat: 'Switched from Screener.in',
              statColor: 'text-purple-400',
            },
            {
              name: 'Suresh Iyer',
              role: 'Family Office, Chennai',
              avatar: 9,
              stars: 5,
              text: '"The institutional approach resonates with how we think about capital preservation. The zero-debt filter and smart money tracking are powerful. We use this as a first-pass filter for our equity allocation."',
              stat: 'Family Office Use Case',
              statColor: 'text-indigo-400',
            },
            {
              name: 'Deepak Gupta',
              role: 'Part-time Trader, Pune',
              avatar: 14,
              stars: 5,
              text: '"I only get 30 minutes a day for stock research. The Qualified list + Audit Score makes it fast. I check the score, check the ABCD zone, and decide. No more hours of reading balance sheets manually."',
              stat: '30 mins/day workflow',
              statColor: 'text-emerald-400',
            },
          ].map((t, i) => (
            <div key={i} className="card p-7 flex flex-col gap-5 hover:border-[var(--border-secondary)] transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border-secondary)] overflow-hidden shrink-0">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} alt={t.name} loading="lazy" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{t.name}</p>
                    <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t.role}</p>
                  </div>
                </div>
                <div className="text-amber-400 text-xs tracking-tight">{'★'.repeat(t.stars)}</div>
              </div>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1 italic">{t.text}</p>
              <div className="pt-3 border-t border-[var(--border-primary)]">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${t.statColor}`}>{t.stat}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
