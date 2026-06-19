import { spawn } from 'child_process';
import { request } from 'http';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = 4173;
const BASE = 'http://localhost:' + PORT;

const ROUTES = [
  '/',
  '/blog',
  '/pricing',
  '/login',
  '/privacy-policy',
];

const API_BASE = process.env.API_URL || 'http://localhost:3001';

async function fetchArticleSlugs() {
  try {
    const res = await fetch(`${API_BASE}/api/blog`);
    if (!res.ok) throw new Error('API unavailable');
    const articles = await res.json();
    return articles.map(a => `/blog/${a.slug}`);
  } catch {
    return [
      '/blog/abcd-tranche-laddering-guide',
      '/blog/what-is-sebi-compliant-stock-screener',
      '/blog/how-to-trade-like-fii-dii-india',
      '/blog/institutional-audit-score-explained',
    ];
  }
}

function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = request(url, { method: 'HEAD' }, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Server did not start in time'));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };
    check();
  });
}

function deduplicateHeadTags(html) {
  const dedup = (regex) => {
    const parts = html.split(regex);
    if (parts.length <= 2) return;
    const matches = html.match(regex);
    const before = parts.slice(0, -1).join('');
    const after = parts[parts.length - 1];
    html = before + matches[matches.length - 1] + after;
  };
  dedup(/<title>.*?<\/title>/gi);
  dedup(/<link rel="canonical".*?\/?>/gi);
  dedup(/<meta name="description" content=".*?"\/?>/gi);
  dedup(/<meta property="og:title" content=".*?"\/?>/gi);
  dedup(/<meta property="og:description" content=".*?"\/?>/gi);
  dedup(/<meta property="og:url" content=".*?"\/?>/gi);
  dedup(/<meta property="og:image" content=".*?"\/?>/gi);
  dedup(/<meta property="og:type" content=".*?"\/?>/gi);
  dedup(/<meta property="og:site_name" content=".*?"\/?>/gi);
  dedup(/<meta name="twitter:title" content=".*?"\/?>/gi);
  dedup(/<meta name="twitter:description" content=".*?"\/?>/gi);
  dedup(/<meta name="twitter:image" content=".*?"\/?>/gi);
  return html;
}

async function prerender() {
  console.log('[Prerender] Starting preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: __dirname,
    stdio: 'pipe',
    shell: true,
  });

  try {
    await waitForServer(BASE);
    console.log('[Prerender] Server ready.');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const blogRoutes = await fetchArticleSlugs();
    const allRoutes = [...ROUTES, ...blogRoutes];

    for (const route of allRoutes) {
      const url = BASE + route;
      console.log(`[Prerender] Rendering ${route}...`);
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      const title = await page.title();
      console.log(`  Title: "${title}"`);

      let html = await page.content();
      // Override page title with the one detected by puppeteer (post-navigation)
      const pageTitle = title;
      html = html.replace(/<title>.*?<\/title>/gi, `<title>${pageTitle}</title>`);
      html = deduplicateHeadTags(html);
      await page.close();

      let outPath;
      if (route === '/') {
        outPath = join(DIST, 'index.html');
      } else {
        outPath = join(DIST, route.slice(1), 'index.html');
      }
      const dir = dirname(outPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(outPath, html);
      console.log(`  Saved: ${outPath}`);
    }

    await browser.close();
    console.log('[Prerender] Done!');
  } finally {
    server.kill('SIGTERM');
    setTimeout(() => process.exit(0), 1000);
  }
}

prerender().catch((err) => {
  console.error('[Prerender] Failed:', err);
  process.exit(1);
});
