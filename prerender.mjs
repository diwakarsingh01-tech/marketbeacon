import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = existsSync(join(__dirname, "frontend", "dist")) ? join(__dirname, "frontend", "dist") : join(__dirname, "dist");

// Fetch blog posts from API
async function fetchBlogPosts() {
  try {
    const res = await fetch("https://marketbeaconpro.com/api/blog");
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const posts = await res.json();
    return posts.map((p) => ({
      path: `/blog/${p.slug}`,
      title: `${p.title} | MarketBeacon Pro`,
      desc: p.meta_description || p.excerpt || "Read the full article on MarketBeacon Pro blog."
    }));
  } catch (e) {
    console.error("Failed to fetch blog posts:", e);
    return [];
  }
}

const staticRoutes = [

  { path: "/about",       title: "About MarketBeacon Pro — Institutional Stock Research",    desc: "Learn about MarketBeacon Pro, our ABCD Tranche logic, and the team behind India institutional stock research platform." },
  { path: "/contact",     title: "Contact MarketBeacon Pro — Support & Inquiries",              desc: "Get in touch with MarketBeacon Pro for support, partnerships, and feedback. We typically respond within 24 hours." },
  { path: "/privacy-policy", title: "Privacy Policy — MarketBeacon Pro",                      desc: "MarketBeacon Pro privacy policy. Learn how we collect, use, and protect your data." },
  { path: "/terms",       title: "Terms of Service — MarketBeacon Pro",                       desc: "MarketBeacon Pro terms of service governing use of our stock research platform." },
  { path: "/disclaimer",  title: "Disclaimer — SEBI & Risk Disclosure — MarketBeacon Pro",    desc: "Important regulatory and risk disclosures. MarketBeacon Pro is not SEBI-registered investment advice." },
  { path: "/course/swing",   title: "Swing Trading Course — MarketBeacon Swing System",  desc: "Learn the repeatable swing-trading system: Envelope 200 EMA, ABCD ladder, Cup & Handle, 67-point fundamental audit. Educational, not advice." },
  { path: "/course/swing/welcome", title: "Welcome — MarketBeacon Swing System",          desc: "Your Swing Trading Course is unlocked. Lifetime access." },

  { path: "/",           title: "Institutional Stock Audit Score",                          desc: "India #1 Institutional Audit Score for Nifty 500 stocks. ABCD Tranche Logic, FII DII trends and real-time screening." },
  { path: "/login",      title: "Login - MarketBeacon Pro",                                 desc: "Sign in to access your institutional stock audit dashboard and ABCD Tranche analysis tools." },
  { path: "/pricing",    title: "Pricing - MarketBeacon Pro",                               desc: "Choose your plan. Free trial available for retail traders. Pro access for sub-brokers and HNIs." },
  { path: "/blog",       title: "Stock Market Insights Blog - MarketBeacon Pro",             desc: "Learn ABCD Tranche laddering, institutional audit scores and FII DII analysis strategies." },
  { path: "/education",  title: "Education - MarketBeacon Pro",                             desc: "Master the 12 proprietary institutional strategies." },
  { path: "/analysis/RELIANCE",  title: "RELIANCE Stock Audit Score - MarketBeacon Pro",    desc: "Check RELIANCE institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/TCS",       title: "TCS Stock Audit Score - MarketBeacon Pro",         desc: "Check TCS institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/HDFCBANK",  title: "HDFCBANK Stock Audit Score - MarketBeacon Pro",    desc: "Check HDFCBANK institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/INFY",      title: "INFY Stock Audit Score - MarketBeacon Pro",        desc: "Check INFY institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/ITC",       title: "ITC Stock Audit Score - MarketBeacon Pro",         desc: "Check ITC institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/WIPRO",     title: "WIPRO Stock Audit Score - MarketBeacon Pro",        desc: "Check WIPRO institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/SBIN",      title: "SBIN Stock Audit Score - MarketBeacon Pro",         desc: "Check SBIN institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/HINDUNILVR",title: "HINDUNILVR Stock Audit Score - MarketBeacon Pro",   desc: "Check HINDUNILVR institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/analysis/M&M",       title: "M&M Stock Audit Score - MarketBeacon Pro",          desc: "Check M&M institutional audit score. ABCD entry zones, FII DII data and safe entry levels." },
  { path: "/alpha-hub",          title: "Alpha Hub — Institutional Strategy Console",         desc: "Access 10 proprietary trading strategies with ABCD Tranche logic, real-time scoring, and basket allocation." },
  { path: "/guide",             title: "Guide — How to Use MarketBeacon Pro",                desc: "A complete step-by-step guide for using MarketBeacon Pro to discover stocks, analyze, build portfolios, and track performance." },
  { path: "/marketplace",        title: "Pricing — MarketBeacon Pro Subscription Plans",      desc: "Compare subscription tiers: Free, Alpha, Elite, and White Label. Start with a free trial." },
  { path: "/ai-assistant",       title: "AI Stock Research Assistant — MarketBeacon Pro",     desc: "Chat with Gemini AI for instant stock analysis, strategy insights, and institutional-grade research." },
  { path: "/screener",           title: "Stock Screener — Institutional Audit Score Filter",  desc: "Screen NIFTY 500 stocks by ABCD Tranche rating, FII/DII activity, and strategy signals." },
  { path: "/connect",            title: "Connect — Institutional Network & API Status",       desc: "Check MarketBeacon Pro system status, API health, and institutional data feed connectivity." },
  { path: "/trade-journal",      title: "Trade Journal — Track Your Institutional Trades",    desc: "Log and analyze your trades with strategy attribution, P&L tracking, and performance metrics." },
  { path: "/profile",            title: "My Profile — MarketBeacon Pro Account Settings",     desc: "Manage your subscription, 2FA, watchlist, and account preferences." },
  { path: "/dashboard",          title: "Dashboard — MarketBeacon Pro Command Center",        desc: "Your personalized trading dashboard with portfolio overview, strategy performance, and market alerts." },
  { path: "/stock-fundamentals", title: "Stock Fundamentals — NIFTY 500 Fundamental Data",    desc: "View fundamental data for NIFTY 500 stocks including PE, PB, market cap, and dividend yield." },
  { path: "/charts",             title: "Live Charts Terminal — Institutional Grade Charts & Analytics", desc: "Professional candlestick charts with FII/DII overlays, ABCD tranche levels, and 50+ technical indicators." },
];

async function main() {
  const blogRoutes = await fetchBlogPosts();
  const allRoutes = [...staticRoutes, ...blogRoutes];

  const baseHtml = readFileSync(join(DIST, "index.html"), "utf-8");

  for (const route of allRoutes) {
    const rel = route.path === "/" ? "index" : route.path.replace(/^\//, "");
    const outPath = join(DIST, rel, "index.html");
    mkdirSync(dirname(outPath), { recursive: true });

    const url = `https://marketbeaconpro.com${route.path}`;
    let html = baseHtml
      .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
      .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${route.desc}"`)
      .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${route.title}"`)
      .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${route.desc}"`)
      .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${route.title}"`)
      .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${route.desc}"`)
      .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)
      .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`);

    // Add ArticleSchema JSON-LD for blog posts
    if (route.path.startsWith("/blog/") && route.path !== "/blog") {
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": route.title.replace(" | MarketBeacon Pro", ""),
        "description": route.desc,
        "url": url,
        "author": { "@type": "Organization", "name": "MarketBeacon Pro Research Team" },
        "publisher": { "@type": "Organization", "name": "MarketBeacon Pro", "logo": { "@type": "ImageObject", "url": "https://marketbeaconpro.com/og-preview.svg" } },
        "datePublished": new Date().toISOString(),
        "dateModified": new Date().toISOString(),
        "mainEntityOfPage": { "@type": "WebPage", "@id": url }
      };
      const schemaScript = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
      // Insert before </head>
      html = html.replace("</head>", `${schemaScript}\n</head>`);
    }

    writeFileSync(outPath, html);
    console.log(`  ${route.path}`);
  }

  console.log(`\nPrerendered ${allRoutes.length} routes (${staticRoutes.length} static + ${blogRoutes.length} blog)`);
}

main().catch(console.error);
