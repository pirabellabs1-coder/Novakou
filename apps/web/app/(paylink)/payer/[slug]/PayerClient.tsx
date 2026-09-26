"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { sora } from "@/lib/fonts";
import AdaptiveImage from "@/components/formations/AdaptiveImage";
import { NovakouLogo } from "@/components/formations/CountryFlag";
import { ConfianceAchat } from "@/components/formations/achat/ConfianceAchat";
import "@/components/formations/achat/achat.css";
import { PixelInjector, type Pixel } from "@/components/formations/PixelInjector";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { KkiapayWidget, type KkiapayInit } from "@/components/formations/KkiapayWidget";
import { useToastStore } from "@/store/toast";

interface Link {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  thumbnail: string | null;
  active: boolean;
  allowCustomAmount: boolean;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

/** Identité affichée en tête : la BOUTIQUE (anonymat vendeur), jamais une personne. */
interface BoutiqueLien {
  nom: string;
  logoUrl: string | null;
}

export default function PayerClient({
  link,
  pixels = [],
  boutique = null,
}: {
  link: Link;
  pixels?: Array<{ type: string; pixelId: string }>;
  boutique?: BoutiqueLien | null;
}) {
  const { data: session } = useSession();
  const toast = useToastStore.getState().addToast;
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [amount, setAmount] = useState(link.price > 0 ? String(link.price) : "");
  const [loading, setLoading] = useState(false);
  // Tout sur une seule page : le second écran allongeait le tunnel pour rien.
  const [paySel, setPaySel] = useState<{ operator: string; phone?: string; hosted: boolean } | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  // Fenêtre KkiaPay : la seule passerelle qui débite depuis le navigateur.
  const [kkiapay, setKkiapay] = useState<KkiapayInit | null>(null);


  const themeColor = "#006e2f";

  /** Montant validé, ou null si l'acheteur doit corriger sa saisie. */
  function resolveAmount(): number | null {
    if (!link.allowCustomAmount) return link.price;
    const amt = Math.round(Number(amount));
    if (!Number.isFinite(amt) || amt < 100) return null;
    return amt;
  }

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    const isLoggedIn = !!session?.user?.id;
    if (!isLoggedIn && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast("error", "Entrez une adresse e-mail valide.");
      return;
    }
    if (resolveAmount() === null) {
      toast("error", "Le montant doit être d'au moins 100 FCFA.");
      return;
    }
    if (!paySel) {
      setPayError("Choisissez votre pays et votre moyen de paiement.");
      return;
    }
    setPayError(null);
    void startPayment(paySel);
  }

  async function startPayment({ operator, phone }: { operator: string; phone?: string; hosted: boolean }) {
    const isLoggedIn = !!session?.user?.id;
    const customAmount = link.allowCustomAmount ? resolveAmount() ?? undefined : undefined;
    setLoading(true);
    setPayError(null);
    try {
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [link.id],
          ...(isLoggedIn ? {} : { guestEmail: email.trim(), guestName: name.trim() || undefined }),
          ...(customAmount !== undefined ? { customAmount } : {}),
          paymentMethod: operator,
          phone,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPayError(json.error ?? "Le paiement n'a pas pu démarrer.");
        setLoading(false);
        return;
      }
      if (json.data?.mode === "widget") {
        setKkiapay(json.data as KkiapayInit);
        return;
      }
      const url = json.data?.checkout_url ?? json.checkout_url;
      if (!url) {
        setPayError("Réponse de paiement invalide.");
        setLoading(false);
        return;
      }
      // Mobile Money → page d'attente interne. Carte → page sécurisée du
      // fournisseur. Commande gratuite → page de retour interne.
      window.location.href = url;
    } catch {
      setPayError("Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  // En-tête : la boutique qui encaisse (logo + nom), sinon la marque Novakou.
  const enTete = (
    <div className="flex items-center justify-between gap-3">
      {boutique ? (
        <span className="nka-brand">
          <span className="nka-brand__logo" aria-hidden="true">
            {boutique.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={boutique.logoUrl} alt="" />
            ) : (
              boutique.nom.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className="min-w-0">
            <span className="nka-brand__txt">{boutique.nom}</span>
            <span className="nka-brand__sub">Lien de paiement</span>
          </span>
        </span>
      ) : (
        <span className="nka-brand">
          <span aria-hidden="true" className="flex">
            <NovakouLogo size={34} />
          </span>
          <span className="nka-brand__txt">Novakou</span>
        </span>
      )}
      <span className="nka-chip nka-chip--green">
        <ShieldCheck aria-hidden="true" />
        Paiement sécurisé
      </span>
    </div>
  );

  if (!link.active) {
    return (
      <div className={`nka ${sora.variable}`} style={{ "--nka-accent": themeColor } as React.CSSProperties}>
        <div className="nka-hero mx-auto max-w-5xl px-4 pb-16 pt-5 sm:px-6 md:pt-7">
          {enTete}
          <div className="nka-bezel nka-bezel--float mx-auto mt-14 max-w-md">
            <div className="nka-bezel__core px-6 py-10 text-center sm:px-8">
              <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff4e0] text-[#8a4b00] shadow-[inset_0_0_0_1px_rgba(138,75,0,0.14)]">
                <Lock size={24} aria-hidden="true" />
              </div>
              <h1 className="nka-h1 nka-h1--sm">Lien indisponible</h1>
              <p className="nka-lead mt-2">Ce lien de paiement a été mis en pause par son propriétaire.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`nka ${sora.variable}`} style={{ "--nka-accent": themeColor } as React.CSSProperties}>
      {/* Pixels du vendeur (FB/Google/TikTok) — event ViewContent pour le suivi des pubs. */}
      <PixelInjector pixels={pixels as Pixel[]} event={{ name: "ViewContent", value: link.price, currency: "XOF" }} />

      <div className="nka-hero mx-auto max-w-5xl px-4 pb-12 pt-5 sm:px-6 md:pt-7">
        {enTete}

        {/* Deux colonnes sur desktop : présentation à gauche, formulaire à droite,
            pour éviter une longue colonne verticale. Empilé sur mobile. */}
        <div className="mt-7 grid grid-cols-1 items-start gap-5 md:mt-10 lg:grid-cols-2 lg:gap-8">
          {/* ── Présentation produit ─────────────────────────────────────── */}
          <div className="nka-bezel nka-bezel--float lg:sticky lg:top-6">
            <div className="nka-bezel__core overflow-hidden">
              {link.thumbnail && (
                <div className="nka-media relative aspect-[16/9]">
                  <AdaptiveImage src={link.thumbnail} alt={link.title} />
                </div>
              )}
              <div className="p-5 sm:p-7">
                <p className="nka-eyebrow">Récapitulatif</p>
                <h1 className="nka-h1 nka-h1--sm mt-3">{link.title}</h1>
                {link.description && (
                  <p className="nka-lead mt-3 whitespace-pre-line">{link.description}</p>
                )}
                {/* Prix fixe mis en avant côté présentation (le montant libre est
                    saisi dans le formulaire, à droite). */}
                {!link.allowCustomAmount && (
                  <div className="nka-total">
                    <span className="nka-total__label">Montant</span>
                    <span className="nka-total__amount">{fmt(link.price)} FCFA</span>
                  </div>
                )}
                <ConfianceAchat
                  className="mt-5 border-t border-[#e6ece8] pt-5"
                  garanties={[
                    { Icone: ShieldCheck, texte: "Paiement sécurisé" },
                    { Icone: Mail, texte: "Reçu de paiement envoyé par e-mail, avec sa référence" },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* ── Formulaire de paiement ───────────────────────────────────── */}
          <div className="nka-bezel">
            <div className="nka-bezel__core p-5 sm:p-7">
              <form onSubmit={goToPayment} className="space-y-5">
                <div>
                  <h2 className="nka-h2">Vos informations</h2>
                  <p className="nka-etape__sub">Puis choisissez votre pays et votre moyen de paiement.</p>
                </div>

                {/* Montant libre : saisi ici (prix fixe affiché à gauche). */}
                {link.allowCustomAmount && (
                  <div className="nka-field">
                    <label htmlFor="nka-montant" className="nka-label">Montant à payer (FCFA)</label>
                    <input
                      id="nka-montant"
                      type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)}
                      placeholder="Entrez le montant"
                      aria-describedby="nka-montant-aide"
                      className="nka-input nka-input--lg"
                    />
                    <p id="nka-montant-aide" className="nka-hint">Vous choisissez le montant (minimum 100 FCFA).</p>
                  </div>
                )}

                {/* E-mail : TOUJOURS affiché — c'est l'adresse où part le reçu de
                    paiement. Pré-rempli avec l'e-mail du compte si connecté. */}
                <div className="nka-field">
                  <label htmlFor="nka-email" className="nka-label">Votre e-mail</label>
                  <input
                    id="nka-email"
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="vous@email.com"
                    autoComplete="email"
                    aria-describedby="nka-email-aide"
                    className="nka-input"
                  />
                  <p id="nka-email-aide" className="nka-hint">Votre reçu de paiement (avec la référence) sera envoyé à cette adresse.</p>
                </div>
                {!session?.user?.id && (
                  <div className="nka-field">
                    <label htmlFor="nka-nom" className="nka-label">
                      Votre nom <span className="nka-label__opt">(optionnel)</span>
                    </label>
                    <input
                      id="nka-nom"
                      type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="Nom complet"
                      autoComplete="name"
                      className="nka-input"
                    />
                  </div>
                )}

                {/* Pays + moyen, dans la page : c'était un second écran, il
                    allongeait le tunnel sans rien apporter. */}
                <div className="border-t border-[#e6ece8]">
                  {kkiapay && (
                    <KkiapayWidget
                      init={kkiapay}
                      onDelivered={() => { window.location.href = `/payment/return?ref=${encodeURIComponent(kkiapay.internalRef)}`; }}
                      onFailed={(m) => { setKkiapay(null); setPayError(m); setLoading(false); }}
                    />
                  )}
                  <UnifiedPaymentScreen
                    embedded
                    hideSubmit
                    amount={resolveAmount() ?? link.price}
                    buyerName={name.trim() || null}
                    onPay={(args) => { void startPayment(args); }}
                    onSelectionChange={setPaySel}
                    submitting={loading}
                    error={payError}
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  aria-busy={loading || undefined}
                  className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg"
                >
                  <span className="nka-btn__label">
                    {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Lock aria-hidden="true" />}
                    {loading ? "Traitement…" : link.allowCustomAmount ? "Payer maintenant" : `Payer ${fmt(link.price)} FCFA`}
                  </span>
                  <span className="nka-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </button>
                <p className="text-center text-[11px] text-[#5c6b62]">
                  Paiement sécurisé · Des frais opérateur peuvent s&apos;appliquer.
                </p>
              </form>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-[#5c6b62]">
          Propulsé par <a href="https://novakou.com" className="font-semibold text-[#006e2f] hover:underline">Novakou</a>
        </p>
      </div>
    </div>
  );
}
