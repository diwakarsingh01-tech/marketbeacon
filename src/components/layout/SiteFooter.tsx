import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, MessageCircle, Send } from 'lucide-react';
import BrandLogo from '../brand/BrandLogo';

const SiteFooter: React.FC = () => {
  const year = new Date().getFullYear();

  const links = {
    Platform: [
      { label: 'Launch Terminal', to: '/login' },
      { label: 'Live Screener', to: '/login' },
      { label: 'Alpha Hub', to: '/login' },
      { label: 'License Desk', to: '/license-desk' },
      { label: 'Pricing', to: '/pricing' },
    ],
    Learn: [
      { label: 'Blog / Insights', to: '/blog' },
      { label: 'ABCD Tranche Guide', to: '/blog/abcd-tranche-laddering-guide' },
      { label: 'Stock Research Tool', to: '/blog/what-is-sebi-compliant-stock-screener' },
      { label: 'Trade Like FII/DII', to: '/blog/how-to-trade-like-fii-dii-india' },
      { label: 'Audit Score Explained', to: '/blog/institutional-audit-score-explained' },
    ],
    Legal: [
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Terms of Service', to: '/privacy-policy' },
      { label: 'SEBI Disclaimer', to: '/privacy-policy#sebi' },
    ],
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/60 pt-16 pb-8 px-6 md:px-10">
      <div className="max-w-[1200px] mx-auto">

        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-14">

          {/* Brand col */}
          <div className="md:col-span-2 space-y-5">
            <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
              <BrandLogo variant="dark" size={32} />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              India's institutional-grade stock research tool. ABCD Tranche Laddering + 100-point Audit Score. For educational & research purposes. Not investment advice.
            </p>
            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">Not Investment Advice</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <TrendingUp className="w-3 h-3 text-blue-400" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">30K+ Traders</span>
              </div>
            </div>
            {/* Social */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://wa.me/917056633633"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp MarketBeacon Pro"
                className="w-9 h-9 flex items-center justify-center bg-emerald-600/10 border border-emerald-600/20 rounded-xl hover:bg-emerald-600/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
              </a>
              <a
                href="https://t.me/Marketbeconpro"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram MarketBeacon Pro"
                className="w-9 h-9 flex items-center justify-center bg-blue-600/10 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-colors"
              >
                <Send className="w-4 h-4 text-blue-400" />
              </a>
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.35em] mb-5">{group}</p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      className="text-[12px] font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center md:text-left">
            © {year} MarketBeacon Technologies · All Rights Reserved · India
          </p>
          <p className="text-[8px] text-slate-700 font-bold uppercase tracking-widest text-center max-w-md leading-relaxed">
            Disclaimer: MarketBeacon Pro is NOT a SEBI-registered Investment Adviser or Research Analyst. All scores, signals & data are mathematical models for educational purposes only. Not investment advice. Consult a SEBI-registered advisor before investing.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
