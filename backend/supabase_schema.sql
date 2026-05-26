-- MarketBeacon Commercial Production Schema
-- Designed for Supabase (PostgreSQL)

-- 1. Users Table (Handles Subscriptions and Authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    tier VARCHAR(50) DEFAULT 'free',
    subscription_expiry TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Market Snapshot (Replaces the 100MB JSON File)
-- This allows us to query single stocks in milliseconds.
CREATE TABLE market_data (
    symbol VARCHAR(50) PRIMARY KEY,
    company_name VARCHAR(255),
    sector VARCHAR(100),
    market_cap BIGINT,
    current_price DECIMAL(10, 2),
    fifty_two_week_high DECIMAL(10, 2),
    fifty_two_week_low DECIMAL(10, 2),
    pe_ratio DECIMAL(10, 2),
    roe DECIMAL(10, 2),
    debt_to_equity DECIMAL(10, 2),
    smart_money_pct DECIMAL(5, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Historical Quotes (Time-Series Data for Strategy Engine)
CREATE TABLE historical_quotes (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(50) REFERENCES market_data(symbol) ON DELETE CASCADE,
    quote_date DATE NOT NULL,
    open DECIMAL(10, 2),
    high DECIMAL(10, 2),
    low DECIMAL(10, 2),
    close DECIMAL(10, 2),
    volume BIGINT
);

-- Create indexes for hyper-fast querying
CREATE INDEX idx_historical_quotes_symbol ON historical_quotes(symbol);
CREATE INDEX idx_historical_quotes_date ON historical_quotes(quote_date);

-- 4. Active Institutional Signals
CREATE TABLE active_signals (
    id BIGSERIAL PRIMARY KEY,
    symbol VARCHAR(50) REFERENCES market_data(symbol) ON DELETE CASCADE,
    strategy_name VARCHAR(100),
    signal_date DATE,
    entry_price DECIMAL(10, 2),
    target_price DECIMAL(10, 2),
    basket_source VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Subscriptions & Payments (Razorpay Integration Ready)
CREATE TABLE payments (
    id VARCHAR(255) PRIMARY KEY, -- Razorpay Payment ID
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
