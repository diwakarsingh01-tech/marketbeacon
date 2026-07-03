import React from 'react';
import { Activity } from 'lucide-react';

interface EducationSectionProps {
  simStage: 'A' | 'B' | 'C' | 'D';
  setSimStage: (stage: 'A' | 'B' | 'C' | 'D') => void;
}

const EducationSection: React.FC<EducationSectionProps> = ({ simStage, setSimStage }) => {
  return (
    <section className="py-24 px-6 md:px-10 max-w-[1440px] mx-auto border-t border-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">Interactive Audit Simulator</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none uppercase italic">Visualizing the <br /><span className="text-blue-500">ABCD Tranche</span> Ladder</h2>
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            Institutional capital doesn't enter stocks all at once. They build positions in tranches to absorb market volatility. Click each stage to see how our algorithms ladder your entry.
          </p>
          
          <div className="grid grid-cols-4 gap-2 pt-4">
            {(['A', 'B', 'C', 'D'] as const).map((stage) => (
              <button
                key={stage}
                onClick={() => setSimStage(stage)}
                className={`py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                  simStage === stage
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-[var(--text-primary)] shadow-lg shadow-blue-500/20'
                    : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                Stage {stage}
              </button>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-7 card p-8 md:p-10 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.25em]">Tranche Allocation</span>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded">Active Matrix</span>
            </div>
            
            <h3 className="text-xl font-black uppercase text-[var(--text-primary)] italic tracking-tight">
              {simStage === 'A' && "Stage A: Base Price Floor Establishment"}
              {simStage === 'B' && "Stage B: Pullback Accumulation Sweep"}
              {simStage === 'C' && "Stage C: Hard Value Floor Validation"}
              {simStage === 'D' && "Stage D: Breakout / Target Realization"}
            </h3>
            
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-mono">
              {simStage === 'A' && "Algorithm registers initial institutional activity at key support floors. A safe 25% initial position tranche is cleared for audit."}
              {simStage === 'B' && "Volatile swings sweep minor stops. Buy limit triggers average-down protection, adding 25% volume at a 10% lower basis."}
              {simStage === 'C' && "The final accumulation block triggers. 35% capacity is locked at the historical value floor, stabilizing the net holding yields."}
              {simStage === 'D' && "The volume breakout clears minor resistances. Momentum surges to target objective (D-tranche ceiling) yielding ~42% Alpha exit."}
            </p>
          </div>
          
          <div className="pt-6 border-t border-[var(--border-primary)] flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Simulation Active</span>
            </div>
            <span className="text-[11px] font-bold text-[var(--text-secondary)] font-mono uppercase tracking-wider">
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
