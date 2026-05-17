import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/auth/AuthGuard';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/Home';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import StockFundamentalsPage from './pages/StockFundamentals';
import TradeJournalPage from './pages/TradeJournal';
import ProfilePage from './pages/Profile';
import MarketplacePage from './pages/Marketplace';
import EducationPage from './pages/Education';
import PricingPage from './pages/Pricing';
import AdminPanel from './pages/AdminPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            <Route path="/journal" element={<TradeJournalPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/stock/:symbol" element={<StockFundamentalsPage />} />
            <Route path="/education" element={<EducationPage />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Legacy & Redirects */}
          <Route path="/dashboard" element={<Navigate to="/screener" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
