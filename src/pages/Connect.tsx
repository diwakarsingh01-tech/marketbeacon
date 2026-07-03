import React, { useState, useEffect } from 'react';
import SEO from '../components/SEO';
import { 
  RefreshCw, 
  Database, 
  Wifi, 
  WifiOff, 
  Server,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getApiUrl } from '../lib/api-utils';
import BrandLogo from '../components/brand/BrandLogo';

const ConnectivityHub: React.FC = () => {
  const [apiUrl, setApiUrl] = useState(getApiUrl());
  const [newUrl, setNewUrl] = useState('');
  const [status, setStatus] = useState<'testing' | 'online' | 'offline'>('testing');
  const [latency, setLatency] = useState<number | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const testConnection = async (url: string = apiUrl) => {
    setStatus('testing');
    const start = Date.now();
    try {
      const res = await fetch(`${url}/api/marketplace`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        setLatency(Date.now() - start);
        setStatus('online');
      } else {
        setStatus('offline');
      }
    } catch (e) {
      setStatus('offline');
      setLatency(null);
    }
  };

  useEffect(() => {
    testConnection();
    setDiagnosticData({
      browser: navigator.userAgent.split(') ')[0].split(' (')[1] || 'Unknown',
      os: navigator.platform,
      resolution: `${window.screen.width}x${window.screen.height}`,
      timestamp: new Date().toISOString(),
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });
  }, []);

  const handleSaveOverride = () => {
    if (!newUrl) return;
    setIsSaving(true);
    localStorage.setItem('mb_api_override', newUrl);
    setApiUrl(newUrl);
    setTimeout(() => {
      setIsSaving(false);
      testConnection(newUrl);
      setNewUrl('');
    }, 800);
  };

  const handleReset = () => {
    localStorage.removeItem('mb_api_override');
    window.location.reload();
  };

  const isLocal = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');

  return (
    <>
      <SEO title="Connectivity Hub" description="Check your MarketBeacon Pro API connection status, latency, and diagnostic information." url="/connect" noindex />
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 md:p-10 font-sans text-slate-900">
      <div className="w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side: Brand & Status */}
        <div className="md:w-5/12 bg-slate-900 p-10 md:p-16 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32" />
          
          <div className="relative z-10 space-y-12">
            <BrandLogo variant="dark" size={30} />

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight uppercase italic leading-tight">Connectivity<br />Monitor</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.4em]">Institutional Diagnostic Hub</p>
            </div>

            <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${
              status === 'online' ? 'bg-emerald-500/10 border-emerald-500/20' : 
              status === 'offline' ? 'bg-rose-500/10 border-rose-500/20' : 
              'bg-blue-500/10 border-blue-500/20'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  status === 'online' ? 'bg-emerald-500 text-white' : 
                  status === 'offline' ? 'bg-rose-500 text-white' : 
                  'bg-blue-500 text-white animate-pulse'
                }`}>
                  {status === 'online' ? <Wifi className="h-6 w-6" /> : 
                   status === 'offline' ? <WifiOff className="h-6 w-6" /> : 
                   <RefreshCw className="h-6 w-6 animate-spin" />}
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Node Status</span>
                  <h3 className="text-xl font-semibold uppercase tracking-tighter italic">
                    {status === 'online' ? 'Connected' : status === 'offline' ? 'Disconnected' : 'Syncing...'}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-12 space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Environment</span>
            <div className="flex items-center space-x-2">
              <Server className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider">{isLocal ? 'Local Dev Instance' : 'Institutional AWS'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics & Configuration */}
        <div className="flex-1 p-10 md:p-16 flex flex-col space-y-12 overflow-y-auto max-h-[90vh] custom-scrollbar">
          
          {/* 1. Live Endpoint Config */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center">
                <Terminal className="h-4 w-4 mr-2 text-blue-600" /> Endpoint Configuration
              </h2>
              <button 
                onClick={() => testConnection()}
                className="text-xs font-bold uppercase tracking-wider text-blue-600 hover:text-slate-900 transition-colors"
              >
                Force Refresh
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active URL</span>
                  <span className="text-xs font-bold text-slate-900 select-all">{apiUrl}</span>
                </div>
                {latency && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latency</span>
                    <span className="text-xs font-bold text-emerald-600 block">{latency}ms</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    placeholder="Enter Custom Backend IP (e.g. http://13.233.X.X:3001)"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold focus:bg-white focus:border-slate-900 transition-all outline-none"
                  />
                </div>
                <button 
                  onClick={handleSaveOverride}
                  disabled={isSaving || !newUrl}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                >
                  {isSaving ? 'Saving...' : 'Switch Node'}
                </button>
              </div>
            </div>
          </div>

          {/* 2. System Audit */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-wider flex items-center">
              <Database className="h-4 w-4 mr-2 text-blue-600" /> System Audit
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {diagnosticData && Object.entries(diagnosticData).map(([key, val]) => (
                <div key={key} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex flex-col space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{key}</span>
                  <span className="text-xs font-bold text-slate-600 truncate">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Actions */}
          <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
            <button 
              onClick={handleReset}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-rose-600 transition-colors"
            >
              Reset to Institutional Defaults
            </button>
            <Link 
              to="/login"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 shadow-lg shadow-blue-500/20"
            >
              <span>Return to Terminal</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

      </div>
    </div>
    </>
  );
};

export default ConnectivityHub;
