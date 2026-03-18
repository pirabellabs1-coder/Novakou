"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingCart, ArrowRight, Tag, X, Star, Clock, Award } from "lucide-react";

interface CartItem {
  id: string;
  formation: {
    id: string;
    slug: string;
    titleFr: string;
    titleEn: string;
    thumbnail: string | null;
    price: number;
    originalPrice: number | null;
    isFree: boolean;
    duration: number;
    rating: number;
    hasCertificate: boolean;
    instructeur: { user: { name: string } };
  };
}

interface CartSummary {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode: string | null;
}

export default function PanierPage() {
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();
  const fr = locale === "fr";

  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoApplied, setPromoApplied] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/formations/connexion"); return; }
    if (status !== "authenticated") return;
    fetchCart();
  }, [status, router]);

  const fetchCart = async () => {
    try {
      setError(null);
      const res = await fetch("/api/formations/cart");
      if (!res.ok) throw new Error("Failed to fetch cart");
      const data = await res.json();
      setCart(data);
    } catch {
      setError(fr ? "Impossible de charger le panier" : "Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (formationId: string) => {
    try {
      await fetch(`/api/formations/cart?formationId=${formationId}`, { method: "DELETE" });
      fetchCart();
    } catch {
      // Silently fail, user can retry
    }
  };

  const applyPromo = async () => {
    if (!promoCode.trim() || applyingPromo) return;
    setPromoError("");
    setApplyingPromo(true);
    try {
      const res = await fetch("/api/formations/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      const data = await res.json();
      if (!data.valid) {
        setPromoError(data.error || (fr ? "Code invalide" : "Invalid code"));
      } else {
        setPromoApplied(data.code);
        setCart((prev) =>
          prev
            ? {
                ...prev,
                discount: prev.subtotal - (data.discountedPrice ?? prev.subtotal),
                total: data.discountedPrice ?? prev.total,
                promoCode: data.code,
              }
            : prev
        );
        setPromoCode("");
      }
    } catch {
      setPromoError(fr ? "Erreur de validation" : "Validation error");
    } finally {
      setApplyingPromo(false);
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setCart((prev) =>
      prev ? { ...prev, discount: 0, total: prev.subtotal, promoCode: null } : prev
    );
  };

  const checkout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/formations/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoApplied || cart?.promoCode || undefined,
          locale,
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setCheckingOut(false);
    } catch {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">{error}</p>
        <button onClick={() => { setLoading(true); fetchCart(); }} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm">
          {fr ? "Réessayer" : "Retry"}
        </button>
      </div>
    );
  }

  const items = cart?.items ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <ShoppingCart className="w-6 h-6" />
        {fr ? "Mon panier" : "My Cart"}
        {items.length > 0 && <span className="text-slate-400 font-normal text-base">({items.length})</span>}
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-slate-500 mb-6">{fr ? "Votre panier est vide" : "Your cart is empty"}</p>
          <Link href="/formations/explorer" className="bg-primary text-white font-medium px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors">
            {fr ? "Explorer les formations" : "Browse courses"}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart items */}
          <div className="flex-1 space-y-4">
            {items.map((item) => {
              const title = fr ? item.formation.titleFr : (item.formation.titleEn || item.formation.titleFr);
              const h = Math.floor(item.formation.duration / 60);
              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-32 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/10 to-blue-100 dark:from-primary/20 dark:to-blue-900/20 overflow-hidden">
                    {item.formation.thumbnail ? (
                      <img src={item.formation.thumbnail} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🎓</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/formations/${item.formation.slug}`} className="font-semibold text-slate-900 dark:text-white text-sm hover:text-primary line-clamp-2">
                      {title}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{item.formation.instructeur.user.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {item.formation.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {h > 0 ? `${h}h` : `${item.formation.duration}min`}
                      </span>
                      {item.formation.hasCertificate && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Award className="w-3 h-3" />
                          {fr ? "Certificat" : "Certificate"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price + Remove */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0">
                    <button onClick={() => removeItem(item.formation.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-right">
                      <p className={`font-bold ${item.formation.isFree ? "text-green-600" : "text-slate-900 dark:text-white"}`}>
                        {item.formation.isFree ? (fr ? "Gratuit" : "Free") : `${item.formation.price.toFixed(0)}€`}
                      </p>
                      {item.formation.originalPrice && item.formation.originalPrice > item.formation.price && (
                        <p className="text-xs text-slate-400 line-through">{item.formation.originalPrice.toFixed(0)}€</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 dark:bg-neutral-dark rounded-xl border dark:border-border-dark p-6 sticky top-8">
              <h2 className="font-bold text-slate-900 dark:text-white dark:text-slate-100 mb-4">{fr ? "Récapitulatif" : "Summary"}</h2>

              {/* Promo code */}
              <div className="mb-4">
                {(promoApplied || cart?.promoCode) ? (
                  <div className="flex items-center justify-between bg-green-50 text-green-700 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm font-medium">{promoApplied || cart?.promoCode}</span>
                    </div>
                    <button onClick={removePromo}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                      {fr ? "Code promo" : "Promo code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="CODE"
                        className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        onClick={applyPromo}
                        disabled={applyingPromo || !promoCode.trim()}
                        className="bg-slate-100 dark:bg-slate-800 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {applyingPromo ? "..." : (fr ? "Appliquer" : "Apply")}
                      </button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{fr ? "Sous-total" : "Subtotal"}</span>
                  <span>{(cart?.subtotal ?? 0).toFixed(2)}€</span>
                </div>
                {(cart?.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{fr ? "Réduction" : "Discount"}</span>
                    <span>-{cart!.discount.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-base pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span>Total</span>
                  <span>{(cart?.total ?? 0).toFixed(2)}€</span>
                </div>
              </div>

              <button
                onClick={checkout}
                disabled={checkingOut}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {fr ? "Redirection..." : "Redirecting..."}
                  </span>
                ) : (fr ? "Passer la commande" : "Checkout")}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-xs text-center text-slate-400 mt-3">
                {fr ? "Paiement sécurisé · Satisfait ou remboursé 30 jours" : "Secure payment · 30-day money back guarantee"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
