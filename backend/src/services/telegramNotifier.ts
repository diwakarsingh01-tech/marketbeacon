const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL || '';

let lastSent: Record<string, number> = {};

function canSend(key: string, cooldownMs: number = 5000): boolean {
  const now = Date.now();
  if (lastSent[key] && (now - lastSent[key]) < cooldownMs) return false;
  lastSent[key] = now;
  return true;
}

export async function sendTelegramMessage(
  message: string,
  target: 'dm' | 'channel' | 'both' = 'dm'
): Promise<boolean> {
  const chatId = target === 'channel' ? TELEGRAM_CHANNEL : TELEGRAM_CHAT_ID;
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.warn('⚠️ [TELEGRAM] Bot token or chat ID not configured. Skipping.');
    return false;
  }

  if (!canSend('telegram')) {
    console.warn('⚠️ [TELEGRAM] Rate limited (cooldown active). Skipping.');
    return false;
  }

  const targets: string[] = [];
  if (target === 'dm' || target === 'both') targets.push(TELEGRAM_CHAT_ID);
  if ((target === 'channel' || target === 'both') && TELEGRAM_CHANNEL) targets.push(TELEGRAM_CHANNEL);

  let allOk = true;
  for (const id of targets) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: id,
          text: message,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });
      if (!response.ok) {
        const err = await response.text();
        if (err.includes('Forbidden: bot can\'t initiate conversation')) {
          console.warn(`⚠️ [TELEGRAM] User ${id} hasn't started the bot yet. Skipping.`);
        } else {
          console.error(`❌ [TELEGRAM] Failed to send to ${id}: ${err}`);
        }
        allOk = false;
      } else {
        console.log(`✅ [TELEGRAM] Message sent to ${id}`);
      }
    } catch (e: any) {
      console.error(`❌ [TELEGRAM] Error sending to ${id}: ${e.message}`);
      allOk = false;
    }
  }
  return allOk;
}

export async function sendSignalNotification(
  symbol: string,
  strategy: string,
  basket: string,
  entryPrice: number,
  target: number,
  tranche: string
): Promise<boolean> {
  const roi = ((target / entryPrice) - 1) * 100;
  const message = [
    `🚨 *${basket}: ${symbol}*`,
    ``,
    `📊 *Strategy:* ${strategy}`,
    `📌 *Tranche:* ${tranche}`,
    `💰 *Entry:* ₹${Math.round(entryPrice)}`,
    `🎯 *Target:* ₹${Math.round(target)}`,
    `📈 *ROI:* ${roi.toFixed(1)}%`,
    ``,
    `🔗 https://marketbeaconpro.com`,
  ].join('\n');

  return sendTelegramMessage(message, 'both');
}

export async function sendDailyAuditSummary(summaryText: string): Promise<boolean> {
  const header = `🛡️ *Audit Summary*`;
  const message = `${header}\n\n${summaryText}`;
  return sendTelegramMessage(message, 'both');
}
