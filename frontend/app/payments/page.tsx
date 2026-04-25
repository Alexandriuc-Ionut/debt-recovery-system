'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, CreditCard, Banknote, Building2, MoreHorizontal, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 15;

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  const pages: (number | '…')[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className="flex items-center justify-center gap-1 py-4 border-t border-slate-100 dark:border-white/[0.06]">
      <button onClick={() => onPage(page - 1)} disabled={page === 1} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) => p === '…' ? (
        <span key={`e${i}`} className="px-2 text-slate-400 text-sm">…</span>
      ) : (
        <button key={p} onClick={() => onPage(p as number)} className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors ${page === p ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'}`}>{p}</button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-30 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { paymentsService } from '@/services/payments.service';
import { invoicesService } from '@/services/invoices.service';
import { formatCompactCurrency, formatDate } from '@/utils/format';
import type { Invoice, Payment, PaymentMethod } from '@/types';

const emptyForm = {
  invoiceId: '',
  amount: '',
  paidAt: new Date().toISOString().slice(0, 10),
  method: 'BANK' as PaymentMethod,
  reference: '',
};

const methodLabel: Record<PaymentMethod, string> = {
  BANK: 'Bank Transfer',
  CASH: 'Cash',
  CARD: 'Card',
  OTHER: 'Other',
};

const methodIcon: Record<PaymentMethod, React.ReactNode> = {
  BANK: <Building2 className="w-3.5 h-3.5" />,
  CASH: <Banknote className="w-3.5 h-3.5" />,
  CARD: <CreditCard className="w-3.5 h-3.5" />,
  OTHER: <MoreHorizontal className="w-3.5 h-3.5" />,
};

const methodColor: Record<PaymentMethod, string> = {
  BANK: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  CASH: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  CARD: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400',
  OTHER: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

export default function PaymentsPage() {
  const { t } = useLanguage();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function load() {
    setLoading(true);
    paymentsService.getAll()
      .then(setPayments)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    invoicesService.getAll('OPEN')
      .then((open) => invoicesService.getAll('PARTIAL').then((partial) => setInvoices([...open, ...partial])))
      .catch(() => {});
  }, []);

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await paymentsService.create({
        invoiceId: Number(form.invoiceId),
        amount: Number(form.amount),
        paidAt: form.paidAt,
        method: form.method,
        reference: form.reference || undefined,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this payment? The invoice status will be recalculated.')) return;
    try {
      await paymentsService.remove(id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete payment');
    }
  }

  const [page, setPage] = useState(1);
  const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPages = Math.ceil(payments.length / PAGE_SIZE);
  const paginated = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fieldClass = 'w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 dark:focus:border-blue-500/40 transition';

  return (
    <AppLayout title={t.payments.title}>
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              {payments.length} payment{payments.length !== 1 ? 's' : ''}
            </span>
            {payments.length > 0 && (
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1 rounded-full">
                Total collected: {formatCompactCurrency(totalCollected)}
              </span>
            )}
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {t.payments.addPayment}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          {loading && <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">{t.common.loading}</div>}
          {error && <div className="p-6 text-sm text-red-600 bg-red-50">{error}</div>}
          {!loading && !error && (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {[t.payments.invoice, t.payments.client, t.common.amount, t.payments.paymentMethod, t.payments.reference, t.common.date, ''].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {paginated.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                        <td className="px-5 py-4">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {p.invoice ? `${p.invoice.series ?? ''}${p.invoice.number}` : `#${p.invoiceId}`}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                          {p.invoice?.client?.name ?? <span className="text-slate-400 dark:text-slate-500">—</span>}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-700 dark:text-emerald-400 text-base">
                          {formatCompactCurrency(p.amount)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${methodColor[p.method]}`}>
                            {methodIcon[p.method]}
                            {methodLabel[p.method]}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.reference ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDate(p.paidAt)}</td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                            title="Delete payment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
                {paginated.map((p) => (
                  <div key={p.id} className="px-4 py-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.invoice?.client?.name ?? `Invoice #${p.invoiceId}`}
                        </p>
                        <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                          {p.invoice ? `${p.invoice.series ?? ''}${p.invoice.number}` : `#${p.invoiceId}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCompactCurrency(p.amount)}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${methodColor[p.method]}`}>
                        {methodIcon[p.method]}
                        {methodLabel[p.method]}
                      </span>
                      {p.reference && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{p.reference}</span>
                      )}
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(p.paidAt)}</span>
                    </div>
                  </div>
                ))}
                {paginated.length === 0 && (
                  <div className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No payments recorded yet.</div>
                )}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal title={t.payments.addPayment} open={modalOpen} onClose={() => { setModalOpen(false); setForm(emptyForm); setFormError(''); }}>
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{formError}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Invoice <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.invoiceId}
              onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
              className={fieldClass}
            >
              <option value="">Select an invoice...</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.series ?? ''}{inv.number} — {inv.client?.name} — {formatCompactCurrency(inv.totalAmount, inv.currency)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="500.00"
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.paidAt}
                onChange={(e) => setForm((f) => ({ ...f, paidAt: e.target.value }))}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Method</label>
              <select
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))}
                className={fieldClass}
              >
                <option value="BANK">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Reference</label>
              <input
                value={form.reference}
                onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="OP/2026/001"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(emptyForm); setFormError(''); }}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm"
            >
              {submitting ? t.common.loading : t.payments.addPayment}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
