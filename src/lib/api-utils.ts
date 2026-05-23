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
  // Use environment variable if provided (Standard for Vercel/Production)
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl && envUrl !== '/' && envUrl !== 'undefined') {
    return envUrl;
  }

  // Fallback for Local Development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return "http://localhost:3001";
  }

  // CRITICAL: In production, if VITE_API_URL is missing, we must return a dummy absolute URL
  // to prevent relative fetch loops that return Vercel HTML 404 pages.
  return "https://api-missing-configuration.marketbeacon";
};
