import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, CheckCircle2, Compass, Move } from 'lucide-react';
import { useTour } from '../../context/TourContext';

const SCOPED_DIM_COLOR = 'rgba(15, 23, 42, 0.5)';
const SCROLL_MARGIN = 120;

export const TourOverlay: React.FC = () => {
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    prevStep,
    stopTour,
    goToStep,
    currentConfig,
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [centerTooltip, setCenterTooltip] = useState(false);
  const targetElRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);

  const updateTargetRect = useCallback(() => {
    setCenterTooltip(false);
    if (!currentConfig?.highlightSelector) {
      setTargetRect(null);
      setCenterTooltip(true);
      return;
    }
    const el = document.querySelector(currentConfig.highlightSelector) as HTMLElement | null;
    targetElRef.current = el;
    if (el) {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0;
      if (isVisible) {
        setTargetRect(rect);
        setCenterTooltip(false);
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      } else {
        setTargetRect(null);
        setCenterTooltip(true);
      }
    } else {
      setTargetRect(null);
      setCenterTooltip(true);
    }
  }, [currentConfig]);

  useEffect(() => {
    updateTargetRect();
  }, [currentStep, updateTargetRect]);

  useEffect(() => {
    if (!targetRect && !centerTooltip) return;

    const tooltipHeight = 360;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top: number;
    let left: number;

    if (centerTooltip) {
      top = Math.max(12, (vh - tooltipHeight) / 2);
      left = Math.max(12, (vw - 340) / 2);
      setTooltipPos({ top, left });
      return;
    }

    if (!targetRect) return;

    const spaceAbove = targetRect.top - SCROLL_MARGIN;
    const spaceBelow = vh - (targetRect.bottom + SCROLL_MARGIN);

    if (spaceAbove > tooltipHeight + 20) {
      top = targetRect.top - tooltipHeight - 16;
    } else if (spaceBelow > tooltipHeight + 20) {
      top = targetRect.bottom + 16;
    } else if (spaceAbove > spaceBelow) {
      top = Math.max(12, targetRect.top - tooltipHeight - 16);
    } else {
      top = Math.min(vh - tooltipHeight - 12, targetRect.bottom + 16);
    }

    const fitLeft = Math.max(12, targetRect.left);
    const fitRight = Math.min(vw - 340 - 12, targetRect.left + targetRect.width - 340);

    if (fitLeft + 340 <= vw - 12) {
      left = fitLeft;
    } else if (fitRight >= 12) {
      left = fitRight;
    } else {
      left = Math.max(12, (vw - 340) / 2);
    }

    setTooltipPos({ top, left });
  }, [targetRect, centerTooltip]);

  useEffect(() => {
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateTargetRect]);

  if (!isActive || !currentConfig) return null;

  const tooltipY = tooltipPos ? tooltipPos.top : '50%';
  const tooltipX = tooltipPos ? tooltipPos.left : '50%';
  const cy = targetRect ? targetRect.top + targetRect.height / 2 : '50%';
  const cx = targetRect ? targetRect.left + targetRect.width / 2 : '50%';
  const spotlightR = targetRect
    ? Math.max(targetRect.width, targetRect.height) / 2 + 40
    : Math.min(window.innerWidth, window.innerHeight) / 2 + 40;

  return (
    <div
      className="fixed inset-0 z-[99998] pointer-events-none"
      style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.25s' }}
    >
      <svg className="absolute inset-0 w-full h-full" pointerEvents="none">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={cx} cy={cy} r={spotlightR} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill={SCOPED_DIM_COLOR}
          mask="url(#spotlight-mask)"
        />
      </svg>

      {targetRect && (
        <div
          className="absolute rounded-md pointer-events-none"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 3px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.15), inset 0 0 12px rgba(251, 191, 36, 0.08)',
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        />
      )}

      {targetRect && (
        <div
          className="absolute z-[99999] pointer-events-none flex flex-col items-center animate-ping"
          style={{
            left: targetRect.left + targetRect.width / 2 - 10,
            top: targetRect.bottom + 6,
          }}
        >
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-amber)]/20 border border-[var(--accent-amber)]/40">
            <Move className="h-4 w-4 text-[var(--accent-amber)]" />
            <div className="absolute inset-0 rounded-full bg-[var(--accent-amber)]/20 animate-ping" />
          </div>
          <div className="w-px h-3 bg-[var(--accent-amber)]/40 mt-0.5" />
        </div>
      )}

      <div
        className="absolute z-[100000] pointer-events-auto bg-[#0c1220] border border-[var(--accent-amber)]/25 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] w-[340px] max-w-[calc(100vw-24px)] overflow-hidden"
        style={{ top: tooltipY, left: tooltipX }}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--accent-amber)]/15 border border-[var(--accent-amber)]/30 rounded-lg flex items-center justify-center shrink-0">
                <Compass className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Tour • Step {currentStep + 1} of {totalSteps}
                </span>
                <h3 className="text-xs font-black text-[var(--text-primary)] leading-tight mt-0.5">
                  {currentConfig.title}
                </h3>
              </div>
            </div>
            <button onClick={stopTour} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0 p-1" aria-label="Close tour">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-1 bg-[var(--border-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-amber)] to-emerald-400 rounded-full"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            {currentConfig.body}
          </p>

          <div className="space-y-1.5">
            <p className="text-[9px] font-medium text-[var(--accent-amber)]">Next: Click the highlighted area, then click "Next" below</p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToStep(i)}
                  className={`h-1 rounded-full transition-all ${
                    i === currentStep ? 'bg-[var(--accent-amber)] w-3'
                    : i < currentStep ? 'bg-emerald-400/60 w-1'
                    : 'bg-[var(--border-secondary)] w-1'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={prevStep} disabled={currentStep === 0} className="flex items-center gap-1 px-3 py-1.5 text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg">
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
              {currentStep === totalSteps - 1 ? (
                <button onClick={stopTour} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-[8px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                  <CheckCircle2 className="h-3 w-3" /> Finish
                </button>
              ) : (
                <button onClick={nextStep} className="flex items-center gap-1 px-4 py-1.5 bg-[var(--accent-amber)] hover:bg-[var(--accent-amber)]/80 text-[#020617] text-[8px] font-bold uppercase tracking-wider rounded-lg transition-colors">
                  Next <ChevronRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};