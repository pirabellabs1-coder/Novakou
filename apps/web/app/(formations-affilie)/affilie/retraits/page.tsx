"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDraftField, clearDrafts } from "@/lib/hooks/use-draft-storage";

const DRAFT_PREFIX = "affilie:retrait";
const MIN = 5000;

type PayoutMethod = {
  id: string;
  label: string;
  icon: string;
  requiredFields: ("msisdn" | "iban")[];
  placeholder: { msisdn: string; iban: string };
  processingTime: string;
  category: "mobile_money" | "bank_transfer";
};
type WithdrawalRow = {
  id: string;
  amount: number;
  methodLabel: string;
  status: string;
  statusLabel: string;
  refusedReason: string | null;
  createdAt: string;
  processedAt: string | null;
};
type RetraitsData = {
  balance: number;
  pending: number;
  reserved: number;
  paidEarnings: number;
  history: WithdrawalRow[];
};

function formatFcfa(n: number) { return Math.round(n).toLocaleString("fr-FR") + " FCFA"; }
function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1e3a2f]/60 rounded-xl ${className ?? ""}`} />;
}
const STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  EN_ATTENTE: { bg: "bg-amber-500/20", fg: "text-amber-400" },
  TRAITE: { bg: "bg-[#22c55e]/20", fg: "text-[#22c55e]" },
  REFUSE: { bg: "bg-red-500/20", fg: "text-red-400" },
};

export default function RetraitsPage() {
  const qc = useQueryClient();
  const [selectedMethod, setSelectedMethod] = useDraftField(`${DRAFT_PREFIX}:method`, "");
  const [amount, setAmount] = useDraftField(`${DRAFT_PREFIX}:amount`, "");
  const [msisdn, setMsisdn] = useDraftField(`${DRAFT_PREFIX}:msisdn`, "");
  const [iban, setIban] = useDraftField(`${DRAFT_PREFIX}:iban`, "");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<RetraitsData>({
    queryKey: ["affilie-retraits"],
    queryFn: () => fetch("/api/formations/affilie/retraits").then((r) => r.json()),
    staleTime: 30_000,
  });
  const { data: methodsData } = useQuery<{ data: { methods: PayoutMethod[] } }>({
    queryKey: ["affilie-payout-methods"],
    queryFn: () => fetch("/api/formations/affilie/payout-methods").then((r) => r.json()),
    staleTime: 300_000,
  });

  const methods = useMemo(() => methodsData?.data?.methods ?? [], [methodsData]);
  const available = data?.balance ?? 0;
  const reserved = data?.reserved ?? 0;
  const pendingValidation = data?.pending ?? 0;
  const paidEarnings = data?.paidEarnings ?? 0;
  const history = data?.history ?? [];

  const method = methods.find((m) => m.id === selectedMethod) ?? methods[0];
  const needsMsisdn = method?.requiredFields.includes("msisdn");
  const needsIban = method?.requiredFields.includes("iban");

  const amountNum = parseFloat(String(amount).replace(/\s/g, "")) || 0;
  const detailsOk = (needsMsisdn && msisdn.trim().length >= 8) || (needsIban && iban.trim().length >= 10);
  const isValid = !!method && amountNum >= MIN && amountNum <= available && detailsOk;

  const withdrawMutation = useMutation({
    mutationFn: (body: { amount: number; method: string; msisdn?: string; iban?: string }) =>
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
      clearDrafts(DRAFT_PREFIX);
      setStep("success");
      setError(null);
    },
    onError: (err: Error) => { setError(err.message); setStep("form"); },
  });

  const handleWithdraw = () => {
    if (step === "form" && isValid) setStep("confirm");
    else if (step === "confirm" && method) {
      withdrawMutation.mutate({
        amount: amountNum,
        method: method.id,
        msisdn: needsMsisdn ? msisdn.trim() : undefined,
        iban: needsIban ? iban.trim() : undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6"><SkeletonBlock className="h-8 w-40 mb-2" /><SkeletonBlock className="h-4 w-64" /></div>
        <div className="grid grid-cols-3 gap-4 mb-6"><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /><SkeletonBlock className="h-24" /></div>
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-white">Retraits</h1>
        <p className="text-sm text-[#5c9e7a] mt-0.5">Transférez vos commissions validées vers votre compte</p>
      </div>

      {step === "success" ? (
        <div className="bg-[#0d1f17] rounded-2xl border border-[#22c55e]/30 p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#22c55e]/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-[#22c55e]" />
          </div>
          <h2 className="text-lg font-extrabold text-white mb-2">Demande enregistrée !</h2>
          <p className="text-sm text-[#5c9e7a] mb-1">
            <strong className="text-white">{formatFcfa(amountNum)}</strong> via {method?.label}.
          </p>
          <p className="text-xs text-[#5c9e7a] mb-6">En attente de versement — vous serez notifié dès le traitement (par e-mail et notification).</p>
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
          <div className="md:col-span-3 space-y-5">
            {/* Balances */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <p className="text-[10px] text-[#5c9e7a] mb-1">Disponible</p>
                <p className="text-lg font-extrabold text-white">{formatFcfa(available)}</p>
              </div>
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <p className="text-[10px] text-[#5c9e7a] mb-1">En validation</p>
                <p className="text-lg font-extrabold text-amber-400">{formatFcfa(pendingValidation)}</p>
              </div>
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-4">
                <p className="text-[10px] text-[#5c9e7a] mb-1">Total versé</p>
                <p className="text-lg font-extrabold text-blue-400">{formatFcfa(paidEarnings)}</p>
              </div>
            </div>
            {reserved > 0 && (
              <p className="text-[11px] text-[#5c9e7a]">{formatFcfa(reserved)} en cours de retrait (réservés, en attente de versement).</p>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-xs text-red-400 font-semibold">{error}</p>
              </div>
            )}

            {methods.length === 0 ? (
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
                <p className="text-xs text-[#5c9e7a]">Aucune méthode de versement disponible pour votre pays pour le moment. Contactez le support.</p>
              </div>
            ) : step === "form" ? (
              <>
                {/* Amount */}
                <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
                  <label className="text-xs font-bold text-white mb-3 block">Montant à retirer</label>
                  <div className="relative">
                    <input
                      type="number" placeholder="0" value={amount}
                      onChange={(e) => setAmount(e.target.value)} min={MIN} max={available}
                      className="w-full bg-[#1e3a2f] text-white text-xl font-bold rounded-xl px-5 py-4 pr-20 outline-none border border-[#1e3a2f] focus:border-[#22c55e] transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#5c9e7a] font-semibold">FCFA</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-[#5c9e7a]">Min. {formatFcfa(MIN)}</span>
                    <span className="text-[#1e3a2f]">·</span>
                    <button onClick={() => setAmount(String(available))} className="text-[10px] text-[#22c55e] hover:underline font-semibold">
                      Tout retirer ({formatFcfa(available)})
                    </button>
                  </div>
                  {amountNum > available && <p className="text-xs text-red-400 mt-2">Montant supérieur au solde disponible.</p>}
                </div>

                {/* Method */}
                <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
                  <label className="text-xs font-bold text-white mb-3 block">Méthode de retrait</label>
                  <div className="space-y-2">
                    {methods.map((m) => (
                      <button
                        key={m.id} onClick={() => setSelectedMethod(m.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left border transition-all ${
                          (method?.id === m.id) ? "border-[#22c55e]/50 bg-[#22c55e]/10" : "border-[#1e3a2f] hover:border-[#1e3a2f]/80"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-[#22c55e]">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-white">{m.label}</span>
                          <p className="text-[10px] text-[#5c9e7a]">{m.processingTime} · Frais : 0 FCFA</p>
                        </div>
                        {method?.id === m.id && <CheckCircle2 size={18} className="text-[#22c55e] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>

                  {/* Destination details */}
                  {method && (
                    <div className="mt-4">
                      {needsMsisdn && (
                        <>
                          <label className="text-xs font-bold text-white mb-2 block">Numéro Mobile Money</label>
                          <input
                            type="tel" value={msisdn} onChange={(e) => setMsisdn(e.target.value)}
                            placeholder={method.placeholder.msisdn || "+225 07 09 87 65 43"}
                            className="w-full bg-[#1e3a2f] text-white text-sm rounded-xl px-4 py-3 outline-none border border-[#1e3a2f] focus:border-[#22c55e] transition-colors"
                          />
                          <p className="text-[10px] text-[#5c9e7a] mt-1.5">Le numéro qui recevra les fonds. Vérifiez-le bien.</p>
                        </>
                      )}
                      {needsIban && (
                        <>
                          <label className="text-xs font-bold text-white mb-2 block">IBAN</label>
                          <input
                            type="text" value={iban} onChange={(e) => setIban(e.target.value)}
                            placeholder={method.placeholder.iban || "FR76 …"}
                            className="w-full bg-[#1e3a2f] text-white text-sm rounded-xl px-4 py-3 outline-none border border-[#1e3a2f] focus:border-[#22c55e] transition-colors font-mono"
                          />
                          <p className="text-[10px] text-[#5c9e7a] mt-1.5">Compte bancaire du bénéficiaire.</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={handleWithdraw} disabled={!isValid}
                  className={`w-full py-3 rounded-xl text-sm font-bold text-white transition-all ${isValid ? "hover:opacity-90 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                  style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
                >
                  Continuer
                </button>
              </>
            ) : (
              /* Confirm */
              <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-6">
                <h2 className="text-sm font-bold text-white mb-5">Confirmer le retrait</h2>
                <div className="space-y-3 mb-6">
                  {[
                    { label: "Montant", value: formatFcfa(amountNum) },
                    { label: "Méthode", value: method?.label ?? "—" },
                    { label: needsIban ? "IBAN" : "Numéro", value: needsIban ? iban : msisdn },
                    { label: "Frais", value: "0 FCFA" },
                    { label: "Délai", value: method?.processingTime ?? "—" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#1e3a2f] last:border-0">
                      <span className="text-xs text-[#5c9e7a]">{row.label}</span>
                      <span className="text-xs font-bold text-white break-all text-right ml-3">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("form")} disabled={withdrawMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#5c9e7a] border border-[#1e3a2f] hover:border-[#22c55e]/30 transition-colors disabled:opacity-40">
                    Modifier
                  </button>
                  <button onClick={handleWithdraw} disabled={withdrawMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                    {withdrawMutation.isPending ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Traitement…</>) : "Confirmer la demande"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* History */}
          <div className="md:col-span-2">
            <div className="bg-[#0d1f17] rounded-2xl border border-[#1e3a2f] p-5">
              <h2 className="text-xs font-bold text-white mb-4 uppercase tracking-wide">Mes retraits</h2>
              {history.length === 0 ? (
                <p className="text-xs text-[#5c9e7a] text-center py-6">Aucun retrait pour l'instant.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((p) => {
                    const date = new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
                    const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.EN_ATTENTE;
                    return (
                      <div key={p.id} className="pb-3 border-b border-[#1e3a2f] last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{formatFcfa(p.amount)}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${st.bg} ${st.fg}`}>{p.statusLabel}</span>
                        </div>
                        <p className="text-[10px] text-[#5c9e7a]">{p.methodLabel} · {date}</p>
                        {p.status === "REFUSE" && p.refusedReason && <p className="text-[10px] text-red-400 mt-1">{p.refusedReason}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
