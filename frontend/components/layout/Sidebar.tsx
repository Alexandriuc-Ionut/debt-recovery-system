"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  Bell,
  Brain,
  LogOut,
  Building2,
  Settings,
  X,
  Receipt,
  RefreshCw,
  FileCode,
  Activity,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { useLanguage } from "@/contexts/LanguageContext";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/clients", label: t.nav.clients, icon: Users },
    { href: "/invoices", label: t.nav.invoices, icon: FileText },
    { href: "/payments", label: t.nav.payments, icon: CreditCard },
    { href: "/reminders", label: t.nav.reminders, icon: Bell },
    { href: "/expenses", label: t.nav.expenses, icon: Receipt },
    { href: "/recurring", label: t.nav.recurring, icon: RefreshCw },
    { href: "/efactura", label: t.nav.efactura, icon: FileCode },
    { href: "/ai", label: t.nav.aiScoring, icon: Brain },
    { href: "/audit", label: t.nav.auditLog, icon: Activity },
  ];

  return (
    <aside className="w-64 h-full min-h-full bg-[#0f1623] text-white flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight tracking-tight">
              DebtRecovery
            </p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              Management
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              data-nav={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                active
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent"
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${active ? "text-blue-400" : "text-slate-500"}`}
              />
              {label}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3 flex-shrink-0 space-y-0.5">
        {/* Language toggle — visible only on mobile */}
        <div className="lg:hidden flex items-center px-3 py-1 mb-0.5">
          <div className="relative flex items-center bg-white/[0.06] border border-white/[0.1] rounded-full" style={{ width: 76, padding: 3 }}>
            <span
              className="absolute rounded-full bg-blue-600 transition-transform duration-300 ease-in-out"
              style={{ width: 35, top: 3, bottom: 3, left: 3, transform: lang === 'en' ? 'translateX(35px)' : 'translateX(0)' }}
            />
            <button onClick={() => setLang('ro')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'ro' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>RO</button>
            <button onClick={() => setLang('en')} className={`relative z-10 text-[11px] font-bold transition-colors duration-300 ${lang === 'en' ? 'text-white' : 'text-slate-400'}`} style={{ width: 35, padding: '3px 0' }}>EN</button>
          </div>
        </div>

        <Link
          href="/settings"
          onClick={onClose}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border ${
            pathname === "/settings"
              ? "bg-blue-600/20 text-blue-400 border-blue-500/20"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent"
          }`}
        >
          <Settings
            className={`w-4 h-4 flex-shrink-0 ${pathname === "/settings" ? "text-blue-400" : "text-slate-500"}`}
          />
          {t.nav.settings}
          {pathname === "/settings" && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </Link>

        <button
          onClick={() => authService.logout()}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0 text-slate-500" />
          {t.nav.signOut}
        </button>
      </div>
    </aside>
  );
}
