import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp } from 'lucide-react';
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
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
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
                href="https://wa.me/919251180183"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp MarketBeacon Pro"
                className="w-9 h-9 flex items-center justify-center bg-emerald-600/10 border border-emerald-600/20 rounded-xl hover:bg-emerald-600/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-emerald-400">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
              <a
                href="https://t.me/asktoceo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram MarketBeacon Pro"
                className="w-9 h-9 flex items-center justify-center bg-blue-600/10 border border-blue-600/20 rounded-xl hover:bg-blue-600/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
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
                      className="text-[12px] font-medium text-slate-500 hover:text-white transition-colors"
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
