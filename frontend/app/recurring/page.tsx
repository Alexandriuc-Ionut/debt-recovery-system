'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { recurringService } from '@/services/recurring.service';
import { clientsService } from '@/services/clients.service';
import { formatCompactCurrency, formatDate } from '@/utils/format';
import type { RecurringInvoice, RecurringInterval, Client } from '@/types';

const INTERVAL_COLORS: Record<RecurringInterval, string> = {
  WEEKLY: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
  MONTHLY: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
  QUARTERLY: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  YEARLY: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
};

const emptyForm = {
  clientId: '',
  templateName: '',
  series: '',
  amount: '',
  currency: 'RON',
  notes: '',
  interval: 'MONTHLY' as RecurringInterval,
  dayOfMonth: '1',
  nextRunAt: new Date().toISOString().slice(0, 10),
};

const fieldClass = 'w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition';

export default function RecurringPage() {
  const { t } = useLanguage();

  const INTERVALS: { value: RecurringInterval; label: string; color: string }[] = [
    { value: 'WEEKLY', label: t.recurring.weekly, color: INTERVAL_COLORS.WEEKLY },
    { value: 'MONTHLY', label: t.recurring.monthly, color: INTERVAL_COLORS.MONTHLY },
    { value: 'QUARTERLY', label: t.recurring.quarterly, color: INTERVAL_COLORS.QUARTERLY },
    { value: 'YEARLY', label: t.recurring.yearly, color: INTERVAL_COLORS.YEARLY },
  ];

  function intervalMeta(v: RecurringInterval) {
    return INTERVALS.find((i) => i.value === v) ?? INTERVALS[1];
  }

  const [items, setItems] = useState<RecurringInvoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function load() {
    setLoading(true);
    recurringService.getAll()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    clientsService.getAll().then(setClients).catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await recurringService.create({
        clientId: Number(form.clientId),
        templateName: form.templateName,
        series: form.series || undefined,
        amount: Number(form.amount),
        currency: form.currency,
        notes: form.notes || undefined,
        interval: form.interval,
        dayOfMonth: Number(form.dayOfMonth),
        nextRunAt: form.nextRunAt,
      });
      setModalOpen(false);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: number) {
    try {
      const updated = await recurringService.toggle(id);
      setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to toggle');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this recurring invoice template?')) return;
    try {
      await recurringService.remove(id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <AppLayout title={t.recurring.title}>
      <div className="space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Templates</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{items.length}</p>
          </div>
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-emerald-200 dark:border-emerald-500/20 p-5 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active</p>
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 mt-2">{activeCount}</p>
          </div>
          <div className="hidden lg:block bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Paused</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{items.length - activeCount}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors">
            <Plus className="w-4 h-4" /> New Recurring Invoice
          </button>
        </div>

        {/* Cards */}
        {loading && <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] p-10 text-center text-slate-400 dark:text-slate-500 text-sm">Loading...</div>}
        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">{error}</div>}

        {!loading && items.length === 0 && (
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto">
              <RefreshCw className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-semibold">No recurring billing templates yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">Create templates to automatically generate invoices at set intervals.</p>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => {
            const meta = intervalMeta(item.interval);
            const initials = (item.client?.name ?? 'C').slice(0, 2).toUpperCase();
            return (
              <div key={item.id} className={`bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border shadow-sm transition-all ${item.isActive ? 'border-slate-200 dark:border-white/[0.06]' : 'border-slate-200 dark:border-white/[0.03] opacity-60'}`}>
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.templateName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.client?.name ?? `Client #${item.clientId}`}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{formatCompactCurrency(Number(item.amount), item.currency)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400 dark:text-slate-500 flex-wrap">
                      <span>Day {item.dayOfMonth} of period</span>
                      <span>Next: <span className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(item.nextRunAt)}</span></span>
                      {item.series && <span>Series: {item.series}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button onClick={() => handleToggle(item.id)} className="transition-colors" title={item.isActive ? 'Pause' : 'Activate'}>
                      {item.isActive
                        ? <ToggleRight className="w-7 h-7 text-emerald-500" />
                        : <ToggleLeft className="w-7 h-7 text-slate-400 dark:text-slate-600" />}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal title="New Recurring Invoice" open={modalOpen} onClose={() => { setModalOpen(false); setForm(emptyForm); setFormError(''); }}>
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">{formError}</div>}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Template Name <span className="text-red-500">*</span></label>
            <input required value={form.templateName} onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))} placeholder="Monthly retainer" className={fieldClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Client <span className="text-red-500">*</span></label>
            <select required value={form.clientId} onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))} className={fieldClass}>
              <option value="">Select a client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Amount <span className="text-red-500">*</span></label>
              <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="500.00" className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Currency</label>
              <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className={fieldClass}>
                <option value="RON">RON</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Interval <span className="text-red-500">*</span></label>
              <select value={form.interval} onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value as RecurringInterval }))} className={fieldClass}>
                {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Day of Month</label>
              <input type="number" min="1" max="28" value={form.dayOfMonth} onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))} className={fieldClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">First Run Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.nextRunAt} onChange={(e) => setForm((f) => ({ ...f, nextRunAt: e.target.value }))} className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Invoice Series</label>
              <input value={form.series} onChange={(e) => setForm((f) => ({ ...f, series: e.target.value }))} placeholder="FAC" className={fieldClass} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button type="button" onClick={() => { setModalOpen(false); setForm(emptyForm); setFormError(''); }} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm">{submitting ? 'Creating...' : 'Create Template'}</button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
