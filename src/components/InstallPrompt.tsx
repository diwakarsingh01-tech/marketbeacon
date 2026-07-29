import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // 1. Check if already installed / running standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // 2. Detect OS
    const ua = navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(isIOSDevice);

    // 3. Check dismiss cooldown (dismissed prompts are hidden for 3 days)
    const dismissed = localStorage.getItem('mb_install_prompt_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysSince < 3) return;
      localStorage.removeItem('mb_install_prompt_dismissed');
    }

    // 4. iOS Safari Detection (No native prompt event, show custom instructions after delay)
    if (isIOSDevice) {
      // Verify it's Safari (other browsers on iOS don't support Add to Home Screen)
      const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/i.test(ua);
      if (isSafari) {
        const timer = setTimeout(() => setShow(true), 6000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // 5. Android & Desktop Native Prompt Handling
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('mb_install_prompt_dismissed', String(Date.now()));
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA Install Choice: ${outcome}`);
    } catch (err) {
      console.error('Error handling install prompt choice:', err);
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  return (
    <div className="fixed bottom-24 md:bottom-6 left-4 right-4 z-[9999] max-w-lg mx-auto animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-[#00d09c]/10 to-blue-500/10 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Logo & Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#00d09c]/15 to-blue-500/15 border border-[#00d09c]/30 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
              <svg viewBox="0 0 40 40" fill="none" className="w-6 h-6">
                <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="#020617" stroke="#00d09c" strokeWidth="2.5"/>
                <path d="M12 28V18L20 12L28 18V28" stroke="#00d09c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="20" cy="20" r="3" fill="#00d09c" />
              </svg>
            </div>
            
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white tracking-wide uppercase">
                MarketBeacon Pro
              </h4>
              <p className="text-caption font-bold text-slate-400 mt-0.5">
                Install as a standalone web application.
              </p>
            </div>
          </div>

          {/* Action / Banner */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            {isIOS ? (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 text-[10px] font-bold text-slate-300">
                <Share className="h-4 w-4 text-[#00d09c]" />
                <span className="leading-tight">Tap Share → Add to Home Screen</span>
              </div>
            ) : (
              <button
                onClick={handleInstallClick}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00d09c] to-blue-600 hover:from-[#00bda0] hover:to-blue-500 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-[#00d09c]/10 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Install App
              </button>
            )}
            
            <button 
              onClick={dismiss} 
              aria-label="Dismiss banner"
              className="p-2.5 text-slate-500 hover:text-white transition-colors bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
