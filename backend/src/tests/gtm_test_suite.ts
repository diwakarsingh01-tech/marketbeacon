import { 
  calculateTwentyRallyRetest, 
  calculateSixtySevenFunda,
  calculateABCDLevels,
  Quote
} from '../strategies.js';

/**
 * MarketBeacon GTM Test Suite (Senior Developer Edition)
 * Rigorous verification of institutional logic and risk boundaries.
 */

const LOG = (msg: string, pass: boolean) => {
  console.log(`${pass ? '✅ PASS' : '❌ FAIL'} | ${msg}`);
};

// --- Helper: Generate Synthetic Price History ---
function generateHistory(startPrice: number, bars: number, dailyRet: number = 0, green: boolean = true): Quote[] {
  const quotes: Quote[] = [];
  let price = startPrice;
  const now = new Date();
  for (let i = 0; i < bars; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (bars - i));
    price = price * (1 + dailyRet);
    quotes.push({
      date: d.toISOString(),
      open: green ? price * 0.99 : price * 1.01,
      close: price,
      adjclose: price,
      low: price * 0.98,
      high: price * 1.01
    });
  }
  return quotes;
}

/**
 * TEST 1: Velocity Retest Time-Decay
 */
async function testVelocityRetestTimeDecay() {
  console.log("\n--- TEST 1: Velocity Retest Time-Decay ---");
  
  const basePrice = 100;
  const rallyQuotes: Quote[] = [];
  let price = basePrice;
  for (let i = 0; i < 9; i++) {
    price *= 1.025;
    rallyQuotes.push({
      date: `2024-01-0${i+1}T10:00:00Z`,
      open: price * 0.98,
      close: price,
      low: price * 0.97,
      high: price * 1.01
    });
  }

  const waitQuotes = generateHistory(price, 250, 0, false); // RED candles
  
  const retestBar: Quote = {
    date: new Date().toISOString(),
    open: basePrice * 1.02,
    close: basePrice * 1.01,
    low: basePrice,
    high: basePrice * 1.03
  };

  const totalQuotes = [...generateHistory(200, 210, 0, false), ...rallyQuotes, ...waitQuotes, retestBar];
  
  const result = calculateTwentyRallyRetest(totalQuotes, 'HAVELLS');
  LOG("Retest at 250 bars (Should PASS)", result?.verdict === 'QUALIFIED');

  const tooLateQuotes = [...generateHistory(200, 210, 0, false), ...rallyQuotes, ...generateHistory(price, 255, 0, false), retestBar];
  const lateResult = calculateTwentyRallyRetest(tooLateQuotes, 'TEST');
  LOG("Retest at 255 bars (Should be INVALID/NULL)", lateResult === null);
}

/**
 * TEST 2: Deep Recovery Audit (67% Logic)
 */
async function testDeepRecoveryLogic() {
  console.log("\n--- TEST 2: Deep Recovery Audit (67% Logic) ---");
  const ath = 1000;
  const quotes65 = generateHistory(350, 50, 0);
  const screenerImproving = { quarterlyNetProfits: [100, 110, 120] };
  const res65 = calculateSixtySevenFunda(quotes65, screenerImproving, {}, ath);
  LOG("Drawdown 65% (Should be WATCHLIST/REJECT)", res65?.verdict !== 'QUALIFIED');

  const quotes67 = generateHistory(330, 50, 0);
  const res67Pass = calculateSixtySevenFunda(quotes67, screenerImproving, {}, ath);
  LOG("Drawdown 67% + Improving PAT (Should be QUALIFIED)", res67Pass?.verdict === 'QUALIFIED');
}

/**
 * TEST 3: Portfolio Bifurcation Accuracy
 */
async function testPortfolioBifurcation() {
  console.log("\n--- TEST 3: Portfolio Bifurcation Accuracy ---");
  const abcdLarge = calculateABCDLevels(100, 250000000000); // 25k Cr
  LOG("Large Cap ABCD Gap (Should be 10%)", abcdLarge.gap === 10);
  const abcdMid = calculateABCDLevels(100, 75000000000);   // 7.5k Cr
  LOG("Mid Cap ABCD Gap (Should be 15%)", abcdMid.gap === 15);
}

async function runAllTests() {
  try {
    await testVelocityRetestTimeDecay();
    await testDeepRecoveryLogic();
    await testPortfolioBifurcation();
    console.log("\n--- GTM AUDIT COMPLETE ---");
  } catch (e: any) {
    console.error("AUDIT CRASHED:", e.message);
  }
}

runAllTests();
