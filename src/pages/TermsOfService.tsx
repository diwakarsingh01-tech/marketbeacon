import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SEO from '../components/SEO';

const TermsOfServicePage: React.FC = () => {
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const sections = [
    {
      title: '1. Acceptance of Terms',
      body: `By accessing or using MarketBeacon Pro ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.\n\nWe reserve the right to update these terms at any time. Continued use after changes constitutes acceptance.`
    },
    {
      title: '2. Service Description',
      body: `MarketBeacon Pro provides quantitative research tools, mathematical models, and ABCD Tranche analysis based on publicly available market data. The Platform is strictly an educational and informational research tool.\n\nWe explicitly and categorically do NOT provide:\n• Personalized investment advice\n• Buy/sell recommendations\n• Portfolio management services\n• SEBI-registered advisory services`
    },
    {
      title: '3. Eligibility',
      body: `You must be at least 18 years old to use the Platform.\n\nBy registering, you represent that:\n• You are of legal age\n• All information provided is accurate\n• You are not a resident of jurisdictions where using the Platform is prohibited\n• You understand the risks of securities trading`
    },
    {
      title: '4. Account Registration & Security',
      body: `You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at support@marketbeacon.pro of any unauthorized use.\n\nWe reserve the right to suspend or terminate accounts that:\n• Violate these terms\n• Engage in abusive or fraudulent activity\n• Attempt to reverse-engineer our algorithms\n• Use automated bots or scrapers without written permission`
    },
    {
      title: '5. Subscriptions & Payments',
      body: `Paid plans are billed monthly or annually as selected. All fees are non-refundable except as required by applicable law.\n\nWe use third-party payment processors. We do not store credit card details.\n\nLicense tiers:\n• Free: Limited daily scans, basic scores\n• Pro: Unlimited scans, alerts, detailed analysis\n• Enterprise: API access, bulk data, priority support\n\nTrial periods: Terms apply at signup. Cancellation before trial end avoids charges.`
    },
    {
      title: '6. Intellectual Property',
      body: `All content, algorithms, audit scores, ABCD Tranche logic, and platform code are the exclusive property of MarketBeacon Technologies.\n\nYou may not:\n• Copy, modify, or distribute platform content without permission\n• Use our data to train competing AI/ML models\n• Resell access to the Platform\n• Remove copyright or proprietary notices`
    },
    {
      title: '7. Prohibited Conduct',
      body: `You agree NOT to:\n• Use the Platform for illegal purposes\n• Attempt to disrupt or overload our servers\n• Scrape or extract data beyond normal usage\n• Impersonate others or provide false information\n• Use the Platform in violation of SEBI or local securities laws\n• Share account access across multiple users (each user requires their own license)`
    },
    {
      title: '8. Disclaimer of Warranties',
      body: `THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.\n\nWe do not guarantee:\n• Accuracy, completeness, or timeliness of data\n• Uninterrupted or error-free operation\n• That results will meet your investment objectives\n\nMarket data may be delayed. All trading decisions are your sole responsibility.`
    },
    {
      title: '9. Limitation of Liability',
      body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, MarketBeacon Technologies SHALL NOT BE LIABLE FOR:\n• Any investment losses or trading losses\n• Indirect, incidental, or consequential damages\n• Loss of profits, data, or business opportunity\n\nOur total liability shall not exceed the amount paid by you in the 12 months preceding the claim.`
    },
    {
      title: '10. Indemnification',
      body: `You agree to indemnify and hold MarketBeacon Technologies harmless from any claims, damages, or expenses arising from:\n• Your use of the Platform\n• Your violation of these terms\n• Your violation of any law or third-party rights`
    },
    {
      title: '11. Termination',
      body: `We may terminate or suspend your access immediately, without prior notice, for any violation of these terms.\n\nUpon termination:\n• Your right to use the Platform ceases immediately\n• We may delete your data within 30 days\n• Sections 6, 8, 9, 10, and 13 survive termination`
    },
    {
      title: '12. Governing Law',
      body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.\n\nFor SEBI-related matters, we comply with all applicable SEBI regulations for research platforms and educational tools.`
    },
    {
      title: '13. Contact Information',
      body: `For questions about these terms:\n\nEmail: support@marketbeacon.pro\nWhatsApp: +91-70566-33633\nAddress: MarketBeacon Technologies, India`
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <SEO title="Terms of Service" description="MarketBeacon Pro terms of service. Understand your rights and obligations when using our stock research platform." />
      <nav className="border-b border-[var(--border-primary)]/60 px-6 md:px-10 py-5 flex items-center justify-between bg-[var(--bg-primary)]/80 sticky top-0 z-50 backdrop-blur-md">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </nav>

      <header className="py-16 px-6 md:px-10 max-w-[800px] mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <Scale className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.3em]">Legal Agreement</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-[var(--text-primary)] mb-4">Terms of Service</h1>
        <p className="text-[var(--text-muted)] text-sm">Effective Date: June 06, 2026 · MarketBeacon Technologies</p>
        <p className="text-[var(--text-muted)] text-sm mt-3 leading-relaxed max-w-xl">
          By using MarketBeacon Pro, you agree to these terms. Please read them carefully — they affect your legal rights.
        </p>
      </header>

      <main className="px-6 md:px-10 max-w-[800px] mx-auto pb-20">
        <div className="space-y-10">
          {sections.map((s, i) => (
            <div key={i} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
              <h2 className="text-base font-bold text-[var(--text-primary)] mb-4 tracking-tight">{s.title}</h2>
              <div className="space-y-2">
                {s.body.split('\n').map((line, j) => (
                  <p key={j} className={`text-sm leading-relaxed ${line.startsWith('•') ? 'text-[var(--text-secondary)] pl-4' : 'text-[var(--text-muted)]'}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem] p-8">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-[0.3em] mb-3">Questions?</h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Email: support@marketbeacon.pro · WhatsApp: +91-70566-33633
          </p>
        </div>
      </main>

      <div className="border-t border-[var(--border-primary)] py-8 text-center">
<Link to="/" className="text-xs font-bold text-[var(--text-muted)] hover:text-blue-400 uppercase tracking-wider transition-colors">
            ← Back to MarketBeacon Pro
          </Link>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
