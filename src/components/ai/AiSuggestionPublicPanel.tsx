import React, { useState } from 'react';
import { Bot, Sparkles, Loader2, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl, safeJsonParse, getAuthHeaders } from '../../lib/api-utils';

const API_URL = getApiUrl();

interface Props {
  symbol: string;
}

const AiSuggestionPublicPanel: React.FC<Props> = ({ symbol }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ai/analyze-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ symbol })
      });
      const data = await safeJsonParse(res);
      if (data?.error) {
        setError(data.error);
      } else {
        setAnalysis(data);
        setExpanded(true);
      }
    } catch (e) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isPass = analysis?.finalStatus === 'PASSES STRATEGY';

  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-black text-white italic tracking-tighter">
        BeaconAI <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Analysis.</span>
      </h2>
      <div className="relative group rounded-[2.5rem] p-[1px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-indigo-500/20 shadow-2xl">
        <div className="bg-[#0b0f19]/95 backdrop-blur-3xl rounded-[2.45rem] p-8 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
          
          {!analysis && !loading && !error && (
            <div className="text-center space-y-6 py-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center relative shadow-lg shadow-emerald-500/5">
                <Bot className="h-7 w-7 text-emerald-400" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div className="space-y-2 max-w-lg mx-auto">
                <p className="text-lg font-black text-white uppercase tracking-tighter">BeaconAI Strategy Alignment</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Run the MarketBeacon Pro strategy alignment check on {symbol}. 
                  This is an educational tool — no buy/sell advice.
                </p>
              </div>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 hover:scale-[1.03] active:scale-95 shadow-xl shadow-cyan-500/10"
              >
                <Sparkles className="h-4 w-4 text-slate-950" /> Run Strategy Alignment
              </button>
            </div>
          )}

          {loading && !analysis && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">BeaconAI analyzing {symbol}...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-8 space-y-4">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-400 font-medium">{error}</p>
              <button onClick={runAnalysis} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white uppercase transition-all">Retry</button>
            </div>
          )}

          {analysis && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className={`flex items-center gap-4 p-5 rounded-2xl ${
                isPass ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                {isPass ? (
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <p className={`text-lg font-black uppercase tracking-tighter ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analysis.finalStatus || 'FAILS STRATEGY'}
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">{analysis.reason || ''}</p>
                </div>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/[0.04] transition-all"
              >
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Fundamental Scorecard</span>
                {expanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
              </button>

              <AnimatePresence>
                {expanded && analysis.fundamentalScorecard && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 rounded-2xl p-6">
                      {Object.entries(analysis.fundamentalScorecard).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between p-3.5 bg-[#080d1a] border border-white/5 rounded-xl hover:border-cyan-500/20 transition-all">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{val.value}</span>
                            {val.pass ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-450 shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-5 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Technical Alignment</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{analysis.technicalAlignment || 'None'}</p>
              </div>

              {analysis.executionPlan && (
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl space-y-1">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Execution Plan</p>
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">{analysis.executionPlan}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-600 italic leading-relaxed text-center">
                {analysis.disclaimer || 'Educational analysis only. Not SEBI-registered advice.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default AiSuggestionPublicPanel;
