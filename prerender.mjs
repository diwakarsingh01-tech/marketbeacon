import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = existsSync(join(__dirname, "frontend", "dist")) ? join(__dirname, "frontend", "dist") : join(__dirname, "dist");

const routes = [

  { path: "/docs/intro",       title: "MarketBeacon Pro Documentation",                    desc: "Complete documentation for MarketBeacon Pro — ABCD Framework, 9 strategies, platform guides, and API reference." },
  { path: "/docs/quickstart",  title: "Quick Start Guide — MarketBeacon Pro",              desc: "Get up and running in 5 minutes. From account creation to your first qualified trade idea." },
  { path: "/docs/abc-framework", title: "ABCD Averaging Framework — MarketBeacon Pro",      desc: "The mathematical backbone of every strategy. Tranche-based position building with 10% gaps and laddered targets." },
  { path: "/docs/core-rules",  title: "Core Selection Rules — MarketBeacon Pro",           desc: "Universal institutional filters: market cap tiers, fundamental audit, smart money threshold, D/E limits." },
  { path: "/docs/risk-management", title: "Risk Management & Portfolio Allocation",        desc: "The 50:30:20 rule, position sizing, sector caps, tranche sizing, and invalidation points." },
  { path: "/docs/baskets",     title: "Understanding Baskets — MarketBeacon Pro",          desc: "Elite, Quality, Growth, and Fallen Value universes. Which basket for which strategy?" },
  { path: "/docs/strategies",  title: "All Strategies — MarketBeacon Pro",                 desc: "9 quantitative strategies across 3 tiers. Compare entry/exit rules, risk profiles, and ideal conditions." },
  { path: "/docs/free-strategies", title: "Free Strategies — MarketBeacon Pro",            desc: "Bollinger Band, Envelope Long, Envelope Short (Pullback). Available to all users." },
  { path: "/docs/pro-strategies", title: "Pro Strategies — MarketBeacon Pro",              desc: "SMA+BCD, 52-Week High/Low, Cup with Handle. Requires Pro subscription." },
  { path: "/docs/alpha-strategies", title: "Alpha Strategies — MarketBeacon Pro",          desc: "Support & Resistance, 67% Institutional Reset, 20% Velocity Retest. Institutional-grade setups." },
  { path: "/docs/screener",    title: "Matrix Screener Guide — MarketBeacon Pro",          desc: "Universe selection, strategy dropdown, Passed/Observation/Fail tabs, CSV export, bookmarking." },
  { path: "/docs/alpha-hub",   title: "Alpha Hub Guide — MarketBeacon Pro",                desc: "Capital allocation engine, basket distribution, strategy breakdown, performance vs Nifty." },
  { path: "/docs/charts",      title: "Chart Terminal Guide — MarketBeacon Pro",           desc: "Multi-timeframe, ABCD overlays, S&R zones, strategy signals, drawing tools, layout persistence." },
  { path: "/docs/beacon-ai",   title: "BeaconAI Assistant — MarketBeacon Pro",             desc: "Natural language portfolio analysis, strategy evaluation, filter suggestions, risk audits." },
  { path: "/docs/education",   title: "Video Course — MarketBeacon Pro",                   desc: "Structured curriculum: Foundation → Free → Pro → Alpha → Lab → Live Application." },
  { path: "/docs/api-reference", title: "API Reference — MarketBeacon Pro",                desc: "REST endpoints, authentication, webhooks, rate limits, SDKs, example integrations." },
  { path: "/docs/glossary",    title: "Glossary — MarketBeacon Pro",                       desc: "Definitions for every term: ABCD, tranche, smart money, basket, invalidation, CAGR, Sharpe, etc." },
  { path: "/docs/faq",         title: "FAQ — MarketBeacon Pro",                            desc: "Billing, subscriptions, strategy access, data delays, troubleshooting common issues." },
  { path: "/docs/changelog",   title: "Changelog — MarketBeacon Pro",                      desc: "Version history, new features, bug fixes, strategy additions, platform updates." },

  { path: "/about",       title: "About MarketBeacon Pro — Institutional Stock Research",    desc: "Learn about MarketBeacon Pro, our ABCD Tranche logic, and the team behind India institutional stock research platform." },
  { path: "/contact",     title: "Contact MarketBeacon Pro — Support & Inquiries",              desc: "Get in touch with MarketBeacon Pro for support, partnerships, and feedback. We typically respond within 24 hours." },
  { path: "/privacy-policy", title: "Privacy Policy — MarketBeacon Pro",                      desc: "MarketBeacon Pro privacy policy. Learn how we collect, use, and protect your data." },
  { path: "/terms",       title: "Terms of Service — MarketBeacon Pro",                       desc: "MarketBeacon Pro terms of service governing use of our stock research platform." },
  { path: "/disclaimer",  title: "Disclaimer — SEBI & Risk Disclosure — MarketBeacon Pro",    desc: "Important regulatory and risk disclosures. MarketBeacon Pro is not SEBI-registered investment advice." },
  { path: "/charts",     title: "Live Charts Terminal — Institutional Grade Charts & Analytics", desc: "Professional candlestick charts with FII/DII overlays, ABCD tranche levels, and 50+ technical indicators." },


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
];

const baseHtml = readFileSync(join(DIST, "index.html"), "utf-8");

for (const route of routes) {
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

  writeFileSync(outPath, html);
  console.log(`  ${route.path}`);
}

console.log(`\nPrerendered ${routes.length} routes`);
