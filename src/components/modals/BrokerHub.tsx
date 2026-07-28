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
  Database
} from 'lucide-react';
import Papa from 'papaparse';

interface BrokerHubProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (holdings: Array<Record<string, unknown>>, mode: 'merge' | 'overwrite') => void;
}

const BROKERS = [
  { id: 'zerodha', name: 'Zerodha', color: 'bg-orange-50', logo: 'https://v1.zerodha.com/static/images/logo.svg' },
  { id: 'angelone', name: 'Angel One', color: 'bg-blue-50', logo: 'https://www.angelone.in/static/images/logo.svg' },
  { id: 'upstox', name: 'Upstox', color: 'bg-purple-50', logo: 'https://upstox.com/static/images/logo.svg' },
  { id: 'dhan', name: 'Dhan', color: 'bg-emerald-50', logo: 'https://dhan.co/wp-content/uploads/2021/08/dhan-logo.svg' },
  { id: 'paytm', name: 'Paytm Money', color: 'bg-sky-50', logo: 'https://www.paytmmoney.com/static/images/pm-logo.svg' },
  { id: 'hdfc', name: 'HDFC SKY', color: 'bg-slate-50', logo: 'https://www.hdfcsky.com/static/images/logo.svg' },
  { id: '5paisa', name: '5paisa', color: 'bg-red-50', logo: 'https://www.5paisa.com/static/images/logo.svg' },
  { id: 'motilal', name: 'Motilal Oswal', color: 'bg-amber-50', logo: 'https://www.motilaloswal.com/static/images/logo.svg' },
  { id: 'iifl', name: 'IIFL Capital', color: 'bg-blue-50', logo: 'https://www.iifl.com/static/images/logo.svg' },
  { id: 'fisdom', name: 'Fisdom', color: 'bg-cyan-50', logo: 'https://www.fisdom.com/static/images/logo.svg' },
  { id: 'trustline', name: 'Trustline', color: 'bg-indigo-50', logo: 'https://www.trustline.in/static/images/logo.svg' },
  { id: 'other', name: 'Other / CSV', color: 'bg-slate-100', logo: '' }
];

const BrokerHub: React.FC<BrokerHubProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'upload'>('selection');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');

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
          const rawData = results.data as Record<string, unknown>[];
          
          const mappedHoldings = rawData.map(row => {
            const keys = Object.keys(row);
            
            // Normalize Symbol (Look for Name, Script Name, Symbol, Instrument)
            const symbolKey = keys.find(k => /name|script name|symbol|instrument|ticker|tradingsymbol/i.test(k.trim()));
            let symbol = symbolKey ? (row[symbolKey] || '').toString() : '';
            
            symbol = symbol.split(':')[1] || symbol; // Handle "NSE:SYMBOL"
            symbol = symbol.replace(/\.NS|\.BO/g, '').trim().toUpperCase();
            
            // If it's a full name with spaces, take the first word as symbol
            if (symbol.includes(' ')) symbol = symbol.split(' ')[0];

            // Normalize Quantity
            const qtyKey = keys.find(k => /qty|quantity|holdings|net qty/i.test(k.trim()));
            const quantity = qtyKey ? parseFloat((row[qtyKey] || '0').toString().replace(/,/g, '')) : 0;

            // Normalize Avg Price
            const priceKey = keys.find(k => /avg\. price|avg|average|cost|buy price|avg unit cost/i.test(k.trim()));
            const buyPrice = priceKey ? parseFloat((row[priceKey] || '0').toString().replace(/,/g, '')) : 0;

            return { symbol, quantity, buyPrice };
          }).filter(h => h.symbol && h.quantity > 0 && !['EQUITY'].includes(h.symbol));

          if (mappedHoldings.length === 0) {
            throw new Error("Could not detect holdings data. Please ensure the CSV has Symbol and Quantity columns.");
          }

          onImportComplete(mappedHoldings, importMode);
          setStep('selection');
          onClose();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Failed to parse file.");
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" tabIndex={-1} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 max-h-[90vh]">
        
        {/* Header: Unified Brand Side */}
        <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden shrink-0">
           <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/20 blur-[80px] -mr-24 -mt-24" />
           <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10">
                    <Globe className="h-5 w-5 text-blue-400" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold tracking-tight uppercase italic leading-none">Broker Hub</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Institutional Import</p>
                 </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                 <X className="h-5 w-5" />
              </button>
           </div>
        </div>

        {/* Content Side */}
        <div className="bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
           {step === 'upload' && (
              <button 
                onClick={() => setStep('selection')}
                className="text-caption text-blue-600 flex items-center mb-6 hover:translate-x-[-4px] transition-transform"
              >
                <ChevronRight className="h-3 w-3 rotate-180 mr-1" /> Back to Selection
              </button>
           )}

           {step === 'selection' ? (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="mb-6">
                    <h3 className="text-lg font-bold text-slate-900 uppercase italic leading-none">Select Broker</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">Choose your environment to import holdings</p>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 custom-scrollbar pb-2">
                    {BROKERS.map(broker => (
                       <button 
                          key={broker.id}
                          onClick={() => {
                            setSelectedBroker(broker.id);
                            setStep('upload');
                          }}
                          className="flex flex-col items-center justify-center p-4 rounded-3xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-50 transition-all group aspect-square space-y-3 relative overflow-hidden"
                       >
                          <div className="w-full h-10 flex items-center justify-center transition-transform group-hover:scale-110">
                             {broker.logo ? (
                                <img 
                                  src={broker.logo} 
                                  alt={broker.name} 
                                  loading="lazy" decoding="async"
                                  className="max-w-[75%] max-h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
                   onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const fallback = document.createElement('div');
                                    fallback.className = `w-10 h-10 rounded-xl ${broker.color} flex items-center justify-center font-bold text-slate-500 uppercase text-xs`;
                                    fallback.innerText = broker.name[0];
                                    (e.target as HTMLImageElement).parentElement!.appendChild(fallback);
                                 }}
                               />
                             ) : (
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 <Database className="h-5 w-5" />
                               </div>
                             )}
                          </div>
                          <span className="text-xs font-bold text-slate-900 uppercase tracking-tight text-center">{broker.name}</span>
                          {broker.id === 'other' && <div className="absolute top-2 right-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-bold rounded-full uppercase">Universal</div>}
                       </button>
                    ))}
                 </div>
              </div>
           ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-2">
                 <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1.2rem] flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6" />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 uppercase italic leading-none">{BROKERS.find(b => b.id === selectedBroker)?.name}</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider max-w-[240px] mx-auto leading-relaxed">
                       Drop your holdings CSV file here to start institutional audit.
                    </p>
                 </div>

                 <div className="w-full max-w-sm space-y-4">
                    {/* Import Strategy Options */}
                    <div className="flex flex-col space-y-2 text-left">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Import Strategy</span>
                       <div className="grid grid-cols-1 gap-2.5">
                          {/* Merge Option */}
                          <button 
                            type="button"
                            onClick={() => setImportMode('merge')}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start space-x-3 outline-none ${
                              importMode === 'merge' 
                                ? 'bg-blue-50/45 border-blue-500 ring-2 ring-blue-500/10' 
                                : 'bg-slate-50 border-slate-100 hover:bg-slate-100/30'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              importMode === 'merge' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}>
                              {importMode === 'merge' && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Merge Portfolio</span>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-normal">
                                Keep current positions and merge the newly uploaded holdings.
                              </span>
                            </div>
                          </button>

                          {/* Overwrite Option */}
                          <button 
                            type="button"
                            onClick={() => setImportMode('overwrite')}
                            className={`p-3.5 rounded-2xl border text-left transition-all flex items-start space-x-3 outline-none ${
                              importMode === 'overwrite' 
                                ? 'bg-rose-50/45 border-rose-500 ring-2 ring-rose-500/10' 
                                : 'bg-slate-50 border-slate-100 hover:bg-slate-100/30'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                              importMode === 'overwrite' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                            }`}>
                              {importMode === 'overwrite' && <Check className="h-2.5 w-2.5" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Remove Old & Upload New</span>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5 leading-normal">
                                Delete all existing positions and upload new holdings.
                              </span>
                            </div>
                          </button>
                       </div>
                    </div>

                    <label className="relative block group cursor-pointer">
                       <input 
                         type="file" 
                         accept=".csv" 
                         onChange={handleFileUpload}
                         className="hidden"
                       />
                       <div className="py-6 border-2 border-dashed border-slate-200 rounded-[2rem] group-hover:border-blue-400 group-hover:bg-blue-50/30 transition-all flex flex-col items-center space-y-2">
                          <Upload className={`h-6 w-6 ${isParsing ? 'animate-bounce text-blue-600' : 'text-slate-300'}`} />
<span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              {isParsing ? 'Processing...' : 'Select CSV'}
                           </span>
                       </div>
                    </label>

                    {error && (
                       <div className="p-3 bg-red-50 rounded-2xl flex items-start space-x-2 text-left border border-red-100">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                          <p className="text-caption text-red-600 uppercase leading-relaxed">{error}</p>
                       </div>
                    )}
                 </div>

                 <div className="mt-8 flex flex-col items-center space-y-1 text-slate-300">
                    <div className="flex items-center space-x-2">
                       <ShieldCheck className="h-3 w-3" />
                       <span className="text-caption">Local-Only Secure Parsing</span>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BrokerHub;
