import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  Check, 
  CreditCard,
  QrCode,
  Send,
  MessageSquare,
  Calendar,
  Clock,
  Copy,
  Smartphone,
  ExternalLink,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: 'pro' | 'alpha';
  userEmail?: string;
}

import { safeJsonParse, getApiUrl } from '../../lib/api-utils';

const API_URL = getApiUrl();

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, requiredTier, userEmail }) => {
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedTier, setSelectedTier] = useState<'pro' | 'alpha'>(requiredTier);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tiers = {
    pro: {
      name: 'PRO Access',
      monthly: '₹99',
      yearly: '₹799',
      features: [
        'Everything in Free',
        'Structural Pivot Patterns',
        'Dynamic Reversal Matrix',
        'Annual Range Tracking',
        'Quantum Stacking Engine'
      ],
      color: 'bg-blue-600'
    },
    alpha: {
      name: 'ALPHA Access',
      monthly: '₹199',
      yearly: '₹1599',
      features: [
        'Everything in PRO',
        'Velocity Retest Strategy',
        'Deep Recovery Audit (67%)',
        'Supply-Demand Core Logic',
        'Priority Alpha Strategy Triggers'
      ],
      color: 'bg-slate-900'
    }
  };

  const currentTier = tiers[selectedTier];
  const currentPrice = billingCycle === 'monthly' ? currentTier.monthly : currentTier.yearly;

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId) return;

    // Client-side Validation: Must be 12 digits
    if (!/^\d{12}$/.test(transactionId)) {
      alert("Invalid Transaction ID. Please enter the 12-digit UTR number provided by your UPI app.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('mb_token');
      const response = await fetch(`${API_URL}/api/user/upgrade-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requested_tier: selectedTier,
          billing_cycle: billingCycle,
          transaction_id: transactionId
        })
      });

      const data = await safeJsonParse(response);
      if (response.status === 401 || response.status === 403 || data?.error === 'Invalid token.' || data?.error === 'Access denied.') {
        localStorage.removeItem('mb_token');
        localStorage.removeItem('mb_user');
        window.location.href = '/login';
        return;
      }
      if (response.ok && !data.error) {
        setIsSuccess(true);
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch (err) {
      alert("Network Error. Please try again or contact support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const text = `Hi Admin, I have paid ${currentPrice} for MarketBeacon ${currentTier.name} (${billingCycle}). My Email: ${userEmail}. Transaction ID: ${transactionId || 'Pending Verification'}`;
    window.open(`https://wa.me/917056633633?text=${encodeURIComponent(text)}`, '_blank');
  };
  
  const upiId = "diwakarsingh01.tech@okaxis";
  
  const handleCopyUPI = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const amountVal = currentPrice.replace('₹', '');
  const upiLink = `upi://pay?pa=${upiId}&pn=MarketBeacon&am=${amountVal}&cu=INR&tn=MB_${selectedTier.toUpperCase()}_${billingCycle.toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overscroll-contain">
      <div className="bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-y-auto max-h-[90vh] md:max-h-none flex flex-col md:flex-row animate-in zoom-in-95 duration-500 h-fit">
        
        {/* Left: Content/Marketing */}
        <div className={`md:w-5/12 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden ${currentTier.color} transition-colors duration-500 shrink-0`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
          
          <div className="space-y-6 relative z-10">
            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg">
              {selectedTier === 'alpha' ? <ShieldCheck className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
            </div>
            
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic">{currentTier.name}</h2>
              <p className="text-white/60 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-2">Institutional Research License</p>
            </div>

            <div className="space-y-3 md:space-y-4 pt-4 border-t border-white/10">
              {currentTier.features.map(f => (
                <div key={f} className="flex items-center space-x-3">
                  <Check className="h-3 w-3 md:h-3.5 md:w-3.5 text-emerald-400" />
                  <span className="text-[11px] md:text-xs font-bold text-white/90">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8 pb-4 md:pb-0">
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl md:text-6xl font-black tracking-tighter">{currentPrice}</span>
              <span className="text-white/40 font-bold text-xs md:text-sm">/{billingCycle === 'monthly' ? 'cycle' : 'yr'}</span>
            </div>
            <p className="text-[8px] md:text-[9px] font-bold text-white/40 uppercase tracking-widest mt-2 italic">Calendar Month Billing Cycle Active</p>
          </div>
        </div>

        {/* Right: Interaction */}
        <div className="md:w-7/12 p-6 md:p-12 bg-white flex flex-col overflow-y-auto">
          <div className="flex justify-end mb-4 md:mb-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

          {isSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8 animate-in slide-in-from-bottom duration-500">
               <div className="h-16 w-16 md:h-20 md:w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="h-8 w-8 md:h-10 md:w-10" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic">Submission Logged</h3>
                  <p className="text-[13px] md:text-sm text-slate-500 font-medium leading-relaxed max-w-sm px-4">
                     Institutional audit is in progress. Your {currentTier.name} access will be activated within 15 minutes of transaction verification.
                  </p>
               </div>
               <button 
                 onClick={onClose}
                 className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl"
               >
                 Return to Terminal
               </button>
            </div>
          ) : step === 'plan' ? (
            <div className="flex-1 flex flex-col justify-center space-y-6 md:space-y-10 animate-in fade-in slide-in-from-right duration-500 pb-6 md:pb-0">
               <div className="space-y-2 text-center md:text-left">
                  <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Step 1: Deployment Config</span>
                  <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase italic leading-none">Upgrade Your Edge</h3>
               </div>

               {/* Billing Cycle Toggle */}
               <div className="flex justify-center md:justify-start">
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-fit relative">
                     <button 
                       onClick={() => setBillingCycle('monthly')}
                       className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all z-10 ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-slate-400'}`}
                     >
                        Monthly
                     </button>
                     <button 
                       onClick={() => setBillingCycle('yearly')}
                       className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all z-10 ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-slate-400'}`}
                     >
                        Yearly (-33%)
                     </button>
                     <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ${billingCycle === 'yearly' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {Object.entries(tiers).map(([id, t]) => (
                     <button 
                       key={id}
                       onClick={() => setSelectedTier(id as any)}
                       className={`w-full p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 text-left transition-all flex items-center justify-between ${selectedTier === id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                     >
                       <div className="space-y-1">
                         <span className="text-[11px] md:text-xs font-black text-slate-900 uppercase tracking-tight">{t.name}</span>
                         <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{id === 'pro' ? 'Structural Patterns' : 'Full Institutional Access'}</p>
                       </div>
                       <div className="text-right">
                         <span className="text-lg md:text-xl font-black text-slate-900 block">{billingCycle === 'monthly' ? t.monthly : t.yearly}</span>
                         <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{billingCycle}</span>
                       </div>
                     </button>
                  ))}
               </div>

               <button 
                 onClick={() => setStep('payment')}
                 className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-2xl md:rounded-3xl text-[11px] md:xs font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-200"
               >
                 <span>Secure Checkout</span>
                 <ChevronRight className="h-4 w-4" />
               </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right duration-500 pb-8 md:pb-0">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <span className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Step 2: Transfer Confirmation</span>
                     <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic">Scan & Pay via UPI</h3>
                  </div>
                  <button onClick={() => setStep('plan')} className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase hover:text-slate-900">Change Plan</button>
               </div>

               <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 p-6 md:p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-40 h-40 md:w-44 md:h-44 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border border-slate-200 relative group shrink-0">
                     <img src="/qr-code.png" className="w-full h-full object-contain" alt="Payment QR" />
                     <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                        <span className="text-[10px] font-black text-slate-900 uppercase text-center px-4">Scan QR to Pay</span>
                     </div>
                  </div>
                  <div className="space-y-4 flex-1 text-center md:text-left w-full">
                     <div className="space-y-1">
                        <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Fixed Plan Amount ({billingCycle})</span>
                        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm w-fit mx-auto md:mx-0">
                           <p className="text-3xl md:text-4xl font-black text-blue-600 tracking-tighter">{currentPrice}</p>
                        </div>
                     </div>

                     <div className="space-y-1.5">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Or transfer to UPI ID</span>
                       <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 max-w-sm mx-auto md:mx-0">
                         <span className="text-[10px] font-mono font-black text-slate-900 select-all tracking-tight">{upiId}</span>
                         <button 
                           type="button" 
                           onClick={handleCopyUPI} 
                           className={`p-1.5 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                         >
                           {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                         </button>
                       </div>
                     </div>

                     <a 
                       href={upiLink} 
                       className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-95 shadow-sm"
                     >
                       <Smartphone className="h-3.5 w-3.5" />
                       <span>Pay via UPI App</span>
                       <ExternalLink className="h-2.5 w-2.5" />
                     </a>
                  </div>
               </div>

               <form onSubmit={handleSubmitTransaction} className="space-y-4">
                  <div className="space-y-1">
                     <div className="flex justify-between items-center pl-1">
                       <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest block">Transaction UTR (12 Digits)</label>
                       {transactionId && (
                         <span className={`text-[8px] font-black uppercase tracking-wider ${/^\d{12}$/.test(transactionId) ? 'text-emerald-600' : 'text-rose-500'}`}>
                           {/^\d{12}$/.test(transactionId) ? '✓ Valid UTR' : `${transactionId.length} / 12 Digits`}
                         </span>
                       )}
                     </div>
                     <div className="relative">
                        <input 
                           type="text" 
                           placeholder="Enter 12-digit UTR Number"
                           required
                           maxLength={12}
                           value={transactionId}
                           onChange={(e) => setTransactionId(e.target.value.replace(/\D/g, ''))}
                           className={`w-full bg-slate-50 border-2 rounded-2xl pl-5 pr-4 py-3.5 text-xs font-black tracking-widest outline-none transition-all ${
                             transactionId 
                               ? /^\d{12}$/.test(transactionId)
                                 ? 'border-emerald-500 focus:bg-white focus:border-emerald-600'
                                 : 'border-rose-400 focus:bg-white focus:border-rose-500'
                               : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                           }`}
                        />
                     </div>
                     <p className="text-[8px] font-medium text-slate-400 pl-1 leading-relaxed uppercase">
                       Find the 12-digit UTR/Ref number in your Google Pay, PhonePe, or Paytm receipt.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-2">
                     <button 
                        type="submit"
                        disabled={isSubmitting || !/^\d{12}$/.test(transactionId)}
                        className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-40 transition-all hover:scale-[1.02] shadow-lg shadow-slate-900/10 active:scale-95"
                     >
                        <Send className="h-4 w-4" />
                        <span>{isSubmitting ? 'Verifying...' : 'Submit Proof'}</span>
                     </button>
                     <button 
                        type="button"
                        onClick={openWhatsApp}
                        className="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all hover:bg-emerald-700 hover:scale-[1.02] shadow-lg shadow-emerald-600/10 active:scale-95"
                     >
                        <MessageSquare className="h-4 w-4" />
                        <span>Send WhatsApp</span>
                     </button>
                  </div>
               </form>

               {/* Social Proof Live Log */}
               <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-blue-600">
                     <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-wider">Live System Log</span>
                  </div>
                  <div className="space-y-1.5">
                     {[
                        { name: "hitesh***", plan: `Alpha ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`, time: "4m ago" },
                        { name: "vikas***", plan: `Pro ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`, time: "12m ago" },
                        { name: "amit***", plan: `Alpha ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`, time: "24m ago" }
                     ].map((act, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[8px] font-bold text-slate-500 uppercase tracking-tight">
                           <div className="flex items-center gap-1.5">
                              <span className="h-1 w-1 rounded-full bg-emerald-500" />
                              <span>User {act.name} activated {act.plan}</span>
                           </div>
                           <span className="text-slate-400 font-normal">{act.time}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
