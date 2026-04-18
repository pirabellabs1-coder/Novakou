"use client";

import { useEffect, useState } from "react";
import { useToastStore } from "@/store/toast";

interface DnsRecord {
  type: string;
  name: string;
  value: string;
  note?: string;
}
interface DnsConflict {
  name: string;
  type: string;
  value: string;
}
interface DomainState {
  connected: boolean;
  domain: string | null;
  verified: boolean;
  ownership?: boolean;
  misconfigured?: boolean;
  conflicts?: DnsConflict[];
  currentDns?: { aValues: string[]; cnames: string[] };
  records: DnsRecord[];
  addedAt?: string | null;
}

function Copy({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* noop */
        }
      }}
      className="text-[#5c647a] hover:text-[#006e2f] transition-colors"
      title="Copier"
    >
      <span className="material-symbols-outlined text-[14px]">{copied ? "check" : "content_copy"}</span>
    </button>
  );
}

export default function ShopDomainPanel({ shopId }: { shopId: string }) {
  const [state, setState] = useState<DomainState | null>(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const toast = useToastStore.getState().addToast;

  const base = `/api/formations/vendeur/shops/${shopId}/domain`;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(base);
      const json = await res.json();
      setState(json.data ?? { connected: false, domain: null, verified: false, records: [] });
    } catch {
      toast("error", "Chargement du domaine impossible");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId]);

  async function handleConnect() {
    if (!input.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error ?? "Erreur lors de la connexion");
        return;
      }
      toast("success", "Domaine ajouté. Configurez les DNS, puis lancez la vérification.");
      setState(json.data);
      setInput("");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      const res = await fetch(`${base}/verify`, { method: "POST" });
      const json = await res.json();
      if (json.error) toast("warning", json.hint ?? json.error);
      if (json.data) {
        setState((s) =>
          s
            ? {
                ...s,
                verified: json.data.verified,
                ownership: json.data.ownership,
                misconfigured: json.data.misconfigured,
                conflicts: json.data.conflicts ?? [],
                currentDns: json.data.currentDns ?? s.currentDns,
                records: json.data.records,
              }
            : s,
        );
        if (json.data.verified) toast("success", "Domaine vérifié ✓ SSL provisionné");
        else if (json.data.misconfigured)
          toast("warning", "DNS incorrect — corrigez les enregistrements ci-dessous");
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Supprimer ce nom de domaine ?")) return;
    setDisconnecting(true);
    try {
      const res = await fetch(base, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast("error", j.error ?? "Erreur");
        return;
      }
      toast("success", "Domaine supprimé");
      setState({ connected: false, domain: null, verified: false, records: [] });
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
        <div className="h-5 w-48 bg-zinc-200 rounded mb-3" />
        <div className="h-12 bg-zinc-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="mb-5">
        <h2 className="text-base font-extrabold text-[#191c1e]">Nom de domaine personnalisé</h2>
        <p className="text-xs text-[#5c647a] mt-1">
          Connectez un domaine que vous possédez. SSL automatique inclus via Vercel.
        </p>
      </div>

      {!state?.connected ? (
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#5c647a] pointer-events-none">
              https://
            </span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="exemple.com ou shop.exemple.com"
              className="w-full pl-[68px] pr-4 py-3 text-sm rounded-xl border border-gray-200 bg-white text-[#191c1e] placeholder-gray-400 focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
            />
          </div>
          <button
            type="button"
            onClick={handleConnect}
            disabled={saving || !input.trim()}
            className="px-6 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 whitespace-nowrap"
            style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
          >
            {saving ? "Connexion…" : "Connecter"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`material-symbols-outlined flex-shrink-0 ${
                  state.verified
                    ? "text-[#006e2f]"
                    : state.misconfigured
                      ? "text-red-500"
                      : "text-amber-500"
                }`}
              >
                {state.verified ? "verified" : state.misconfigured ? "error" : "pending"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#191c1e] truncate">{state.domain}</p>
                <p className="text-xs text-[#5c647a]">
                  {state.verified
                    ? "Vérifié · SSL actif"
                    : state.misconfigured
                      ? "DNS incorrect — voir détails ci-dessous"
                      : "DNS en cours de propagation"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="px-4 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
            >
              Supprimer
            </button>
          </div>

          <div className="mt-5">
            {state.misconfigured && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-4">
                <span className="material-symbols-outlined text-red-500 flex-shrink-0">error</span>
                <div className="text-sm text-red-900 leading-relaxed space-y-2">
                  <p className="font-bold">DNS incorrect — le domaine ne pointe pas (ou pas seulement) vers Novakou.</p>
                  {(state.conflicts?.length ?? 0) > 0 && (
                    <div>
                      <p className="font-semibold mb-1">Enregistrements à supprimer chez votre registrar :</p>
                      <ul className="list-disc pl-5 space-y-0.5 font-mono text-xs">
                        {state.conflicts!.map((c, i) => (
                          <li key={i}>
                            {c.type} {c.name} → {c.value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(state.currentDns?.aValues?.length ?? 0) + (state.currentDns?.cnames?.length ?? 0) > 0 && (
                    <p className="text-xs">
                      DNS actuel détecté :{" "}
                      <span className="font-mono">
                        {[...(state.currentDns?.aValues ?? []), ...(state.currentDns?.cnames ?? [])].join(", ")}
                      </span>
                    </p>
                  )}
                  <p className="text-xs">
                    Configurez ensuite les enregistrements ci-dessous, puis relancez la vérification.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 mb-4">
              <span className="material-symbols-outlined text-blue-500 flex-shrink-0">info</span>
              <p className="text-sm text-blue-900 leading-relaxed">
                Configurez les enregistrements DNS suivants chez votre registrar. La propagation peut prendre
                jusqu&apos;à 1 heure. Pour un domaine racine, supprimez d&apos;abord tout enregistrement A/AAAA
                existant pour éviter les conflits.
              </p>
            </div>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[80px_140px_1fr] bg-gray-50 border-b border-gray-100 text-[11px] font-bold uppercase tracking-wider text-[#5c647a]">
                <div className="px-4 py-3">Type</div>
                <div className="px-4 py-3">Nom</div>
                <div className="px-4 py-3">Valeur</div>
              </div>
              {(state.records ?? []).map((r, i) => (
                <div
                  key={`${r.type}-${r.name}-${i}`}
                  className="grid grid-cols-[80px_140px_1fr] border-b border-gray-100 last:border-b-0 items-center"
                >
                  <div className="px-4 py-3">
                    <span className="inline-block text-[11px] font-bold px-2 py-1 rounded bg-[#006e2f]/10 text-[#006e2f] font-mono">
                      {r.type}
                    </span>
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <code className="text-sm font-mono text-[#191c1e] truncate">{r.name}</code>
                    <Copy value={r.name} />
                  </div>
                  <div className="px-4 py-3 flex items-center gap-2">
                    <code className="text-sm font-mono text-[#191c1e] break-all">{r.value}</code>
                    <Copy value={r.value} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs text-[#5c647a]">
                Novakou re-vérifie automatiquement à chaque chargement de la page.
              </p>
              <button
                type="button"
                onClick={handleVerify}
                disabled={verifying}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 inline-flex items-center gap-2"
                style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${verifying ? "animate-spin" : ""}`}
                >
                  {verifying ? "progress_activity" : "refresh"}
                </span>
                {verifying ? "Vérification…" : "Lancer une vérification"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
