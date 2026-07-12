"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Loader2, Lock } from "lucide-react";
import AdaptiveImage from "@/components/formations/AdaptiveImage";
import { PixelInjector, type Pixel } from "@/components/formations/PixelInjector";
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

export default function PayerClient({ link, pixels = [] }: { link: Link; pixels?: Array<{ type: string; pixelId: string }> }) {
  const { data: session } = useSession();
  const toast = useToastStore.getState().addToast;
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [amount, setAmount] = useState(link.price > 0 ? String(link.price) : "");
  const [loading, setLoading] = useState(false);

  const themeColor = "#006e2f";

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    const isLoggedIn = !!session?.user?.id;
    if (!isLoggedIn && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      toast("error", "Entrez une adresse e-mail valide.");
      return;
    }
    let customAmount: number | undefined;
    if (link.allowCustomAmount) {
      const amt = Math.round(Number(amount));
      if (!Number.isFinite(amt) || amt < 100) {
        toast("error", "Le montant doit être d'au moins 100 FCFA.");
        return;
      }
      customAmount = amt;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/formations/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: [link.id],
          ...(isLoggedIn ? {} : { guestEmail: email.trim(), guestName: name.trim() || undefined }),
          ...(customAmount !== undefined ? { customAmount } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", json.error ?? "Le paiement n'a pas pu démarrer.");
        setLoading(false);
        return;
      }
      const url = json.data?.checkout_url ?? json.checkout_url;
      if (!url) {
        toast("error", "Réponse de paiement invalide.");
        setLoading(false);
        return;
      }
      // Redirection DIRECTE vers la page de paiement Moneroo (ou retour interne
      // si commande gratuite).
      window.location.href = url;
    } catch {
      toast("error", "Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  if (!link.active) {
    return (
      <div className="max-w-md mx-auto px-5 py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
          <Lock size={26} />
        </div>
        <h1 className="text-xl font-extrabold text-[#111827]">Lien indisponible</h1>
        <p className="text-sm text-[#5c647a] mt-2">Ce lien de paiement a été mis en pause par son propriétaire.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-8 md:py-12">
      {/* Pixels du vendeur (FB/Google/TikTok) — event ViewContent pour le suivi des pubs. */}
      <PixelInjector pixels={pixels as Pixel[]} event={{ name: "ViewContent", value: link.price, currency: "XOF" }} />
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Visuel */}
        {link.thumbnail && (
          <div className="relative aspect-[16/9] bg-slate-100">
            <AdaptiveImage src={link.thumbnail} alt={link.title} />
          </div>
        )}
        <div className="p-6 md:p-8">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: themeColor, background: `${themeColor}12` }}>
            <ShieldCheck size={13} /> Paiement sécurisé
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#111827] mt-3">{link.title}</h1>
          {link.description && (
            <p className="text-sm text-[#5c647a] mt-2 leading-relaxed whitespace-pre-line">{link.description}</p>
          )}

          <form onSubmit={handlePay} className="mt-6 space-y-4">
            {/* Montant */}
            {link.allowCustomAmount ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Montant à payer (FCFA)</label>
                <input
                  type="number" min={100} value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="Entrez le montant"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-lg font-bold focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                />
                <p className="text-[11px] text-slate-400 mt-1">Vous choisissez le montant (minimum 100 FCFA).</p>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#5c647a]">Montant</span>
                <span className="text-2xl font-extrabold" style={{ color: themeColor }}>{fmt(link.price)} FCFA</span>
              </div>
            )}

            {/* Email (masqué si connecté) */}
            {!session?.user?.id && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Votre e-mail</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    placeholder="vous@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#5c647a] mb-1.5">Votre nom (optionnel)</label>
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Nom complet"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-[#006e2f] focus:ring-2 focus:ring-[#006e2f]/10"
                  />
                </div>
              </>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
              {loading ? "Redirection…" : link.allowCustomAmount ? "Payer maintenant" : `Payer ${fmt(link.price)} FCFA`}
            </button>
            <p className="text-[11px] text-center text-slate-400">
              Paiement par carte, Mobile Money (Orange, MTN, Moov, Wave) via Moneroo.
            </p>
          </form>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-400 mt-5">
        Propulsé par <a href="https://novakou.com" className="font-semibold text-emerald-700">Novakou</a>
      </p>
    </div>
  );
}
