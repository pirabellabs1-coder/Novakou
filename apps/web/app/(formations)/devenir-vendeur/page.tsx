"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Store,
  Link2,
  Wallet,
  Rocket,
  BadgeCheck,
  ArrowRight,
  Loader2,
  Check,
} from "lucide-react";
import { useToastStore } from "@/store/toast";

const BENEFITS = [
  { icon: Store, title: "Votre boutique en ligne", desc: "Une vitrine prête à l'emploi, à votre nom, avec votre domaine possible." },
  { icon: Link2, title: "Liens de paiement", desc: "Encaissez n'importe quel montant et collez le lien sur votre site ou app." },
  { icon: Wallet, title: "Retraits Mobile Money", desc: "Recevez vos gains sur Orange, MTN, Moov, Wave et virement." },
  { icon: Rocket, title: "Vendez sans limite", desc: "Formations, ebooks, produits numériques, coaching — tout est possible." },
];

export default function DevenirVendeurPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const toast = useToastStore.getState().addToast;
  const [loading, setLoading] = useState(false);

  const role = (session?.user as { formationsRole?: string } | undefined)?.formationsRole;
  const isVendor = role === "instructeur";

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/formations/devenir-vendeur", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast("error", json.error ?? "Une erreur est survenue.");
        setLoading(false);
        return;
      }
      // Rafraîchit le formationsRole du JWT (→ instructeur) avant de rediriger,
      // sinon le RoleGuard de /vendeur renverrait vers l'espace apprenant.
      await update();
      toast("success", "Bienvenue parmi les vendeurs ! 🎉");
      router.push("/vendeur/dashboard");
      router.refresh();
    } catch {
      toast("error", "Connexion impossible. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-10 md:py-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#006e2f] bg-[#006e2f]/10 px-3 py-1.5 rounded-full">
          <BadgeCheck size={14} />
          Gratuit · sans engagement
        </span>
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#111827] tracking-tight mt-4">
          Vendez et encaissez sur Novakou
        </h1>
        <p className="text-base md:text-lg text-[#5c647a] mt-4 leading-relaxed">
          Activez votre compte vendeur en un clic et commencez à recevoir des paiements
          sans aucune restriction : produits, formations et liens de paiement.
        </p>
      </div>

      {/* Benefits grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
        {BENEFITS.map((b) => (
          <div
            key={b.title}
            className="flex items-start gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
              <b.icon size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-[#111827] text-sm">{b.title}</h3>
              <p className="text-[13px] text-[#5c647a] mt-1 leading-relaxed">{b.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA card */}
      <div className="mt-10 bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-8 md:p-10 text-center">
        {status === "loading" ? (
          <div className="h-12 w-56 bg-slate-100 rounded-xl animate-pulse mx-auto" />
        ) : !session ? (
          <>
            <p className="text-[#111827] font-bold text-lg">Connectez-vous pour continuer</p>
            <p className="text-sm text-[#5c647a] mt-1.5 mb-6">
              Créez un compte ou connectez-vous, puis activez votre statut vendeur.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/inscription?role=vendeur" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
                Créer un compte vendeur
                <ArrowRight size={16} />
              </Link>
              <Link href="/connexion?next=/devenir-vendeur" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 text-slate-800 text-sm font-bold hover:bg-slate-200 transition-colors">
                Se connecter
              </Link>
            </div>
          </>
        ) : isVendor ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Check size={28} strokeWidth={3} />
            </div>
            <p className="text-[#111827] font-bold text-lg">Vous êtes déjà vendeur</p>
            <p className="text-sm text-[#5c647a] mt-1.5 mb-6">Votre espace vendeur est actif.</p>
            <Link href="/vendeur/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity" style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}>
              Aller à mon espace vendeur
              <ArrowRight size={16} />
            </Link>
          </>
        ) : (
          <>
            <p className="text-[#111827] font-bold text-lg">Prêt·e à vendre ?</p>
            <p className="text-sm text-[#5c647a] mt-1.5 mb-6">
              Activation immédiate. Vous gardez votre compte actuel et accédez en plus à l&apos;espace vendeur.
            </p>
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "linear-gradient(to right, #006e2f, #22c55e)" }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
              {loading ? "Activation…" : "Devenir vendeur maintenant"}
            </button>
            <p className="text-[11px] text-slate-400 mt-4">
              Commission de 10 % uniquement sur vos ventes. Aucun frais fixe.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
