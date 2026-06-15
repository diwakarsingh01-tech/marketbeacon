import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

// Initialize theme from localStorage
(() => {
  const saved = localStorage.getItem('mb_theme');
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    // Default to dark
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

console.log('🚀 [MarketBeacon] Terminal Initializing...');

const container = document.getElementById('root');
if (!container) {
  document.body.innerHTML = '<div style="padding:50px; text-align:center;"><h1>Fatal: Root Not Found</h1></div>';
} else {
  try {
    const root = createRoot(container);
    root.render(
      <StrictMode>
        <GoogleOAuthProvider clientId="500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com">
          <App />
        </GoogleOAuthProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('🔥 Bootstrap Crash:', error);
  }
}
// [Institutional Deploy] v12.2.2-PRO-FIX-FINAL
