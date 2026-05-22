import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  ShieldCheck, 
  ChevronRight, 
  FileText, 
  AlertCircle, 
  Check,
  Globe,
  Database,
  RefreshCw
} from 'lucide-react';
import Papa from 'papaparse';

interface BrokerHubProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (holdings: any[]) => void;
}

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', color: 'bg-orange-500' },
  { id: 'angelone', name: 'Angel One', color: 'bg-blue-600' },
  { id: 'upstox', name: 'Upstox', color: 'bg-purple-600' },
  { id: 'dhan', name: 'Dhan', color: 'bg-emerald-500' },
  { id: 'paytm', name: 'Paytm Money', color: 'bg-sky-500' },
  { id: 'hdfc', name: 'HDFC SKY', color: 'bg-slate-900' },
  { id: '5paisa', name: '5paisa', color: 'bg-red-500' },
  { id: 'motilal', name: 'Motilal Oswal', color: 'bg-amber-600' },
  { id: 'iifl', name: 'IIFL Capital', color: 'bg-blue-900' },
  { id: 'fisdom', name: 'Fisdom', color: 'bg-cyan-600' },
  { id: 'trustline', name: 'Trustline', color: 'bg-indigo-600' }
];

const BrokerHub: React.FC<BrokerHubProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'upload'>('selection');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as any[];
          
          // Universal Mapper: Attempt to find Symbol, Qty, and Price regardless of broker format
          const mappedHoldings = rawData.map(row => {
            const keys = Object.keys(row);
            
            // Normalize Symbol
            const symbolKey = keys.find(k => /symbol|instrument|ticker|tradingsymbol/i.test(k));
            let symbol = symbolKey ? row[symbolKey].toString().split(':')[1] || row[symbolKey].toString() : '';
            // Clean symbol (remove .NS, .BO, etc)
            symbol = symbol.replace(/\.NS|\.BO/g, '').trim().toUpperCase();

            // Normalize Quantity
            const qtyKey = keys.find(k => /qty|quantity|holdings|net qty/i.test(k));
            const quantity = qtyKey ? parseFloat(row[qtyKey].toString().replace(/,/g, '')) : 0;

            // Normalize Avg Price
            const priceKey = keys.find(k => /avg|average|cost|buy price/i.test(k));
            const buyPrice = priceKey ? parseFloat(row[priceKey].toString().replace(/,/g, '')) : 0;

            return { symbol, quantity, buyPrice };
          }).filter(h => h.symbol && h.quantity > 0);

          if (mappedHoldings.length === 0) {
            throw new Error("Could not detect holdings data. Please ensure the CSV has Symbol and Quantity columns.");
          }

          onImportComplete(mappedHoldings);
          setStep('selection');
          onClose();
        } catch (err: any) {
          setError(err.message || "Failed to parse file.");
        } finally {
          setIsParsing(false);
        }
      },
      error: () => {
        setError("Error reading CSV file.");
        setIsParsing(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[90vh]">
        
        {/* Left: Brand Side */}
        <div className="md:w-5/12 bg-slate-900 p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 blur-[80px] -ml-24 -mb-24" />
           
           <div className="relative z-10 space-y-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                 <Globe className="h-7 w-7 text-blue-400" />
              </div>
              <div className="space-y-2">
                 <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase italic leading-none">Broker Hub</h2>
                 <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">Institutional Data Import</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/10">
                 <div className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">Automatic Symbol Mapping</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">Multi-Broker CSV Support</span>
                 </div>
                 <div className="flex items-center space-x-3">
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-300">Real-time Portfolio Audit</span>
                 </div>
              </div>
           </div>

           <div className="relative z-10 pt-10">
              <div className="flex items-center space-x-3 text-blue-400">
                 <ShieldCheck className="h-5 w-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Bank-Grade Privacy</span>
              </div>
              <p className="text-[8px] text-slate-500 mt-2 leading-relaxed">Your broker data is parsed locally in your browser. MarketBeacon never stores your sensitive login credentials.</p>
           </div>
        </div>

        {/* Right: Interaction Side */}
        <div className="md:w-7/12 bg-white p-6 md:p-10 flex flex-col overflow-y-auto">
           <div className="flex justify-between items-center mb-8">
              <button 
                onClick={() => setStep('selection')}
                className={`text-[9px] font-black uppercase tracking-widest transition-all ${step === 'upload' ? 'text-blue-600 flex items-center' : 'opacity-0 pointer-events-none'}`}
              >
                <ChevronRight className="h-3 w-3 rotate-180 mr-1" /> Back
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                 <X className="h-5 w-5" />
              </button>
           </div>

           {step === 'selection' ? (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-500">
                 <div className="mb-8">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic leading-none">Select Broker</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Import holdings to start audit</p>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                    {BROKERS.map(broker => (
                       <button 
                         key={broker.id}
                         onClick={() => {
                           setSelectedBroker(broker.id);
                           setStep('upload');
                         }}
                         className="flex flex-col items-center justify-center p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50 transition-all group aspect-square space-y-3"
                       >
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl ${broker.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                             <Database className="h-5 w-5 md:h-6 md:w-6" />
                          </div>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight text-center">{broker.name}</span>
                       </button>
                    ))}
                 </div>
              </div>
           ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-right duration-500">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6">
                    <FileText className="h-10 w-10" />
                 </div>
                 
                 <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 uppercase italic">Upload CSV</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">
                       Download your holdings CSV from {BROKERS.find(b => b.id === selectedBroker)?.name} and drop it here.
                    </p>
                 </div>

                 <div className="w-full max-w-sm space-y-4">
                    <label className="relative block group cursor-pointer">
                       <input 
                         type="file" 
                         accept=".csv" 
                         onChange={handleFileUpload}
                         className="hidden"
                       />
                       <div className="py-8 border-2 border-dashed border-slate-200 rounded-[2rem] group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all flex flex-col items-center space-y-3">
                          <Upload className={`h-8 w-8 ${isParsing ? 'animate-bounce text-blue-600' : 'text-slate-300'}`} />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                             {isParsing ? 'Reading Holdings...' : 'Choose CSV File'}
                          </span>
                       </div>
                    </label>

                    {error && (
                       <div className="p-4 bg-red-50 rounded-2xl flex items-start space-x-3 text-left">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-[10px] font-bold text-red-600 uppercase leading-relaxed">{error}</p>
                       </div>
                    )}
                 </div>

                 <div className="mt-10 flex flex-col items-center space-y-2 text-slate-400">
                    <div className="flex items-center space-x-2">
                       <RefreshCw className="h-3 w-3" />
                       <span className="text-[9px] font-black uppercase tracking-widest">Local Engine v1.0</span>
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-tighter">Mapped Columns: Instrument, Qty, Avg Cost</p>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BrokerHub;
