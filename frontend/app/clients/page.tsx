'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Users, Search, Mail, Phone, MapPin, Hash, Bell, Loader2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
import { clientsService } from '@/services/clients.service';
import { remindersService } from '@/services/reminders.service';
import { formatDate } from '@/utils/format';
import type { Client } from '@/types';

const emptyForm = { name: '', cui: '', email: '', phone: '', address: '' };
const fieldClass = 'w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 dark:focus:border-blue-500/40 transition';

export default function ClientsPage() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  function openEdit(c: Client) {
    setEditId(c.id);
    setForm({ cui: c.cui ?? '', name: c.name, email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '' });
    setLookupMsg(null);
    setModalOpen(true);
  }
  const [sendingReminder, setSendingReminder] = useState<number | null>(null);
  const [reminderMsg, setReminderMsg] = useState<{ id: number; text: string } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupMsg, setLookupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function load() {
    setLoading(true);
    clientsService.getAll()
      .then(setClients)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editId) {
        await clientsService.update(editId, form);
      } else {
        await clientsService.create(form);
      }
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendReminder(client: Client) {
    if (!client.email) {
      alert(`${client.name} has no email address.`);
      return;
    }
    setSendingReminder(client.id);
    setReminderMsg(null);
    try {
      const res = await remindersService.sendToClient(client.id);
      setReminderMsg({ id: client.id, text: res.message });
      setTimeout(() => setReminderMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this client? This cannot be undone.')) return;
    try {
      await clientsService.remove(id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete client');
    }
  }

  async function handleLookupCui() {
    if (!form.cui) return;
    setLookingUp(true);
    setLookupMsg(null);
    try {
      const res = await clientsService.lookupCui(form.cui);
      setForm((f) => ({ ...f, name: res.name ?? f.name, address: res.address ?? f.address }));
      setLookupMsg({ type: 'success', text: `${t.clients.foundInAnaf}: ${res.name}${res.vatPayer ? ` · ${t.clients.vatPayer}` : ''}` });
    } catch {
      setLookupMsg({ type: 'error', text: t.clients.cuiNotFound });
    } finally {
      setLookingUp(false);
    }
  }

  const [page, setPage] = useState(1);

  const filtered = clients.filter((c) =>
    [c.name, c.email, c.cui, c.phone].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase()),
    ),
  );
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(v: string) { setSearch(v); setPage(1); }

  return (
    <AppLayout title={t.clients.title}>
      <div className="space-y-5">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t.clients.searchClients}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#070b11] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 dark:focus:border-blue-500/40 transition"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              {t.clients.addClient}
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          {loading && (
            <div className="p-10 text-center text-slate-400 text-sm">{t.common.loading}</div>
          )}
          {error && (
            <div className="p-6 text-sm text-red-600 bg-red-50">{error}</div>
          )}
          {!loading && !error && (
            <>
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {[t.common.name, t.clients.cui, t.common.email, t.common.phone, t.common.address, t.common.date, t.common.actions].map((h) => (
                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {paginated.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-mono text-xs">{c.cui ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-5 py-4 text-blue-600 dark:text-blue-400">{c.email ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">{c.phone ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{c.address ?? <span className="text-slate-300 dark:text-slate-600">—</span>}</td>
                        <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDate(c.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            {reminderMsg?.id === c.id ? (
                              <span className="text-xs text-emerald-600 font-medium whitespace-nowrap">{reminderMsg.text}</span>
                            ) : (
                              <button
                                onClick={() => handleSendReminder(c)}
                                disabled={sendingReminder === c.id}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-40 whitespace-nowrap"
                                title="Send overdue reminder"
                              >
                                <Bell className="w-3.5 h-3.5" />
                                {sendingReminder === c.id ? 'Sending…' : 'Remind'}
                              </button>
                            )}
                            <span className="text-slate-200">|</span>
                            <button onClick={() => openEdit(c)} className="text-slate-300 hover:text-blue-500 transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginated.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                          {search ? t.clients.noClientsMatch : t.clients.noClients}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
                {paginated.map((c) => (
                  <div key={c.id} className="px-4 py-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-base">{c.name}</p>
                      <div className="flex items-center gap-2 ml-2 mt-0.5">
                        <button onClick={() => openEdit(c)} className="text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      {c.cui && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <Hash className="w-3.5 h-3.5" />{c.cui}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Mail className="w-3.5 h-3.5" />{c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Phone className="w-3.5 h-3.5" />{c.phone}
                        </span>
                      )}
                      {c.address && (
                        <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />{c.address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(c.createdAt)}</p>
                    <div className="flex items-center gap-3 pt-1">
                      {reminderMsg?.id === c.id ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{reminderMsg.text}</span>
                      ) : (
                        <button
                          onClick={() => handleSendReminder(c)}
                          disabled={sendingReminder === c.id}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold disabled:opacity-40"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          {sendingReminder === c.id ? 'Sending…' : 'Send Reminder'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {paginated.length === 0 && (
                  <div className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    {search ? t.clients.noClientsMatch : t.clients.noClients}
                  </div>
                )}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal title={editId ? t.clients.editClient : t.clients.addClient} open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); setForm(emptyForm); setFormError(''); setLookupMsg(null); }}>
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && <div className="text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg">{formError}</div>}

          {/* CUI with autofill */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">CUI / Tax ID</label>
            <div className="flex gap-2">
              <input
                value={form.cui}
                onChange={(e) => { setForm((f) => ({ ...f, cui: e.target.value })); setLookupMsg(null); }}
                placeholder="RO12345678"
                className={`${fieldClass} flex-1`}
              />
              <button
                type="button"
                onClick={handleLookupCui}
                disabled={!form.cui || lookingUp}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
                title="Autofill from ANAF"
              >
                {lookingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Lookup
              </button>
            </div>
            {lookupMsg && (
              <p className={`mt-1.5 text-xs font-medium ${lookupMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {lookupMsg.text}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Company Name <span className="text-red-500">*</span></label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Exemplu SRL" className={fieldClass} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email Address</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="contact@company.ro" className={fieldClass} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Phone Number</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0721 000 000" className={fieldClass} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Str. Exemplu 1, București" className={fieldClass} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setForm(emptyForm); setFormError(''); setLookupMsg(null); }}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm"
            >
              {submitting ? t.common.loading : editId ? t.clients.editClient : t.clients.addClient}
            </button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
