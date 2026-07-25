import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface TourStepConfig {
  id: string;
  title: string;
  body: string;
  route?: string;
  highlightSelector?: string;
  cta?: string;
  subSteps?: string[];
}

export const INVESTMENT_TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'welcome',
    title: 'Welcome to MarketBeacon Pro',
    body: 'This tour walks you through the full investment workflow page-by-page. At each step, you\'ll see exactly what to do and where to click. Click "Next" to begin your journey from stock discovery to portfolio management.',
    route: '/guide',
  },
  {
    id: 'alpha-hub',
    title: 'Step 1: Alpha Hub — Strategy Console',
    body: 'This is your central command center. Alpha Hub shows institutional-grade strategy signals and scores for 40+ stocks. Look at the portfolio table below to see active setups.',
    route: '/alpha-hub',
    highlightSelector: '[data-tour="alpha-table"]',
    cta: 'Review the portfolio table for active signals',
    subSteps: [
      'Each row shows a stock with its strategy, entry price, target, and ROI',
      'Click any stock symbol to open its detailed analysis page',
      'Use the basket buttons (Elite, Quality, Growth, Fallen Value) to filter by strategy type',
      'The score column indicates institutional confidence — higher is better',
    ],
  },
  {
    id: 'screener',
    title: 'Step 2: Screener — Discover Stocks',
    body: 'The Stock Screener lets you filter all NSE stocks by fundamentals. Use the filter panel to find stocks matching your investment thesis.',
    route: '/screener',
    highlightSelector: '[data-tour="screener-filters"]',
    cta: 'Apply filters to build your watchlist',
    subSteps: [
      'Set PE ratio range to filter overvalued/undervalued stocks',
      'Choose sector to focus on specific industries',
      'Filter by market cap to find large-cap stability or mid/small-cap growth',
      'Use the debt-to-equity filter to find financially healthy companies',
      'Click "Run Audit" to validate stocks against institutional criteria',
    ],
  },
  {
    id: 'charts',
    title: 'Step 3: Chart Terminal — Technical Analysis',
    body: 'The Chart Terminal shows 20-year price history with support/resistance levels and candlestick patterns. Search for any stock to load its chart.',
    route: '/charts',
    highlightSelector: '[data-tour="chart-search"]',
    cta: 'Type a stock symbol (e.g. RELIANCE) to load its chart',
    subSteps: [
      'Type a stock symbol in the search box to load its chart',
      'Use the timeframe buttons (1D, 1W, 1M, 1Y, 5Y, 20Y) to zoom',
      'Enable strategy overlays to see ABCD Tranche entry/exit zones',
      'Look for support/resistance levels marked on the chart',
      'The candlestick patterns help identify trend reversals',
    ],
  },
  {
    id: 'portfolio',
    title: 'Step 4: Portfolio Manager — Build Holdings',
    body: 'Convert your researched picks into a structured portfolio. Add stocks, set position sizes, and track real-time value.',
    route: '/portfolio',
    highlightSelector: '[data-tour="portfolio-table"]',
    cta: 'Add your first stock position',
    subSteps: [
      'Click "Add Position" to add a new stock to your portfolio',
      'Enter the stock symbol, quantity, and buy price',
      'Set your capital allocation per position',
      'The system auto-calculates current value and P&L',
      'Use allocation bars to see your weight distribution',
    ],
  },
  {
    id: 'journal',
    title: 'Step 5: Trade Journal — Document Decisions',
    body: 'Record every buy and sell with reasoning. This becomes your institutional-grade trade diary for process improvement.',
    route: '/trades',
    highlightSelector: '[data-tour="journal-add"]',
    cta: 'Log your first trade entry',
    subSteps: [
      'Click "Add Trade" or "New Entry" to record a new trade',
      'Select buy or sell, enter stock symbol, quantity, and price',
      'Write your reasoning — why this stock, why now, what\'s the thesis',
      'Close trades when you exit to record the outcome',
      'Review closed trades to learn from your wins and losses',
    ],
  },
  {
    id: 'education',
    title: 'Step 6: Education — Learn the Framework',
    body: 'Watch video course modules to understand risk management, position sizing, and the ABCD Tranche framework behind the platform.',
    route: '/education',
    highlightSelector: '[data-tour="edu-modules"]',
    cta: 'Start with the Foundation module',
    subSteps: [
      'Begin with the "Foundation" module — it covers the core methodology',
      'The "ABCD Framework" module explains tranche-based entry/exit',
      'The "Risk Management" module covers position sizing and stop losses',
      'Mark lessons as complete to track your progress',
      'Use the "Tour" tab for a visual walkthrough of platform features',
    ],
  },
  {
    id: 'ai',
    title: 'Step 7: BeaconAI — Strategy Assistant',
    body: 'Ask the AI assistant specific investment questions. It uses your portfolio context to give relevant, actionable guidance.',
    route: '/ai-assistant',
    highlightSelector: '[data-tour="ai-input"]',
    cta: 'Type a question for the AI',
    subSteps: [
      'Type your question in the chat input box at the bottom',
      'Ask "evaluate my portfolio for risk" for personalized analysis',
      'Ask "suggest filters for mid-cap swing trading" for strategy ideas',
      'The AI references your current holdings for contextual advice',
      'Use follow-up questions to dig deeper into any analysis',
    ],
  },
  {
    id: 'complete',
    title: 'You Are Ready to Invest',
    body: 'You now know the full workflow: Discover → Analyze → Build → Document → Learn → Ask AI. Start by visiting the Screener to find your first stock, or go to Alpha Hub for institutional signals.',
    route: '/guide',
    subSteps: [
      'Bookmark this guide page for future reference',
      'Start with the Screener to find your first stock candidate',
      'Or jump to Alpha Hub for pre-validated institutional signals',
    ],
  },
];

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: (fromStep?: number) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  currentConfig: TourStepConfig | null;
}

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const navigate = useNavigate();

  const currentConfig = isActive ? INVESTMENT_TOUR_STEPS[currentStep] : null;
  const totalSteps = INVESTMENT_TOUR_STEPS.length;

  const startTour = useCallback((fromStep: number = 0) => {
    setCurrentStep(fromStep);
    setIsActive(true);
    const step = INVESTMENT_TOUR_STEPS[fromStep];
    if (step?.route) {
      setNavigating(true);
      navigate(step.route);
    }
  }, [navigate]);

  const stopTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep( 0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= totalSteps) {
        setIsActive(false);
        return prev;
      }
      const step = INVESTMENT_TOUR_STEPS[next];
      if (step?.route) {
        setNavigating(true);
        navigate(step.route);
      }
      return next;
    });
  }, [navigate, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => {
      const back = Math.max(0, prev - 1);
      const step = INVESTMENT_TOUR_STEPS[back];
      if (step?.route) {
        setNavigating(true);
        navigate(step.route);
      }
      return back;
    });
  }, [navigate]);

  const goToStep = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps) return;
    setCurrentStep(step);
    setIsActive(true);
    const config = INVESTMENT_TOUR_STEPS[step];
    if (config?.route) {
      setNavigating(true);
      navigate(config.route);
    }
  }, [navigate, totalSteps]);

  useEffect(() => {
    if (navigating) {
      const timer = setTimeout(() => setNavigating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [navigating]);

  return (
    <TourContext.Provider value={{
      isActive,
      currentStep,
      totalSteps,
      startTour,
      stopTour,
      nextStep,
      prevStep,
      goToStep,
      currentConfig,
    }}>
      {children}
    </TourContext.Provider>
  );
};