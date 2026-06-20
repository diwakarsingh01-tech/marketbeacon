import React from 'react';
import { Link } from 'react-router-dom';
import { waLink } from '../../lib/constants';

const CTABanner: React.FC = () => {
  return (
    <section className="py-24 px-6 text-center">
       <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 p-1 rounded-[3.5rem] shadow-2xl">
          <div className="bg-[var(--bg-primary)] rounded-[3.4rem] px-10 py-20 flex flex-col items-center">
             <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 px-4">Ready to stop guessing?</h3>
             <p className="text-[var(--text-muted)] font-medium text-lg mb-10 max-w-xl">Join 31,402 traders who upgraded their strategy with MarketBeacon Pro. Free to start.</p>
             <div className="flex flex-col sm:flex-row items-center gap-4">
               <Link to="/login" className="px-12 py-5 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-widest text-base hover:scale-105 transition-all">
                  Launch Terminal Free
               </Link>
               <a
                 href={waLink('Hi Admin, I want to know more about MarketBeacon Pro.')}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="px-10 py-5 bg-emerald-600 text-[var(--text-primary)] rounded-2xl font-black uppercase tracking-widest text-base hover:bg-emerald-500 hover:scale-105 transition-all"
               >
                 WhatsApp Us
               </a>
             </div>
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mt-8">Institutional Build v12.2.0-PRO · For Educational Use Only · Not Investment Advice</p>
          </div>
       </div>
    </section>
  );
};

export default CTABanner;
