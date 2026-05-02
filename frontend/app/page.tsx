'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, ChevronRight, CreditCard,
  FileText, RefreshCw, Shield, Zap, Bell, Search, TrendingUp,
  Users, Menu, X, Star, ArrowUpRight,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';

/* ─── Nav ─────────────────────────────────────────────────────────────────── */
function Navbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080d14]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex-shrink-0 shadow-lg shadow-black/30">
            <Image src="/logo.png" alt="DebtRecovery" width={36} height={36} className="w-full h-full object-cover object-top rounded-lg" />
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">DebtRecovery</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400 font-medium">
          {[
              { label: t.landing.nav.features, href: '#features' },
              { label: t.landing.nav.howItWorks, href: '#how-it-works' },
              { label: t.landing.nav.benefits, href: '#benefits' },
              { label: t.landing.nav.pricing, href: '#pricing' },
            ].map(({ label, href }) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.15] overflow-hidden text-xs font-bold">
            <button onClick={() => setLang('ro')} className={`px-2.5 py-1.5 transition-colors ${lang === 'ro' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>RO</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>EN</button>
          </div>
          <Link href="/auth/login" className="text-sm text-slate-400 hover:text-white font-medium transition-colors px-3 py-1.5">{t.landing.nav.signIn}</Link>
          <Link href="/auth/register"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-blue-500/25">
            {t.landing.nav.getStarted} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#080d14] border-t border-white/[0.06]">
          {/* Nav links */}
          <div className="px-4 py-2">
            {[
              { label: t.landing.nav.features, href: '#features' },
              { label: t.landing.nav.howItWorks, href: '#how-it-works' },
              { label: t.landing.nav.benefits, href: '#benefits' },
              { label: t.landing.nav.pricing, href: '#pricing' },
            ].map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-3.5 text-sm font-medium text-slate-300 hover:text-white border-b border-white/[0.04] last:border-0 transition-colors">
                {label}
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
            ))}
          </div>

          {/* Bottom actions */}
          <div className="px-4 pb-6 pt-2 space-y-3 border-t border-white/[0.06]">
            {/* Language toggle */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Language</span>
              <div className="relative flex items-center bg-white/[0.06] border border-white/[0.1] rounded-full" style={{ width: 76, padding: 3 }}>
                <span className="absolute rounded-full bg-blue-600 transition-transform duration-300 ease-in-out"
                  style={{ width: 35, top: 3, bottom: 3, left: 3, transform: lang === 'en' ? 'translateX(35px)' : 'translateX(0)' }} />
                <button onClick={() => setLang('ro')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'ro' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>RO</button>
                <button onClick={() => setLang('en')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'en' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>EN</button>
              </div>
            </div>

            <Link href="/auth/login" onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-3 rounded-xl border border-white/[0.1] text-sm font-semibold text-slate-300 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all">
              {t.landing.nav.signIn}
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-500/20">
              {t.landing.pricing.getStarted} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Feature card ─────────────────────────────────────────────────────────── */
function FeatureCard({ icon: Icon, color, title, desc }: {
  icon: React.ElementType; color: string; title: string; desc: string;
}) {
  return (
    <div className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.055] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1">
      <div className={`inline-flex p-2.5 rounded-xl ${color} mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold text-white text-[15px] mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      <div className="mt-4 flex items-center gap-1 text-xs text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Learn more <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}

/* ─── Stat ─────────────────────────────────────────────────────────────────── */
function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="text-center px-6 py-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <p className={`text-4xl font-bold tracking-tight ${color}`}>{value}</p>
      <p className="text-sm text-slate-500 mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ─── Step ─────────────────────────────────────────────────────────────────── */
function Step({ n, title, desc, icon: Icon }: { n: number; title: string; desc: string; icon: React.ElementType }) {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
          {n}
        </div>
        {n < 4 && <div className="flex-1 w-px bg-gradient-to-b from-blue-600/40 to-transparent mt-2 min-h-[40px]" />}
      </div>
      <div className="pt-1.5 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4 text-blue-400" />
          <h3 className="font-semibold text-white text-[15px]">{title}</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Mock Dashboard Widget ────────────────────────────────────────────────── */
function MockDashboard() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Glow */}
      <div className="absolute -inset-8 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -inset-4 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0d1829]/90 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" /></div>
          <div className="flex-1 mx-4 h-5 bg-white/[0.04] rounded-md flex items-center px-2">
            <span className="text-[10px] text-slate-600">app.debtrecovery.ro/dashboard</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Invoiced', value: '€847K', color: 'text-blue-400', bg: 'from-blue-500 to-blue-700' },
              { label: 'Collected', value: '€612K', color: 'text-emerald-400', bg: 'from-emerald-500 to-teal-600' },
              { label: 'Outstanding', value: '€235K', color: 'text-amber-400', bg: 'from-amber-500 to-orange-500' },
              { label: 'Overdue', value: '12', color: 'text-red-400', bg: 'from-red-500 to-rose-600' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold">{label}</p>
                <p className={`text-lg font-bold mt-1.5 ${color}`}>{value}</p>
                <div className={`mt-2 w-6 h-6 rounded-lg bg-gradient-to-br ${bg} opacity-80 flex items-center justify-center`}>
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
              </div>
            ))}
          </div>

          {/* Chart + side */}
          <div className="grid grid-cols-3 gap-3">
            {/* Chart mockup */}
            <div className="col-span-2 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-3">Cash Flow Forecast</p>
              <div className="flex items-end gap-1 h-16">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${h}%`,
                    background: i === 11 ? 'linear-gradient(to top, #3b82f6, #60a5fa)' : 'rgba(59,130,246,0.2)'
                  }} />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['Jan', 'Apr', 'Jul', 'Oct', 'Now'].map((m) => (
                  <span key={m} className="text-[8px] text-slate-700">{m}</span>
                ))}
              </div>
            </div>

            {/* Risk donut */}
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <p className="text-[9px] text-slate-600 uppercase tracking-widest font-bold mb-3">Risk Analysis</p>
              <div className="flex flex-col gap-1.5 mt-1">
                {[
                  { label: 'Low Risk', pct: 60, color: 'bg-emerald-500' },
                  { label: 'Medium', pct: 30, color: 'bg-amber-400' },
                  { label: 'High Risk', pct: 10, color: 'bg-red-500' },
                ].map(({ label, pct, color }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px] text-slate-500">{label}</span>
                      <span className="text-[8px] text-slate-400 font-bold">{pct}%</span>
                    </div>
                    <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Invoice table mockup */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05]">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Recent Invoices</p>
              <span className="text-[8px] text-blue-400 font-medium">View all →</span>
            </div>
            {[
              { client: 'DEDEMAN S.R.L.', inv: 'INV-2024-001', amount: '€24,500', status: 'PAID', color: 'text-emerald-400 bg-emerald-500/10' },
              { client: 'eMAG S.R.L.', inv: 'INV-2024-002', amount: '€18,200', status: 'OPEN', color: 'text-amber-400 bg-amber-500/10' },
              { client: 'Orange Romania', inv: 'INV-2024-003', amount: '€9,800', status: 'OVERDUE', color: 'text-red-400 bg-red-500/10' },
            ].map(({ client, inv, amount, status, color }) => (
              <div key={inv} className="flex items-center justify-between px-3 py-2 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">{client[0]}</span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-300 font-semibold">{client}</p>
                    <p className="text-[8px] text-slate-600 font-mono">{inv}</p>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-300">{amount}</p>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI card */}
      <div className="absolute -right-6 top-24 w-44 rounded-xl bg-[#0d1829] border border-white/[0.1] p-3 shadow-2xl hidden lg:block">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">AI Score</span>
        </div>
        <p className="text-[9px] text-slate-500 mb-2">eMAG S.R.L. · Updated now</p>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
          </div>
          <span className="text-[10px] font-bold text-emerald-400">82</span>
        </div>
        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">LOW RISK</span>
      </div>

      {/* Floating notification */}
      <div className="absolute -left-6 bottom-20 w-48 rounded-xl bg-[#0d1829] border border-white/[0.1] p-3 shadow-2xl hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">Reminder Sent</p>
            <p className="text-[9px] text-slate-500">DACIA S.A. · Due in 3 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pricing card ─────────────────────────────────────────────────────────── */
function PricingCard({ plan, price, features, highlighted }: {
  plan: string; price: string; features: string[]; highlighted?: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 ${
      highlighted
        ? 'bg-blue-600 border border-blue-400/30 shadow-2xl shadow-blue-500/20'
        : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.055]'
    }`}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-[#080d14] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {t.landing.pricing.mostPopular}
        </div>
      )}
      <div>
        <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${highlighted ? 'text-blue-200' : 'text-slate-500'}`}>{plan}</p>
        <div className="flex items-end gap-1">
          <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-slate-100'}`}>{price}</span>
          {price !== 'Free' && price !== 'Custom' && <span className={`text-sm mb-1 ${highlighted ? 'text-blue-200' : 'text-slate-500'}`}>{t.landing.pricing.perMonth}</span>}
        </div>
      </div>
      <ul className="space-y-2.5 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${highlighted ? 'text-blue-200' : 'text-emerald-400'}`} />
            <span className={highlighted ? 'text-blue-100' : 'text-slate-400'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth/register"
        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
          highlighted
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
        }`}>
        {t.landing.pricing.getStarted} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (authService.isLoggedIn()) { router.replace('/dashboard'); return; }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080d14] text-white overflow-x-hidden">
      <Navbar scrolled={scrolled} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-5 sm:px-8 overflow-hidden">
        {/* Background glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-indigo-600/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-blue-400/6 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold px-4 py-2 rounded-full">
              <Zap className="w-3.5 h-3.5" /> {t.landing.hero.badge}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08] mb-6">
            <span className="text-white">{t.landing.hero.headline1}</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
              {t.landing.hero.headline2}
            </span>
          </h1>

          <p className="text-center text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.landing.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link href="/auth/register"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5">
              {t.landing.hero.startFree} <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/auth/login"
              className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-slate-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all duration-200">
              {t.landing.hero.signIn} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-16">
            {[t.landing.hero.noCard, t.landing.hero.anafIntegrated, t.landing.hero.gdpr, t.landing.hero.support].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-slate-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {/* Dashboard mockup */}
          <MockDashboard />
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.features.sectionLabel}</p>
            <h2 className="text-4xl font-bold text-white mb-4">{t.landing.features.title}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.landing.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Brain,     color: 'bg-gradient-to-br from-purple-500 to-violet-700' },
              { icon: FileText,  color: 'bg-gradient-to-br from-blue-500 to-blue-700' },
              { icon: CreditCard,color: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
              { icon: Search,    color: 'bg-gradient-to-br from-amber-500 to-orange-500' },
              { icon: Bell,      color: 'bg-gradient-to-br from-rose-500 to-pink-600' },
              { icon: Shield,    color: 'bg-gradient-to-br from-slate-500 to-slate-700' },
              { icon: RefreshCw, color: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
              { icon: BarChart3, color: 'bg-gradient-to-br from-indigo-500 to-blue-700' },
              { icon: Users,     color: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
            ].map(({ icon, color }, i) => (
              <FeatureCard key={i} icon={icon} color={color}
                title={t.landing.features.cards[i].title}
                desc={t.landing.features.cards[i].desc} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 sm:px-8 border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat value="3×" label={t.landing.stats.fasterRecovery} color="text-blue-400" />
            <Stat value="98%" label={t.landing.stats.invoiceAccuracy} color="text-emerald-400" />
            <Stat value="€0" label={t.landing.stats.setupCost} color="text-amber-400" />
            <Stat value="100%" label={t.landing.stats.anafCompliant} color="text-violet-400" />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.howItWorks.sectionLabel}</p>
              <h2 className="text-4xl font-bold text-white mb-4">{t.landing.howItWorks.title}</h2>
              <p className="text-slate-500 mb-12 leading-relaxed">{t.landing.howItWorks.subtitle}</p>
              <div className="space-y-0">
                <Step n={1} icon={Users} title={t.landing.howItWorks.step1Title}
                  desc={t.landing.howItWorks.step1Desc} />
                <Step n={2} icon={FileText} title={t.landing.howItWorks.step2Title}
                  desc={t.landing.howItWorks.step2Desc} />
                <Step n={3} icon={Brain} title={t.landing.howItWorks.step3Title}
                  desc={t.landing.howItWorks.step3Desc} />
                <Step n={4} icon={Bell} title={t.landing.howItWorks.step4Title}
                  desc={t.landing.howItWorks.step4Desc} />
              </div>
            </div>

            {/* Right side visual */}
            <div className="relative">
              <div className="absolute -inset-8 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                {/* AI Score panel mockup */}
                <div className="p-6 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
                      <Brain className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">AI Risk Analysis</p>
                      <p className="text-xs text-slate-500">Updated moments ago</p>
                    </div>
                  </div>
                  {[
                    { name: 'DEDEMAN S.R.L.', score: 92, risk: 'LOW', color: 'bg-emerald-500', textColor: 'text-emerald-400', badge: 'text-emerald-400 bg-emerald-500/10' },
                    { name: 'eMAG S.R.L.', score: 78, risk: 'LOW', color: 'bg-emerald-500', textColor: 'text-emerald-400', badge: 'text-emerald-400 bg-emerald-500/10' },
                    { name: 'Orange Romania', score: 55, risk: 'MEDIUM', color: 'bg-amber-400', textColor: 'text-amber-400', badge: 'text-amber-400 bg-amber-500/10' },
                    { name: 'Firma Mică S.R.L.', score: 22, risk: 'HIGH', color: 'bg-red-500', textColor: 'text-red-400', badge: 'text-red-400 bg-red-500/10' },
                  ].map(({ name, score, risk, color, textColor, badge }) => (
                    <div key={name} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">{name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-300 truncate">{name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold tabular-nums ${textColor}`}>{score}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${badge}`}>{risk}</span>
                    </div>
                  ))}
                </div>

                {/* Reminder panel */}
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</p>
                  <div className="space-y-3">
                    {[
                      { icon: Bell, color: 'bg-amber-500/20 text-amber-400', text: 'Reminder sent to Firma Mică S.R.L.', time: '2 min ago' },
                      { icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-400', text: 'Payment received — DEDEMAN S.R.L.', time: '1 hour ago' },
                      { icon: FileText, color: 'bg-blue-500/20 text-blue-400', text: 'Invoice INV-2024-031 created', time: '3 hours ago' },
                    ].map(({ icon: Icon, color, text, time }) => (
                      <div key={text} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-300">{text}</p>
                          <p className="text-[10px] text-slate-600 mt-0.5">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────────── */}
      <section id="benefits" className="py-24 px-5 sm:px-8 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.benefits.sectionLabel}</p>
            <h2 className="text-4xl font-bold text-white mb-4">{t.landing.benefits.title}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.landing.benefits.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: TrendingUp, gradient: 'from-blue-500 to-blue-700', glow: 'shadow-blue-500/20',
                title: 'Reduce DSO by up to 40%',
                desc: 'Automated reminders and AI prioritization help your team focus on the highest-risk accounts first, dramatically reducing days sales outstanding.',
              },
              {
                icon: Zap, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/20',
                title: 'Save 10+ hours per week',
                desc: 'Eliminate manual invoice creation, payment tracking spreadsheets, and reminder emails. Automation handles the repetitive work for you.',
              },
              {
                icon: Shield, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20',
                title: 'Stay legally compliant',
                desc: 'Generate somații (payment notices) that meet Romanian legal requirements, with proper diacritics and formatting for court admissibility.',
              },
              {
                icon: Brain, gradient: 'from-purple-500 to-violet-700', glow: 'shadow-purple-500/20',
                title: 'Predict payment problems early',
                desc: 'AI scoring flags high-risk clients before they become bad debts, giving your team time to act proactively rather than reactively.',
              },
              {
                icon: BarChart3, gradient: 'from-indigo-500 to-blue-600', glow: 'shadow-indigo-500/20',
                title: 'Complete financial visibility',
                desc: 'Real-time cash flow forecasting, aging analysis, and collection ratios give management an instant snapshot of financial health.',
              },
              {
                icon: RefreshCw, gradient: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/20',
                title: 'Scale without extra headcount',
                desc: 'Whether you manage 10 or 1,000 invoices, the platform scales seamlessly. No additional staff needed as your portfolio grows.',
              },
            ].map(({ icon: Icon, gradient, glow, title, desc }) => (
              <div key={title} className={`group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:bg-white/[0.055] hover:border-white/[0.12] transition-all duration-300 hover:-translate-y-1 shadow-lg ${glow}`}>
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-[15px] mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.pricing.sectionLabel}</p>
            <h2 className="text-4xl font-bold text-white mb-4">{t.landing.pricing.title}</h2>
            <p className="text-slate-500 text-lg max-w-lg mx-auto">{t.landing.pricing.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <PricingCard plan="Starter" price="Free"
              features={['Up to 10 clients', '20 invoices/month', 'Basic payment tracking', 'ANAF lookup', 'PDF export']} />
            <PricingCard plan="Professional" price="€49" highlighted
              features={['Unlimited clients', 'Unlimited invoices', 'AI risk scoring', 'Automated reminders', 'Recurring invoices', 'Priority support']} />
            <PricingCard plan="Enterprise" price="Custom"
              features={['Multi-company', 'API access', 'Custom integrations', 'Dedicated onboarding', 'SLA guarantee', 'White-label option']} />
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute -inset-16 bg-blue-600/8 blur-3xl rounded-full pointer-events-none" />
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 p-12 shadow-2xl">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-2xl shadow-black/40 ring-1 ring-white/20">
                <Image src="/logo.png" alt="DebtRecovery" width={64} height={64} className="w-full h-full object-cover object-top rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
              <span className="ml-2 text-sm text-slate-400 font-medium">{t.landing.cta.trustedBy}</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">{t.landing.cta.title}</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              {t.landing.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/auth/register"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-blue-500/25 hover:-translate-y-0.5 text-base">
                {t.landing.cta.createAccount} <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/login"
                className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-slate-300 hover:text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base">
                {t.landing.cta.signIn}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex-shrink-0 shadow-md shadow-black/30">
                <Image src="/logo.png" alt="DebtRecovery" width={32} height={32} className="w-full h-full object-cover object-top rounded-md" />
              </div>
              <span className="font-bold text-white">DebtRecovery</span>
              <span className="text-slate-600 text-sm ml-1">· {t.landing.footer.tagline}</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {[t.landing.footer.features, t.landing.footer.pricing, t.landing.footer.privacy, t.landing.footer.terms].map((l) => (
                <a key={l} href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">{l}</a>
              ))}
            </div>
            <p className="text-sm text-slate-600">{t.landing.footer.rights}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
