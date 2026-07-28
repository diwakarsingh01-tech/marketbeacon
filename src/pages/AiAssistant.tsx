import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, Send, User, ArrowLeft
} from 'lucide-react';
import { getApiUrl, safeJsonParse, getAuthHeaders } from '../lib/api-utils';
import SEO from '../components/SEO';

const API_URL = getApiUrl();

interface Message {
  role: 'user' | 'assistant';
  content: string;
  analysis?: any;
}

const QUICK_ACTIONS = [
  { label: 'Analyze RELIANCE', query: 'Can you analyze RELIANCE for Hemant Jain swing trading strategy?' },
  { label: 'Analyze TCS', query: 'Can you analyze TCS for Hemant Jain swing trading strategy?' },
  { label: 'Analyze HDFCBANK', query: 'Can you analyze HDFCBANK for Hemant Jain swing trading strategy?' },
  { label: 'What is ABCD averaging?', query: 'What is ABCD averaging and how does it work?' },
];

const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      document.cookie = `mb_auth=${token}; path=/; max-age=604800`;
      window.history.replaceState({}, '', window.location.pathname);
      window.location.reload();
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `# BeaconAI — MarketBeacon Pro Strategy Assistant

I analyze stocks using **MarketBeacon Pro's proprietary Multi-List Swing Trading Methodology**. I provide strategy alignment reports, not financial advice.

**How I can help:**
- Ask me to analyze any NSE stock (e.g., "Analyze RELIANCE")
- Ask about swing trading concepts
- I will never give a buy/sell verdict

> ⚠️ *I am an educational AI, not a SEBI-registered advisor.*`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (overrideMessage?: string) => {
    const msg = (overrideMessage || input).trim();
    if (!msg || isLoading) return;

    setShowQuickActions(false);
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const isAnalysisQuery = msg.toLowerCase().includes('analyze') ||
        /\b[A-Z]{2,}\b/.test(msg.split(' ').filter(w => w === w.toUpperCase() && w.length >= 2).join(''));

      if (isAnalysisQuery) {
        const symbolMatch = msg.match(/\b[A-Z]{2,}\b/);
        const symbol = symbolMatch ? symbolMatch[0] : '';

        if (symbol) {
          const res = await fetch(`${API_URL}/api/ai/analyze-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ symbol })
          });
          const data = await safeJsonParse(res);

          if (data?.error) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
          } else {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: formatAnalysisReport(data),
              analysis: data
            }]);
          }
        } else {
          const res = await fetch(`${API_URL}/api/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              message: msg,
              history: messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
            })
          });
          const data = await safeJsonParse(res);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data?.reply || 'Sorry, I could not process that request.'
          }]);
        }
      } else {
        const res = await fetch(`${API_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            message: msg,
            history: messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }))
          })
        });
        const data = await safeJsonParse(res);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data?.reply || 'Sorry, I could not process that request.'
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error. Please check your connection and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnalysisReport = (data: any): string => {
    if (!data) return 'No analysis data available.';
    const scorecard = data.fundamentalScorecard;
    const status = data.finalStatus || 'FAILS STRATEGY';

    let report = `${data.disclaimer || ''}\n\n`;
    report += `## Strategy Alignment Report\n\n`;
    report += `### Fundamental Scorecard\n\n`;
    if (scorecard) {
      report += `| Parameter | Value | Status |\n`;
      report += `|---|---|---|\n`;
      Object.entries(scorecard).forEach(([key, val]: [string, any]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
        report += `| ${label} | ${val.value || '-'} | ${val.pass ? '✅ Pass' : '❌ Fail'} |\n`;
      });
    }

    report += `\n### Technical Alignment\n`;
    report += `${data.technicalAlignment || 'None identified'}\n\n`;

    if (data.executionPlan) {
      report += `### Execution Plan\n`;
      report += `${data.executionPlan}\n\n`;
    }

    report += `### Final Verdict\n\n`;
    report += `**${status}**\n\n`;
    report += `${data.reason || ''}\n\n`;
    report += `> ⚠️ This is a strategy alignment analysis, NOT a buy/sell recommendation.`;

    return report;
  };

  return (
    <div className="flex-1 flex flex-col font-sans text-[var(--text-secondary)] bg-[var(--bg-primary)] h-full overflow-hidden">
      <SEO title="BeaconAI Strategy Assistant" description="AI-powered stock analysis using MarketBeacon Pro swing trading methodology" />

      {/* Header */}
      <div className="bg-[var(--bg-primary)]/95 backdrop-blur-md border-b border-[var(--border-primary)] py-4 shrink-0">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/screener')}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-2 text-xs font-bold uppercase tracking-wider group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="w-px h-6 bg-[var(--border-primary)]" />
            <div className="p-2.5 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-xl">
              <Bot className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">BeaconAI</h1>
              <p className="text-xs text-[var(--text-tertiary)] font-medium">MarketBeacon Pro Strategy Assistant</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Gemini 2.0 Flash
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="p-2 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-xl h-fit shrink-0 mt-1">
                  <Bot className="h-4 w-4 text-emerald-400" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-600/20 border border-blue-500/30 rounded-2xl rounded-tr-md px-4 py-3'
                  : 'bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl rounded-tl-md px-4 py-3'
              }`}>
                <div className="prose prose-sm prose-invert max-w-none">
                  {msg.role === 'assistant' ? (
                    <div className="markdown-content text-xs leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({ children }) => <h2 className="text-sm font-bold text-blue-400 mt-4 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mt-3 mb-2">{children}</h3>,
                          table: ({ children }) => <table className="w-full text-xs border-collapse mb-3">{children}</table>,
                          th: ({ children }) => <th className="text-left text-[var(--text-tertiary)] font-bold uppercase tracking-wider pb-2 border-b border-[var(--border-primary)]/50 pr-3">{children}</th>,
                          td: ({ children }) => <td className="py-1.5 pr-3 border-b border-[var(--border-primary)]/20 text-[var(--text-primary)]">{children}</td>,
                          strong: ({ children }) => <strong className="text-blue-400">{children}</strong>,
                          em: ({ children }) => <em className="text-[var(--text-tertiary)]">{children}</em>,
                          blockquote: ({ children }) => <blockquote className="border-l-2 border-emerald-500/30 pl-3 text-[var(--text-tertiary)] italic my-2">{children}</blockquote>,
                          p: ({ children }) => <p className="text-[var(--text-primary)] mb-2 last:mb-0">{children}</p>,
                          code: ({ children }) => <code className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-[10px]">{children}</code>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-[var(--text-primary)]">{children}</li>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-primary)]">{msg.content}</p>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="p-2 bg-blue-600/20 border border-blue-500/30 rounded-xl h-fit shrink-0 mt-1">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="p-2 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/20 rounded-xl">
                <Bot className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {showQuickActions && messages.length === 1 && (
        <div className="max-w-4xl mx-auto px-6 pb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={i}
                onClick={() => handleSend(action.query)}
                className="p-3 bg-[var(--bg-secondary)]/60 border border-[var(--border-primary)] rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-left group"
              >
                <span className="text-xs font-medium text-[var(--text-tertiary)] group-hover:text-emerald-400 transition-colors">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/95 backdrop-blur-md shrink-0">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="              Ask BeaconAI about any stock (e.g., 'Analyze RELIANCE')..."
              className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] outline-none focus:border-emerald-500/50 placeholder:text-[var(--text-muted)] transition-colors"
              disabled={isLoading}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 disabled:opacity-30 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[var(--text-muted)] text-center">
            BeaconAI is an educational tool. Not SEBI-registered. No buy/sell advice.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPage;
