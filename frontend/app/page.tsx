'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, CreditCard,
  FileText, RefreshCw, Shield, Zap, Bell, TrendingUp,
  Users, Menu, X, ChevronRight, FileCode, ArrowUpRight,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';

/* ─── Navbar ───────────────────────────────────────────────────────────────── */
function Navbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const links = [
    { label: t.landing.nav.features, href: '#features' },
    { label: t.landing.nav.howItWorks, href: '#how-it-works' },
    { label: t.landing.nav.pricing, href: '#pricing' },
  ];
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#070b12]/95 backdrop-blur-2xl border-b border-white/[0.05] shadow-2xl' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-white p-0.5 flex-shrink-0">
            <Image src="/logo.png" alt="DebtRecovery" width={32} height={32} className="w-full h-full object-cover object-top rounded-[9px]" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">DebtRecovery</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-slate-400 font-medium">
          {links.map(({ label, href }) => (
            <a key={label} href={href} className="hover:text-white transition-colors">{label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-white/[0.12] overflow-hidden text-xs font-bold mr-1">
            <button onClick={() => setLang('ro')} className={`px-2.5 py-1.5 transition-colors ${lang === 'ro' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>RO</button>
            <button onClick={() => setLang('en')} className={`px-2.5 py-1.5 transition-colors ${lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>EN</button>
          </div>
          <Link href="/auth/login" className="text-[13px] text-slate-400 hover:text-white font-medium px-3 py-1.5 transition-colors">{t.landing.nav.signIn}</Link>
          <Link href="/auth/register" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-colors">
            {t.landing.nav.getStarted} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-[#070b12]/98 backdrop-blur-2xl border-t border-white/[0.06]">
          <div className="px-5 py-3">
            {links.map(({ label, href }) => (
              <a key={label} href={href} onClick={() => setOpen(false)}
                className="flex items-center justify-between py-3.5 text-sm font-medium text-slate-300 hover:text-white border-b border-white/[0.04] last:border-0 transition-colors">
                {label} <ChevronRight className="w-4 h-4 text-slate-600" />
              </a>
            ))}
          </div>
          <div className="px-5 pb-6 pt-2 space-y-3 border-t border-white/[0.05]">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Language</span>
              <div className="relative flex items-center bg-white/[0.06] border border-white/[0.1] rounded-full" style={{ width: 76, padding: 3 }}>
                <span className="absolute rounded-full bg-blue-600 transition-transform duration-300 ease-in-out"
                  style={{ width: 35, top: 3, bottom: 3, left: 3, transform: lang === 'en' ? 'translateX(35px)' : 'translateX(0)' }} />
                <button onClick={() => setLang('ro')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'ro' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>RO</button>
                <button onClick={() => setLang('en')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'en' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>EN</button>
              </div>
            </div>
            <Link href="/auth/login" onClick={() => setOpen(false)}
              className="flex items-center justify-center w-full py-3 rounded-xl border border-white/[0.1] text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all">
              {t.landing.nav.signIn}
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
              {t.landing.nav.getStarted} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Mini dashboard mockup ────────────────────────────────────────────────── */
function DashboardPreview() {
  return (
    <div className="relative w-full">
      <div className="absolute -inset-6 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-2xl border border-white/[0.1] bg-[#0c1220]/90 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-white/[0.04]">
        {/* Browser bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.02] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded bg-white/[0.04] flex items-center px-2.5">
            <span className="text-[10px] text-slate-600">app.debtrecovery.ro/dashboard</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Invoiced', value: '€847K', color: 'text-blue-400', bar: 'bg-blue-500' },
              { label: 'Collected', value: '€612K', color: 'text-emerald-400', bar: 'bg-emerald-500' },
              { label: 'Outstanding', value: '€235K', color: 'text-amber-400', bar: 'bg-amber-400' },
              { label: 'Overdue', value: '12', color: 'text-red-400', bar: 'bg-red-500' },
            ].map(({ label, value, color, bar }) => (
              <div key={label} className="rounded-xl bg-white/[0.03] border border-white/[0.05] p-3">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-1.5">{label}</p>
                <p className={`text-base font-bold ${color}`}>{value}</p>
                <div className={`mt-2 h-0.5 ${bar} rounded-full opacity-40`} />
              </div>
            ))}
          </div>

          {/* Chart + invoices */}
          <div className="grid grid-cols-5 gap-2">
            <div className="col-span-3 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">Cash Flow</p>
              <div className="flex items-end gap-0.5 h-14">
                {[35, 55, 40, 70, 50, 80, 60, 75, 55, 90, 70, 88].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm transition-all"
                    style={{ height: `${h}%`, background: i >= 10 ? 'linear-gradient(to top,#3b82f6,#60a5fa)' : 'rgba(59,130,246,0.15)' }} />
                ))}
              </div>
            </div>
            <div className="col-span-2 rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-2.5">Recent</p>
              <div className="space-y-2">
                {[
                  { name: 'DEDEMAN', status: 'PAID', color: 'text-emerald-400 bg-emerald-500/10' },
                  { name: 'eMAG', status: 'OPEN', color: 'text-amber-400 bg-amber-500/10' },
                  { name: 'Orange', status: 'OVERDUE', color: 'text-red-400 bg-red-500/10' },
                ].map(({ name, status, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-medium">{name}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${color}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI card */}
      <div className="absolute -right-4 top-16 w-36 rounded-xl bg-[#0c1220] border border-white/[0.1] p-3 shadow-2xl hidden xl:block ring-1 ring-white/[0.04]">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">AI Score</span>
        </div>
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-[82%]" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400">82</span>
        </div>
        <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">LOW RISK</span>
      </div>

      {/* Floating alert */}
      <div className="absolute -left-4 bottom-12 w-40 rounded-xl bg-[#0c1220] border border-white/[0.1] p-3 shadow-2xl hidden xl:block ring-1 ring-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
            <Bell className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">Reminder sent</p>
            <p className="text-[9px] text-slate-500">DACIA · 3 days left</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
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

  const features = [
    { icon: FileText,   color: 'from-blue-500 to-blue-700',      title: t.landing.features.cards[1].title, desc: t.landing.features.cards[1].desc },
    { icon: CreditCard, color: 'from-emerald-500 to-teal-600',   title: t.landing.features.cards[2].title, desc: t.landing.features.cards[2].desc },
    { icon: Brain,      color: 'from-purple-500 to-violet-700',  title: t.landing.features.cards[0].title, desc: t.landing.features.cards[0].desc },
    { icon: Bell,       color: 'from-rose-500 to-pink-600',      title: t.landing.features.cards[4].title, desc: t.landing.features.cards[4].desc },
    { icon: FileCode,   color: 'from-cyan-500 to-blue-600',      title: t.landing.features.cards[6].title, desc: t.landing.features.cards[6].desc },
    { icon: BarChart3,  color: 'from-indigo-500 to-blue-700',    title: t.landing.features.cards[7].title, desc: t.landing.features.cards[7].desc },
  ];

  const steps = [
    { icon: Users,     title: t.landing.howItWorks.step1Title, desc: t.landing.howItWorks.step1Desc },
    { icon: FileText,  title: t.landing.howItWorks.step2Title, desc: t.landing.howItWorks.step2Desc },
    { icon: Brain,     title: t.landing.howItWorks.step3Title, desc: t.landing.howItWorks.step3Desc },
    { icon: Bell,      title: t.landing.howItWorks.step4Title, desc: t.landing.howItWorks.step4Desc },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-white overflow-x-hidden">
      <Navbar scrolled={scrolled} />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16 pb-16 px-5 sm:px-8 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/8 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-indigo-600/6 blur-[100px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-blue-400/5 blur-[80px] rounded-full" />
          {/* Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070b12]" />
        </div>

        <div className="relative max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6">
                <Zap className="w-3 h-3" /> {t.landing.hero.badge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight leading-[1.1] mb-5">
                <span className="text-white">{t.landing.hero.headline1}</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                  {t.landing.hero.headline2}
                </span>
              </h1>

              <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-lg">
                {t.landing.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/auth/register"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5">
                  {t.landing.hero.startFree} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login"
                  className="flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-slate-300 hover:text-white font-semibold px-6 py-3.5 rounded-xl transition-all">
                  {t.landing.hero.signIn} <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {[t.landing.hero.noCard, t.landing.hero.anafIntegrated, t.landing.hero.gdpr].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard */}
            <div className="order-1 lg:order-2">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAND ───────────────────────────────────────────────────────── */}
      <section className="py-14 px-5 sm:px-8 border-y border-white/[0.05] bg-white/[0.01]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.05] rounded-2xl overflow-hidden">
          {[
            { value: '3×',   label: t.landing.stats.fasterRecovery, color: 'text-blue-400' },
            { value: '98%',  label: t.landing.stats.invoiceAccuracy, color: 'text-emerald-400' },
            { value: '€0',   label: t.landing.stats.setupCost, color: 'text-amber-400' },
            { value: '100%', label: t.landing.stats.anafCompliant, color: 'text-violet-400' },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-[#070b12] px-6 py-8 text-center">
              <p className={`text-3xl sm:text-4xl font-bold tracking-tight mb-1.5 ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 font-medium leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.features.sectionLabel}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.landing.features.title}</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">{t.landing.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="group rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 hover:bg-white/[0.045] hover:border-white/[0.1] transition-all duration-300 hover:-translate-y-0.5">
                <div className={`inline-flex p-2.5 rounded-xl bg-gradient-to-br ${color} mb-5 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-[15px] mb-2 leading-snug">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 sm:px-8 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.howItWorks.sectionLabel}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.landing.howItWorks.title}</h2>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">{t.landing.howItWorks.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(50%+28px)] right-[-50%] h-px bg-gradient-to-r from-blue-500/40 to-transparent" />
                )}
                <div className="relative rounded-2xl bg-white/[0.025] border border-white/[0.06] p-6 hover:bg-white/[0.04] transition-all text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2">{title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ─────────────────────────────────────────────────────────── */}
      <section id="benefits" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.benefits.sectionLabel}</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-5">{t.landing.benefits.title}</h2>
              <p className="text-slate-500 leading-relaxed mb-8">{t.landing.benefits.subtitle}</p>

              <div className="space-y-4">
                {[
                  { icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10',    title: 'Reduce DSO by up to 40%',     desc: 'AI prioritization helps your team focus on the highest-risk accounts first.' },
                  { icon: Zap,        color: 'text-amber-400 bg-amber-500/10',  title: 'Save 10+ hours per week',     desc: 'Automation handles invoice creation, payment tracking, and reminders.' },
                  { icon: Shield,     color: 'text-emerald-400 bg-emerald-500/10', title: 'Stay legally compliant',   desc: 'Somații that meet Romanian legal requirements, court-admissible PDFs.' },
                  { icon: RefreshCw,  color: 'text-violet-400 bg-violet-500/10',title: 'Scale without extra headcount', desc: 'From 10 to 1,000 invoices — the platform scales seamlessly.' },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-all">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white mb-1">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — AI panel */}
            <div className="relative">
              <div className="absolute -inset-6 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-2xl bg-[#0c1220]/80 border border-white/[0.08] overflow-hidden shadow-2xl ring-1 ring-white/[0.04]">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">AI Risk Analysis</p>
                    <p className="text-xs text-slate-500">Live · Updated just now</p>
                  </div>
                  <span className="ml-auto text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">ACTIVE</span>
                </div>

                <div className="p-5 space-y-3">
                  {[
                    { name: 'DEDEMAN S.R.L.',   score: 92, risk: 'LOW',    color: 'bg-emerald-500', tc: 'text-emerald-400', bc: 'bg-emerald-500/10 text-emerald-400' },
                    { name: 'eMAG S.R.L.',      score: 78, risk: 'LOW',    color: 'bg-emerald-500', tc: 'text-emerald-400', bc: 'bg-emerald-500/10 text-emerald-400' },
                    { name: 'Orange Romania',   score: 55, risk: 'MEDIUM', color: 'bg-amber-400',   tc: 'text-amber-400',   bc: 'bg-amber-500/10 text-amber-400' },
                    { name: 'Firma Mică S.R.L.',score: 22, risk: 'HIGH',   color: 'bg-red-500',     tc: 'text-red-400',     bc: 'bg-red-500/10 text-red-400' },
                  ].map(({ name, score, risk, color, tc, bc }) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate mb-1.5">{name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
                          </div>
                          <span className={`text-[10px] font-bold tabular-nums ${tc}`}>{score}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${bc}`}>{risk}</span>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t border-white/[0.06] bg-white/[0.02]">
                  <div className="space-y-2.5">
                    {[
                      { icon: Bell,         color: 'bg-amber-500/15 text-amber-400',   text: 'Reminder sent → Firma Mică S.R.L.' },
                      { icon: CheckCircle2, color: 'bg-emerald-500/15 text-emerald-400', text: 'Payment received — DEDEMAN S.R.L.' },
                    ].map(({ icon: Icon, color, text }) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <p className="text-xs text-slate-400">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-5 sm:px-8 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3">{t.landing.pricing.sectionLabel}</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.landing.pricing.title}</h2>
            <p className="text-slate-500 max-w-md mx-auto">{t.landing.pricing.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {[
              {
                plan: 'Starter', price: 'Free', highlight: false,
                features: ['Up to 10 clients', '20 invoices/month', 'Basic payment tracking', 'ANAF lookup', 'PDF export'],
              },
              {
                plan: 'Professional', price: '€49', highlight: true,
                features: ['Unlimited clients', 'Unlimited invoices', 'AI risk scoring', 'Automated reminders', 'Recurring invoices', 'Priority support'],
              },
              {
                plan: 'Enterprise', price: 'Custom', highlight: false,
                features: ['Multi-company', 'API access', 'Custom integrations', 'Dedicated onboarding', 'SLA guarantee', 'White-label option'],
              },
            ].map(({ plan, price, highlight, features }) => (
              <div key={plan} className={`relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1 ${
                highlight ? 'bg-blue-600 border border-blue-400/30 shadow-2xl shadow-blue-500/20' : 'bg-white/[0.025] border border-white/[0.07] hover:bg-white/[0.04]'
              }`}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-400 text-[#070b12] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {t.landing.pricing.mostPopular}
                  </div>
                )}
                <div>
                  <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{plan}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${highlight ? 'text-white' : 'text-slate-100'}`}>{price}</span>
                    {price !== 'Free' && price !== 'Custom' && (
                      <span className={`text-sm mb-1.5 ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{t.landing.pricing.perMonth}</span>
                    )}
                  </div>
                </div>
                <ul className="space-y-2.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${highlight ? 'text-blue-200' : 'text-emerald-400'}`} />
                      <span className={highlight ? 'text-blue-100' : 'text-slate-400'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register"
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.1] border border-white/[0.08]'
                  }`}>
                  {t.landing.pricing.getStarted} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="relative rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.02] border border-white/[0.08] p-10 sm:p-14 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/5 pointer-events-none" />
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-2xl mx-auto mb-6">
                <Image src="/logo.png" alt="DebtRecovery" width={56} height={56} className="w-full h-full object-cover object-top rounded-xl" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.landing.cta.title}</h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8 max-w-md mx-auto">{t.landing.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/auth/register"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/25 hover:-translate-y-0.5 w-full sm:w-auto justify-center">
                  {t.landing.cta.createAccount} <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/auth/login"
                  className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] text-slate-300 hover:text-white font-semibold px-7 py-3.5 rounded-xl transition-all w-full sm:w-auto justify-center">
                  {t.landing.cta.signIn}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-10 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5">
              <Image src="/logo.png" alt="DebtRecovery" width={28} height={28} className="w-full h-full object-cover object-top rounded-md" />
            </div>
            <span className="font-bold text-white text-sm">DebtRecovery</span>
            <span className="text-slate-600 text-sm">· {t.landing.footer.tagline}</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {[t.landing.footer.features, t.landing.footer.pricing, t.landing.footer.privacy, t.landing.footer.terms].map((l) => (
              <a key={l} href="#" className="text-sm text-slate-600 hover:text-slate-300 transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-sm text-slate-600">{t.landing.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
