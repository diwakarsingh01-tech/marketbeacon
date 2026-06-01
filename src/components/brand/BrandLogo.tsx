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
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* The Beacon Icon */}
      <div 
        className="relative flex items-center justify-center shrink-0 group"
        style={{ width: size, height: size }}
      >
        {/* Glowing Background Effect */}
        <div className="absolute inset-0 bg-blue-600/20 blur-xl rounded-full scale-150 animate-pulse" />
        
        {/* SVG Icon Construction */}
        <svg 
          viewBox="0 0 40 40" 
          className="relative z-10 w-full h-full drop-shadow-2xl"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Shield/Hex */}
          <path 
            d="M20 2L36 11V29L20 38L4 29V11L20 2Z" 
            fill={isDark ? "#0f172a" : "#ffffff"} 
            stroke="#2563eb" 
            strokeWidth="2.5"
          />
          
          {/* The "Pulse Beacon" */}
          <path 
            d="M12 28V18L20 12L28 18V28" 
            stroke="#2563eb" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <circle cx="20" cy="20" r="3" fill="#2563eb" className="animate-pulse" />
          
          {/* Signal Lines */}
          <path d="M16 28H24" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
          <path d="M10 20H14" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
          <path d="M26 20H30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        </svg>
      </div>

      {!hideText && (
        <div className="flex flex-col leading-none">
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <span className="text-xl font-black tracking-tighter uppercase italic">
              MarketBeacon
            </span>
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-lg italic tracking-widest leading-none">
              PRO
            </span>
          </div>
          <span className={`text-[7px] font-black uppercase tracking-[0.4em] mt-1.5 ml-0.5 ${isDark ? 'text-blue-400' : 'text-slate-400'}`}>
            Institutional Terminal
          </span>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
