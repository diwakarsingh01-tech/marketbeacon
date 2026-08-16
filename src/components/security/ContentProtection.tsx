import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, EyeOff } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

const BLOCKED_KEYS: string[] = [
  'PrintScreen',
  'ContextMenu',
  'F12',
];

const SCREENSHOT_COMBOS: Array<{ key: string; meta: boolean; shift: boolean; ctrl?: boolean }> = [
  { key: 'p', meta: true, shift: false },           // Cmd/Ctrl+P
  { key: '3', meta: true, shift: true },            // Cmd+Shift+3 (mac full screen)
  { key: '4', meta: true, shift: true },            // Cmd+Shift+4 (mac selection)
  { key: '5', meta: true, shift: true },            // Cmd+Shift+5 (mac screen record)
  { key: 's', meta: true, shift: true, ctrl: true },// Win+Shift+S (snipping)
];

const ContentProtection: React.FC<Props> = ({ children }) => {
  const [blocked, setBlocked] = useState(false);
  const blockedRef = useRef(false);

  // Blank screen while content is hidden
  useEffect(() => {
    const hide = () => {
      blockedRef.current = true;
      setBlocked(true);
    };
    const show = () => {
      blockedRef.current = false;
      setBlocked(false);
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') hide();
      else show();
    };
    const onBlur = () => hide();
    const onFocus = () => show();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Key + copy/context suppression (capture phase)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase();
      const meta = e.metaKey;
      const ctrl = e.ctrlKey;
      const shift = e.shiftKey;

      if (BLOCKED_KEYS.some(k => k.toLowerCase() === key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      for (const combo of SCREENSHOT_COMBOS) {
        if (key === combo.key.toLowerCase()) {
          const metaOk = combo.meta ? meta || ctrl : !meta && !ctrl;
          if (metaOk && shift === !!combo.shift) {
            if (combo.ctrl === undefined || ctrl === combo.ctrl) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
          }
        }
      }
    };

    const blockEvent = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('copy', blockEvent, true);
    document.addEventListener('cut', blockEvent, true);
    document.addEventListener('contextmenu', blockEvent, true);
    document.addEventListener('selectstart', blockEvent, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('copy', blockEvent, true);
      document.removeEventListener('cut', blockEvent, true);
      document.removeEventListener('contextmenu', blockEvent, true);
      document.removeEventListener('selectstart', blockEvent, true);
    };
  }, []);

  return (
    <div className="relative select-none">
      {children}

      {/* Blank screen overlay when hidden / screenshot attempt */}
      {blocked && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <EyeOff className="h-7 w-7 text-red-400" />
          </div>
          <div className="text-center space-y-2 px-6">
            <p className="text-sm font-black text-white uppercase tracking-wider">Protected Content</p>
            <p className="text-xs font-bold text-white/50">
              This lesson is encrypted for your screen. Switch back to the MarketBeacon tab to continue.
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            Screen capture is disabled on the Education segment
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentProtection;
