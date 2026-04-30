"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Bell,
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  User,
  AlertCircle,
  Send,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { remindersService } from "@/services/reminders.service";
import { clientsService } from "@/services/clients.service";
import { formatDateTime } from "@/utils/format";
import type { Reminder, Client } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function relativeDate(
  dateStr: string,
  t: { today: string; yesterday: string; daysAgo: string },
): string {
  const d = daysSince(dateStr);
  if (d === 0) return t.today;
  if (d === 1) return t.yesterday;
  return `${d} ${t.daysAgo}`;
}

function reminderLevelLabel(
  count: number,
  t: { firstNotice: string; secondNotice: string; finalNotice: string },
): { label: string; cls: string } {
  if (count === 1)
    return {
      label: t.firstNotice,
      cls: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    };
  if (count === 2)
    return {
      label: t.secondNotice,
      cls: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    };
  return {
    label: t.finalNotice,
    cls: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientGroup {
  clientId: number;
  clientName: string;
  email: string;
  reminders: Reminder[];
}

function groupByClient(reminders: Reminder[]): ClientGroup[] {
  const map = new Map<number, ClientGroup>();
  for (const r of reminders) {
    const clientId = r.invoice?.client?.id ?? r.invoiceId;
    const clientName = r.invoice?.client?.name ?? `Invoice #${r.invoiceId}`;
    const email = r.recipient;
    if (!map.has(clientId)) {
      map.set(clientId, { clientId, clientName, email, reminders: [] });
    }
    map.get(clientId)!.reminders.push(r);
  }
  // Sort groups by most recent reminder first
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.reminders[0].sentAt).getTime() -
      new Date(a.reminders[0].sentAt).getTime(),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  return status === "SENT" ? (
    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
  ) : (
    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
  );
}

function ClientReminderCard({
  group,
  onSend,
  sending,
  successMsg,
  t,
}: {
  group: ClientGroup;
  onSend: (clientId: number) => void;
  sending: boolean;
  successMsg: string | null;
  t: ReturnType<typeof useLanguage>["t"]["reminders"];
}) {
  const [open, setOpen] = useState(false);

  const sentCount = group.reminders.filter((r) => r.status === "SENT").length;
  const failedCount = group.reminders.filter(
    (r) => r.status === "FAILED",
  ).length;
  const latest = group.reminders[0];
  const daysSinceLatest = daysSince(latest.sentAt);
  const isRecentlySent = daysSinceLatest === 0;
  const { label: levelLabel, cls: levelCls } = reminderLevelLabel(sentCount, t);

  // Compute initials from client name
  const initials = group.clientName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                {group.clientName}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                {group.email}
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${levelCls}`}
              >
                {levelLabel}
              </span>
              {failedCount > 0 && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                  {failedCount} {t.failed_count}
                </span>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-2.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Send className="w-3 h-3" />
              {sentCount} {t.remindersSent}
            </span>
            <span
              className={`flex items-center gap-1.5 text-xs font-medium ${
                isRecentlySent
                  ? "text-emerald-600 dark:text-emerald-400"
                  : daysSinceLatest >= 7
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Clock className="w-3 h-3" />
              {t.lastSent}: {relativeDate(latest.sentAt, t)}
            </span>
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="px-5 pb-4 flex items-center justify-between gap-3 border-t border-slate-50 dark:border-white/[0.05] pt-3">
        {successMsg ? (
          <span className="flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {successMsg}
          </span>
        ) : (
          <button
            onClick={() => onSend(group.clientId)}
            disabled={sending}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className={`w-3.5 h-3.5 ${sending ? "animate-pulse" : ""}`} />
            {sending ? t.sending : t.sendReminder}
          </button>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {t.history}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Timeline — collapsible */}
      <div className={open ? "accordion-open" : "accordion-closed"}>
        <div className="border-t border-slate-100 dark:border-white/[0.06] px-5 py-3 space-y-0 bg-slate-50/50 dark:bg-[#070b11]">
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
            {t.reminderHistory}
          </p>
          {group.reminders.map((r, idx) => {
            const invoiceRef = r.invoice
              ? `${r.invoice.series ?? ""}${r.invoice.number}`
              : `#${r.invoiceId}`;
            const isLast = idx === group.reminders.length - 1;

            return (
              <div key={r.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-1.5">
                  <StatusDot status={r.status} />
                  {!isLast && (
                    <div className="w-px flex-1 bg-slate-200 dark:bg-white/[0.1] mt-1.5 min-h-[20px]" />
                  )}
                </div>
                <div
                  className={`flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-1 pb-3 ${isLast ? "" : ""}`}
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
                        {invoiceRef}
                      </span>
                      {r.status === "SENT" ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {t.delivered}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {t.failed}
                        </span>
                      )}
                    </div>
                    {r.errorMsg && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />{" "}
                        {r.errorMsg}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {formatDateTime(r.sentAt)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RemindersPage() {
  const { t } = useLanguage();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<{
    totalCreated: number;
    label?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [successMsgs, setSuccessMsgs] = useState<Record<number, string>>({});

  // Specific-client send panel
  const [showClientPanel, setShowClientPanel] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [sendingToClient, setSendingToClient] = useState(false);

  function load() {
    setLoading(true);
    remindersService
      .getAll()
      .then(setReminders)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    clientsService
      .getAll()
      .then(setClients)
      .catch(() => {});
  }, []);

  async function handleProcessAll() {
    setProcessing(true);
    setProcessResult(null);
    try {
      const res = await remindersService.process();
      setProcessResult({ totalCreated: res.totalCreated });
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to process reminders");
    } finally {
      setProcessing(false);
    }
  }

  async function handleSendToGroupClient(clientId: number) {
    const group = groups.find((g) => g.clientId === clientId);
    if (!group?.email) {
      alert("This client has no email address.");
      return;
    }
    setSendingId(clientId);
    try {
      const res = await remindersService.sendToClient(clientId);
      const msg =
        res.totalCreated > 0
          ? `${res.totalCreated} ${t.reminders.newRemindersSent}`
          : t.reminders.noOverdueFound;
      setSuccessMsgs((prev) => ({ ...prev, [clientId]: msg }));
      setTimeout(
        () =>
          setSuccessMsgs((prev) => {
            const n = { ...prev };
            delete n[clientId];
            return n;
          }),
        4000,
      );
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setSendingId(null);
    }
  }

  async function handleSendToNewClient() {
    if (!selectedClientId) return;
    const client = clients.find((c) => c.id === Number(selectedClientId));
    if (!client) return;
    if (!client.email) {
      alert(`${client.name} has no email address.`);
      return;
    }
    setSendingToClient(true);
    setProcessResult(null);
    try {
      const res = await remindersService.sendToClient(Number(selectedClientId));
      setProcessResult({ totalCreated: res.totalCreated, label: client.name });
      setShowClientPanel(false);
      setSelectedClientId("");
      load();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to send reminder");
    } finally {
      setSendingToClient(false);
    }
  }

  const groups = groupByClient(reminders);
  const sentCount = reminders.filter((r) => r.status === "SENT").length;
  const failedCount = reminders.filter((r) => r.status === "FAILED").length;
  const uniqueClients = groups.length;

  // Clients not yet in any reminder group (never reminded)
  const unremindedClients = clients.filter(
    (c) => !groups.some((g) => g.clientId === c.id),
  );

  return (
    <AppLayout title={t.reminders.title}>
      <div className="space-y-5">
        {/* ── Toolbar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Stats + actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Stats pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Bell className="w-4 h-4" />
                {reminders.length} {t.reminders.title.toLowerCase()}
              </span>
              {reminders.length > 0 && (
                <>
                  <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-full">
                    {uniqueClients} {t.reminders.clients}
                  </span>
                  <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full">
                    {sentCount} {t.reminders.delivered_count}
                  </span>
                  {failedCount > 0 && (
                    <span className="text-xs font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20 px-2.5 py-1 rounded-full">
                      {failedCount} {t.reminders.failed_count}
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowClientPanel((v) => !v)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                  showClientPanel
                    ? "bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-white/[0.1]"
                    : "bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-white/[0.05]"
                }`}
              >
                <User className="w-4 h-4" />
                {t.reminders.sendToClient}
              </button>
              <button
                onClick={handleProcessAll}
                disabled={processing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${processing ? "animate-spin" : ""}`}
                />
                {processing ? t.reminders.processing : t.reminders.processAllOverdue}
              </button>
            </div>
          </div>

          {/* ── Specific client panel ──────────────────────────────────── */}
          {showClientPanel && (
            <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center shadow-sm">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  {t.reminders.selectClient}
                </p>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full text-sm text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#070b11] border border-slate-200 dark:border-white/[0.1] rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500/40 [&>option]:bg-white dark:[&>option]:bg-[#0d1117] transition"
                >
                  <option value="">{t.reminders.chooseClient}</option>
                  {unremindedClients.length > 0 && (
                    <optgroup label={t.reminders.neverReminded}>
                      {unremindedClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                          {!c.email ? ` (${t.reminders.noEmail})` : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {groups.length > 0 && (
                    <optgroup label={t.reminders.previouslyReminded}>
                      {groups.map((g) => (
                        <option key={g.clientId} value={g.clientId}>
                          {g.clientName}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <button
                onClick={handleSendToNewClient}
                disabled={!selectedClientId || sendingToClient}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap shadow-sm"
              >
                <Send
                  className={`w-4 h-4 ${sendingToClient ? "animate-pulse" : ""}`}
                />
                {sendingToClient ? t.reminders.sending : t.reminders.sendReminder}
              </button>
            </div>
          )}

          {/* Result banner */}
          {processResult !== null && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {processResult.totalCreated > 0
                ? `${processResult.totalCreated} ${t.reminders.newRemindersSent}${processResult.label ? ` — ${processResult.label}` : ""}`
                : `${t.reminders.noOverdueFound}${processResult.label ? ` — ${processResult.label}` : ""}`}
            </div>
          )}
        </div>

        {/* ── Info banner ───────────────────────────────────────────────────── */}
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
          <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <p><strong>{t.reminders.processAllOverdue}</strong> — {t.reminders.infoProcessAll.replace(t.reminders.processAllOverdue + ' — ', '')}</p>
            <p><strong>{t.reminders.sendToClient}</strong> — {t.reminders.infoSendToClient.replace(t.reminders.sendToClient + ' — ', '')}</p>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              {t.reminders.infoAutoDisappear}
            </p>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────────── */}
        {loading && (
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
            {t.reminders.loadingReminders}
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && groups.length === 0 && (
          <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mx-auto">
              <Bell className="w-7 h-7 text-slate-400 dark:text-slate-500" />
            </div>
            <div>
              <p className="text-slate-700 dark:text-slate-200 font-semibold">
                {t.reminders.noReminders}
              </p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                {t.reminders.noRemindersDesc}
              </p>
            </div>
          </div>
        )}

        {/* ── Client cards ──────────────────────────────────────────────────── */}
        {!loading && groups.length > 0 && (
          <div className="space-y-3">
            {/* Section header */}
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {t.reminders.historyTitle} — {uniqueClients} {t.reminders.clients}
              </p>
            </div>

            {groups.map((group) => (
              <ClientReminderCard
                key={group.clientId}
                group={group}
                onSend={handleSendToGroupClient}
                sending={sendingId === group.clientId}
                successMsg={successMsgs[group.clientId] ?? null}
                t={t.reminders}
              />
            ))}
          </div>
        )}

        {/* ── Unreminded clients callout ────────────────────────────────────── */}
        {!loading && unremindedClients.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {unremindedClients.length} {t.reminders.neverRemindedCount}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                {unremindedClients.map((c) => c.name).join(", ")} — {t.reminders.neverRemindedHint}
              </p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
