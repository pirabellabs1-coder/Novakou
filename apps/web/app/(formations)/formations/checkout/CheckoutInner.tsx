"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Country codes for Mobile Money ──────────────────────────────────────────
const COUNTRIES = [
  { code: "+221", flag: "🇸🇳", label: "Sénégal", iso: "SN" },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire", iso: "CI" },
  { code: "+229", flag: "🇧🇯", label: "Bénin", iso: "BJ" },
  { code: "+237", flag: "🇨🇲", label: "Cameroun", iso: "CM" },
  { code: "+223", flag: "🇲🇱", label: "Mali", iso: "ML" },
  { code: "+226", flag: "🇧🇫", label: "Burkina Faso", iso: "BF" },
  { code: "+228", flag: "🇹🇬", label: "Togo", iso: "TG" },
  { code: "+224", flag: "🇬🇳", label: "Guinée", iso: "GN" },
  { code: "+227", flag: "🇳🇪", label: "Niger", iso: "NE" },
  { code: "+242", flag: "🇨🇬", label: "Congo", iso: "CG" },
  { code: "+235", flag: "🇹🇩", label: "Tchad", iso: "TD" },
  { code: "+241", flag: "🇬🇦", label: "Gabon", iso: "GA" },
  { code: "+212", flag: "🇲🇦", label: "Maroc", iso: "MA" },
  { code: "+216", flag: "🇹🇳", label: "Tunisie", iso: "TN" },
  { code: "+213", flag: "🇩🇿", label: "Algérie", iso: "DZ" },
  { code: "+33", flag: "🇫🇷", label: "France", iso: "FR" },
  { code: "+1", flag: "🇺🇸", label: "USA / Canada", iso: "US" },
] as const;

type PaymentMethod = "orange_money" | "wave" | "mtn" | "card";
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
function toEur(fcfa: number) {
  return (fcfa / 655.957).toFixed(0);
}

export default function CheckoutInner() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+221");
  const [countryOpen, setCountryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("orange_money");
  const [discountCode, setDiscountCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Cart items ──────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);

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
          try {
            const res = await fetch("/api/formations/explorer?ids=" + encodeURIComponent(fids.join(",")));
            const json = await res.json();
            const arr: CartItem[] = (json.data ?? []).map((f: { id: string; title: string; price: number; thumbnail?: string }) => ({
              id: f.id, kind: "formation", title: f.title, price: f.price, thumbnail: f.thumbnail,
            }));
            items.push(...arr);
          } catch {
            // If API doesn't support bulk fetch by ids, build minimal items
            fids.forEach((id) => items.push({ id, kind: "formation", title: "Formation", price: 0 }));
          }
        }
        if (pids.length > 0) {
          pids.forEach((id) => items.push({ id, kind: "product", title: "Produit numérique", price: 0 }));
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
          formation?: { id: string; title: string; price: number; thumbnail?: string | null };
        }) => ({
          id: item.formation?.id ?? item.id,
          kind: "formation" as const,
          title: item.formation?.title ?? "Formation",
          price: item.formation?.price ?? 0,
          thumbnail: item.formation?.thumbnail,
        }));
        setCartItems(items);
      } catch {
        setCartItems([]);
      } finally {
        setCartLoading(false);
      }
    }
    load();
  }, [searchParams]);

  const subTotal = cartItems.reduce((s, i) => s + i.price, 0);
  const formationIds = cartItems.filter((i) => i.kind === "formation").map((i) => i.id);
  const productIds = cartItems.filter((i) => i.kind === "product").map((i) => i.id);

  const isMobileMoney = paymentMethod === "orange_money" || paymentMethod === "wave" || paymentMethod === "mtn";

  async function handlePay() {
    if (!termsAccepted) { setError("Veuillez accepter les conditions générales."); return; }
    if (!email) { setError("Adresse email requise."); return; }
    if (isMobileMoney && !phone) { setError("Numéro de téléphone requis pour Mobile Money."); return; }
    if (cartItems.length === 0) { setError("Votre panier est vide."); return; }

    setLoading(true);
    setError(null);

    try {
      const fullPhone = phone ? `${countryCode}${phone.replace(/^0/, "")}` : undefined;
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formationIds,
          productIds,
          discountCode: discountCode || undefined,
          guestEmail: session ? undefined : email,
          guestName: session ? undefined : `${firstName} ${lastName}`.trim(),
          phone: fullPhone,
          paymentMethod,
        }),
      });
      const json = await res.json();

      if (!res.ok || !json.data) {
        setError(json.error ?? "Erreur lors de l'initialisation du paiement.");
        setLoading(false);
        return;
      }

      const checkoutUrl: string = json.data.checkout_url;

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

  const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "orange_money", label: "Orange Money", icon: "smartphone" },
    { id: "wave", label: "Wave", icon: "waves" },
    { id: "mtn", label: "MTN MoMo", icon: "phone_android" },
    { id: "card", label: "Carte bancaire", icon: "credit_card" },
  ];

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0];

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-8 px-4 md:px-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto mb-6">
        <div className="flex items-center gap-2 text-xs text-[#5c647a]">
          <Link href="/formations" className="hover:text-[#006e2f] transition-colors">Accueil</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <Link href="/formations/explorer" className="hover:text-[#006e2f] transition-colors">Explorer</Link>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-[#191c1e] font-medium">Commande</span>
        </div>
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#006e2f" }}>
            <span className="material-symbols-outlined text-white text-[20px]">lock</span>
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
                <label className="block text-xs font-semibold text-[#5c647a] mb-1.5">Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  disabled={!!session?.user?.email}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm text-[#191c1e] placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f] disabled:opacity-60"
                />
                <p className="text-[10px] text-[#5c647a] mt-1">Votre reçu et accès seront envoyés à cette adresse.</p>
              </div>
            </div>
          </div>

          {/* Payment method */}
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
                  <span className={`material-symbols-outlined text-[22px] ${paymentMethod === method.id ? "text-[#006e2f]" : "text-[#5c647a]"}`}>
                    {method.icon}
                  </span>
                  <span className={`text-sm font-semibold ${paymentMethod === method.id ? "text-[#006e2f]" : "text-[#191c1e]"}`}>
                    {method.label}
                  </span>
                  {paymentMethod === method.id && (
                    <span className="material-symbols-outlined text-[#006e2f] text-[16px] ml-auto" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
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
                      <span className="text-base leading-none">{selectedCountry.flag}</span>
                      <span className="font-semibold">{selectedCountry.code}</span>
                      <span className="material-symbols-outlined text-[14px] text-[#5c647a]">expand_more</span>
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
                            <span className="text-base">{c.flag}</span>
                            <span className="flex-1">{c.label}</span>
                            <span className="text-[#5c647a] font-mono text-xs">{c.code}</span>
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
                <span className="material-symbols-outlined text-blue-500 text-[22px]">info</span>
                <p className="text-sm text-blue-800 font-medium leading-snug">
                  Vous serez redirigé vers la page de paiement sécurisée pour entrer les détails de votre carte.
                </p>
              </div>
            )}
          </div>

          {/* Discount code */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-[#191c1e] mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#006e2f] text-white text-xs flex items-center justify-center font-bold">3</span>
              Code promo (optionnel)
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="PROMO20"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-[#f7f9fb] text-sm font-mono font-bold text-[#191c1e] uppercase placeholder:font-normal placeholder:text-[#5c647a] focus:outline-none focus:ring-2 focus:ring-[#006e2f]/30 focus:border-[#006e2f]"
              />
            </div>
          </div>

          {/* Terms */}
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
                <a href="/formations/cgu" className="text-[#006e2f] hover:underline font-semibold">Conditions Générales de Vente</a>{" "}
                et la{" "}
                <a href="/formations/confidentialite" className="text-[#006e2f] hover:underline font-semibold">Politique de confidentialité</a>{" "}
                de FreelanceHigh.
              </span>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
              <p className="text-sm text-red-700 font-medium">{error}</p>
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
                        <span className="material-symbols-outlined text-white text-[18px]">
                          {item.kind === "formation" ? "school" : "folder_zip"}
                        </span>
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

            {/* Price breakdown */}
            <div className="space-y-2.5 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-[#5c647a]">Sous-total</span>
                <span className="font-semibold text-[#191c1e]">{formatFCFA(subTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#5c647a]">Frais de traitement</span>
                <span className="font-semibold text-green-600">Gratuit</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-4 border-t border-gray-100 mb-5">
              <span className="font-bold text-[#191c1e]">Total</span>
              <div className="text-right">
                <p className="text-xl font-extrabold text-[#006e2f] tracking-tight">{formatFCFA(subTotal)}</p>
                <p className="text-xs text-[#5c647a]">≈ {toEur(subTotal)} €</p>
              </div>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={loading || cartLoading || cartItems.length === 0}
              className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-base shadow-lg transition-all duration-200 hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  Redirection…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                  Payer {formatFCFA(subTotal)}
                </>
              )}
            </button>

            {/* Security badges */}
            <div className="mt-4 flex items-center justify-center gap-4">
              {[
                { icon: "lock", label: "SSL" },
                { icon: "verified_user", label: "Sécurisé" },
                { icon: "replay_30", label: "30j remboursé" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-0.5">
                  <span className="material-symbols-outlined text-[#5c647a] text-[16px]">{item.icon}</span>
                  <span className="text-[9px] text-[#5c647a] font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Guarantee */}
            <div className="mt-5 p-3 rounded-xl bg-green-50 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006e2f] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
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
