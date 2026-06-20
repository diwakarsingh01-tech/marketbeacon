export const WHATSAPP_NUMBER = '919251180183';
export const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;
export const waLink = (text?: string) => text ? `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}` : WHATSAPP_BASE;

export const TRADER_COUNT = '31402';
export const RATING_COUNT = '31400';
