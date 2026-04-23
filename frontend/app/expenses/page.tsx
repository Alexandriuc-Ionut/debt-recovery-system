'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Receipt, TrendingDown } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import Modal from '@/components/ui/Modal';
import { expensesService } from '@/services/expenses.service';
import { formatCompactCurrency, formatDate } from '@/utils/format';
import type { Expense, ExpenseCategory } from '@/types';

const CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'UTILITIES', label: 'Utilities', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20' },
  { value: 'SALARIES', label: 'Salaries', color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-500/20' },
  { value: 'RENT', label: 'Rent', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
  { value: 'SUPPLIES', label: 'Supplies', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
  { value: 'SERVICES', label: 'Services', color: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-100 dark:border-cyan-500/20' },
  { value: 'TAXES', label: 'Taxes', color: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' },
  { value: 'OTHER', label: 'Other', color: 'bg-slate-50 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.1]' },
];

function categoryMeta(cat: ExpenseCategory) {
  return CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[CATEGORIES.length - 1];
}

const emptyForm = {
  category: 'OTHER' as ExpenseCategory,
  description: '',
  amount: '',
  currency: 'RON',
  date: new Date().toISOString().slice(0, 10),
  supplier: '',
  reference: '',
};

const fieldClass = 'w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [filterCat, setFilterCat] = useState<ExpenseCategory | 'ALL'>('ALL');

  function load() {
    setLoading(true);
    expensesService.getAll()
      .then(setExpenses)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditingId(exp.id);
    setForm({
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      currency: exp.currency,
      date: new Date(exp.date).toISOString().slice(0, 10),
      supplier: exp.supplier ?? '',
      reference: exp.reference ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const payload = {
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        currency: form.currency,
        date: form.date,
        supplier: form.supplier || undefined,
        reference: form.reference || undefined,
      };
      if (editingId !== null) {
        await expensesService.update(editingId, payload);
      } else {
        await expensesService.create(payload);
      }
      closeModal();
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this expense?')) return;
    try {
      await expensesService.remove(id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  const filtered = filterCat === 'ALL' ? expenses : expenses.filter((e) => e.category === filterCat);
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <AppLayout title="Expenses">
      <div className="space-y-5">

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="col-span-2 bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] p-5 shadow-sm">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Expenses</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatCompactCurrency(totalAll)}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded</p>
          </div>
          {CATEGORIES.slice(0, 2).map((cat) => {
            const catTotal = expenses.filter((e) => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0);
            return (
              <div key={cat.value} className={`rounded-xl border p-4 ${cat.color}`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70">{cat.label}</p>
                <p className="text-xl font-bold mt-2">{formatCompactCurrency(catTotal)}</p>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.05] rounded-lg p-1 overflow-x-auto flex-wrap">
            <button
              onClick={() => setFilterCat('ALL')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${filterCat === 'ALL' ? 'bg-white dark:bg-blue-600/20 dark:border dark:border-blue-500/30 text-slate-900 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setFilterCat(cat.value)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${filterCat === cat.value ? 'bg-white dark:bg-blue-600/20 dark:border dark:border-blue-500/30 text-slate-900 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          {loading && <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">Loading expenses...</div>}
          {error && <div className="p-6 text-sm text-red-600 bg-red-50 dark:bg-red-500/10">{error}</div>}
          {!loading && !error && (
            <>
              {filterCat !== 'ALL' && (
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} records</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCompactCurrency(total)}</span>
                </div>
              )}
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {['Category', 'Description', 'Supplier', 'Amount', 'Date', 'Reference', ''].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filtered.map((exp) => {
                      const cat = categoryMeta(exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cat.color}`}>{cat.label}</span>
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">{exp.description}</td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{exp.supplier ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                          <td className="px-5 py-4 font-bold text-red-600 dark:text-red-400">{formatCompactCurrency(Number(exp.amount), exp.currency)}</td>
                          <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDate(exp.date)}</td>
                          <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-mono text-xs">{exp.reference ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button onClick={() => openEdit(exp)} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(exp.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No expenses found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Mobile */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filtered.map((exp) => {
                  const cat = categoryMeta(exp.category);
                  return (
                    <div key={exp.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{exp.description}</p>
                          {exp.supplier && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exp.supplier}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button onClick={() => openEdit(exp)} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(exp.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cat.color}`}>{cat.label}</span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{formatCompactCurrency(Number(exp.amount), exp.currency)}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(exp.date)}</span>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">No expenses found.</div>}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title={editingId !== null ? 'Edit Expense' : 'Add Expense'}
        open={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">{formError}</div>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as ExpenseCategory }))} className={fieldClass}>
                {CATEGORIES.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Date <span className="text-red-500">*</span></label>
              <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={fieldClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Description <span className="text-red-500">*</span></label>
            <input required value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="e.g. Office rent - April 2026" className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Amount <span className="text-red-500">*</span></label>
              <div className="relative">
                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" required min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="1500.00" className={`${fieldClass} pl-9`} />
              </div>
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Supplier</label>
              <input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="E.ON România" className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Reference</label>
              <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="INV-2026-001" className={fieldClass} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button type="button" onClick={closeModal} className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm">
              {submitting ? (editingId !== null ? 'Saving...' : 'Adding...') : (editingId !== null ? 'Save Changes' : 'Add Expense')}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
