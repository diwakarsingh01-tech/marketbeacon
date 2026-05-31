import { validateBatch9 } from '../services/fundamentalAudit.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateSRStrategy, calculateRHS, calculateCupHandle, calculateSixtySevenFunda, calculateTwentyRallyRetest } from '../strategies/index.js';

export const runStrategyAnalysis = (stratId: string, snap: any, marketCap: number) => {
    switch (stratId) {
        case 'ENVELOPE_LONG': return calculateEnvelope(snap.quotes);
        case 'ENVELOPE_SHORT': return processShortEnvelope(snap.quotes, marketCap);
        case 'BOLLINGER': return calculateBollingerBand(snap.quotes);
        case 'SMA_ABCD': return calculateSMAStacking(snap.quotes);
        case '52W_HIGH_LOW': return calculate52WeekStrategy(snap.quotes);
        case 'SR_STRATEGY': return calculateSRStrategy(snap.quotes, snap.screener);
        case 'RHS_ABCD': return calculateRHS(snap.quotes);
        case 'CUP_HANDLE_ABCD': return calculateCupHandle(snap.quotes);
        case 'SIXTY_SEVEN_FUNDA': return calculateSixtySevenFunda(snap.quotes, snap.screener);
        case 'TWENTY_RALLY_RETEST': return calculateTwentyRallyRetest(snap.quotes);
        default: return null;
    }
};
