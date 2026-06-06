import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import AppLayout from './components/layout/AppLayout';

// Core Pages (Standard imports for production stability)
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import AlphaHubPage from './pages/AlphaHub';
import PublicAnalysisPage from './pages/PublicAnalysis';
import StockFundamentalsPage from './pages/StockFundamentals';
import TradeJournalPage from './pages/TradeJournal';
import ProfilePage from './pages/Profile';
import EducationPage from './pages/Education';
import PricingPage from './pages/Pricing';
import AdminPanel from './pages/AdminPanel';
import MembershipPage from './pages/Marketplace';
import ConnectivityHubPage from './pages/Connect';
import BlogPage from './pages/Blog';
import BlogArticlePage from './pages/BlogArticle';
import PrivacyPolicyPage from './pages/PrivacyPolicy';

// Institutional Loading Component
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 space-y-6">
    <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-600 rounded-full animate-spin" />
    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">MarketBeacon Node Syncing...</span>
  </div>
);

function App() {
  console.log('🏗️ [MarketBeacon] App Component Rendering...');
  return (
    <AuthProvider>
      <Router>
          <Routes>
            {/* Public Marketing Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/connect" element={<ConnectivityHubPage />} />
            <Route path="/analysis/:symbol" element={<PublicAnalysisPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogArticlePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<PrivacyPolicyPage />} />
            <Route path="/marketplace" element={<Navigate to="/license-desk" replace />} />

            {/* Authenticated SaaS Platform */}
            <Route 
              element={
                <AuthGuard>
                  <AppLayout />
                </AuthGuard>
              }
            >
              <Route path="/alpha-hub" element={<AlphaHubPage />} />
              <Route path="/screener" element={<DashboardPage key="screener" defaultTab="open" />} />
              <Route path="/market" element={<DashboardPage key="market" defaultTab="hold" />} />
              <Route path="/portfolio" element={<DashboardPage key="portfolio" defaultTab="portfolio" />} />
              <Route path="/trades" element={<TradeJournalPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/stock/:symbol" element={<StockFundamentalsPage />} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/license-desk" element={<MembershipPage />} />
            </Route>
            
            {/* Redirects */}
            <Route path="/dashboard" element={<Navigate to="/alpha-hub" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
