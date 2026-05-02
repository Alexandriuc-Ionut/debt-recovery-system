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
  RefreshCw,
} from "lucide-react";

const LIMIT = 20;
import AppLayout from "@/components/layout/AppLayout";
import Modal from "@/components/ui/Modal";
import { useLanguage } from "@/contexts/LanguageContext";
import Badge, { invoiceStatusBadge } from "@/components/ui/Badge";
import { invoicesService } from "@/services/invoices.service";
import { clientsService } from "@/services/clients.service";
import { noticesService, triggerPdfDownload } from "@/services/notices.service";
import { formatCompactCurrency, formatDate } from "@/utils/format";
import type { Client, Invoice, InvoiceStatus } from "@/types";

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
  const [total, setTotal] = useState(0);
  const [nextPage, setNextPage] = useState(2);
  const [clients, setClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">(
    "ALL",
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
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

  function load(reset = false) {
    if (reset) setLoading(true);
    else setLoadingMore(true);
    invoicesService
      .getAll(status, reset ? 1 : nextPage, LIMIT)
      .then(({ data, total: t }) => {
        setTotal(t);
        setInvoices((prev) => (reset ? data : [...prev, ...data]));
        setNextPage(reset ? 2 : (p) => p + 1);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }

  useEffect(() => {
    load(true);
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
      load(true);
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
      load(true);
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
  const hasMore = invoices.length < total;

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

              {/* Load more */}
              {hasMore && !search && (
                <div className="flex flex-col items-center gap-1 py-4 border-t border-slate-100 dark:border-white/[0.06]">
                  <button
                    onClick={() => load(false)}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingMore ? "animate-spin" : ""}`} />
                    {loadingMore ? "Loading…" : `Load more (${total - invoices.length} remaining)`}
                  </button>
                  <p className="text-xs text-slate-400">{invoices.length} of {total} invoices loaded</p>
                </div>
              )}
              {!hasMore && total > LIMIT && (
                <p className="text-center text-xs text-slate-400 py-3 border-t border-slate-100 dark:border-white/[0.06]">
                  All {total} invoices loaded
                </p>
              )}
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
    </AppLayout>
  );
}
