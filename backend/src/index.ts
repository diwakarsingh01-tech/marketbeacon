import express from 'express';
import YahooFinance from 'yahoo-finance2';
import cors from 'cors';
import dotenv from 'dotenv';

const yahooFinance = new YahooFinance();
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// --- Helper: Reliable IST Market Status ---
const getMarketStatus = () => {
  const istString = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  
  const day = istDate.getDay(); // 0-6
  const hours = istDate.getHours();
  const minutes = istDate.getMinutes();
  const currentTime = hours * 100 + minutes;

  if (day === 0 || day === 6) return 'CLOSED'; 
  
  if (currentTime >= 900 && currentTime < 915) return 'PRE-MARKET';
  if (currentTime >= 915 && currentTime <= 1530) return 'LIVE';
  if (currentTime > 1530 && currentTime < 1600) return 'POST-MARKET';
  return 'CLOSED';
};

// Market Indices Endpoint
app.get('/api/market-indices', async (req, res) => {
  try {
    const symbols = ['^NSEI', '^NSEBANK', '^BSESN'];
    const status = getMarketStatus();
    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          // @ts-ignore
          const quote: any = await yahooFinance.quote(symbol);
          return {
            name: symbol === '^NSEI' ? 'NIFTY 50' : (symbol === '^NSEBANK' ? 'BANK NIFTY' : 'SENSEX'),
            price: quote.regularMarketPrice,
            ath: quote.fiftyTwoWeekHigh,
            openPrice: quote.regularMarketOpen,
            change: quote.regularMarketChangePercent
          };
        } catch (e) {
          return { name: symbol, price: 0, change: 0 };
        }
      })
    );
    res.json({ status, results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const BASKETS: Record<string, string[]> = {
  'BLUECHIP': [
    'ITC', 'WIPRO', 'KANSAINER', 'DABUR', 'BATAINDIA', 'WHIRLPOOL', 'COLPAL',
    'TCS', 'HCLTECH', 'INFY', 'HAVELLS', 'PIDILITIND', 'NESTLEIND', 'HINDUNILVR',
    'SANOFI', 'PGHH', 'ASIANPAINT', 'TITAN', 'NIFTYBEES', 'ICICIPRULI', 'AKZOINDIA',
    'KOTAKBANK', 'AXISBANK', 'ULTRACEMCO', 'BAJAJ-AUTO', 'BERGEPAINT', 'PAGEIND',
    'HDFCBANK', 'ICICIBANK', 'MARICO', 'BAJAJHLDNG', 'ICICIGI', 'BAJAJFINSV',
    'HDFCLIFE', 'PFIZER', 'BANKBEES', 'GLAXO', 'GILLETTE', 'AMBUJACEM', 'ABBOTINDIA',
    'BAJFINANCE', 'HDFCAMC', 'NAM-INDIA'
  ],
  'HIGH_BETA': [
    'AVANTIFEED', 'VIPIND', 'SYMPHONY', 'EQUITASBNK', 'RAJESHEXPO', 'TEAMLEASE', 
    'FINCABLES', 'KANSAINER', 'SIS', 'CERA', 'TTKPRESTIG', 'SUNTV', 'BAYERCROP', 
    '3MINDIA', 'UNITDSPR', 'KEI', 'SFL', 'ASTRAZEN', 'CAPLIPOINT', 'FINEORG', 
    'KAJARIACER', 'HONAUT', 'VINATIORGA', 'RELAXO', 'DIXON', 'HEROMOTOCO', 'OFSS', 
    'GODREJCP', 'PGHL', 'TASTYBITE', 'LALPATHLAB', 'UJJIVANSFB', 'EICHERMOT', 
    'VGUARD', 'POLYCAB', 'JCHAC', 'BOSCHLTD', 'MOTILALOFS', 'TVSMOTOR', 'ERIS', 
    'RADICO', 'MCX', 'IEX'
  ],
  'PROFIT_PRUDENCE': [
    'CDSL', 'BSE', 'MCX', 'IEX', 'CAMS', 'HAPPSTMNDS', 'AFLE', 'CENTURYPLY', 
    'KAYNES', 'MTARTECH', 'MAHLOG', 'PRINCEPIPE'
  ]
};

const checkKnoxvilleDivergence = (quotes: any[], currentIndex: number) => {
  if (currentIndex < 20) return { bullish: false, bearish: false };
  let gains = 0, losses = 0;
  for (let i = currentIndex - 13; i <= currentIndex; i++) {
    const diff = quotes[i].close - quotes[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  const mom = quotes[currentIndex].close - quotes[currentIndex - 20].close;
  return { bullish: rsi < 30 && mom > 0, bearish: rsi > 70 && mom < 0 };
};

app.get('/api/backtest/envelope', async (req, res) => {
  try {
    const basketId = (req.query.basket as string) || 'BLUECHIP';
    const strategyType = (req.query.type as string) || 'LONG';
    const symbols = BASKETS[basketId] || BASKETS['BLUECHIP'];
    
    const openTrades: any[] = [];
    const closedTrades: any[] = [];
    const holdTrades: any[] = [];

    await Promise.all(symbols.map(async (baseSymbol) => {
      try {
        const symbol = `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 2); // 2 years is enough for 200 EMA stabilization

        const [history, quote]: [any, any] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol)
        ]);
        
        // Use adjclose if available for better accuracy
        const quotes = (history.quotes || []).filter(q => q.close && q.low && q.high).map(q => ({
          ...q,
          close: q.adjclose || q.close,
          high: q.adjclose ? (q.high * (q.adjclose / q.close)) : q.high,
          low: q.adjclose ? (q.low * (q.adjclose / q.close)) : q.low
        }));

        if (quotes.length < 250) return;

        const emaLength = 200;
        const k = 2 / (emaLength + 1);
        let sum = 0;
        for (let j = 0; j < emaLength; j++) sum += quotes[j].close!;
        let ema = sum / emaLength;

        const emaValues: number[] = new Array(quotes.length).fill(0);
        for (let j = 0; j < quotes.length; j++) {
          if (j >= emaLength) ema = (quotes[j].close! * k) + (ema * (1 - k));
          emaValues[j] = ema;
        }

        let activePosition: any = null;
        for (let i = emaLength; i < quotes.length; i++) {
          const q = quotes[i];
          const currEma = emaValues[i];
          
          if (strategyType === 'LONG' || strategyType === 'KNOX') {
            const entryA = currEma * 0.86;
            const targetA = currEma * 1.14; // Upper Blue Line

            if (!activePosition) {
              if (q.low! <= entryA) {
                if (strategyType === 'KNOX' && !checkKnoxvilleDivergence(quotes, i).bullish) continue;
                activePosition = {
                  id: `${baseSymbol}-${q.date.getTime()}`,
                  symbol: baseSymbol,
                  basket: basketId,
                  entryPrice: entryA,
                  actualEntryPrice: q.close,
                  levels: { A: entryA, B: entryA * 0.90, C: entryA * 0.80, D: entryA * 0.70 },
                  target: targetA,
                  currentLevel: 'A',
                  entryTime: q.date.toISOString().split('T')[0],
                  status: 'OPEN'
                };
              }
            } else {
              if (q.high! >= activePosition.target) {
                activePosition.exitPrice = activePosition.target;
                activePosition.exitTime = q.date.toISOString().split('T')[0];
                activePosition.roi = ((activePosition.exitPrice - activePosition.actualEntryPrice) / activePosition.actualEntryPrice) * 100;
                activePosition.status = 'CLOSED';
                closedTrades.push({...activePosition});
                activePosition = null;
              } else if (activePosition.currentLevel === 'A' && q.low! <= activePosition.levels.B) {
                activePosition.currentLevel = 'B'; activePosition.target = activePosition.levels.A;
              } else if (activePosition.currentLevel === 'B' && q.low! <= activePosition.levels.C) {
                activePosition.currentLevel = 'C'; activePosition.target = activePosition.levels.B;
              } else if (activePosition.currentLevel === 'C' && q.low! <= activePosition.levels.D) {
                activePosition.currentLevel = 'D'; activePosition.target = activePosition.levels.C;
              }
            }
          }
        }

        if (activePosition) {
          const last = quotes[quotes.length - 1];
          activePosition.currentPrice = last.close;
          activePosition.marketCap = quote.marketCap || 0;
          activePosition.roi = ((last.close! - activePosition.actualEntryPrice) / activePosition.actualEntryPrice) * 100;
          if (activePosition.roi > 5) holdTrades.push(activePosition);
          else openTrades.push(activePosition);
        }
      } catch (e) { }
    }));

    res.json({
      basketName: basketId,
      open: openTrades,
      closed: closedTrades.sort((a, b) => new Date(b.exitTime!).getTime() - new Date(a.exitTime!).getTime()).slice(0, 50),
      hold: holdTrades,
      allStocks: symbols.map(s => {
        const trade = openTrades.find(t => t.symbol === s) || holdTrades.find(t => t.symbol === s);
        return {
          symbol: s,
          name: s, // Fallback, the frontend will sync names via stock-prices if needed
          status: trade ? (holdTrades.includes(trade) ? 'HOLD' : 'ENTRY') : 'NO_TRADE',
          currentPrice: trade?.currentPrice || 0,
          marketCap: trade?.marketCap || 0,
          entryPrice: trade?.entryPrice || 0,
          target: trade?.target || 0,
          roi: trade?.roi || 0,
          entryTime: trade?.entryTime || '-',
          currentLevel: trade?.currentLevel || 'A'
        };
      })
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stock-prices', async (req, res) => {
  try {
    const symbolsQuery = req.query.symbols as string;
    if (!symbolsQuery) return res.status(400).json({ error: 'No symbols' });
    const symbols = symbolsQuery.split(',');
    const results = await Promise.all(symbols.map(async (s) => {
      try {
        const cleanSymbol = s.trim().toUpperCase();
        const yahooSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.NS`;
        const quote: any = await yahooFinance.quote(yahooSymbol);
        
        return { 
          symbol: cleanSymbol, 
          name: quote.longName || quote.shortName || cleanSymbol,
          price: quote.regularMarketPrice, 
          change: quote.regularMarketChangePercent,
          ath: quote.fiftyTwoWeekHigh,
          marketCap: quote.marketCap
        };
      } catch (e) { 
        console.error(`ERROR fetching ${s}:`, e);
        return { symbol: s, price: 0 }; 
      }
    }));
    res.json(results);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SuperTracker Backend running on port ${PORT}`));
