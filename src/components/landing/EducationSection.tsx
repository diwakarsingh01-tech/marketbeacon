import React from 'react';
import { Activity } from 'lucide-react';

interface EducationSectionProps {
  simStage: 'A' | 'B' | 'C' | 'D';
  setSimStage: (stage: 'A' | 'B' | 'C' | 'D') => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ simStage, setSimStage }) => {
  return (
    <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-100 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 rounded-full border border-[#00d09c]/20">
            <Activity className="h-3.5 w-3.5 text-[#00d09c]" />
            <span className="text-caption text-[#00d09c] uppercase tracking-wider">Interactive Audit Simulator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-slate-800">Visualizing the <br /><span className="text-[#00d09c]">ABCD Tranche</span> Ladder</h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Institutional capital doesn't enter stocks all at once. They build positions in tranches to absorb market volatility. Click each stage to see how our algorithms ladder your entry.
          </p>
          
          <div className="grid grid-cols-4 gap-2 pt-4">
            {(['A', 'B', 'C', 'D'] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSimStage(stage)}
                className={`py-3.5 rounded-xl text-caption transition-all border ${
                  simStage === stage
                    ? 'bg-[#00d09c] border-[#00d09c] text-white shadow-md shadow-[#00d09c]/20'
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                }`}
              >
                Stage {stage}
              </button>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-7 card p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px] bg-white border border-slate-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00d09c]/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em]">Tranche Allocation</span>
              <span className="text-caption text-[#00d09c] uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">Active Matrix</span>
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              {simStage === 'A' && "Stage A: Base Price Floor Establishment"}
              {simStage === 'B' && "Stage B: Pullback Accumulation Sweep"}
              {simStage === 'C' && "Stage C: Hard Value Floor Validation"}
              {simStage === 'D' && "Stage D: Breakout / Target Realization"}
            </h3>
            
            <p className="text-xs text-slate-500 leading-relaxed font-mono">
              {simStage === 'A' && "Algorithm registers initial institutional activity at key support floors. A 25% initial position tranche is cleared for audit."}
              {simStage === 'B' && "Volatile swings sweep minor stops. Buy limit triggers average-down protection, adding 25% volume at a 10% lower basis."}
              {simStage === 'C' && "The final accumulation block triggers. 35% capacity is locked at the historical value floor, stabilizing the net holding yields."}
              {simStage === 'D' && "The volume breakout clears minor resistances. Momentum surges to target objective (D-tranche ceiling) yielding ~42% Alpha exit."}
            </p>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00d09c] animate-pulse" />
              <span>Simulation Active</span>
            </div>
            <span className="text-caption text-slate-500 font-mono uppercase tracking-wider">
              {simStage === 'A' && "Alloc: 25% | Gap: 0%"}
              {simStage === 'B' && "Alloc: 50% | Gap: -10%"}
              {simStage === 'C' && "Alloc: 85% | Gap: -18%"}
              {simStage === 'D' && "Alloc: 100% | Target Achieved"}
            </span>
          </div>
        </div>
       </div>
      </section>
  );
};

export default EducationSection;
