import React, { useState } from 'react';
import { 
  BookOpen, 
  Target, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  Layers,
  BarChart3,
  Calendar,
  AlertTriangle,
  Zap
} from 'lucide-react';

const StrategyEducation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('fundamentals');

  const strategies = [
    {
      id: 'fundamentals',
      title: 'Batch 9 Fundamentals',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      content: {
        logic: 'Quality filter applied before technical scanning.',
        checks: [
          'PE < 75: Avoid overvaluation traps.',
          'ROE > 12%: Focus on profitable businesses.',
          'Debt to Equity < 0.25: Financial resilience (Excl. BFSI).',
          'Market Cap > 1,000 Cr: Stability and scale.'
        ],
        drawdown: 'Large Cap (20-30%), Mid Cap (35-50%), Small Cap (50-70%)'
      }
    },
    {
      id: 'envelope',
      title: 'Institutional Floor',
      icon: Target,
      color: 'text-blue-600',
      content: {
        logic: 'Identifies institutional demand zones based on statistical deviation benchmarks.',
        entry: 'Price touches or closes near the lower research boundary.',
        exit: 'Model Objective is the mathematical recovery to the upper benchmark.',
        tranches: 'Accumulation starts at Tranche A, with B/C/D laddering if price falls further.'
      }
    },
    {
      id: 'short_envelope',
      title: 'Momentum Ceiling',
      icon: TrendingUp,
      color: 'text-indigo-600',
      content: {
        logic: 'Participation model for stocks in strong primary uptrends.',
        entry: 'Research entry at the secondary regression line (EMA 200).',
        exit: 'Model Objective is a +14% recovery move.',
        notes: 'Focused on high-momentum names that rarely revisit deep discount zones.'
      }
    },
    {
      id: 'bollinger',
      title: 'Volatility Channel',
      icon: BarChart3,
      color: 'text-emerald-600',
      content: {
        logic: 'Mean-reversion model based on statistical volatility boundaries.',
        entry: 'Price reaches the lower volatility research band.',
        exit: 'Model Objective is the upper volatility benchmark.',
        risk: 'Risk is managed by verifying a narrow low-volatility squeeze before entry.'
      }
    },
    {
      id: 'quantum',
      title: 'Quantum Stacking',
      icon: Layers,
      color: 'text-purple-600',
      content: {
        logic: 'Identifies extreme exhaustion zones through moving average convergence.',
        buy: 'Bearish Stacking (Price < SMA 20 < SMA 50 < SMA 200).',
        sell: 'Full Structural Reversal (Model Objective reached).',
        caveat: 'Requires 100-point fundamental confirmation to avoid value traps.'
      }
    },
    {
      id: 'annual',
      title: 'Annual Range Matrix',
      icon: Calendar,
      color: 'text-rose-600',
      content: {
        logic: 'Mean reversion system based on annual price extremes.',
        buy: 'Accumulation at the 52-week statistical low.',
        sell: 'Research objective at the 52-week statistical high.',
        intent: 'Elite bluechips frequently rebound from annual support levels.'
      }
    },
    {
      id: 'recovery',
      title: 'Deep Recovery Audit',
      icon: ShieldCheck,
      color: 'text-amber-600',
      content: {
        logic: 'Capitalizes on the proprietary 67% All-Time High reset cycle.',
        entry: 'Drawdown >= 66% with improving fundamental financials.',
        exit: 'Model Objective is the return to the previous peak.',
        audit: 'Requires institutional ownership matrix > 75%.'
      }
    },
    {
      id: 'velocity',
      title: 'Velocity Retest',
      icon: Zap,
      color: 'text-blue-500',
      content: {
        logic: 'Identifies high-momentum bursts and enters on the origin retest.',
        entry: 'Retest of the Rally Start Low within 1 year of the rally.',
        exit: 'Model Objective is the previous rally peak price.',
        risk: 'Entry valid only if the rally started below the 200 DMA safety line.'
      }
    },
    {
      id: 'pivot',
      title: 'Structural Pivot',
      icon: Target,
      color: 'text-orange-600',
      content: {
        logic: 'Rounded accumulation phase followed by breakout confirmation.',
        structure: 'U-shaped base (Cup) and low-volatility handle formation.',
        accuracy: 'Lips must be perfectly aligned within 5% price variance.',
        abcd_rule: 'Algorithmic entry preferred at B/C/D levels for optimal risk-reward.'
      }
    },
    {
      id: 'reversal',
      title: 'Dynamic Reversal',
      icon: TrendingUp,
      color: 'text-cyan-600',
      content: {
        logic: 'Geometric identification of trend exhaustion and reversal.',
        structure: 'Multi-pivot structure (Shoulder-Head-Shoulder sequence).',
        accuracy: 'Structural symmetry must be > 95% for model qualification.',
        abcd_rule: 'Uses retrace averaging if direct breakout objective is < 30%.'
      }
    },
    {
      id: 'supply',
      title: 'Supply-Demand Core',
      icon: Layers,
      color: 'text-teal-600',
      content: {
        logic: 'Direct identification of historical institutional buy/sell clusters.',
        rebound_rule: 'Requires multi-touch historical validation of the demand zone.',
        upside_rule: 'Mathematical objective must be > 30% above the demand floor.',
        fundamental_check: 'Ensures net-margin stability during retest phase.'
      }
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Education Center</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Strategy Engineering & Logic Guides</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation */}
        <div className="lg:col-span-4 space-y-2">
          {strategies.map((strat) => {
            const Icon = strat.icon;
            const isActive = activeTab === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => setActiveTab(strat.id)}
                className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all ${
                  isActive 
                    ? 'bg-white border-blue-600 shadow-xl shadow-blue-100 scale-[1.02] z-10' 
                    : 'bg-white/50 border-slate-100 hover:border-slate-300 text-slate-500'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[13px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900' : ''}`}>
                    {strat.title}
                  </span>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-1 text-blue-600' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {strategies.filter(s => s.id === activeTab).map((strat) => (
            <div key={strat.id} className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center space-x-3 mb-8">
                <strat.icon className={`h-8 w-8 ${strat.color}`} />
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{strat.title}</h2>
              </div>

              <div className="space-y-10">
                <section>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Info className="h-3 w-3 mr-2" /> Core Strategy Logic
                  </h3>
                  <p className="text-xl font-bold text-slate-700 leading-relaxed italic border-l-4 border-slate-100 pl-6">
                    "{strat.content.logic}"
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(strat.content).map(([key, value]) => {
                    if (key === 'logic') return null;
                    return (
                      <div key={key} className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 capitalize">{key.replace('_', ' ')}</h4>
                        {Array.isArray(value) ? (
                          <ul className="space-y-2">
                            {value.map((v, i) => (
                              <li key={i} className="flex items-start text-[13px] font-bold text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 mr-2 flex-shrink-0" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-[13px] font-bold text-slate-700">{value}</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Institutional Guardrail</h4>
                    <p className="text-[12px] font-bold text-amber-800 leading-relaxed">
                      Always ensure the symbol is Batch 9 compliant before executing. Do not chase breakouts; wait for the calculated entry zones.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StrategyEducation;
