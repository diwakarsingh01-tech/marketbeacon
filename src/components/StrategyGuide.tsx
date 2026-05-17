import React from 'react';
import { 
  ShieldAlert, 
  Target, 
  Zap, 
  Info,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';

interface StrategyGuideProps {
  strategyId: string;
}

const STRATEGY_DETAILS: Record<string, {
  title: string;
  description: string;
  setup: string[];
  entry: string;
  stopLoss: string;
  target: string;
  proTip: string;
}> = {
  'ENVELOPE_LONG': {
    title: 'Institutional Floor',
    description: 'A mean-reversion strategy that identifies institutional demand zones based on statistical deviation benchmarks.',
    setup: [
      'Price drops to the lower research boundary (SMA 20 - 10%).',
      'RSI is typically near oversold territory (< 30).',
      'Look for bullish divergence on institutional timeframes.'
    ],
    entry: 'Mathematical entry triggered at the lower research band.',
    stopLoss: 'Risk managed via algorithmic ABCD laddering.',
    target: 'Model Objective is the mathematical recovery to the SMA Basis or Upper Band.',
    proTip: 'Ideal for Bluechip stocks during a market correction.'
  },
  'ENVELOPE_SHORT': {
    title: 'Momentum Ceiling',
    description: 'A research model for stocks in strong primary uptrends participating in secondary regressions.',
    setup: [
      'Price surges above the primary regression midline.',
      'Secondary participation zone identified at EMA 200.',
      'High-momentum environment confirmed by volume.'
    ],
    entry: 'Research entry at the secondary regression line (EMA 200).',
    stopLoss: 'Risk managed via strictly capped position sizing.',
    target: 'Model Objective is a calculated +14% momentum move.',
    proTip: 'Focused on high-momentum names that rarely revisit deep discount zones.'
  },
  'BOLLINGER': {
    title: 'Volatility Channel',
    description: 'Volatility expansion research model targeting mean-reversion moves.',
    setup: [
      'Channel contracts tightly during low-volatility phases.',
      'Price stabilizes in a narrow research range.',
      'Volume dries up significantly before the next wave.'
    ],
    entry: 'Mathematical objective triggered at the lower volatility boundary.',
    stopLoss: 'Risk baseline set at the 20-period median line.',
    target: 'Model Objective is the upper volatility boundary.',
    proTip: 'A narrower channel typically leads to a more reliable mean-reversion move.'
  },
  '52W_HIGH_LOW': {
    title: 'Annual Range Matrix',
    description: 'Mean reversion research system based on annual price extremes.',
    setup: [
      'Stock stabilizes near its 52-week statistical low.',
      'Base forms just above the annual support zone.',
      'Bluechip fundamentals remain strong despite the correction.'
    ],
    entry: 'Research accumulation triggered at the 52-week statistical low.',
    stopLoss: 'Requires strict debt-to-equity < 0.2 confirmation baseline.',
    target: 'Model Objective is the 52-week statistical high.',
    proTip: 'Elite bluechips frequently rebound from annual support levels.'
  },
  'SMA_ABCD': {
    title: 'Quantum Stacking',
    description: 'A risk-managed research model using convergence levels near moving averages.',
    setup: [
      'Identify BEARISH stacking: Price < SMA 20 < SMA 50 < SMA 200.',
      'Extreme exhaustion zones identified across institutional averages.',
      '100-point fundamental confirmation to avoid value traps.'
    ],
    entry: 'Bearish Stacking (Price < SMA 20 < SMA 50 < SMA 200).',
    stopLoss: 'Risk managed via algorithmic staggered accumulation.',
    target: 'Model Objective is a full structural reversal back above SMA 200.',
    proTip: 'Avoid cyclical sectors in deep bearish stacking.'
  },
  'SIXTY_SEVEN_FUNDA': {
    title: 'Deep Recovery Audit',
    description: 'Proprietary research model based on the 67% ATH reset cycle.',
    setup: [
      'Drawdown from All-Time High hits the 66-67% benchmark.',
      'Improving quarterly financials (Sales/Profit) during the fall.',
      'Institutional ownership matrix remains > 75%.'
    ],
    entry: 'Research qualification at drawdown >= 66% with improving PAT.',
    stopLoss: 'No stop-loss; requires high-conviction 100-point audit.',
    target: 'Model Objective is a return to the previous All-Time High.',
    proTip: 'Look for companies with >15% ROE during the accumulation phase.'
  },
  'TWENTY_RALLY_RETEST': {
    title: 'Velocity Retest',
    description: 'Identifies high-momentum bursts and enters on the return to the origin.',
    setup: [
      'Consecutive green candle rally of 20% or more (Velocity Burst).',
      'Rally must START below the 200 DMA safety line.',
      'Price stabilizes and returns to the Rally Start Low (Demand Base).'
    ],
    entry: 'First retest of the Rally Start Low within 1 year of the rally.',
    stopLoss: 'Risk managed via Structural Tranche Averaging.',
    target: 'Model Objective is the previous rally peak price.',
    proTip: 'Strongest when the initial velocity move completes in < 15 days.'
  },
  'CUP_HANDLE_ABCD': {
    title: 'Structural Pivot',
    description: 'Rounded accumulation phase followed by breakout confirmation.',
    setup: [
      'U-shaped base (Cup) formation over several months.',
      'Handle formation on light volume below the lip.',
      'Symmetry check: Lips perfectly aligned within 5% variance.'
    ],
    entry: 'Mathematical entry at the Structural Pivot (Neckline) breakout.',
    stopLoss: 'Risk baseline set at the handle support level.',
    target: 'Model Objective is the Cup Depth (+H) projection.',
    proTip: 'Cups deeper than 30% have higher win rates in Large Caps.'
  },
  'RHS_ABCD': {
    title: 'Dynamic Reversal',
    description: 'Geometric identification of trend exhaustion and structural reversal.',
    setup: [
      'Three distinct troughs: Left Shoulder, deeper Head, Right Shoulder.',
      'Structural symmetry must be > 95% for model qualification.',
      'Knoxville Divergence typically appears on the Head trough.'
    ],
    entry: 'Completion of a symmetrical inverted H&S formation.',
    stopLoss: 'Risk baseline set at the right shoulder support low.',
    target: 'Model Objective is the Neckline Height (+H) projection.',
    proTip: 'Sloping necklines (upwards) increase the probability of reversal.'
  },
  'SR_STRATEGY': {
    title: 'Supply-Demand Core',
    description: 'Direct identification of historical institutional buy/sell clusters.',
    setup: [
      'Identify major historical Support and Resistance zones.',
      'Multi-touch historical validation (Min 2 taps) of the demand floor.',
      'Net-margin stability during the retest of support.'
    ],
    entry: 'Touch of a clustered support pivot zone.',
    stopLoss: 'Risk managed via algorithmic position building.',
    target: 'Model Objective is the next major resistance cluster.',
    proTip: 'Only trade if the gap to resistance is > 30%.'
  }
};

const StrategyGuide: React.FC<StrategyGuideProps> = ({ strategyId }) => {
  const guide = STRATEGY_DETAILS[strategyId] || {
    title: 'Institutional Research Model',
    description: 'Proprietary institutional scanning logic.',
    setup: ['Baseline stabilization', 'Fundamental Audit', 'Institutional Demand Check'],
    entry: 'Calculated Tranche A Entry point.',
    stopLoss: 'Managed via ABCD laddering.',
    target: 'Mathematical research objective.',
    proTip: 'Patience is key in institutional entries.'
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{guide.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logic: {guide.description}</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Setup Steps */}
        <div className="space-y-4">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">Setup Requirements</span>
          <div className="grid gap-3">
            {guide.setup.map((step, i) => (
              <div key={i} className="flex items-start space-x-3 group">
                <div className="h-5 w-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all">
                  {i + 1}
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Entry/Exit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <ChevronRight className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Entry</span>
            </div>
            <p className="text-xs font-black text-blue-900 leading-normal">{guide.entry}</p>
          </div>

          <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-600">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Model Obj.</span>
            </div>
            <p className="text-xs font-black text-indigo-900 leading-normal">{guide.target}</p>
          </div>

          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
            <div className="flex items-center space-x-2 text-slate-600">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Risk Baseline</span>
            </div>
            <p className="text-xs font-black text-slate-900 leading-normal">{guide.stopLoss}</p>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center space-x-4">
          <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Institutional Pro Tip</span>
            <p className="text-xs font-bold text-amber-900">{guide.proTip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyGuide;
