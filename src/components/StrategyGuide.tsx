import React from 'react';
import { 
  Info, 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  HelpCircle,
  BookOpen,
  ArrowRightCircle
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
    title: 'Envelope Long (ABCD)',
    description: 'A mean-reversion strategy that identifies stocks trading at deep discounts to their moving averages.',
    setup: [
      'Price drops below the lower boundary of the 20-period Envelope.',
      'RSI is typically oversold (< 30).',
      'Look for bullish divergence on 15m or 1h timeframe.'
    ],
    entry: 'Enter when price crosses back above the lower envelope or forms a bullish engulfing candle.',
    stopLoss: 'Recent swing low or 2% below the lower envelope.',
    target: '20-period SMA (Median line) or 5-7% profit.',
    proTip: 'Use ABCD averaging if the stock drops further to a secondary support level.'
  },
  'ENVELOPE_SHORT': {
    title: 'Short Envelope',
    description: 'A mean-reversion strategy for over-extended stocks ripe for a pullback.',
    setup: [
      'Price surges above the upper boundary of the 20-period Envelope.',
      'RSI is extremely overbought (> 70).',
      'Bearish divergence on lower timeframes.'
    ],
    entry: 'Enter short when price crosses back below the upper envelope or forms a bearish reversal candle.',
    stopLoss: 'Recent swing high or 2% above the upper envelope.',
    target: '20-period SMA (Median line).',
    proTip: 'Wait for volume confirmation on the downward move before committing full size.'
  },
  'SMA': {
    title: 'SMA Support',
    description: 'Trend following strategy focusing on institutional support levels.',
    setup: [
      'Stock is in a clear uptrend (Price > 200 SMA).',
      'Price pulls back to the 50 or 100 period SMA.',
      'Volume decreases during the pullback.'
    ],
    entry: 'Bullish reversal candle at the SMA level.',
    stopLoss: 'Closing basis below the SMA level.',
    target: 'Recent swing high or 2:1 Reward-to-Risk ratio.',
    proTip: 'Stronger signals occur when multiple SMAs converge at the same price point.'
  },
  'BOLLINGER': {
    title: 'Bollinger Band Squeeze',
    description: 'Volatility expansion strategy targeting explosive moves after consolidation.',
    setup: [
      'Bollinger Bands contract tightly (Squeeze).',
      'Stock price consolidates in a narrow range.',
      'Volume dries up significantly.'
    ],
    entry: 'Buy the breakout above the upper band with expanding volume.',
    stopLoss: 'Below the median band (20 SMA) or bottom of the squeeze range.',
    target: 'Ride the upper band until momentum wanes or trailing stop hits.',
    proTip: 'A squeeze that lasts longer typically leads to a more explosive breakout.'
  },
  '52W_HIGH_LOW': {
    title: '52 Week High Breakout',
    description: 'Momentum strategy that capitalizes on stocks breaking into uncharted territory.',
    setup: [
      'Stock approaches its 52-week high.',
      'Base forms just below the high for several weeks.',
      'Sector is showing relative strength.'
    ],
    entry: 'Enter on a high-volume breakout above the 52-week high.',
    stopLoss: 'Below the breakout pivot or 5% below entry.',
    target: 'Trail stop using a 10-day EMA to capture the maximum trend.',
    proTip: 'Avoid buying extended breakouts; aim for the initial thrust from a solid base.'
  },
  'SMA_ABCD': {
    title: 'SMA ABCD Ladder',
    description: 'A risk-managed entry strategy using multiple buy levels near moving averages.',
    setup: [
      'Identify a high-quality stock (Bluechip).',
      'Mark 4 levels: A (Current Support), B (-2%), C (-5%), D (-10%).'
    ],
    entry: 'Layer buy orders across all 4 levels (A-D) to get a better average price.',
    stopLoss: '1% below level D.',
    target: '5% above the final average price.',
    proTip: 'Allocate 10%, 20%, 30%, 40% of position size across levels A to D respectively.'
  },
  '67_FUNDA': {
    title: '67 ka Funda',
    description: 'A proprietary momentum and volume acceleration setup.',
    setup: [
      'Price consolidates for a minimum of 6 weeks.',
      'Volume spikes by at least 7x the average daily volume.',
      'Strong bullish candle closes near its high.'
    ],
    entry: 'Enter on the close of the high-volume expansion day or next day open.',
    stopLoss: 'Below the low of the breakout candle.',
    target: 'Measure the consolidation depth and project upward (measured move).',
    proTip: 'True momentum ignores broad market weakness. Look for relative strength.'
  },
  '20_RALLY': {
    title: '20% Ki Rally',
    description: 'Short-term swing strategy targeting a fast 20% upside move.',
    setup: [
      'Stock has corrected 30%+ from recent highs.',
      'Forms a double bottom or clear accumulation pattern.',
      'MACD crossover in deeply oversold territory.'
    ],
    entry: 'Buy on the break of the interim lower high.',
    stopLoss: 'Below the absolute bottom of the pattern.',
    target: 'Exactly 20% from the breakout point. Auto-exit.',
    proTip: 'Take 50% profits at 10% gain and move the stop loss to break-even for a risk-free trade.'
  },
  'CUP_HANDLE_ABCD': {
    title: 'Cup with Handle (ABCD)',
    description: 'Classic CANSLIM pattern integrated with ABCD risk management.',
    setup: [
      'Stock forms a "U" shape cup over 7+ weeks.',
      'Forms a downward drifting handle on light volume.',
      'Handle stays in the upper half of the cup.'
    ],
    entry: 'Buy the breakout above the handle\'s pivot point.',
    stopLoss: 'Below the low of the handle.',
    target: 'Depth of the cup added to the breakout pivot.',
    proTip: 'Use ABCD logic if the breakout fails but the cup bottom holds.'
  },
  'RHS_ABCD': {
    title: 'Reverse Head & Shoulder',
    description: 'Bottom reversal pattern signaling a major trend change.',
    setup: [
      'Three distinct troughs: Left Shoulder, deeper Head, Right Shoulder.',
      'Right shoulder forms on lighter volume.',
      'Neckline acts as the primary resistance.'
    ],
    entry: 'Enter when price breaks and closes above the neckline with heavy volume.',
    stopLoss: 'Below the Right Shoulder low.',
    target: 'Distance from Head to Neckline projected upwards.',
    proTip: 'A sloping neckline (upwards) increases the probability of a successful breakout.'
  },
  'SR_STRATEGY': {
    title: 'Support & Resistance (S&R)',
    description: 'Core price action strategy trading between established zones.',
    setup: [
      'Identify major historical Support and Resistance zones.',
      'Price approaches the Support zone.',
      'Look for candlestick rejection (Hammer, Doji) at the zone.'
    ],
    entry: 'Buy the bounce off support. Sell short the rejection at resistance.',
    stopLoss: 'Just outside the established S&R zone.',
    target: 'The opposite boundary (Target Resistance if bought at Support).',
    proTip: 'The more times a zone is tested, the weaker it becomes.'
  }
};

const StrategyGuide: React.FC<StrategyGuideProps> = ({ strategyId }) => {
  const guide = STRATEGY_DETAILS[strategyId] || {
    title: 'Strategy Overview',
    description: 'Detailed guidelines for this strategy are currently being updated by the institutional team.',
    setup: ['Analyze the overall market trend.', 'Verify stock fundamentals.', 'Wait for clear price action confirmation.'],
    entry: 'Enter on confirmed breakout or support bounce.',
    stopLoss: 'Below recent structural support.',
    target: 'Next major resistance level.',
    proTip: 'Always maintain a positive Risk-Reward ratio.'
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-black uppercase tracking-tight italic">{guide.title}</h2>
        </div>
        <div className="px-3 py-1 bg-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
          Institutional Guide
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <HelpCircle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Logic Overview</span>
          </div>
          <p className="text-slate-600 font-medium leading-relaxed">
            {guide.description}
          </p>
        </div>

        {/* Setup Steps */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-slate-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Setup Requirements</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {guide.setup.map((step, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start space-x-3">
                <div className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 flex-shrink-0">
                  {idx + 1}
                </div>
                <p className="text-xs font-bold text-slate-700">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Params */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
            <div className="flex items-center space-x-2 text-blue-600">
              <ArrowRightCircle className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Entry Rule</span>
            </div>
            <p className="text-xs font-black text-blue-900 leading-normal">{guide.entry}</p>
          </div>

          <div className="p-5 bg-red-50 rounded-3xl border border-red-100 space-y-2">
            <div className="flex items-center space-x-2 text-red-600">
              <ShieldAlert className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Risk Baseline</span>
            </div>
            <p className="text-xs font-black text-red-900 leading-normal">{guide.stopLoss}</p>
          </div>

          <div className="p-5 bg-green-50 rounded-3xl border border-green-100 space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <Target className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Model Obj.</span>
            </div>
            <p className="text-xs font-black text-green-900 leading-normal">{guide.target}</p>
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
