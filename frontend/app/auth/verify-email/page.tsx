'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Mail, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { apiFetch } from '@/services/api';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>(
    token ? 'verifying' : 'pending',
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const verify = useCallback(async (t: string) => {
    try {
      await apiFetch(`/auth/verify-email?token=${t}`);
      setStatus('success');
      setTimeout(() => router.replace('/auth/login'), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, [router]);

  useEffect(() => {
    if (token) verify(token);
  }, [token, verify]);

  async function handleResend() {
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      await authService.resendVerification(resendEmail);
      setResendSent(true);
    } catch {
      setResendSent(true); // Show success anyway (prevent email enumeration)
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-900 text-lg">DebtRecovery</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">

        {/* Pending — no token, just registered */}
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
                  {resendLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
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

        {/* Verifying */}
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying your email…</h1>
            <p className="text-slate-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h1>
            <p className="text-slate-500 text-sm mb-6">
              Your account is now active. Redirecting you to login…
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Go to Login
            </Link>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verification failed</h1>
            <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
            <Link
              href="/auth/verify-email"
              className="inline-block border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Request a new link
            </Link>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-slate-400">
        <Link href="/auth/login" className="hover:text-slate-600">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
