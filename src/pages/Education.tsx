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

  const lessons = [
    // ...
  ];

  React.useEffect(() => {
    // Pillar #1: Canonical Hardening
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = 'https://marketbeacon.pro/education';
    document.head.appendChild(linkCanonical);

    // Pillar #4: FAQ Schema (Structured Data)
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the Institutional Floor strategy?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Institutional Floor strategy identifies demand zones where institutional buying typically occurs, based on statistical deviation from moving averages."
          }
        },
        {
          "@type": "Question",
          "name": "How does the Deep Recovery Audit work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The Deep Recovery Audit targets stocks with a drawdown of 66% or more from their all-time high, provided they maintain strong institutional ownership and improving fundamentals."
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = "application/ld+json";
    script.id = "json-ld-faq";
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(linkCanonical);
      const oldScript = document.getElementById('json-ld-faq');
      if (oldScript) oldScript.remove();
    };
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Education Center</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">Institutional Knowledge & Logic Guides</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation */}
        <div className="lg:col-span-4 space-y-3">
          {lessons.map((lesson) => {
            const Icon = lesson.icon;
            const isActive = activeTab === lesson.id;
            return (
              <button
                key={lesson.id}
                onClick={() => setActiveTab(lesson.id)}
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
                  <div className="flex flex-col items-start">
                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">{lesson.category}</span>
                    <span className={`text-[13px] font-black uppercase tracking-tight ${isActive ? 'text-slate-900' : ''}`}>
                      {lesson.title}
                    </span>
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 transition-transform ${isActive ? 'translate-x-1 text-blue-600' : 'opacity-0'}`} />
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[600px]">
          {lessons.filter(s => s.id === activeTab).map((lesson) => (
            <div key={lesson.id} className="p-8 md:p-12 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <lesson.icon className={`h-8 w-8 ${lesson.color}`} />
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{lesson.title}</h2>
                </div>
                <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full">{lesson.category}</span>
              </div>

              <div className="space-y-10 flex-1">
                <section>
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                    <Info className="h-3 w-3 mr-2" /> Essential Concept
                  </h3>
                  <p className="text-lg font-bold text-slate-700 leading-relaxed italic border-l-4 border-slate-100 pl-6">
                    "{lesson.content.logic}"
                  </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {Object.entries(lesson.content).map(([key, value]) => {
                    if (['logic', 'headline', 'video'].includes(key)) return null;
                    return (
                      <div key={key} className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 capitalize">{key.replace('_', ' ')}</h4>
                        {Array.isArray(value) ? (
                          <ul className="space-y-3">
                            {value.map((v, i) => (
                              <li key={i} className="flex items-start text-[13px] font-bold text-slate-700">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 mr-2 flex-shrink-0" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : typeof value === 'string' ? (
                          <p className="text-[13px] font-bold text-slate-700">{value}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start space-x-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Institutional Guardrail</h4>
                    <p className="text-[12px] font-bold text-amber-800 leading-relaxed">
                      Build confidence with rule-based investing. MarketBeacon shows strategy entries; your execution discipline creates the alpha.
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
