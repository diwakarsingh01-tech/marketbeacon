/**
 * MarketBeacon Institutional Data Hardening Utility
 * Bulletproof API URL resolution for Local and Production environments.
 */

export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    if (json.error) {
       console.error(`🚨 [API Error Response] from ${response.url}:`, json.error);
    }
    return json;
  } catch (e) {
    const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.includes('<html');
    console.group('🛡 [Institutional Safe-Guard] Payload Audit');
    console.error(`URL: ${response.url}`);
    console.error(`Status: ${response.status} ${response.statusText}`);
    console.error(`Raw Preview: ${text.substring(0, 200)}...`);
    console.groupEnd();

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
  try {
    const h = window.location.hostname;
    const p = window.location.protocol;
    const port = window.location.port;

    // 1. Manual Overrides
    const override = localStorage.getItem('mb_api_override');
    if (override && override.length > 5) {
       if (override.includes(':5173') || override.includes(':5174')) {
          localStorage.removeItem('mb_api_override');
       } else {
          return override;
       }
    }

    // 2. Production Lockdown (Highest Priority)
    const isProduction = h.includes('marketbeaconpro.com') || h.includes('marketbeacon.vercel.app');
    if (isProduction) return "https://marketbeaconpro.com";

    // 3. Explicit Environment Variable (Local/Manual Override)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // 4. Local Network Fallback
    const isLocal = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.') || h.startsWith('10.') || h.startsWith('172.') || h.endsWith('.local');
    if (isLocal) return `${p}//${h}:3001`;

    return "https://marketbeacon.onrender.com";
  } catch (e) {
    console.error('🛡️ [Safe-Guard] API URL Resolution failed, using fallback.');
    return "https://marketbeacon.onrender.com";
  }
};
