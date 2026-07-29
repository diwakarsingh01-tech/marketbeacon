import React, { useState } from 'react';
import { Bot, Sparkles, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getApiUrl, safeJsonParse } from '../../lib/api-utils';

const API_URL = getApiUrl();

interface AiSuggestionPanelProps {
  symbol: string;
  basket?: string;
}

const AiSuggestionPanel: React.FC<AiSuggestionPanelProps> = ({ symbol, basket }) => {
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
        body: JSON.stringify({ symbol, basket })
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
    <div className="relative group rounded-2xl p-[1px] bg-gradient-to-r from-emerald-500/20 via-cyan-500/10 to-indigo-500/20 shadow-xl">
      <div className="bg-[#0b0f19]/95 backdrop-blur-xl rounded-[15px] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 border border-emerald-500/20 rounded-lg relative">
              <Bot className="h-3.5 w-3.5 text-emerald-400" />
              <span className="absolute top-0 right-0 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
              </span>
            </div>
            <span className="text-xs font-bold text-white uppercase tracking-wider">BeaconAI Analysis</span>
          </div>
          {analysis && (
            <Link
              to={`/ai-assistant?s=${symbol}`}
              className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              Full Chat <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>

        <div className="p-5">
          {!analysis && !loading && !error && (
            <div className="text-center space-y-4 py-2">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-600/10 to-cyan-600/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/5">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Strategy Alignment Check</p>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-[220px] mx-auto">
                  Run the MarketBeacon Pro quantitative filter to check institutional setups for {symbol}.
                </p>
              </div>
              <button
                onClick={runAnalysis}
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500 hover:from-emerald-450 hover:to-blue-400 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/10 flex items-center gap-2 mx-auto"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-950 animate-pulse" /> Run Alignment
              </button>
            </div>
          )}

          {loading && !analysis && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">Analyzing {symbol} metrics...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-4 space-y-3">
              <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
              <p className="text-xs text-amber-400 font-medium">{error}</p>
              <button onClick={runAnalysis} className="text-xs text-cyan-400 hover:text-cyan-300 underline font-bold">Retry</button>
            </div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Pass/Fail Badge */}
              <div className={`flex items-center gap-3 p-3.5 rounded-xl ${
                isPass ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
              }`}>
                {isPass ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <p className={`text-xs font-black uppercase tracking-wider ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analysis.finalStatus || 'FAILS STRATEGY'}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">{analysis.reason || ''}</p>
                </div>
              </div>

              {/* Scorecard toggle */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all"
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fundamental Scorecard</span>
                {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
              </button>

              <AnimatePresence>
                {expanded && analysis.fundamentalScorecard && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1.5 pl-1">
                      {Object.entries(analysis.fundamentalScorecard).map(([key, val]: [string, any]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-white">{val.value}</span>
                            {val.pass ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-rose-450" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Technical alignment */}
              <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-xl space-y-0.5">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Technical Alignment</p>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{analysis.technicalAlignment || 'None'}</p>
              </div>

              {/* Execution plan */}
              {analysis.executionPlan && (
                <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-0.5">
                  <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Execution Plan</p>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">{analysis.executionPlan}</p>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-[8.5px] text-slate-600 italic leading-normal text-center">
                {analysis.disclaimer || 'Educational analysis only. Not SEBI-registered advice.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiSuggestionPanel;
