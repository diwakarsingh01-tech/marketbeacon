import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

console.log('🚀 [MarketBeacon] Terminal Bootstrap Initiated');

try {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(
      <StrictMode>
        <GoogleOAuthProvider clientId="500460562927-5b1mt1r0vcke4u3mm5hhj1a4cmilsgao.apps.googleusercontent.com">
          <App />
        </GoogleOAuthProvider>
      </StrictMode>,
    );
    console.log('✅ [MarketBeacon] React Mount Successful');
  } else {
    console.error('❌ [MarketBeacon] Root element not found!');
  }
} catch (e) {
  console.error('🔥 [MarketBeacon] Bootstrap Crash:', e);
  document.body.innerHTML = `<div style="padding: 40px; font-family: sans-serif; text-align: center;">
    <h1>Terminal Link Error</h1>
    <p>MarketBeacon Pro is undergoing an automated architectural upgrade.</p>
    <button onclick="location.reload()">Refresh Terminal</button>
  </div>`;
}
