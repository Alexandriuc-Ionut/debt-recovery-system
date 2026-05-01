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
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { dashboardService } from "@/services/dashboard.service";
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
  const [user] = useState<AuthUser | null>(() => authService.getUser());
  const [notifications, setNotifications] = useState<OverdueInvoice[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(() =>
    getReadIds(authService.getUser()?.email ?? "guest"),
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const userId = user?.email ?? "guest";
  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const loadNotifications = useCallback((uid: string) => {
    setLoading(true);
    dashboardService
      .getOverdueInvoices()
      .then((data) => {
        setNotifications(data);
        const ids = getReadIds(uid);
        const validIds = new Set(
          [...ids].filter((id) => data.some((n) => n.id === id)),
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

  // Close on outside click
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
  }

  const initials = user
    ? (user.fullName ?? user.email).slice(0, 2).toUpperCase()
    : "?";

  function urgencyColor(days: number) {
    if (days > 60)
      return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20";
    if (days > 30)
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20";
    return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20";
  }

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
        <div className="flex items-center gap-2">
          {/* Bell + dropdown */}
          <div className="relative" ref={panelRef}>
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
              <div className="absolute right-0 top-11 w-80 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-xl dark:shadow-black/50 overflow-hidden z-50">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {t.notifications.overdueInvoices}
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-bold bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                        {unreadCount} {t.notifications.newBadge}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />{" "}
                      {t.notifications.readAll}
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.05]">
                  {loading && (
                    <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                      {t.notifications.loading}
                    </div>
                  )}
                  {!loading && notifications.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {t.notifications.allCaughtUp}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {t.notifications.noOverdue}
                      </p>
                    </div>
                  )}
                  {!loading &&
                    notifications.map((inv) => {
                      const isRead = readIds.has(inv.id);
                      return (
                        <div
                          key={inv.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors ${isRead ? "opacity-50" : "hover:bg-slate-50 dark:hover:bg-white/[0.04]"}`}
                        >
                          {/* Unread dot */}
                          <div className="mt-1.5 flex-shrink-0">
                            {isRead ? (
                              <div className="w-2 h-2 rounded-full bg-transparent" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                            )}
                          </div>

                          <Link
                            href="/invoices"
                            onClick={() => markRead(inv.id)}
                            className="flex-1 min-w-0"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                                {inv.clientName}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">
                                {formatCompactCurrency(
                                  Number(inv.totalAmount),
                                  inv.currency,
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-1">
                              <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                {inv.number}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${urgencyColor(inv.overdueDays)}`}
                              >
                                {inv.overdueDays}
                                {t.notifications.daysOverdue}
                              </span>
                            </div>
                          </Link>

                          {/* Mark single as read */}
                          {!isRead && (
                            <button
                              onClick={() => markRead(inv.id)}
                              title={t.notifications.markAsRead}
                              className="mt-1 p-1 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06]">
                  <Link
                    href="/invoices"
                    className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {t.notifications.viewAllInvoices}{" "}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

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
