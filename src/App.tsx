import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import AppLayout from './components/layout/AppLayout';

// Core Public Routes (Non-Lazy for instant splash)
import HomePage from './pages/Home';
import LoginPage from './pages/Login';

// Lazy Loaded Professional Modules
const RegisterPage = lazy(() => import('./pages/Register'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const StockFundamentalsPage = lazy(() => import('./pages/StockFundamentals'));
const TradeJournalPage = lazy(() => import('./pages/TradeJournal'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const EducationPage = lazy(() => import('./pages/Education'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const MembershipPage = lazy(() => import('./pages/Marketplace'));

// Institutional Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 space-y-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
         <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
      </div>
    </div>
    <div className="flex flex-col items-center space-y-1">
       <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em] ml-1">MarketBeacon</span>
       <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Initializing Terminal...</span>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Marketing Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* Authenticated SaaS Platform */}
            <Route 
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              {/* Split Views */}
              <Route path="/screener" element={<DashboardPage key="screener" defaultTab="open" />} />
              <Route path="/market" element={<DashboardPage key="market" defaultTab="watchlist" />} />
              <Route path="/portfolio" element={<DashboardPage key="portfolio" defaultTab="portfolio" />} />
              <Route path="/journal" element={<Navigate to="/trades" replace />} />
              <Route path="/trades" element={<TradeJournalPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/membership" element={<MembershipPage />} />
              <Route path="/stock/:symbol" element={<StockFundamentalsPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
            {/* Legacy & Redirects */}
            <Route path="/dashboard" element={<Navigate to="/screener" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
