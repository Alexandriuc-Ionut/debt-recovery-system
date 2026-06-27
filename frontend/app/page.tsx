'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, BarChart3, Brain, CheckCircle2, CreditCard,
  FileText, RefreshCw, Shield, Zap, Bell, Search, TrendingUp,
  Users, Menu, X, ArrowUpRight, Lock, Globe, ChevronRight,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguagePicker from '@/components/ui/LanguagePicker';

/* ─── Navbar ───────────────────────────────────────────────────────────────── */
function Navbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  function smooth(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault();
    setOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const links = [
    { label: t.landing.nav.features, href: '#features' },
    { label: t.landing.nav.howItWorks, href: '#how-it-works' },
    { label: t.landing.nav.benefits, href: '#benefits' },
  ];

  return (
    <nav ref={ref} className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Image src="/logo.png" alt="FinTrace" width={32} height={32} className="w-full h-full object-cover object-top rounded-md" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight">FinTrace</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          {links.map(({ label, href }) => (
            <a key={href} href={href} onClick={(e) => smooth(e, href)} className="text-slate-600 hover:text-slate-900 transition-colors duration-200">{label}</a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <LanguagePicker light />
          <Link href="/auth/login" className="text-sm text-slate-700 hover:text-slate-900 font-semibold px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">{t.landing.nav.signIn}</Link>
          <Link href="/auth/register" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-500/25">
            {t.landing.nav.getStarted} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 shadow-lg">
          <div className="px-4 py-2">
            {links.map(({ label, href }) => (
              <a key={href} href={href} onClick={(e) => smooth(e, href)} className="flex items-center justify-between px-3 py-3.5 text-sm font-medium text-slate-700 hover:text-slate-900 border-b border-slate-100 last:border-0 transition-colors">
                {label} <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </div>
          <div className="px-4 pb-6 pt-3 space-y-3 border-t border-slate-100">
            <LanguagePicker fullWidth light />
            <Link href="/auth/login" onClick={() => setOpen(false)} className="flex items-center justify-center w-full py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all">
              {t.landing.nav.signIn}
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
              {t.landing.nav.getStarted} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Mock Dashboard ───────────────────────────────────────────────────────── */
function MockDashboard() {
  const { t } = useLanguage();
  const m = t.landing.mockDashboard;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute -inset-10 bg-blue-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#080f1e]/95 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#050b18] border-b border-white/[0.05]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex-1 mx-3 h-5 bg-white/[0.03] rounded flex items-center px-2 border border-white/[0.04]">
            <span className="text-[10px] text-slate-600">{m.url}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: m.invoiced, value: '€847K', c: 'text-blue-400', bar: 'from-blue-500 to-blue-600' },
              { label: m.collected, value: '€612K', c: 'text-emerald-400', bar: 'from-emerald-500 to-teal-500' },
              { label: m.outstanding, value: '€235K', c: 'text-amber-400', bar: 'from-amber-500 to-orange-400' },
              { label: m.overdue, value: '12', c: 'text-red-400', bar: 'from-red-500 to-rose-500' },
            ].map(({ label, value, c, bar }) => (
              <div key={label} className="rounded-xl bg-white/[0.025] border border-white/[0.04] p-3">
                <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-1.5">{label}</p>
                <p className={`text-base font-bold ${c}`}>{value}</p>
                <div className={`mt-2 h-0.5 w-full rounded-full bg-gradient-to-r ${bar} opacity-60`} />
              </div>
            ))}
          </div>

          {/* Chart + Risk */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">{m.cashFlowForecast}</p>
              <div className="flex items-end gap-0.5 h-14">
                {[35, 58, 42, 76, 52, 88, 65, 82, 55, 92, 70, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-[2px] transition-all" style={{
                    height: `${h}%`,
                    background: i >= 10 ? 'linear-gradient(to top, #3b82f6, #93c5fd)' : i >= 8 ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.12)'
                  }} />
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
              <p className="text-[8px] text-slate-600 uppercase tracking-widest font-bold mb-3">{m.aiRisk}</p>
              {[{ label: m.low, pct: 62, c: 'bg-emerald-500' }, { label: m.med, pct: 28, c: 'bg-amber-400' }, { label: m.high, pct: 10, c: 'bg-red-500' }].map(({ label, pct, c }) => (
                <div key={label} className="mb-2 last:mb-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-[8px] text-slate-500">{label}</span>
                    <span className="text-[8px] text-slate-400 font-bold">{pct}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full ${c} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice list */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <div className="flex justify-between px-3 py-2 border-b border-white/[0.04]">
              <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">{m.recentInvoices}</span>
              <span className="text-[8px] text-blue-400">{m.viewAll}</span>
            </div>
            {[
              { c: 'Modatex Fashion S.A.', n: 'INV-2024-041', a: '€24,500', s: m.statusPaid, sc: 'text-emerald-400 bg-emerald-500/10' },
              { c: 'Aura Wear Group', n: 'INV-2024-042', a: '€18,200', s: m.statusOpen, sc: 'text-amber-400 bg-amber-500/10' },
              { c: 'Romtex Distribution', n: 'INV-2024-043', a: '€9,800', s: m.statusOverdue, sc: 'text-red-400 bg-red-500/10' },
            ].map(({ c, n, a, s, sc }) => (
              <div key={n} className="flex items-center justify-between px-3 py-2 border-b border-white/[0.03] last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold">{c[0]}</span>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-300 font-semibold">{c}</p>
                    <p className="text-[7px] text-slate-600 font-mono">{n}</p>
                  </div>
                </div>
                <p className="text-[9px] font-bold text-slate-300">{a}</p>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full ${sc}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating AI card */}
      <div className="absolute -right-4 top-20 w-40 rounded-xl bg-[#080f1e] border border-white/[0.1] p-3 shadow-2xl hidden lg:block">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold text-white">{m.aiScore}</span>
        </div>
        <p className="text-[8px] text-slate-500 mb-1.5">{m.scoreUpdated}</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '89%' }} />
          </div>
          <span className="text-[9px] font-bold text-emerald-400">89</span>
        </div>
        <span className="mt-1.5 inline-block text-[7px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">{m.lowRisk}</span>
      </div>

      {/* Floating notification */}
      <div className="absolute -left-4 bottom-16 w-44 rounded-xl bg-[#080f1e] border border-white/[0.1] p-3 shadow-2xl hidden lg:block">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Bell className="w-3 h-3 text-white" />
          </div>
          <div>
            <p className="text-[9px] font-bold text-white">{m.reminderSent}</p>
            <p className="text-[8px] text-slate-500">{m.reminderDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (authService.isLoggedIn()) { router.replace('/dashboard'); return; }
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Navbar scrolled={scrolled} />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-16 px-5 sm:px-8 overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-white">
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.06)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] bg-indigo-300/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-cyan-300/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto w-full">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-500/30">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {t.landing.hero.badge}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl sm:text-6xl lg:text-[80px] font-black tracking-tight leading-[1.04] mb-6">
            <span className="text-slate-900">{t.landing.hero.headline1}</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              {t.landing.hero.headline2}
            </span>
          </h1>

          <p className="text-center text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t.landing.hero.subtitle}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
            <Link href="/auth/register" className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-0.5 text-[15px]">
              {t.landing.hero.startFree}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/login" className="flex items-center gap-2 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-[15px] shadow-sm">
              {t.landing.hero.signIn} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Trust pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-20">
            {[
              { icon: CheckCircle2, label: t.landing.hero.noCard, c: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { icon: Shield, label: t.landing.hero.gdpr, c: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
              { icon: Globe, label: t.landing.hero.anafIntegrated, c: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
            ].map(({ icon: Icon, label, c, bg }) => (
              <div key={label} className={`flex items-center gap-1.5 text-sm font-medium text-slate-700 ${bg} border px-3.5 py-1.5 rounded-full shadow-sm`}>
                <Icon className={`w-3.5 h-3.5 ${c}`} />
                {label}
              </div>
            ))}
          </div>

          <MockDashboard />
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-5 sm:px-8 border-y border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: '3×', label: t.landing.stats.fasterRecovery, c: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { value: '98%', label: t.landing.stats.invoiceAccuracy, c: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
              { value: '€0', label: t.landing.stats.setupCost, c: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              { value: '100%', label: t.landing.stats.anafCompliant, c: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
            ].map(({ value, label, c, bg, border }) => (
              <div key={label} className={`${bg} border ${border} rounded-2xl py-8 px-6 text-center shadow-sm`}>
                <p className={`text-4xl lg:text-5xl font-black tracking-tight mb-2 ${c}`}>{value}</p>
                <p className="text-sm text-slate-600 font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-5 sm:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-4">{t.landing.features.sectionLabel}</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-5 tracking-tight">{t.landing.features.title}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.landing.features.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Brain,      color: 'text-violet-600', bg: 'bg-violet-100', border: 'border-violet-200' },
              { icon: FileText,   color: 'text-blue-600',   bg: 'bg-blue-100',   border: 'border-blue-200' },
              { icon: CreditCard, color: 'text-emerald-600',bg: 'bg-emerald-100',border: 'border-emerald-200' },
              { icon: Search,     color: 'text-amber-600',  bg: 'bg-amber-100',  border: 'border-amber-200' },
              { icon: Bell,       color: 'text-rose-600',   bg: 'bg-rose-100',   border: 'border-rose-200' },
              { icon: Shield,     color: 'text-slate-600',  bg: 'bg-slate-200',  border: 'border-slate-300' },
              { icon: RefreshCw,  color: 'text-cyan-600',   bg: 'bg-cyan-100',   border: 'border-cyan-200' },
              { icon: BarChart3,  color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
              { icon: Users,      color: 'text-teal-600',   bg: 'bg-teal-100',   border: 'border-teal-200' },
            ].map(({ icon: Icon, color, bg, border }, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 border border-slate-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group shadow-sm">
                <div className={`inline-flex p-2.5 rounded-xl border ${bg} ${border} mb-5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-700 transition-colors">{t.landing.features.cards[i].title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{t.landing.features.cards[i].desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-28 px-5 sm:px-8 relative overflow-hidden bg-white">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-4">{t.landing.howItWorks.sectionLabel}</span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-5 tracking-tight">{t.landing.howItWorks.title}</h2>
              <p className="text-slate-600 mb-14 leading-relaxed">{t.landing.howItWorks.subtitle}</p>

              <div className="space-y-0">
                {[
                  { n: 1, icon: Users, title: t.landing.howItWorks.step1Title, desc: t.landing.howItWorks.step1Desc },
                  { n: 2, icon: FileText, title: t.landing.howItWorks.step2Title, desc: t.landing.howItWorks.step2Desc },
                  { n: 3, icon: Brain, title: t.landing.howItWorks.step3Title, desc: t.landing.howItWorks.step3Desc },
                  { n: 4, icon: Bell, title: t.landing.howItWorks.step4Title, desc: t.landing.howItWorks.step4Desc },
                ].map(({ n, icon: Icon, title, desc }) => (
                  <div key={n} className="flex gap-5">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-10 h-10 rounded-full border border-blue-300 bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                        {n}
                      </div>
                      {n < 4 && <div className="flex-1 w-px bg-gradient-to-b from-blue-400/50 to-transparent mt-2 min-h-[48px]" />}
                    </div>
                    <div className="pt-1.5 pb-10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right panel — kept dark as product UI mock */}
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-2xl bg-[#070d1a] border border-white/[0.07] overflow-hidden shadow-2xl">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                      <Brain className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{t.landing.aiPanel.title}</p>
                      <p className="text-[10px] text-slate-600">{t.landing.aiPanel.live}</p>
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="p-5 space-y-3">
                  {[
                    { name: 'Modatex Fashion S.A.', score: 92, risk: t.landing.aiPanel.riskLow, c: 'emerald' },
                    { name: 'Aura Wear Group S.R.L.', score: 78, risk: t.landing.aiPanel.riskLow, c: 'emerald' },
                    { name: 'Romtex Distribution', score: 54, risk: t.landing.aiPanel.riskMedium, c: 'amber' },
                    { name: 'Elegance Impex S.A.', score: 21, risk: t.landing.aiPanel.riskHigh, c: 'red' },
                  ].map(({ name, score, risk, c }) => {
                    const barColor = c === 'emerald' ? 'bg-emerald-500' : c === 'amber' ? 'bg-amber-400' : 'bg-red-500';
                    const textColor = c === 'emerald' ? 'text-emerald-400' : c === 'amber' ? 'text-amber-400' : 'text-red-400';
                    const badgeColor = c === 'emerald' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : c === 'amber' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20';
                    return (
                      <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/[0.04]">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{name[0]}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate mb-1.5">{name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                              <div className={`h-full ${barColor} rounded-full`} style={{ width: `${score}%` }} />
                            </div>
                            <span className={`text-[10px] font-black tabular-nums ${textColor}`}>{score}</span>
                          </div>
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-1 rounded-full border flex-shrink-0 ${badgeColor}`}>{risk}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="px-5 pb-5 border-t border-white/[0.05] pt-4">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">{t.landing.aiPanel.recentActivity}</p>
                  <div className="space-y-2.5">
                    {[
                      { icon: Bell, c: 'bg-amber-500/15 text-amber-400', text: t.landing.aiPanel.activity1, time: '2m' },
                      { icon: CheckCircle2, c: 'bg-emerald-500/15 text-emerald-400', text: t.landing.aiPanel.activity2, time: '1h' },
                      { icon: FileText, c: 'bg-blue-500/15 text-blue-400', text: t.landing.aiPanel.activity3, time: '3h' },
                    ].map(({ icon: Icon, c, text, time }) => (
                      <div key={text} className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${c}`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <p className="text-xs text-slate-400 flex-1 truncate">{text}</p>
                        <span className="text-[10px] text-slate-600 flex-shrink-0">{time}</span>
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
      <section id="benefits" className="py-28 px-5 sm:px-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-bold text-blue-600 uppercase tracking-[0.2em] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full mb-4">{t.landing.benefits.sectionLabel}</span>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mb-5 tracking-tight">{t.landing.benefits.title}</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">{t.landing.benefits.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, iconC: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
              { icon: Zap, iconC: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
              { icon: Shield, iconC: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' },
              { icon: Brain, iconC: 'text-violet-600', bg: 'bg-violet-100', border: 'border-violet-200' },
              { icon: Lock, iconC: 'text-slate-600', bg: 'bg-slate-200', border: 'border-slate-300' },
              { icon: Globe, iconC: 'text-cyan-600', bg: 'bg-cyan-100', border: 'border-cyan-200' },
            ].map(({ icon: Icon, iconC, bg, border }, i) => (
              <div key={i} className="group flex gap-5 p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center ${bg} ${border}`}>
                  <Icon className={`w-5 h-5 ${iconC}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-[15px] mb-2 group-hover:text-blue-700 transition-colors">{t.landing.benefits.cards[i].title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{t.landing.benefits.cards[i].desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 sm:px-8 relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-blue-500/40 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-8 backdrop-blur-sm">
            <Image src="/logo.png" alt="FinTrace" width={48} height={48} className="w-10 h-10 object-cover object-top rounded-xl" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 tracking-tight">{t.landing.cta.title}</h2>
          <p className="text-blue-100 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">{t.landing.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register" className="group flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-700 font-bold px-9 py-4 rounded-xl transition-all shadow-2xl shadow-black/20 hover:-translate-y-0.5 text-base">
              {t.landing.cta.createAccount} <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/auth/login" className="flex items-center gap-2 bg-blue-500/40 hover:bg-blue-500/60 border border-white/20 hover:border-white/40 text-white font-semibold px-9 py-4 rounded-xl transition-all text-base backdrop-blur-sm">
              {t.landing.cta.signIn}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 py-10 px-5 sm:px-8 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
              <Image src="/logo.png" alt="FinTrace" width={24} height={24} className="w-full h-full object-cover object-top rounded-md" />
            </div>
            <span className="font-bold text-slate-900 text-sm">FinTrace</span>
            <span className="text-slate-300 text-sm mx-1">·</span>
            <span className="text-slate-500 text-sm">{t.landing.footer.tagline}</span>
          </div>
          <div className="flex items-center gap-6">
            {[t.landing.footer.features, t.landing.footer.privacy, t.landing.footer.terms].map((l) => (
              <a key={l} href="#" className="text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors">{l}</a>
            ))}
          </div>
          <p className="text-sm text-slate-400">{t.landing.footer.rights}</p>
        </div>
      </footer>
    </div>
  );
}
