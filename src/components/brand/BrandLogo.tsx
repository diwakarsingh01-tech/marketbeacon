import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  hideText?: boolean;
  variant?: 'light' | 'dark';
}

const BrandLogo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 32, 
  hideText = false,
  variant = 'dark'
}) => {
  const isDark = variant === 'dark';
  
  return (
    <div className={`flex items-center space-x-3.5 ${className}`}>
      {/* The Beacon Icon */}
      <div 
        className="relative flex items-center justify-center shrink-0 group select-none"
        style={{ width: size, height: size }}
      >
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-[#00d09c]/20 blur-lg rounded-full scale-150 group-hover:scale-175 transition-transform duration-500 animate-pulse" />
        
        {/* SVG Icon Construction */}
        <svg 
          viewBox="0 0 40 40" 
          className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(0,208,156,0.3)] group-hover:rotate-12 transition-transform duration-500"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
             <linearGradient id="logoGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00d09c"/>
                <stop offset="100%" stopColor="#00bda0"/>
             </linearGradient>
          </defs>

          {/* Outer Shield/Hex with Gradient Stroke */}
          <path 
            d="M20 2L36 11V29L20 38L4 29V11L20 2Z" 
            fill={isDark ? "rgba(15,23,42,0.85)" : "#ffffff"} 
            stroke="url(#logoGlow)" 
            strokeWidth="3"
            strokeLinejoin="round"
          />
          
          {/* Signal Pulse Beacon */}
          <path 
            d="M13 27V19L20 13L27 19V27" 
            stroke="url(#logoGlow)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="20" cy="19" r="3" fill="#00d09c" className="animate-ping" style={{ transformOrigin: '20px 19px' }} />
          <circle cx="20" cy="19" r="2.5" fill="#00bda0" />
          
          {/* Base lines */}
          <path d="M16 27H24" stroke="url(#logoGlow)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      {!hideText && (
        <div className="hidden sm:flex flex-col leading-none select-none">
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-[17px] font-bold tracking-tighter uppercase italic leading-none">
               Market<span className="text-[#00d09c]">Beacon</span>
            </span>
            <span className="px-2 py-1 bg-[#00d09c] text-white text-[10px] font-bold rounded shadow-sm leading-none uppercase tracking-wider">
               PRO
            </span>
          </div>
          <span className={`text-[9px] uppercase tracking-[0.45em] mt-1 ml-0.5 ${isDark ? 'text-[#00d09c]' : 'text-slate-400'}`}>
             Institutional Node
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
