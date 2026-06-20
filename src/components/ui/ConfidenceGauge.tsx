import { useId } from 'react';

interface Props {
  score: number;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function ConfidenceGauge({ score, size = 'md', label = 'CONFIDENCE SCORE', className = '' }: Props) {
  const id = useId();
  const gradId = `gauge-grad-${id}`;
  const svgClass = size === 'sm' ? 'w-24 h-14' : 'w-36 h-20';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 55" className={svgClass}>
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="125"
          strokeDashoffset={125 - (125 * score) / 100}
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <text x="50" y="45" textAnchor="middle" className="text-lg font-black fill-current">{score}%</text>
      </svg>
      {label && <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] mt-2">{label}</span>}
    </div>
  );
}
