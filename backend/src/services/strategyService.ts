import { validateBatch9 } from '../services/fundamentalAudit.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateSRStrategy, calculateCupHandle, calculateSixtySevenFunda, calculateTwentyRallyRetest, calculateRHS as calculateReverseHeadShoulders } from '../strategies/index.js';

export const runStrategyAnalysis = async (stratId: string, snap: any, marketCap: number, basketName: string = 'ALL') => {
    const isElite = basketName === 'Elite Basket';
    const isQuality = basketName === 'Quality Basket';
    const isGrowth = basketName === 'Growth Basket';

    // 🛡️ INSTITUTIONAL BASKET AUTHORIZATION
    const authorizedBaskets: Record<string, string[]> = {
        'ENVELOPE_LONG': ['Elite Basket', 'Quality Basket'],
        'ENVELOPE_SHORT': ['Elite Basket', 'Quality Basket'],
        'BOLLINGER': ['Elite Basket', 'Quality Basket'],
        '52W_HIGH_LOW': ['Elite Basket', 'Quality Basket'],
        'SMA_BCD': ['Elite Basket', 'Quality Basket'],

        'CUP_HANDLE_ABCD': ['Quality Basket', 'Elite Basket'],
        'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket', 'Fallen Value Basket'],
        'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket', 'Fallen Value Basket'],
        'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket', 'Fallen Value Basket'],
        'REVERSE_HEAD_SHOULDERS': ['Elite Basket', 'Quality Basket', 'Growth Basket', 'Fallen Value Basket']
    };

    const allowed = authorizedBaskets[stratId] || [];
    if (basketName !== 'ALL' && !allowed.includes(basketName)) {
        return { isBuyZone: false, reason: 'Basket Not Authorized' };
    }

    let result: any = null;
    switch (stratId) {
        case 'ENVELOPE_LONG': result = calculateEnvelope(snap.quotes); break;
        case 'ENVELOPE_SHORT': result = processShortEnvelope(snap.quotes); break;
        case 'BOLLINGER': result = calculateBollingerBand(snap.quotes); break;
        case '52W_HIGH_LOW': result = calculate52WeekStrategy(snap.quotes); break;
        case 'SMA_BCD': result = calculateSMAStacking(snap.quotes); break;
        case 'CUP_HANDLE_ABCD': result = calculateCupHandle(snap.quotes); break;

        case 'SR_STRATEGY': result = calculateSRStrategy(snap.quotes, snap.screener); break;
        case 'TWENTY_RALLY_RETEST': result = calculateTwentyRallyRetest(snap.quotes); break;
        case 'SIXTY_SEVEN_FUNDA': result = calculateSixtySevenFunda(snap.quotes, snap.screener); break;
        case 'REVERSE_HEAD_SHOULDERS': result = calculateReverseHeadShoulders(snap.quotes); break;
        default: return null;
    }

    if (result && result.isBuyZone) {
      const sym = snap.sym || snap.symbol || '';
      if (sym) {
        try {
          const audit = await validateBatch9(sym, snap, basketName);
          if (!audit.isPass) {
            return { isBuyZone: false, reason: `Fundamental Gate: ${audit.reason} (Score: ${audit.score})` };
          }
        } catch {
          return { isBuyZone: false, reason: 'Fundamental Gate: Audit Error' };
        }
      }
    }

    return result;
};
