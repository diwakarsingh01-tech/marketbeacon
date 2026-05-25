
import fs from 'fs';
import { calculateCupHandle } from './strategies.js';

const BASKETS: Record<string, string[]> = {
  'BLUECHIP': [
    'WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 
    'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 
    'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 
    'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 
    'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 
    'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 
    'NIFTYBEES', 'BANKBEES'
  ],
  'HIGH_BETA': [
    'RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 
    'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 
    'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 
    'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 
    'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 
    'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'
  ]
};

async function auditBaskets() {
  const snapshot = JSON.parse(fs.readFileSync("./market_snapshot.json", "utf-8"));
  
  for (const basketName of ['BLUECHIP', 'HIGH_BETA']) {
    console.log(`\n--- Auditing ${basketName} ---`);
    const symbols = BASKETS[basketName];
    let found = 0;

    for (const sym of symbols) {
      const snap = snapshot[sym];
      if (!snap) continue;

      const result = calculateCupHandle(snap.quotes);
      
      if (result && result.isBuyZone) {
        console.log(`✅ [QUALIFIED] ${sym} | Entry: ${result.entryPrice} | CMP: ${result.currentPrice} | Target: ${result.target} | Date: ${result.triggerDate}`);
        found++;
      }
    }
    if (found === 0) console.log("No Qualified stocks found in this basket for Strategy 8.");
  }
}

auditBaskets();
