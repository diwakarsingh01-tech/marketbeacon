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
  // 1. Priority: Explicit environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/' && envUrl !== 'undefined') {
    return envUrl;
  }

  // 2. Dev Fallback: If on local machine or local network
  const h = window.location.hostname;
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.168.') || h.startsWith('10.') || h.endsWith('.local');
  
  if (isLocal) {
    // Return the same host but port 3001 for backend
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  // 3. Production Safety: Force a non-existent absolute URL to prevent relative loops
  return "https://api-missing-configuration.marketbeacon.io";
};
