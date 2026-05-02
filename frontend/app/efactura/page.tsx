'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Upload, FileCode, CheckCircle2, Clock, AlertCircle,
  Info, FileDown, RefreshCw, Send, X,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { efacturaService } from '@/services/efactura.service';
import type { EFacturaSubmission } from '@/services/efactura.service';
import { formatDate, formatCompactCurrency } from '@/utils/format';
import type { Invoice } from '@/types';

/* ─── Status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: EFacturaSubmission['status'] }) {
  if (status === 'VALIDATED')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" /> Validated
      </span>
    );
  if (status === 'PENDING')
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
        <Clock className="w-3 h-3 animate-pulse" /> Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
      <AlertCircle className="w-3 h-3" /> Error
    </span>
  );
}

/* ─── Submit modal ─────────────────────────────────────────────────────────── */
function SubmitModal({
  invoices,
  onClose,
  onSubmit,
  t,
}: {
  invoices: (Invoice & { client: { name: string } })[];
  onClose: () => void;
  onSubmit: (id: number) => Promise<void>;
  t: ReturnType<typeof useLanguage>['t']['efactura'];
}) {
  const [selected, setSelected] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      await onSubmit(Number(selected));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0d1829] border border-slate-200 dark:border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="font-semibold text-slate-900 dark:text-white text-base">{t.submitModalTitle}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.selectInvoice}</label>
            <select
              required
              value={selected}
              onChange={(e) => setSelected(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
            >
              <option value="">{t.chooseInvoice}</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.series ? `${inv.series}-${inv.number}` : inv.number} · {inv.client.name} · {formatCompactCurrency(Number(inv.totalAmount))}
                </option>
              ))}
            </select>
            {invoices.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">{t.allSubmitted}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">{t.whatHappensNext}</p>
            <ol className="list-decimal list-inside space-y-0.5 text-xs text-blue-700 dark:text-blue-400">
              <li>{t.step1XmlGen}</li>
              <li>{t.step2Upload}</li>
              <li>{t.step3ExecutionId}</li>
              <li>{t.step4Poll}</li>
            </ol>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!selected || loading}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
            >
              {loading
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> {t.submitting}</>
                : <><Send className="w-4 h-4" /> {t.submitToAnaf}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Recipisa detail modal ────────────────────────────────────────────────── */
function RecrepisaModal({ sub, onClose }: { sub: EFacturaSubmission; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0d1829] border border-slate-200 dark:border-white/[0.08] shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
          <h2 className="font-semibold text-slate-900 dark:text-white text-base">ANAF Recipisa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Execution ID', value: sub.executionId ?? '—', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Message ID',   value: sub.messageId ?? '—',   color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Submitted',    value: formatDate(sub.submittedAt),                            color: 'text-slate-700 dark:text-slate-300' },
              { label: 'Processed',    value: sub.processedAt ? formatDate(sub.processedAt) : '—',   color: 'text-slate-700 dark:text-slate-300' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 dark:bg-white/[0.03] rounded-lg p-3 border border-slate-100 dark:border-white/[0.05]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                <p className={`font-mono font-semibold text-xs ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {sub.recipisa && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Raw Receipt (JSON)</p>
              <pre className="text-xs text-emerald-700 dark:text-emerald-300 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/[0.05] rounded-lg p-3 overflow-auto max-h-48 font-mono">
                {JSON.stringify(sub.recipisa, null, 2)}
              </pre>
            </div>
          )}

          {sub.errorMsg && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Error</p>
              <p className="text-xs text-red-600 dark:text-red-300">{sub.errorMsg}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────────── */
export default function EFacturaPage() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<EFacturaSubmission[]>([]);
  const [eligible, setEligible] = useState<(Invoice & { client: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [detailSub, setDetailSub] = useState<EFacturaSubmission | null>(null);
  const load = useCallback(async (quiet = false) => {
    try {
      const [subs, elig] = await Promise.all([
        efacturaService.getAll(),
        efacturaService.getEligible(),
      ]);
      setSubmissions(subs);
      setEligible(elig);
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Auto-poll every 5s while any submission is PENDING
  useEffect(() => {
    const hasPending = submissions.some((s) => s.status === 'PENDING');
    if (!hasPending) return;
    const id = setInterval(() => void load(true), 5000);
    return () => clearInterval(id);
  }, [submissions, load]);

  async function handleSubmit(invoiceId: number) {
    await efacturaService.submit(invoiceId);
    await load();
  }

  async function handleDownloadXml(sub: EFacturaSubmission) {
    const token = localStorage.getItem('accessToken') ?? '';
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/efactura/xml/${sub.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) { alert('Failed to download XML'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const invNum = sub.invoice?.series
      ? `${sub.invoice.series}-${sub.invoice.number}`
      : (sub.invoice?.number ?? String(sub.invoiceId));
    a.href = url;
    a.download = `efactura-${invNum}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const validated = submissions.filter((s) => s.status === 'VALIDATED').length;
  const pending   = submissions.filter((s) => s.status === 'PENDING').length;
  const errors    = submissions.filter((s) => s.status === 'ERROR').length;

  return (
    <AppLayout title={t.efactura.title}>
      <div className="space-y-5">

        {/* ── Stats + info ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* SPV Status card */}
          <div className="bg-white dark:bg-[#0d1117]/80 rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.efactura.anafSpvStatus}</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 absolute inset-0 animate-ping opacity-40" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.efactura.mockModeActive}</p>
                <p className="text-xs text-slate-500">Sandbox · UBL 2.1 · CIUS-RO</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.05] space-y-2">
              {[
                { label: t.efactura.totalSubmitted, value: submissions.length, color: 'text-slate-800 dark:text-white' },
                { label: t.efactura.validated,      value: validated,          color: 'text-emerald-600 dark:text-emerald-400' },
                { label: t.efactura.pending,        value: pending,            color: 'text-amber-600 dark:text-amber-400' },
                { label: t.efactura.withErrors,     value: errors,             color: 'text-red-600 dark:text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-bold ${color}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="lg:col-span-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-5 flex gap-4">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t.efactura.infoTitle}</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">{t.efactura.infoText}</p>
              <div className="flex gap-2 flex-wrap pt-1">
                {['UBL 2.1', 'CIUS-RO 1.0.1', 'B2B Mandatory', 'Sandbox Mode'].map((tag) => (
                  <span key={tag} className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-medium border border-blue-200 dark:border-blue-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Toolbar ──────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-slate-500">
            {eligible.length} {t.efactura.notYetSubmitted}
          </p>
          <button
            onClick={() => setSubmitModalOpen(true)}
            disabled={eligible.length === 0}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> {t.efactura.submitInvoiceToAnaf}
          </button>
        </div>

        {/* ── Submissions table ─────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0d1117]/80 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/[0.05]">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <FileCode className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{t.efactura.submissions}</p>
            </div>
            <span className="text-xs text-slate-400">{submissions.length} total</span>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-400 text-sm">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {t.efactura.loading}
            </div>
          )}

          {!loading && submissions.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">
              {t.efactura.noSubmissionsYet}
            </div>
          )}

          {!loading && submissions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                    {[t.efactura.invoice, t.efactura.client, t.efactura.amount, t.efactura.executionId, t.efactura.submitted, t.efactura.status, ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {submissions.map((sub) => {
                    const inv = sub.invoice;
                    const invNum = inv?.series
                      ? `${inv.series}-${inv.number}`
                      : (inv?.number ?? `#${sub.invoiceId}`);
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{invNum}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">{inv?.client?.name ?? '—'}</td>
                        <td className="px-5 py-3.5 font-semibold text-amber-600 dark:text-amber-400 text-xs">
                          {inv ? formatCompactCurrency(Number(inv.totalAmount)) : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{sub.executionId ?? '—'}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{formatDate(sub.submittedAt)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={sub.status} /></td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {sub.status === 'PENDING' && (
                              <span title="Waiting for ANAF simulator response..." className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                                <RefreshCw className="w-3 h-3 animate-spin" /> waiting...
                              </span>
                            )}
                            {(sub.recipisa || sub.errorMsg) && (
                              <button
                                onClick={() => setDetailSub(sub)}
                                title="View Recipisa"
                                className="text-slate-400 hover:text-blue-500 transition-colors"
                              >
                                <Info className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDownloadXml(sub)}
                              title="Download UBL 2.1 XML"
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              <FileDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Integration Architecture ──────────────────────────────────────── */}
        <div className="bg-white dark:bg-[#0d1117]/80 rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t.efactura.integrationArchitecture}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { step: '1', title: 'XML Generation',  desc: 'Invoice data → UBL 2.1 (CIUS-RO 1.0.1)',      color: 'border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/5',         num: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',       title_c: 'text-blue-800 dark:text-blue-300',  desc_c: 'text-blue-600 dark:text-blue-500' },
              { step: '2', title: 'ANAF Upload',      desc: 'POST /EINVOICE/upload → Execution ID',         color: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5',   num: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',   title_c: 'text-amber-800 dark:text-amber-300', desc_c: 'text-amber-600 dark:text-amber-500' },
              { step: '3', title: 'Status Polling',   desc: 'GET /stareMesaj?id_incarcare → ok / nok',      color: 'border-violet-200 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/5',num: 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300',title_c: 'text-violet-800 dark:text-violet-300',desc_c: 'text-violet-600 dark:text-violet-500' },
              { step: '4', title: 'Recipisa Storage', desc: 'Index number + receipt stored for audit trail', color: 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5',num: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',title_c: 'text-emerald-800 dark:text-emerald-300',desc_c: 'text-emerald-600 dark:text-emerald-500' },
            ].map(({ step, title, desc, color, num, title_c, desc_c }) => (
              <div key={step} className={`rounded-xl border p-3.5 ${color}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${num}`}>{step}</span>
                  <p className={`text-xs font-semibold ${title_c}`}>{title}</p>
                </div>
                <p className={`text-[11px] ${desc_c}`}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {submitModalOpen && (
        <SubmitModal
          invoices={eligible}
          onClose={() => setSubmitModalOpen(false)}
          onSubmit={handleSubmit}
          t={t.efactura}
        />
      )}
      {detailSub && (
        <RecrepisaModal sub={detailSub} onClose={() => setDetailSub(null)} />
      )}
    </AppLayout>
  );
}
