import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, CheckCircle2, Compass, MousePointerClick } from 'lucide-react';
import { useTour } from '../../context/TourContext';

export const TourOverlay: React.FC = () => {
  const { isActive, currentStep, totalSteps, nextStep, prevStep, stopTour, goToStep, currentConfig } = useTour();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<'top' | 'bottom' | 'center'>('bottom');

  useEffect(() => {
    if (!isActive || !currentConfig?.highlightSelector) {
      setHighlightRect(null);
      setTooltipPos('bottom');
      return;
    }

    const findElement = () => {
      const el = document.querySelector(currentConfig.highlightSelector!);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (rect.top < 200) setTooltipPos('bottom');
        else if (rect.bottom > window.innerHeight - 300) setTooltipPos('top');
        else setTooltipPos('bottom');
      } else {
        setHighlightRect(null);
        setTooltipPos('bottom');
      }
    };

    const timer = setTimeout(findElement, 600);
    window.addEventListener('scroll', findElement, true);
    window.addEventListener('resize', findElement);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', findElement, true);
      window.removeEventListener('resize', findElement);
    };
  }, [isActive, currentStep, currentConfig]);

  if (!isActive || !currentConfig) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const spotlightStyle: React.CSSProperties = highlightRect
    ? {
        position: 'fixed',
        top: highlightRect.top - 8,
        left: highlightRect.left - 8,
        width: highlightRect.width + 16,
        height: highlightRect.height + 16,
        borderRadius: '12px',
        boxShadow: '0 0 0 9999px rgba(2, 6, 23, 0.15), 0 0 0 3px var(--accent-amber), 0 0 30px 4px rgba(245, 158, 11, 0.4)',
        pointerEvents: 'none',
        zIndex: 99998,
        transition: 'all 0.3s ease',
      }
    : {};

  const tooltipClass = highlightRect
    ? tooltipPos === 'top'
      ? 'fixed left-1/2 -translate-x-1/2'
      : 'fixed left-1/2 -translate-x-1/2'
    : 'fixed bottom-6 left-1/2 -translate-x-1/2';

  const tooltipStyle: React.CSSProperties = highlightRect
    ? tooltipPos === 'top'
      ? { top: Math.max(16, highlightRect.top - 220), width: 'calc(100% - 2rem)', maxWidth: '420px' }
      : { top: Math.min(window.innerHeight - 280, highlightRect.bottom + 20), width: 'calc(100% - 2rem)', maxWidth: '420px' }
    : { bottom: '24px', width: 'calc(100% - 2rem)', maxWidth: '520px' };

  return (
    <>
      <AnimatePresence>
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={spotlightStyle}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentConfig.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: 0.2 }}
          className={`${tooltipClass} bg-[#0a0f1e] border border-[var(--accent-amber)]/30 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden z-[99999]`}
          style={tooltipStyle}
        >
          {/* Progress bar */}
          <div className="h-1 bg-[var(--border-primary)] relative">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-amber)] to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-5 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[var(--accent-amber)]/10 border border-[var(--accent-amber)]/20 rounded-lg flex items-center justify-center shrink-0">
                  <Compass className="h-4 w-4 text-[var(--accent-amber)]" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Tour • Step {currentStep + 1} of {totalSteps}
                  </span>
                  <h3 className="text-xs font-black text-[var(--text-primary)] leading-tight">
                    {currentConfig.title}
                  </h3>
                </div>
              </div>
              <button onClick={stopTour} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0" aria-label="Close tour">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              {currentConfig.body}
            </p>

            {/* Sub-navigation hints */}
            {currentConfig.subSteps && currentConfig.subSteps.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {currentConfig.subSteps.map((sub, i) => (
                  <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 bg-[var(--accent-amber)]/5 border border-[var(--accent-amber)]/15 rounded-lg">
                    <MousePointerClick className="h-3 w-3 text-[var(--accent-amber)] shrink-0 mt-0.5" />
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)] leading-relaxed">{sub}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA hint */}
            {currentConfig.cta && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">{currentConfig.cta}</span>
              </div>
            )}

            {/* Nav buttons */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <button key={i} onClick={() => goToStep(i)} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'bg-[var(--accent-amber)] w-4' : i < currentStep ? 'bg-emerald-400/60 w-1.5' : 'bg-[var(--border-secondary)] w-1.5'}`} aria-label={`Go to step ${i + 1}`} />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={prevStep} disabled={isFirst} className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg">
                  <ChevronLeft className="h-3 w-3" /> Back
                </button>
                {isLast ? (
                  <button onClick={stopTour} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                    <CheckCircle2 className="h-3 w-3" /> Finish
                  </button>
                ) : (
                  <button onClick={nextStep} className="flex items-center gap-1 px-4 py-1.5 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/80 text-[#020617] text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                    Next <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};