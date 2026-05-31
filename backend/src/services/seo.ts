import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from '../universe.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_SITEMAP_PATH = path.join(__dirname, '../../../public/sitemap.xml');

export function generateSitemap() {
  console.log('🌐 [SEO] Generating Sitemap for Organic Traffic...');
  const baseUrl = 'https://marketbeacon.pro'; // Update to production domain
  
  const staticPages = [
    '',
    '/login',
    '/pricing',
    '/education',
    '/marketplace'
  ];

  const stockPages = NIFTY_500.map(s => `/analysis/${s.replace('.NS', '')}`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticPages, ...stockPages].map(page => `
  <url>
    <loc>${baseUrl}${page}</loc>
    <changefreq>daily</changefreq>
    <priority>${page.includes('/analysis/') ? '0.8' : '1.0'}</priority>
  </url>`).join('')}
</urlset>`;

  try {
    fs.writeFileSync(PUBLIC_SITEMAP_PATH, sitemap);
    console.log(`✅ [SEO] Sitemap created with ${stockPages.length} stock pages.`);
  } catch (e: any) {
    console.error('❌ [SEO] Sitemap generation failed:', e.message);
  }
}
