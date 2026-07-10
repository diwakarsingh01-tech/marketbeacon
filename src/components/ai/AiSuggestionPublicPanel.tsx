import React, { useState } from 'react';
import { Bot, Sparkles, Loader2, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getApiUrl, safeJsonParse } from '../../lib/api-utils';

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
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      <h2 className="text-3xl font-black text-white italic tracking-tighter">BeaconAI <span className="text-emerald-500">Analysis.</span></h2>
      <div className="bg-[#0f172a]/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/5 blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        
        {!analysis && !loading && !error && (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex items-center justify-center">
              <Bot className="h-7 w-7 text-emerald-400" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <p className="text-lg font-black text-white uppercase tracking-tighter">BeaconAI Analysis</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Run the MarketBeacon Pro strategy alignment check on {symbol}. 
                This is an educational tool — no buy/sell advice.
              </p>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Run Strategy Alignment</>
              )}
            </button>
          </div>
        )}

        {loading && !analysis && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-slate-500">BeaconAI analyzing {symbol}...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 space-y-4">
            <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
            <p className="text-xs text-amber-400">{error}</p>
            <button onClick={runAnalysis} className="text-xs text-emerald-400 hover:text-emerald-300 underline">Retry</button>
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
                <p className="text-xs text-slate-500">{analysis.reason || ''}</p>
              </div>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.06] transition-all"
            >
              <span className="text-sm font-bold text-white uppercase tracking-tighter">Fundamental Scorecard</span>
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
                  <div className="space-y-2 bg-white/[0.02] rounded-2xl p-5 border border-white/5">
                    {Object.entries(analysis.fundamentalScorecard).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{val.value}</span>
                          {val.pass ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Alignment</p>
              <p className="text-sm text-slate-300">{analysis.technicalAlignment || 'None'}</p>
            </div>

            {analysis.executionPlan && (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Execution Plan</p>
                <p className="text-sm text-slate-300">{analysis.executionPlan}</p>
              </div>
            )}

            <p className="text-[10px] text-slate-600 italic leading-relaxed text-center">
              {analysis.disclaimer || 'Educational analysis only. Not SEBI-registered advice.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default AiSuggestionPublicPanel;
