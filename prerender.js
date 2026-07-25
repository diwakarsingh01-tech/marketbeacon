#!/usr/bin/env node
/**
 * Simple prerender script for key SEO pages
 * Runs after `npm run build` to generate static HTML for crawlers
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const BASE_URL = 'http://localhost:4173'; // Vite preview server

// Pages to prerender (high priority for SEO)
const PAGES = [
  { path: '/', file: 'index.html' },
  { path: '/education', file: 'education.html' },
  { path: '/pricing', file: 'pricing.html' },
  { path: '/methodology', file: 'methodology.html' },
  { path: '/blogs', file: 'blogs.html' },
  { path: '/about', file: 'about.html' },
  { path: '/contact', file: 'contact.html' },
  { path: '/license-desk', file: 'license-desk.html' },
  { path: '/privacy', file: 'privacy.html' },
  { path: '/terms', file: 'terms.html' },
];

// Blog articles (will fetch from API)
async function getBlogSlugs() {
  try {
    const res = await fetch(`${BASE_URL}/api/blog`);
    const posts = await res.json();
    return posts.map((p: any) => ({ path: `/blog/${p.slug}`, file: `blog-${p.slug}.html` }));
  } catch {
    return [];
  }
}

async function prerender() {
  console.log('🚀 Starting prerender...');
  
  // Start Vite preview server
  const { spawn } = require('child_process');
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true
  });
  preview.unref();
  
  // Wait for server to start
  await new Promise(r => setTimeout(r, 3000));
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport for consistent rendering
  await page.setViewport({ width: 1200, height: 800 });
  
  // Get blog slugs
  const blogPages = await getBlogSlugs();
  const allPages = [...PAGES, ...blogPages];
  
  console.log(`📄 Prerendering ${allPages.length} pages...`);
  
  for (const { path: pagePath, file } of allPages) {
    try {
      const url = `${BASE_URL}${pagePath}`;
      console.log(`  → ${pagePath}`);
      
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Wait for React to hydrate and SEO tags to be injected
      await page.waitForFunction(() => {
        return document.querySelector('title') !== null;
      }, { timeout: 10000 });
      
      // Get rendered HTML
      const html = await page.content();
      
      // Save to dist
      const outputPath = path.join(DIST_DIR, file);
      fs.writeFileSync(outputPath, html);
      
    } catch (err) {
      console.error(`  ✗ Failed: ${pagePath}`, err.message);
    }
  }
  
  await browser.close();
  preview.kill();
  console.log('✅ Prerender complete!');
}

prerender().catch(console.error);