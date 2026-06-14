"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Gift,
  GraduationCap,
  Package,
  Sparkles,
  Wallet,
  Loader2,
  ShoppingCart,
  Infinity as InfinityIcon,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";

const fmtFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

type Provider = "moneroo" | "paygenius";
interface ProviderInfo { id: Provider; label: string; available: boolean; description: string }

interface BundleItem {
  kind: "formation" | "product";
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  price: number;
}

interface Bundle {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  banner: string | null;
  priceXof: number;
  originalPriceXof: number | null;
  itemsSum: number;
  savings: number;
  savingsPct: number;
  purchases: number;
  instructeur: { id: string; name: string; image: string | null };
  shop: { id: string; slug: string; name: string; themeColor: string | null } | null;
  items: BundleItem[];
}

export default function BundlePageClient({ bundle }: { bundle: Bundle }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const themeColor = bundle.shop?.themeColor ?? "#006e2f";

  // Liste des providers disponibles (Moneroo / PayGenius). Source de vérité :
  // /api/formations/payment/providers (vérifie les env vars côté serveur).
  // Si un seul est dispo on cache le sélecteur — sinon le visiteur choisit.
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

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/formations/public/bundles/${bundle.slug}/buy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const j = await r.json();
      if (j.code === "AUTH_REQUIRED") {
        window.location.href = `/connexion?callbackUrl=${encodeURIComponent(`/bundle/${bundle.slug}`)}`;
        return;
      }
      if (!r.ok || !j.data?.checkout_url) {
        setError(j.error ?? "Erreur lors de l'initialisation du paiement");
        return;
      }
      window.location.href = j.data.checkout_url;
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main — la bannière vit MAINTENANT dans la colonne de gauche pour
            qu'elle reste à côté de la sidebar prix sur desktop, et qu'elle
            s'empile au-dessus uniquement sur mobile (lg:col-span-2). */}
        <div className="lg:col-span-2 space-y-5">
          {/* Banner */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-[#003d1a] to-[#22c55e]">
            {bundle.banner || bundle.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bundle.banner ?? bundle.thumbnail ?? ""} alt={bundle.title} className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Gift size={100} className="text-white/30" />
              </div>
            )}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-white/95 text-[#191c1e] shadow-sm">
              <Gift size={12} style={{ color: themeColor }} />
              Pack — {bundle.items.length} articles
            </div>
            {bundle.savingsPct > 0 && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase px-3 py-1.5 rounded-full bg-amber-400 text-amber-900 shadow-sm">
                -{bundle.savingsPct}% ÉCONOMIE
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#191c1e] leading-tight">{bundle.title}</h1>
            {bundle.shop && (
              <Link href={`/boutique/${bundle.shop.slug}`} className="inline-flex items-center gap-2 mt-3 text-sm text-[#5c647a] hover:text-[#191c1e]">
                {bundle.instructeur.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bundle.instructeur.image} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold">
                    {bundle.instructeur.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold">{bundle.instructeur.name}</span>
                <span className="text-zinc-300">·</span>
                <span>{bundle.shop.name}</span>
              </Link>
            )}
            {bundle.description && (
              <TiptapRenderer content={bundle.description} className="mt-4" />
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-extrabold text-[#191c1e] mb-4">
              Ce pack contient ({bundle.items.length})
            </h2>
            <div className="space-y-3">
              {bundle.items.map((it) => (
                <Link
                  key={`${it.kind}-${it.id}`}
                  href={it.kind === "formation" ? `/formation/${it.slug}` : `/produit/${it.slug}`}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#006e2f]/30 hover:shadow-sm transition-all group"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex-shrink-0">
                    {it.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.image} alt={it.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {it.kind === "formation" ? (
                          <GraduationCap size={28} className="text-white/60" />
                        ) : (
                          <Package size={28} className="text-white/60" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#5c647a]">
                      {it.kind === "formation" ? "Formation" : "Produit"}
                    </p>
                    <p className="font-bold text-[#191c1e] group-hover:text-[#006e2f] transition-colors line-clamp-1">
                      {it.title}
                    </p>
                    {it.description && (
                      <p className="text-xs text-[#5c647a] mt-1 line-clamp-2">{it.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-[#191c1e]">{fmtFCFA(it.price)}</p>
                    <p className="text-[10px] text-[#5c647a]">valeur unitaire</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar buy */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-4">
            {bundle.savingsPct > 0 && (
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 mb-2">
                Économisez {fmtFCFA(bundle.savings)}
              </span>
            )}
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-extrabold" style={{ color: themeColor }}>{fmtFCFA(bundle.priceXof)}</p>
            </div>
            {bundle.itemsSum > bundle.priceXof && (
              <p className="text-sm text-gray-400 line-through mt-1">{fmtFCFA(bundle.itemsSum)}</p>
            )}
            <p className="text-[11px] text-[#5c647a] mt-1">≈ {Math.round(bundle.priceXof / 655.957)} EUR</p>

            {/* Sélecteur de provider de paiement — visible si ≥ 2 dispo */}
            {availableProviders.length > 1 && (
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
                          ? "border-[#006e2f] bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {p.id === "paygenius" ? (
                        <Sparkles size={18} className={provider === p.id ? "text-[#006e2f]" : "text-[#5c647a]"} />
                      ) : (
                        <Wallet size={18} className={provider === p.id ? "text-[#006e2f]" : "text-[#5c647a]"} />
                      )}
                      <span className={`text-xs font-bold ${provider === p.id ? "text-[#006e2f]" : "text-[#191c1e]"}`}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${themeColor}, #22c55e)` }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />}
              {loading ? "Initialisation…" : "Acheter le pack"}
            </button>
            {error && (
              <p className="text-xs text-red-600 mt-3 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100 space-y-2 text-xs text-[#5c647a]">
              <div className="flex items-center gap-2">
                <InfinityIcon size={16} style={{ color: themeColor }} />
                Accès à vie aux {bundle.items.length} articles
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} style={{ color: themeColor }} />
                Paiement 100% sécurisé
              </div>
              <div className="flex items-center gap-2">
                <CalendarCheck size={16} style={{ color: themeColor }} />
                Garantie 14 jours
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
