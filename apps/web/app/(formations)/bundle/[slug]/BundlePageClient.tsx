"use client";

import { useState } from "react";
import { usePrix } from "@/components/formations/Prix";
import { useSession } from "next-auth/react";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { KkiapayWidget, type KkiapayInit } from "@/components/formations/KkiapayWidget";
import Link from "next/link";
import {
  Gift,
  GraduationCap,
  Package,
  Infinity as InfinityIcon,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";

// Le formateur vit DANS le composant et derive du pays choisi : il couvre
// ainsi tous les prix de cet ecran d un coup. En fonction de module, il
// fallait ecrire « FCFA » en dur — donc rater la conversion partout.

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
  instructeur: { id: string };
  shop: { id: string; slug: string; name: string; logoUrl: string | null; themeColor: string | null } | null;
  items: BundleItem[];
}

export default function BundlePageClient({ bundle }: { bundle: Bundle }) {
  const fmtFCFA = usePrix();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const themeColor = bundle.shop?.themeColor ?? "#006e2f";

  const [kkiapay, setKkiapay] = useState<KkiapayInit | null>(null);
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [name, setName] = useState(session?.user?.name ?? "");
  const connecte = !!session?.user?.id;

  /**
   * Achat d'un pack par le MÊME chemin que tout le reste : l'écran de paiement
   * unique, puis /payment/init. Le pack est développé côté serveur en ses
   * formations et produits — c'est lui qui décide du contenu et du prix.
   *
   * Avant, ce parcours avait sa propre route et partait sur la page hébergée
   * d'une passerelle retirée : deux tunnels d'achat, dont un que plus personne
   * ne corrigeait.
   */
  async function startPayment({ operator, phone }: { operator: string; phone?: string; hosted: boolean }) {
    if (!connecte && !email.trim()) {
      setError("Votre e-mail est nécessaire pour recevoir le pack.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bundleId: bundle.id,
          ...(connecte ? {} : { guestEmail: email.trim(), guestName: name.trim() || undefined }),
          paymentMethod: operator,
          phone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Le paiement n'a pas pu démarrer.");
        setLoading(false);
        return;
      }
      if (json.data?.mode === "widget") {
        setKkiapay(json.data as KkiapayInit);
        return;
      }
      const url = json.data?.checkout_url ?? json.checkout_url;
      if (!url) {
        setError("Réponse de paiement invalide.");
        setLoading(false);
        return;
      }
      window.location.href = url;
    } catch {
      setError("Connexion impossible. Réessayez.");
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
              <Link href={`/${bundle.shop.slug}`} className="inline-flex items-center gap-2 mt-3 text-sm text-[#5c647a] hover:text-[#191c1e]">
                {bundle.shop.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bundle.shop.logoUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center text-white text-xs font-bold">
                    {bundle.shop.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="font-semibold">{bundle.shop.name}</span>
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

            {!connecte && (
              <div className="mt-5 space-y-2">
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre e-mail" required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#006e2f]"
                />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom (facultatif)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#006e2f]"
                />
                <p className="text-[11px] text-[#5c647a]">C'est là que le pack sera envoyé.</p>
              </div>
            )}

            {/* L'écran de paiement de la plateforme, identique à celui d'un
                achat simple : pays, moyen, numéro, puis paiement. */}
            <div className="mt-5">
              {kkiapay && (
                // Passerelle à fenêtre : elle s'ouvre SUR notre page, l'acheteur
                // ne part jamais ailleurs.
                <KkiapayWidget
                  init={kkiapay}
                  onDelivered={() => { window.location.href = `/payment/return?ref=${encodeURIComponent(kkiapay.internalRef)}`; }}
                  onFailed={(m) => { setKkiapay(null); setError(m); setLoading(false); }}
                />
              )}
              <UnifiedPaymentScreen
                embedded
                amount={bundle.priceXof}
                buyerName={name.trim() || null}
                merchantName={bundle.shop?.name ?? undefined}
                submitting={loading}
                onPay={(args) => { void startPayment(args); }}
              />
            </div>

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
                Accès immédiat après achat
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
