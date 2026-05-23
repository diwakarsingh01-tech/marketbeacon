/**
 * MarketBeacon Institutional Data Hardening Utility
 * Prevents "Unexpected token <" crashes by validating JSON before parsing.
 */

export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("[M-SEC] Invalid Institutional Data Received (HTML detected instead of JSON).");
    console.error("[M-SEC] Sample response:", text.substring(0, 100));
    return { 
      error: "Protocol Mismatch: Backend returned HTML (404/Error) instead of Data. Check VITE_API_URL.",
      isHtmlResponse: true,
      raw: text.substring(0, 200)
    };
  }
}

export const getApiUrl = () => {
  const h = window.location.hostname;
  const p = window.location.protocol;
  
  // 1. Priority: Explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/' && envUrl !== 'undefined' && envUrl !== 'null') {
    return envUrl;
  }

  // 2. Dev/Antigravity Fallback: Comprehensive Private Network Detection
  const isLocal = 
    h === 'localhost' || 
    h === '127.0.0.1' || 
    h.startsWith('192.168.') || 
    h.startsWith('10.') || 
    h.startsWith('172.') || 
    h.endsWith('.local') ||
    h.includes('.internal');
  
  if (isLocal) {
    // Standardize to HTTP for local backend unless specifically on HTTPS localhost
    const protocol = (h === 'localhost' && p === 'https:') ? 'https:' : 'http:';
    return `${protocol}//${h}:3001`;
  }

  // 3. Production Safety: Explicitly block relative paths
  return "https://api-missing-configuration.marketbeacon.io";
};
