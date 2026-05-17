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
  MessageSquare
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: 'pro' | 'alpha';
  userEmail?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, requiredTier, userEmail }) => {
  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'alpha'>(requiredTier);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'pro',
      name: 'PRO Access',
      price: '₹99',
      period: 'per month',
      features: [
        'Everything in Free',
        'Structural Pivot Patterns',
        'Dynamic Reversal Matrix',
        'Annual Range Tracking',
        'Quantum Stacking Engine'
      ],
      color: 'bg-blue-600',
      tag: 'Most Recommended'
    },
    {
      id: 'alpha',
      name: 'ALPHA Access',
      price: '₹199',
      period: 'per month',
      features: [
        'Everything in PRO',
        'Velocity Retest Strategy',
        'Deep Recovery Audit (67%)',
        'Supply-Demand Core Logic',
        'Priority Alpha Signals'
      ],
      color: 'bg-slate-900',
      tag: 'Full Institutional'
    }
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan)!;

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('mb_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/upgrade-request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requested_tier: selectedPlan,
          transaction_id: transactionId
        })
      });

      if (response.ok) {
        setIsSuccess(true);
      }
    } catch (err) {
      alert("Submission failed. Please try again or contact WhatsApp support.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsApp = () => {
    const text = `Hi Admin, I have paid ${currentPlan.price} for MarketBeacon ${currentPlan.name}. My Email: ${userEmail}. Transaction ID: ${transactionId || 'Pending'}`;
    window.open(`https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        
        {/* Left: Content/Marketing */}
        <div className={`md:w-5/12 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden ${currentPlan.color}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
          
          <div className="space-y-6 relative z-10">
            <button onClick={onClose} className="md:hidden absolute top-0 right-0 p-2 bg-white/10 rounded-full">
              <X className="h-5 w-5" />
            </button>
            
            <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-lg">
              {selectedPlan === 'alpha' ? <ShieldCheck className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
            </div>
            
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic">{currentPlan.name}</h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Institutional Research Module</p>
            </div>

            <div className="space-y-4 pt-4">
              {currentPlan.features.map(f => (
                <div key={f} className="flex items-center space-x-3">
                  <Check className="h-4 w-4 text-white/40" />
                  <span className="text-xs font-bold text-white/90">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 pt-8">
            <div className="flex items-baseline space-x-2">
              <span className="text-5xl font-black">{currentPlan.price}</span>
              <span className="text-white/40 font-bold text-sm">/{currentPlan.period}</span>
            </div>
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-4">Safe Institutional Billing Environment</p>
          </div>
        </div>

        {/* Right: Payment/Interaction */}
        <div className="md:w-7/12 p-8 md:p-12 bg-white flex flex-col">
          <div className="hidden md:flex justify-end mb-6">
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>

          {isSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 animate-in slide-in-from-bottom duration-500">
               <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <Check className="h-10 w-10" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 uppercase italic">Verification Pending</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm">
                    Thank you! Our institutional audit team will verify your transaction and activate your {currentPlan.name} status within 15 minutes.
                  </p>
               </div>
               <button 
                 onClick={onClose}
                 className="px-12 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
               >
                 Go Back to Terminal
               </button>
            </div>
          ) : step === 'plan' ? (
            <div className="flex-1 flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-right duration-500">
               <div className="space-y-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Step 1: Choose Your Edge</span>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight uppercase italic">Select Your Access Tier</h3>
               </div>

               <div className="space-y-4">
                  {plans.map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id as any)}
                      className={`w-full p-6 rounded-3xl border-2 text-left transition-all flex items-center justify-between ${selectedPlan === p.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{p.name}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.id === 'pro' ? 'Structural Patterns' : 'All Institutional Strategies'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-slate-900 block">{p.price}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Monthly</span>
                      </div>
                    </button>
                  ))}
               </div>

               <button 
                 onClick={() => setStep('payment')}
                 className="w-full py-5 bg-blue-600 text-white rounded-3xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center space-x-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-blue-200"
               >
                 <span>Proceed to Secure Payment</span>
                 <ChevronRight className="h-4 w-4" />
               </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-right duration-500">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Step 2: Instant Transfer</span>
                     <h3 className="text-2xl font-black text-slate-900 uppercase italic">Scan & Pay via UPI</h3>
                  </div>
                  <button onClick={() => setStep('plan')} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-900">Change Plan</button>
               </div>

               <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="w-40 h-40 bg-white p-3 rounded-2xl shadow-inner flex items-center justify-center border border-slate-200">
                     {/* QR Code Placeholder - In production, use a real QR lib or generated URL */}
                     <div className="text-center space-y-2">
                        <QrCode className="h-20 w-20 text-slate-900 mx-auto" />
                        <span className="text-[8px] font-black text-slate-400 uppercase block tracking-tighter">Your Institutional QR</span>
                     </div>
                  </div>
                  <div className="space-y-4 flex-1">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">UPI ID</span>
                        <p className="text-sm font-black text-slate-900 select-all">mbeacon.pay@okaxis</p>
                     </div>
                     <div className="space-y-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Amount Due</span>
                        <p className="text-2xl font-black text-blue-600">{currentPlan.price}</p>
                     </div>
                  </div>
               </div>

               <form onSubmit={handleSubmitTransaction} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">UTR / Transaction ID</label>
                     <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <input 
                           type="text" 
                           placeholder="Enter 12-digit number"
                           required
                           value={transactionId}
                           onChange={(e) => setTransactionId(e.target.value)}
                           className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-black focus:border-blue-600 focus:bg-white transition-all outline-none"
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                     <button 
                        type="submit"
                        disabled={isSubmitting || !transactionId}
                        className="py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
                     >
                        <Send className="h-4 w-4" />
                        <span>{isSubmitting ? 'Verifying...' : 'Submit ID'}</span>
                     </button>
                     <button 
                        type="button"
                        onClick={openWhatsApp}
                        className="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 transition-all hover:bg-emerald-700"
                     >
                        <MessageSquare className="h-4 w-4" />
                        <span>Proof via WA</span>
                     </button>
                  </div>
               </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
