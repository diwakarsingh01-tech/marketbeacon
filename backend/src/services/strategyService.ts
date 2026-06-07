import { validateBatch9 } from '../services/fundamentalAudit.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateSRStrategy, calculateRHS, calculateCupHandle, calculateSixtySevenFunda, calculateTwentyRallyRetest } from '../strategies/index.js';

export const runStrategyAnalysis = (stratId: string, snap: any, marketCap: number, basketName: string = 'ALL') => {
    const isElite = basketName === 'Elite Basket';
    const isQuality = basketName === 'Quality Basket';
    const isGrowth = basketName === 'Growth Basket';

    // 🛡️ INSTITUTIONAL BASKET AUTHORIZATION
    const authorizedBaskets: Record<string, string[]> = {
        'ENVELOPE_LONG': ['Elite Basket'],
        'ENVELOPE_SHORT': ['Elite Basket'],
        'BOLLINGER': ['Elite Basket'],
        '52W_HIGH_LOW': ['Elite Basket'],
        'SMA_BCD': ['Elite Basket', 'Quality Basket'],
        'RHS_ABCD': ['Elite Basket', 'Quality Basket'],
        'CUP_HANDLE_ABCD': ['Elite Basket', 'Quality Basket'],
        'SR_STRATEGY': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
        'TWENTY_RALLY_RETEST': ['Elite Basket', 'Quality Basket', 'Growth Basket'],
        'SIXTY_SEVEN_FUNDA': ['Elite Basket', 'Quality Basket', 'Growth Basket']
    };

    const allowed = authorizedBaskets[stratId] || [];
    if (basketName !== 'ALL' && !allowed.includes(basketName)) {
        return { isBuyZone: false, reason: 'Basket Not Authorized' };
    }

    // ⚡ Performance Hardening: Use pre-calculated results if available
    if (snap.strategies && snap.strategies[stratId]) {
        return snap.strategies[stratId];
    }

    switch (stratId) {
        case 'ENVELOPE_LONG': return calculateEnvelope(snap.quotes);
        case 'ENVELOPE_SHORT': return processShortEnvelope(snap.quotes);
        case 'BOLLINGER': return calculateBollingerBand(snap.quotes);
        case '52W_HIGH_LOW': return calculate52WeekStrategy(snap.quotes);
        case 'SMA_BCD': return calculateSMAStacking(snap.quotes);
        case 'CUP_HANDLE_ABCD': return calculateCupHandle(snap.quotes);
        case 'RHS_ABCD': return calculateRHS(snap.quotes);
        case 'SR_STRATEGY': return calculateSRStrategy(snap.quotes, snap.screener);
        case 'TWENTY_RALLY_RETEST': return calculateTwentyRallyRetest(snap.quotes);
        case 'SIXTY_SEVEN_FUNDA': return calculateSixtySevenFunda(snap.quotes, snap.screener);
        default: return null;
    }
};
