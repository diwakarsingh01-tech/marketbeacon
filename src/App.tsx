import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { TourProvider } from './context/TourContext';
import AuthGuard from './components/auth/AuthGuard';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Skeleton from './components/ui/Skeleton';
import { TourOverlay } from './components/tour/TourOverlay';

// Home loads eagerly for fastest initial paint — all other pages are lazy
import HomePage from './pages/Home';
const LoginPage = lazy(() => import('./pages/Login'));
const PinLoginPage = lazy(() => import('./pages/PinLogin'));
const DashboardPage = lazy(() => import('./pages/Dashboard'));
const AlphaHubPage = lazy(() => import('./pages/AlphaHub'));
const GuidePage = lazy(() => import('./pages/Guide'));
const PublicAnalysisPage = lazy(() => import('./pages/PublicAnalysis'));
const StockFundamentalsPage = lazy(() => import('./pages/StockFundamentals'));
const TradeJournalPage = lazy(() => import('./pages/TradeJournal'));
const ProfilePage = lazy(() => import('./pages/Profile'));
const EducationPage = lazy(() => import('./pages/Education'));
const PricingPage = lazy(() => import('./pages/Pricing'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const AdminGrowthLabPage = lazy(() => import('./pages/AdminGrowthLab'));
const MembershipPage = lazy(() => import('./pages/Marketplace'));
const ConnectivityHubPage = lazy(() => import('./pages/Connect'));
const BlogPage = lazy(() => import('./pages/Blog'));
const BlogArticlePage = lazy(() => import('./pages/BlogArticle'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy'));
const MethodologyPage = lazy(() => import('./pages/Methodology'));
const AppHomePage = lazy(() => import('./pages/AppHome'));
const AiAssistantPage = lazy(() => import('./pages/AiAssistant'));
const NotFoundPage = lazy(() => import('./pages/NotFound'));
const ChartsTerminalPage = lazy(() => import('./pages/ChartsTerminal'));
const ScreenerVerifyPage = lazy(() => import('./pages/ScreenerVerify'));
const PublicStockCheckPage = lazy(() => import('./pages/PublicStockCheck'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfService'));
const DisclaimerPage = lazy(() => import('./pages/Disclaimer'));
const AboutPage = lazy(() => import('./pages/About'));
const ContactPage = lazy(() => import('./pages/Contact'));

import { ThemeProvider } from './context/ThemeContext';

// Institutional Loading Skeleton
const PageLoader = () => (
  <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-8 lg:p-10 space-y-6 animate-in fade-in duration-300">
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
    <Skeleton className="h-12 rounded-2xl" />
    <Skeleton className="h-96 rounded-2xl" />
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Marketing Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pin-login" element={<PinLoginPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/connect" element={<ConnectivityHubPage />} />
        <Route path="/check" element={<PublicStockCheckPage />} />
        <Route path="/analysis/:symbol" element={<PublicAnalysisPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogArticlePage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/disclaimer" element={<DisclaimerPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/marketplace" element={<Navigate to="/license-desk" replace />} />

        {/* Authenticated SaaS Platform */}
        <Route 
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/charts" element={<ChartsTerminalPage />} />
          <Route path="/ai-assistant" element={<AiAssistantPage />} />
          <Route path="/app" element={<AppHomePage />} />
          <Route path="/alpha-hub" element={<AlphaHubPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="/screener" element={<DashboardPage key="screener" defaultTab="open" />} />
          <Route path="/screener-verify" element={<ScreenerVerifyPage />} />
          <Route path="/market" element={<DashboardPage key="market" defaultTab="hold" />} />
          <Route path="/portfolio" element={<DashboardPage key="portfolio" defaultTab="portfolio" />} />
          <Route path="/trades" element={<TradeJournalPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/stock/:symbol" element={<StockFundamentalsPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/growth-lab" element={<AdminGrowthLabPage />} />
          <Route path="/license-desk" element={<MembershipPage />} />
        </Route>
        
        {/* Redirects */}
        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <HelmetProvider>
    <ThemeProvider>
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton expand={false} visibleToasts={5} duration={5000} toastOptions={{ style: { fontSize: '13px', fontWeight: 600 }, className: 'font-sans' }} />
      <Router>
        <TourProvider>
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
        </ErrorBoundary>
        <TourOverlay />
        </TourProvider>
      </Router>
    </AuthProvider>
    </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
