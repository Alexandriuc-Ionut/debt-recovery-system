'use client';

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { ToastContainer, toast } from '@/components/ui/Toast';
import { apiFetch } from '@/services/api';
import {
  settingsService,
  type CompanySettings,
  type InvoiceSeries,
  type BankAccount,
} from '@/services/settings.service';
import {
  Building2, FileText, Landmark, Plus, Pencil, Trash2,
  Save, X, Loader2, Star, Search,
} from 'lucide-react';

function SectionCard({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-2xl border border-slate-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-start gap-4 px-6 py-5 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text', disabled = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-slate-100 text-sm bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-white/[0.03] disabled:text-slate-400 dark:disabled:text-slate-500"
      />
    </div>
  );
}

function CompanySection() {
  const { t } = useLanguage();
  const s = t.settings;
  const [data, setData] = useState<CompanySettings | null>(null);
  const [form, setForm] = useState<Partial<CompanySettings>>({});
  const [saving, setSaving] = useState(false);
  const [anafLoading, setAnafLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const c = await settingsService.getCompany();
      setData(c);
      setForm({
        name: c.name, cui: c.cui ?? '', email: c.email ?? '',
        phone: c.phone ?? '', address: c.address ?? '',
        city: c.city ?? '', county: c.county ?? '', vatRate: c.vatRate ?? undefined,
      });
    } catch { toast(t.common.loading, 'error'); }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  function set(field: keyof CompanySettings, value: string | number) {
    setForm((p) => ({ ...p, [field]: value }));
    setDirty(true);
  }

  async function lookupAnaf() {
    if (!form.cui?.trim()) { toast(s.enterCuiFirst, 'warning'); return; }
    setAnafLoading(true);
    try {
      const result = await apiFetch<{ found: boolean; name?: string; address?: string; city?: string; county?: string; phone?: string }>(
        `/settings/anaf/${form.cui.replace(/\D/g, '')}`,
      );
      if (result.found && result.name) {
        setForm((p) => ({ ...p, name: result.name!, address: result.address ?? p.address, city: result.city ?? p.city, county: result.county ?? p.county, phone: result.phone ?? p.phone }));
        setDirty(true);
        toast(s.companyDataFetched, 'success');
      } else {
        toast(s.cuiNotFound, 'warning');
      }
    } catch { toast(s.anafUnavailable, 'error'); }
    finally { setAnafLoading(false); }
  }

  async function save() {
    setSaving(true);
    try {
      await settingsService.updateCompany(form);
      setDirty(false);
      toast(s.companyDataSaved, 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t.common.noData, 'error');
    } finally { setSaving(false); }
  }

  if (!data) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <SectionCard icon={Building2} title={s.companyData} subtitle={s.companyDataSubtitle}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{s.cui}</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.cui ?? ''}
              onChange={(e) => set('cui', e.target.value)}
              placeholder="RO12345678"
              className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-slate-100 text-sm bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
            />
            <button
              onClick={lookupAnaf}
              disabled={anafLoading}
              title="Lookup in ANAF"
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white text-xs font-medium rounded-xl transition-colors flex-shrink-0"
            >
              {anafLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:block">ANAF</span>
            </button>
          </div>
        </div>
        <InputField label={s.companyName} value={form.name ?? ''} onChange={(v) => set('name', v)} placeholder="Acme SRL" />
        <InputField label={s.address} value={form.address ?? ''} onChange={(v) => set('address', v)} placeholder="Str. Victoriei nr. 1" />
        <InputField label={s.city} value={form.city ?? ''} onChange={(v) => set('city', v)} placeholder="București" />
        <InputField label={s.county} value={form.county ?? ''} onChange={(v) => set('county', v)} placeholder="Ilfov" />
        <InputField label={s.phone} value={form.phone ?? ''} onChange={(v) => set('phone', v)} placeholder="+40 21 000 0000" type="tel" />
        <InputField label={s.email} value={form.email ?? ''} onChange={(v) => set('email', v)} placeholder="office@acme.ro" type="email" />
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{s.defaultVatRate}</label>
          <select
            value={String(form.vatRate ?? 19)}
            onChange={(e) => set('vatRate', Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-slate-100 text-sm bg-white dark:bg-[#070b11] dark:[&>option]:bg-[#0d1117] focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            <option value={0}>0% (exempt)</option>
            <option value={5}>5%</option>
            <option value={9}>9%</option>
            <option value={19}>19% (standard)</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-5">
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-white/[0.05] disabled:text-slate-400 text-white font-semibold text-sm rounded-xl transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {s.saveChanges}
        </button>
      </div>
    </SectionCard>
  );
}

function InvoiceSeriesSection() {
  const { t } = useLanguage();
  const s = t.settings;
  const [series, setSeries] = useState<InvoiceSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', prefix: '', nextNumber: '1', isDefault: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setSeries(await settingsService.getInvoiceSeries()); }
    catch { toast(t.common.noData, 'error'); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  function openNew() { setForm({ name: '', prefix: '', nextNumber: '1', isDefault: false }); setEditId(null); setShowForm(true); }
  function openEdit(s: InvoiceSeries) {
    setForm({ name: s.name, prefix: s.prefix, nextNumber: String(s.nextNumber), isDefault: s.isDefault });
    setEditId(s.id); setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.prefix.trim()) { toast(s.nameAndPrefixRequired, 'warning'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, prefix: form.prefix, nextNumber: Number(form.nextNumber) || 1, isDefault: form.isDefault };
      if (editId) { await settingsService.updateInvoiceSeries(editId, payload); toast(s.seriesUpdated, 'success'); }
      else { await settingsService.createInvoiceSeries(payload); toast(s.seriesCreated, 'success'); }
      setShowForm(false); await load();
    } catch (err) { toast(err instanceof Error ? err.message : t.common.noData, 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try { await settingsService.deleteInvoiceSeries(id); toast(s.seriesDeleted, 'success'); await load(); }
    catch (err) { toast(err instanceof Error ? err.message : t.common.noData, 'error'); }
  }

  return (
    <SectionCard icon={FileText} title={s.invoiceSeries} subtitle={s.invoiceSeriesSubtitle}>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {series.length === 0 && !showForm && (
              <p className="text-sm text-slate-400 text-center py-4">{s.noSeriesYet}</p>
            )}
            {series.map((sr) => (
              <div key={sr.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-blue-500/20 bg-white dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-700 dark:text-blue-300 text-sm tracking-wide">{sr.prefix}</span>
                    {sr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> {s.isDefault}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sr.name} · Next: <span className="text-slate-700 dark:text-slate-200 font-medium">#{sr.nextNumber}</span></p>
                </div>
                <button onClick={() => openEdit(sr)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                {!sr.isDefault && (
                  <button onClick={() => handleDelete(sr.id)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>

          {showForm && (
            <div className="border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-500/5 space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField label={s.seriesName} value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} placeholder="Main Series" />
                <InputField label={s.prefix} value={form.prefix} onChange={(v) => setForm((p) => ({ ...p, prefix: v }))} placeholder="FACT" />
              </div>
              <InputField label={s.nextNumber} value={form.nextNumber} onChange={(v) => setForm((p) => ({ ...p, nextNumber: v }))} type="number" placeholder="1" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{s.setAsDefault}</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editId ? s.update : s.addSeries}
                </button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-sm rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> {t.common.cancel}
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 dark:border-white/[0.1] hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium rounded-xl transition-all w-full justify-center">
              <Plus className="w-4 h-4" /> {s.addSeries}
            </button>
          )}
        </>
      )}
    </SectionCard>
  );
}

function BankAccountsSection() {
  const { t } = useLanguage();
  const s = t.settings;
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ bankName: '', iban: '', accountHolder: '', currency: 'RON', isDefault: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setAccounts(await settingsService.getBankAccounts()); }
    catch { toast(t.common.noData, 'error'); }
    finally { setLoading(false); }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  function openNew() { setForm({ bankName: '', iban: '', accountHolder: '', currency: 'RON', isDefault: false }); setEditId(null); setShowForm(true); }
  function openEdit(a: BankAccount) {
    setForm({ bankName: a.bankName, iban: a.iban, accountHolder: a.accountHolder, currency: a.currency, isDefault: a.isDefault });
    setEditId(a.id); setShowForm(true);
  }

  async function handleSave() {
    if (!form.bankName.trim() || !form.iban.trim() || !form.accountHolder.trim()) { toast(s.bankFieldsRequired, 'warning'); return; }
    setSaving(true);
    try {
      if (editId) { await settingsService.updateBankAccount(editId, form); toast(s.bankAccountUpdated, 'success'); }
      else { await settingsService.createBankAccount(form); toast(s.bankAccountAdded, 'success'); }
      setShowForm(false); await load();
    } catch (err) { toast(err instanceof Error ? err.message : t.common.noData, 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try { await settingsService.deleteBankAccount(id); toast(s.bankAccountDeleted, 'success'); await load(); }
    catch (err) { toast(err instanceof Error ? err.message : t.common.noData, 'error'); }
  }

  return (
    <SectionCard icon={Landmark} title={s.bankAccounts} subtitle={s.bankAccountsSubtitle}>
      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {accounts.length === 0 && !showForm && (
              <p className="text-sm text-slate-400 text-center py-4">{s.noBankAccountsYet}</p>
            )}
            {accounts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">{a.bankName}</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{a.currency}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3" /> {s.isDefault}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-mono">{a.iban}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">{a.accountHolder}</p>
                </div>
                <button onClick={() => openEdit(a)} className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>

          {showForm && (
            <div className="border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 bg-blue-50/50 dark:bg-blue-500/5 space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InputField label={s.bankName} value={form.bankName} onChange={(v) => setForm((p) => ({ ...p, bankName: v }))} placeholder="Banca Transilvania" />
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{s.currency}</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-slate-100 text-sm bg-white dark:bg-[#070b11] dark:[&>option]:bg-[#0d1117] focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                  >
                    {['RON', 'EUR', 'USD'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <InputField label={s.iban} value={form.iban} onChange={(v) => setForm((p) => ({ ...p, iban: v }))} placeholder="RO49AAAA1B31007593840000" />
              <InputField label={s.accountHolder} value={form.accountHolder} onChange={(v) => setForm((p) => ({ ...p, accountHolder: v }))} placeholder="Acme SRL" />
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{s.setAsDefaultAccount}</span>
              </label>
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {editId ? s.update : s.addBankAccount}
                </button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-1 px-4 py-2 border border-slate-200 dark:border-white/[0.1] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06] text-sm rounded-xl transition-colors">
                  <X className="w-3.5 h-3.5" /> {t.common.cancel}
                </button>
              </div>
            </div>
          )}

          {!showForm && (
            <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 dark:border-white/[0.1] hover:border-blue-300 dark:hover:border-blue-500/40 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium rounded-xl transition-all w-full justify-center">
              <Plus className="w-4 h-4" /> {s.addBankAccount}
            </button>
          )}
        </>
      )}
    </SectionCard>
  );
}

export default function SettingsPage() {
  const { t } = useLanguage();
  return (
    <AppLayout title={t.settings.title}>
      <ToastContainer />
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t.settings.invoicingSettings}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t.settings.configureSubtitle}</p>
        </div>
        <div className="space-y-6">
          <CompanySection />
          <InvoiceSeriesSection />
          <BankAccountsSection />
        </div>
      </div>
    </AppLayout>
  );
}
