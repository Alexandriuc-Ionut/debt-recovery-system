"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart3, Eye, EyeOff, User, Building2,
  ChevronRight, ChevronLeft, Check, Search, Loader2, ArrowRight,
} from "lucide-react";
import { authService } from "@/services/auth.service";
import { ToastContainer, toast } from "@/components/ui/Toast";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special char", ok: /[\W_]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const barColor = score <= 1 ? "bg-red-500" : score <= 2 ? "bg-orange-400" : score <= 3 ? "bg-yellow-400" : score === 4 ? "bg-emerald-400" : "bg-emerald-500";
  const label = ["", "Very weak", "Weak", "Fair", "Strong", "Very strong"][score];

  if (!password) return null;
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? barColor : "bg-white/10"}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map(({ label: l, ok }) => (
            <span key={l} className={`text-xs flex items-center gap-1 ${ok ? "text-emerald-400" : "text-slate-600"}`}>
              {ok ? <Check className="w-3 h-3" strokeWidth={3} /> : <span className="w-3 h-3 inline-flex items-center justify-center">·</span>}
              {l}
            </span>
          ))}
        </div>
        <span className={`text-xs font-semibold flex-shrink-0 ml-2 ${score >= 4 ? "text-emerald-400" : "text-slate-500"}`}>{label}</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [anafLoading, setAnafLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyCui, setCompanyCui] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyCounty, setCompanyCounty] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) e.password = "Password must meet all requirements";
    if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!companyName.trim()) e.companyName = "Company name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function lookupAnaf() {
    if (!companyCui.trim()) { toast("Enter a CUI first", "warning"); return; }
    setAnafLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/settings/anaf/${companyCui.replace(/\D/g, "")}`);
      const data = (await res.json()) as { found: boolean; name?: string; address?: string };
      if (data.found && data.name) {
        setCompanyName(data.name);
        if (data.address) setCompanyAddress(data.address);
        toast("Company data fetched from ANAF", "success");
      } else {
        toast("CUI not found in ANAF registry", "warning");
      }
    } catch {
      toast("ANAF service unavailable", "error");
    } finally {
      setAnafLoading(false);
    }
  }

  async function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    try {
      await authService.register({
        fullName, email, phone: phone || undefined, password,
        companyName, companyCui: companyCui || undefined,
        companyAddress: companyAddress || undefined,
        companyCity: companyCity || undefined,
        companyCounty: companyCounty || undefined,
        companyPhone: companyPhone || undefined,
        companyEmail: companyEmail || undefined,
      });
      router.replace("/auth/verify-email");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  }

  const inputBase = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
      errors[field] ? "border-red-500/60 bg-red-500/5" : "border-white/10 hover:border-white/20"
    }`;

  return (
    <div className="min-h-screen flex bg-[#080d14]">
      <ToastContainer />

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">DebtRecovery</span>
            <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full ml-1">Pro</span>
          </div>

          <div className="space-y-2 mb-10">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest">Get started</p>
            <h2 className="text-3xl font-bold text-white leading-tight tracking-tight">
              Start recovering<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">smarter today</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Join SMEs using AI tools to manage invoices, track payments, and recover debts automatically.
            </p>
          </div>

          {/* Step cards */}
          <div className="space-y-3">
            {[
              { num: 1, label: "Your account details", icon: User },
              { num: 2, label: "Company information", icon: Building2 },
            ].map(({ num, label, icon: Icon }) => (
              <div
                key={num}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  step === num ? "bg-blue-500/10 border-blue-500/30" :
                  step > num ? "bg-emerald-500/5 border-emerald-500/20" :
                  "bg-white/[0.02] border-white/5"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  step > num ? "bg-emerald-500/20 border border-emerald-500/30" :
                  step === num ? "bg-blue-500/20 border border-blue-500/30" :
                  "bg-white/5 border border-white/10"
                }`}>
                  {step > num
                    ? <Check className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                    : <Icon className={`w-4 h-4 ${step === num ? "text-blue-400" : "text-slate-600"}`} />}
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-medium">Step {num} of 2</p>
                  <p className={`text-sm font-semibold ${step === num ? "text-white" : step > num ? "text-emerald-400" : "text-slate-600"}`}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-700 text-xs">© 2026 DebtRecovery. All rights reserved.</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">DebtRecovery</span>
          </div>

          {/* Mobile progress */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            {[1, 2].map((n) => (
              <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= step ? "bg-blue-500" : "bg-white/10"}`} />
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  <User className="w-3.5 h-3.5" /> Step 1 of 2
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Your account details</h2>
                <p className="text-slate-500 text-sm mt-1">Tell us about yourself to get started</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Full name <span className="text-red-400">*</span></label>
                  <input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: "" })); }} placeholder="Ion Popescu" className={inputBase("fullName")} />
                  {errors.fullName && <p className="mt-1.5 text-xs text-red-400">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email address <span className="text-red-400">*</span></label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }} placeholder="you@company.com" className={inputBase("email")} />
                  {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Phone <span className="text-slate-600 text-xs font-normal">(optional)</span></label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+40 700 000 000" className={inputBase("phone")} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }} placeholder="••••••••" className={`${inputBase("password")} pr-11`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                  {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Confirm password <span className="text-red-400">*</span></label>
                  <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }} placeholder="••••••••" className={inputBase("confirmPassword")} />
                  {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>}
                </div>

                <button type="button" onClick={() => { if (validateStep1()) setStep(2); }} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/30 mt-2">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Step 2 of 2
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Company information</h2>
                <p className="text-slate-500 text-sm mt-1">Enter your company details or look them up via ANAF</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">CUI / CIF <span className="text-slate-600 text-xs font-normal">(fiscal number)</span></label>
                  <div className="flex gap-2">
                    <input type="text" value={companyCui} onChange={(e) => setCompanyCui(e.target.value)} placeholder="RO12345678" className={`${inputBase("companyCui")} flex-1`} />
                    <button type="button" onClick={lookupAnaf} disabled={anafLoading} className="flex items-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 disabled:opacity-40 text-slate-300 text-sm font-medium rounded-xl transition-all flex-shrink-0">
                      {anafLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span className="hidden sm:block">ANAF</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Company name <span className="text-red-400">*</span></label>
                  <input type="text" value={companyName} onChange={(e) => { setCompanyName(e.target.value); setErrors((p) => ({ ...p, companyName: "" })); }} placeholder="Acme SRL" className={inputBase("companyName")} />
                  {errors.companyName && <p className="mt-1.5 text-xs text-red-400">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Address</label>
                  <input type="text" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} placeholder="Str. Victoriei nr. 1" className={inputBase("companyAddress")} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
                    <input type="text" value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} placeholder="București" className={inputBase("companyCity")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">County</label>
                    <input type="text" value={companyCounty} onChange={(e) => setCompanyCounty(e.target.value)} placeholder="Ilfov" className={inputBase("companyCounty")} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company phone</label>
                    <input type="tel" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+40 21 000 0000" className={inputBase("companyPhone")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company email</label>
                    <input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="office@acme.ro" className={inputBase("companyEmail")} />
                  </div>
                </div>

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium rounded-xl text-sm transition-all">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-500 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-900/30">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </>
          )}

          <p className="text-center text-sm text-slate-600 mt-8">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
