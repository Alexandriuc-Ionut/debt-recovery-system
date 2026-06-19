'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { ToastContainer } from '@/components/ui/Toast';
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
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email_not_found')) {
        setFieldErrors({ email: t.auth.errEmailNotFound });
      } else if (msg.includes('invalid_password')) {
        setFieldErrors({ password: t.auth.errPasswordWrong });
      } else {
        setFieldErrors({ password: t.auth.errPasswordWrong });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-xl border text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';

  return (
    <div className="min-h-screen flex bg-slate-50">
      <ToastContainer />

      {/* Left — light branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden border-r border-slate-200 bg-white">
        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-100/80 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-100/60 rounded-full blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-300/20 to-transparent" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(0,0,0,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-20">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 flex-shrink-0 shadow-md shadow-slate-200 overflow-hidden border border-slate-100">
              <Image src="/logo.png" alt="FinTrace" width={36} height={36} className="w-full h-full object-cover object-top rounded-lg" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">FinTrace</span>
            <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-widest bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full ml-1">Pro</span>
          </div>

          <div className="space-y-3 mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest">{t.auth.panelBadge}</p>
            <h1 className="text-4xl font-bold text-slate-900 leading-[1.15] tracking-tight">
              {t.auth.panelHeadline}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">{t.auth.panelHighlight}</span>
            </h1>
            <p className="text-slate-600 text-base leading-relaxed max-w-sm">{t.auth.panelSubtitle}</p>
          </div>

          <div className="space-y-3">
            {[
              { icon: ShieldCheck, label: t.auth.panelFeature1, desc: t.auth.panelFeature1Desc },
              { icon: Zap,         label: t.auth.panelFeature2, desc: t.auth.panelFeature2Desc },
              { icon: TrendingUp,  label: t.auth.panelFeature3, desc: t.auth.panelFeature3Desc },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 p-3.5 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100/70 transition-colors">
                <div className="w-9 h-9 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">{label}</p>
                  <p className="text-slate-600 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-400 text-xs">{t.auth.copyright}</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-12 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-white p-0.5 overflow-hidden shadow-md shadow-slate-200 border border-slate-100">
              <Image src="/logo.png" alt="FinTrace" width={36} height={36} className="w-full h-full object-cover object-top rounded-lg" />
            </div>
            <span className="font-bold text-slate-900 text-lg">FinTrace</span>
          </div>

          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.auth.welcomeBack}</h2>
            <p className="text-slate-500 mt-1 text-sm">{t.auth.signInSubtitle}</p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.auth.emailAddress}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })); }}
                placeholder="you@company.com"
                className={`${inputBase} ${fieldErrors.email ? 'border-red-500/60 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
              />
              {fieldErrors.email && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.auth.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  className={`${inputBase} pr-11 ${fieldErrors.password ? 'border-red-500/60 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-red-500">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 disabled:text-blue-100 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 mt-2"
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

          <p className="text-center text-sm text-slate-500 mt-8">
            {t.auth.noAccount}{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              {t.auth.createOneFree}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
