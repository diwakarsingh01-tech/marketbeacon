import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SEO from '../components/SEO';

const PrivacyPolicyPage: React.FC = () => {
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const sections = [
    {
      title: '1. Information We Collect',
      body: `When you register for MarketBeacon Pro, we collect:\n\n• Email address and name (for account creation)\n• Usage data (pages visited, features used) via analytics\n• Device information (browser type, OS) for performance optimization\n• Payment reference (UTR/transaction ID — we do NOT store card details)\n\nWe do NOT collect: Aadhaar, PAN, bank account numbers, or any sensitive financial identifiers.`,
    },
    {
      title: '2. How We Use Your Information',
      body: `Your information is used exclusively to:\n\n• Provide and operate the MarketBeacon Pro platform\n• Send transactional emails (account activation, license confirmation)\n• Analyze platform usage to improve features\n• Respond to support queries\n\nWe do NOT sell, rent, or share your personal information with third parties for marketing purposes.`,
    },
    {
      title: '3. SEBI Compliance Disclosure',
      body: `MarketBeacon Pro is a quantitative research and mathematical modeling platform. We are NOT a SEBI-registered Investment Adviser (IA) or Research Analyst (RA).\n\nAll audit scores, strategy signals, ABCD zones, and screener results are pre-coded mathematical models based on publicly available market data. They are intended for educational and personal research purposes ONLY.\n\nNothing on this platform constitutes a personalized investment recommendation, buy/sell advisory, or portfolio management service. Users make their own investment decisions independently.`,
    },
    {
      title: '4. Data Storage & Security',
      body: `All user data is stored on secure servers with AES-256 encryption at rest and TLS 1.3 in transit.\n\nWe implement industry-standard security practices including:\n• Encrypted password storage (bcrypt hashing)\n• JWT-based session authentication with expiry\n• Regular security audits\n\nDespite these measures, no internet transmission is 100% secure. We encourage strong, unique passwords.`,
    },
    {
      title: '5. Cookies & Analytics',
      body: `We use minimal cookies for:\n• Authentication session management (essential)\n• Google Analytics 4 (anonymous usage tracking — no PII)\n\nYou can disable cookies in your browser settings, though this may affect platform functionality. We do not use advertising or tracking cookies from third-party ad networks.`,
    },
    {
      title: '6. Data Retention',
      body: `Active account data is retained while your account is active.\n\nUpon account deletion:\n• Personal data is deleted within 30 days\n• Anonymized usage data may be retained for analytics\n\nYou may request data deletion at any time by contacting support@marketbeacon.pro.`,
    },
    {
      title: '7. Third-Party Services',
      body: `We use the following third-party services:\n• Google Analytics 4 — anonymous usage analytics\n• DiceBear API — avatar generation (no PII sent)\n• NSE/BSE data providers — live market data feeds\n\nEach third party has their own privacy policy. We recommend reviewing them independently.`,
    },
    {
      title: '8. Your Rights',
      body: `You have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request deletion of your data\n• Withdraw consent for analytics\n\nTo exercise these rights, email us at: support@marketbeacon.pro\n\nWe will respond within 7 business days.`,
    },
    {
      title: '9. Changes to This Policy',
      body: `We may update this Privacy Policy periodically. Material changes will be notified via email to registered users. Continued use of the platform after changes constitutes acceptance of the updated policy.\n\nLast updated: June 06, 2026`,
    },
    {
      title: '10. Contact Us',
      body: `For privacy-related queries:\n\nEmail: support@marketbeacon.pro\nWhatsApp: +91-70566-33633\nAddress: MarketBeacon Technologies, India`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEO title="Privacy Policy" description="MarketBeacon Pro privacy policy and terms of use for our stock research platform." url="/privacy-policy" />
      {/* Nav */}
      <nav className="border-b border-slate-800/60 px-6 md:px-10 py-5 flex items-center justify-between bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </nav>

      {/* Header */}
      <header className="py-16 px-6 md:px-10 max-w-[800px] mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.3em]">Educational Tool · Not Investment Advice</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] mb-4">Privacy Policy</h1>
        <p className="text-slate-500 text-sm">Effective Date: June 06, 2026 · MarketBeacon Technologies</p>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-xl">
          We believe in full transparency. This policy explains exactly what data we collect, how we use it, and your rights — in plain language.
        </p>
      </header>

      {/* Content */}
      <main className="px-6 md:px-10 max-w-[800px] mx-auto pb-20">
        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 tracking-tight">{s.title}</h2>
              <div className="space-y-2">
                {s.body.split('\n').map((line, j) => (
                  <p key={j} className={`text-sm leading-relaxed ${line.startsWith('•') ? 'text-[var(--text-secondary)] pl-4' : 'text-slate-500'}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SEBI Disclaimer Box */}
        <div className="mt-10 bg-amber-500/5 border border-amber-500/20 rounded-[1.5rem] p-8">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-[0.3em] mb-3">Important Regulatory Disclaimer</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            MarketBeacon Pro is a quantitative research tool. All information provided is for educational and informational purposes only. It does not constitute investment advice, solicitation, or recommendation. Investing in securities involves risk. Past performance is not indicative of future results. Always consult a SEBI-registered advisor before making investment decisions.
          </p>
        </div>
      </main>

      {/* Footer link */}
      <div className="border-t border-slate-800 py-8 text-center">
<Link to="/" className="text-xs font-bold text-slate-500 hover:text-blue-400 uppercase tracking-wider transition-colors">
            ← Back to MarketBeacon Pro
          </Link>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
