"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

type Provider = "moneroo" | "paygenius";
interface ProviderInfo { id: Provider; label: string; available: boolean; description: string }

interface IncludedItem { id: string; slug: string; title: string; thumbnail?: string | null; banner?: string | null; price: number }
interface Plan {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  trialDays: number | null;
  maxMembers: number | null;
  activeCount: number;
  instructeur: { id: string; name: string; image: string | null };
  shop: { id: string; slug: string; name: string; themeColor: string | null } | null;
  includedFormations: IncludedItem[];
  includedProducts: IncludedItem[];
}

export default function MembershipPageClient({ plan }: { plan: Plan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const themeColor = plan.shop?.themeColor ?? "#006e2f";
  const remaining = plan.maxMembers ? Math.max(0, plan.maxMembers - plan.activeCount) : null;
  const soldOut = plan.maxMembers !== null && remaining === 0;

  // Provider selector — même pattern que la page bundle + le checkout principal.
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState<Provider>("moneroo");
  useEffect(() => {
    fetch("/api/formations/payment/providers")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []) as ProviderInfo[];
        setProviders(list);
        const firstAvail = list.find((p) => p.available);
        if (firstAvail) setProvider(firstAvail.id);
      })
      .catch(() => setProviders([]));
  }, []);
  const availableProviders = providers.filter((p) => p.available);

  async function handleSubscribe() {
    if (soldOut) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/formations/public/memberships/${plan.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await r.json();
      if (j.code === "AUTH_REQUIRED") {
        window.location.href = `/connexion?callbackUrl=${encodeURIComponent(`/abonnement/${plan.id}`)}`;
        return;
      }
      if (j.data?.free) {
        window.location.href = j.data.redirect_url ?? "/apprenant/abonnements";
        return;
      }
      if (!r.ok || !j.data?.checkout_url) {
        setError(j.error ?? "Erreur lors de l'abonnement");
        return;
      }
      window.location.href = j.data.checkout_url;
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const total = plan.includedFormations.length + plan.includedProducts.length;

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main — bannière dans la colonne de gauche pour rester côte-à-côte
            avec la sidebar prix sur desktop ; empilée sur mobile uniquement. */}
        <div className="lg:col-span-2 space-y-5">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-purple-700 to-pink-500">
            {plan.bannerUrl || plan.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={plan.bannerUrl ?? plan.imageUrl ?? ""} alt={plan.name} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/30 text-[100px]">card_membership</span>
              </div>
            )}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-white/95 text-[#191c1e] shadow-sm">
              <span className="material-symbols-outlined text-[12px]" style={{ color: themeColor }}>card_membership</span>
              Abonnement {plan.interval === "yearly" ? "annuel" : "mensuel"}
            </div>
            {plan.trialDays && plan.trialDays > 0 && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase px-3 py-1.5 rounded-full bg-purple-500 text-white shadow-sm">
                {plan.trialDays}j d&apos;essai gratuit
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">{plan.name}</h1>
            {plan.shop && (
              <Link href={`/boutique/${plan.shop.slug}`} className="inline-flex items-center gap-2 mt-3 text-sm text-[#5c647a] hover:text-[#191c1e]">
                {plan.instructeur.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={plan.instructeur.image} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    {plan.instructeur.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold">{plan.instructeur.name}</span>
                <span className="text-zinc-300">·</span>
                <span>{plan.shop.name}</span>
              </Link>
            )}
            {plan.description && (
              <TiptapRenderer content={plan.description} className="mt-4" />
            )}

            {plan.activeCount > 0 && (
              <div className="mt-5 inline-flex items-center gap-2 text-xs text-[#5c647a] bg-slate-50 px-3 py-1.5 rounded-full">
                <span className="material-symbols-outlined text-[14px] text-[#006e2f]">verified</span>
                <strong className="text-[#191c1e]">{plan.activeCount}</strong> membre{plan.activeCount > 1 ? "s" : ""} actif{plan.activeCount > 1 ? "s" : ""}
                {remaining !== null && remaining < 50 && (
                  <span className="text-amber-700 font-semibold">
                    · plus que {remaining} place{remaining > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
              <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">
                Inclus dans cet abonnement ({total})
              </h2>
              <div className="space-y-3">
                {plan.includedFormations.map((f) => (
                  <Link key={`f-${f.id}`} href={`/formation/${f.slug}`} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-300 transition-all group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {f.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.thumbnail} alt={f.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-slate-400">school</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Formation</p>
                      <p className="font-bold text-[#191c1e] line-clamp-1 group-hover:text-purple-700">{f.title}</p>
                      <p className="text-xs text-[#5c647a] mt-1">Valeur unitaire : {fmtFCFA(f.price)}</p>
                    </div>
                  </Link>
                ))}
                {plan.includedProducts.map((p) => (
                  <Link key={`p-${p.id}`} href={`/produit/${p.slug}`} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-300 transition-all group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      {p.banner ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.banner} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-2xl text-slate-400">inventory_2</span></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Produit</p>
                      <p className="font-bold text-[#191c1e] line-clamp-1 group-hover:text-purple-700">{p.title}</p>
                      <p className="text-xs text-[#5c647a] mt-1">Valeur unitaire : {fmtFCFA(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-4">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold" style={{ color: themeColor }}>{fmtFCFA(plan.price)}</p>
              <span className="text-sm font-semibold text-[#5c647a]">
                / {plan.interval === "yearly" ? "an" : "mois"}
              </span>
            </div>
            <p className="text-[11px] text-[#5c647a] mt-1">≈ {Math.round(plan.price / 655.957)} EUR / {plan.interval === "yearly" ? "an" : "mois"}</p>

            {availableProviders.length > 1 && !soldOut && (
              <div className="mt-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c647a] mb-2">
                  Choisissez votre passerelle de paiement
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {availableProviders.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                        provider === p.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${provider === p.id ? "text-purple-600" : "text-[#5c647a]"}`}
                      >
                        {p.id === "paygenius" ? "auto_awesome" : "account_balance_wallet"}
                      </span>
                      <span className={`text-xs font-bold ${provider === p.id ? "text-purple-700" : "text-[#191c1e]"}`}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading || soldOut}
              className="w-full mt-4 py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: soldOut
                  ? "linear-gradient(to right, #94a3b8, #64748b)"
                  : `linear-gradient(to right, ${themeColor}, #22c55e)`,
              }}
            >
              <span className="material-symbols-outlined text-[18px]">
                {soldOut ? "block" : loading ? "progress_activity" : "card_membership"}
              </span>
              {soldOut
                ? "Plan complet"
                : loading
                  ? "Initialisation…"
                  : plan.trialDays && plan.trialDays > 0
                    ? `Essayer ${plan.trialDays} jours gratuits`
                    : "S'abonner maintenant"}
            </button>
            {error && (
              <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-xs text-[#5c647a]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: themeColor }}>autorenew</span>
                Renouvellement automatique
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: themeColor }}>cancel</span>
                Annulez à tout moment
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: themeColor }}>verified_user</span>
                Paiement 100% sécurisé
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
