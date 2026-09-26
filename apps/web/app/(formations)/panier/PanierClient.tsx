"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  GraduationCap,
  Trash2,
  Lock,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { sora } from "@/lib/fonts";
import { ConfianceAchat } from "@/components/formations/achat/ConfianceAchat";
import "@/components/formations/achat/achat.css";
import { useToastStore } from "@/store/toast";
import { trackEvents } from "@/lib/tracking/events";

interface CartRef {
  id: string;
  slug: string;
  title: string;
  price: number;
  thumbnail: string | null;
  level?: string | null;
}
interface CartItem {
  id: string;
  formationId?: string | null;
  productId?: string | null;
  formation?: CartRef | null;
  product?: CartRef | null;
}

// Vue normalisée d'un article (formation OU produit digital).
function itemView(item: CartItem) {
  const isProduct = !!item.product;
  const ref = item.formation ?? item.product ?? null;
  return {
    isProduct,
    title: ref?.title ?? (isProduct ? "Produit" : "Formation"),
    price: ref?.price ?? 0,
    thumbnail: ref?.thumbnail ?? null,
    level: ref?.level ?? null,
    href: isProduct
      ? `/produit/${ref?.slug ?? item.productId}`
      : `/formation/${ref?.slug ?? item.formationId}`,
  };
}

interface CartResponse {
  data: CartItem[];
  total: number;
  count: number;
  guest: boolean;
}

function fmtFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
}

export default function PanierClient() {
  const toast = useToastStore.getState().addToast;
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/apprenant/cart");
      const j = await res.json();
      setCart(j);
    } catch {
      toast("error", "Impossible de charger votre panier");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function remove(item: CartItem) {
    setRemoving(item.id);
    try {
      const isGuest = cart?.guest;
      const v = itemView(item);
      let url = `/api/formations/apprenant/cart?id=${encodeURIComponent(item.id)}`;
      if (isGuest) {
        url = item.productId
          ? `/api/formations/apprenant/cart?productId=${encodeURIComponent(item.productId)}`
          : `/api/formations/apprenant/cart?formationId=${encodeURIComponent(item.formationId ?? "")}`;
      }
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        toast("error", j.error || "Erreur");
        return;
      }
      trackEvents.removeFromCart({
        id: item.productId ?? item.formationId ?? item.id,
        kind: v.isProduct ? "product" : "formation",
        price: v.price,
      });
      window.dispatchEvent(new CustomEvent("nk:cart-change"));
      load();
    } finally { setRemoving(null); }
  }

  const isEmpty = !loading && (cart?.count ?? 0) === 0;
  const items = cart?.data ?? [];

  return (
    <div className={`nka ${sora.variable} min-h-[calc(100vh-100px)] bg-[#f7f9fb]`}>
      <div className="nka-hero mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-8 md:py-12">
        <div className="mb-8">
          <div className="mb-6">
            <Link href="/explorer" className="nka-back">
              <ArrowLeft aria-hidden="true" />
              Continuer mes achats
            </Link>
          </div>
          <p className="nka-eyebrow">Panier</p>
          <h1 className="nka-h1 mt-3">
            Mon panier
          </h1>
          {!loading && cart && (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#5c6b62]">
              <span>
                <strong className="nka-num text-[#0e1512]">{cart.count}</strong> article{cart.count > 1 ? "s" : ""}
              </span>
              {cart.guest && <span className="nka-chip nka-chip--amber">Panier invité</span>}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_320px]" aria-hidden="true">
            <div className="space-y-3">
              {[0, 1].map((i) => <div key={i} className="nka-skel h-28 !rounded-3xl" />)}
            </div>
            <div className="nka-skel h-56 !rounded-3xl" />
          </div>
        ) : isEmpty ? (
          <div className="nka-bezel nka-bezel--float mx-auto max-w-2xl">
            <div className="nka-bezel__core px-6 py-12 text-center md:px-14 md:py-16">
              <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-[#f0f6f2] text-[#006e2f] shadow-[inset_0_0_0_1px_rgba(0,110,47,0.12)]">
                <ShoppingCart size={34} aria-hidden="true" />
              </div>
              <h2 className="nka-h1 nka-h1--sm">Votre panier est vide</h2>
              <p className="nka-lead mx-auto mt-2 max-w-md">
                Parcourez notre catalogue pour ajouter des formations et produits qui vous inspirent.
              </p>
              <Link
                href="/explorer"
                className="nka-btn nka-btn--primary mt-7"
              >
                <span className="nka-btn__label">Explorer le catalogue</span>
                <span className="nka-btn__ico" aria-hidden="true">
                  <ArrowRight strokeWidth={2.2} />
                </span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            {/* Items */}
            <ul className="min-w-0 space-y-3">
              {items.map((item) => {
                const v = itemView(item);
                return (
                <li key={item.id} className="nka-bezel">
                  <div className="nka-bezel__core flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
                    <div className="nka-thumb nka-thumb--lg nka-thumb--soft">
                      {v.thumbnail ? (
                        <Image
                          src={v.thumbnail}
                          alt=""
                          fill
                          sizes="88px"
                          className="object-cover"
                        />
                      ) : (
                        <GraduationCap size={28} aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="nka-line__meta !mt-0">{v.isProduct ? "Produit numérique" : "Formation"}{v.level ? ` · ${v.level}` : ""}</p>
                      <Link
                        href={v.href}
                        className="nka-titlelink mt-1 line-clamp-2 text-sm font-bold leading-snug text-[#0e1512] [overflow-wrap:anywhere]"
                      >
                        {v.title}
                      </Link>
                      <p className="nka-price mt-2 !text-base">
                        {fmtFCFA(v.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => remove(item)}
                      disabled={removing === item.id}
                      className="nka-iconbtn"
                      title="Retirer"
                      aria-label="Retirer du panier"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </li>
                );
              })}
            </ul>

            {/* Summary */}
            <aside className="nka-bezel nka-bezel--float md:sticky md:top-24">
              <div className="nka-bezel__core space-y-5 p-5 sm:p-6">
                <h2 className="nka-h2">Résumé de la commande</h2>
                <div className="nka-rows">
                  <div className="nka-row">
                    <span>Sous-total</span>
                    <span>{fmtFCFA(cart?.total ?? 0)}</span>
                  </div>
                  <div className="nka-row">
                    <span>Frais de plateforme</span>
                    <span>Inclus</span>
                  </div>
                </div>
                <div className="nka-total">
                  <span className="nka-total__label">Total</span>
                  <span className="nka-total__amount">{fmtFCFA(cart?.total ?? 0)}</span>
                </div>
                <Link
                  href="/checkout"
                  className="nka-btn nka-btn--primary nka-btn--block nka-btn--lg"
                >
                  <span className="nka-btn__label">
                    <Lock aria-hidden="true" />
                    Passer au paiement
                  </span>
                  <span className="nka-btn__ico" aria-hidden="true">
                    <ArrowRight strokeWidth={2.2} />
                  </span>
                </Link>
                {cart?.guest && (
                  <p className="text-center text-xs leading-relaxed text-[#5c6b62]">
                    Vous pouvez acheter en tant qu&apos;invité ou <Link href="/connexion?callbackUrl=/panier" className="nka-titlelink font-bold text-[#006e2f] underline underline-offset-2">vous connecter</Link> pour sauvegarder votre panier.
                  </p>
                )}
                <ConfianceAchat
                  className="border-t border-[#e6ece8] pt-5"
                  garanties={[
                    { Icone: ShieldCheck, texte: "Paiement sécurisé (SSL)" },
                    { Icone: RefreshCw, texte: "Accès immédiat après paiement" },
                  ]}
                />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
