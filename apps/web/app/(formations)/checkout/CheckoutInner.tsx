"use client";

import { useEffect, useRef, useState } from "react";
import { usePrix } from "@/components/formations/Prix";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isAllowedBuyerEmail, ALLOWED_BUYER_EMAIL_MESSAGE } from "@/lib/email/allowed-buyer-email";
import {
  Lock,
  CheckCircle2,
  Loader2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  FolderArchive,
  Gift,
  ShoppingCart,
  Tag,
  ShieldCheck,
  Download,
  Zap,
} from "lucide-react";
import { sora } from "@/lib/fonts";
import { NovakouLogo } from "@/components/formations/CountryFlag";
import { EtapesAchat } from "@/components/formations/achat/EtapesAchat";
import { CarteEtape } from "@/components/formations/achat/CarteEtape";
import { ConfianceAchat } from "@/components/formations/achat/ConfianceAchat";
import "@/components/formations/achat/achat.css";
import { PixelInjector } from "@/components/formations/PixelInjector";
import { UnifiedPaymentScreen } from "@/components/formations/UnifiedPaymentScreen";
import { KkiapayWidget, type KkiapayInit } from "@/components/formations/KkiapayWidget";
import { COUNTRIES as ALL_COUNTRIES } from "@/lib/countries";
import { useDraftField, clearDrafts } from "@/lib/hooks/use-draft-storage";
import { trackEvents } from "@/lib/tracking/events";

const CHECKOUT_DRAFT_PREFIX = "checkout:contact";

// On adapte la liste centralisée (lib/countries.ts) au format attendu
// par le sélecteur du checkout : { code: "+221", label: "...", iso: "SN" }.
const COUNTRIES = ALL_COUNTRIES.map((c) => ({
  code: c.dial,
  label: c.name,
  iso: c.code,
}));

// Identifiants alignés sur Vendeur.acceptedPaymentMethods (côté vendeur).
type PaymentMethod =
  | "orange_money"
  | "wave"
  | "mtn_momo"
  | "moov_money"
  | "card"
  | "paypal"
  | "bank_transfer";


// Plus de « choix de passerelle » côté acheteur : il choisit un PAYS et un
// MOYEN, le serveur décide seul par quelle passerelle l'argent transite.
type CartItem = {
  id: string;
  kind: "formation" | "product";
  title: string;
  price: number;
  thumbnail?: string | null;
};

// Le formateur vit desormais DANS le composant, derive du pays choisi : il
// couvre d'un coup les douze prix de cet ecran. Le sortir en fonction de module
// obligeait a ecrire « FCFA » en dur, donc a rater la conversion partout.

// Sépare un numéro complet (« +2250700000000 ») en indicatif + numéro local,
// en s'appuyant sur les indicatifs connus. Utilisé pour préremplir le champ
// téléphone depuis un moyen Mobile Money enregistré.
function splitDial(full: string): { dial: string; local: string } {
  const trimmed = full.trim();
  if (trimmed.startsWith("+")) {
    // Cherche l'indicatif le plus long qui préfixe le numéro.
    let best = "";
    for (const c of COUNTRIES) {
      if (trimmed.startsWith(c.code) && c.code.length > best.length) best = c.code;
    }
    if (best) return { dial: best, local: trimmed.slice(best.length).replace(/\D/g, "") };
  }
  return { dial: "", local: trimmed.replace(/\D/g, "") };
}

export default function CheckoutInner() {
  // Le panier doit afficher la MEME devise que la fiche produit. Un acheteur
  // qui lit 48 000 GNF puis retrouve 3 000 FCFA au panier ne sait plus ce
  // qu'on va lui debiter — c'est l'ecran ou ce doute coute le plus cher.
  const formatFCFA = usePrix();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  // Persist contact details across refreshes — buyers on slow mobile
  // connections lose the form when the gateway redirects them back
  // after a failed payment, otherwise they retype everything.
  const [firstName, setFirstName] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:firstName`, "");
  const [lastName, setLastName] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:lastName`, "");
  const [email, setEmail] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:email`, "");
  const [phone, setPhone] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:phone`, "");
  const [countryCode, setCountryCode] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:countryCode`, "+221");
  // Achat-cadeau : offrir la commande à quelqu'un d'autre (le destinataire).
  // JAMAIS mémorisé dans le navigateur : une case « cadeau » restée cochée
  // d'un achat précédent envoyait la commande suivante chez l'ancien
  // destinataire — l'acheteur payait et ne trouvait rien dans son espace.
  // Le cadeau est un choix délibéré, à refaire à chaque commande.
  const [giftEnabled, setGiftEnabled] = useState(false);
  const [giftEmail, setGiftEmail] = useState("");
  const [giftName, setGiftName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  // Purge des anciens brouillons « cadeau » laissés par la version précédente.
  useEffect(() => {
    clearDrafts(`${CHECKOUT_DRAFT_PREFIX}:gift`);
  }, []);
  // Avertissement « le destinataire possède déjà » (régime avertir mais autoriser).
  const [giftOwned, setGiftOwned] = useState<string[]>([]);
  // Sélection courante de l'écran de paiement, intégré plus bas dans CETTE
  // page. Le tunnel tenait sur deux écrans successifs ; un acheteur a écrit à
  // son vendeur que c'était trop long, au point qu'il a coupé ses publicités.
  const [paySel, setPaySel] = useState<{ operator: string; phone?: string; hosted: boolean } | null>(null);
  // Fenêtre KkiaPay : la seule passerelle qui débite depuis le navigateur.
  const [kkiapay, setKkiapay] = useState<KkiapayInit | null>(null);

  const [discountCode, setDiscountCode] = useState("");
  const [promoOuvert, setPromoOuvert] = useState(false);
  const [discountStatus, setDiscountStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cart items ──────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

  // ── Order Bumps ─────────────────────────────────────────────────────────────
  type OrderBump = {
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    price: number;
    originalPrice: number | null;
    bumpFormation: { id: string; title: string; slug: string; thumbnail: string | null } | null;
    bumpProduct: { id: string; title: string; slug: string; banner: string | null } | null;
  };
  const [availableBumps, setAvailableBumps] = useState<OrderBump[]>([]);
  const [acceptedBumpIds, setAcceptedBumpIds] = useState<string[]>([]);

  // ── Pixels marketing vendeurs (FB, Google, TikTok) ──────────────────────
  const [checkoutPixels, setCheckoutPixels] = useState<Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK" | "SNAPCHAT" | "PINTEREST"; pixelId: string }>>([]);

  // ── Pre-fill from session ───────────────────────────────────────────────────
  useEffect(() => {
    if (session?.user) {
      const name = session.user.name ?? "";
      const parts = name.trim().split(" ");
      setFirstName(parts[0] ?? "");
      setLastName(parts.slice(1).join(" ") ?? "");
      setEmail(session.user.email ?? "");
    }
  }, [session]);

  // ── Load items: URL params → direct buy; else cart ─────────────────────────
  useEffect(() => {
    async function load() {
      setCartLoading(true);
      const fidsParam = searchParams.get("fids");
      const pidsParam = searchParams.get("pids");
      const discParam = searchParams.get("code");
      if (discParam) setDiscountCode(discParam.toUpperCase());

      // Direct "Buy now" flow
      if (fidsParam || pidsParam) {
        const fids = fidsParam?.split(",").filter(Boolean) ?? [];
        const pids = pidsParam?.split(",").filter(Boolean) ?? [];
        const items: CartItem[] = [];

        if (fids.length > 0) {
          // Fetch each formation by id (in parallel) via the public funnel-item endpoint
          await Promise.all(
            fids.map(async (id) => {
              try {
                const res = await fetch(`/api/formations/public/funnel-item?kind=formation&id=${encodeURIComponent(id)}`);
                if (!res.ok) {
                  items.push({ id, kind: "formation", title: "Formation", price: 0 });
                  return;
                }
                const json = await res.json();
                const f = json.data;
                if (f) {
                  items.push({
                    id: f.id,
                    kind: "formation",
                    title: f.title ?? "Formation",
                    price: f.price ?? 0,
                    thumbnail: f.thumbnail,
                  });
                } else {
                  items.push({ id, kind: "formation", title: "Formation", price: 0 });
                }
              } catch {
                items.push({ id, kind: "formation", title: "Formation", price: 0 });
              }
            })
          );
        }
        if (pids.length > 0) {
          // Fetch real product details (title, price, banner) — was hardcoded to 0
          await Promise.all(
            pids.map(async (id) => {
              try {
                const res = await fetch(`/api/formations/public/funnel-item?kind=product&id=${encodeURIComponent(id)}`);
                if (!res.ok) {
                  items.push({ id, kind: "product", title: "Produit numérique", price: 0 });
                  return;
                }
                const json = await res.json();
                const p = json.data;
                if (p) {
                  items.push({
                    id,
                    kind: "product",
                    title: p.title ?? "Produit numérique",
                    price: typeof p.price === "number" ? p.price : 0,
                    thumbnail: p.image ?? undefined,
                  });
                } else {
                  items.push({ id, kind: "product", title: "Produit numérique", price: 0 });
                }
              } catch {
                items.push({ id, kind: "product", title: "Produit numérique", price: 0 });
              }
            })
          );
        }
        setCartItems(items);
        setCartLoading(false);
        return;
      }

      // Cart flow
      try {
        const res = await fetch("/api/formations/apprenant/cart");
        const json = await res.json();
        const items: CartItem[] = (json.data ?? []).map((item: {
          id: string;
          formation?: { id: string; title: string; price: number; thumbnail?: string | null } | null;
          product?: { id: string; title: string; price: number; thumbnail?: string | null } | null;
        }) => {
          if (item.product) {
            return {
              id: item.product.id,
              kind: "product" as const,
              title: item.product.title ?? "Produit",
              price: item.product.price ?? 0,
              thumbnail: item.product.thumbnail,
            };
          }
          return {
            id: item.formation?.id ?? item.id,
            kind: "formation" as const,
            title: item.formation?.title ?? "Formation",
            price: item.formation?.price ?? 0,
            thumbnail: item.formation?.thumbnail,
          };
        });
        setCartItems(items);
      } catch {
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    }
    load();
  }, [searchParams]);

  // ── Tracking funnel : checkout_started fired ONCE when cart is loaded ──
  const checkoutTrackedRef = useRef(false);
  useEffect(() => {
    if (checkoutTrackedRef.current) return;
    if (cartLoading) return;
    if (cartItems.length === 0) return;
    checkoutTrackedRef.current = true;
    const total = cartItems.reduce((s, i) => s + (i.price || 0), 0);
    trackEvents.checkoutStarted({
      itemCount: cartItems.length,
      total,
      currency: "XOF",
    });
  }, [cartLoading, cartItems]);

  // ── Fetch Order Bumps + Pixels applicables au cart ─────────────────────
  useEffect(() => {
    if (cartItems.length === 0) {
      setAvailableBumps([]);
      setCheckoutPixels([]);
      return;
    }
    const formationIds = cartItems.filter((i) => i.kind === "formation").map((i) => i.id);
    const productIds = cartItems.filter((i) => i.kind === "product").map((i) => i.id);
    const qs = new URLSearchParams();
    if (formationIds.length > 0) qs.set("formationIds", formationIds.join(","));
    if (productIds.length > 0) qs.set("productIds", productIds.join(","));
    fetch(`/api/formations/public/order-bumps?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setAvailableBumps(j.data ?? []))
      .catch(() => setAvailableBumps([]));
    fetch(`/api/formations/public/pixels?${qs.toString()}`)
      .then((r) => r.json())
      .then((j) => setCheckoutPixels(j.data ?? []))
      .catch(() => setCheckoutPixels([]));
  }, [cartItems]);

  // ── Préremplissage : téléphone du moyen Mobile Money par défaut ────────
  // Seulement avec une session : un visiteur n'a pas de moyens sauvegardés, et
  // l'appel ne produisait qu'un 401 par visite (13 par jour dans les journaux).
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch("/api/payment-methods")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.methods || !Array.isArray(j.methods)) return;
        const momos = (j.methods as Array<{ type: string; provider?: string; phone?: string; isDefault: boolean }>)
          .filter((m) => m.type === "momo" && m.phone);
        const def = momos.find((m) => m.isDefault) ?? momos[0];
        if (!def?.phone) return;
        const { dial, local } = splitDial(def.phone);
        if (local) setPhone((cur) => cur || local);
        if (dial) setCountryCode((cur) => cur || dial);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  const subTotal = cartItems.reduce((s, i) => s + i.price, 0);
  const bumpsTotal = availableBumps
    .filter((b) => acceptedBumpIds.includes(b.id))
    .reduce((s, b) => s + b.price, 0);
  const totalAmount = Math.max(0, subTotal + bumpsTotal - discountAmount);

  // ── Validation live du code promo (debounce 500ms) ─────────────────────────
  useEffect(() => {
    const code = discountCode.trim().toUpperCase();
    if (!code) {
      setDiscountStatus("idle");
      setDiscountAmount(0);
      setDiscountMessage(null);
      return;
    }
    if (code.length < 3 || subTotal === 0) return;
    setDiscountStatus("validating");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/formations/public/validate-discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // On envoie les lignes du panier : l'aperçu applique EXACTEMENT la
          // logique du débit réel (propriétaire du code + portée) → jamais de
          // remise affichée que le paiement refuserait.
          body: JSON.stringify({
            code,
            orderAmount: subTotal,
            formationIds: cartItems.filter((i) => i.kind === "formation").map((i) => i.id),
            productIds: cartItems.filter((i) => i.kind === "product").map((i) => i.id),
          }),
        });
        const j = await res.json();
        if (j.valid) {
          setDiscountStatus("valid");
          setDiscountAmount(Number(j.discountAmount) || 0);
          const pct = j.discountType === "PERCENTAGE" ? ` (-${j.discountValue}%)` : "";
          setDiscountMessage(`Code appliqué${pct} — économie de ${formatFCFA(Number(j.discountAmount) || 0)}`);
        } else {
          setDiscountStatus("invalid");
          setDiscountAmount(0);
          setDiscountMessage(j.error || "Code invalide ou expiré");
        }
      } catch {
        setDiscountStatus("invalid");
        setDiscountAmount(0);
        setDiscountMessage("Erreur de vérification du code");
      }
    }, 500);
    return () => clearTimeout(t);
  }, [discountCode, subTotal]);
  const formationIds = cartItems.filter((i) => i.kind === "formation").map((i) => i.id);
  const productIds = cartItems.filter((i) => i.kind === "product").map((i) => i.id);

  // Achat-cadeau : vérifie (débounce) si le DESTINATAIRE possède déjà un item →
  // avertissement (on autorise quand même). Clés en chaîne pour éviter les
  // boucles d'identité de tableau.
  const giftFids = formationIds.join(",");
  const giftPids = productIds.join(",");
  useEffect(() => {
    if (!giftEnabled) { setGiftOwned([]); return; }
    const em = giftEmail.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setGiftOwned([]); return; }
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ email: em });
        if (giftFids) params.set("fids", giftFids);
        if (giftPids) params.set("pids", giftPids);
        const r = await fetch(`/api/formations/gift/check?${params.toString()}`);
        const j = await r.json();
        setGiftOwned((j.data?.owned ?? []).map((o: { title: string }) => o.title));
      } catch { setGiftOwned([]); }
    }, 500);
    return () => clearTimeout(t);
  }, [giftEnabled, giftEmail, giftFids, giftPids]);

  /**
   * Lance le paiement depuis la page unique. Si un champ manque, on le dit et
   * on amène l'acheteur au bon endroit plutôt que de le laisser deviner.
   */
  function goToPayment() {
    if (!email) { setError("Adresse email requise."); return; }
    // Invité : l'e-mail d'achat doit avoir un format valide (tout fournisseur accepté).
    if (!session && !isAllowedBuyerEmail(email)) { setError(ALLOWED_BUYER_EMAIL_MESSAGE); return; }
    if (cartItems.length === 0) { setError("Votre panier est vide."); return; }
    // Commande gratuite (produit offert ou remise de 100 %) : rien à encaisser.
    if (totalAmount > 0 && !paySel) {
      setError("Choisissez votre pays et votre moyen de paiement.");
      document.getElementById("moyen-de-paiement")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    void startPayment(paySel ?? { operator: "", hosted: false });
  }

  /**
   * L'écran de paiement nous rend un opérateur déjà résolu au pays
   * (« orange_sn », « card_xof »…). Le serveur choisit la passerelle.
   */
  async function startPayment({ operator, phone: payPhone }: { operator: string; phone?: string; hosted: boolean }) {
    // Achat-cadeau : un e-mail destinataire valide est requis si l'option est cochée.
    if (giftEnabled && !isAllowedBuyerEmail(giftEmail.trim().toLowerCase())) {
      setError(`Destinataire du cadeau : ${ALLOWED_BUYER_EMAIL_MESSAGE}`);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Le numéro saisi sur l'écran de paiement prime ; sinon celui du
      // formulaire de contact, préfixé de son indicatif.
      const fullPhone = payPhone || (phone ? `${countryCode}${phone.replace(/^0/, "")}` : undefined);
      // Resoudre les bumps acceptes en formationIds / productIds additionnels
      const acceptedBumps = availableBumps.filter((b) => acceptedBumpIds.includes(b.id));
      const bumpFormationIds = acceptedBumps.map((b) => b.bumpFormation?.id).filter(Boolean) as string[];
      const bumpProductIds = acceptedBumps.map((b) => b.bumpProduct?.id).filter(Boolean) as string[];
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationIds: [...formationIds, ...bumpFormationIds],
          productIds: [...productIds, ...bumpProductIds],
          bumpIds: acceptedBumpIds, // pour tracer le taux d'acceptation cote backend
          discountCode: discountCode || undefined,
          guestEmail: session ? undefined : email,
          guestName: session ? undefined : `${firstName} ${lastName}`.trim(),
          phone: fullPhone,
          // Opérateur déjà spécifique au pays, choisi sur l'écran unique.
          paymentMethod: operator,
          // Achat-cadeau : la commande est livrée au destinataire, pas au payeur.
          ...(giftEnabled && giftEmail.trim()
            ? {
                giftRecipientEmail: giftEmail.trim(),
                giftRecipientName: giftName.trim() || undefined,
                giftMessage: giftMessage.trim() || undefined,
              }
            : {}),
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.data) {
        setError(json.error ?? "Erreur lors de l'initialisation du paiement.");
        setLoading(false);
        return;
      }

      // La commande est partie chez la passerelle — on efface le brouillon pour
      // qu'un prochain achat ne réaffiche pas les coordonnées précédentes.
      clearDrafts(CHECKOUT_DRAFT_PREFIX);

      // Moyen à widget : la fenêtre du fournisseur s'ouvre sur notre page.
      if (json.data.mode === "widget") {
        setKkiapay(json.data as KkiapayInit);
        return;
      }

      const checkoutUrl: string = json.data.checkout_url;
      if (!checkoutUrl) {
        setError("Réponse de paiement invalide. Réessayez dans un instant.");
        setLoading(false);
        return;
      }

      // Mock/dev : page de retour interne.
      if (json.data.mock || json.data.free) {
        router.push(checkoutUrl);
        return;
      }

      // Mobile Money : page d'attente interne (le push part sur le téléphone).
      // Carte hébergée : page sécurisée du fournisseur.
      window.location.href = checkoutUrl;
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setLoading(false);
    }
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  // Affichage seul : l'étape mise en avant par l'indicateur. Aucune règle
  // ici — la validation reste entièrement dans goToPayment.
  const coordonneesSaisies = !!session?.user?.email || isAllowedBuyerEmail(email);
  const etapesAffichees = cartLoading || totalAmount > 0
    ? [{ libelle: "Coordonnées" }, { libelle: "Paiement" }, { libelle: "Accès" }]
    : [{ libelle: "Coordonnées" }, { libelle: "Accès" }];

  return (
    <div className={`nka ${sora.variable} min-h-screen bg-[#f7f9fb]`}>
      {/* Pixels vendeurs : event InitiateCheckout (tous les pixels des vendeurs du panier) */}
      {checkoutPixels.length > 0 && (
        <PixelInjector
          pixels={checkoutPixels}
          event={{ name: "InitiateCheckout", value: subTotal, currency: "XOF" }}
        />
      )}

      <div className="nka-hero mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6 md:pt-7 lg:pb-16">
        {/* Bandeau : marque + sécurité. Volontairement sans lien : sur la page
            où l'on paie, on n'ouvre aucune sortie (cf. lib/chrome-scope.ts). */}
        <div className="flex items-center justify-between gap-3">
          <span className="nka-brand">
            <span aria-hidden="true" className="flex">
              <NovakouLogo size={34} />
            </span>
            <span className="nka-brand__txt">Novakou</span>
          </span>
          <span className="nka-chip nka-chip--green">
            <Lock aria-hidden="true" />
            Paiement sécurisé
          </span>
        </div>

        {/* Header */}
        <div className="mt-8 flex flex-col gap-5 md:mt-10 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="nka-eyebrow">Commande</p>
            <h1 className="nka-h1 mt-3">Finaliser votre commande</h1>
            <p className="nka-lead mt-2">Paiement sécurisé SSL · Accès immédiat</p>
          </div>
          <EtapesAchat etapes={etapesAffichees} courante={coordonneesSaisies ? 1 : 0} className="md:mb-1.5" />
        </div>

        {/* Mobile : rappel compact de ce qu'on achète, en haut. Le détail
            complet (et accessible) reste dans le récapitulatif plus bas. */}
        {!cartLoading && cartItems.length > 0 && (
          <div className="nka-bezel mt-6 lg:hidden" aria-hidden="true">
            <div className="nka-bezel__core flex items-center gap-3 p-3">
              <span className="nka-thumb !h-11 !w-11 !rounded-xl">
                {cartItems[0].thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cartItems[0].thumbnail} alt="" />
                ) : cartItems[0].kind === "formation" ? (
                  <GraduationCap />
                ) : (
                  <FolderArchive />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#0e1512]">{cartItems[0].title}</p>
                {cartItems.length > 1 && (
                  <p className="nka-num text-xs text-[#5c6b62]">
                    + {cartItems.length - 1} autre{cartItems.length > 2 ? "s" : ""} article{cartItems.length > 2 ? "s" : ""}
                  </p>
                )}
              </div>
              <span className="nka-line__price">{formatFCFA(totalAmount)}</span>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:mt-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,400px)]">
          {/* Left — Payment form */}
          <div className="min-w-0 space-y-5">

            {/* Contact info */}
            <CarteEtape numero={1} titre="Informations de contact">
              <div className="grid grid-cols-1 gap-4">
                {/* Un seul champ de nom : « Prénom » puis « Nom » faisaient deux
                    saisies pour une information qui n'est même pas obligatoire. */}
                <div className="nka-field">
                  <label htmlFor="nka-nom" className="nka-label">
                    Votre nom <span className="nka-label__opt">(optionnel)</span>
                  </label>
                  <input
                    id="nka-nom"
                    type="text"
                    autoComplete="name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Comment vous appeler ?"
                    className="nka-input"
                  />
                </div>
                <div className="nka-field">
                  <label htmlFor="nka-email" className="nka-label">Adresse e-mail</label>
                  <input
                    id="nka-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.nom@email.com"
                    disabled={!!session?.user?.email}
                    aria-describedby="nka-email-aide"
                    className="nka-input"
                  />
                  <p id="nka-email-aide" className="nka-hint">Votre reçu et accès seront envoyés à cette adresse.</p>
                </div>

                {/* ── Offrir en cadeau ─────────────────────────────────────── */}
                <div>
                  <label className="nka-toggle">
                    <input
                      type="checkbox"
                      checked={giftEnabled}
                      onChange={(e) => setGiftEnabled(e.target.checked)}
                    />
                    <span className="nka-toggle__ico" aria-hidden="true">
                      <Gift />
                    </span>
                    <span className="text-sm font-semibold text-[#0e1512]">Offrir en cadeau à quelqu&apos;un d&apos;autre</span>
                  </label>
                  {giftEnabled && (
                    <div className="mt-3 grid grid-cols-1 gap-4 rounded-2xl bg-[#f7faf8] p-4 shadow-[inset_0_0_0_1px_rgba(14,21,18,0.06)]">
                      <div className="nka-field">
                        <label htmlFor="nka-cadeau-email" className="nka-label">E‑mail du destinataire</label>
                        <input
                          id="nka-cadeau-email"
                          type="email"
                          value={giftEmail}
                          onChange={(e) => setGiftEmail(e.target.value)}
                          placeholder="destinataire@email.com"
                          aria-describedby="nka-cadeau-aide"
                          className="nka-input"
                        />
                        <p id="nka-cadeau-aide" className="nka-hint">La personne recevra un e‑mail avec un lien d&apos;accès (sans créer de compte). Vous, vous recevez le reçu.</p>
                      </div>
                      <div className="nka-field">
                        <label htmlFor="nka-cadeau-nom" className="nka-label">
                          Nom du destinataire <span className="nka-label__opt">(optionnel)</span>
                        </label>
                        <input
                          id="nka-cadeau-nom"
                          type="text"
                          value={giftName}
                          onChange={(e) => setGiftName(e.target.value)}
                          placeholder="Prénom / nom"
                          className="nka-input"
                        />
                      </div>
                      <div className="nka-field">
                        <label htmlFor="nka-cadeau-message" className="nka-label">
                          Message <span className="nka-label__opt">(optionnel)</span>
                        </label>
                        <textarea
                          id="nka-cadeau-message"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Un petit mot pour accompagner votre cadeau…"
                          className="nka-input"
                        />
                      </div>
                      {giftOwned.length > 0 && (
                        <div className="nka-alert nka-alert--amber" role="status">
                          <AlertTriangle aria-hidden="true" />
                          <p>
                            Cette personne possède peut‑être déjà : <strong>{giftOwned.join(", ")}</strong>. Vous pouvez tout de même offrir.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </CarteEtape>

            {/* Code promo — replié. Il occupait une section entière alors que la
                plupart des acheteurs n'en ont pas : autant de hauteur à faire
                défiler avant d'atteindre le paiement. */}
            <div className="nka-bezel">
              <div className="nka-bezel__core px-5 py-3.5 sm:px-6">
                {!promoOuvert && !discountCode ? (
                  <button
                    type="button"
                    onClick={() => setPromoOuvert(true)}
                    className="nka-linkbtn"
                  >
                    <Tag aria-hidden="true" />
                    J&apos;ai un code promo
                  </button>
                ) : (
                  <div className="nka-field py-1.5">
                    <label htmlFor="nka-code-promo" className="nka-label">Code promo</label>
                    <div className="relative">
                      <input
                        id="nka-code-promo"
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        placeholder="PROMO20"
                        aria-invalid={discountStatus === "invalid" || undefined}
                        aria-describedby={discountMessage ? "nka-code-promo-msg" : undefined}
                        className={`nka-input nka-input--code ${
                          discountStatus === "valid"
                            ? "nka-input--ok"
                            : discountStatus === "invalid"
                              ? "nka-input--err"
                              : ""
                        }`}
                      />
                      <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
                        {discountStatus === "validating" && (
                          <Loader2 size={20} className="text-[#5c6b62] animate-spin" />
                        )}
                        {discountStatus === "valid" && (
                          <CheckCircle2 size={20} className="text-[#006e2f]" />
                        )}
                        {discountStatus === "invalid" && (
                          <XCircle size={20} className="text-[#b42318]" />
                        )}
                      </div>
                    </div>
                    {/* Région annoncée : le résultat de la vérification arrive
                        une demi-seconde après la frappe. */}
                    <div aria-live="polite">
                      {discountMessage && (
                        <p id="nka-code-promo-msg" className={`nka-msg ${discountStatus === "valid" ? "nka-msg--ok" : "nka-msg--err"}`}>
                          {discountStatus === "valid" ? <CheckCircle2 aria-hidden="true" /> : <AlertCircle aria-hidden="true" />}
                          {discountMessage}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Moyen de paiement, dans la page ──────────────────────────
                Autrefois un second écran plein page. Le tunnel faisait alors
                deux pages, et un acheteur a écrit à son vendeur que c'était trop
                long. Tout tient désormais ici : pays, moyen, numéro, puis le
                bouton « Payer » du récapitulatif. */}
            {totalAmount > 0 && (
            <CarteEtape
              id="moyen-de-paiement"
              numero={2}
              titre="Moyen de paiement"
              sousTitre="Choisissez votre pays, puis votre moyen de paiement."
              serre
            >
              {kkiapay && (
                <KkiapayWidget
                  init={kkiapay}
                  onDelivered={() => router.push(`/payment/return?ref=${encodeURIComponent(kkiapay.internalRef)}`)}
                  onFailed={(m) => { setKkiapay(null); setError(m); setLoading(false); }}
                />
              )}
              <UnifiedPaymentScreen
                embedded
                hideSubmit
                amount={totalAmount}
                buyerName={firstName || null}
                defaultCountry={selectedCountry?.iso ?? null}
                onPay={(args) => { void startPayment(args); }}
                onSelectionChange={setPaySel}
                submitting={loading}
                error={null}
              />
            </CarteEtape>
            )}

            {/* Conditions — mention, plus de case à cocher.
                L'acceptation se fait par l'acte de payer : la mention est
                affichée juste au-dessus du bouton, avec les liens accessibles.
                La case coûtait un clic et un motif d'abandon supplémentaires
                sur un tunnel déjà jugé trop long par les acheteurs. */}
            <p className="nka-legal px-1">
              En payant, vous acceptez les{" "}
              <a href="/cgu" target="_blank" rel="noopener noreferrer">Conditions Générales de Vente</a>{" "}
              et la{" "}
              <a href="/confidentialite" target="_blank" rel="noopener noreferrer">Politique de confidentialité</a>{" "}
              de Novakou.
            </p>

            {/* Error — avec fallback automatique vers l'autre provider si
                le provider courant est indisponible. Décidé en post-mortem
                passerelle "Server Error" du 2026-05-26. */}
            {error && (
              <div className="nka-alert" role="alert">
                <AlertCircle aria-hidden="true" />
                <p className="min-w-0 flex-1">{error}</p>
              </div>
            )}
          </div>

          {/* Right — Order summary (collant dès lg ; aucun transform ici : la
              barre mobile fixe vit dans ce bloc). */}
          <aside className="min-w-0 lg:sticky lg:top-6" aria-label="Récapitulatif de la commande">
            <div className="nka-bezel nka-bezel--float">
              <div className="nka-bezel__core p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="nka-h2">Récapitulatif</h2>
                  {!cartLoading && cartItems.length > 0 && (
                    <span className="nka-chip nka-num">
                      {cartItems.length} article{cartItems.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="mt-4">
                  {cartLoading ? (
                    <div className="space-y-3" aria-hidden="true">
                      {[0, 1].map((i) => <div key={i} className="nka-skel h-14" />)}
                    </div>
                  ) : cartItems.length === 0 ? (
                    <p className="py-4 text-center text-sm text-[#5c6b62]">Votre panier est vide.</p>
                  ) : (
                    <ul>
                      {cartItems.map((item) => (
                        <li key={item.id} className="nka-line">
                          <span className="nka-thumb">
                            {item.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.thumbnail} alt="" />
                            ) : item.kind === "formation" ? (
                              <GraduationCap aria-hidden="true" />
                            ) : (
                              <FolderArchive aria-hidden="true" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="nka-line__title">{item.title}</p>
                            <p className="nka-line__meta">{item.kind === "formation" ? "Formation" : "Produit numérique"}</p>
                          </div>
                          <span className="nka-line__price">{formatFCFA(item.price)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ─── Order Bumps (offres additionnelles) ─────────────────────── */}
                {availableBumps.length > 0 && (
                  <div className="mt-5 space-y-2.5">
                    {availableBumps.map((bump) => {
                      const isAccepted = acceptedBumpIds.includes(bump.id);
                      const savings = bump.originalPrice && bump.originalPrice > bump.price
                        ? bump.originalPrice - bump.price : 0;
                      return (
                        <label key={bump.id} className="nka-bump">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isAccepted}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAcceptedBumpIds((prev) => [...prev, bump.id]);
                                } else {
                                  setAcceptedBumpIds((prev) => prev.filter((id) => id !== bump.id));
                                }
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="nka-chip nka-chip--amber">
                                  <Zap aria-hidden="true" />
                                  Offre spéciale
                                </span>
                                {savings > 0 && (
                                  <span className="nka-chip nka-chip--green nka-num">
                                    −{formatFCFA(savings)}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-bold leading-snug text-[#0e1512]">{bump.title}</h3>
                              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#5c6b62]">{bump.description}</p>
                              <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                                <span className="nka-num text-base font-bold text-[#006e2f]">+ {formatFCFA(bump.price)}</span>
                                {bump.originalPrice && bump.originalPrice > bump.price && (
                                  <s className="nka-num text-xs text-[#5c6b62]">{formatFCFA(bump.originalPrice)}</s>
                                )}
                              </div>
                            </div>
                            {bump.imageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bump.imageUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Price breakdown */}
                <div className="nka-rows mt-5 border-t border-[#e6ece8] pt-5">
                  <div className="nka-row">
                    <span>Sous-total</span>
                    <span>{formatFCFA(subTotal)}</span>
                  </div>
                  {bumpsTotal > 0 && (
                    <div className="nka-row nka-row--amber">
                      <span>
                        <ShoppingCart aria-hidden="true" />
                        Offre{acceptedBumpIds.length > 1 ? "s" : ""} additionnelle{acceptedBumpIds.length > 1 ? "s" : ""}
                      </span>
                      <span>+{formatFCFA(bumpsTotal)}</span>
                    </div>
                  )}
                  {discountStatus === "valid" && discountAmount > 0 && (
                    <div className="nka-row nka-row--green">
                      <span>
                        <Tag aria-hidden="true" />
                        Code {discountCode}
                      </span>
                      <span>−{formatFCFA(discountAmount)}</span>
                    </div>
                  )}
                  <div className="nka-row">
                    <span>Frais de traitement</span>
                    <span className="nka-free">Gratuit</span>
                  </div>
                </div>

                {/* Total */}
                <div className="nka-total">
                  <span className="nka-total__label">Total</span>
                  <span className="nka-total__amount">{formatFCFA(totalAmount)}</span>
                </div>

                {/* La liste « Paiements acceptés » a été retirée : elle était FIGÉE
                    (Orange, Wave, MTN, Carte) quel que soit le pays, et s'affichait
                    juste à côté du bloc de paiement qui montre, lui, les moyens
                    réellement disponibles pour l'acheteur. Annoncer Wave à un
                    acheteur béninois pour lui proposer autre chose deux lignes plus
                    bas décrédibilise la page au lieu de rassurer.
                    Seules les FAMILLES (Mobile Money, carte) restent affichées plus
                    bas, sans aucun nom d'opérateur — cf. ConfianceAchat. */}

                {/* Pay button — desktop / large screens */}
                <div className="mt-5 hidden lg:block">
                  <button
                    onClick={goToPayment}
                    disabled={loading || cartLoading || cartItems.length === 0}
                    aria-busy={loading || undefined}
                    className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg"
                  >
                    <span className="nka-btn__label">
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" aria-hidden="true" />
                          Un instant…
                        </>
                      ) : (
                        <>
                          <Lock aria-hidden="true" />
                          Payer {formatFCFA(totalAmount)}
                        </>
                      )}
                    </span>
                    <span className="nka-btn__ico" aria-hidden="true">
                      <ArrowRight strokeWidth={2.2} />
                    </span>
                  </button>
                </div>

                {/* Réassurance */}
                <ConfianceAchat
                  className="mt-5 border-t border-[#e6ece8] pt-5"
                  garanties={[
                    { Icone: ShieldCheck, texte: "Paiement 100 % sécurisé" },
                    { Icone: Download, texte: "Accès immédiat après votre achat" },
                    { Icone: Lock, texte: "Connexion chiffrée (SSL)" },
                  ]}
                />
              </div>
            </div>

            {/* Pay button — mobile sticky bar (Bureau session 4, P0 Léa).
                Avant : le CTA Payer était dans le sidebar récapitulatif,
                hors-écran sur mobile portrait → conversion -8 à -12 %.
                Maintenant : barre fixée en bas du viewport sur mobile,
                toujours visible quel que soit le scroll. */}
            <div className="nka-bar lg:hidden fixed bottom-0 left-0 right-0 z-40">
              <div className="mx-auto max-w-xl">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#5c6b62]">Total</span>
                  <span className="nka-bar__amount">{formatFCFA(totalAmount)}</span>
                </div>
                <button
                  onClick={goToPayment}
                  disabled={loading || cartLoading || cartItems.length === 0}
                  aria-busy={loading || undefined}
                  className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg"
                >
                  <span className="nka-btn__label">
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" />
                        Un instant…
                      </>
                    ) : (
                      <>
                        <Lock aria-hidden="true" />
                        Payer maintenant
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
            {/* Pad pour que le contenu ne soit pas caché derrière la sticky bar mobile */}
            <div className="lg:hidden h-32" aria-hidden="true" />
          </aside>
        </div>
      </div>
    </div>
  );
}
