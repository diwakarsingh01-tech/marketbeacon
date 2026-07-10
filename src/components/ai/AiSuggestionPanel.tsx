import React, { useState } from 'react';
import { Bot, Sparkles, ChevronDown, ChevronUp, Loader2, AlertTriangle, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getApiUrl, safeJsonParse } from '../../lib/api-utils';

const API_URL = getApiUrl();

interface AiSuggestionPanelProps {
  symbol: string;
}

const AiSuggestionPanel: React.FC<AiSuggestionPanelProps> = ({ symbol }) => {
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
    <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-lg">
            <Bot className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">BeaconAI Analysis</span>
        </div>
        {analysis && (
          <Link
            to={`/ai-assistant?s=${symbol}`}
            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            Full Chat <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>

      <div className="p-5">
        {!analysis && !loading && !error && (
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)] mb-1">BeaconAI Strategy Alignment</p>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                Run the MarketBeacon Pro strategy alignment check on {symbol}. 
                No buy/sell advice — purely educational.
              </p>
            </div>
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Run Strategy Alignment</>
              )}
            </button>
          </div>
        )}

        {loading && !analysis && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto" />
              <p className="text-xs text-[var(--text-tertiary)]">BeaconAI analyzing {symbol}...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-4 space-y-3">
            <AlertTriangle className="h-6 w-6 text-amber-400 mx-auto" />
            <p className="text-xs text-amber-400">{error}</p>
            <button onClick={runAnalysis} className="text-xs text-emerald-400 hover:text-emerald-300 underline">Retry</button>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Pass/Fail Badge */}
            <div className={`flex items-center gap-2 p-3 rounded-xl ${
              isPass ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              {isPass ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <div>
                <p className={`text-xs font-bold ${isPass ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {analysis.finalStatus || 'FAILS STRATEGY'}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{analysis.reason || ''}</p>
              </div>
            </div>

            {/* Scorecard toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between p-3 bg-[var(--bg-primary)]/40 border border-[var(--border-primary)] rounded-xl hover:border-emerald-500/30 transition-all"
            >
              <span className="text-xs font-bold text-[var(--text-primary)]">Fundamental Scorecard</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5 text-[var(--text-muted)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
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
                      <div key={key} className="flex items-center justify-between py-1.5 border-b border-[var(--border-primary)]/30">
                        <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[var(--text-primary)]">{val.value}</span>
                          {val.pass ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-rose-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Technical alignment */}
            <div className="p-3 bg-[var(--bg-primary)]/30 border border-[var(--border-primary)] rounded-xl">
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Technical Alignment</p>
              <p className="text-xs text-[var(--text-secondary)]">{analysis.technicalAlignment || 'None'}</p>
            </div>

            {/* Execution plan */}
            {analysis.executionPlan && (
              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Execution Plan</p>
                <p className="text-xs text-[var(--text-secondary)]">{analysis.executionPlan}</p>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">
              {analysis.disclaimer || 'Educational analysis only. Not SEBI-registered advice.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiSuggestionPanel;
