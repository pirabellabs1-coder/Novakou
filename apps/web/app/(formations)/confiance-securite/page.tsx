import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  BadgeCheck,
  Wallet,
  Scale,
  RefreshCcw,
  FileLock2,
  AlertTriangle,
  Fingerprint,
  Server,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Confiance & sécurité — Novakou",
  description:
    "Comment Novakou protège acheteurs et vendeurs : paiement séquestré (escrow), vérification d'identité (KYC), chiffrement, protection des contenus, gestion des litiges, lutte anti-fraude et conformité RGPD.",
  alternates: { canonical: "/confiance-securite" },
  openGraph: {
    title: "Confiance & sécurité — Novakou",
    description:
      "Paiement séquestré, KYC, chiffrement, protection acheteur/vendeur et gestion des litiges. La sécurité au cœur de Novakou.",
    url: "/confiance-securite",
    type: "website",
  },
};


const PILLARS = [
  { Icon: Wallet, title: "Paiement séquestré (escrow)", desc: "À chaque commande, les fonds sont sécurisés puis libérés au vendeur seulement une fois la vente confirmée. En cas de litige, ils sont gelés jusqu'au verdict." },
  { Icon: Fingerprint, title: "Vendeurs vérifiés (KYC)", desc: "Les vendeurs et mentors passent une vérification d'identité avant de publier des offres payantes et de retirer des fonds — un rempart contre la fraude." },
  { Icon: Lock, title: "Paiements chiffrés", desc: "Les paiements sont traités par Moneroo et Stripe. Vos données bancaires ne transitent jamais en clair et Novakou n'a jamais accès à votre numéro de carte." },
  { Icon: RefreshCcw, title: "Protection de l'acheteur", desc: "Politique de remboursement claire, validation à la livraison et possibilité d'ouvrir un litige si la prestation n'est pas conforme." },
  { Icon: BadgeCheck, title: "Protection du vendeur", desc: "Vos gains sont sécurisés et versés sur votre solde, avec un délai de sécurité anti-fraude avant retrait vers Mobile Money ou virement." },
  { Icon: FileLock2, title: "Contenus protégés", desc: "Vidéos et documents sont hébergés de façon sécurisée et protégés contre le téléchargement et le partage non autorisé." },
];

const SECURITY_TECH = [
  { Icon: Server, title: "Hébergement UE", desc: "Base de données et fichiers hébergés dans l'Union européenne (Supabase, Francfort), avec contrôle d'accès par rôle (Row Level Security)." },
  { Icon: Lock, title: "Chiffrement", desc: "Données chiffrées en transit (TLS) et mots de passe hachés (bcrypt). Double authentification disponible sur votre compte." },
  { Icon: AlertTriangle, title: "Surveillance & anti-fraude", desc: "Journalisation des accès sensibles, alertes de connexion inhabituelle et détection des comportements frauduleux." },
];

const FAQ = [
  { q: "Que se passe-t-il si je paie et ne reçois pas mon produit ?", a: "Le paiement est séquestré. Si la prestation n'est pas livrée ou n'est pas conforme, vous pouvez ouvrir un litige : les fonds restent gelés jusqu'à la résolution par notre équipe, sur la base des éléments fournis par les deux parties." },
  { q: "Mes informations bancaires sont-elles en sécurité ?", a: "Oui. Les paiements sont traités directement par nos prestataires certifiés (Moneroo, Stripe). Novakou ne stocke jamais vos numéros de carte." },
  { q: "Comment savoir qu'un vendeur est fiable ?", a: "Les vendeurs qui vendent des contenus payants et retirent des fonds sont vérifiés (KYC). Vous pouvez aussi consulter les avis vérifiés laissés par de vrais acheteurs." },
  { q: "Mes contenus de formation peuvent-ils être piratés ?", a: "Nous appliquons des protections contre le téléchargement direct des vidéos et documents, et l'accès est réservé aux acheteurs authentifiés." },
];

export default function ConfianceSecuritePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      {/* HERO */}
      <section className="py-14 px-6" style={{ background: "linear-gradient(135deg, #003d1a 0%, #006e2f 55%, #22c55e 100%)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 text-white/90 text-xs font-bold uppercase tracking-widest bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} /> Confiance &amp; sécurité
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mt-4 tracking-tight">
            Achetez et vendez en toute sérénité
          </h1>
          <p className="text-white/85 text-base md:text-lg mt-4 max-w-2xl mx-auto leading-relaxed">
            Paiement séquestré, vendeurs vérifiés, chiffrement et gestion des litiges : la sécurité est au cœur de
            chaque transaction sur Novakou.
          </p>
        </div>
      </section>

      {/* PILIERS */}
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-4" style={{ background: "linear-gradient(135deg, #006e2f, #22c55e)" }}>
                <p.Icon size={20} />
              </div>
              <h2 className="font-extrabold text-[#191c1e] text-base">{p.title}</h2>
              <p className="text-sm text-[#5c647a] mt-1.5 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FLUX ESCROW */}
      <section className="max-w-4xl mx-auto px-6 pb-12 md:pb-16">
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-5">
            <Scale size={20} className="text-[#006e2f]" />
            <h2 className="text-xl font-extrabold text-[#191c1e]">Comment le séquestre protège votre argent</h2>
          </div>
          <ol className="space-y-4">
            {[
              ["Le client paie", "Les fonds sont immédiatement sécurisés par la Plateforme — ni le vendeur ni l'acheteur ne peut les manipuler."],
              ["Le contenu est livré", "Le produit numérique est mis à disposition ou la séance de mentorat est réalisée."],
              ["La vente est confirmée", "Les fonds sont libérés sur le solde du vendeur, qui peut ensuite les retirer après le délai de sécurité."],
              ["En cas de litige", "Les fonds sont gelés jusqu'au verdict de notre équipe, rendu sur la base des preuves des deux parties."],
            ].map(([t, d], i) => (
              <li key={i} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#006e2f]/10 text-[#006e2f] font-extrabold text-sm flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-bold text-[#191c1e] text-sm">{t}</p>
                  <p className="text-sm text-[#5c647a] mt-0.5">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SÉCURITÉ TECHNIQUE */}
      <section className="max-w-5xl mx-auto px-6 pb-12 md:pb-16">
        <h2 className="text-xl font-extrabold text-[#191c1e] mb-5 text-center">Une sécurité technique de bout en bout</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SECURITY_TECH.map((s) => (
            <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
              <div className="w-11 h-11 rounded-xl bg-[#006e2f]/10 text-[#006e2f] flex items-center justify-center mx-auto mb-3">
                <s.Icon size={20} />
              </div>
              <h3 className="font-bold text-[#191c1e] text-sm">{s.title}</h3>
              <p className="text-[13px] text-[#5c647a] mt-1.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-12 md:pb-16">
        <h2 className="text-xl font-extrabold text-[#191c1e] mb-5 text-center">Questions fréquentes</h2>
        <div className="space-y-3">
          {FAQ.map((f, i) => (
            <details key={i} className="group bg-white rounded-xl border border-gray-100 p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between cursor-pointer font-semibold text-[#191c1e] text-sm gap-3">
                {f.q}
                <span className="text-[#006e2f] transition group-open:rotate-45 text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-[#5c647a] mt-3 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA / CONTACT */}
      <section className="max-w-3xl mx-auto px-6 pb-16">
        <div className="rounded-2xl p-8 text-center text-white" style={{ background: "linear-gradient(135deg, #003d1a, #006e2f)" }}>
          <h2 className="text-xl font-extrabold">Un doute, un problème à signaler ?</h2>
          <p className="text-white/80 text-sm mt-2 max-w-lg mx-auto">
            Notre équipe traite chaque signalement rapidement. Écrivez-nous à <strong>support@novakou.com</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#006e2f] text-sm font-bold hover:opacity-90 transition-opacity">
              Nous contacter
            </Link>
            <Link href="/confidentialite" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 transition-colors">
              Confidentialité (RGPD)
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-[#8a968e] mt-5">
          Voir aussi : <Link href="/cgu" className="text-[#006e2f] font-semibold underline">CGU</Link>,
          {" "}<Link href="/mentions-legales" className="text-[#006e2f] font-semibold underline">mentions légales</Link>,
          {" "}<Link href="/cookies" className="text-[#006e2f] font-semibold underline">cookies</Link>.
        </p>
      </section>
    </div>
  );
}
