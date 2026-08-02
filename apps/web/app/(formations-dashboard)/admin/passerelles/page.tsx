"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ST, StPageHeader, StCard, StChip, StButton, StInput } from "@/components/stitch";
import { Plug, ShieldCheck, ShieldAlert, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

type CredentialField = { key: string; label: string; secret: boolean };

type Gateway = {
  id: string;
  provider: string;
  label: string;
  isActive: boolean;
  canCollect: boolean;
  canPayout: boolean;
  isSandbox: boolean;
  priority: number;
  credentialsMasked: Record<string, string>;
  configured: boolean;
  lastTestAt: string | null;
  lastTestOk: boolean | null;
  lastTestMessage: string | null;
};

type Payload = {
  gateways: Gateway[];
  credentialFields: Record<string, CredentialField[]>;
  providerDirections: Record<string, string[]>;
  encryptionReady: boolean;
};

export default function PasserellesPage() {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [toast, setToast] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: Payload }>({
    queryKey: ["admin-payment-gateways"],
    queryFn: () => fetch("/api/formations/admin/payment-gateways").then((r) => r.json()),
  });

  const payload = data?.data;
  const gateways = payload?.gateways ?? [];

  const saveMut = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/formations/admin/payment-gateways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
      setDrafts((d) => ({ ...d, [String(vars.provider)]: {} }));
      setToast("Passerelle enregistrée");
      setTimeout(() => setToast(null), 3000);
    },
    onError: (e: Error) => {
      setToast(`Erreur : ${e.message}`);
      setTimeout(() => setToast(null), 6000);
    },
  });

  // Test de connexion : appel en LECTURE seule chez le fournisseur, pour
  // vérifier clés + autorisation d'IP sans déclencher de paiement réel.
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; diagnosis: string; detail: string }>>({});

  async function testConnection(provider: string) {
    setTesting(provider);
    try {
      const res = await fetch("/api/formations/admin/test-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await res.json();
      if (!res.ok) {
        setTestResult((r) => ({ ...r, [provider]: { ok: false, diagnosis: j.error ?? "Erreur", detail: "" } }));
      } else {
        setTestResult((r) => ({ ...r, [provider]: { ok: j.data.ok, diagnosis: j.data.diagnosis, detail: j.data.detail } }));
      }
    } catch (e) {
      setTestResult((r) => ({
        ...r,
        [provider]: { ok: false, diagnosis: e instanceof Error ? e.message : "Erreur réseau", detail: "" },
      }));
    } finally {
      setTesting(null);
    }
  }

  function setDraft(provider: string, key: string, value: string) {
    setDrafts((d) => ({ ...d, [provider]: { ...(d[provider] ?? {}), [key]: value } }));
  }

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-zinc-900 text-white px-5 py-3 text-xs font-bold uppercase tracking-widest shadow-2xl">
          {toast}
        </div>
      )}

      <StPageHeader
        title="Passerelles de paiement"
        subtitle="Branchez vos comptes marchands. Les moyens de paiement proposés à l'acheteur sont déduits automatiquement des passerelles actives."
      />

      {/* Sans clé de chiffrement, rien ne peut être enregistré — on le dit franchement. */}
      {payload && !payload.encryptionReady && (
        <StCard className="mb-5">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="flex-shrink-0 mt-0.5" style={{ color: "#b45309" }} />
            <div>
              <p className="text-[13px] font-extrabold" style={{ color: ST.text }}>
                Clé de chiffrement absente
              </p>
              <p className="text-[12px] font-semibold mt-1" style={{ color: ST.textSecondary }}>
                Les identifiants de passerelle sont chiffrés avant d&apos;être stockés. Générez une clé
                avec <code className="px-1 rounded bg-gray-100">openssl rand -base64 32</code> et posez-la
                dans la variable d&apos;environnement <strong>PAYMENT_CREDENTIALS_KEY</strong>, puis
                redéployez. Tant qu&apos;elle manque, aucun identifiant ne peut être enregistré — c&apos;est
                volontaire : on ne stocke jamais une clé de paiement en clair.
              </p>
            </div>
          </div>
        </StCard>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {gateways.map((g) => {
            const fields = payload?.credentialFields?.[g.provider] ?? [];
            const dirs = payload?.providerDirections?.[g.provider] ?? [];
            const draft = drafts[g.provider] ?? {};
            const collectImplemented = dirs.includes("collect");
            const payoutImplemented = dirs.includes("payout");

            return (
              <StCard key={g.provider}>
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                  {/* Identité + état */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Plug size={18} style={{ color: ST.green }} />
                      <h3 className="text-[15px] font-extrabold" style={{ color: ST.text }}>{g.label}</h3>
                      {g.isActive ? <StChip tone="green">Active</StChip> : <StChip tone="neutral">Inactive</StChip>}
                      {g.configured ? (
                        <StChip tone="blue" icon={ShieldCheck}>Configurée</StChip>
                      ) : (
                        <StChip tone="amber">Identifiants manquants</StChip>
                      )}
                      {g.isSandbox && <StChip tone="amber">Bac à sable</StChip>}
                    </div>

                    <p className="text-[11px] font-semibold mt-2" style={{ color: ST.textSecondary }}>
                      Implémenté chez nous :{" "}
                      {collectImplemented && "encaissement"}
                      {collectImplemented && payoutImplemented && " + "}
                      {payoutImplemented && "versement"}
                      {!collectImplemented && !payoutImplemented && "—"}
                    </p>

                    {g.lastTestMessage && (
                      <p className="text-[11px] font-semibold mt-1" style={{ color: g.lastTestOk ? ST.green : "#b45309" }}>
                        {g.lastTestMessage}
                      </p>
                    )}

                    {/* Identifiants */}
                    <div className="mt-4 space-y-3">
                      {fields.map((f) => (
                        <StInput
                          key={f.key}
                          label={f.label}
                          type={f.secret ? "password" : "text"}
                          autoComplete="off"
                          value={draft[f.key] ?? ""}
                          onChange={(e) => setDraft(g.provider, f.key, e.target.value)}
                          placeholder={
                            g.credentialsMasked[f.key]
                              ? `Enregistré : ${g.credentialsMasked[f.key]} — laisser vide pour conserver`
                              : "Non renseigné"
                          }
                        />
                      ))}
                      {fields.length === 0 && (
                        <p className="text-[12px] font-semibold" style={{ color: ST.textSecondary }}>
                          Aucun identifiant à saisir pour ce fournisseur.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Réglages */}
                  <div className="lg:w-64 flex-shrink-0 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: ST.text }}>
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={g.isActive}
                        onChange={(e) => saveMut.mutate({ provider: g.provider, isActive: e.target.checked })}
                      />
                      <span className="font-bold">Activer cette passerelle</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 text-[13px] ${collectImplemented ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                      style={{ color: ST.text }}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        disabled={!collectImplemented}
                        checked={g.canCollect}
                        onChange={(e) => saveMut.mutate({ provider: g.provider, canCollect: e.target.checked })}
                      />
                      <ArrowDownToLine size={14} />
                      <span className="font-semibold">Encaisser</span>
                    </label>

                    <label
                      className={`flex items-center gap-2 text-[13px] ${payoutImplemented ? "cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
                      style={{ color: ST.text }}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        disabled={!payoutImplemented}
                        checked={g.canPayout}
                        onChange={(e) => saveMut.mutate({ provider: g.provider, canPayout: e.target.checked })}
                      />
                      <ArrowUpFromLine size={14} />
                      <span className="font-semibold">Reverser</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-[13px]" style={{ color: ST.text }}>
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={g.isSandbox}
                        onChange={(e) => saveMut.mutate({ provider: g.provider, isSandbox: e.target.checked })}
                      />
                      <span className="font-semibold">Mode bac à sable</span>
                    </label>

                    <StInput
                      label="Priorité"
                      type="number"
                      defaultValue={g.priority}
                      hint="Petit = essayé en premier"
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== g.priority) {
                          saveMut.mutate({ provider: g.provider, priority: v });
                        }
                      }}
                    />

                    <StButton
                      className="w-full"
                      disabled={saveMut.isPending || Object.keys(draft).length === 0 || !payload?.encryptionReady}
                      onClick={() => saveMut.mutate({ provider: g.provider, credentials: draft })}
                    >
                      {saveMut.isPending ? "Enregistrement…" : "Enregistrer les identifiants"}
                    </StButton>

                    {(g.provider === "feexpay" || g.provider === "fedapay") && (
                      <>
                        <StButton
                          variant="secondary"
                          className="w-full"
                          disabled={testing === g.provider || !g.configured}
                          onClick={() => testConnection(g.provider)}
                        >
                          {testing === g.provider ? "Test en cours…" : "Tester la connexion"}
                        </StButton>
                        <p className="text-[10px] font-semibold" style={{ color: ST.textSecondary }}>
                          Lecture seule — aucun paiement déclenché.
                        </p>
                        {testResult[g.provider] && (
                          <div
                            className="rounded-xl p-3 text-[11px] font-semibold"
                            style={
                              testResult[g.provider].ok
                                ? { background: "#f0faf3", border: "1px solid #b9e6c9", color: "#0b5c2b" }
                                : { background: "#fdf1f1", border: "1px solid #f5c6c6", color: "#8a1c1c" }
                            }
                          >
                            <p>{testResult[g.provider].diagnosis}</p>
                            {testResult[g.provider].detail && (
                              <p className="mt-1.5 font-mono text-[10px] opacity-75 break-all">
                                {testResult[g.provider].detail}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </StCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
