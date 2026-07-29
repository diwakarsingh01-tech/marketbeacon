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

// Daily dedup: track which daily digests have been sent per date
const dailySentKeys = new Set<string>();

function canSendDaily(key: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  const dedupKey = `${today}:${key}`;
  if (dailySentKeys.has(dedupKey)) return false;
  dailySentKeys.add(dedupKey);
  return true;
}

export async function sendTelegramMessage(
  message: string,
  target: 'dm' | 'channel' | 'both' = 'dm',
  replyMarkup?: any
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
      const body: any = {
        chat_id: id,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };
      if (replyMarkup) {
        body.reply_markup = replyMarkup;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
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

export async function sendTelegramPhoto(
  photoUrl: string,
  caption: string,
  target: 'dm' | 'channel' | 'both' = 'dm',
  replyMarkup?: any
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
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
      const body: any = {
        chat_id: id,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'Markdown',
        reply_markup: replyMarkup
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const err = await response.text();
        console.error(`❌ [TELEGRAM] Failed to send photo to ${id}: ${err}`);
        allOk = false;
      } else {
        console.log(`✅ [TELEGRAM] Photo sent to ${id}`);
      }
    } catch (e: any) {
      console.error(`❌ [TELEGRAM] Error sending photo to ${id}: ${e.message}`);
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
  tranche: string,
  score?: number,
  abcd?: { a: { price: number; date: string }; b: { price: number; date: string }; c: { price: number; date: string }; d: { price: number; date: string } }
): Promise<boolean> {
  const roi = ((target / entryPrice) - 1) * 100;
  const lines = [
    `🚨 *${basket}: ${symbol}*`,
    ``,
    `📊 *Strategy:* ${strategy}`,
    `📌 *Tranche:* ${tranche}`,
    `💰 *Entry:* ₹${Math.round(entryPrice)}`,
    `🎯 *Target:* ₹${Math.round(target)}`,
    `📈 *ROI:* ${roi.toFixed(1)}%`,
  ];

  if (score !== undefined) {
    lines.push(`🏆 *Fundamental Score:* ${score}/100`);
  }

  if (abcd) {
    lines.push(``);
    lines.push(`📐 *ABCD Pattern Levels*`);
    lines.push(`   A: ₹${Math.round(abcd.a.price)}`);
    lines.push(`   B: ₹${Math.round(abcd.b.price)}`);
    lines.push(`   C: ₹${Math.round(abcd.c.price)}`);
    lines.push(`   D: ₹${Math.round(abcd.d.price)}`);
  }

  lines.push(``);
  lines.push(`🔗 https://trade.marketbeaconpro.com`);

  const message = lines.join('\n');

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '📊 View live Chart', url: `https://trade.marketbeaconpro.com/alpha-hub` },
        { text: '🛡️ Audit details', url: `https://trade.marketbeaconpro.com/alpha-hub` }
      ],
      [
        { text: '🎟️ Claim 7-Day Free Trial', url: 'https://trade.marketbeaconpro.com/' }
      ]
    ]
  };

  const chartUrl = `https://marketbeaconpro.com/api/n8n/stock-chart/${symbol}`;
  return sendTelegramPhoto(chartUrl, message, 'both', replyMarkup);
}

export async function sendDailyAuditSummary(summaryText: string): Promise<boolean> {
  const header = `🛡️ *Audit Summary*`;
  const message = `${header}\n\n${summaryText}`;
  return sendTelegramMessage(message, 'dm');
}

export async function sendSystemHealthNotification(
  status: 'online' | 'warning' | 'error',
  details: string
): Promise<boolean> {
  const icon = status === 'online' ? '✅' : status === 'warning' ? '⚠️' : '❌';
  const lines = [
    `${icon} *MarketBeacon System Status*`,
    ``,
    `*Status:* ${status.toUpperCase()}`,
    `*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
    ``,
    details,
    ``,
    `_Auto-generated heartbeat_`
  ];
  return sendTelegramMessage(lines.join('\n'), 'dm');
}

export async function sendDailyStatusDigest(
  byBasket: Record<string, {
    qualified: number; observation: number; rejected: number; anomalies: number;
    qualifiedStocks?: string[]; observationStocks?: string[]; rejectedStocks?: string[]; anomaliesStocks?: string[];
  }>,
  totalQualified: number,
  totalObservation: number,
  totalRejected: number,
  totalAnomalies: number
): Promise<boolean> {
  // Daily dedup: only one digest per calendar day
  if (!canSendDaily('daily_status_digest')) {
    console.log('⚠️ [TELEGRAM] Daily digest already sent today. Skipping duplicate.');
    return false;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });

  const lines = [
    `📊 *Daily Market Digest*`,
    `📅 ${dateStr}`,
    `⏰ Generated on: ${timeStr} IST`,
    ``,
    `*Overall Status*`,
    `🟢 Qualified: ${totalQualified}`,
    `🟡 Observation: ${totalObservation}`,
    `🔴 Rejected: ${totalRejected}`,
    `⚠️ Anomalies: ${totalAnomalies}`,
    ``,
  ];

  for (const [basket, stats] of Object.entries(byBasket)) {
    lines.push(`*${basket}*`);
    lines.push(`   ✅ Qualified: ${stats.qualified} | 👀 Observation: ${stats.observation} | ❌ Rejected: ${stats.rejected}${stats.anomalies > 0 ? ` | ⚠️ Anomalies: ${stats.anomalies}` : ''}`);

    if (stats.qualifiedStocks && stats.qualifiedStocks.length > 0) {
      const stocks = stats.qualifiedStocks.slice(0, 15).join(', ');
      lines.push(`   🟢 *Qualified:* ${stocks}${stats.qualifiedStocks.length > 15 ? ` +${stats.qualifiedStocks.length - 15} more` : ''}`);
    }
    if (stats.observationStocks && stats.observationStocks.length > 0) {
      const stocks = stats.observationStocks.slice(0, 10).join(', ');
      lines.push(`   🟡 *Observation:* ${stocks}${stats.observationStocks.length > 10 ? ` +${stats.observationStocks.length - 10} more` : ''}`);
    }
    if (stats.rejectedStocks && stats.rejectedStocks.length > 0) {
      const stocks = stats.rejectedStocks.slice(0, 10).join(', ');
      lines.push(`   🔴 *Rejected:* ${stocks}${stats.rejectedStocks.length > 10 ? ` +${stats.rejectedStocks.length - 10} more` : ''}`);
    }
  }

  lines.push(``);
  lines.push(`🔄 Next refresh: Tonight 20:30 UTC`);
  lines.push(`🔗 https://marketbeaconpro.com`);

  return sendTelegramMessage(lines.join('\n'), 'both');
}
