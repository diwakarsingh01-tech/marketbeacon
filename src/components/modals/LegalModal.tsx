import React from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'policy' | 'risk';
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-[80px] -mr-24 -mt-24" />
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                    {type === 'risk' ? <ShieldAlert className="h-5 w-5 text-red-400" /> : <ShieldCheck className="h-5 w-5 text-blue-400" />}
                 </div>
                 <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase italic leading-none">
                       {type === 'risk' ? 'Risk Disclosure' : 'Legal Policy'}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Regulatory Governance</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                 <X className="h-5 w-5" />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar space-y-8">
           {type === 'risk' ? (
              <>
                 <div className="bg-red-50 p-6 rounded-3xl border border-red-100 flex items-start space-x-4">
                    <AlertTriangle className="h-6 w-6 text-red-600 shrink-0" />
                    <div className="space-y-2">
                       <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">High Risk Warning</h3>
                       <p className="text-caption text-red-800 leading-relaxed uppercase">
                          Trading stocks and derivatives involves substantial risk of loss and is not suitable for every investor.
                       </p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">1. NO SEBI REGISTRATION</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          WE ARE NOT SEBI REGISTERED INVESTMENT ADVISORS. MARKETBEACON PROVIDES ALGORITHMIC TOOLS AND RESEARCH DATA FOR EDUCATIONAL PURPOSES ONLY.
                       </p>
                    </section>

                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">2. NO GUARANTEES</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          PAST PERFORMANCE OF STRATEGIES (ENVELOPE, QUANTUM STACKING) IS NOT INDICATIVE OF FUTURE RESULTS. MARKET CONDITIONS CAN CHANGE RAPIDLY.
                       </p>
                    </section>

                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">3. CAPITAL LOSS</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          YOU SHOULD ONLY TRADE WITH CAPITAL THAT YOU CAN AFFORD TO LOSE. DO NOT USE BORROWED MONEY OR ESSENTIAL LIVING EXPENSES FOR TRADING.
                       </p>
                    </section>
                 </div>
              </>
           ) : (
              <>
                 <div className="space-y-6">
                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Terms of Service</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          BY USING MARKETBEACON TERMINAL, YOU AGREE THAT ALL RESEARCH GENERATED IS PROPRIETARY AND FOR PERSONAL USE ONLY. REDISTRIBUTION OF SIGNALS IS STRICTLY PROHIBITED.
                       </p>
                    </section>

                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Data Privacy</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          WE USE BANK-GRADE ENCRYPTION TO PROTECT YOUR DATA. BROKER IMPORTS ARE PARSED LOCALLY IN YOUR BROWSER AND NEVER STORED ON OUR PERMANENT SERVERS WITHOUT CONSENT.
                       </p>
                    </section>

                    <section className="space-y-3">
                       <h4 className="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Subscription</h4>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase tracking-tight">
                          PRO AND ALPHA ACCESS ARE BILLED ANNUALLY. REFUNDS ARE PROCESSED AS PER INSTITUTIONAL BILLING GUIDELINES PROVIDED DURING CHECKOUT.
                       </p>
                    </section>
                 </div>
              </>
           )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center shrink-0">
           <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">MarketBeacon Compliance v4.5 • Secure Document</p>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
