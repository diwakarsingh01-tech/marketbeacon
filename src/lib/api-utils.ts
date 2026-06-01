/**
 * MarketBeacon Institutional Data Hardening Utility
 * Bulletproof API URL resolution for Local and Production environments.
 */

export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.includes('<html');
    return { 
      error: isHtml 
        ? "Protocol Mismatch: Frontend hit an HTML server instead of the API. Please verify connectivity." 
        : "Institutional Data Corrupted: Backend returned invalid format.",
      isHtmlResponse: isHtml,
      status: response.status,
      url: response.url
    };
  }
}

export const getApiUrl = () => {
  const h = window.location.hostname;
  const p = window.location.protocol;

  // 1. Manual Overrides (For Debugging)
  const override = localStorage.getItem('mb_api_override');
  if (override && override.length > 5) return override;

  // 2. Production Check (Explicit Domains)
  const isProduction = h.includes('marketbeaconpro.com') || h.includes('marketbeacon.vercel.app');
  
  if (isProduction) {
    const prodUrl = "https://marketbeacon.onrender.com";
    console.log(`🚀 [Production Node] Targeting: ${prodUrl}`);
    return prodUrl;
  }

  // 3. Local / Network Environment Detection
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.') || h.startsWith('10.') || h.startsWith('172.') || h.endsWith('.local');
  
  if (isLocal) {
    const localUrl = `${p}//${h}:3001`;
    console.log(`💻 [Local Node] Targeting: ${localUrl}`);
    return localUrl;
  }

  // 4. Fail-safe Fallback (Default to Production)
  const envUrl = import.meta.env.VITE_API_URL;
  const finalUrl = (envUrl && envUrl.startsWith('http')) ? envUrl : "https://marketbeacon.onrender.com";
  
  console.log(`🌐 [Fail-safe Node] Targeting: ${finalUrl}`);
  return finalUrl;
};
