import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, LineChart, Search, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const COURSE_STEPS = [
  {
    title: 'Learn the rule',
    desc: 'Start with ABCD tranches, audit score, smart-money filters, and rejection logic.',
    icon: BookOpen,
  },
  {
    title: 'Scan the stock',
    desc: 'Run the symbol through the Nifty 500 and Alpha 40 institutional universe.',
    icon: Search,
  },
  {
    title: 'Verify the setup',
    desc: 'Check strategy trigger, A/B/C/D zones, target gap, and risk profile before acting.',
    icon: LineChart,
  },
  {
    title: 'Journal the decision',
    desc: 'Record why it passed, what invalidates it, and how each tranche should be managed.',
    icon: CheckCircle2,
  },
];

const CourseFramework: React.FC = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55 }}
      className="py-16 md:py-20 px-6 md:px-10 border-y border-[var(--border-primary)]/50 bg-[var(--bg-secondary)]/20"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Course To Terminal Map</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)] leading-tight">
                Turn the equity course into a <span className="text-blue-400">repeatable workflow.</span>
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed font-medium">
                MarketBeacon Pro should be used as an educational research terminal: learn the framework, scan objectively, verify risk, then journal the decision.
              </p>
            </div>
            <p className="text-[10px] font-bold text-amber-300/90 uppercase tracking-widest leading-relaxed border border-amber-400/20 bg-amber-400/5 rounded-2xl p-4">
              Educational scan only. Audit scores and strategy triggers are not buy/sell recommendations or personalized investment advice.
            </p>
            <Link to="/blog/abcd-tranche-laddering-guide" className="inline-flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">
              Read ABCD Framework <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COURSE_STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="group relative p-5 md:p-6 rounded-3xl border border-[var(--border-primary)] bg-[var(--bg-primary)]/40 hover:border-blue-500/35 hover:-translate-y-1 transition-all overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <step.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-[0.3em]">Step {index + 1}</span>
                    <h3 className="text-sm md:text-base font-black text-[var(--text-primary)] uppercase tracking-widest">{step.title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed font-medium">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CourseFramework;
