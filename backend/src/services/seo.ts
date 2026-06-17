import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from '../universe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_SITEMAP_PATH = path.join(__dirname, '../../../public/sitemap.xml');
const BASE_URL = 'https://marketbeaconpro.com';
const TODAY = new Date().toISOString().split('T')[0];

function safeUrl(page: string) {
  return `${BASE_URL}${page}`.replace(/\/+/g, '/').replace('https:/', 'https://');
}

export function generateSitemap() {
  const seen = new Set<string>();
  const uniqueStockPages = NIFTY_500
    .map(s => `/analysis/${s.replace('.NS', '')}`)
    .filter(p => {
      if (seen.has(p)) return false;
      seen.add(p);
      return true;
    });

  const staticPages = [
    { path: '', priority: '1.0', freq: 'daily' },
    { path: '/blog', priority: '0.9', freq: 'weekly' },
    { path: '/login', priority: '0.8', freq: 'weekly' },
    { path: '/pricing', priority: '0.8', freq: 'weekly' },
    { path: '/privacy-policy', priority: '0.5', freq: 'monthly' },
    { path: '/blog/abcd-tranche-laddering-guide', priority: '0.85', freq: 'monthly' },
    { path: '/blog/what-is-sebi-compliant-stock-screener', priority: '0.85', freq: 'monthly' },
    { path: '/blog/how-to-trade-like-fii-dii-india', priority: '0.85', freq: 'monthly' },
    { path: '/blog/institutional-audit-score-explained', priority: '0.8', freq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...uniqueStockPages.map(p => ({ path: p, priority: '0.7', freq: 'daily' }))].map(p => `
  <url>
    <loc>${safeUrl(p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('')}
</urlset>`;

  try {
    fs.writeFileSync(PUBLIC_SITEMAP_PATH, sitemap);
    console.log(`Sitemap generated at ${PUBLIC_SITEMAP_PATH} with ${staticPages.length + uniqueStockPages.length} URLs.`);
  } catch (e: any) {
    console.error('Sitemap generation failed:', e.message);
  }
}
