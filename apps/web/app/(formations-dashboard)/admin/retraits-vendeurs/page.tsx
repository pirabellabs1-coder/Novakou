"use client";

/**
 * /admin/retraits-vendeurs
 *
 * L'admin voit toutes les demandes de retrait (vendeurs + mentors)
 * et peut les approuver ou refuser avec motif.
 */

import { useState } from "react";
import { promptAction } from "@/store/prompt";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/store/confirm";
import {
  StCard,
  StPageHeader,
  StKpiCompact,
  StButton,
  StStatusPill,
  StChip,
  ST,
} from "@/components/stitch";
import {
  Banknote,
  ArrowLeft,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Wallet,
  FlaskConical,
  BadgeCheck,
  RefreshCw,
  CreditCard,
  Inbox,
} from "lucide-react";

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

const STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  TRAITE: "Traité",
  REFUSE: "Refusé",
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

  // Bulk selection (session bureau — pattern signalements/tickets)
  const [bulkIds, setBulkIds] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);
  function toggleBulk(id: string) {
    setBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  // Filtre la sélection sur les seuls EN_ATTENTE éligibles à l'approbation
  const pendingIds = withdrawals.filter((w) => w.status === "EN_ATTENTE").map((w) => w.id);
  const selectedPendingCount = [...bulkIds].filter((id) => pendingIds.includes(id)).length;

  async function bulkApprove(mode: "moneroo" | "manual") {
    const ids = [...bulkIds].filter((id) => pendingIds.includes(id));
    if (ids.length === 0) return;
    if (!confirm(`Approuver ${ids.length} retrait(s) via ${mode === "manual" ? "transfert manuel" : "Moneroo"} ?\n\nLe paiement sera déclenché immédiatement pour chacun.`)) return;
    setBulkRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/formations/admin/withdrawals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve", mode }),
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok;
      setToast(ko === 0 ? `${ok} retrait(s) approuvé(s) via ${mode}` : `${ok} ok, ${ko} échec(s) — voir les détails`);
      setBulkIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

  async function bulkReject() {
    const ids = [...bulkIds].filter((id) => pendingIds.includes(id));
    if (ids.length === 0) return;
    const reason = await promptAction({
      title: `Refuser ${ids.length} retrait(s)`,
      message: "Motif du refus (visible par les vendeurs) :",
      defaultValue: "Demande non conforme — vérifiez vos coordonnées de réception.",
      placeholder: "Motif du refus…",
      confirmLabel: "Refuser",
      cancelLabel: "Annuler",
      icon: "block",
      multiline: true,
      validate: (v) => (v.trim().length < 3 ? "Le motif est obligatoire." : null),
    });
    if (!reason || !reason.trim()) return;
    setBulkRunning(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/formations/admin/withdrawals/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject", refusedReason: reason.trim() }),
          }).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
        ),
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const ko = results.length - ok;
      setToast(ko === 0 ? `${ok} retrait(s) refusé(s)` : `${ok} ok, ${ko} échec(s)`);
      setBulkIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
    } finally {
      setBulkRunning(false);
      setTimeout(() => setToast(null), 5000);
    }
  }

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
      // Bureau session 4 (post-mortem payouts) : avant on lisait
      // `data.data.monerooStatus` qui n'était JAMAIS retourné par le backend
      // → toast trompeur "traitement en cours" même si l'init avait
      // réussi. Maintenant on remonte explicitement `status` + `payoutId`.
      const mode = data?.data?.mode;
      const status = data?.data?.status; // "initiated" | "completed" | "manual" | "pending"
      const ref = data?.data?.paymentRef ?? data?.data?.payoutId;
      if (mode === "manual") {
        setToast("Retrait marqué comme traité manuellement ✅");
      } else if (status === "completed" || status === "success") {
        setToast("Retrait versé via Moneroo ✅");
      } else if (mode === "moneroo") {
        setToast(
          `Payout envoyé à Moneroo (ref ${ref ?? "—"}) — Le statut passera à TRAITE dès réception du webhook confirmation provider. Si après 15 min toujours EN_ATTENTE, cliquer "Réconcilier".`
        );
      } else {
        setToast("Retrait traité — vérifiez le statut dans la liste");
      }
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 8000);
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

  const retryMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry" }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Payout relancé via Moneroo");
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 4000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  const rejectMut = useMutation({
    mutationFn: async (args: { id: string; refusedReason: string }) => {
      const res = await fetch(`/api/formations/admin/withdrawals/${args.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", refusedReason: args.refusedReason }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: () => {
      setToast("Retrait refusé — fonds débloqués");
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => setToast(`Erreur : ${e.message}`),
  });

  // Bureau session 4 — bouton Réconcilier (post-mortem payouts)
  // Appelle manuellement le cron de réconciliation pour 1 retrait.
  // Pratique quand le webhook provider rate ou tarde.
  const reconcileMut = useMutation({
    mutationFn: async (args: { id: string }) => {
      const res = await fetch(`/api/cron/payout-reconcile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: args.id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: (data) => {
      const after = data?.data?.after ?? "EN_ATTENTE";
      const message = data?.data?.message;
      if (after === "TRAITE") setToast("✅ Confirmation provider reçue — retrait passé TRAITE");
      else if (after === "REFUSE") setToast(`Provider a rejeté : ${message ?? "—"}`);
      else setToast(`Toujours en attente côté provider (status=${message ?? "pending"}). Reéssayez dans quelques minutes.`);
      qc.invalidateQueries({ queryKey: ["admin-vendor-withdrawals"] });
      setTimeout(() => setToast(null), 6000);
    },
    onError: (e: Error) => setToast(`Erreur réconciliation : ${e.message}`),
  });

  async function handleReconcile(w: Withdrawal) {
    if (!w.paymentRef) {
      setToast("Pas de paymentRef — rien à réconcilier (le payout n'a pas démarré)");
      setTimeout(() => setToast(null), 4000);
      return;
    }
    reconcileMut.mutate({ id: w.id });
  }

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

  async function handleRetry(w: Withdrawal) {
    const ok = await confirmAction({
      title: `Relancer le payout de ${fmtFCFA(w.amount)} FCFA ?`,
      message: `Le payout précédent a échoué. Moneroo sera rappelé pour ${w.user.name ?? w.user.email}.`,
      confirmLabel: "Relancer",
      confirmVariant: "default",
      icon: "refresh",
    });
    if (ok) retryMut.mutate(w.id);
  }

  async function handleReject(w: Withdrawal) {
    const reason = window.prompt(
      `Motif de refus pour ${w.user.name ?? w.user.email} (les fonds seront débloqués) :`,
      "",
    );
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) setToast("Motif requis (5 caractères minimum)");
      return;
    }
    rejectMut.mutate({ id: w.id, refusedReason: reason.trim() });
  }

  function getRetryCount(w: Withdrawal): number {
    const d = w.accountDetails || {};
    return typeof d._retryCount === "number" ? d._retryCount : 0;
  }

  function classifyError(msg: string | null): "insufficient_funds" | "validation" | "network" | "unknown" {
    if (!msg) return "unknown";
    const lower = msg.toLowerCase();
    if (lower.includes("insufficient") || lower.includes("balance") || lower.includes("solde")) return "insufficient_funds";
    if (lower.includes("invalid") || lower.includes("validation") || lower.includes("msisdn") || lower.includes("recipient")) return "validation";
    if (lower.includes("timeout") || lower.includes("network") || lower.includes("fetch")) return "network";
    return "unknown";
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
    <div
      className="min-h-screen"
      style={{ background: ST.bg, fontFamily: "var(--font-manrope), Manrope, Inter, sans-serif" }}
    >
      {toast && (
        <div className="fixed top-6 right-6 z-50 text-white px-5 py-3 rounded-xl text-xs font-bold shadow-2xl" style={{ background: ST.greenDark }}>
          {toast}
        </div>
      )}
      <main className="px-5 md:px-7 py-6 md:py-7 max-w-[1400px] mx-auto space-y-5">
        <StButton variant="secondary" size="sm" icon={ArrowLeft} href="/admin/dashboard">
          Dashboard
        </StButton>

        <StPageHeader
          title="Demandes de retrait vendeurs & mentors"
          subtitle="Approuvez ou refusez les retraits. Payez automatiquement via Moneroo."
          actions={
            <StButton
              variant="secondary"
              icon={FlaskConical}
              onClick={() => setShowTest(!showTest)}
            >
              Tester Moneroo
            </StButton>
          }
        />

        {/* ── Panneau de test Moneroo direct ──────────────────────────────── */}
        {showTest && (
          <StCard className="!p-[18px_20px]">
            <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>Test Moneroo direct</h3>
            <p className="text-[12px] font-semibold mt-0.5 mb-4" style={{ color: ST.textSecondary }}>
              Envoie un payout direct à Moneroo. ATTENTION : l&apos;argent sort réellement de votre solde.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: ST.textMuted }}>Méthode</label>
                <select
                  value={testMethod}
                  onChange={(e) => setTestMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
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
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: ST.textMuted }}>
                  Numéro (msisdn)
                </label>
                <input
                  type="tel"
                  value={testMsisdn}
                  onChange={(e) => setTestMsisdn(e.target.value)}
                  placeholder="Ex: 22957335726 (sans le +)"
                  className="w-full px-3 py-2 rounded-xl text-[13px] font-mono focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
                />
                <p className="text-[10px] mt-0.5" style={{ color: ST.textMuted }}>Digits only, format international sans +</p>
              </div>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: ST.textMuted }}>Montant</label>
                <input
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(Number(e.target.value))}
                  min={100}
                  className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold focus:outline-none"
                  style={{ color: ST.text, border: "1px solid #dde6e0", background: "#fff" }}
                />
                <p className="text-[10px] mt-0.5" style={{ color: ST.textMuted }}>500 = 500 FCFA / XOF</p>
              </div>
            </div>

            <StButton
              variant="dark"
              icon={FlaskConical}
              onClick={runTestPayout}
              disabled={testing || !testMsisdn}
            >
              {testing ? "Envoi en cours…" : "Envoyer à Moneroo"}
            </StButton>

            {testResult !== null && (
              <div
                className="mt-4 rounded-xl p-4 font-mono text-[11px] overflow-x-auto"
                style={{ background: ST.bg, border: `1px solid ${ST.cardBorder}` }}
              >
                <p
                  className="text-[10px] font-extrabold uppercase tracking-widest mb-2"
                  style={{ color: (testResult as { ok?: boolean }).ok ? ST.green : ST.roseText }}
                >
                  {(testResult as { ok?: boolean }).ok ? "Succès" : "Erreur Moneroo"}
                </p>
                <pre className="whitespace-pre-wrap break-all" style={{ color: "#33453b" }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </StCard>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StKpiCompact
            label="En attente"
            value={summary?.pending ?? 0}
            icon={Clock}
            tone="amber"
          />
          <StKpiCompact
            label="Montant en attente"
            value={`${fmtFCFA(summary?.pendingAmount ?? 0)}`}
            unit="F"
            icon={Wallet}
            tone="amber"
          />
          <StKpiCompact
            label="Traités"
            value={summary?.processed ?? 0}
            icon={CheckCircle}
            tone="green"
          />
          <StKpiCompact
            label="Refusés"
            value={summary?.refused ?? 0}
            icon={XCircle}
            tone="rose"
          />
        </div>

        {/* Filtres */}
        <StCard>
          <div className="flex flex-col md:flex-row gap-3 flex-wrap">
            <div className="flex gap-1 p-1 rounded-[13px] flex-wrap" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
              {(["EN_ATTENTE", "TRAITE", "REFUSE", "all"] as const).map((s) => {
                const on = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors"
                    style={on ? { background: ST.greenDark, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    {s === "all" ? "Tous" : STATUS_LABELS[s]}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 p-1 rounded-[13px] flex-wrap" style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}>
              {(["all", "vendor", "mentor"] as const).map((r) => {
                const on = roleFilter === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className="px-3 py-2 rounded-[10px] text-[12.5px] font-extrabold transition-colors"
                    style={on ? { background: ST.green, color: "#fff" } : { color: ST.textSecondary }}
                  >
                    {r === "all" ? "Tous rôles" : r === "vendor" ? "Vendeurs" : "Mentors"}
                  </button>
                );
              })}
            </div>
          </div>
        </StCard>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-24 rounded-[18px] animate-pulse"
                style={{ background: "#fff", border: `1px solid ${ST.cardBorder}` }}
              />
            ))}
          </div>
        ) : withdrawals.length === 0 ? (
          <StCard className="flex flex-col items-center text-center py-12">
            <Inbox size={40} style={{ color: "#d6e0da" }} />
            <p className="text-[14px] font-extrabold mt-3" style={{ color: ST.text }}>Aucune demande</p>
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
              Aucune demande de retrait ne correspond à ces filtres.
            </p>
          </StCard>
        ) : (
          <div className="space-y-3">
            {/* Barre bulk — visible quand >= 1 EN_ATTENTE sélectionné.
                Permet d'approuver via Moneroo/manuel ou refuser en masse. */}
            {selectedPendingCount > 0 && (
              <div
                className="sticky top-2 z-20 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl rounded-xl"
                style={{ background: ST.greenDark }}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">
                    {selectedPendingCount} retrait{selectedPendingCount > 1 ? "s" : ""} EN ATTENTE sélectionné{selectedPendingCount > 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={() => setBulkIds(new Set())}
                    className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                  >
                    Désélectionner
                  </button>
                  <button
                    onClick={() => setBulkIds(new Set(pendingIds))}
                    className="text-[10px] font-semibold text-white/70 hover:text-white underline"
                  >
                    Tout sélectionner ({pendingIds.length})
                  </button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button
                    onClick={() => bulkApprove("moneroo")}
                    disabled={bulkRunning}
                    className="px-3 py-2 rounded-[9px] text-white text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50"
                    style={{ background: ST.green }}
                    title="Payer la sélection via Moneroo"
                  >
                    {bulkRunning ? "…" : "Payer Moneroo"}
                  </button>
                  <button
                    onClick={() => bulkApprove("manual")}
                    disabled={bulkRunning}
                    className="px-3 py-2 rounded-[9px] text-white text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50 bg-white/15 hover:bg-white/25"
                    title="Marquer comme déjà payés (transfert hors plateforme)"
                  >
                    Manuel
                  </button>
                  <button
                    onClick={bulkReject}
                    disabled={bulkRunning}
                    className="px-3 py-2 rounded-[9px] text-white text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50"
                    style={{ background: "#ba1a1a" }}
                  >
                    Refuser
                  </button>
                </div>
              </div>
            )}
            {withdrawals.map((w) => {
              const isPending = w.status === "EN_ATTENTE";
              const isSelected = bulkIds.has(w.id);
              return (
                <div
                  key={w.id}
                  className="bg-white p-5 rounded-[18px]"
                  style={{
                    border: isSelected ? `2px solid ${ST.green}` : `1px solid ${ST.cardBorder}`,
                    boxShadow: isSelected ? `0 0 0 4px ${ST.greenSoft}` : "0 1px 3px rgba(16,52,32,.05)",
                  }}
                >
                  <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    {isPending && (
                      <label className="flex items-center pt-1 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleBulk(w.id)}
                          className="w-4 h-4 accent-[#006e2f] cursor-pointer"
                          aria-label="Sélectionner ce retrait"
                        />
                      </label>
                    )}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0"
                        style={{ background: ST.gradient }}
                      >
                        {(w.user.name ?? w.user.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-extrabold truncate" style={{ color: ST.text }}>
                            {w.user.name ?? w.user.email}
                          </p>
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                            style={w.role === "mentor" ? { background: ST.blueSoft, color: ST.blueText } : { background: "#f1efe8", color: "#5f5e5a" }}
                          >
                            {w.role}
                          </span>
                          {w.user.kyc >= 2 && (
                            <span
                              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider"
                              style={{ background: ST.greenSoft, color: ST.green }}
                            >
                              <BadgeCheck size={10} />
                              KYC {w.user.kyc}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: ST.textMuted }}>
                          {w.user.email} · {methodLabel(w.method)} · {timeAgo(w.createdAt)}
                        </p>
                        <p className="text-[11px] mt-1 font-mono" style={{ color: ST.textSecondary }}>
                          {renderAccountInfo(w)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 w-full lg:w-auto">
                      <div className="text-right">
                        <p className="text-[20px] font-extrabold tabular-nums" style={{ color: ST.text }}>
                          {fmtFCFA(w.amount)}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: ST.textFaint }}>FCFA</p>
                      </div>
                      <StStatusPill status={w.status} />

                      {w.status === "EN_ATTENTE" && (
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleApproveMoneroo(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 rounded-[10px] text-[10px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                            style={{ background: ST.greenBright, color: ST.greenDark }}
                            title="Déclencher un vrai paiement Moneroo"
                          >
                            <CreditCard size={14} />
                            Payer Moneroo
                          </button>
                          <button
                            onClick={() => handleApproveManual(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-3 py-2 rounded-[10px] text-[10px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-50"
                            style={{ background: ST.amberSoft, color: ST.amberText }}
                            title="Marquer traité (virement fait à la main)"
                          >
                            Manuel
                          </button>
                          <button
                            onClick={() => handleRefuse(w)}
                            disabled={approveMut.isPending || refuseMut.isPending}
                            className="px-4 py-2 rounded-[10px] text-[10px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-50"
                            style={{ background: ST.roseSoft, color: ST.roseText }}
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {w.status === "REFUSE" && (w.refusedReason || w.errorMessage) && (() => {
                    const errCat = classifyError(w.errorMessage);
                    const retries = getRetryCount(w);
                    const canRetry = retries < 3 && w.errorMessage;
                    return (
                      <div
                        className="mt-4 border-l-4 pl-4 py-3 rounded-r-lg"
                        style={{ borderColor: "#f3cdd9", background: ST.roseSoft }}
                      >
                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.roseText }}>
                          {errCat === "insufficient_funds" ? "Solde Moneroo insuffisant" : errCat === "validation" ? "Erreur de validation" : "Motif de refus"}
                        </p>
                        {w.refusedReason && <p className="text-[13px]" style={{ color: ST.roseText }}>{w.refusedReason}</p>}
                        {w.errorMessage && (
                          <p className="text-[10px] mt-1 font-mono" style={{ color: ST.roseText }}>Erreur Moneroo : {w.errorMessage}</p>
                        )}
                        {errCat === "insufficient_funds" && (
                          <p className="text-[12px] mt-2 font-semibold" style={{ color: ST.roseText }}>Rechargez votre compte Moneroo puis relancez le payout.</p>
                        )}
                        {errCat === "validation" && (
                          <p className="text-[12px] mt-2 font-semibold" style={{ color: ST.amberText }}>Vérifiez le numéro du bénéficiaire avant de relancer.</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          {canRetry ? (
                            <button
                              onClick={() => handleRetry(w)}
                              disabled={retryMut.isPending}
                              className="px-3 py-1.5 rounded-[9px] text-white text-[10px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                              style={{ background: ST.blueText }}
                            >
                              <RefreshCw size={14} />
                              Relancer ({3 - retries} essais restants)
                            </button>
                          ) : retries >= 3 ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: ST.textMuted }}>
                              3/3 tentatives épuisées — contactez le support Moneroo
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })()}

                  {w.status === "EN_ATTENTE" && w.errorMessage && (
                    <div className="mt-4 border-l-4 pl-4 py-2 rounded-r-lg" style={{ borderColor: "#f3e2bd", background: ST.amberSoft }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest mb-1" style={{ color: ST.amberText }}>Dernière tentative</p>
                      <p className="text-[13px]" style={{ color: ST.amberText }}>{w.errorMessage}</p>
                    </div>
                  )}

                  {/* Bureau session 4 — bouton Réconcilier pour les payouts coincés
                      en EN_ATTENTE après init provider (paymentRef présent). */}
                  {w.status === "EN_ATTENTE" && w.paymentRef && w.paymentProvider && (
                    <div
                      className="mt-4 flex items-center justify-between gap-3 flex-wrap p-3 rounded-lg"
                      style={{ background: ST.blueSoft, border: "1px solid #cfe3f5" }}
                    >
                      <div className="text-[12px] flex-1 min-w-0" style={{ color: ST.blueText }}>
                        <p className="font-extrabold uppercase tracking-widest text-[10px] mb-1">
                          Payout initié — en attente confirmation provider
                        </p>
                        <p className="font-mono text-[11px] truncate">
                          {w.paymentProvider}:{w.paymentRef}
                        </p>
                        <p className="text-[11px] mt-1 opacity-80">
                          Le statut TRAITE/REFUSE arrive via webhook provider. Si rien après 15 min, cliquez &quot;Réconcilier&quot;.
                        </p>
                      </div>
                      <button
                        onClick={() => handleReconcile(w)}
                        disabled={reconcileMut.isPending}
                        className="px-3 py-2 rounded-[9px] text-white text-[10px] font-extrabold uppercase tracking-widest disabled:opacity-50 inline-flex items-center gap-1"
                        style={{ background: ST.blueText }}
                      >
                        <RefreshCw size={14} />
                        {reconcileMut.isPending ? "Vérification…" : "Réconcilier"}
                      </button>
                    </div>
                  )}

                  {w.status === "TRAITE" && w.processedAt && (
                    <div className="mt-4 flex items-center gap-3 text-[11px] flex-wrap" style={{ color: ST.green }}>
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        Traité le {new Date(w.processedAt).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {w.paymentProvider === "moneroo" && w.paymentRef && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px]" style={{ background: ST.blueSoft, color: ST.blueText }}>
                          Moneroo · {w.paymentRef.slice(0, 16)}…
                        </span>
                      )}
                      {w.paymentProvider === "manual" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: ST.amberSoft, color: ST.amberText }}>
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
