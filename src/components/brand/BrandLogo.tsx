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
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/35 to-indigo-600/25 blur-lg rounded-full scale-150 group-hover:scale-175 transition-transform duration-500 animate-pulse" />
        
        {/* SVG Icon Construction */}
        <svg 
          viewBox="0 0 40 40" 
          className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(37,99,235,0.4)] group-hover:rotate-12 transition-transform duration-500"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
             <linearGradient id="logoGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6"/>
                <stop offset="100%" stopColor="#6366f1"/>
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
          <circle cx="20" cy="19" r="3" fill="#6366f1" className="animate-ping" style={{ transformOrigin: '20px 19px' }} />
          <circle cx="20" cy="19" r="2.5" fill="#3b82f6" />
          
          {/* Base lines */}
          <path d="M16 27H24" stroke="url(#logoGlow)" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      {!hideText && (
        <div className="flex flex-col leading-none select-none">
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-[17px] font-black tracking-tighter uppercase italic leading-none">
               Market<span className="text-blue-500">Beacon</span>
            </span>
            <span className="px-2 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[8px] font-black rounded-lg italic tracking-widest leading-none shadow-lg shadow-blue-500/20">
               PRO
            </span>
          </div>
          <span className={`text-[6.5px] font-black uppercase tracking-[0.45em] mt-1.5 ml-0.5 ${isDark ? 'text-blue-400' : 'text-slate-400'}`}>
             Institutional Node
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
