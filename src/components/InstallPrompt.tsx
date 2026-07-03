import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
    if (!mobile) return;

    setIsIOS(/iPhone|iPad|iPod/i.test(ua));

    const dismissed = localStorage.getItem('mb_install_prompt_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
      localStorage.removeItem('mb_install_prompt_dismissed');
    }

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('mb_install_prompt_dismissed', String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] max-w-md mx-auto animate-slide-up">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl shadow-slate-900/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 shrink-0 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center">
            <svg viewBox="0 0 40 40" fill="none" className="w-5 h-5">
              <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="#0f172a" stroke="#2563eb" stroke-width="2.5"/>
              <path d="M12 28V18L20 12L28 18V28" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="20" cy="20" r="3" fill="#2563eb" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white uppercase tracking-wider">
              Install MarketBeacon
            </p>
            <p className="text-caption font-medium text-slate-400 mt-1 leading-relaxed">
              {isIOS
                ? <>Tap <span className="text-blue-400">Share</span> → <span className="text-blue-400">Add to Home Screen</span></>
                : <>Tap <span className="text-blue-400">Menu</span> → <span className="text-blue-400">Add to Home Screen</span></>}
            </p>
          </div>
          <button onClick={dismiss} className="p-1 text-slate-500 hover:text-white transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
