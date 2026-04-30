"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Shield,
  Building2,
  Check,
  Eye,
  EyeOff,
  Lock,
  Bell,
  Palette,
  Sun,
  Moon,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { authService } from "@/services/auth.service";
import type { AuthUser } from "@/types";

const roleColors: Record<string, string> = {
  ADMIN: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACCOUNTANT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  VIEWER: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
        {value || (
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            Not set
          </span>
        )}
      </p>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function getNotifPrefs() {
  try {
    const raw = localStorage.getItem("notifPrefs");
    if (raw) return JSON.parse(raw) as { overdue: boolean; payment: boolean; reminder: boolean };
  } catch { /* noop */ }
  return null;
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const [user] = useState<AuthUser | null>(() => authService.getUser());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Notification preferences (UI only — stored in localStorage)
  const [notifOverdue, setNotifOverdue] = useState(() => getNotifPrefs()?.overdue ?? true);
  const [notifPayment, setNotifPayment] = useState(() => getNotifPrefs()?.payment ?? true);
  const [notifReminder, setNotifReminder] = useState(() => getNotifPrefs()?.reminder ?? false);

  // Theme
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  function setTheme(dark: boolean) {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
    setIsDark(dark);
  }

  function saveNotifPrefs(
    overdue: boolean,
    payment: boolean,
    reminder: boolean,
  ) {
    localStorage.setItem(
      "notifPrefs",
      JSON.stringify({ overdue, payment, reminder }),
    );
  }

  async function handleChangePassword(e: { preventDefault(): void }) {
    e.preventDefault();
    setPasswordMsg(null);
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({
        type: "error",
        text: "Password must be at least 8 characters.",
      });
      return;
    }
    setSavingPassword(true);
    // Placeholder — wire to PATCH /auth/change-password when endpoint exists
    await new Promise((r) => setTimeout(r, 800));
    setSavingPassword(false);
    setPasswordMsg({ type: "success", text: "Password updated successfully." });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
  }

  if (!user) return null;

  const initials = (user.fullName ?? user.email).slice(0, 2).toUpperCase();

  const inputCls =
    "w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-white/[0.05] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition";

  return (
    <AppLayout title={t.profile.title}>
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Avatar card */}
        <div className="bg-white dark:bg-[#0d1117]/80 dark:backdrop-blur-sm rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-200 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {user.fullName ?? "No name set"}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleColors[user.role] ?? roleColors.VIEWER}`}
              >
                {user.role}
              </span>
              <span className="text-xs text-slate-400">
                Company #{user.companyId}
              </span>
            </div>
          </div>
        </div>

        {/* Account info */}
        <SectionCard title="Account Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Full Name" value={user.fullName ?? ""} />
            <Field
              label="Email Address"
              value={user.email}
              hint="Used to log in to your account"
            />
            <Field
              label="Role"
              value={user.role}
              hint="Contact your admin to change your role"
            />
            <Field label="Company ID" value={String(user.companyId)} />
          </div>
        </SectionCard>

        {/* Security */}
        <SectionCard title="Security" icon={Lock}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Password
                  </p>
                  <p className="text-xs text-slate-400">
                    Last changed: unknown
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasswordForm((v) => !v);
                  setPasswordMsg(null);
                }}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {showPasswordForm ? "Cancel" : "Change"}
              </button>
            </div>

            {showPasswordForm && (
              <form
                onSubmit={handleChangePassword}
                className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700"
              >
                {passwordMsg && (
                  <div
                    className={`text-sm px-4 py-3 rounded-lg border ${passwordMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                  >
                    {passwordMsg.text}
                  </div>
                )}
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={inputCls}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    {savingPassword ? "Saving…" : "Update Password"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Email Verification
                  </p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notification Preferences" icon={Bell}>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              These control in-app alerts. Email reminders to clients are
              managed separately in the{" "}
              <strong className="text-slate-600">Reminders</strong> section.
            </p>
            {[
              {
                label: "Overdue invoice alerts",
                desc: "Get notified when invoices pass their due date",
                value: notifOverdue,
                set: (v: boolean) => {
                  setNotifOverdue(v);
                  saveNotifPrefs(v, notifPayment, notifReminder);
                },
              },
              {
                label: "Payment received",
                desc: "Get notified when a payment is recorded",
                value: notifPayment,
                set: (v: boolean) => {
                  setNotifPayment(v);
                  saveNotifPrefs(notifOverdue, v, notifReminder);
                },
              },
              {
                label: "Reminder sent confirmations",
                desc: "Get notified each time a reminder email is sent",
                value: notifReminder,
                set: (v: boolean) => {
                  setNotifReminder(v);
                  saveNotifPrefs(notifOverdue, notifPayment, v);
                },
              },
            ].map(({ label, desc, value, set }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3.5 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {label}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {desc}
                  </p>
                </div>
                <button
                  onClick={() => set(!value)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${value ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-4" : "translate-x-0"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard title="Appearance" icon={Palette}>
          <div className="space-y-4">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Choose how the interface looks. Your preference is saved and
              applies across all pages.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme(false)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  !isDark
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <Sun className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${!isDark ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    Light
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Bright & clean
                  </p>
                </div>
                {!isDark && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>

              <button
                onClick={() => setTheme(true)}
                className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  isDark
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center shadow-sm">
                  <Moon className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold ${isDark ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}
                  >
                    Dark
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Easy on the eyes
                  </p>
                </div>
                {isDark && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Contact info placeholders */}
        <SectionCard title="Contact Details" icon={Phone}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Phone"
              value=""
              hint="Not set — edit your profile to add a phone number"
            />
            <Field
              label="Company"
              value={`Company #${user.companyId}`}
              hint="Manage company details in Settings"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Link
              href="/settings"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold transition-colors"
            >
              <Building2 className="w-4 h-4" /> Go to Company Settings →
            </Link>
          </div>
        </SectionCard>
      </div>
    </AppLayout>
  );
}
