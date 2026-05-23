/**
 * MarketBeacon Institutional Data Hardening Utility
 * Prevents "Unexpected token <" crashes by validating JSON before parsing.
 */

export async function safeJsonParse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    const isHtml = text.trim().toLowerCase().startsWith('<!doctype') || text.includes('<html');
    return { 
      error: isHtml 
        ? "Protocol Mismatch: Your terminal is hitting a web server (HTML) instead of the Backend. Please enter your Backend IP using the 'Fix Connectivity' button." 
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

  // 1. Manual Overrides (Highest Priority)
  const override = localStorage.getItem('mb_api_override');
  if (override && override.length > 5) return override;

  // 2. Local Network Detection (Antigravity/Home)
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h.startsWith('192.') || h.startsWith('10.') || h.startsWith('172.') || h.endsWith('.local');
  if (isLocal) return `${p}//${h}:3001`;

  // 3. Environment Config
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/' && envUrl !== 'undefined' && !envUrl.includes(h)) return envUrl;

  // 4. Default Fail-safe (Avoid relative path loop)
  return "http://localhost:3001";
};
