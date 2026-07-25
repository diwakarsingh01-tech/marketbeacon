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
      className="py-16 md:py-20 px-6 md:px-10 border-y border-slate-100 bg-white"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-4 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d09c]/10 border border-[#00d09c]/20">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00d09c]" />
              <span className="text-caption text-[#00d09c] uppercase tracking-wider">Course To Terminal Map</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 leading-tight">
                Turn the equity course into a <span className="text-[#00d09c]">repeatable workflow.</span>
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                MarketBeacon Pro should be used as an educational research terminal: learn the framework, scan objectively, verify risk, then journal the decision.
              </p>
            </div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider leading-relaxed border border-amber-200 bg-amber-50 rounded-2xl p-4">
              Educational scan only. Audit scores and strategy triggers are not buy/sell recommendations or personalized investment advice.
            </p>
            <Link to="/blog/abcd-tranche-laddering-guide" className="inline-flex items-center gap-2 text-[#00d09c] text-caption hover:text-slate-900 transition-colors">
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
                className="group relative p-5 md:p-6 rounded-3xl border border-slate-100 bg-white hover:border-[#00d09c]/30 hover:-translate-y-1 transition-all overflow-hidden shadow-sm"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d09c]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#00d09c]/10 border border-[#00d09c]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <step.icon className="w-5 h-5 text-[#00d09c]" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Step {index + 1}</span>
                    <h3 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-wider">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{step.desc}</p>
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
