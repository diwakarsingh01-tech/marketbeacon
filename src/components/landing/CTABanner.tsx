import React from 'react';
import { Link } from 'react-router-dom';
import { waLink } from '../../lib/constants';

const CTABanner: React.FC = () => {
  return (
    <section className="py-24 px-6 text-center">
       <div className="max-w-4xl mx-auto bg-slate-100 p-0.5 rounded-[3.5rem] shadow-sm">
          <div className="bg-white rounded-[3.4rem] px-10 py-20 flex flex-col items-center">
             <h3 className="text-4xl md:text-6xl font-black tracking-tighter mb-6 px-4">Ready to stop guessing?</h3>
             <p className="text-slate-500 font-medium text-lg mb-10 max-w-xl">Join 31,402 traders who upgraded their strategy with MarketBeacon Pro. Free to start.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/login" className="px-12 py-5 bg-[#00d09c] hover:bg-[#00bda0] text-white rounded-2xl font-bold uppercase tracking-wider text-base hover:scale-105 transition-all shadow-md shadow-[#00d09c]/15">
                   Sign In
                </Link>
                <a
                  href={waLink('Hi Admin, I want to know more about MarketBeacon Pro.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold uppercase tracking-wider text-base hover:scale-105 transition-all"
                >
                  WhatsApp Us
                </a>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-8">Institutional Build v12.2.0-PRO · For Educational Use Only · Not Investment Advice</p>
          </div>
       </div>
    </section>
  );
};

export default CTABanner;
