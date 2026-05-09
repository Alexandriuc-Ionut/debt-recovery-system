"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  AlertCircle,
  ArrowRight,
  CheckCheck,
  Check,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";
import { onrcMonitorService, type OnrcAlert } from "@/services/onrc-monitor.service";
import { formatCompactCurrency } from "@/utils/format";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AuthUser } from "@/types";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

type OverdueInvoice = {
  id: number;
  number: string;
  clientName: string;
  dueDate: string;
  totalAmount: string;
  currency: string;
  status: string;
  overdueDays: number;
};

const ALERT_COLORS: Record<string, string> = {
  STATUS_INACTIVE: "text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-500/15",
  STATUS_SUSPENDED: "text-orange-500 dark:text-orange-400 bg-orange-100 dark:bg-orange-500/15",
  VAT_LOST: "text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15",
  VAT_GAINED: "text-emerald-500 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15",
  NAME_CHANGED: "text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15",
};

const ALERT_LABELS: Record<string, string> = {
  STATUS_INACTIVE: "INACTIV",
  STATUS_SUSPENDED: "SUSPENDAT",
  VAT_LOST: "TVA PIERDUT",
  VAT_GAINED: "TVA OBȚINUT",
  NAME_CHANGED: "DENUMIRE",
};

function storageKey(userId: string) {
  return `readNotifications_${userId}`;
}

function getReadIds(userId: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<number>, userId: string) {
  localStorage.setItem(storageKey(userId), JSON.stringify([...ids]));
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { t } = useLanguage();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notifications, setNotifications] = useState<OverdueInvoice[]>([]);
  const [onrcAlerts, setOnrcAlerts] = useState<OnrcAlert[]>([]);
  const [scanning, setScanning] = useState(false);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    const u = authService.getUser();
    setUser(u);
    setReadIds(getReadIds(u?.email ?? "guest"));
  }, []);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = user?.email ?? "guest";
  const invoiceUnread = notifications.filter((n) => !readIds.has(n.id)).length;
  const onrcUnread = onrcAlerts.filter((a) => !a.isRead).length;
  const unreadCount = invoiceUnread + onrcUnread;

  const loadNotifications = useCallback((uid: string) => {
    setLoading(true);
    Promise.all([
      dashboardService.getOverdueInvoices(),
      onrcMonitorService.getAlerts(),
    ])
      .then(([invoices, alerts]) => {
        setNotifications(invoices);
        setOnrcAlerts(alerts);
        const ids = getReadIds(uid);
        const validIds = new Set(
          [...ids].filter((id) => invoices.some((n) => n.id === id)),
        );
        setReadIds(validIds);
        saveReadIds(validIds, uid);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    dashboardService.getOverdueCount().catch(() => {});
    void Promise.resolve().then(() => loadNotifications(userId));
  }, [loadNotifications, userId]);

  useEffect(() => {
    if (open) void Promise.resolve().then(() => loadNotifications(userId));
  }, [open, loadNotifications, userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function markRead(id: number) {
    const next = new Set(readIds).add(id);
    setReadIds(next);
    saveReadIds(next, userId);
  }

  function markAllRead() {
    const next = new Set(notifications.map((n) => n.id));
    setReadIds(next);
    saveReadIds(next, userId);
    // Mark ONRC alerts read on backend
    void onrcMonitorService.markAllRead().then(() =>
      setOnrcAlerts((prev) => prev.map((a) => ({ ...a, isRead: true }))),
    );
  }

  function markOnrcRead(id: number) {
    void onrcMonitorService.markRead(id).then(() =>
      setOnrcAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
      ),
    );
  }

  async function handleScan() {
    setScanning(true);
    try {
      await onrcMonitorService.scan();
      const alerts = await onrcMonitorService.getAlerts();
      setOnrcAlerts(alerts);
    } catch {
      // silently fail
    } finally {
      setScanning(false);
    }
  }

  const initials = user
    ? (user.fullName ?? user.email).slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="h-16 bg-white/80 dark:bg-[#080d14]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight tracking-tight">
          {title}
        </h1>
      </div>

      {user && (
        <div className="flex items-center gap-2 relative" ref={panelRef}>
          {/* Bell */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-[380px] max-w-[calc(100vw-1rem)] bg-white dark:bg-[#0f1623] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl shadow-2xl dark:shadow-black/60 overflow-hidden z-50 ring-1 ring-black/5 dark:ring-white/[0.04]">

              {/* Panel header */}
              <div className="px-4 pt-4 pb-3 bg-gradient-to-br from-slate-50 to-white dark:from-[#141c2b] dark:to-[#0f1623] border-b border-slate-100 dark:border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                        {t.notifications.overdueInvoices}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">
                        {invoiceUnread > 0 ? `${invoiceUnread} ${t.notifications.newBadge}` : `${notifications.length} facturi`}
                      </p>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t.notifications.readAll}
                    </button>
                  )}
                </div>
              </div>

              {/* Overdue invoice list */}
              <div className="max-h-[220px] overflow-y-auto">
                {loading && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                    {t.notifications.loading}
                  </div>
                )}
                {!loading && notifications.length === 0 && (
                  <div className="px-4 py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
                      <CheckCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t.notifications.allCaughtUp}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {t.notifications.noOverdue}
                    </p>
                  </div>
                )}
                {!loading && notifications.map((inv, idx) => {
                  const isRead = readIds.has(inv.id);
                  return (
                    <div
                      key={inv.id}
                      className={`group relative flex items-center gap-3 px-4 py-3 transition-colors ${idx > 0 ? "border-t border-slate-100 dark:border-white/[0.04]" : ""} ${isRead ? "opacity-40" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"}`}
                    >
                      {!isRead && (
                        <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full ${inv.overdueDays > 60 ? "bg-red-500" : inv.overdueDays > 30 ? "bg-orange-400" : "bg-amber-400"}`} />
                      )}
                      <Link href="/invoices" onClick={() => markRead(inv.id)} className="flex-1 min-w-0 pl-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight">{inv.clientName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{inv.number}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                              {formatCompactCurrency(Number(inv.totalAmount), inv.currency)}
                            </p>
                            <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${inv.overdueDays > 60 ? "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400" : inv.overdueDays > 30 ? "bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400" : "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"}`}>
                              +{inv.overdueDays}{t.notifications.daysOverdue}
                            </span>
                          </div>
                        </div>
                      </Link>
                      {!isRead && (
                        <button onClick={() => markRead(inv.id)} title={t.notifications.markAsRead}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ONRC Watchdog section */}
              <div className="border-t border-slate-100 dark:border-white/[0.06]">
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">ONRC Watchdog</p>
                      {onrcUnread > 0 && (
                        <p className="text-[10px] text-amber-500 dark:text-amber-400 leading-tight">{onrcUnread} alertă nouă</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleScan}
                    disabled={scanning}
                    title="Scanează clienții via ANAF"
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-blue-50 dark:hover:bg-blue-500/10 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${scanning ? "animate-spin" : ""}`} />
                    {scanning ? "Scanare..." : "Scanează"}
                  </button>
                </div>

                <div className="max-h-[160px] overflow-y-auto pb-1">
                  {onrcAlerts.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 text-center">
                      Nicio alertă ONRC. Apasă Scanează pentru a verifica clienții.
                    </p>
                  ) : (
                    onrcAlerts.map((alert, idx) => {
                      const colorClass = ALERT_COLORS[alert.alertType] ?? "text-slate-500 bg-slate-100 dark:bg-white/5";
                      const label = ALERT_LABELS[alert.alertType] ?? alert.alertType;
                      return (
                        <div
                          key={alert.id}
                          className={`group flex items-start gap-2.5 px-4 py-2.5 transition-colors ${idx > 0 ? "border-t border-slate-100 dark:border-white/[0.04]" : ""} ${alert.isRead ? "opacity-40" : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"}`}
                        >
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 flex-shrink-0 ${colorClass}`}>
                            {label}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1 min-w-0">
                            {alert.description}
                          </p>
                          {!alert.isRead && (
                            <button
                              onClick={() => markOnrcRead(alert.id)}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02]">
                <Link
                  href="/invoices"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-0.5"
                >
                  {t.notifications.viewAllInvoices}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* User info */}
          <Link
            href="/profile"
            className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/[0.08] ml-1 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
                {user.fullName ?? user.email}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                {user.role.toLowerCase()}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-900/30 flex-shrink-0">
              {initials}
            </div>
          </Link>
        </div>
      )}
    </header>
  );
}
