'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const errors: typeof fieldErrors = {};
    if (!email) errors.email = t.auth.errEmailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t.auth.errEmailInvalid;
    if (!password) errors.password = t.auth.errPasswordRequired;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl border text-sm bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="min-h-screen flex bg-[#080d14]">
      <ToastContainer />

      {/* Left — dark futuristic branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-500/10 to-transparent" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex-shrink-0 shadow-lg shadow-black/30 overflow-hidden">
              <Image src="/logo.png" alt="DebtRecovery" width={36} height={36} className="w-full h-full object-cover object-top rounded-lg" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">DebtRecovery</span>
            <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full ml-1">Pro</span>
          </div>

          <div className="space-y-3 mb-12">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">{t.auth.panelBadge}</p>
            <h1 className="text-4xl font-bold text-white leading-[1.15] tracking-tight">
              {t.auth.panelHeadline}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{t.auth.panelHighlight}</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">{t.auth.panelSubtitle}</p>
          </div>

          <div className="space-y-3">
            {[
              { icon: ShieldCheck, label: t.auth.panelFeature1, desc: t.auth.panelFeature1Desc },
              { icon: Zap,         label: t.auth.panelFeature2, desc: t.auth.panelFeature2Desc },
              { icon: TrendingUp,  label: t.auth.panelFeature3, desc: t.auth.panelFeature3Desc },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                <div className="w-9 h-9 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">{t.auth.copyright}</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 overflow-hidden shadow-lg shadow-black/30">
              <Image src="/logo.png" alt="DebtRecovery" width={36} height={36} className="w-full h-full object-cover object-top rounded-lg" />
            </div>
            <span className="font-bold text-white text-lg">DebtRecovery</span>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white tracking-tight">{t.auth.welcomeBack}</h2>
            <p className="text-slate-500 mt-1 text-sm">{t.auth.signInSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t.auth.emailAddress}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="you@company.com"
                className={`${inputBase} ${fieldErrors.email ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 hover:border-white/20'}`}
              />
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">{t.auth.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11 ${fieldErrors.password ? 'border-red-500/60 bg-red-500/5' : 'border-white/10 hover:border-white/20'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-400">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.auth.loggingIn}
                </>
              ) : (
                <>{t.auth.signIn} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-8">
            {t.auth.noAccount}{' '}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              {t.auth.createOneFree}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
