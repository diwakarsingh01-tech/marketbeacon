import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = existsSync(join(__dirname, "frontend", "dist")) ? join(__dirname, "frontend", "dist") : join(__dirname, "dist");

const routes = [

  { path: "/about",       title: "About MarketBeacon Pro — Institutional Stock Research",    desc: "Learn about MarketBeacon Pro, our ABCD Tranche logic, and the team behind India institutional stock research platform." },
  { path: "/contact",     title: "Contact MarketBeacon Pro — Support & Inquiries",              desc: "Get in touch with MarketBeacon Pro for support, partnerships, and feedback. We typically respond within 24 hours." },
  { path: "/privacy-policy", title: "Privacy Policy — MarketBeacon Pro",                      desc: "MarketBeacon Pro privacy policy. Learn how we collect, use, and protect your data." },
  { path: "/terms",       title: "Terms of Service — MarketBeacon Pro",                       desc: "MarketBeacon Pro terms of service governing use of our stock research platform." },
  { path: "/disclaimer",  title: "Disclaimer — SEBI & Risk Disclosure — MarketBeacon Pro",    desc: "Important regulatory and risk disclosures. MarketBeacon Pro is not SEBI-registered investment advice." },
  { path: "/charts",     title: "Live Charts Terminal — Institutional Grade Charts & Analytics", desc: "Professional candlestick charts with FII/DII overlays, ABCD tranche levels, and 50+ technical indicators." },


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
