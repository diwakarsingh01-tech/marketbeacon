import { validateBatch9 } from '../services/fundamentalAudit.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateSRStrategy, calculateRHS, calculateCupHandle, calculateSixtySevenFunda, calculateTwentyRallyRetest } from '../strategies/index.js';

export const runStrategyAnalysis = (stratId: string, snap: any, marketCap: number) => {
    switch (stratId) {
        case 'ENVELOPE_LONG': return calculateEnvelope(snap.quotes);
        case 'ENVELOPE_SHORT': return processShortEnvelope(snap.quotes, marketCap);
        case 'ENVELOPE_KNOX': return calculateEnvelopeKnox(snap.quotes);
        case 'SMA': return calculateSMAStacking(snap.quotes);
        case 'BOLLINGER': return calculateBollingerBand(snap.quotes);
        case '52W_HIGH_LOW': 
            const isRestrictedBasket = ['H-Super45', 'H-GOOD45'].includes(snap.basketName || 'ALL');
            return isRestrictedBasket ? calculate52WeekStrategy(snap.quotes) : { isBuyZone: false };
        case 'SMA_BCD': return calculateSMAStacking(snap.quotes); // Maps to Quantum Stacking for BCD
        case 'CUP_HANDLE_ABCD': 
        case 'CUP_HANDLE_CORRECTION': 
            return calculateCupHandle(snap.quotes);
        case 'RHS_ABCD': 
        case 'RHS_CORRECTION':
            return calculateRHS(snap.quotes);
        case 'SR_STRATEGY': return calculateSRStrategy(snap.quotes, snap.screener);
        case 'TWENTY_RALLY_RETEST': return calculateTwentyRallyRetest(snap.quotes);
        case 'SIXTY_SEVEN_FUNDA': return calculateSixtySevenFunda(snap.quotes, snap.screener);
        default: return null;
    }
};
