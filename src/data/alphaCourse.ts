import type { LucideIcon } from 'lucide-react';
import {
  ShieldCheck, Layers, Activity, RefreshCw,
  Target, Zap, PieChart, Database, BarChart3,
  TrendingUp, Award, Compass
} from 'lucide-react';

export interface LessonStep {
  step: string;
  heading: string;
  body: string;
}

export interface Lesson {
  id: string;
  name: string;
  subtitle: string;
  tier: string;
  icon: LucideIcon;
  color: string;
  moduleId: string;
  tagline: string;
  steps: LessonStep[];
  coachNote: string;
  tryIt: { label: string; path: string } | null;
}

export interface Module {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  icon: LucideIcon;
  lessons: Lesson[];
}

export const alphaCourseModules: Module[] = [
  {
    id: 'swing_course',
    number: '6',
    name: 'Swing Course',
    subtitle: 'Complete Swing Trading System — Hemant Jain',
    icon: Award,
    lessons: [
      {
        id: 'swing_mindset',
        name: 'Mindset, Market Reality & Scam Protection',
        subtitle: 'The 99% vs 1% Reality Check',
        tier: 'alpha',
        icon: ShieldCheck,
        color: 'rose',
        moduleId: 'swing_course',
        tagline: 'Bina sahi mindset ke strategy bhi kaam nahi karegi. 99% log apni hard-earned money kho dete hain, sirf 1% winners hote hain.',
        steps: [
          { step: 'The 99% vs 1%', heading: 'Stock Market — Winners and Losers', body: 'Market mein 3 tarah ki parties hain: Retailers/Losers (99% — mehnat ki kamai har dete hain), Winners (Operators jo stock ko apni power se operate karte hain + Smart Money jo businessman mindset se sasta leke mehenga bechte hain), aur Third Party (news channels, YouTube/Telegram scammers jo operators ko paisa banane mein help karte hain).' },
          { step: 'Realistic Expectations', heading: 'SABSE IMPORTANT — What is Actually Possible', body: 'Bank FD = 5–6% yearly. Nifty 50 long-term = 12–15%. Hemant ka swing system = 25–30% CAGR (TARGET). "Daily 5%" ya "Monthly 20%" = impossible (1.05^12 = 79–80%/year) = SCAM. Compounding math: 30% yearly → 3 saal mein ~double → 12 saal 16x → 30 saal ~500x. "Agar saal ka 80% possible hota to bank 5–6% kyun dete?"' },
          { step: 'Value vs Momentum', heading: 'Value Trading Karein, Momentum Nahi', body: 'Warren Buffett ke principles: "Buy when everyone is selling" (market girne par), "Sell when everyone is buying" (all-time high par). "Buy high, sell higher" / "Trend is your friend" / "Chadhti train mein chadhna" — ye sab jhooth hai. Chadhti train mein chadne wale ka paer ek hi baar katta hai. Train sirf sahi station par rukti hai = sahi price level.' },
          { step: 'News = Fraud', heading: 'Trading Ke Liye News Ko Ignore Karein', body: 'News channels tumhare dost nahi hain. News 2 type: Fact (jo ho chuka — follow karo) vs Opinion (jo ho sakta hai — kabhi nahi). "Reliance ka profit aaya" = Fact. "Reliance gir sakta hai" = Opinion. Jab bhi Sharekhan/Motilal "buy" bole, 99% stock already all-time high par hoga.' },
          { step: 'Scam Protection', heading: '5 Scams Ki Detail + Fake Teacher Groups', body: 'Scam A: MLM/Pyramid (Amway, Herbalife, QNet) — "Bhai pe bharosa nahi hai?" sunte hi answer: "NAHI HAI." Scam B: 5% monthly/guaranteed return (Torres ₹1000cr, Infinite Beacon ₹3000-4000cr). Scam C: Option buying 10-20% monthly promise (theta = option buyer ka enemy). Scam D: Crypto (WazirX sab zero). Scam E: Institutional trading apps (fake APK, withdraw pe "4% tax"). Scam F: Fake teacher groups (fake Hemant Jain Telegram, ₹1500/10min). Sirf official batch group + master document pe bharosa karo.' },
          { step: 'Golden Rules', heading: 'Module 1 Rules — Protect Yourself First', body: 'Stupid expectations rakhoge hi nahi to koi scam nahi kar sakta. Respect your job — Get → Save → Grow money. Stop buying near all-time high. Retail intraday se paisa nahi bana sakta (institutions ke algos hain). 4 pillars of scam: Fear, Greed, Lust, Emotion. Small-amount trust trick: ₹120 jaisa chhota paisa pehle nikalne dete hain — phir bada chheen lete hain.' }
        ],
        coachNote: 'Pehle apne aap ko protect karo, phir paisa banana seekho. Unrealistic expectation hi scam hone ka sabse bada reason hai. Jo darte hain wo paisa nahi kama pate — paisa har fall me banta hai, jo tikta hai uske liye.',
        tryIt: null
      },
      {
        id: 'swing_universe',
        name: 'Stock Universe — Super 45 / Good 45 / Good 200',
        subtitle: 'The Three Lists — Priority Order',
        tier: 'alpha',
        icon: Layers,
        color: 'blue',
        moduleId: 'swing_course',
        tagline: 'Priority hamesha: Super 45 → Good 45 → Good 200. Upar wali list ki strategy neeche wali list pe kabhi nahi lagti.',
        steps: [
          { step: 'Teen Lists', heading: 'Priority Order — Start From the Top', body: '1. Hemant Super 45 (40-45 stocks): great large + mid caps, 15-20 saal ke market leaders — band-based strategies (Envelope, SMA, 52wk, Bollinger). 2. Hemant Good 45 (~45): zyada tar mid + small cap — ABCD, RHS, Cup-Handle, BCD. 3. H Good 200 (~200): Net Profit > 200cr + ROCE > 12 + NDE < 0.2 (screener se) — S&R + 20% rally. Neeche wali list ki strategy upar wali list pe lag sakti hai (koi dikkat nahi).' },
          { step: 'Super 45 Criteria', heading: '6 Bare-Minimum Criteria', body: '1. Net Profit > ₹200 crore (loss-making = bewakoofi). 2. Net Debt to Equity < 0.2 (negative = GREAT; 0.2-0.3 fine if sales/profit ATH + good ROCE). 3. ROCE > 12% (20%+ legendary); banks ke liye ROE > 12%. 4. Clear future growth prospect (product ke baare mein soch paa rahe ho to tikne wali). 5. 15+ saal business mein (BJP, Congress, wars sab dekha). 6. Market leader honi chahiye (TCS, Infosys, HCL, Wipro).' },
          { step: 'Market Cap vs Fall', heading: 'Buying Zones by Cap Size', body: 'Large Cap (> ₹1 lakh cr): typical fall 20-25%, buy 20-30% discount pe. Mid Cap (₹33,000cr-₹1 lakh cr): 30-50% kabhi bhi "for no reason", 40-45% sweet spot. Small Cap (₹15,000-33,000cr): 40-55% aaram se. Micro Cap (< ₹15,000cr): 50%+ girti hi girti hai, 50%+ girne pe buy. Debt = do-dhaari talwar: Suzlon -95%, JP Associates -98%, Vodafone -97%, Yes Bank.' },
          { step: 'Good 200 Screen', heading: 'Screener.in Kaise Banti Hai', body: '3 Ratios: Net Profit > 200cr AND ROCE > 12 AND Net Debt to Equity < 0.2. Screen steps: screener.in → Screens → Create New Screen → conditions (AND lagana zaroori; % sign mat lagana) → base ~329 companies → trim: Net Profit 300 + ROCE 18 → ~205 companies. Banks/NBFC exception: Net Profit > 200cr AND ROE > 12%.' },
          { step: 'Asset Allocation', heading: 'Portfolio Rules — Position Sizing', body: 'Per stock max: Large 5% (₹5,000 on ₹1 lakh), Mid 2.5-3%, Small 1.5-2%, Micro 1-1.5%. Sector allocation max 20%. Total 40-55 different bets. Aggressive split: Large 20 / Mid 30 / Small 40 / Micro 10. Conservative: Large 35 / Mid 30 / Small 25 / Micro 10. "Stock gir raha hai to girne do — add nahi karenge, there is a limit to ABCD."' }
        ],
        coachNote: 'Think of the lists as your first filter. Instead of scanning 5000+ stocks, you scan 40-200 high-probability names. This is the institutional edge — you don\'t need to look everywhere, you need to look in the right places.',
        tryIt: { label: 'Scan Baskets in Screener', path: '/screener' }
      },
      {
        id: 'swing_envelope',
        name: 'Envelope Strategies — Long / Short / 52-Week',
        subtitle: 'Sirf Super 45 List Pe Apply Hota Hai',
        tier: 'alpha',
        icon: TrendingUp,
        color: 'emerald',
        moduleId: 'swing_course',
        tagline: 'Band touch MANDATORY hai — "Band ko jab tak touch nahi karega, tab tak trade initiate nahi hoga."',
        steps: [
          { step: 'Indicator Setup', heading: 'Envelope 200, Percentage 14', body: 'TradingView: Envelope → Length 200, Percentage 14 → teeno lines bold. Orange (middle = 200 EMA) · Upper Blue = 200 EMA × 1.14 · Lower Blue = 200 EMA × 0.86. Band batata hai stock zyada mehenga ya kam mehenga. Country-specific: Indian stocks = 14%, US stocks = 25% (Microsoft, Sarebras type).' },
          { step: 'Long Envelope', heading: 'Buy Lower Blue Touch, Sell 30%', body: 'Entry: Price girte hue lower blue line touch kare (touch mandatory). Exit: 30% flat target (ya upper blue agar 25%+ profit). Kyun 30% flat: kabhi-kabhi upper blue itni neeche aa jaati hai ki 30% na bane — phir bhi 30% pe sell. "Buy near lower blue, sell at 30%." Trade Tracker mein fix 30% exit, no exception. Lalach mat karo — 2-4 din mein 5-10% profit dikhe to bhi nahi bechna. Knock signal aaye to partial booking karo.' },
          { step: 'Short Envelope', heading: '2 Independent Trades — Orange + Lower Blue', body: 'Problem: kabhi stock lower blue pe aata hi nahi (NSE 2016-2022 — 6 saal). Solution: B1 = upar se girte hue orange line pe buy, target 12%, exit upper blue ya 12%. B2 = girte-girte lower blue pe buy, target 12%, exit orange ya 12%. Chhota "cute" target — 2-3 hafte mein, kabhi ek din mein bhi aata hai. Position: orange pe max 1-1.5%, lower blue pe 3-5%.' },
          { step: '52 Week High Low', heading: 'Beginner-Friendly — Red Low Buy, Blue High Sell', body: 'Indicator: "52 Week High Low" → Period 251. Red line = 52-week low, Blue line = 52-week high. Entry: 52-week low (red) touch kare → buy. Exit: 52-week high (blue) touch kare → sell. Loss mein kabhi nahi bechna: agar 52w high 52w low se neeche aa jaye, stock ke wapas buy point pe aane ka wait karke wahan sell karo.' },
          { step: 'Examples', heading: 'Real Trades from Class 3', body: 'NSE (Short Envelope): 6 saal orange → upar → orange → upar. Total 12 signals → 12 baar 12% gain booked, stock double/triple hua. Infosys (Long Envelope): Entry ~₹1,491 → Target = 1491 × 1.3 = ₹1,938. Bajaj Auto: upper blue touch, profit ~25% vs target 30% → trade technically open (upper blue touch exit rule nahi hai).' }
        ],
        coachNote: 'Envelope is the backbone of the whole system. The band is not a support line — it is a statistical demand/supply zone. Almost saari great companies ko ye repeated band behavior show karna padta hai (majboori). Respect the strategy and it will give you immense wealth.',
        tryIt: null
      },
      {
        id: 'swing_advanced',
        name: 'Advanced Strategies — Bollinger / Noxwell / SMA',
        subtitle: 'Price & Time Correction First',
        tier: 'alpha',
        icon: BarChart3,
        color: 'violet',
        moduleId: 'swing_course',
        tagline: '"Jab market khatarnak girti hai to khatarnak recovery bhi aati hai." Dead cross pe buy, golden cross pe sell — crowd ka hamesha ulta.',
        steps: [
          { step: 'Market Behaviors', heading: 'Price & Time Correction', body: 'Price Correction (3 levels): Crash 30%+ (har ~10 saal — 1992, 2008, 2020; next ~2028-2032), Major Correction 15-20% (har 2 crashes ke beech 2-3 baar), Minor Correction 5-10% (har 2 majors ke beech). Time Correction: loss nahi, par returns bhi nahi — account 15-20% range mein jhoolta hai, min ~1.5 saal (563 days), max ~4-5 saal. Time correction ke baad market tezi se bhaagti hai. "Market ka wait mat karo" — girhe hue stocks pakdo.' },
          { step: 'Bollinger Band', heading: 'Length 200, Std Dev 2.5, Width ≥ 35%', body: 'Entry: Lower band pe buy — SIRF agar upper-lower width ≥ 35%. Exit: Upper band pe sell. Width 35% se zyada = zyada money on the table (strict). 24-25% bhi chalega sirf HDFC Bank-type great companies ke liye. Upper limit koi nahi. Signals kam aate hain par quality high hai — "Bollinger ki taakat kam, Envelope much better." Market mein dar ho to saare stocks lower band ke aas-paas honge.' },
          { step: 'Envelope + Noxwell', heading: 'Rab Booker Noxwell Divergence — 3 Zones', body: 'Selling Zone = orange ke UPAR (kabhi buy nahi — mind mein selling). Priority 2 (P2) = orange aur lower blue ke beech (buy kar sakte ho, second priority). Priority 1 (P1) = lower blue ke NECHE (sabse pehla buy — "munh pe ungli rakh ke chupchaap buy"). Indicator: Bars Back 200, RSI 14, Momentum 20. Neeche-taraf trending line (2 candle bottoms connect) = stock rocket → BUY. "Orange ke neeche bechna paap hai." Buy ke baad min 20% gain — 20% pe alert lagao, usse pehle daily chart mat dekho.' },
          { step: 'Advanced SMA', heading: '20/50/200 — "Dead Cross Pe Buy"', body: 'Duniya ka theory (galat): golden cross = buy, dead cross = sell. Hemant ka ulta (sahi): Dead cross pe buy karo, golden cross pe sell karo — "jo 99% kar rahe hain usse paisa nahi banega; uske bilkul opposite se banega." BUY condition: order Price > Black(20) > Green(50) > Red(200). Indicator: "Simple Moving Averages" by AYIEJ (free). Envelope signals superior hain (27%/26%/25% vs SMA 18%/14%/8%). Price black se thoda upar par green/red ke kaafi neeche → still buy (V-type recovery).' },
          { step: 'Module 4 Golden Rules', heading: 'The Discipline Rules', body: 'Width ≥ 35% valid. Orange ke neeche bechna paap hai. 25% se kam return pe booking nahi. Dead cross pe buy, golden cross pe sell. 20% gain tak daily chart mat dekho — alert lagao. Always daily timeframe (1 candle = 1 din). Fundamentals hamesha check karo. Trailing stop loss: position 5-10% margin pe gir jaye to exit. Strong resistance ho to 70-80% sell wahan. Mean of your decisions hamesha positive.' }
        ],
        coachNote: 'Advanced strategies reward patience and contrarian discipline. News ignore karo — tabhi paisa banega (1000% guaranteed). Market top pe golden cross ki news aati hai, neeche dead cross ki. Tumhe apna khud ka signal follow karna hai.',
        tryIt: null
      },
      {
        id: 'swing_good200',
        name: 'Good 200 Strategies — S&R + Super Strategy (20% Rally)',
        subtitle: 'Support & Resistance + 20% Rally',
        tier: 'alpha',
        icon: Activity,
        color: 'cyan',
        moduleId: 'swing_course',
        tagline: 'Support = ZONE jahan se stock baar-baar upar jaata hai. Hamesha ZONE hota hai, point nahi. Buy = rally start point pe wapsi.',
        steps: [
          { step: 'S&R Zones', heading: '2 Bounces + Range ≥ 30% (Small/Mid 62%)', body: 'Support = zone jahan se stock 2 baar upar bounce kar chuka hai. Resistance = zone jahan se 2 baar gira. Entry: stock wapas support zone par girne pe buy. Exit: resistance zone / target pe sell (greed nahi). Validity: 1) neeche se upar 2 baar ja chuka ho. 2) Range ≥ 30% (great large caps 15-25% chalegi; small/mid/SME min 62%). 3) Profits mein visible improvement (yearly). 4) Profit comparison hamesha FIRST touch point se. "Profit thoda hila hai" = buy nahi.' },
          { step: 'S&R Entry Rules', heading: '2+ Touches → 3rd Touch Buy (P2 ≥ P1)', body: 'SNR entry rule: agar stock support zone se 2 baar upar bounce kar chuka hai, to 3rd touch pe BUY — resistance zone tak target. P2 ≥ P1 rule (IRCTC): entry ke baad 2nd pullback point pehle pullback se zyada ya equal hona chahiye — weak 2nd pullback = signal weak. Target ~40-50% range: support→resistance distance hi trade ka target. Chase limit: entry price se 2-4% door OK, 12% = no, 20%+ = never. 50% fall = double-money case (5paisa) — case-by-case.' },
          { step: 'Super Strategy', heading: '20% Rally — 4 Points', body: 'Rally ki pehchaan: lagatar sirf green candles, minimum 20% move, ek bhi red candle nahi. Rally ke 4 Points: 1. Rally Start (jahan green candles shuru), 2. Rally End (pehli red candle), 3. Buy Point (stock wapas gir ke rally start price pe aaye — price SAME, par chart par alag jagah — 99% students confuse hote hain), 4. Sell Point/Target (pehli red candle se pehle wali green candle ka HIGH). "Munh par ungli rakh ke buy." 18-19% par exit bhi OK.' },
          { step: 'Invalid Rallies', heading: '3 Exceptions — Good 45 & Good 200', body: '1. 1-year rule: rally start se buy point tak aane mein 1 saal se zyada laga → INVALID (operator exit kar chuka hoga). Invalid tab hai jab neeche aane mein hi 1 saal se zyada laga ho. 2. Target achieved: ek baar target achieve → rally INVALID, pattern khatam. 3. 200 DMA (orange) rule: Good 45 & Good 200 mein rally START point 200 DMA ke NECHE hona chahiye — upar → INVALID. Super 45 mein rally valid chahe 200 DMA ke upar bane ya neeche.' },
          { step: 'Golden Rules', heading: 'Module 5 Rules', body: 'S&R zone clearly dikhna chahiye — 2 baar bounce zaroori. Rally = all-green candles, min 20%, target = pehli red candle se pehle wali green ka high. Dumb money vs Smart money: retail breakout pe buy karta hai — uske ulta karo, "you will print money." ATH breakout = loss (08 Jun 2026): breakout traders 99% lose money at ATH. Negative news par rule se zyada buy karo — baaki log ghabrate hain. "Stop watching the market daily" — position banao, so jao, kaam mein busy raho.' }
        ],
        coachNote: 'S&R and the 20% Rally are the two workhorse strategies of the Good 200 universe. Support is always a zone, never a point. And when you find a rally that retests its start, buy it quietly — "munh pe ungli rakh ke".',
        tryIt: null
      },
      {
        id: 'swing_abcd',
        name: 'Good 45 Strategies — ABCD Averaging + Patterns + BCD',
        subtitle: 'The "Jigar Ka Tukda" Strategy',
        tier: 'alpha',
        icon: Target,
        color: 'amber',
        moduleId: 'swing_course',
        tagline: 'Stock overall kahin na jaye, phir bhi repeated 10-10% scalps se profit banti hai. ABCD = superior strategy.',
        steps: [
          { step: 'ABCD Levels', heading: 'A-B-C-D Levels & Buy-Sell Matrix', body: 'Levels: A = base buy point (kisi bhi strategy ka buy signal, target = normal strategy target e.g. Envelope target). B = A se 10% neeche. C = A se 20% neeche. D = A se 30% neeche. Gaps: Large 10% | Mid 12-15% | Small 15-20% (flexible — 13% gira to 13% pe khelo). Buy-Sell Matrix: B pe buy → A pe sell; C pe buy → B pe sell; D pe buy → C pe sell; A pe buy ki quantity → A~ (Envelope target) pe sell.' },
          { step: 'ABCD Allocation', heading: 'A Pe 2-3%, Baaki 0.5-1% — Greed Control', body: 'Allocation: A pe 2-3%, har subsequent fall pe 0.5-1% add. Pehle trade mein 5% kabhi nahi (margin of safety — aur gira to aur average kar pao). Greed warning: "ABCD sabse greedy strategy hai — C pe kharidne ke baad B pe bechne ka mann nahi karega, phir stock wapas gir jayega aur pachtoge. Book karna hi discipline hai." GTT order trade lete hi laga do — "wahi best hai."' },
          { step: 'RHS & Cup with Handle', heading: 'Breakout Trade Nahi — 99% Times', body: 'Patterns: Cup with Handle (cup shape + handle) aur RHS (head + 2 shoulders reverse) — big players ki move. Validity: Horizontal line zaroori (cup with handle sirf ekdam seedhi line pe valid). Multiple handles valid. Breakout green candle ke saath line ke upar. Technical target mapping: resistance line se stock jitna neeche gira hai, breakout ke baad utne hi RUPAYE upar (percentage nahi). Linear scale pe measure karo (log pe overestimated). Sirf tab trade jab pattern high se 20-30% neeche ke rates pe bana ho — all-time high pe breakout kabhi nahi.' },
          { step: 'SMA with BCD', heading: 'A Ka Trade Nahi — BCD Levels Pe Khelo', body: 'Naam padho: SMA with BCD — A ka trade nahi hai, pehla trade nahi lete. Jaise hi SMA buy signal aaye (price black-green-red ke neeche) → 10-10% ya 15-15% neeche ke levels mark karke so jao. BCD buys ki targets pehle level pe (B buy → A level pe sell). Pattern kab khatam: jab target achieve ho jaye (stock 200 DMA ke around aa chuka hota hai). Example: 3M India — price black-green-red ke neeche (SMA signal), sirf B aaya → B pe buy, A level pe sell — ek hi trade, clean profit.' },
          { step: '52 Week with BCD', heading: '52W Low Pe Buy Nahi — Zone Ko Play Karo', body: '52 week low pe buy nahi karte — bas zone mark karke chhod do, aur zone ko play karo. Ye BCD zone hai — "itni khatarnak CAGR ban jaati hai ki koi limit nahi" (Cera pe bana tha). Validity: BCD levels us waqt tak valid jab tak stock 52-week high (blue line) touch na kar le — chahe targets achieve ho jayein. Fark SMA wale se: wahan A level reach hote hi pattern khatam. Asian Paints (19% down): round off 20% → 2 trades (aadhi quantity ek level pe, aadhi dusre pe).' },
          { step: 'Trading Log — FIFO vs LIFO', heading: 'Broker Ka Average GALAT Hota Hai', body: 'Broker FIFO follow karta hai, hum LIFO chalti hain — jo aakhri buy hai wahi pehle bechegi. Isliye broker ka % hamesha fluctuate karega aur galat rahega (Zerodha 31 lakh profit hi galat dikha raha tha). Solution: trading log (Excel) mein har stock ke multiple entries alag-alag; ABCD ke trades ki alag entry ("Infy ABCD" — sirf 10% target wali). Sell hamesha Excel log dekh ke karo, broker ka average dekh ke kabhi nahi.' },
          { step: 'Module 6 Golden Rules', heading: 'The ABCD Discipline', body: 'List mapping: Super 45 pe Super strategies, Good 45 pe Good strategies, Good 200 pe S&R + 20% rally. Neeche wali upar pe lag sakti hai, ulta nahi. ABCD matrix: B→A, C→B, D→C sell; A wali quantity → A~ target. Pehle trade mein full position kabhi nahi. Technical target = big player ka sell button. Linear scale pe marking. Patience: Sun TV ka ~50% target aane mein 2-3 saal laga. ABCD + Envelope combo = "make big money on loop."' }
        ],
        coachNote: 'ABCD is the closest thing to a systematic money printer in this course. Sun TV ka example yaad rakho: B pe buy → A pe sell, C → B, D → C... 7 alag trades, har ek 10% = ~70% gain booked — jabki stock ZERO move hua! "Stock ki direction matter nahi karti, levels matter karte hain."',
        tryIt: null
      },
      {
        id: 'swing_fundamentals',
        name: 'Fundamental Analysis — Part 1 + 2',
        subtitle: 'Fundamental Check Ke Bina Technical Signal Kabhi Valid Nahi',
        tier: 'alpha',
        icon: PieChart,
        color: 'purple',
        moduleId: 'swing_course',
        tagline: 'Net Profit > ₹200cr, NDE < 0.2, ROCE > 12%, POC < 5%, profits ATH. Fundamentals bina technical kabhi nahi.',
        steps: [
          { step: 'Core Ratios', heading: 'Market Cap, PE, ROCE/ROE, Dividend', body: 'Market Cap = Share Price × Total Shares. PE = Price ÷ EPS — PE 15-20 sahi area, 30+ mehenga, 60-70+ avoid. Compare hamesha median se — "Median PE = 21, abhi 27" → expensive; median ke neeche = buy zone. ROCE = EBIT ÷ Capital Employed × 100 — 20%+ legendary (TCS 65%), 12-20% good, <12% bekaar. Banks/NBFCs: ROE 12%+ achha, 15%+ great. Dividend yield 3-4% comfortable — dividend sirf bonus hai, main profit capital gain se.' },
          { step: 'P&L', heading: '"Story of Business"', body: 'Sales/Revenue = kitna becha. Operating Profit (EBIT) = Sales − operating expenses. OPM = OP ÷ Sales × 100 — direct companies se compare karo, cross-sector nahi (HDFC AMC 74% OPM vs Rajesh Exports ~1%). Net Profit (PAT) = sab kuch hata ke bacha paisa. Other Income: "+" button se breakup check karo — one-time items hatao. Exceptional items ignore karo (Symphony 299cr one-time). Tax provision reversal trap: PAT +70-80% par EBIT sirf +20% = trick — PAT akela mat dekho.' },
          { step: 'Balance Sheet', heading: '"Photo of Company at a Point in Time"', body: 'TOTAL ASSETS = TOTAL LIABILITIES (hamesha). Assets: Land, P&M, CWIP, Cash, Inventory, Receivables. Liabilities: Equity + Reserves + Debt. Reserves badhna = profit ban raha hai. Ye equation kabhi gaddar nahi hoti — sirf scam se. Fixed assets expanding + profit dip = OK (expansion phase ka kharcha, benefit 2-5 saal baad). Intangible assets ignore karo (goodwill jump = real expansion nahi). CWIP positive = expansion signal.' },
          { step: 'Cash Flow + Shareholding', heading: 'Operations Strong + Powerful Players', body: 'Cash Flow 3 sections: Operating, Investing, Financing. Cash Flow from Operations strong hona zaroori — profit dikha par cash nahi = dikkat. Shareholding: Promoter 50%+ = strong. Powerful players (LIC, MFs, FIIs) 25%+ = good. Public holding < 15% = kam float = powerful players ka control zyada = positive (KFintech 15%, Ambuja 7%).' },
          { step: 'Debt, Pledge, Debtor Days, PB', heading: 'The 4 Risk Checks', body: 'Debt = do-dhaari talwar (Suzlon -95%, Yes Bank). NDE < 0.2, negative = great. POC (Pledge of Company) = Pledge% × Promoter Holding ÷ 100 — POC < 5% OK, 5-15% cautious, 15%+ avoid. Debtor Days = Receivables ÷ Sales × 365 — jitna chhota utna better; receivables profit se zyada badhe to avoid (large-cap exception: TCS). PB < 0.4 mile to trade le sakte hain — 0.8 tak reversion = 40-50% potential (Union Bank, Canara, PNB — paisa double).' },
          { step: 'Fundamentals Golden Rules', heading: '20-Point Master List', body: 'Loss-making = bewakoofi. NDE < 0.2. ROCE > 12% (banks ROE). PE median ke neeche buy, 60+ avoid. Promoter 50%+, powerful players majority, POC < 5%. Sales/profits all-time high. Intrinsic value = random number — decide by ratios + strategy signals. PB < 0.4 = reversion trade. Bad quarter/bad year = buy opportunity (Bajaj Auto 2021). IPO mein kabhi kaam mat karo. "Whenever you hear EBITDA, think shit" — Net Profit dekho. 5-yr sales growth filter: 3% growth (Godrej) = ignore. 50% gira = opportunity (KFintech -46%).' }
        ],
        coachNote: 'Fundamentals are the gate that keeps you out of wealth destroyers. Technical signals without fundamental validation are just noise. A stock that fails these checks might still go up — but if it does, it\'s speculation, not investing. Know the difference.',
        tryIt: null
      },
      {
        id: 'swing_tools',
        name: 'Tools & Execution — Tracker / Log / Screener / TV / GTT',
        subtitle: 'Discipline Ka Core',
        tier: 'alpha',
        icon: Compass,
        color: 'indigo',
        moduleId: 'swing_course',
        tagline: 'GTT order trade lete hi laga do — "wahi best hai." Sell hamesha Excel log dekh ke karo, broker ka average dekh ke kabhi nahi.',
        steps: [
          { step: 'Trading Log', heading: 'Excel = Source of Truth', body: 'Kyun: broker ka average FIFO follow karta hai (galat hota hai humare LIFO logic se). Excel log hi source of truth. Setup: har stock ka alag entry; ABCD trades ki alag entry ("Infy ABCD"); sell hamesha Excel dekh ke. Weekly/monthly exercise: baing prices pehle likh lo — jo stocks tumhare price ke loss mein hain unko prefer karo.' },
          { step: 'Screener.in', heading: 'Custom Ratios Setup (Must)', body: '2 custom ratios banao: 1. Net Debt to Equity = (Net Debt) ÷ (Equity Capital + Reserves) — unit None. 2. POC = Pledge% × Promoter Holding ÷ 100 — unit Percentage. Screen (Good 200): Net Profit > 200cr AND ROCE > 12 AND NDE < 0.2 → ~205 companies. Banks: Net Profit > 200cr AND ROE > 12%.' },
          { step: 'TradingView Tools', heading: 'The Indicator Kit', body: 'Indicators: Envelope (200, 14), 52 Week High Low (251), Bollinger (200, 2.5), Rab Booker Noxwell Divergence, Simple Moving Averages (AYIEJ). Daily timeframe hi — 1 candle = 1 din. A/L toggle: Cup-with-Handle marking hamesha LINEAR pe. Price Range tool: pattern ki range measure karke technical target nikalna. Alerts: 20% gain pe alert lagao, usse pehle chart mat dekho.' },
          { step: 'GTT Orders', heading: 'Good Till Triggered — Auto Discipline', body: 'Trade lete hi haatho-haath GTT laga do — "wahi best hai." GTT = target pe auto-sell — bina screen dekhe discipline. Teacher khud market nahi dekh pate isliye ek trade book nahi kar paye the. GTT sell: "5% below the S&R... if not working at resistance, 12% that\'s it." GTT Buy: trigger se 1-2% zyada.' },
          { step: 'MTF Warning', heading: 'Margin Trading Facility = AVOID', body: 'MTF = broker ka paisa leke stock kharidna (4x leverage) — AVOID. Paisa double bhi ho sakta hai, par market galat time par gir jaye to poora portfolio khatam (exposure 2.4x se bhi zyada). Interest bhi lagta hai. Sirf apna paisa use karo. Daily Checklist: fundamental screen → TradingView daily chart → entry price + target likho → Excel log mein daalo → GTT turant laga do → 20% pe alert → exit rule hit hote hi sell.' }
        ],
        coachNote: 'Tools are only as good as your discipline in using them. The Excel log, GTT orders, and alerts together form a system that works even when you are not watching the market. Sir ka routine: swing portfolio ko roz dekhne ki zaroorat nahi — GTT + alerts kaam karte hain.',
        tryIt: null
      },
      {
        id: 'swing_options',
        name: 'Option Selling Crash Course',
        subtitle: 'Bonus Module — Put Selling Ka Paisa',
        tier: 'alpha',
        icon: Zap,
        color: 'orange',
        moduleId: 'swing_course',
        tagline: '"I don\'t trade options to trade options. I sell puts to buy stock." — Chit bhi meri, pat bhi meri.',
        steps: [
          { step: 'Core Philosophy', heading: 'Sell Puts To Buy Stock', body: '"I don\'t trade options to trade options. I sell puts to buy stock." Quality stocks saste mein kharidne ke liye put sell. Option = risk ka transfer: buyer cash dekar risk kam karta hai; seller calculated + diversified risk leke premium kamata hai. "Long run mein paisa wahi banata hai jo risk LETA hai (seller), not who avoids it (buyer)." Put selling = waiting ka paisa — jo stock tum vaisi bhi kharidne wale the, uske liye paisa milta hai.' },
          { step: 'Theta Decay', heading: 'Seller Ka Best Friend', body: 'OPTION PRICE = INTRINSIC VALUE + TIME VALUE. Time value: month start me positive → month end me ZERO (chahe ITM hi kyun na ho). Time value kabhi negative nahi — yehi Theta Decay hai. Seller: month-end put 0 pe buy back → premium ka poora faayda. Buyer: har month time value zero hoti hai → 3-saal mean NEGATIVE. Option buying mat karo — retail ke liye pure scam.' },
          { step: 'Capital Efficiency', heading: '₹12 Lakh Ki Math', body: 'Minimum capital rule: ₹12 lakh — isse kam pe option selling profitable nahi hogi. Allocation: ₹9.5 lakh stocks (swing strategies), ₹3-4 lakh pledge (broker margin 20-25% haircut → ₹2-3 lakh margin, F&O margin pe 0% direct interest), ₹2 lakh Liquid Case (Zerodha) + pledge (~6%/saal), ₹0.5-1 lakh liquid cash (mark-to-market losses). Position limits: 12-13 lakh → naked 2-3, hedged 4-6. 20-30% market girne pe bhi zero nahi honge.' },
          { step: 'Put Selling Math', heading: 'DAB Example', body: 'Setup: DAB ₹510, Hemant 500 pe kharidna chahta hai. Sell 500 strike put @ ₹2 premium. DAB 510 pe raha → contract expire worthless → +₹2 pocket. DAB 500 → ATM → +₹2 (delivery nahi leni). DAB 450 → obligation to buy @ 500 → intrinsic 50 → −50 + 2 = −₹48 × 1250 lot. EFFECTIVE BUY PRICE = 500 − 2 = ₹498 — "chit bhi meri, pat bhi meri."' },
          { step: 'Roll Over', heading: 'Losses Postpone Karo — 4-Month Math', body: 'Roll over: month end purani position square off (buy back) + usi STRIKE pe next month ki put sell. Strike change NAHI karte. Jab tak strike mein liquidity hai, roll over karte rehna; illiquid puts me kaam nahi. Example: DAB 520 → 480 girta raha, phir bhi rolling se ₹13,000 profit (Jan +3, Feb −5, Mar −9, Apr +20.5 = +₹10.5 × 1250). Expiry se 2 din pehle square off — assignment automatic nahi hota.' },
          { step: 'Selection & Risk', heading: 'Quality, Liquid, F&O-Active Stocks Hi', body: 'Asian Paints, DABUR, HUL, Reliance, Kotak Bank, HDFC Bank. Chunne-munne stocks mein F&O nahi (SEBI kabhi bhi F&O se nikaal sakta hai — real example 45% down). Diversify: 39 alag positions simultaneously — "agar ek stock 1 saal bhi move na kare, I don\'t care." Naked selling preferred, hedging rarely. Gambler mat bano. Expectation: swing trading ke upar alag se 15-20% saal.' }
        ],
        coachNote: 'Option selling is a bonus module for advanced traders with ₹12 lakh+ capital. The core lesson: quality stocks saste mein kharidne ke liye put sell karo, aur theta ko apna friend banao. Option buying is the enemy — theta decays to zero every single month.',
        tryIt: null
      }
    ]
  },
  {
    id: 'funda_67',
    number: '7',
    name: '67 Ka Funda',
    subtitle: 'The Teacher\'s Secret Screening Method',
    icon: RefreshCw,
    lessons: [
      {
        id: 'funda67_framework',
        name: 'The Complete 10-Point Checklist',
        subtitle: 'Entry & Exit Rules — Full Framework',
        tier: 'alpha',
        icon: RefreshCw,
        color: 'amber',
        moduleId: 'funda_67',
        tagline: '67% ≈ 2/3 value destruction = significant. Jo chizein sasti ho jaati hain, kyun sasti hui hum nahi jaante — lekin girne ke baad chup-chap achhi companies kharidni hain.',
        steps: [
          { step: 'Core Philosophy', heading: 'Why "67"?', body: '"67" ek significant number hai — 2/3 (66.7%) value khatam ho chuki hai company ki. 35% is NOT significant; jab 2/3 high value khatam ho, toh 1/3 bacha hua significant hai. 99.99% traders us point pe sell karte hain jab market girta hai — "jo darte hain wo paisa nahi kama pate. Paisa har fall me banta hai — jo tikta hai uske liye." Market ko predict mat karo — rules follow karo. Har ~10 saal ~40% fall, 2nd fall 20-30% har 3-4 saal, 10-12% almost har saal. "Sooner or later market ko upar aana hi hai."' },
          { step: 'The 10 Points', heading: 'The Complete Checklist', body: '1. Company apne TOP se 67% gir chuki (2/3 = 66.7% value wipeout = significant). 2. Fall ka reason clear (sentiment/business/fundamental). 3. Wo reason ab exist nahi karta. 4. Proven track record (past profitability, sales growth). 5. Loss-making/badnaam companies NAHI. 6. Quarterly numbers mein sales + profit improvement. 7. Min 100% profit potential (current → ATH/second-high). 8. 1 saal mein 100% → exit/book. 9. 1 saal mein 100% nahi → ATH ya 3x target. 10. Blessings/luck. Shortcut: agar business all-time-high profit pe hai AND all-time-high sales pe hai → 10 points automatically cover.' },
          { step: '67 Ka Math', heading: 'Point 7 Ka Logic', body: 'Company top se 67% gir gayi = 67% value wipeout → sirf 33% bacha. Jab 33% wapas apne ATH pe jayegi → price 3x → gain 200% (100→33→100 = 200% gain). Isliye 67% down ke baad "minimum 100% potential" almost hamesha milta hai — aksar 200% tak. Second-High Rule: recovered stock mein ATH nahi, SECOND HIGH se 67% calculate karo — potential hamesha "jahan se girna shuru hui us level" se measure hota hai.' },
          { step: 'Entry Rules', heading: 'Kab Aur Kaise Buy Karein', body: 'Buy tabhi jab company 67% down ho — "Sir stock looking good → buy? Absolutely not. We have to follow the rules." Fundamental improvement ke baad hi entry. Quarterly results ke baad entry (JP Power pattern): result mein improvement confirm hone ke baad hi — agle din buy. Entry point = jahan quarterly improvement confirm hui. "Buy point and sell point are the same — it is defined." Target = us price se 100%. Screener first: Net profit (TTM) > ₹50 crore, market cap filter, debt check, PE vs median, ROCE sort → ~40 companies → 10-point analysis.' },
          { step: 'Exit Rules', heading: 'Kab Aur Kaise Sell Karein', body: '100% gain 1 saal mein → exit/book. "It can be multi-bagger but you will not do it" (hold nahi kar paoge). Booking zaroori hai: "Agar aap nahi bechoge, toh koi aur bechega aur sara ka sara gain wipe out ho jata hai." Partial booking allowed (TANLA: 75% gain take out = captured 85%). Exit ke baad dobara buy allowed — "again 100% gain we can buy again." 1 saal mein 100% nahi mila → target ATH ya 3x (big players yahi karte hain). 30-33% dip pe exit mat karo — "loser" (JP Power lesson: paisa double, wapas aaya, phir 5x gaya).' },
          { step: 'Live Examples', heading: 'Motilal, JP Power, TANLA, TCI Express', body: 'Motilal Oswal: COVID mein 67% crash, reason = sentiment + business; 2018-19 ke baad profit improvement → entry → 100% gain. JP Power: 67% (actually 69%) down, 3000-4000 crore loan; 2019 se improvement (plants beche, loan clear), D/E 5+ → 1.67; March 2021 result ke baad ~₹5 pe buy → ₹10 target (100%) → 4-5x ho gaya. TANLA: 67% pe invest, close to double, "75% of the gain I have already taken out". TCI Express: down 67%, thoda sa quarterly dip ignore karo agar consistency hai + reason clear hai.' },
          { step: 'Golden Rules', heading: 'DOS & DON\'TS', body: '"Run after peanuts, get peanuts" — rules follow karo. Never buy on influencer/YouTube tip (Zen Tech = wealth destroyer). Loss-making companies mein 67-Funda kaam nahi karta (min ₹50 crore net profit). Gamble bets (Mishthan Foods type) — sirf wahi paisa jitna zero ho sakta hai. PE median se bahut upar → avoid. D/E 0.2 se upar better nahi, 5+ toh bilkul nahi. Dead crossover pe hedge karo, becho mat (COVID wala bottom dead crossover ke baad hi aaya). Portfolio allocation: large 5%, mid 2.5-3%, small 1%. Trading log mandatory.' },
          { step: '10-Second Recap', heading: 'Quick Revision', body: '67-Funda = 10-point checklist: 1) 67% down 2) Reason of fall clear 3) Reason ab exist nahi 4) Proven track record 5) Loss-making avoid 6) Quarterly improvement 7) Min 100% potential (to ATH/second-high) 8) 100% in 1 saal → exit/book 9) Nahi mila → target ATH/3x 10) Blessings/luck. Entry: screener (net profit ₹50cr+) → 10-point pass → quarterly improvement ke baad entry → target = entry price se 100%. Exit: 100% milte hi book (partial allowed) → 1 saal mein nahi mila toh ATH/3x ka wait → 30% dip pe exit karna LOSER move.' }
        ],
        coachNote: 'The 67% strategy is the most profitable AND the most dangerous strategy in this framework. It works because nobody wants to buy these stocks — that\'s exactly when you should. But it only works if your fundamental assessment is correct. One wrong assessment can cost you 67% more. Do your homework twice.',
        tryIt: null
      },
      {
        id: 'funda67_master_stocks',
        name: 'Master Stocks Table',
        subtitle: 'Doubt Sessions — Teacher\'s View (Apr–Aug 2026)',
        tier: 'alpha',
        icon: Database,
        color: 'emerald',
        moduleId: 'funda_67',
        tagline: 'Buy recommendations "sirf check ke baad" — teacher doubt sessions mein mostly guidance deta hai, direct paisa calls nahi.',
        steps: [
          { step: '67-Funda Picks', heading: 'The Core 67-Funder Names', body: 'TANLA: 67-funda wali, "when TANLA was 67% I captured 100%... profit came in my bank account", SNR range ~100%+, portfolio max ~1%. GRM Overseas: student ne 100% profit book kiya — "Same 67 fund". Webhub Global: "Tanla\'s brother", 67 funda, 1% cap, FII red flag. NewGen: 67 funda wali, targets ~600/~1100. Punjab & Sindh: same 67 fund. CC Avenue: 67% is not a degree — chart pe 67% decline pattern required, rejected.' },
          { step: 'SNR & Envelope Picks', heading: 'Support-Resistance & Envelope Names', body: 'SBI Card: SNR pe 2 targets achieved, 3rd trade on. Berger Paints: support ~₹400 → target ~₹600. IRCTC: valid SNR buy, P2≥P1 rule, 17.88% public holding. 5paisa: 50% fall = double-money case. TCS: AI myth debunked, target 30% from entry. Dixon: SNR ranges 37%/49%. KFintech: ROCE 30%, PE 42, sales/profit ATH, -46% gira, 57% range — BUY (SNR list). HDFC Bank: envelope lower-blue ke neeche = buy zone, "zero doubt". Ambuja Cement: envelope strategy, public only 7%.' },
          { step: 'ABCD Picks', heading: 'ABCD & Position Examples', body: 'Sonata Software: ABCD target hit — "ABCD hate", big target. HDFC Bank (06 Jul): ABCD multiple trades, envelope value → book ABCD. Sanofi India: "ABCD ke 2-3 target deke ja raha hai". Zensar: "No no why wait, we can go ahead with ABCD." Equitas Bank: "Play ABCD on the bottom, target will be best." DVL: ABCD follow karo. Fine Organics: ABCD + GTT target — "GTT automatic target".' },
          { step: 'Strong Fundamental BUYs', heading: 'Teacher\'s Confidence Names', body: 'Rupee BIO: 2000cr, net debt zero, ROE 13%, PE low, sales/profit ATH, fixed assets growing — BUY (1.1% portfolio). Happy Minds: super strategy buy-point, "20% increase from now, 3 lakh position" — BUY. CSL: super strategy, 3 lakh position, GTT pe — BUY. Pfizer: "Came to buy point, we can take the trade" — GTT demo — BUY. Zaggle: "Sales/profit ATH, PE bohot neeche, screaming buy" — top pick. Jyoti CNC: net debt/equity 0.2 rule, ROC 21%, PE good, sales/profit ATH — BUY. IREDA: 65% quality, 60% down, govt renewable, financials great — positive.' },
          { step: 'Positive Holds & Watches', heading: 'Guidance Names', body: 'TCS: large cap exception, "don\'t worry" — hold. Reliance: "Don\'t worry, it is Reliance" — hold. HDFC Life: "Amazing company, I have also taken it" — growing company — positive. M&M: "Core logic of envelope strategy" — positive. MAS Financial: SNR + 5-star, "looks good" — positive. Go Digit: sales/profit increasing, ROCE 47-55, growing — positive. Astral: price fine, lower blue dekho — watch. Bajaj Auto: envelope signal, orange pe action — watch.' },
          { step: 'Avoids, Rejects & Lessons', heading: 'What NOT To Do', body: 'Fusion Finance: 67% up + loss-making → "waste of time" — reject. ICICI General: 20%+ fall (fire claims) — avoid. VVTC/Bombay Burma: "Chunni Munni company, no confidence" — skip. Rajesh Exports: loss company girte hue add kiya (4% add = trick) — lesson; repeated negative news = decision criteria — avoid. AWL: 3 lakh loss holding girte hue — lesson. Ionics (small cap): "Should not have done small-cap in FNO" — lesson. Credit Access Gramin: "Signal nahi, chance tight" — skip. Muthoot Microfin: ROE only 6% — weak. TBI-COR-CON (SME): "SME can be zero" — risk.' }
        ],
        coachNote: 'Teacher ka style yaad rakho: "sirf check ke baad" — in stocks mein se kisi ko bhi buy karne se pehle, 67-Funda ke 10 points ya SNR ki validity rules khud verify karo. Ye table guidance hai, paisa-call nahi. Sabse important: kabhi YouTube tip pe buy mat karo — "I will never be able to buy this."',
        tryIt: { label: 'Scan These in the Screener', path: '/screener' }
      }
    ]
  }
];
