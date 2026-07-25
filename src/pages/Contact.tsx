import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle, Phone } from 'lucide-react';
import BrandLogo from '../components/brand/BrandLogo';
import SEO from '../components/SEO';
import { getApiUrl } from '../lib/api-utils';

const API_URL = getApiUrl();

const ContactPage: React.FC = () => {
  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please email us directly at support@marketbeacon.pro');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Message Sent!</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8">We'll get back to you within 24 hours.</p>
          <Link to="/" className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans">
      <SEO title="Contact Us" description="Get in touch with MarketBeacon Pro. Support, partnership inquiries, and feedback." />
      <nav className="border-b border-[var(--border-primary)]/60 px-6 md:px-10 py-5 flex items-center justify-between bg-[var(--bg-primary)]/80 sticky top-0 z-50 backdrop-blur-md">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <BrandLogo variant="dark" size={28} />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3 h-3" /> Back to Home
        </Link>
      </nav>

      <header className="py-16 px-6 md:px-10 max-w-[800px] mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
          <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-[0.3em]">Get In Touch</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-[var(--text-primary)] mb-4">Contact Us</h2>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xl mx-auto">
          Have a question, feedback, or partnership inquiry? We'd love to hear from you.
        </p>
      </header>

      <main className="px-6 md:px-10 max-w-[800px] mx-auto pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-6">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Email</p>
                    <a href="mailto:support@marketbeacon.pro" className="text-sm text-[var(--text-primary)] hover:text-blue-400 transition-colors">support@marketbeacon.pro</a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <Phone className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">WhatsApp</p>
                    <a href="https://wa.me/919251180183" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--text-primary)] hover:text-emerald-400 transition-colors">+91-92511-80183</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-6">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Response Time</h2>
              <p className="text-sm text-[var(--text-secondary)]">We typically respond within <strong className="text-[var(--text-primary)]">24 hours</strong> on business days.</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">For urgent issues, reach us on WhatsApp for fastest resolution.</p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-6">
              <h2 className="text-sm font-bold text-white mb-3">MarketBeacon Technologies</h2>
              <p className="text-sm text-[var(--text-secondary)]">India</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[1.5rem] p-8">
            <h2 className="text-sm font-bold text-white mb-6">Send a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-caption text-[var(--text-muted)] uppercase tracking-wider mb-2">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-caption text-[var(--text-muted)] uppercase tracking-wider mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-caption text-[var(--text-muted)] uppercase tracking-wider mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-caption text-[var(--text-muted)] uppercase tracking-wider mb-2">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Tell us more..."
                  required
                />
              </div>
              {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              >
                <Send className="h-3.5 w-3.5" />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
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

export default ContactPage;
