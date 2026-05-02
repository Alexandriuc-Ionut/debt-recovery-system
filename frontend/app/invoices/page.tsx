"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Ban,
  Pencil,
  Calendar,
  DollarSign,
  FileDown,
  Download,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import Badge, { invoiceStatusBadge } from "@/components/ui/Badge";
import { invoicesService } from "@/services/invoices.service";
import { clientsService } from "@/services/clients.service";
import { noticesService, triggerPdfDownload } from "@/services/notices.service";
import { formatCompactCurrency, formatDate } from "@/utils/format";
import type { Client, Invoice, InvoiceStatus } from "@/types";

type CsvRow = {
  series: string; number: string; clientName: string;
  issueDate: string; dueDate: string; totalAmount: string;
  currency: string; notes: string;
  clientId?: number; error?: string;
};

function parseCsv(text: string, clients: { id: number; name: string }[]): CsvRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const rows = lines.slice(1); // skip header
  return rows.map((line) => {
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const [series = '', number = '', clientName = '', issueDate = '', dueDate = '', totalAmount = '', currency = 'RON', notes = ''] = cols;
    const matched = clients.find((c) => c.name.toLowerCase() === clientName.toLowerCase());
    return {
      series, number, clientName, issueDate, dueDate, totalAmount, currency, notes,
      clientId: matched?.id,
      error: !number ? 'Missing number' : !clientName ? 'Missing client' : !matched ? `Client "${clientName}" not found` : !issueDate ? 'Missing issue date' : !dueDate ? 'Missing due date' : !totalAmount ? 'Missing amount' : undefined,
    };
  });
}

const emptyForm = {
  clientId: "",
  series: "",
  number: "",
  issueDate: "",
  dueDate: "",
  totalAmount: "",
  currency: "RON",
  notes: "",
};

export default function InvoicesPage() {
  const { t, lang } = useLanguage();

  const statusFilters: { label: string; value: InvoiceStatus | "ALL" }[] = [
    { label: t.common.all, value: "ALL" },
    { label: t.invoices.open, value: "OPEN" },
    { label: t.invoices.partial, value: "PARTIAL" },
    { label: t.invoices.paid, value: "PAID" },
    { label: t.invoices.canceled, value: "CANCELED" },
  ];

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  function openEdit(inv: Invoice) {
    setEditId(inv.id);
    setForm({
      clientId: String(inv.clientId),
      series: inv.series ?? "",
      number: inv.number,
      issueDate: inv.issueDate.slice(0, 10),
      dueDate: inv.dueDate.slice(0, 10),
      totalAmount: String(inv.totalAmount),
      currency: inv.currency,
      notes: inv.notes ?? "",
    });
    setModalOpen(true);
  }
  const [search, setSearch] = useState("");

  const status = statusFilter === "ALL" ? undefined : statusFilter;

  function load() {
    setLoading(true);
    invoicesService
      .getAll(status, 1, 10000)
      .then(({ data }) => setInvoices(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);
  useEffect(() => {
    clientsService
      .getAll()
      .then(setClients)
      .catch(() => {});
  }, []);

  async function handleCreate(e: { preventDefault(): void }) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      if (editId) {
        await invoicesService.update(editId, {
          dueDate: form.dueDate,
          totalAmount: Number(form.totalAmount),
          currency: form.currency || "RON",
          notes: form.notes || undefined,
        });
      } else {
        await invoicesService.create({
          clientId: Number(form.clientId),
          series: form.series || undefined,
          number: form.number,
          issueDate: form.issueDate,
          dueDate: form.dueDate,
          totalAmount: Number(form.totalAmount),
          currency: form.currency || "RON",
          notes: form.notes || undefined,
        });
      }
      setModalOpen(false);
      setEditId(null);
      setForm(emptyForm);
      load();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Failed to save invoice",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(id: number) {
    if (!confirm("Cancel this invoice?")) return;
    try {
      await invoicesService.cancel(id);
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel invoice");
    }
  }

  async function handleDownloadSomatie(inv: Invoice) {
    setDownloadingId(inv.id);
    try {
      const blob = await noticesService.downloadSomatie(inv.id, lang);
      const ref = inv.series ? `${inv.series}-${inv.number}` : inv.number;
      const filename =
        lang === "en" ? `payment-notice-${ref}.pdf` : `somatie-${ref}.pdf`;
      triggerPdfDownload(blob, filename);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to generate notice");
    } finally {
      setDownloadingId(null);
    }
  }

  const fieldClass =
    "w-full border border-slate-200 dark:border-white/[0.1] rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-[#070b11] placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 dark:focus:border-blue-500/40 transition";

  const filteredInvoices = invoices.filter((inv) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (inv.client?.name ?? "").toLowerCase().includes(q) ||
      inv.number.includes(q) ||
      (inv.series ?? "").toLowerCase().includes(q) ||
      inv.issueDate.slice(0, 10).includes(q) ||
      inv.dueDate.slice(0, 10).includes(q)
    );
  });
  return (
    <AppLayout title={t.invoices.title}>
      <div className="space-y-5">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1 bg-slate-100 dark:bg-white/[0.05] rounded-lg p-1 overflow-x-auto">
              {statusFilters.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    statusFilter === value
                      ? "bg-white dark:bg-blue-600/20 dark:border dark:border-blue-500/30 text-slate-900 dark:text-blue-300 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                placeholder="Search client or date…"
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#070b11] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition w-48"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                invoicesService
                  .exportSaga()
                  .catch((e: Error) => alert(e.message))
              }
              className="flex items-center gap-2 bg-white dark:bg-[#0d1117]/80 border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              title="Export to SAGA CSV"
            >
              <Download className="w-4 h-4" />
              Export SAGA
            </button>
            <label className="flex items-center gap-2 bg-white dark:bg-[#0d1117]/80 border border-slate-200 dark:border-white/[0.1] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer">
              <Upload className="w-4 h-4" />
              {t.invoices.importCsv ?? "Import CSV"}
              <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                file.text().then((text) => { setCsvRows(parseCsv(text, clients)); setImportResult(null); });
                e.target.value = '';
              }} />
            </label>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {t.invoices.addInvoice}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
          {loading && (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
              {t.common.loading}
            </div>
          )}
          {error && (
            <div className="p-6 text-sm text-red-600 bg-red-50">{error}</div>
          )}
          {!loading && !error && (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.06]">
                      {[
                        t.invoices.invoiceNumber,
                        t.invoices.client,
                        t.invoices.issueDate,
                        t.invoices.dueDate,
                        t.common.amount,
                        t.common.status,
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                    {filteredInvoices.map((inv) => {
                      const { label, variant } = invoiceStatusBadge(inv.status);
                      const isOverdue =
                        inv.status === "OPEN" &&
                        new Date(inv.dueDate) < new Date();
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group"
                        >
                          <td className="px-5 py-4 font-mono font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {inv.series ?? ""}
                            {inv.number}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-100">
                            {inv.client?.name ?? `Client #${inv.clientId}`}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(inv.issueDate)}
                          </td>
                          <td
                            className={`px-5 py-4 text-xs whitespace-nowrap font-medium ${isOverdue ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}
                          >
                            {formatDate(inv.dueDate)}
                            {isOverdue && (
                              <span className="ml-1.5 text-[10px] bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full font-semibold">
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900 dark:text-slate-100">
                            {formatCompactCurrency(
                              inv.totalAmount,
                              inv.currency,
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <Badge label={label} variant={variant} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              {isOverdue && (
                                <button
                                  onClick={() => handleDownloadSomatie(inv)}
                                  disabled={downloadingId === inv.id}
                                  className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 font-semibold disabled:opacity-40 whitespace-nowrap"
                                  title="Download somație PDF"
                                >
                                  <FileDown className="w-3.5 h-3.5" />
                                  {downloadingId === inv.id ? "…" : "Somație"}
                                </button>
                              )}
                              {inv.status !== "CANCELED" &&
                                inv.status !== "PAID" && (
                                  <>
                                    <button
                                      onClick={() => openEdit(inv)}
                                      className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                      title="Edit"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleCancel(inv.id)}
                                      className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                      title="Cancel invoice"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-5 py-12 text-center text-slate-400 text-sm"
                        >
                          {search
                            ? "No invoices match your search."
                            : "No invoices found."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.05]">
                {filteredInvoices.map((inv) => {
                  const { label, variant } = invoiceStatusBadge(inv.status);
                  const isOverdue =
                    inv.status === "OPEN" && new Date(inv.dueDate) < new Date();
                  return (
                    <div key={inv.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {inv.client?.name ?? `Client #${inv.clientId}`}
                          </p>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            {inv.series ?? ""}
                            {inv.number}
                          </p>
                        </div>
                        <Badge label={label} variant={variant} />
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {formatCompactCurrency(inv.totalAmount, inv.currency)}
                      </p>
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Issued{" "}
                          {formatDate(inv.issueDate)}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}
                        >
                          <Calendar className="w-3.5 h-3.5" /> Due{" "}
                          {formatDate(inv.dueDate)}
                          {isOverdue && " (Overdue)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        {isOverdue && (
                          <button
                            onClick={() => handleDownloadSomatie(inv)}
                            disabled={downloadingId === inv.id}
                            className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1 font-semibold disabled:opacity-40"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            {downloadingId === inv.id
                              ? "Generating…"
                              : "Download Somație"}
                          </button>
                        )}
                        {inv.status !== "CANCELED" && inv.status !== "PAID" && (
                          <>
                            <button
                              onClick={() => openEdit(inv)}
                              className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1 font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleCancel(inv.id)}
                              className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 flex items-center gap-1 font-medium"
                            >
                              <Ban className="w-3.5 h-3.5" /> Cancel Invoice
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredInvoices.length === 0 && (
                  <div className="px-4 py-12 text-center text-slate-400 text-sm">
                    {search
                      ? "No invoices match your search."
                      : "No invoices found."}
                  </div>
                )}
              </div>

            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        title={editId ? t.invoices.editInvoice : t.invoices.addInvoice}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditId(null);
          setForm(emptyForm);
          setFormError("");
        }}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.clientId}
              onChange={(e) =>
                setForm((f) => ({ ...f, clientId: e.target.value }))
              }
              className={fieldClass}
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Series
              </label>
              <input
                value={form.series}
                onChange={(e) =>
                  setForm((f) => ({ ...f, series: e.target.value }))
                }
                placeholder="e.g. FCT"
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Number <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, number: e.target.value }))
                }
                placeholder="001"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Issue Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.issueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issueDate: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dueDate: e.target.value }))
                }
                className={fieldClass}
              />
            </div>
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
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, totalAmount: e.target.value }))
                  }
                  placeholder="1000.00"
                  className={`${fieldClass} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className={fieldClass}
              >
                <option>RON</option>
                <option>EUR</option>
                <option>USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={2}
              placeholder="Optional notes..."
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setForm(emptyForm);
                setFormError("");
              }}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors shadow-sm"
            >
              {submitting ? t.common.loading : t.invoices.addInvoice}
            </button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Modal */}
      {csvRows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0d1829] border border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white text-base">Import CSV</h2>
                <p className="text-xs text-slate-400 mt-0.5">{csvRows.length} rows detected · {csvRows.filter(r => !r.error).length} valid · {csvRows.filter(r => r.error).length} errors</p>
              </div>
              <button onClick={() => { setCsvRows(null); setImportResult(null); }} className="text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>

            {importResult ? (
              <div className="p-6 space-y-4">
                <div className={`flex items-center gap-3 p-4 rounded-xl ${importResult.errors.length === 0 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>
                  {importResult.errors.length === 0
                    ? <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    : <AlertCircle className="w-6 h-6 text-amber-500" />}
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{importResult.created} invoices imported successfully</p>
                    {importResult.errors.length > 0 && <p className="text-sm text-slate-500">{importResult.errors.length} rows failed</p>}
                  </div>
                </div>
                {importResult.errors.map((e) => (
                  <p key={e.row} className="text-xs text-red-600 dark:text-red-400">Row {e.row}: {e.message}</p>
                ))}
                <button onClick={() => { setCsvRows(null); setImportResult(null); load(); }} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">Done</button>
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-1">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-white/[0.03] sticky top-0">
                      <tr>
                        {['#', 'Client', 'Series', 'Number', 'Issue Date', 'Due Date', 'Amount', 'Currency', 'Status'].map(h => (
                          <th key={h} className="px-3 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                      {csvRows.map((row, i) => (
                        <tr key={i} className={row.error ? 'bg-red-50 dark:bg-red-500/5' : ''}>
                          <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{row.clientName}</td>
                          <td className="px-3 py-2 font-mono text-slate-500">{row.series || '—'}</td>
                          <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{row.number}</td>
                          <td className="px-3 py-2 text-slate-500">{row.issueDate}</td>
                          <td className="px-3 py-2 text-slate-500">{row.dueDate}</td>
                          <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{row.totalAmount}</td>
                          <td className="px-3 py-2 text-slate-500">{row.currency}</td>
                          <td className="px-3 py-2">
                            {row.error
                              ? <span className="text-red-600 dark:text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{row.error}</span>
                              : <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Expected format: <span className="font-mono">series,number,clientName,issueDate,dueDate,totalAmount,currency,notes</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setCsvRows(null); setImportResult(null); }} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Cancel</button>
                    <button
                      disabled={importing || csvRows.filter(r => !r.error).length === 0}
                      onClick={async () => {
                        setImporting(true);
                        try {
                          const rows = csvRows.filter(r => !r.error).map(r => ({
                            clientId: r.clientId!,
                            series: r.series || undefined,
                            number: r.number,
                            issueDate: r.issueDate,
                            dueDate: r.dueDate,
                            totalAmount: Number(r.totalAmount),
                            currency: r.currency || 'RON',
                            notes: r.notes || undefined,
                          }));
                          const result = await invoicesService.createBulk(rows);
                          setImportResult(result);
                        } catch (e) {
                          alert(e instanceof Error ? e.message : 'Import failed');
                        } finally {
                          setImporting(false);
                        }
                      }}
                      className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {importing ? 'Importing…' : `Import ${csvRows.filter(r => !r.error).length} invoices`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
