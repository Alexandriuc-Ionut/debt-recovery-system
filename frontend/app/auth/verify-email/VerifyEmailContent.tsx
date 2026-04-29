'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Mail, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { apiFetch } from '@/services/api';

export default function VerifyEmailContent() {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const verify = useCallback(async (t: string) => {
    try {
      const res = await apiFetch<{ accessToken: string; user: object }>(`/auth/verify-email?token=${t}`);
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      setStatus('success');
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, [router]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      setStatus('verifying');
      verify(token);
    }
  }, [verify]);

  async function handleResend() {
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSent(true);
    } catch {
      setResendSent(true);
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-lg">DebtRecovery</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        {status === 'pending' && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              We sent a verification link to your email address. Click the link to activate your account.
            </p>
            <div className="bg-slate-50 rounded-xl p-4 text-left text-sm text-slate-600 mb-6">
              <p className="font-medium text-slate-700 mb-1">Didn&apos;t receive the email?</p>
              <ul className="space-y-1 text-xs text-slate-500 list-disc list-inside">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>The link expires in 24 hours</li>
              </ul>
            </div>
            {!resendSent ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your email to resend"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleResend}
                  disabled={resendLoading || !resendEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                >
                  {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Resend verification email
                </button>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
                If that email exists, a new link has been sent.
              </div>
            )}
          </>
        )}

        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying your email…</h1>
            <p className="text-slate-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h1>
            <p className="text-slate-500 text-sm mb-6">Your account is now active. Redirecting you to your dashboard…</p>
            <Link href="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h1>
            <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
            <Link href="/auth/verify-email" className="inline-block border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors">
              Request a new link
            </Link>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-400">
        <Link href="/auth/login" className="hover:text-slate-600">Back to login</Link>
      </p>
    </div>
  );
}
