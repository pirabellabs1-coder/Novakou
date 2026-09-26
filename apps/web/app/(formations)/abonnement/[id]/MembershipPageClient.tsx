"use client";

import { useState } from "react";
import { usePrix } from "@/components/formations/Prix";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  CreditCard,
  GraduationCap,
  Package,

  Loader2,
  Ban,
  RefreshCw,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { TiptapRenderer } from "@/components/formations/TiptapRenderer";
import { sora } from "@/lib/fonts";
import { ConfianceAchat } from "@/components/formations/achat/ConfianceAchat";
import "@/components/formations/achat/achat.css";

// Le formateur vit DANS le composant et derive du pays choisi : il couvre
// ainsi tous les prix de cet ecran d un coup. En fonction de module, il
// fallait ecrire « FCFA » en dur — donc rater la conversion partout.


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
  instructeur: { id: string };
  shop: { id: string; slug: string; name: string; logoUrl: string | null; themeColor: string | null } | null;
  includedFormations: IncludedItem[];
  includedProducts: IncludedItem[];
}

export default function MembershipPageClient({ plan }: { plan: Plan }) {
  const fmtFCFA = usePrix();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const themeColor = plan.shop?.themeColor ?? "#006e2f";
  const remaining = plan.maxMembers ? Math.max(0, plan.maxMembers - plan.activeCount) : null;
  const soldOut = plan.maxMembers !== null && remaining === 0;

  const [besoinPaiement, setBesoinPaiement] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  /**
   * Première étape : la route dit si un paiement est nécessaire (plan gratuit
   * ou essai → accès immédiat). Si oui, on affiche l'écran de paiement de la
   * plateforme, le même que pour n'importe quel achat.
   */
  async function handleSubscribe() {
    if (soldOut) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/formations/public/memberships/${plan.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const j = await r.json();
      if (j.code === "AUTH_REQUIRED") {
        window.location.href = `/connexion?callbackUrl=${encodeURIComponent(`/abonnement/${plan.id}`)}`;
        return;
      }
      if (j.data?.free || j.data?.trial) {
        window.location.href = j.data.redirect_url ?? "/apprenant/abonnements";
        return;
      }
      if (!r.ok) {
        setError(j.error ?? "Erreur lors de l'abonnement");
        return;
      }
      setBesoinPaiement(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  /** Deuxième étape : l'encaissement, par le chemin unique de la plateforme. */
  async function payerAbonnement({ operator, phone }: { operator: string; phone?: string; hosted: boolean }) {
    setLoading(true);
    setPayError(null);
    try {
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ membershipPlanId: plan.id, paymentMethod: operator, phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayError(json.error ?? "Le paiement n'a pas pu démarrer.");
        setLoading(false);
        return;
      }
      const url = json.data?.checkout_url ?? json.checkout_url;
      if (!url) {
        setPayError("Réponse de paiement invalide.");
        setLoading(false);
        return;
      }
      window.location.href = url;
    } catch {
      setPayError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  const total = plan.includedFormations.length + plan.includedProducts.length;

  return (
    <div
      className={`nka ${sora.variable} min-h-screen bg-[#f7f9fb]`}
      style={{ "--nka-accent": themeColor } as React.CSSProperties}
    >
      <div className="nka-hero mx-auto grid max-w-6xl grid-cols-1 gap-5 px-4 py-6 md:px-6 md:py-10 lg:grid-cols-3 lg:gap-8">
        {/* Main — bannière dans la colonne de gauche pour rester côte-à-côte
            avec la sidebar prix sur desktop ; empilée sur mobile uniquement. */}
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <div className="nka-bezel nka-bezel--float">
            <div className="nka-bezel__core nka-media relative aspect-video">
              {plan.bannerUrl || plan.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={plan.bannerUrl ?? plan.imageUrl ?? ""} alt={plan.name} className="h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#032314] via-[#04331c] to-[#006e2f]">
                  <CreditCard size={88} className="text-white/25" aria-hidden="true" />
                </div>
              )}
              <span className="nka-chip absolute left-3 top-3 shadow-sm">
                <CreditCard style={{ color: themeColor }} aria-hidden="true" />
                Abonnement {plan.interval === "yearly" ? "annuel" : "mensuel"}
              </span>
              {plan.trialDays != null && plan.trialDays > 0 && (
                <span className="nka-chip nka-chip--ink absolute right-3 top-3">
                  {plan.trialDays}j d&apos;essai gratuit
                </span>
              )}
            </div>
          </div>

          <div className="nka-bezel">
            <div className="nka-bezel__core p-5 sm:p-7 md:p-8">
              <p className="nka-eyebrow">Abonnement</p>
              <h1 className="nka-h1 mt-3">{plan.name}</h1>
              {plan.shop && (
                <Link href={`/${plan.shop.slug}`} className="nka-shop mt-4">
                  <span className="nka-shop__logo" aria-hidden="true">
                    {plan.shop.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={plan.shop.logoUrl} alt="" />
                    ) : (
                      plan.shop.name.slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <span className="nka-shop__name">{plan.shop.name}</span>
                </Link>
              )}
              {plan.description && (
                <TiptapRenderer content={plan.description} className="mt-5" />
              )}

              {plan.activeCount > 0 && (
                <p className="nka-chip mt-6 !whitespace-normal !leading-snug">
                  <BadgeCheck className="text-[#006e2f]" aria-hidden="true" />
                  <span>
                    <strong className="nka-num">{plan.activeCount}</strong> membre{plan.activeCount > 1 ? "s" : ""} actif{plan.activeCount > 1 ? "s" : ""}
                    {remaining !== null && remaining < 50 && (
                      <span className="text-[#8a4b00]">
                        {" "}· plus que {remaining} place{remaining > 1 ? "s" : ""}
                      </span>
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>

          {total > 0 && (
            <div className="nka-bezel">
              <div className="nka-bezel__core p-5 sm:p-7 md:p-8">
                <h2 className="nka-h2">
                  Inclus dans cet abonnement (<span className="nka-num">{total}</span>)
                </h2>
                <div className="mt-4 space-y-2.5">
                  {plan.includedFormations.map((f) => (
                    <Link key={`f-${f.id}`} href={`/formation/${f.slug}`} className="nka-item group">
                      <span className="nka-thumb nka-thumb--soft !h-16 !w-16">
                        {f.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={f.thumbnail} alt="" />
                        ) : (
                          <GraduationCap aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="nka-line__meta !mt-0 block">Formation</span>
                        <span className="mt-0.5 block truncate font-bold text-[#0e1512] transition-colors group-hover:text-[#006e2f]">{f.title}</span>
                        <span className="nka-num mt-1 block text-xs text-[#5c6b62]">Valeur unitaire : {fmtFCFA(f.price)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#5c6b62]" aria-hidden="true" />
                    </Link>
                  ))}
                  {plan.includedProducts.map((p) => (
                    <Link key={`p-${p.id}`} href={`/produit/${p.slug}`} className="nka-item group">
                      <span className="nka-thumb nka-thumb--soft !h-16 !w-16">
                        {p.banner ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.banner} alt="" />
                        ) : (
                          <Package aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="nka-line__meta !mt-0 block">Produit</span>
                        <span className="mt-0.5 block truncate font-bold text-[#0e1512] transition-colors group-hover:text-[#006e2f]">{p.title}</span>
                        <span className="nka-num mt-1 block text-xs text-[#5c6b62]">Valeur unitaire : {fmtFCFA(p.price)}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#5c6b62]" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="nka-bezel nka-bezel--float lg:sticky lg:top-24">
            <div className="nka-bezel__core p-5 sm:p-6">
              <p className="nka-eyebrow">Tarif</p>
              <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p className="nka-total__amount !text-left">{fmtFCFA(plan.price)}</p>
                <span className="text-sm font-semibold text-[#5c6b62]">
                  / {plan.interval === "yearly" ? "an" : "mois"}
                </span>
              </div>

              {besoinPaiement && (
                // L'écran de paiement de la plateforme, identique à celui d'un
                // achat de formation. Pas de page hébergée d'un fournisseur.
                <div className="mt-5 border-t border-[#e6ece8]">
                  {payError && (
                    <div className="nka-alert mt-5" role="alert">
                      <AlertCircle aria-hidden="true" />
                      <p className="min-w-0 flex-1">{payError}</p>
                    </div>
                  )}
                  <UnifiedPaymentScreen
                    embedded
                    amount={Math.round(plan.price)}
                    merchantName={plan.shop?.name ?? undefined}
                    submitting={loading}
                    onPay={(args) => { void payerAbonnement(args); }}
                  />
                </div>
              )}

              {!besoinPaiement && (
              <button
                onClick={handleSubscribe}
                disabled={loading || soldOut}
                aria-busy={loading || undefined}
                className={`nka-btn nka-btn--primary nka-btn--block nka-btn--lg mt-5 ${soldOut ? "is-off" : ""}`}
              >
                <span className="nka-btn__label">
                  {soldOut ? <Ban aria-hidden="true" /> : loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CreditCard aria-hidden="true" />}
                  {soldOut
                    ? "Plan complet"
                    : loading
                      ? "Initialisation…"
                      : plan.trialDays && plan.trialDays > 0
                        ? `Essayer ${plan.trialDays} jours gratuits`
                        : "S'abonner maintenant"}
                </span>
                {!soldOut && (
                  <span className="nka-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                )}
              </button>
              )}
              {error && (
                <div className="nka-alert mt-3" role="alert">
                  <AlertCircle aria-hidden="true" />
                  <p className="min-w-0 flex-1">{error}</p>
                </div>
              )}

              <ConfianceAchat
                moyens={false}
                className="mt-5 border-t border-[#e6ece8] pt-5"
                garanties={[
                  { Icone: RefreshCw, texte: "Renouvellement automatique" },
                  { Icone: XCircle, texte: "Annulez à tout moment" },
                  { Icone: ShieldCheck, texte: "Paiement 100% sécurisé" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
