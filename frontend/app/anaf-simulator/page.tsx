"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCode2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import {
  anafSimService,
  type SimSubmission,
  type SimStats,
} from "@/services/anaf-sim.service";

const REJECT_REASONS = [
  "Factura duplicata - numar de identificare existent in sistem",
  "Cumparatorul nu este inregistrat in sistemul RO e-Factura",
  "XML invalid - nu respecta schema UBL 2.1 / CIUS-RO",
  "CUI furnizor invalid sau neidentificat in evidenta fiscala",
  "CUI cumparator invalid sau neidentificat in evidenta fiscala",
  "Data emiterii facturii invalida sau in afara perioadei permise",
  "Suma totala negativa sau zero - valoare incorecta",
  "Moneda documentului nu este acceptata",
];

function StatusBadge({ status }: { status: SimSubmission["status"] }) {
  if (status === "VALIDATED")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" /> VALIDAT
      </span>
    );
  if (status === "ERROR")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" /> RESPINS
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
      <Clock className="w-3 h-3" /> ÎN PROCESARE
    </span>
  );
}

function RejectModal({
  submission,
  onClose,
  onConfirm,
}: {
  submission: SimSubmission;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [selected, setSelected] = useState(REJECT_REASONS[0]);
  const [custom, setCustom] = useState("");
  const isCustom = selected === "__custom__";
  const finalReason = isCustom ? custom : selected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-red-200">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-red-50 rounded-t-xl">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              Respingere factură
            </p>
            <p className="text-xs text-slate-500">
              {submission.invoice?.series
                ? `${submission.invoice.series}-${submission.invoice.number}`
                : submission.invoice?.number}{" "}
              &mdash; {submission.company?.name}
            </p>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Cod eroare / motiv respingere
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              {REJECT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="__custom__">— Motiv personalizat —</option>
            </select>
          </div>

          {isCustom && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Motiv personalizat
              </label>
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                rows={3}
                placeholder="Descrieți motivul respingerii..."
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Această acțiune va marca factura ca{" "}
              <strong>RESPINSĂ</strong> în sistemul e-Factura. Emitentul va
              trebui să corecteze și să retrimită factura.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Anulare
          </button>
          <button
            onClick={() => onConfirm(finalReason)}
            disabled={isCustom && !custom.trim()}
            className="px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            Respinge factura
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionRow({
  sub,
  onValidate,
  onReject,
}: {
  sub: SimSubmission;
  onValidate: (s: SimSubmission) => void;
  onReject: (s: SimSubmission) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const invoiceRef = sub.invoice?.series
    ? `${sub.invoice.series}-${sub.invoice.number}`
    : (sub.invoice?.number ?? `#${sub.invoiceId}`);

  return (
    <>
      <tr className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-slate-800">
            {sub.company?.name ?? `Companie #${sub.companyId}`}
          </p>
          <p className="text-xs text-slate-400 font-mono">
            CUI: {sub.company?.cui ?? "—"}
          </p>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-mono font-semibold text-slate-700">
            {invoiceRef}
          </p>
          <p className="text-xs text-slate-400">
            {sub.invoice?.client?.name ?? "—"}
          </p>
        </td>
        <td className="px-4 py-3 text-sm font-bold text-slate-800">
          {Number(sub.invoice?.totalAmount ?? 0).toLocaleString("ro-RO", {
            minimumFractionDigits: 2,
          })}{" "}
          {sub.invoice?.currency ?? "RON"}
        </td>
        <td className="px-4 py-3">
          <p className="text-xs text-slate-500">
            {new Date(sub.submittedAt).toLocaleString("ro-RO")}
          </p>
          {sub.processedAt && (
            <p className="text-xs text-slate-400">
              Procesat: {new Date(sub.processedAt).toLocaleString("ro-RO")}
            </p>
          )}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={sub.status} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            {sub.status === "PENDING" && (
              <>
                <button
                  onClick={() => onValidate(sub)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Validare
                </button>
                <button
                  onClick={() => onReject(sub)}
                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Respinge
                </button>
              </>
            )}
            <a
              href={anafSimService.xmlUrl(sub.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Descarcă XML"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Detalii"
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="bg-slate-50 border-t border-slate-100">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Detalii tehnice
                </p>
                <dl className="space-y-1 text-xs text-slate-600">
                  <div className="flex gap-2">
                    <dt className="font-medium w-32 flex-shrink-0">ID Incarcare:</dt>
                    <dd className="font-mono text-slate-800">{sub.executionId ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium w-32 flex-shrink-0">ID Descarcare:</dt>
                    <dd className="font-mono text-slate-800">{sub.messageId ?? "—"}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium w-32 flex-shrink-0">ID Trimitere:</dt>
                    <dd className="font-mono text-slate-800">#{sub.id}</dd>
                  </div>
                </dl>
              </div>

              {(sub.recipisa || sub.errorMsg) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    {sub.status === "ERROR" ? "Motiv respingere" : "Recipisă ANAF"}
                  </p>
                  {sub.errorMsg && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {sub.errorMsg}
                    </p>
                  )}
                  {sub.recipisa && !sub.errorMsg && (
                    <pre className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 overflow-x-auto">
                      {JSON.stringify(sub.recipisa, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AnafSimulatorPage() {
  const [stats, setStats] = useState<SimStats | null>(null);
  const [submissions, setSubmissions] = useState<SimSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<SimSubmission | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "VALIDATED" | "ERROR">("ALL");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [s, all] = await Promise.all([
        anafSimService.getStats(),
        anafSimService.getAll(),
      ]);
      setStats(s);
      setSubmissions(all);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => load(true), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleValidate(sub: SimSubmission) {
    setActionLoading(sub.id);
    try {
      await anafSimService.validate(sub.id);
      await load(true);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget.id);
    setRejectTarget(null);
    try {
      await anafSimService.reject(rejectTarget.id, reason);
      await load(true);
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filter === "ALL" ? submissions : submissions.filter((s) => s.status === filter);

  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#f4f6f9]">
      {/* Government-style header */}
      <header className="bg-[#003087] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-0">
          {/* Top bar */}
          <div className="flex items-center justify-between py-2 border-b border-white/20 text-xs text-blue-200">
            <span>Ministerul Finanțelor — Agenția Națională de Administrare Fiscală</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Mediu de testare / Simulator
            </span>
          </div>
          {/* Main header */}
          <div className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center text-xl font-black select-none">
              RO
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight leading-tight">
                Sistemul Național de Facturare Electronică
              </h1>
              <p className="text-blue-200 text-sm">
                SPV — Spațiul Privat Virtual &nbsp;|&nbsp; Portal Administrator
                ANAF{" "}
                <span className="ml-2 text-xs bg-amber-400 text-amber-900 font-bold px-2 py-0.5 rounded uppercase">
                  Simulator
                </span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total trimise",
              value: stats?.total ?? 0,
              color: "border-blue-500 bg-blue-50",
              text: "text-blue-700",
              icon: <FileCode2 className="w-5 h-5" />,
            },
            {
              label: "În procesare",
              value: stats?.pending ?? 0,
              color: "border-amber-400 bg-amber-50",
              text: "text-amber-700",
              icon: <Clock className="w-5 h-5" />,
            },
            {
              label: "Validate",
              value: stats?.validated ?? 0,
              color: "border-emerald-500 bg-emerald-50",
              text: "text-emerald-700",
              icon: <CheckCircle2 className="w-5 h-5" />,
            },
            {
              label: "Respinse",
              value: stats?.error ?? 0,
              color: "border-red-500 bg-red-50",
              text: "text-red-700",
              icon: <XCircle className="w-5 h-5" />,
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`bg-white rounded-xl border-l-4 ${card.color} shadow-sm p-5 flex items-center gap-4`}
            >
              <div className={`${card.text} opacity-70`}>{card.icon}</div>
              <div>
                <p className={`text-2xl font-black ${card.text}`}>
                  {card.value}
                </p>
                <p className="text-xs text-slate-500 font-medium">
                  {card.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pending alert banner */}
        {pendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-5 py-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              <strong>{pendingCount}</strong>{" "}
              {pendingCount === 1
                ? "factură necesită procesare"
                : "facturi necesită procesare"}{" "}
              — selectați acțiunea corespunzătoare din tabelul de mai jos.
            </p>
          </div>
        )}

        {/* Table section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Registru trimiteri e-Factura
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toate companiile înregistrate în sistem
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Filter tabs */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 text-xs font-semibold">
                {(["ALL", "PENDING", "VALIDATED", "ERROR"] as const).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-md transition-colors ${filter === f ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {f === "ALL"
                        ? "Toate"
                        : f === "PENDING"
                          ? "În procesare"
                          : f === "VALIDATED"
                            ? "Validate"
                            : "Respinse"}
                    </button>
                  ),
                )}
              </div>
              <button
                onClick={() => load(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualizare
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Se încarcă registrul...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileCode2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Nu există trimiteri în această categorie
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Emitent</th>
                    <th className="px-4 py-3">Factură</th>
                    <th className="px-4 py-3">Valoare</th>
                    <th className="px-4 py-3">Dată trimitere</th>
                    <th className="px-4 py-3">Stare</th>
                    <th className="px-4 py-3">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <SubmissionRow
                      key={sub.id}
                      sub={sub}
                      onValidate={handleValidate}
                      onReject={setRejectTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 pb-4">
          Sistem Național de Facturare Electronică — Simulator în scop didactic
          &nbsp;|&nbsp; ANAF © {new Date().getFullYear()}
        </p>
      </main>

      {rejectTarget && (
        <RejectModal
          submission={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
        />
      )}

      {actionLoading !== null && (
        <div className="fixed bottom-6 right-6 bg-[#003087] text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Se procesează...
        </div>
      )}
    </div>
  );
}
