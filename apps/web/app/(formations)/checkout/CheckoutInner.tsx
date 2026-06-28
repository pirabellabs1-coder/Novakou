"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isAllowedBuyerEmail, ALLOWED_BUYER_EMAIL_MESSAGE } from "@/lib/email/allowed-buyer-email";
import Link from "next/link";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  CheckCircle2,
  Info,
  Sparkles,
  Wallet,
  Loader2,
  XCircle,
  AlertCircle,
  ArrowRightLeft,
  RefreshCw,
  GraduationCap,
  FolderArchive,
  ShoppingCart,
  Tag,
  ShieldCheck,
  RotateCcw,
  Smartphone,
  Waves,
  Phone,
  CreditCard,
  type LucideIcon,
} from "lucide-react";
import { PixelInjector } from "@/components/formations/PixelInjector";
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

type PaymentMethod = "orange_money" | "wave" | "mtn" | "card";
type PaymentProvider = "moneroo" | "paygenius";
type ProviderInfo = { id: PaymentProvider; label: string; available: boolean; description: string };
type CartItem = {
  id: string;
  kind: "formation" | "product";
  title: string;
  price: number;
  thumbnail?: string | null;
};

function formatFCFA(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function CheckoutInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  // Persist contact details across refreshes — buyers on slow mobile
  // connections lose the form when CinetPay/Moneroo redirects them back
  // after a failed payment, otherwise they retype everything.
  const [firstName, setFirstName] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:firstName`, "");
  const [lastName, setLastName] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:lastName`, "");
  const [email, setEmail] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:email`, "");
  const [phone, setPhone] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:phone`, "");
  const [countryCode, setCountryCode] = useDraftField(`${CHECKOUT_DRAFT_PREFIX}:countryCode`, "+221");
  const [countryOpen, setCountryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange_money");
  const [provider, setProvider] = useState<PaymentProvider>("moneroo");
  const [availableProviders, setAvailableProviders] = useState<ProviderInfo[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.label.toLowerCase().includes(q) || c.iso.toLowerCase().includes(q) || c.code.includes(q),
    );
  }, [countrySearch]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountStatus, setDiscountStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  // CGV opt-in (default false). La renonciation au droit de rétractation
  // est implicite via les CGV (clause art. L221-28 13°) — pas de 2e checkbox.
  const [termsAccepted, setTermsAccepted] = useState(false);
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
  const [checkoutPixels, setCheckoutPixels] = useState<Array<{ type: "FACEBOOK" | "GOOGLE" | "TIKTOK"; pixelId: string }>>([]);

  // ── Charger la liste des providers de paiement disponibles ─────────────
  // Source unique de vérité = /api/formations/payment/providers (vérifie les
  // env vars côté serveur). Si Moneroo n'est pas configuré, il ne s'affiche pas.
  useEffect(() => {
    fetch("/api/formations/payment/providers")
      .then((r) => r.json())
      .then((j) => {
        const list = (j.data ?? []) as ProviderInfo[];
        setAvailableProviders(list);
        // Si le default "moneroo" n'est pas disponible, basculer sur le premier dispo
        if (list.length > 0 && !list.find((p) => p.id === "moneroo" && p.available)) {
          const firstAvail = list.find((p) => p.available) ?? list[0];
          if (firstAvail) setProvider(firstAvail.id);
        }
      })
      .catch(() => setAvailableProviders([]));
  }, []);

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
          body: JSON.stringify({ code, orderAmount: subTotal }),
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

  const isMobileMoney = paymentMethod === "orange_money" || paymentMethod === "wave" || paymentMethod === "mtn";

  async function handlePay() {
    if (!termsAccepted) { setError("Veuillez accepter les conditions générales."); return; }
    if (!email) { setError("Adresse email requise."); return; }
    // Invité : l'e-mail d'achat doit être une vraie adresse Gmail (anti faux comptes).
    if (!session && !isAllowedBuyerEmail(email)) { setError(ALLOWED_BUYER_EMAIL_MESSAGE); return; }
    // Téléphone non obligatoire ici — Moneroo le demandera si Mobile Money
    if (cartItems.length === 0) { setError("Votre panier est vide."); return; }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = phone ? `${countryCode}${phone.replace(/^0/, "")}` : undefined;
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
          paymentMethod,
          provider,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.data) {
        setError(json.error ?? "Erreur lors de l'initialisation du paiement.");
        setLoading(false);
        return;
      }

      const checkoutUrl: string = json.data.checkout_url;

      // Payment provider has the order — clear the saved draft so a buyer
      // doesn't see their previous contact details on a fresh checkout for
      // a different product.
      clearDrafts(CHECKOUT_DRAFT_PREFIX);

      // Mock/dev mode — go to return page
      if (json.data.mock || json.data.free) {
        router.push(checkoutUrl);
        return;
      }

      // Real Moneroo — redirect to their hosted page
      window.location.href = checkoutUrl;
    } catch {
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
      setLoading(false);
    }
  }

  const paymentMethods: { id: PaymentMethod; label: string; Icon: LucideIcon }[] = [
    { id: "orange_money", label: "Orange Money", Icon: Smartphone },
    { id: "wave", label: "Wave", Icon: Waves },
    { id: "mtn", label: "MTN MoMo", Icon: Phone },
    { id: "card", label: "Carte bancaire", Icon: CreditCard },
  ];

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-8 px-4 md:px-8" style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}>
      {/* Pixels vendeurs : event InitiateCheckout (tous les pixels des vendeurs du panier) */}
      {checkoutPixels.length > 0 && (
        <PixelInjector
          pixels={checkoutPixels}
          event={{ name: "InitiateCheckout", value: subTotal, currency: "XOF" }}
        />
      )}
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <ChevronRight size={12} />
          <Link href="/explorer" className="hover:text-[#006e2f] transition-colors">Explorer</Link>
          <ChevronRight size={12} />
          <span className="text-[#191c1e] font-medium">Commande</span>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#006e2f" }}>
            <Lock size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#191c1e] tracking-tight">Finaliser votre commande</h1>
            <p className="text-xs text-[#5c647a]">Paiement sécurisé SSL · Garantie 30 jours</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left — Payment form */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Contact info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">1</span>
              Informations de contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Votre prénom"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">Adresse Gmail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.nom@gmail.com"
                  disabled={!!session?.user?.email}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] disabled:opacity-60"
                />
                <p className="text-[10px] text-[#5c647a] mt-1">Votre reçu et accès seront envoyés à cette adresse.</p>
              </div>

              {/* Téléphone avec drapeau pays (utilisé par Moneroo pour Mobile Money) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">
                  Numéro de téléphone <span className="text-[#5c647a] font-normal">(WhatsApp de préférence)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setCountryOpen((v) => !v)}
                      className="h-full px-3 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] min-w-[100px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/24x18/${selectedCountry.iso.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/48x36/${selectedCountry.iso.toLowerCase()}.png 2x`}
                        alt={selectedCountry.label}
                        width={24}
                        height={18}
                        className="rounded-sm"
                      />
                      <span className="font-semibold">{selectedCountry.code}</span>
                      <ChevronDown size={14} className="text-[#5c647a]" />
                    </button>
                    {countryOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-72 max-h-80 overflow-hidden flex flex-col">
                        <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Rechercher un pays…"
                            autoFocus
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-[#f7f9fb] text-xs placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                          />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {filteredCountries.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-[#5c647a]">
                              Aucun pays trouvé
                            </div>
                          ) : (
                            filteredCountries.map((c) => (
                              <button
                                key={c.iso}
                                type="button"
                                onClick={() => {
                                  setCountryCode(c.code);
                                  setCountryOpen(false);
                                  setCountrySearch("");
                                }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-green-50 text-left ${countryCode === c.code ? "bg-green-50 text-[#006e2f] font-semibold" : "text-[#191c1e]"}`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`https://flagcdn.com/24x18/${c.iso.toLowerCase()}.png`}
                                  srcSet={`https://flagcdn.com/48x36/${c.iso.toLowerCase()}.png 2x`}
                                  alt=""
                                  width={24}
                                  height={18}
                                  className="rounded-sm flex-shrink-0"
                                />
                                <span className="flex-1 truncate">{c.label}</span>
                                <span className="text-[#5c647a] tabular-nums text-xs">{c.code}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="01 57 33 57 26"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
                <p className="text-[10px] text-[#5c647a] mt-1">
                  Requis si vous payez par Mobile Money (Orange, MTN, Moov, Wave).
                </p>
              </div>
            </div>
          </div>

          {/* Payment method — MASQUÉ : Moneroo gère la sélection de méthode sur sa page */}
          {false && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">2</span>
              Moyen de paiement
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    paymentMethod === method.id ? "border-[#006e2f] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <method.Icon size={22} className={paymentMethod === method.id ? "text-[#006e2f]" : "text-[#5c647a]"} />
                  <span className={`text-sm font-semibold ${paymentMethod === method.id ? "text-[#006e2f]" : "text-[#191c1e]"}`}>
                    {method.label}
                  </span>
                  {paymentMethod === method.id && (
                    <CheckCircle2 size={16} className="text-[#006e2f] ml-auto" />
                  )}
                </button>
              ))}
            </div>

            {/* Mobile Money phone field */}
            {isMobileMoney && (
              <div>
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">
                  Numéro de téléphone Mobile Money <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country code dropdown */}
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setCountryOpen((v) => !v)}
                      className="h-full px-3 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] flex items-center gap-1.5 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] min-w-[90px]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://flagcdn.com/24x18/${selectedCountry.iso.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/48x36/${selectedCountry.iso.toLowerCase()}.png 2x`}
                        alt={selectedCountry.label}
                        width={24}
                        height={18}
                        className="rounded-sm"
                      />
                      <span className="font-semibold">{selectedCountry.code}</span>
                      <ChevronDown size={14} className="text-[#5c647a]" />
                    </button>
                    {countryOpen && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-60 max-h-64 overflow-y-auto">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.iso}
                            type="button"
                            onClick={() => { setCountryCode(c.code); setCountryOpen(false); }}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-green-50 text-left ${countryCode === c.code ? "bg-green-50 text-[#006e2f] font-semibold" : "text-[#191c1e]"}`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://flagcdn.com/24x18/${c.iso.toLowerCase()}.png`}
                              alt=""
                              width={24}
                              height={18}
                              className="flex-shrink-0 rounded-sm"
                            />
                            <span className="flex-1">{c.label}</span>
                            <span className="text-[#5c647a] tabular-nums text-xs">{c.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                    placeholder="07 XX XX XX XX"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                  />
                </div>
                <p className="text-[10px] text-[#5c647a] mt-1.5">
                  Vous recevrez une notification de confirmation sur ce numéro.
                </p>
              </div>
            )}

            {/* Card — Moneroo hosted form handles this */}
            {paymentMethod === "card" && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center gap-3">
                <Info size={22} className="text-blue-500" />
                <p className="text-sm text-blue-800 font-medium leading-snug">
                  Vous serez redirigé vers la page de paiement sécurisée pour entrer les détails de votre carte.
                </p>
              </div>
            )}
          </div>
          )}

          {/* Provider selector — visible si plusieurs providers configurés */}
          {availableProviders.filter((p) => p.available).length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">2</span>
                Passerelle de paiement
              </h2>
              <p className="text-xs text-[#5c647a] mb-4">
                Choisissez la passerelle qui traitera votre paiement. Les méthodes acceptées sont
                identiques (Mobile Money, carte bancaire) — seul le prestataire change.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProviders
                  .filter((p) => p.available)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        provider === p.id
                          ? "border-[#006e2f] bg-green-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {p.id === "paygenius" ? (
                        <Sparkles size={22} className={`mt-0.5 ${provider === p.id ? "text-[#006e2f]" : "text-[#5c647a]"}`} />
                      ) : (
                        <Wallet size={22} className={`mt-0.5 ${provider === p.id ? "text-[#006e2f]" : "text-[#5c647a]"}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-bold ${
                              provider === p.id ? "text-[#006e2f]" : "text-[#191c1e]"
                            }`}
                          >
                            {p.label}
                          </span>
                          {provider === p.id && (
                            <CheckCircle2 size={16} className="text-[#006e2f] ml-auto" />
                          )}
                        </div>
                        <p className="text-[11px] text-[#5c647a] mt-1 leading-snug">{p.description}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Discount code */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">
                {availableProviders.filter((p) => p.available).length > 1 ? 3 : 2}
              </span>
              Code promo (optionnel)
            </h2>
            <div className="relative">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="PROMO20"
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm tabular-nums font-bold uppercase placeholder:font-normal focus:outline-none focus:ring-2 transition-colors ${
                  discountStatus === "valid"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900 placeholder:text-emerald-400 focus:ring-emerald-200"
                    : discountStatus === "invalid"
                      ? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-400 focus:ring-red-200"
                      : "border-gray-200 bg-[#f7f9fb] text-[#191c1e] placeholder:text-[#5c647a] focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {discountStatus === "validating" && (
                  <Loader2 size={20} className="text-[#5c647a] animate-spin" />
                )}
                {discountStatus === "valid" && (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                )}
                {discountStatus === "invalid" && (
                  <XCircle size={20} className="text-red-500" />
                )}
              </div>
            </div>
            {discountMessage && (
              <p className={`text-xs font-semibold mt-2 ${discountStatus === "valid" ? "text-emerald-700" : "text-red-600"}`}>
                {discountMessage}
              </p>
            )}
          </div>

          {/* Terms — checkbox CGV unique. La renonciation au droit de
              rétractation reste juridiquement valable via les CGV (qui
              contiennent désormais cette clause), pas besoin d'une 2e
              checkbox qui effraie l'utilisateur non-juriste. */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded accent-[#006e2f]"
              />
              <span className="text-sm text-[#5c647a] leading-relaxed">
                J&apos;accepte les{" "}
                <a href="/cgu" className="text-[#006e2f] hover:underline font-semibold">Conditions Générales de Vente</a>{" "}
                et la{" "}
                <a href="/confidentialite" className="text-[#006e2f] hover:underline font-semibold">Politique de confidentialité</a>{" "}
                de Novakou.
              </span>
            </label>
          </div>

          {/* Error — avec fallback automatique vers l'autre provider si
              le provider courant est indisponible. Décidé en post-mortem
              PayGenius "Server Error" du 2026-05-26. */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                  {/* Si le message évoque une indisponibilité provider, propose
                      de basculer sur l'autre provider configuré */}
                  {/indisponible|Server Error|HTTP 5\d\d|Timeout/i.test(error) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {availableProviders
                        .filter((p) => p.id !== provider && p.available)
                        .map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setProvider(p.id);
                              setError(null);
                              // Re-tente automatiquement avec le nouveau provider
                              setTimeout(() => { void handlePay(); }, 50);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
                          >
                            <ArrowRightLeft size={14} />
                            Essayer avec {p.label}
                          </button>
                        ))}
                      <button
                        type="button"
                        onClick={() => { setError(null); void handlePay(); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors"
                      >
                        <RefreshCw size={14} />
                        Réessayer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Order summary */}
        <div className="lg:w-80 xl:w-96 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 sticky top-24">
            <h2 className="font-bold text-[#191c1e] mb-5">Récapitulatif</h2>

            {/* Items */}
            <div className="space-y-3 mb-5">
              {cartLoading ? (
                <div className="space-y-2">
                  {[0, 1].map((i) => <div key={i} className="h-14 bg-zinc-100 rounded-xl animate-pulse" />)}
                </div>
              ) : cartItems.length === 0 ? (
                <p className="text-sm text-[#5c647a] text-center py-4">Votre panier est vide.</p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail} alt={item.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006e2f] to-[#22c55e] flex items-center justify-center flex-shrink-0">
                        {item.kind === "formation" ? (
                          <GraduationCap size={18} className="text-white" />
                        ) : (
                          <FolderArchive size={18} className="text-white" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#191c1e] truncate">{item.title}</p>
                      <p className="text-xs text-[#5c647a] mt-0.5">{formatFCFA(item.price)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ─── Order Bumps (offres additionnelles) ─────────────────────── */}
            {availableBumps.length > 0 && (
              <div className="mb-5 space-y-2">
                {availableBumps.map((bump) => {
                  const isAccepted = acceptedBumpIds.includes(bump.id);
                  const savings = bump.originalPrice && bump.originalPrice > bump.price
                    ? bump.originalPrice - bump.price : 0;
                  return (
                    <label
                      key={bump.id}
                      className={`block border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                        isAccepted
                          ? "border-[#006e2f] bg-[#006e2f]/5"
                          : "border-dashed border-amber-300 bg-amber-50/50 hover:border-amber-400"
                      }`}
                    >
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
                          className="mt-1 w-5 h-5 accent-[#006e2f] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              ⚡ Offre spéciale
                            </span>
                            {savings > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                −{formatFCFA(savings)}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-extrabold text-[#191c1e]">{bump.title}</h4>
                          <p className="text-xs text-[#5c647a] mt-1 line-clamp-2">{bump.description}</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-base font-extrabold text-[#006e2f]">+ {formatFCFA(bump.price)}</span>
                            {bump.originalPrice && bump.originalPrice > bump.price && (
                              <span className="text-xs text-[#5c647a] line-through">{formatFCFA(bump.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                        {bump.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={bump.imageUrl} alt={bump.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Price breakdown */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-[#5c647a]">Sous-total</span>
                <span className="font-semibold text-[#191c1e]">{formatFCFA(subTotal)}</span>
              </div>
              {bumpsTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                    <ShoppingCart size={14} />
                    Offre{acceptedBumpIds.length > 1 ? "s" : ""} additionnelle{acceptedBumpIds.length > 1 ? "s" : ""}
                  </span>
                  <span className="font-bold text-amber-700">+{formatFCFA(bumpsTotal)}</span>
                </div>
              )}
              {discountStatus === "valid" && discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                    <Tag size={14} />
                    Code {discountCode}
                  </span>
                  <span className="font-bold text-emerald-600">−{formatFCFA(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#5c647a]">Frais de traitement</span>
                <span className="font-semibold text-green-600">Gratuit</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-100 mb-5">
              <span className="font-bold text-[#191c1e]">Total</span>
              <div className="text-right">
                <p className="text-xl font-extrabold text-[#006e2f] tracking-tight">{formatFCFA(totalAmount)}</p>
              </div>
            </div>

            {/* Pay button — desktop / large screens */}
            <button
              onClick={handlePay}
              disabled={loading || cartLoading || cartItems.length === 0}
              className="hidden lg:flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Redirection…
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Payer {formatFCFA(totalAmount)}
                </>
              )}
            </button>

            {/* Pay button — mobile sticky bar (Bureau session 4, P0 Léa).
                Avant : le CTA Payer était dans le sidebar récapitulatif,
                hors-écran sur mobile portrait → conversion -8 à -12 %.
                Maintenant : barre fixée en bas du viewport sur mobile,
                toujours visible quel que soit le scroll. */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total</span>
                <span className="text-lg font-extrabold text-emerald-700 tabular-nums">{formatFCFA(totalAmount)}</span>
              </div>
              <button
                onClick={handlePay}
                disabled={loading || cartLoading || cartItems.length === 0}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-base shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Redirection…
                  </>
                ) : (
                  <>
                    <Lock size={20} />
                    Payer maintenant
                  </>
                )}
              </button>
            </div>
            {/* Pad pour que le contenu ne soit pas caché derrière la sticky bar mobile */}
            <div className="lg:hidden h-32" aria-hidden="true" />

            {/* Security badges */}
            <div className="mt-4 flex items-center justify-center gap-4">
              {[
                { Icon: Lock, label: "SSL" },
                { Icon: ShieldCheck, label: "Sécurisé" },
                { Icon: RotateCcw, label: "30j remboursé" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <item.Icon size={16} className="text-[#5c647a]" />
                  <span className="text-[9px] text-[#5c647a] font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Guarantee */}
            <div className="mt-5 p-3 rounded-xl bg-green-50 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#006e2f] flex-shrink-0" />
              <p className="text-[11px] font-semibold text-[#006e2f] leading-snug">
                Garantie satisfait ou remboursé sous 30 jours, sans questions posées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
