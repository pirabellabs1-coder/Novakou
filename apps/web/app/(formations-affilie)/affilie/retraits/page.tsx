"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type PayoutRecord = {
  id: string;
  amount: number;
  paidAt: string | null;
  ref: string | null;
};

type RetraitsData = {
  balance: number;
  paidEarnings: number;
  history: PayoutRecord[];
};

function formatFcfa(n: number) { return n.toLocaleString("fr-FR") + " FCFA"; }
function toEur(n: number)      { return Math.round(n / 655.957); }

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}

const PAYOUT_METHODS = [
  { id: "WAVE",         label: "Wave",             icon: "📱", desc: "Instantané · Frais : 0 FCFA" },
  { id: "ORANGE_MONEY", label: "Orange Money",      icon: "🔶", desc: "1–2 jours · Frais : 0 FCFA" },
  { id: "MTN",          label: "MTN Mobile Money",  icon: "🟡", desc: "1–3 jours · Frais : 0 FCFA" },
  { id: "SEPA",         label: "Virement SEPA",     icon: "🏦", desc: "3–5 jours ouvrés · Frais : 0 FCFA" },
];

export default function RetraitsPage() {
  const qc = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useState("WAVE");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RetraitsData>({
    queryKey: ["affilie-retraits"],
    queryFn: () => fetch("/api/formations/affilie/retraits").then((r) => r.json()),
    staleTime: 30_000,
  });

  const available = data?.balance ?? 0;
  const paidEarnings = data?.paidEarnings ?? 0;
  const history: PayoutRecord[] = data?.history ?? [];

  const withdrawMutation = useMutation({
    mutationFn: (body: { amount: number; method: string }) =>
      fetch("/api/formations/affilie/retraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error ?? "Erreur serveur");
        return json;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["affilie-retraits"] });
      qc.invalidateQueries({ queryKey: ["affilie-stats"] });
      setStep("success");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setStep("form");
    },
  });

  const amountNum = parseFloat(amount.replace(/\s/g, "")) || 0;
  const isValid = amountNum >= 5000 && amountNum <= available;
  const method = PAYOUT_METHODS.find((m) => m.id === selectedMethod) ?? PAYOUT_METHODS[0];

  const handleWithdraw = () => {
    if (step === "form" && isValid) {
      setStep("confirm");
    } else if (step === "confirm") {
      withdrawMutation.mutate({ amount: amountNum, method: selectedMethod });
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <SkeletonBlock className="h-8 w-40 mb-2" />
          <SkeletonBlock className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <SkeletonBlock className="h-24" />
          <SkeletonBlock className="h-24" />
        </div>
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-white">Retraits</h1>
        <p className="text-sm text-[#5c9e7a] mt-0.5">Transférez vos commissions vers votre compte</p>
      </div>

      {step === "success" ? (
        <div className="bg-[#0d1f17] rounded-2xl border border-[#22c55e]/30 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-[#22c55e]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h2 className="text-lg font-extrabold text-white mb-2">Retrait initié !</h2>
          <p className="text-sm text-[#5c9e7a] mb-1">
            <strong className="text-white">{formatFcfa(amountNum)}</strong> seront transférés via {method.label}.
          </p>
          <p className="text-xs text-[#5c9e7a] mb-6">{method.desc.split("·")[0].trim()}</p>
          <button
            onClick={() => { setStep("form"); setAmount(""); }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            Retour aux retraits
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Main form */}
          <div className="md:col-span-3 space-y-5">
            {/* Balance cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <p className="text-[10px] text-[#5c9e7a] mb-1">Solde disponible</p>
                <p className="text-xl font-extrabold text-white">{formatFcfa(available)}</p>
                <p className="text-[10px] text-[#22c55e]">≈ {toEur(available)} €</p>
              </div>
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <p className="text-[10px] text-[#5c9e7a] mb-1">Total versé</p>
                <p className="text-xl font-extrabold text-blue-400">{formatFcfa(paidEarnings)}</p>
                <p className="text-[10px] text-[#5c9e7a]">≈ {toEur(paidEarnings)} €</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              </div>
            )}

            {step === "form" ? (
              <>
                {/* Amount */}
                <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
                  <label className="text-xs font-bold text-white mb-3 block">Montant à retirer</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={5000}
                      max={available}
                      className="w-full bg-[#1e3a2f] text-white text-xl font-bold rounded-xl px-5 py-4 pr-20 outline-none border border-[#1e3a2f] focus:border-[#22c55e] transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#5c9e7a] font-semibold">FCFA</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#5c9e7a]">Min. 5 000 FCFA</span>
                    <span className="text-[#1e3a2f]">·</span>
                    <button
                      onClick={() => setAmount(available.toString())}
                      className="text-[10px] text-[#22c55e] hover:underline font-semibold"
                    >
                      Tout retirer ({formatFcfa(available)})
                    </button>
                  </div>
                  {amountNum > 0 && (
                    <p className="text-xs text-[#5c9e7a] mt-2">
                      ≈ <strong className="text-white">{toEur(amountNum)} €</strong>
                    </p>
                  )}
                  {amountNum > available && (
                    <p className="text-xs text-red-400 mt-2">Montant supérieur au solde disponible.</p>
                  )}
                </div>

                {/* Method selection */}
                <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
                  <label className="text-xs font-bold text-white mb-3 block">Méthode de retrait</label>
                  <div className="space-y-2">
                    {PAYOUT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                          selectedMethod === m.id
                            ? "border-[#22c55e]/50 bg-[#22c55e]/10"
                            : "border-[#1e3a2f] hover:border-[#1e3a2f]/80"
                        }`}
                      >
                        <span className="text-xl">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white">{m.label}</span>
                          <p className="text-[10px] text-[#5c9e7a]">{m.desc}</p>
                        </div>
                        {selectedMethod === m.id && (
                          <span className="material-symbols-outlined text-[18px] text-[#22c55e] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Confirmation step */
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
                <h2 className="text-sm font-bold text-white mb-5">Confirmer le retrait</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Montant",    value: formatFcfa(amountNum) },
                    { label: "Équivalent", value: `≈ ${toEur(amountNum)} €` },
                    { label: "Méthode",    value: method.label },
                    { label: "Frais",      value: "0 FCFA" },
                    { label: "Délai",      value: method.desc.split("·")[0].trim() },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#1e3a2f] last:border-0">
                      <span className="text-xs text-[#5c9e7a]">{row.label}</span>
                      <span className="text-xs font-bold text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("form")}
                    disabled={withdrawMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#5c9e7a] border border-[#1e3a2f] hover:border-[#22c55e]/30 transition-colors disabled:opacity-40"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                  >
                    {withdrawMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Traitement…
                      </>
                    ) : "Confirmer"}
                  </button>
                </div>
              </div>
            )}

            {step === "form" && (
              <button
                onClick={handleWithdraw}
                disabled={!isValid}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all ${
                  isValid ? "hover:opacity-90 cursor-pointer" : "opacity-40 cursor-not-allowed"
                }`}
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                Continuer
              </button>
            )}
          </div>

          {/* Payout history sidebar */}
          <div className="md:col-span-2">
            <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
              <h2 className="text-xs font-bold text-white mb-4 uppercase tracking-wide">Historique</h2>
              {history.length === 0 ? (
                <p className="text-xs text-[#5c9e7a] text-center py-6">Aucun retrait effectué.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((p) => {
                    const date = p.paidAt ? new Date(p.paidAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";
                    return (
                      <div key={p.id} className="pb-3 border-b border-[#1e3a2f] last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#22c55e]">{formatFcfa(p.amount)}</span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">versé</span>
                        </div>
                        {p.ref && <p className="text-[10px] text-[#5c9e7a] font-mono">{p.ref}</p>}
                        <p className="text-[10px] text-[#5c9e7a]">{date}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {history.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#1e3a2f]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#5c9e7a]">Total versé</span>
                    <span className="text-xs font-bold text-white">
                      {formatFcfa(history.reduce((s, p) => s + p.amount, 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
