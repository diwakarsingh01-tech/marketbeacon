import { useEffect, useRef } from 'react';
export function useWakeLock() {
  const wakeLockRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          const wl = await (navigator as any).wakeLock.request('screen');
          wakeLockRef.current = wl;
          wl.addEventListener('release', () => {});
        }
      } catch (e) {
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestWakeLock();
    intervalRef.current = setInterval(() => {
      fetch(window.location.href, { method: 'HEAD', cache: 'no-store' }).catch(() => {});
    }, 30000);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try { wakeLockRef.current.release(); } catch (e) {}
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
