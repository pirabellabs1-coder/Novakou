"use client";

/**
 * /admin/retraits-vendeurs
 *
 * L'admin voit toutes les demandes de retrait (vendeurs + mentors)
 * et peut les approuver ou refuser avec motif.
 */

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";

type Withdrawal = {
  id: string;
  amount: number;
  method: string;
  role: "vendor" | "mentor";
  status: "EN_ATTENTE" | "TRAITE" | "REFUSE";
  refusedReason: string | null;
  accountDetails: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
  paymentRef: string | null;
  paymentProvider: string | null;
  errorMessage: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    kyc: number;
  };
};

type Summary = {
  total: number;
  pending: number;
  processed: number;
  refused: number;
  pendingAmount: number;
};

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function methodLabel(m: string) {
  const map: Record<string, string> = {
    virement: "Virement bancaire",
    orange_money: "Orange Money",
    wave: "Wave",
    mtn: "MTN MoMo",
    moov: "Moov Money",
    paypal: "PayPal",
    wise: "Wise",
    bank: "Banque",
  };
  return map[m] ?? m;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 60) return `il y a ${m} min`;
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${d} j`;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber-100", text: "text-amber-800" },
  TRAITE: { label: "Traité", bg: "bg-emerald-100", text: "text-emerald-800" },
  REFUSE: { label: "Refusé", bg: "bg-rose-100", text: "text-rose-800" },
};

export default function AdminRetraitsVendeursPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "EN_ATTENTE" | "TRAITE" | "REFUSE">("EN_ATTENTE");
  const [roleFilter, setRoleFilter] = useState<"all" | "vendor" | "mentor">("all");
  const [toast, setToast] = useState<string | null>(null);

  // ── Test Moneroo direct (outil de diagnostic) ────────────────────────────
  const [showTest, setShowTest] = useState(false);
  const [testMethod, setTestMethod] = useState("mtn_bj");
  const [testMsisdn, setTestMsisdn] = useState("");
  const [testAmount, setTestAmount] = useState(500);
  const [testResult, setTestResult] = useState<unknown>(null);
  const [testing, setTesting] = useState(false);

  async function runTestPayout() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/formations/admin/test-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: testMethod,
          msisdn: testMsisdn,
          amount: testAmount,
        }),
      });
      // On lit TOUJOURS en texte d'abord pour pouvoir diagnostiquer
      // les reponses non-JSON (HTML d'erreur Vercel, page de login, 404, etc.)
      const raw = await res.text();
      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");

      if (!isJson) {
        const preview = raw.slice(0, 500).replace(/\s+/g, " ");
        setTestResult({
          ok: false,
          error: "La reponse n'est pas du JSON — l'endpoint est probablement introuvable ou il y a une redirection",
          diagnostic: {
            httpStatus: res.status,
            httpStatusText: res.statusText,
            contentType,
            finalUrl: res.url,
            redirected: res.redirected,
            first500chars: preview,
          },
          hint: res.status === 404
            ? "L'endpoint /api/formations/admin/test-payout n'existe pas encore sur ce deploiement. Attendez que Vercel finisse le build."
            : res.status === 302 || res.status === 307 || res.redirected
            ? "Redirection detectee — votre session admin est peut-etre perdue. Reconnectez-vous."
            : res.status >= 500
            ? "Erreur serveur. Regardez les logs Vercel pour la stack trace."
            : "Reponse inattendue. Copiez-moi le first500chars.",
        });
        return;
      }

      try {
        const j = JSON.parse(raw);
        setTestResult(j);
      } catch {
        setTestResult({
          ok: false,
          error: "Content-Type dit JSON mais le parsing a echoue",
          rawResponse: raw.slice(0, 500),
          httpStatus: res.status,
        });
      }
    } catch (e) {
      setTestResult({
        ok: false,
        error: e instanceof Error ? e.message : "Erreur reseau",
        type: "network_or_fetch_exception",
      });
    } finally {
      setTesting(false);
    }
  }

  const { data: response, isLoading } = useQuery<{ data: Withdrawal[]; summary: Summary | null }>({
    queryKey: ["admin-vendor-withdrawals", statusFilter, roleFilter],
    queryFn: () =>
      fetch(`/api/formations/admin/withdrawals?status=${statusFilter}&role=${roleFilter}`).then((r) => r.json()),
    staleTime: 15_000,
  });

  const withdrawals = response?.data ?? [];
  const summary = response?.summary;

  const approveMut = useMutation({
    mutationFn: async (args: { id: string; mode: "moneroo" | "manual" }) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", mode: args.mode }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: (data) => {
      const mode = data?.data?.mode;
      const monerooStatus = data?.data?.monerooStatus;
      if (mode === "moneroo") {
        setToast(
          monerooStatus === "success"
            ? "Retrait versé via Moneroo ✅"
            : "Retrait envoyé à Moneroo — traitement en cours"
        );
      } else {
        setToast("Retrait marqué comme traité");
      }
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const refuseMut = useMutation({
    mutationFn: async (args: { id: string; refusedReason: string }) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refuse", refusedReason: args.refusedReason }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Retrait refusé");
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  async function handleApproveMoneroo(w: Withdrawal) {
    const ok = await confirmAction({
      title: `Payer ${fmtFCFA(w.amount)} FCFA via Moneroo ?`,
      message: `Bénéficiaire : ${w.user.name ?? w.user.email} · Méthode : ${methodLabel(w.method)}. Moneroo envoie l'argent directement au bénéficiaire.`,
      confirmLabel: "Lancer le paiement",
      confirmVariant: "default",
      icon: "payments",
    });
    if (ok) approveMut.mutate({ id: w.id, mode: "moneroo" });
  }

  async function handleApproveManual(w: Withdrawal) {
    const ok = await confirmAction({
      title: `Marquer comme traité manuellement ?`,
      message: `Vous confirmez avoir viré ${fmtFCFA(w.amount)} FCFA à ${w.user.name ?? w.user.email} hors plateforme. Aucun paiement Moneroo ne sera déclenché.`,
      confirmLabel: "Marquer traité",
      confirmVariant: "warning",
      icon: "done_all",
    });
    if (ok) approveMut.mutate({ id: w.id, mode: "manual" });
  }

  async function handleRefuse(w: Withdrawal) {
    const reason = window.prompt(
      `Motif de refus (5 caractères minimum) pour ${w.user.name ?? w.user.email} :`,
      "",
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) setToast("Motif requis (5 caractères minimum)");
      return;
    }
    refuseMut.mutate({ id: w.id, refusedReason: reason.trim() });
  }

  function renderAccountInfo(w: Withdrawal) {
    const d = w.accountDetails || {};
    const parts: string[] = [];
    if (d.phone) parts.push(String(d.phone));
    if (d.iban) parts.push(String(d.iban));
    if (d.email) parts.push(String(d.email));
    if (d.bankName) parts.push(String(d.bankName));
    if (d.accountHolder) parts.push(String(d.accountHolder));
    return parts.length ? parts.join(" · ") : "—";
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}
      <main className="px-6 md:px-12 py-10 md:py-14 max-w-[1400px] mx-auto">
        <Link
          href="/admin/dashboard"
          className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 mb-6"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Dashboard
        </Link>

        <header className="mb-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#006e2f] mb-2 block">
              Paiements vendeurs &amp; mentors
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
              Demandes de retrait
            </h1>
            <p className="text-sm text-zinc-500 mt-3 max-w-2xl">
              Approuvez ou refusez les retraits des vendeurs et mentors. Cliquez « Payer Moneroo »
              pour envoyer les fonds automatiquement via l&apos;API Moneroo.
            </p>
          </div>
          <button
            onClick={() => setShowTest(!showTest)}
            className="px-4 py-2.5 bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-widest hover:bg-blue-100 transition-colors inline-flex items-center gap-2 self-start"
          >
            <span className="material-symbols-outlined text-[16px]">science</span>
            Tester Moneroo
          </button>
        </header>

        {/* ── Panneau de test Moneroo direct ──────────────────────────────── */}
        {showTest && (
          <div className="mb-10 bg-white rounded-2xl border-2 border-blue-200 p-6">
            <div className="flex items-start gap-3 mb-5">
              <span className="material-symbols-outlined text-blue-600 text-[22px] mt-0.5">science</span>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Test Moneroo direct</h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-2xl">
                  Envoie un payout direct à Moneroo sans passer par InstructorWithdrawal. Utile pour vérifier
                  que les codes méthode et le format msisdn sont acceptés.
                  <strong> Attention : l&apos;argent sortira réellement de votre solde Moneroo (sandbox ou prod selon votre clé).</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Méthode</label>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm"
                >
                  <optgroup label="Sénégal">
                    <option value="wave_sn">Wave (SN)</option>
                    <option value="orange_sn">Orange Money (SN)</option>
                    <option value="freemoney_sn">Free Money (SN)</option>
                    <option value="e_money_sn">E-Money (SN)</option>
                  </optgroup>
                  <optgroup label="Côte d'Ivoire">
                    <option value="wave_ci">Wave (CI)</option>
                    <option value="orange_ci">Orange Money (CI)</option>
                    <option value="mtn_ci">MTN (CI)</option>
                    <option value="moov_ci">Moov (CI)</option>
                  </optgroup>
                  <optgroup label="Bénin">
                    <option value="mtn_bj">MTN (BJ)</option>
                    <option value="moov_bj">Moov (BJ)</option>
                  </optgroup>
                  <optgroup label="Togo">
                    <option value="moov_tg">Moov (TG)</option>
                    <option value="togocel">Togocel (TG)</option>
                  </optgroup>
                  <optgroup label="Mali / Cameroun">
                    <option value="orange_ml">Orange Money (ML)</option>
                    <option value="orange_cm">Orange Money (CM)</option>
                    <option value="mtn_cm">MTN (CM)</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                  Numéro (msisdn)
                </label>
                <input
                  type="tel"
                  value={testMsisdn}
                  onChange={(e) => setTestMsisdn(e.target.value)}
                  placeholder="Ex: 22957335726 (sans le +)"
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">Digits only, format international sans +</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">Montant</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  min={100}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl text-sm"
                />
                <p className="text-[10px] text-zinc-500 mt-0.5">500 = 500 FCFA / XOF</p>
              </div>
            </div>

            <button
              onClick={runTestPayout}
              disabled={testing || !testMsisdn}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {testing ? "Envoi en cours…" : "Envoyer à Moneroo"}
            </button>

            {testResult !== null && (
              <div className="mt-4 rounded-xl border p-4 font-mono text-[11px] overflow-x-auto bg-zinc-50 border-zinc-200">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${(testResult as { ok?: boolean }).ok ? "text-emerald-700" : "text-rose-700"}`}>
                  {(testResult as { ok?: boolean }).ok ? "✓ Succès" : "✗ Erreur Moneroo"}
                </p>
                <pre className="whitespace-pre-wrap break-all text-zinc-800">{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-zinc-100 mb-10 border border-zinc-100">
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">En attente</p>
            <p className="text-xl md:text-2xl font-extrabold text-amber-600 tabular-nums break-all">
              {summary?.pending ?? 0}
            </p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Montant en attente</p>
            <p className="text-xl md:text-2xl font-extrabold text-amber-600 tabular-nums break-all">
              {fmtFCFA(summary?.pendingAmount ?? 0)}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest">FCFA</p>
          </div>
          <div className="bg-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">Traités</p>
            <p className="text-xl md:text-2xl font-extrabold text-emerald-600 tabular-nums break-all">
              {summary?.processed ?? 0}
            </p>
          </div>
          <div className="bg-zinc-900 text-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Refusés</p>
            <p className="text-xl md:text-2xl font-extrabold tabular-nums break-all">
              {summary?.refused ?? 0}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="flex gap-0 border border-zinc-100 bg-white">
            {(["EN_ATTENTE", "TRAITE", "REFUSE", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  statusFilter === s ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
          <div className="flex gap-0 border border-zinc-100 bg-white">
            {(["all", "vendor", "mentor"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  roleFilter === r ? "bg-[#22c55e] text-[#004b1e]" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {r === "all" ? "Tous rôles" : r === "vendor" ? "Vendeurs" : "Mentors"}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 bg-white border border-zinc-100 animate-pulse" />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="bg-white p-16 text-center border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Aucune demande</p>
            <p className="text-sm text-zinc-500">Aucune demande de retrait ne correspond à ces filtres.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const sc = STATUS_CONFIG[w.status];
              return (
                <div key={w.id} className="bg-white p-6 border border-zinc-100">
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(w.user.name ?? w.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-zinc-900 truncate">
                            {w.user.name ?? w.user.email}
                          </p>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${w.role === "mentor" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                            {w.role}
                          </span>
                          {w.user.kyc >= 2 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              <span className="material-symbols-outlined text-[10px]">verified</span>
                              KYC {w.user.kyc}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {w.user.email} · {methodLabel(w.method)} · {timeAgo(w.createdAt)}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-1 font-mono">
                          {renderAccountInfo(w)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
                      <div className="text-right">
                        <p className="text-xl font-extrabold text-zinc-900 tabular-nums">
                          {fmtFCFA(w.amount)}
                        </p>
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest">FCFA</p>
                      </div>
                      <span className={`inline-block px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${sc.bg} ${sc.text} whitespace-nowrap`}>
                        {sc.label}
                      </span>

                      {w.status === "EN_ATTENTE" && (
                        <div className="flex gap-0 flex-wrap">
                          <button
                            onClick={() => handleApproveMoneroo(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 bg-[#22c55e] text-[#004b1e] text-[10px] font-bold uppercase tracking-widest hover:bg-[#4ae176] transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            title="Déclencher un vrai paiement Moneroo"
                          >
                            <span className="material-symbols-outlined text-[14px]">payments</span>
                            Payer Moneroo
                          </button>
                          <button
                            onClick={() => handleApproveManual(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-3 py-2 bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-200 transition-colors disabled:opacity-50"
                            title="Marquer traité (virement fait à la main)"
                          >
                            Manuel
                          </button>
                          <button
                            onClick={() => handleRefuse(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 bg-[#ffdad6] text-[#93000a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#ffb4a9] transition-colors disabled:opacity-50"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {w.status === "REFUSE" && w.refusedReason && (
                    <div className="mt-4 border-l-4 border-rose-200 pl-4 py-2 bg-rose-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700 mb-1">Motif de refus</p>
                      <p className="text-sm text-rose-900">{w.refusedReason}</p>
                      {w.errorMessage && (
                        <p className="text-[10px] text-rose-600 mt-1 font-mono">Erreur Moneroo : {w.errorMessage}</p>
                      )}
                    </div>
                  )}

                  {w.status === "EN_ATTENTE" && w.errorMessage && (
                    <div className="mt-4 border-l-4 border-amber-200 pl-4 py-2 bg-amber-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">Dernière tentative</p>
                      <p className="text-sm text-amber-900">{w.errorMessage}</p>
                    </div>
                  )}

                  {w.status === "TRAITE" && w.processedAt && (
                    <div className="mt-4 flex items-center gap-3 text-[11px] text-emerald-700 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Traité le {new Date(w.processedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {w.paymentProvider === "moneroo" && w.paymentRef && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono text-[10px]">
                          Moneroo · {w.paymentRef.slice(0, 16)}…
                        </span>
                      )}
                      {w.paymentProvider === "manual" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                          Virement manuel
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
